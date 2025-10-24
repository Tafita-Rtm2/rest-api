const axios = require("axios");
const cheerio = require("cheerio");

module.exports = {
  meta: {
    name: "Instagram Downloader",
    version: "1.0.0",
    description: "Download Instagram videos and reels without watermark",
    author: "RTM",
    path: "/igdl?url=",
    method: "get",
    category: "downloader"
  },
  onStart: async function({ req, res }) {
    const instagramUrl = req.query.url;
    
    if (!instagramUrl) {
      return res.status(400).json({ error: "Instagram URL is required" });
    }
    
    const downloadUrl = `https://snapdownloader.com/tools/instagram-reels-downloader/download?url=${encodeURIComponent(instagramUrl)}`;
    
    try {
      const { data: html } = await axios.get(downloadUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      
      const $ = cheerio.load(html);
      
      const videoUrl = $('div.download-item a[href*="cdninstagram.com"]').attr('href');
      const thumbnail = $('div.download-item img').attr('src');
      
      if (!videoUrl) {
        const maxDownloads = $('span.max-downloads-count').text();
       
        return res.status(404).json({ error: "Video not found or private" });
      }
      
      const title = "instagram_video";
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(title)}`;

      res.json({
        success: true,
        url: proxyUrl,
        thumbnail: thumbnail,
        title: title
      });
      
    } catch (error) {
      console.error('Instagram DL error:', error);
      res.status(500).json({
        error: "Server error",
        message: error.message
      });
    }
  }
};