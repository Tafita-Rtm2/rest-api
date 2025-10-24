const axios = require("axios");

module.exports = {
  meta: {
    name: "YouTube Downloader V2",
    version: "1.0.0",
    description: "Download YouTube videos",
    author: "RTM",
    path: "/ytdl-v2?url=",
    method: "get",
    category: "downloader"
  },
  onStart: async function({ req, res }) {
    const youtubeUrl = req.query.url;
    if (!youtubeUrl) return res.status(400).json({ error: "YouTube URL is required" });
    
    const apiUrl = `https://p.oceansaver.in/ajax/download.php?copyright=0&format=720&url=${encodeURIComponent(youtubeUrl)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;
    
    try {
      const response = await axios.get(apiUrl);
      
      if (response.data.progress_url) {
        const progressResponse = await axios.get(response.data.progress_url);
        if (progressResponse.data.download_url) {
          const title = response.data.title;
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(progressResponse.data.download_url)}&title=${encodeURIComponent(title)}`;
          return res.json({
            title: title,
            thumbnail: response.data.info.image,
            url: proxyUrl
          });
        }
      }
      
      if (response.data.download_url) {
        const title = response.data.info.title;
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(response.data.download_url)}&title=${encodeURIComponent(title)}`;
        return res.json({
          title: title,
          thumbnail: response.data.info.image,
          url: proxyUrl
        });
      }
    } catch (error) {
      res.json({ error: error.message });
    }
  }
};