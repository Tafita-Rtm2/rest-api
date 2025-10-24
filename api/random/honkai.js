const axios = require("axios");

module.exports = {
  meta: {
    name: "Honkai Edit",
    version: "1.0.0",
    description: "Get random Honkai StartRail TikTok videos",
    author: "RTM",
    path: "/honkai",
    method: "get",
    category: "random"
  },
  onStart: async function({ req, res }) {
    try {
      const searchQuery = "Honkai StartRail Edit";
      const searchUrl = `https://tikwm.com/api/feed/search?keywords=${encodeURIComponent(searchQuery)}`;
      
      const response = await axios.get(searchUrl);
      const videos = response.data.data.videos;
      
      if (!videos || videos.length === 0) {
        return res.json({ error: "No videos found" });
      }
      
      const shuffledVideos = videos.sort(() => Math.random() - 0.5);
      const randomVideo = shuffledVideos[Math.floor(Math.random() * shuffledVideos.length)];
      
      res.json({
        video_url: randomVideo.play,
        title: randomVideo.title,
        duration: randomVideo.duration,
        author: randomVideo.author,
        music: randomVideo.music_info ? randomVideo.music_info.title : "No music",
        thumbnail: randomVideo.cover
      });
      
    } catch (error) {
      res.json({
        error: "Server error"
      });
    }
  }
};