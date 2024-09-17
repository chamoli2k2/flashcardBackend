import redisClient from '../redis/redisConfig.js'; // Assume Redis is correctly configured
import Flashcard from '../models/flashcard.model.js';



// Save flashcard to Redis with expiration
export const saveFlashcardToRedis = async (userId, flashcardId, flashcardData) => {
    const key = `flashcard:${userId}:${flashcardId}`;
    const expirationTime = 4000; // 1h => 3600 sec
    // Check if Redis client is already connected
    if (!redisClient.isOpen) {
        await redisClient.connect(); // Connect to Redis
    }

    try {
        await redisClient.set(key, JSON.stringify(flashcardData), {
            EX: expirationTime, // Set expiration time to 2 hours
        });
        console.log('Flashcard saved to Redis temporarily');
    } catch (err) {
        console.error('Error saving flashcard to Redis:', err);
    }
};

// Remove flashcard from Redis
export const removeFlashcardFromRedis = async (userId, flashcardId) => {
    const key = `flashcard:${userId}:${flashcardId}`;
    // Check if Redis client is already connected
    if (!redisClient.isOpen) {
        await redisClient.connect(); // Connect to Redis
    }
    
    try {
        await redisClient.del(key);
        console.log('Flashcard removed from Redis');
    } catch (err) {
        console.error('Error deleting flashcard from Redis:', err);
    }
};

// Save flashcard to database after processing
export const saveFlashcardToDatabase = async (flashcardData) => {
    try {
        await Flashcard.create(flashcardData);
        console.log('Flashcard saved to database');
    } catch (err) {
        console.error('Error saving flashcard to database:', err);
    }
};
