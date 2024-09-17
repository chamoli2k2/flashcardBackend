import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import generateToken from '../utils/generateToken.js';
import { uploadImageToCloudinary } from '../utils/uploadToCloudinary.js';
import { sendFeedbackEmail } from '../config/nodemailer.js';

// Register User
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        username,
        email,
        password,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// Get User Profile
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {

        const defaultImageURL = "https://img.icons8.com/fluency/48/test-account--v1.png";
        // Use the image field if it exists, otherwise fall back to the default value
        const imageURL = user.image || defaultImageURL;

        res.json({
            _id: user._id,
            name: user.username,
            email: user.email,
            imageURL: imageURL,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// Login a user
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });

        // Setting delete account request to false
        user.deletionRequested = false;
        await user.save();

        res.status(200).json({ token, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout a user
const logout = (req, res) => {
    // Here we simply return a success message as logout is typically handled on the client side by deleting the token
    res.status(200).json({ message: 'Logged out successfully' });
};

// Update username
const updateUsername = async (req, res) => {
    const { newUsername } = req.body;

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

        const existingUser = await User.findOne({ username: newUsername });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username: newUsername },
            { new: true }
        );

        res.status(200).json({ message: 'Username updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update password
const updatePassword = async (req, res) => {
    const { newPassword } = req.body;

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

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's password using the set method
        user.password = newPassword; // Assign new plain-text password

        // The password hashing is handled by the `pre('save')` middleware in the model
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get User Photo and Update
const updatePhoto = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            // Check if a file is provided in the form data
            console.log("console state", req.file);
            if (req.file) {
                // Upload the image to Cloudinary
                const uploadResult = await uploadImageToCloudinary(req.file);

                // Update the user's image URL in the database
                user.image = uploadResult;
                await user.save();

                res.json({
                    _id: user._id,
                    name: user.username,
                    imageURL: uploadResult,
                    message: 'Image updated successfully'
                });
            } else {
                res.status(400).json({ message: 'No image file provided' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete User
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
    
        if (user) {
          if (!user.deletionRequested) {
            sendFeedbackEmail(req.body.feedback, user);
    
            user.deletionRequested = true;
            user.deletionRequestDate = Date.now();
    
            await user.save();
    
            res.json({ message: "Account deletion requested. If you don't log in within 15 days, your account will be deleted." }).status(200);
          } else {
            res.status(400).json({ message: "Deletion already requested." });
          }
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
};


export { registerUser, getUserProfile, login, logout, updateUsername, updatePassword, updatePhoto, deleteUser };