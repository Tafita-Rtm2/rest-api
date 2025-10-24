const axios = require("axios");

module.exports = {
  meta: {
    name: "X Downloader",
    version: "1.0.0",
    description: "Download X videos",
    author: "RTM",
    path: "/xdl?url=",
    method: "get",
    category: "downloader"
  },
  onStart: async function({ req, res }) {
    const xUrl = req.query.url;
    
    if (!xUrl) {
      return res.status(400).json({ error: "X URL is required" });
    }
    
    try {
      const response = await axios.post('https://api.x-downloader.com/request', {
        url: xUrl,
        type: ".mp4"
      }, {
        headers: {
          'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
          'sec-ch-ua-platform': '"Android"',
          'Referer': 'https://x-downloader.com/',
          'sec-ch-ua-mobile': '?1',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
          'Content-Type': 'application/json'
        }
      });
      
      const data = response.data;
      const videoUrl = `https://${data.host}/${data.filename}`;
      const thumbnail = `https://${data.host}/${data.thumbnail}`;
      
      const tinyUrlResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(videoUrl)}`);
      const tinyThumbResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(thumbnail)}`);
      
      
      const title = data.title;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(tinyUrlResponse.data)}&title=${encodeURIComponent(title)}`;

      res.json({
        success: true,
        title: data.title,
        description: data.description,
        url: proxyUrl,
        thumbnail: tinyThumbResponse.data
      });
      
    } catch (error) {
      res.status(500).json({
        error: "Server error",
        message: error.message
      });
    }
  }
};