import { storage, upload } from "../config/multer.js";

// Middleware to handle single image upload
const uploadSingleImage = upload.single('image'); // Expecting the 'image' field in form-data

export { uploadSingleImage };