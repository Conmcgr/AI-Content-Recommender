const axios = require('axios');

exports.getTop3 = async (req, res) => {
    try {
        const userId = req.userId;
        const pythonServiceResponse = await axios.get('http://localhost:5000/api/top3', {
            headers: { userId: userId }
        });
        res.status(200).json({videoIds: pythonServiceResponse.data});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch top 3 videos' });
    }
};

exports.rateVideo = async (req, res) => {
    try {
        const userId = req.userId;
        const { videoId, rating } = req.body;
        await axios.post('http://localhost:5000/api/rate_video', 
            { videoId, rating },
            { headers: { userId: userId } }
        );
        res.status(200).json({ message: 'Video rated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to rate video' });
    }
};

exports.getVideoInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const { videoId } = req.body;
        const pythonServiceResponse = await axios.get('http://localhost:5000/api/video_info', {
            params: { videoId },
            headers: { userId: userId }
        });
        res.status(200).json(pythonServiceResponse.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
};