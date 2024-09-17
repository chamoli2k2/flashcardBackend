import express from 'express';
import { registerUser, getUserProfile, login, logout, updateUsername, updatePassword, updatePhoto, deleteUser } from '../controllers/userController.js';
import { generateAndSendOtp, verifyOtp } from '../middleware/verifyOtpMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadSingleImage } from '../middleware/uploadPhotoMiddleware.js';

const router = express.Router();

// Register route
router.post('/register', registerUser);

// Get user profile route
router.get('/profile', protect, getUserProfile);

// Login route
router.post('/login', login);

// Logout route
router.post('/logout', protect, logout);

// Generate opt
router.post('/generate-otp', generateAndSendOtp);

// Update username route (with OTP verification)
router.put('/update-username', protect, verifyOtp, updateUsername);

// Update password route (with OTP verification)
router.put('/update-password', protect, verifyOtp, updatePassword);

// Update user photo route
router.put('/update-photo', protect, uploadSingleImage, updatePhoto);

// Delete user route
router.put('/delete-account', protect, verifyOtp, deleteUser);


export default router;
