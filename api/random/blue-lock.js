const axios = require("axios");

module.exports = {
	meta: {
		name: "Blue lock Edit",
		version: "1.0.0",
		description: "Get random Blue lock TikTok videos",
		author: "RTM",
		path: "/blue-lock",
		method: "get",
		category: "random"
	},
	onStart: async function({ req, res }) {
		try {
			const searchQuery = "Blue lock Edit";
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