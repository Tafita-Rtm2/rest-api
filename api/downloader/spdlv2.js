const axios = require("axios");

module.exports = {
  meta: {
    name: "Spotify Downloader V2",
    version: "1.0.0",
    description: "Download Spotify songs",
    author: "RTM",
    path: "/spdlv2?url=",
    method: "get",
    category: "downloader"
  },
  onStart: async function({ req, res }) {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ 
        success: false,
        error: "Spotify URL is required",
        example: "/spotify-dl?url=https://open.spotify.com/track/5PyDJG7SQRgWXefgexqIge"
      });
    }

    if (!url.includes("open.spotify.com")) {
      return res.status(400).json({
        success: false,
        error: "Invalid Spotify URL",
        message: "Please provide a valid Spotify track URL"
      });
    }

    try {
      const response = await axios.post('https://spotify.downloaderize.com/wp-json/spotify-downloader/v1/fetch', 
        { type: "song", url },
        {
          headers: {
            'authority': 'spotify.downloaderize.com',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://spotify.downloaderize.com',
            'referer': 'https://spotify.downloaderize.com/',
            'sec-ch-ua': '"Chromium";v="137", "Not/A)Brand";v="24"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'x-requested-with': 'XMLHttpRequest'
          }
        }
      );


      const data = response.data.data;
      
      const { title, downloadLink } = data;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(downloadLink)}&title=${encodeURIComponent(title)}`;

      res.json({
        success: true,
        id: data.id,
        artist: data.artist,
        title: data.title,
        album: data.album,
        cover: data.cover,
        releaseDate: data.releaseDate,
        url: proxyUrl
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Server error",
        message: error.message
      });
    }
  }
};