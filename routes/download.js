const express = require('express');
const router = express.Router();
const ytdl = require('ytdl-core');

router.get('/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    try {
        console.log(`Fetching real info for: ${url}`);

        let title = 'Downloaded Video';
        let thumbnail = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800';
        let formats = [
            { format_id: 'best', extension: 'mp4', resolution: '1080p (Best)', type: 'video' },
            { format_id: '720p', extension: 'mp4', resolution: '720p', type: 'video' },
            { format_id: '480p', extension: 'mp4', resolution: '480p', type: 'video' },
            { format_id: 'audio', extension: 'mp3', resolution: 'High Quality', type: 'audio' }
        ];

        if (ytdl.validateURL(url)) {
            const info = await ytdl.getInfo(url);
            title = info.videoDetails.title;
            thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;
        } else if (url.includes('instagram.com')) {
            title = 'Instagram Post/Reel';
            thumbnail = 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800';
        }

        res.json({ title, thumbnail, formats });
    } catch (err) {
        console.error('YTDL Error:', err);
        res.status(500).json({ message: 'Error fetching video info: ' + err.message });
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
