const express = require('express');
const router = express.Router();
const ytdl = require('@distube/ytdl-core');

router.get('/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    try {
        console.log(`Fetching real info for: ${url}`);
        if (!ytdl.validateURL(url)) {
            console.log('Invalid URL provided');
            return res.status(400).json({ message: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        console.log('Video Info Fetched:', info.videoDetails.title);

        let title = info.videoDetails.title;
        let thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;
        let formats = [
            { format_id: 'best', extension: 'mp4', resolution: '1080p (Best)', type: 'video' },
            { format_id: '720p', extension: 'mp4', resolution: '720p', type: 'video' },
            { format_id: '480p', extension: 'mp4', resolution: '480p', type: 'video' },
            { format_id: 'audio', extension: 'mp3', resolution: 'High Quality', type: 'audio' }
        ];

        res.json({ title, thumbnail, formats });
    } catch (err) {
        console.error('SERVER ERROR (Info):', err.message);
        console.error(err.stack);
        res.status(500).json({
            message: 'Error fetching video info',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

router.get('/stream', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    try {
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ message: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\x00-\x7F]/g, "");

        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
        ytdl(url, { quality: 'highest' }).pipe(res);
    } catch (err) {
        console.error('Streaming Error:', err);
        res.status(500).json({ message: 'Error streaming video: ' + err.message });
    }
});

module.exports = router;
