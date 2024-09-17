import { storage, upload } from "../config/multer.js";


// Middleware to handle file uploads and form data
const uploadFlashcardMedia = upload.fields([
  { name: 'images', maxCount: 5 }, // Allow multiple images
  { name: 'voice', maxCount: 1 }    // Allow a single voice file
]);

// Middleware to process form data and log file details
const processFormData = (req, res, next) => {
  uploadFlashcardMedia(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Ensure text fields are available
    req.body.frontText = req.body.frontText || '';
    req.body.backText = req.body.backText || '';
    req.body.flashcardSetName = req.body.flashcardSetName || '';
    
    next();
  });
};

export { processFormData };
