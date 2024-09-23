const User = require('../models/User');
const bcrypt = require('bcryptjs');
const video = require('../models/video');
//const model = require('../ml/model.py')

// Get user data
exports.getUserData = async (req, res) => {
  try {
    const userId = req.userId; // Assuming userId is available in the request
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ username: user.username, interests: user.interests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
};

exports.updateUserData = async (req, res) => {
  try {
    const userId = req.userId;
    const { username, interests } = req.body;
    const updateFields = {};

    if (username) updateFields.username = username;
    if (interests) updateFields.interests = interests;

    const result = await User.updateOne(
      { _id: userId },
      { $set: updateFields }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ error: 'User not found or no changes made' });
    }

    const updatedUser = await User.findById(userId);
    res.status(200).json({ 
      message: 'User data updated successfully',
      username: updatedUser.username,
      interests: updatedUser.interests
    });
  } catch (error) {
    console.error('Error in updateUserData:', error);
    res.status(500).json({ error: 'Failed to update user data', details: error.message });
  }
};


// Update password
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await User.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } }
    );

    if (result.nModified === 0) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error in updatePassword:', error);
    res.status(500).json({ error: 'Failed to update password', details: error.message });
  }
};


exports.addInterest = async (req, res) => {
  try {
    const userId = req.userId;
    const { interest } = req.body;
    console.log(`Attempting to add interest: ${interest} for user: ${userId}`);

    const result = await User.updateOne(
      { _id: userId },
      { $addToSet: { interests: interest } }
    );

    if (result.nModified === 0) {
      return res.status(400).json({ error: 'Interest already exists or user not found', interest });
    }

    console.log(`Interest added successfully: ${interest}`);
    
    // Fetch updated interests
    const updatedUser = await User.findById(userId);
    res.status(200).json({ message: 'Interest added successfully', interests: updatedUser.interests });
  } catch (error) {
    console.error('Error in addInterest:', error);
    res.status(500).json({ 
      error: 'Failed to add interest', 
      details: error.message
    });
  }
};


exports.deleteInterest = async (req, res) => {
  try {
    const userId = req.userId;
    const { interest } = req.body;
    console.log(`Attempting to delete interest: ${interest} for user: ${userId}`);

    const result = await User.updateOne(
      { _id: userId },
      { $pull: { interests: interest } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ error: 'Interest not found or user does not exist', interest });
    }

    console.log(`Interest deleted successfully: ${interest}`);
    
    // Fetch updated interests
    const updatedUser = await User.findById(userId);
    res.status(200).json({ message: 'Interest deleted successfully', interests: updatedUser.interests });
  } catch (error) {
    console.error('Error in deleteInterest:', error);
    res.status(500).json({ 
      error: 'Failed to delete interest', 
      details: error.message
    });
  }
};


exports.getUserIdInterestsVideo = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ userId: user._id, interests: user.interests, video: user.average_video});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
};

