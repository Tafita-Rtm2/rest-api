const axios = require('axios');
const conversations = new Map();

const meta = {
  name: 'ChatGPT-5',
  path: '/chatgpt5?query=&uid=&model=&system=&imgurl=',
  method: 'get',
  category: 'ai',
  description: 'AI model that can analyze images.'
};

const models = {
  "data": [
    {"id": "gpt-5"},
    {"id": "gpt-5(Azure)"}
  ],
  "success": true
};

async function onStart({ req, res }) {
  const { query, uid, model, system, imgurl } = req.query;

  if (!query || !uid || !model) {
    const availModels = models.data.map(m => m.id);
    return res.status(400).json({
      error: "Please provide 'query', 'uid' and 'model'.",
      example: "/chatgpt5?query=hi&uid=69&model=gpt-5 (OpenAI)",
      avail_models: availModels
    });
  }

  try {
    let messages = conversations.get(uid) || [];
    if (system && messages.length === 0) {
      messages.push({ role: 'system', content: system });
    }

    const userMessage = {
      role: 'user',
      content: query
    };

    if (imgurl) {
      userMessage.content = [
        { type: 'text', text: query },
        { type: 'image_url', image_url: { url: imgurl } }
      ];
    }

    messages.push(userMessage);

    const response = await axios.post('https://gpt.tiptopuni.com/api/openai/v1/chat/completions',
      {
        model,
        messages,
        stream: true,
        temperature: 0.5,
        presence_penalty: 0,
        frequency_penalty: 0,
        top_p: 1
      },
      {
        headers: {
          "Content-Type": "application/json",
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "sec-ch-ua": "\"Chromium\";v=\"137\", \"Not/A)Brand\";v=\"24\"",
          "sec-ch-ua-arch": "\"\"",
          "sec-ch-ua-bitness": "\"\"",
          "sec-ch-ua-full-version": "\"137.0.7337.0\"",
          "sec-ch-ua-full-version-list": "\"Chromium\";v=\"137.0.7337.0\", \"Not/A)Brand\";v=\"24.0.0.0\"",
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-model": "\"SM-A057F\"",
          "sec-ch-ua-platform": "\"Android\"",
          "sec-ch-ua-platform-version": "\"15.0.0\"",
          "Referer": "https://gpt.tiptopuni.com/"
        },
        responseType: 'stream'
      }
    );

    let fullResponse = '';
    
    response.data.on('data', chunk => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              fullResponse += content;
            }
          } catch (e) {}
        }
      }
    });

    response.data.on('end', () => {
      messages.push({ role: 'assistant', content: fullResponse });
      conversations.set(uid, messages);
      
      res.json({
        result: fullResponse,
        avail_models: models.data.map(m => m.id)
      });
    });

  } catch (error) {
    res.status(400).json({
      error: error.message,
      avail_models: models.data.map(m => m.id)
    });
  }
}

module.exports = { meta, onStart };
