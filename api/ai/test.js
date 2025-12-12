const axios = require('axios');
const conversations = new Map();

const meta = {
  name: 'LMArena-Proxy',
  path: '/api?query=&uid=&model=&system=',
  method: 'get',
  category: 'ai',
  description: 'Proxy for LMArena models'
};

const models = {
  "data": [
    {"id": "gpt-5.2-high"},
    {"id": "claude-opus-4-5-20251101-thinking-32k"},
    {"id": "claude-opus-4-5-20251101"},
    {"id": "gemini-3-pro"},
    {"id": "grok-4.1-thinking"},
    {"id": "grok-4.1"},
    {"id": "gpt-5.1-high"},
    {"id": "gemini-2.5-pro"},
    {"id": "claude-sonnet-4-5-20250929-thinking-32k"},
    {"id": "claude-opus-4-1-20250805-thinking-16k"}
  ],
  "success": true
};

async function onStart({ req, res }) {
  const { query, uid, model, system } = req.query;

  // Basic validation
  if (!query || !model) {
    const availModels = models.data.map(m => m.id);
    return res.status(400).json({
      error: "Please provide 'query' and 'model'.",
      example: "/api?query=hello&uid=123&model=gemini-3-pro",
      avail_models: availModels
    });
  }

  // Generate a temporary ID if none provided
  const userId = uid || 'default-user';

  try {
    let messages = conversations.get(userId) || [];
    if (system) messages.unshift({ role: 'system', content: system });
    messages.push({ role: 'user', content: query });

    // NOTE: lmarena.ai uses complex protection. 
    // This request mimics the headers, but Cloudflare might still challenge it.
    const response = await axios.post('https://lmarena.ai/api/chat/completions', 
      {
        model: model,
        messages: messages,
        stream: true,
        temperature: 0.7,
        top_p: 0.9
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://lmarena.ai",
          "Referer": "https://lmarena.ai/",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
          "accept": "text/event-stream", // Important for streaming
          "accept-language": "en-US,en;q=0.9"
        },
        responseType: 'stream'
      }
    );

    let fullResponse = '';

    // Handle the stream
    response.data.on('data', chunk => {
      const lines = chunk.toString().split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            // Adapt content extraction to standard OpenAI format
            const content = parsed.choices?.[0]?.delta?.content || parsed.text || "";
            if (content) {
              fullResponse += content;
            }
          } catch (e) {
             // Ignore parse errors from keep-alive packets
          }
        }
      }
    });

    response.data.on('end', () => {
      messages.push({ role: 'assistant', content: fullResponse });
      conversations.set(userId, messages);
      
      res.json({
        result: fullResponse || "No response content received (Check Model ID)",
        model_used: model,
        success: true
      });
    });

  } catch (error) {
    console.error("Proxy Error:", error.message);
    
    // If blocked by Cloudflare (403), we show a helpful message
    if (error.response && error.response.status === 403) {
       return res.status(403).json({
         error: "Security Blocked",
         message: "LMArena blocked this automated request. They require a real browser."
       });
    }

    res.status(500).json({
      error: error.message,
      avail_models: models.data.map(m => m.id)
    });
  }
}

module.exports = { meta, onStart };