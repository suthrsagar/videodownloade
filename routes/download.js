const express = require('express');
const router = express.Router();
const ytdl = require('@distube/ytdl-core');

router.get('/info', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    try {
        console.log(`Ultimate Attempt for: ${url}`);

        // Use more specific options for fetching info
        // We try to use the 'HTML5' and 'ANDROID' clients which are typically more resilient
        const info = await ytdl.getInfo(url, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive',
                }
            }
        });

        const formats = info.formats
            .filter(f => f.hasVideo && f.hasAudio)
            .map(f => ({
                format_id: f.itag,
                extension: f.container || 'mp4',
                resolution: f.qualityLabel || '360p',
                type: 'video',
                url: f.url
            }));

        const audioFormat = ytdl.filterFormats(info.formats, 'audioonly')[0];
        if (audioFormat) {
            formats.push({
                format_id: audioFormat.itag,
                extension: 'mp3',
                resolution: 'Audio (High)',
                type: 'audio',
                url: audioFormat.url
            });
        }

        res.json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
            formats: formats
        });
    } catch (err) {
        console.error('YouTube Info Error:', err.message);

        // Fallback or more descriptive error
        if (err.message.includes('403') || err.message.includes('sign-in')) {
            return res.status(500).json({
                message: 'YouTube is blocking our server. Please try a different link or try again later.',
                error: err.message
            });
        }

        res.status(500).json({
            message: 'Invalid Link or YouTube Blocked it.',
            error: err.message
        });
    }
});

router.get('/stream', async (req, res) => {
    const { url, itag } = req.query;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    try {
        const title = "video_" + Date.now();
        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);

        ytdl(url, {
            quality: itag || 'highest',
            filter: format => format.container === 'mp4',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                }
            }
        }).pipe(res);
    } catch (err) {
        console.error('Streaming Error:', err);
        res.status(500).json({ message: 'Error streaming video: ' + err.message });
    }
});

module.exports = router;
