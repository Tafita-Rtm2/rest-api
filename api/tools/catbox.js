const axios = require('axios');
const FormData = require('form-data');

const meta = {
  name: "Catbox Uploader",
  version: "1.0.0",
  description: "Upload files to Catbox.moe",
  author: "RTM",
  method: "get",
  category: "tools",
  path: "/catbox?file_link="
};

async function onStart({ res, req }) {
  try {
    const fileLink = req.query.file_link;
    if (!fileLink) return res.json({ error: "file_link parameter is required" });
    
    const form = new FormData();
    form.append('reqtype', 'urlupload');
    form.append('url', fileLink);
    
    const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders()
    });
    
    if (!data.startsWith('http')) return res.json({ error: "Failed to upload file" });
    
    return res.json({
      url: data
    });
  } catch (error) {
    return res.json({ error: error.message });
  }
}

module.exports = { meta, onStart };