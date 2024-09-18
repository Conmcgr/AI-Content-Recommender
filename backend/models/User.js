const mongoose = require('mongoose');
const { VideoSchema } = require('./video');

const defaultEmptyVideo = {
  title: [],
  description: [],
  channel_title: [],
  category: []
};

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  interests: { type: [String] },
  average_video: { type: VideoSchema, default: defaultEmptyVideo},
  total_ratings: { type: Number, default: 0},
  total_videos: { type: Number, default: 0},
  videos_seen: { type: [String], default: [] }
});

module.exports = mongoose.model('User', UserSchema);
