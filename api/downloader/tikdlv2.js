const axios = require("axios");

module.exports = {
  meta: {
    name: "TikTok Downloader V2",
    version: "1.0.0",
    description: "Download TikTok videos without watermark",
    author: "RTM",
    path: "/tikdl-v2?url=",
    method: "get",
    category: "downloader"
  },
  onStart: async function({ req, res }) {
    const tiktokUrl = req.query.url;
    
    if (!tiktokUrl) {
      return res.status(400).json({ error: "TikTok URL is required" });
    }
    
    try {
      const response = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`);
      const data = response.data.data;
      
      
      const { title, play } = data;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(play)}&title=${encodeURIComponent(title)}`;

      res.json({
        success: true,
        id: data.id,
        title: data.title,
        duration: data.duration,
        url: proxyUrl,
        wmplay: data.wmplay,
        music: data.music,
        author: data.author,
        thumbnail: data.cover
      });
      
    } catch (error) {
      res.status(500).json({
        error: "Server error",
        message: error.message
      });
    }
  }
};