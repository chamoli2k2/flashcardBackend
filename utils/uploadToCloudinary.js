import cloudinary from "../config/cloudinary.js";
import { PassThrough } from 'stream';

const uploadAudioVideoToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadParams = {
            resource_type: 'video', // Use 'video' for audio files
        };

        const stream = cloudinary.v2.uploader.upload_stream(uploadParams, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result.secure_url);
        });

        const passThroughStream = new PassThrough();
        passThroughStream.end(file.buffer);
        passThroughStream.pipe(stream);
    });
};




// Helper function to upload an image to Cloudinary
const uploadImageToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadParams = {
            resource_type: 'image',
        };

        const stream = cloudinary.v2.uploader.upload_stream(uploadParams, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result.secure_url);
        });

        const passThroughStream = new PassThrough();
        passThroughStream.end(file.buffer);
        passThroughStream.pipe(stream);
    });
};


export { uploadAudioVideoToCloudinary, uploadImageToCloudinary };
