const axios = require('axios');

const meta = {
  name: "Facebook Downloader",
  version: "1.0.0",
  description: "API to download Facebook videos",
  author: "rapido",
  method: "get",
  category: "downloader",
  path: "/fbdl?url=https://www.facebook.com/share/v/12JgNuM1RcF/"
};

const parseString = (string) => JSON.parse(`{"text": "${string}"}`).text;

async function onStart({ res, req }) {
  try {
    const url = req.query.url;
    if (!url) {
      return res.json({ error: "URL is required" });
    }

    if (["facebook.com", "fb.watch"].every((domain) => !url.includes(domain))) {
      return res.json({ error: "Please enter a valid Facebook URL" });
    }

    const headers = {
      "sec-fetch-user": "?1",
      "sec-ch-ua-mobile": "?0",
      "sec-fetch-site": "none",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "cache-control": "max-age=0",
      authority: "www.facebook.com",
      "upgrade-insecure-requests": "1",
      "accept-language": "en-GB,en;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6",
      "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      cookie: "sb=Rn8BYQvCEb2fpMQZjsd6L382; datr=Rn8BYbyhXgw9RlOvmsosmVNT; c_user=100003164630629; _fbp=fb.1.1629876126997.444699739; wd=1920x939; spin=r.1004812505_b.trunk_t.1638730393_s.1_v.2_; xs=28%3A8ROnP0aeVF8XcQ%3A2%3A1627488145%3A-1%3A4916%3A%3AAcWIuSjPy2mlTPuZAeA2wWzHzEDuumXI89jH8a_QIV8; fr=0jQw7hcrFdas2ZeyT.AWVpRNl_4noCEs_hb8kaZahs-jA.BhrQqa.3E.AAA.0.0.BhrQqa.AWUu879ZtCw"
    };

    const { data } = await axios.get(url, { headers });
    const processedData = data.replace(/&quot;/g, '"').replace(/&amp;/g, "&");

    const hdMatch = processedData.match(/"browser_native_hd_url":"(.*?)"/) || 
                    processedData.match(/"playable_url_quality_hd":"(.*?)"/) || 
                    processedData.match(/hd_src\s*:\s*"([^"]*)"/);

    const thumbMatch = processedData.match(/"preferred_thumbnail":{"image":{"uri":"(.*?)"/);
    const titleMatch = processedData.match(/<meta\sname="description"\scontent="(.*?)"/);

    if (hdMatch && hdMatch[1]) {
      const videoUrl = parseString(hdMatch[1]);
      const title = titleMatch && titleMatch[1] ? parseString(titleMatch[1]) : "facebook_video";
      const thumbnail = thumbMatch && thumbMatch[1] ? parseString(thumbMatch[1]) : "";

      const proxyUrl = `/api/proxy?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(title)}`;

      return res.json({
        url: proxyUrl,
        thumbnail: thumbnail,
        title: title
      });

    } else {
      return res.status(404).json({ error: "Video not found" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { meta, onStart };
