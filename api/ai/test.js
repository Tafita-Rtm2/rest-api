const axios = require('axios');
const conversations = new Map();

const meta = {
  name: 'LMArena-Direct',
  path: '/lmarena?query=&uid=&model=&system=&imgurl=',
  method: 'get',
  category: 'ai',
  description: 'Direct chat with experimental models like GPT-5.2 and Gemini 3.'
};

// Liste des modèles basée sur ta capture d'écran 5
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
  const { query, uid, model, system, imgurl } = req.query;

  // Si l'utilisateur n'envoie pas de modèle, on met gpt-5.2-high par défaut
  const selectedModel = model || "gpt-5.2-high";

  if (!query || !uid) {
    const availModels = models.data.map(m => m.id);
    return res.status(400).json({
      error: "Please provide 'query', 'uid'. Model is optional.",
      example: "/lmarena?query=hello&uid=123&model=gpt-5.2-high",
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

    // Tentative de connexion vers LM Arena
    // Note: LM Arena utilise souvent des protections Cloudflare strictes.
    const response = await axios.post('https://lmarena.ai/api/chat/completions', // Endpoint supposé
      {
        model: selectedModel,
        messages,
        stream: true,
        temperature: 0.7, // Ajusté pour le mode créatif
        presence_penalty: 0,
        frequency_penalty: 0,
        top_p: 1
      },
      {
        headers: {
          "Content-Type": "application/json",
          "accept": "text/event-stream", // LM Arena utilise souvent SSE
          "accept-language": "en-US,en;q=0.9",
          "origin": "https://lmarena.ai",
          "referer": "https://lmarena.ai/", // IMPORTANT: Le referer doit être lmarena
          "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": "\"Android\"",
          "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
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
          } catch (e) {
            // Ignorer les erreurs de parsing JSON partiel
          }
        }
      }
    });

    response.data.on('end', () => {
      messages.push({ role: 'assistant', content: fullResponse });
      conversations.set(uid, messages);

      res.json({
        result: fullResponse,
        model: selectedModel,
        avail_models: models.data.map(m => m.id)
      });
    });

  } catch (error) {
    // Gestion d'erreur améliorée pour voir ce qui ne va pas
    console.error("Erreur LM Arena:", error.message);
    res.status(500).json({
      error: "Failed to connect to LM Arena. Note: This site has heavy Cloudflare protection.",
      details: error.message,
      avail_models: models.data.map(m => m.id)
    });
  }
}

module.exports = { meta, onStart };