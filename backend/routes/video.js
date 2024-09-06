const express = require('express');
const jwt = require('jsonwebtoken'); // Import the jwt library
require('dotenv').config();
const {
  getTop3,
  rateVideo,
  getVideoInfo,
  addToQueue
} = require('../controllers/videoController');

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

router.get('/top3', getTop3);
router.post('/rate-video', rateVideo);
router.get('/video-info', getVideoInfo);
router.post('/add-queue', addToQueue)

module.exports = router;

function getUserIdFromToken(token) {
  if (!token) throw new Error('Token is missing');
  
  const tokenParts = token.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    throw new Error('Invalid token format');
  }

  const decoded = jwt.verify(tokenParts[1], jwtSecret);
  return decoded.userId;
}