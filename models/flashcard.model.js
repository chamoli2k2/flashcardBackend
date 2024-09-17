import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
    frontText: { 
        type: String, 
        required: true 
    },

    backText: { 
        type: String, 
        required: true 
    },

    images: [{ 
        type: String 
    }],  // Array of URLs to the images

    voice: { 
        type: String 
    },  // URL to the voice recording

    flashcardSet: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'FlashcardSet', 
        required: true 
    },

}, { timestamps: true });

const Flashcard = mongoose.model('Flashcard', flashcardSchema);
export default Flashcard;
