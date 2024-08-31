const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    title: {type: [Number], required: true},
    description: {type: [Number], required: true},
    channel_title: {type: [Number], required: true},
    category: {type: [Number], required: true}
});

module.exports = {
    VideoSchema,
    Video: mongoose.model('Video', VideoSchema)
};