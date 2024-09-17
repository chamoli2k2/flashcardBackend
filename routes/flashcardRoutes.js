import express from 'express';
const router = express.Router();
import { createFlashcard, deleteFlashcard, getFlashcardsInSet } from '../controllers/flashcardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { createFlashcardSet, deleteFlashcardSet, getFlashcardSetsInFolder } from '../controllers/flashcardSetController.js';
import { createFolder, getFoldersByUser } from '../controllers/folderController.js';
import { processFormData } from '../middleware/processFormDataMiddleware.js';

// Route for creating a flashcard inside a flashcard set
router.post('/:folderId/:flashcardSetId/add-flashcard', protect, processFormData, createFlashcard);

// Route for getting flashcard sets inside a folder
router.get('/:folderId/sets', protect, getFlashcardSetsInFolder);

// Route for creating a flashcard set inside a folder
router.post('/:folderId/sets/create', protect, createFlashcardSet);

// Route to create a folder (only accessible to logged-in users)
router.post('/', protect, createFolder);

// Route to fetch all folders of a user
router.get('/fetchallfolder', protect, getFoldersByUser);

// Route to fetch all flashcards in a given flashcard set
router.get('/:folderId/sets/:flashcardSetId/flashcards', protect, getFlashcardsInSet);

// Route to delete the flashcard set with folderId in the URL and flashcardSetId in the query parameter
router.put('/delete-set', protect, deleteFlashcardSet);

// Route to delete the flashcard 
router.put('/delete-flashcard/:folderId/:flashcardSetId/:flashcardId', protect, deleteFlashcard);


export default router;
