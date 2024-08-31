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

// Update user data (username and interests)
exports.updateUserData = async (req, res) => {
  try {
    const userId = req.userId; // Assuming userId is available in the request
    const { username, interests } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username) user.username = username;
    if (interests) user.interests = interests;

    await user.save();

    res.status(200).json({ message: 'User data updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user data' });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.userId; // Assuming userId is available in the request
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
};

// Add interest
exports.addInterest = async (req, res) => {
  try {
    const userId = req.userId; // Assuming userId is available in the request
    const { interest } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.interests.includes(interest)) {
      user.interests.push(interest);
    }

    await user.save();

    res.status(200).json({ message: 'Interest added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add interest' });
  }
};

// Delete interest
exports.deleteInterest = async (req, res) => {
  try {
    const userId = req.userId; // Assuming userId is available in the request
    const { interest } = req.body;

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    user.interests = user.interests.filter(i => i !== interest);

    await user.save();

    res.status(200).json({ message: 'Interest deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete interest' });
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

