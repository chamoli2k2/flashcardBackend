import mongoose from 'mongoose';

// Define the FlashcardSet schema
const flashcardSetSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },

    description: { 
        type: String, 
        default: ''
    },

    folder: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Folder', 
        required: true 
    },
    
    flashcards: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Flashcard' 
        }
    ],

    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },

    createdAt: { 
        type: Date, 
        default: Date.now 
    },

});


// Create the FlashcardSet model
const FlashcardSet = mongoose.model('FlashcardSet', flashcardSetSchema);

export default FlashcardSet;
