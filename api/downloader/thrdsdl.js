const axios = require('axios');

const meta = {
  name: "Threads Downloader",
  version: "1.0.0",
  description: "API to download Threads videos",
  author: "RTM",
  method: "get",
  category: "downloader",
  path: "/threadsdl?url=https://www.threads.net/@username/post/123"
};

async function onStart({ res, req }) {
  try {
    const url = req.query.url;
    if (!url) return res.json({ error: "URL is required" });
    if (!url.includes("threads.net") && !url.includes("threads.com")) return res.json({ error: "Invalid Threads URL" });
    
    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://www.threads-downloader.io/download?url=${encodedUrl}`;
    
    const headers = {
      'authority': 'www.threads-downloader.io',
      'accept': 'application/json',
      'accept-language': 'en-US,en;q=0.9',
      'referer': 'https://www.threads-downloader.io/',
      'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
    };
    
    const { data } = await axios.get(apiUrl, { headers });
    
    if (!data.videoUrl || !data.imgUrl) return res.json({ error: "Failed to fetch video data" });
    
    const title = "threads_video";
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(data.videoUrl)}&title=${encodeURIComponent(title)}`;

    return res.json({
      url: proxyUrl,
      thumbnail: data.imgUrl,
      title: title
    });
  } catch (error) {
    return res.json({ error: error.message });
  }
}

module.exports = { meta, onStart };