const axios = require('axios');

exports.getTop3 = async (req, res) => {
    try {
        const userId = req.userId;
        const duration = req.headers.duration;
        const pythonServiceResponse = await axios.get('http://127.0.0.1:5000/api/top3', {
            headers: { 
                userId: userId, 
                duration: duration 
            }
        });
        res.status(200).json({videoIds: pythonServiceResponse.data.top3VideoIds});
    } catch (error) {
        console.error('Error in getTop3:', error.message);
        res.status(500).json({ error: 'Failed to fetch top 3 videos', details: error.message });
    }
};

exports.rateVideo = async (req, res) => {
    try {
        const userId = req.userId;
        const { videoId, rating } = req.body;
        await axios.post('http://127.0.0.1:5000/api/rate_video', 
            {},  // empty body
            { 
                headers: { 
                    userId: userId, 
                    videoId: videoId, 
                    rating: rating 
                } 
            
            }
        );
        res.status(200).json({ message: 'Video rated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to rate video' });
    }
};

exports.getVideoInfo = async (req, res) => {
    const videoId = req.headers.videoid;
    console.log('videoId:', videoId);
    try {
        const userId = req.userId;
        const videoId = req.headers.videoid;
        console.log('videoId:', videoId);
        const pythonServiceResponse = await axios.get('http://127.0.0.1:5000/api/video_info', {
            headers: { userId: userId, videoId: videoId }
        });
        res.status(200).json(pythonServiceResponse.data);
    } catch (error) {
        console.error('Error in getVideoInfo:', error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
};

exports.addToQueue = async (req, res) => {
    try {
        const userId = req.userId;
        const { videoId } = req.body;
        
        if (!userId || !videoId) {
            console.error('Missing userId or videoId');
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const response = await axios.post('http://127.0.0.1:5000/api/add_to_queue', 
            {},
            { headers: { userId: userId, videoId: videoId } }
        );

        console.log('Python service response:', response.data);
        res.status(200).json({ message: 'Video added to queue successfully' });
    } catch (error) {
        console.error('Error in addToQueue:', error.message);
        if (error.response) {
            console.error('Python service response:', error.response.data);
            console.error('Status code:', error.response.status);
        }
        res.status(500).json({ error: 'Failed to add video to queue', details: error.message });
    }
};

exports.getQueue = async (req, res) => {
    try {
        const userId = req.userId;
        const pythonServiceResponse = await axios.get('http://127.0.0.1:5000/api/get_queue', {
            headers: { userId: userId }
        });
        res.status(200).json({queue: pythonServiceResponse.data});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch queue' });
    }
};

exports.removeFromQueue = async (req, res) => {
    try {
        const userId = req.userId;
        const { videoId } = req.body;
        await axios.post('http://127.0.0.1:5000/api/remove_from_queue',
            {},
            { headers: { userId: userId, videoId: videoId} }
        );
        res.status(200).json({ message: 'Video removed from queue successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove video from queue' });
    }
};