const axios = require('axios');

module.exports = {
  meta: {
    name: "Download Proxy",
    version: "1.0.0",
    description: "Proxies a video URL to force a download.",
    author: "rapido",
    method: "get",
    category: "downloader",
    path: "/proxy"
  },
  onStart: async function({ req, res }) {
    const { url, title } = req.query;

    if (!url) {
      return res.status(400).send("URL is required");
    }

    try {
      const videoResponse = await axios({
        method: 'get',
        url: decodeURIComponent(url),
        responseType: 'stream'
      });

      const safeTitle = title ? decodeURIComponent(title).replace(/[^a-z0-9\s.-]/gi, '_') : 'video';
      res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);

      // Check for content-type and set it if available
      if (videoResponse.headers['content-type']) {
        res.setHeader('Content-Type', videoResponse.headers['content-type']);
      }

      videoResponse.data.pipe(res);

    } catch (error) {
      res.status(500).send(`An error occurred while proxying the video: ${error.message}`);
    }
  }
};