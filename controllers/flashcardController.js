import Flashcard from '../models/flashcard.model.js';
import FlashcardSet from '../models/flashcardset.model.js';
import asyncHandler from 'express-async-handler';
import { uploadAudioVideoToCloudinary, uploadImageToCloudinary } from '../utils/uploadToCloudinary.js';
import { saveFlashcardToRedis } from '../controllers/redisController.js';
import kafkaController from '../controllers/kafkaController.js'; // Updated import
import redisClient from '../redis/redisConfig.js';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

// Initialize Kafka producer
kafkaController.initProducer().catch(console.error);

// @desc    Create a new flashcard and its set if not exists
// @route   POST /api/flashcards
// @access  Private
const createFlashcard = asyncHandler(async (req, res) => {
    const { frontText, backText } = req.body;
    const { flashcardSetId } = req.params;

    if (!frontText || !backText) {
        res.status(400);
        throw new Error('Please add both front and back text');
    }

    let flashcardSet;
    if (flashcardSetId) {
        flashcardSet = await FlashcardSet.findById(flashcardSetId);
        if (!flashcardSet) {
            res.status(404);
            throw new Error('Flashcard set not found');
        }
    }

    // Create flashcard object with necessary fields
    const flashcardData = {
        _id: null, // Temporary ID for frontend identification  (will be updated later)
        frontText,
        backText,
        flashcardSet: flashcardSet?._id,
        user: req.user._id,
    };

    // Handle image uploads (if any)
    if (req.files && req.files.images) {
        try {
            const imageUploadPromises = req.files.images.map((image) => uploadImageToCloudinary(image, 'image'));
            flashcardData.images = await Promise.all(imageUploadPromises);
        } catch (error) {
            res.status(500);
            throw new Error('Error uploading images to Cloudinary');
        }
    }

    // Handle voice upload (if any)
    if (req.files && req.files.voice) {
        try {
            const voice = req.files.voice[0];
            flashcardData.voice = await uploadAudioVideoToCloudinary(voice, 'video');
        } catch (error) {
            res.status(500);
            throw new Error('Error uploading voice to Cloudinary');
        }
    }

    // Generate temporary UUID for frontend use
    const tempFlashcardId = uuidv4();
    flashcardData._id = tempFlashcardId; // Temporary ID for frontend identification

    // Save the flashcard temporarily in Redis with expiration (e.g., 1 hour)
    const redisKey = `flashcard:set:${flashcardSetId}:flashcard:${tempFlashcardId}`;
    await redisClient.set(redisKey, JSON.stringify(flashcardData), {
        EX: 4000 // Expiration time of (4000 sec) => 1 hour (3600 seconds)
    });

    // Publish flashcard data to Kafka for eventual database storage
    try {
        await kafkaController.sendFlashcardCreation({
            userId: req.user._id,
            flashcardId: tempFlashcardId, // Send the temporary ID to Kafka
            flashcardData,
            status: 'CREATED', // Add status to indicate flashcard is being created
        });
        res.status(201).json({ message: 'Flashcard created and queued for eventual storage', flashcardId: tempFlashcardId });
    } catch (error) {
        res.status(500);
        throw new Error('Error sending flashcard data to Kafka');
    }
});


// @desc    Delete a flashcard by ID
// @route   DELETE /api/flashcards/:flashcardId
// @access  Private
const deleteFlashcard = asyncHandler(async (req, res) => {
    const { flashcardSetId, flashcardId } = req.params;

    // Check if Redis client is already connected
    if (!redisClient.isOpen) {
        await redisClient.connect(); // Connect to Redis
    }

    try {
        let flashcard = null;

        // Check if flashcardId is a valid MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(flashcardId)) {
            // Find flashcard by its ID
            flashcard = await Flashcard.findById(flashcardId);
        } else {
            console.log("Invalid flashcard ID, skipping MongoDB lookup.");
        }

        if (flashcard) {
            // Flashcard exists in the database, so delete it
            await Flashcard.deleteOne({ _id: flashcardId });
            console.log(`Flashcard deleted from DB: ${flashcardId}`);
        } 

        // Whether or not the flashcard was found in MongoDB, check Redis
        const redisKey = `flashcard:set:${flashcardSetId}:flashcard:${flashcardId}`;
        const redisFlashcard = await redisClient.get(redisKey);

        if (redisFlashcard) {
            // Flashcard found in Redis, so delete it
            await redisClient.del(redisKey);
            console.log(`Flashcard removed from Redis: ${flashcardId}`);
        } else {
            // If flashcard was not found in MongoDB or Redis
            if (!flashcard) {
                return res.status(404).json({ message: 'Flashcard not found in DB or Redis' });
            }
        }

        // Queue deletion to Kafka
        await kafkaController.sendFlashcardDeletion({
            userId: req.user._id,
            flashcardId,
            status: 'DELETED', // Add status to indicate flashcard is deleted
        });

        res.status(200).json({ message: 'Flashcard deletion queued' });
    } catch (error) {
        console.error('Error during flashcard deletion:', error);
        res.status(500).json({ message: error.message });
    }
});




// @desc    Get all flashcards in a given flashcard set (from Redis first, fallback to DB)
// @route   GET /api/auth/folders/:folderId/sets/:flashcardSetId/flashcards
// @access  Private
const getFlashcardsInSet = asyncHandler(async (req, res) => {
    const { flashcardSetId } = req.params;

    // Check if Redis client is already connected
    if (!redisClient.isOpen) {
        await redisClient.connect(); // Connect to Redis if not already connected
    }

    // Define the Redis key pattern to match all flashcards in the given set
    const redisPattern = `flashcard:set:${flashcardSetId}:flashcard:*`;

    try {
        // Fetch flashcard keys that match the pattern
        const flashcardKeys = await redisClient.keys(redisPattern);

        if (flashcardKeys.length === 0) {
            console.log('No flashcard keys found in Redis for pattern:', redisPattern);
        }

        // Fetch flashcard data from Redis using mget
        const redisFlashcards = flashcardKeys.length > 0 ? await redisClient.mGet(flashcardKeys) : [];

        // Parse the Redis data (it will be an array of JSON strings)
        const parsedRedisFlashcards = redisFlashcards.map(flashcard => flashcard ? JSON.parse(flashcard) : null).filter(Boolean);

        // Fetch flashcards from the database
        const dbFlashcards = await Flashcard.find({ flashcardSet: flashcardSetId });

        // Combine the flashcards from Redis and the database
        const flashcardsMap = new Map();

        // Add Redis data to map with null check and ensure _id is present
        parsedRedisFlashcards.forEach(fc => {
            if (fc && fc._id) {
                flashcardsMap.set(fc._id.toString(), fc);
            } else {
                console.warn('Redis flashcard does not have _id:', fc);
            }
        });

        // Add DB data to map (no Redis update here) with null check
        dbFlashcards.forEach(fc => {
            if (fc && fc._id) {
                flashcardsMap.set(fc._id.toString(), fc);
            } else {
                console.warn('Database flashcard does not have _id:', fc);
            }
        });

        // Convert map values to array
        const combinedFlashcards = Array.from(flashcardsMap.values());
        if (combinedFlashcards.length > 0) {
            return res.status(200).json(combinedFlashcards);
        } else {
            console.log('No flashcards found in the database or Redis');
            return res.status(404).json({ message: 'No flashcards found in this set' });
        }
    } catch (err) {
        console.error('Error fetching flashcards:', err);
        return res.status(500).json({ message: 'Error fetching flashcards' });
    }
});


export { createFlashcard, deleteFlashcard, getFlashcardsInSet };
