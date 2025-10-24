const YTDlpWrap = require('yt-dlp-wrap');

const meta = {
  name: 'Universal Video Downloader',
  path: '/universal-dl?url=',
  method: 'get',
  category: 'downloader',
  description: 'Downloads videos from any supported platform.'
};

async function onStart({ req, res }) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: "Please provide a 'url' query parameter."
    });
  }

  try {
    const ytDlpWrap = new YTDlpWrap();
    const metadata = await ytDlpWrap.getVideoInfo(url);

    const { title, thumbnail, formats } = metadata;

    // Find a suitable video format (e.g., mp4 with video and audio)
    const video = formats.find(f => f.ext === 'mp4' && f.vcodec !== 'none' && f.acodec !== 'none');

    if (video) {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(video.url)}&title=${encodeURIComponent(title)}`;
      res.json({
        title,
        thumbnail,
        url: proxyUrl
      });
    } else {
      res.status(404).json({
        error: "No suitable video format found."
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}

module.exports = { meta, onStart };
