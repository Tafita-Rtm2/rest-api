const axios = require("axios");

module.exports = {
  meta: {
    name: "Universal Downloader",
    version: "1.0.0",
    description: "Universal Downloader for TikTok, Facebook, Instagram, etc.",
    author: "Jr Busaco",
    method: "get",
    path: "/unidl?url=&format=&quality=",
    category: "downloader"
  },
  onStart: async function({ req, res }) {
    const { url: videoUrl, format, quality } = req.query;

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
        if (!format) {
          // If format is not specified, return all available formats
          const availableFormats = data.medias.map(m => ({
            quality: m.quality,
            format: m.ext,
            size: m.formattedSize,
          }));
          return res.json({
            title: data.title,
            thumbnail: data.thumbnail,
            available_formats: availableFormats
          });
        } else {
          // If format is specified, find the desired media
          let desiredMedia;
          const formatLower = format.toLowerCase();
          const mediasOfFormat = data.medias.filter(m => m.ext && m.ext.toLowerCase() === formatLower);

          if (mediasOfFormat.length === 0) {
            const availableExts = [...new Set(data.medias.map(m => m.ext))].join(', ');
            return res.status(404).json({ error: `No media found for format '${format}'. Available formats: ${availableExts}` });
          }

          if (quality) {
            const qualityLower = quality.toLowerCase();
            desiredMedia = mediasOfFormat.find(m => m.quality && m.quality.toLowerCase() === qualityLower);
          } else {
            // Find best available quality if not specified
            desiredMedia = mediasOfFormat.find(m => m.quality === 'hd') || mediasOfFormat.find(m => m.quality === 'sd') || mediasOfFormat[0];
          }

          if (desiredMedia) {
            const downloadUrl = desiredMedia.url;
            const title = `${data.title || "universal_media"}.${desiredMedia.ext}`;
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(downloadUrl)}&title=${encodeURIComponent(title)}`;
            return res.json({
              url: proxyUrl,
              title: data.title,
              thumbnail: data.thumbnail,
              size: desiredMedia.formattedSize,
              quality: desiredMedia.quality,
              format: desiredMedia.ext
            });
          } else {
            const availableQualities = mediasOfFormat.map(m => m.quality).join(', ');
            return res.status(404).json({ error: `No media found for format '${format}' and quality '${quality}'. Available qualities for ${format}: ${availableQualities}` });
          }
        }
      } else {
        res.status(404).json({ error: "No media found in the response from the external API" });
      }
    } catch (error) {
      console.error('Error in Universal Downloader API:', error);
      res.status(500).json({ error: "Internal server error", message: error.message });
    }
  }
};
