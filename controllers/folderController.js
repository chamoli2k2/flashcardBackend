import Folder from '../models/folder.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
const createFolder = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Folder name is required');
  }

  const folder = new Folder({
    name,
    user: req.user._id, // Assuming user is authenticated and available in req.user
  });

  const createdFolder = await folder.save();
  res.status(201).json(createdFolder);
});

// @desc    Get all folders of a user
// @route   GET /api/folders
// @access  Private
const getFoldersByUser = asyncHandler(async (req, res) => {
  const folders = await Folder.find({ user: req.user._id });

  if (!folders || folders.length === 0) {
    res.status(404);
    throw new Error('No folders found for this user');
  }

  res.status(200).json(folders);
});

export { createFolder, getFoldersByUser };
