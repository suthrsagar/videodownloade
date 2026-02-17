const express = require('express');
const router = express.Router();
const ytdl = require('@distube/ytdl-core');

router.get('/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    try {
        console.log(`Fetching info for: ${url}`);
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ message: 'Invalid YouTube URL' });
        }

        let info;
        try {
            info = await ytdl.getInfo(url, {
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                    }
                }
            });
        } catch (ytdlErr) {
            console.error('YTDL Core failed, using fallback:', ytdlErr.message);
            // Fallback for metadata if YouTube is blocking
            return res.json({
                title: 'Video from Link',
                thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800',
                formats: [
                    { format_id: 'best', extension: 'mp4', resolution: '1080p (Best)', type: 'video' },
                    { format_id: '720p', extension: 'mp4', resolution: '720p', type: 'video' },
                    { format_id: 'audio', extension: 'mp3', resolution: 'High Quality', type: 'audio' }
                ],
                isFallback: true
            });
        }

        const title = info.videoDetails.title;
        const thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;
        const formats = [
            { format_id: 'best', extension: 'mp4', resolution: '1080p (Best)', type: 'video' },
            { format_id: '720p', extension: 'mp4', resolution: '720p', type: 'video' },
            { format_id: '480p', extension: 'mp4', resolution: '480p', type: 'video' },
            { format_id: 'audio', extension: 'mp3', resolution: 'High Quality', type: 'audio' }
        ];

        res.json({ title, thumbnail, formats });
    } catch (err) {
        console.error('FATAL SERVER ERROR:', err.message);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
});

router.get('/stream', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    try {
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ message: 'Invalid YouTube URL' });
        }

        res.header('Content-Type', 'video/mp4');
        ytdl(url, {
            quality: 'highest',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        }).pipe(res);
    } catch (err) {
        console.error('Streaming Error:', err);
        res.status(500).json({ message: 'Error streaming video: ' + err.message });
    }
});

module.exports = router;
