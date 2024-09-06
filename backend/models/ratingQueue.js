const mongoose = require('mongoose');
const { VideoSchema } = require('./video');
const { timestamp } = require('rxjs');

const QueueSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    video: { type: VideoSchema, required: true },
    timestamp: { type: Date, default: Date.now },
});

module.exports = {
    QueueSchema,
    ratingQueue: mongoose.model('ratingQueue', QueueSchema)
};