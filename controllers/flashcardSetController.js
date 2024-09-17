import FlashcardSet from '../models/flashcardset.model.js';
import Folder from '../models/folder.model.js';
import Flashcard from '../models/flashcard.model.js';
import asyncHandler from 'express-async-handler';


// @desc    Create a new flashcard set
// @route   POST /api/flashcardsets
// @access  Private
const createFlashcardSet = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const { folderId } = req.params;

  if (!name || !folderId) {
    res.status(400);
    throw new Error('Flashcard set name and folder ID are required');
  }

  // Verify folder exists and belongs to the user
  const folder = await Folder.findById(folderId);
  if (!folder || folder.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Folder not found or unauthorized access');
  }

  const flashcardSet = new FlashcardSet({
    name,
    description,
    folder: folderId,
    createdBy: req.user._id,
  });

  const createdFlashcardSet = await flashcardSet.save();
  res.status(201).json(createdFlashcardSet);
});


// @desc    Fetch all flashcard sets in a specific folder
// @route   GET /api/folders/:folderId/flashcardsets
// @access  Private
const getFlashcardSetsInFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;

  // Verify folder exists and belongs to the user
  const folder = await Folder.findById(folderId);
  if (!folder || folder.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Folder not found or unauthorized access');
  }

  // Fetch flashcard sets that belong to the specified folder
  const flashcardSets = await FlashcardSet.find({ folder: folderId });

  res.status(200).json(flashcardSets);
});


const deleteFlashcardSet = asyncHandler(async (req, res) => {
  const { flashcardSetId } = req.query; // Changed from req.params to req.query to match the frontend

  // Verify flashcard set exists and belongs to the user
  const flashcardSet = await FlashcardSet.findById(flashcardSetId);
  if (!flashcardSet) {
    res.status(401);
    throw new Error('Flashcard set not found or unauthorized access');
  }

  // Delete all flashcards associated with this flashcard set
  await Flashcard.deleteMany({ flashcardSet: flashcardSetId });


  // Delete the flashcard set itself
  await FlashcardSet.findByIdAndDelete(flashcardSetId);

  res.status(200).json({ message: 'Flashcard set and associated flashcards deleted successfully' });
});



export { createFlashcardSet, getFlashcardSetsInFolder, deleteFlashcardSet };
