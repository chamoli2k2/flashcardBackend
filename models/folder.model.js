import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },

    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },


    flashcardSets: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'FlashcardSet' 
        }
    ],

}, { timestamps: true });



const Folder = mongoose.model('Folder', folderSchema);
export default Folder;
