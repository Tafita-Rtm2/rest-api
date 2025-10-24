const axios = require('axios');

const meta = {
    name: "Background Remover",
    version: "1.0.0",
    author: "RTM",
    category: "tools",
    method: "GET",
    path: "/remove-background?imageUrl="
};

async function onStart({ res, req }) {
    const { imageUrl } = req.query;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl parameter required" });

    try {
        const response = await axios.post('https://pxpic.com/callAiFunction', {
            imageUrl: imageUrl,
            targetFormat: "png",
            fileOriginalExtension: "jpg",
            needCompress: "no",
            imageQuality: "100",
            compressLevel: "6",
            aiFunction: "removebg",
            upscalingLevel: ""
        }, {
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9',
                'Content-Type': 'application/json',
                'Origin': 'https://pxpic.com',
                'Referer': 'https://pxpic.com/task',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36',
                'Sec-Ch-Ua': '"Not A(Brand";v="8", "Chromium";v="132"',
                'Sec-Ch-Ua-Mobile': '?1',
                'Sec-Ch-Ua-Platform': '"Android"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            }
        });

        res.json({
            result: response.data.resultImageUrl
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Background removal failed",
            details: error.response?.data || error.message
        });
    }
}

module.exports = { meta, onStart };
