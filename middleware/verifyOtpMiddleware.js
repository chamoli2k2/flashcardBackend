import User from '../models/user.model.js';
import otpGenerator from 'otp-generator'; // You can use any OTP generation and verification mechanism
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendOtpToUser } from '../config/nodemailer.js';

// Middleware to verify OTP
const verifyOtp = async (req, res, next) => {
    const { otp } = req.body;
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Verify and decode the token to get user information
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Extract the userId from the decoded token
        const userId = decoded.id;
        
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if OTP has expired
        if (!user.otpExpiry || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Compare the OTP
        const isOtpValid = await bcrypt.compare(otp, user.otpHash);
        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP is valid, proceed to the next middleware
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Function to generate and send OTP (this could be called during the reset request)
const generateAndSendOtp = async (req, res) => {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Verify and decode the token to get user information
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Extract the userId from the decoded token
        const userId = decoded.id;

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate OTP and hash it
        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
        const otpHash = await bcrypt.hash(otp, 12);

        // Store the hashed OTP and set expiration time
        user.otpHash = otpHash;
        user.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await user.save();

        // Send OTP to the user (e.g., via email or SMS)
        await sendOtpToUser(user.email, otp); // Sending OTP via email

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export { generateAndSendOtp, verifyOtp };