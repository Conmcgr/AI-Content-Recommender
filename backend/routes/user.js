const express = require('express');
const jwt = require('jsonwebtoken'); // Import the jwt library
require('dotenv').config();
const {
  getUserData,
  updateUserData,
  updatePassword,
  addInterest,
  deleteInterest,
  getUserIdInterestsVideo
} = require('../controllers/userController');

const jwtSecret = process.env.JWT_SECRET;

const router = express.Router();

// Middleware to extract userId from token (assuming token is used for authentication)
const extractUserId = (req, res, next) => {
  // Extract userId from token and set it in req.userId
  try {
    req.userId = getUserIdFromToken(req.headers.authorization);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

router.use(extractUserId);

router.get('/profile', getUserData);
router.put('/profile', updateUserData);
router.post('/update-password', updatePassword);
router.post('/add-interest', addInterest);
router.post('/delete-interest', deleteInterest);
router.get('/id-interests-video', getUserIdInterestsVideo);

module.exports = router;

// Utility function to extract userId from token (this needs proper implementation)
function getUserIdFromToken(token) {
  if (!token) throw new Error('Token is missing');
  
  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    throw new Error('Invalid token format');
  }

  const decoded = jwt.verify(tokenParts[1], jwtSecret); // replace 'your_jwt_secret' with your actual secret
  return decoded.userId;
}
