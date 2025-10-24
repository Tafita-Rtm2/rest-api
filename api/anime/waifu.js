const axios = require("axios");

const meta = {
    name: "waifu",
    version: "1.0.0",
    author: "RTM",
    description: "Get random waifu images",
    method: "get",
    category: "anime",
    path: "/waifu"
};

async function onStart({ res, req }) {
    try {
        const response = await axios.get("https://api.waifu.pics/sfw/waifu");
        const imageUrl = response.data.url;
        const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
        
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(imageResponse.data);
    } catch (error) {
        res.json({
            status: false,
            error: error.message
        });
    }
}

module.exports = { meta, onStart };
