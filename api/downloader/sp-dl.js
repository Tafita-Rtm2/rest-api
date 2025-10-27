const axios = require('axios');

const meta = {
  name: 'Spotify Downloader',
  path: '/sp-dl?url=',
  method: 'get',
  category: 'downloader',
  description: ''
};

const API_URL = 'https://api.fabdl.com/spotify/get?url=';
const TASK_URL = 'https://api.fabdl.com/spotify/mp3-convert-task/';
const PROGRESS_URL = 'https://api.fabdl.com/spotify/mp3-convert-progress/';
const SPOTIFY_REGEX = /^(https?:\/\/)?(www\.)?open\.spotify\.com\/track\/[a-zA-Z0-9]+/;

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

async function downloadTrack(url) {
  try {
    const response = await axios.get(`${API_URL}${encodeURIComponent(url)}`);
    const result = response.data.result;
    if (!result) return null;

    const tracks = result.type === 'track' ? [result] : result.tracks;
    const processedTracks = [];

    for (const track of tracks) {
      const taskResponse = await axios.get(`${TASK_URL}${result.gid}/${track.id}`);
      const tid = taskResponse.data.result?.tid;

      if (!tid) {
        processedTracks.push({
          name: track.name,
          artists: track.artists,
          duration: formatDuration(track.duration_ms),
          error: 'Task creation failed'
        });
        continue;
      }

      let progressResponse;
      try {
        progressResponse = await axios.get(`${PROGRESS_URL}${tid}`);
      } catch (e) {
        progressResponse = { data: { result: null } };
      }

      const progressResult = progressResponse.data.result;
      const downloadUrl = progressResult && progressResult.status === 3
        ? `https://api.fabdl.com${progressResult.download_url}`
        : null;

      const title = track.name;
      const proxyUrl = downloadUrl ? `/api/proxy?url=${encodeURIComponent(downloadUrl)}&title=${encodeURIComponent(title)}` : null;

      processedTracks.push({
        name: track.name,
        artists: track.artists,
        duration: formatDuration(track.duration_ms),
        download_url: proxyUrl
      });
    }

    return processedTracks;
  } catch (error) {
    return null;
  }
}

async function onStart({ req, res }) {
  const { url } = req.query;

  if (!url || !SPOTIFY_REGEX.test(url)) {
    return res.status(400).json({
      error: 'Valid Spotify track URL required',
      example: '/sp-dl?url=https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl'
    });
  }

  try {
    const trackData = await downloadTrack(url);
    res.json(trackData ? {
      status: true,
      trackData
    } : {
      status: false,
      error: 'No results found'
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: 'Failed to download track'
    });
  }
}

module.exports = { meta, onStart };
