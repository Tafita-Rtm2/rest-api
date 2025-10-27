const axios = require("axios");

module.exports = {
  meta: {
    name: "Universal Downloader",
    version: "1.0.0",
    description: "Universal Downloader for TikTok, Facebook, Instagram, etc.",
    author: "Jr Busaco",
    method: "get",
    path: "/unidl?url=",
    category: "downloader"
  },
  onStart: async function({ req, res }) {
    const videoUrl = req.query.url;

    if (!videoUrl) {
      return res.status(400).json({ error: "Video URL is required" });
    }
    const url = "https://universaldownloader.com/wp-json/aio-dl/video-data/";
    const headers = {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      Referer: "https://universaldownloader.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    };
    const body = `url=${encodeURIComponent(videoUrl)}`;
    try {
      const { data } = await axios.post(url, body, { headers });
      if (data && data.medias && data.medias.length > 0) {
        const video = data.medias.find(m => m.quality === 'hd' || m.quality === 'sd');
        if (video) {
          const videoUrl = video.url;
          const title = data.title || "universal_video";
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(title)}`;
          return res.json({
            url: proxyUrl,
            title: title,
            thumbnail: data.thumbnail,
            duration: video.formattedSize,
            quality: video.quality
          });
        }
      }
      res.status(404).json({ error: "No video found in the response" });
    } catch (error) {
      console.error('Error in Universal Downloader API:', error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  }
};