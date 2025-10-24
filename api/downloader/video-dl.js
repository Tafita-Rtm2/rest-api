const ytdl = require('ytdl-core-discord');

module.exports = {
  meta: {
    name: "Video Downloader",
    version: "1.0.0",
    description: "Download videos from various sources with different quality options.",
    author: "rapido",
    path: "/video-dl",
    method: "get",
    category: "downloader"
  },
  onStart: async function({ req, res }) {
    const videoUrl = req.query.url;
    const quality = req.query.quality ? `${req.query.quality}p` : 'highest';

    if (!videoUrl) {
      return res.status(400).json({ error: "Video URL is required" });
    }

    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    try {
      const info = await ytdl.getInfo(videoUrl);
      const format = ytdl.chooseFormat(info.formats, { quality: quality === 'highest' ? 'highestvideo' : quality });

      if (format) {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(format.url)}&title=${encodeURIComponent(info.videoDetails.title)}`;
        res.json({
          status: true,
          title: info.videoDetails.title,
          thumbnail: info.videoDetails.thumbnails[0].url,
          download_url: proxyUrl
        });
      } else {
        res.status(404).json({ error: `Quality ${quality} not found for this video.` });
      }
    } catch (error) {
      res.status(500).json({ error: "An error occurred while trying to download the video.", message: error.message });
    }
  }
};