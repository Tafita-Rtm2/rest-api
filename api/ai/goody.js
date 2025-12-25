require('dotenv').config();
const axios = require('axios');

const conversations = new Map();

const meta = {
  name: 'HuggingFaceGPT',
  path: '/huggingface?query=&uid=&model=&system=',
  method: 'get',
  category: 'ai',
  description: 'Hugging Face AI Proxy'
};

const models = {
  success: true,
  data: [
    { id: "meta-llama/Meta-Llama-3-8B-Instruct" },
    { id: "meta-llama/Meta-Llama-3-70B-Instruct" },
    { id: "mistralai/Mistral-7B-Instruct-v0.3" },
    { id: "Qwen/Qwen2.5-7B-Instruct" },
    { id: "Qwen/Qwen2.5-14B-Instruct" },
    { id: "google/gemma-2-9b-it" }
  ]
};

async function onStart({ req, res }) {
  const { query, uid, model, system } = req.query;

  if (!query || !uid || !model) {
    return res.status(400).json({
      error: "Missing query, uid or model",
      example: "/huggingface?query=hello&uid=1&model=meta-llama/Meta-Llama-3-8B-Instruct",
      avail_models: models.data.map(m => m.id)
    });
  }

  if (!models.data.find(m => m.id === model)) {
    return res.status(400).json({
      error: "Invalid model",
      avail_models: models.data.map(m => m.id)
    });
  }

  try {
    let messages = conversations.get(uid) || [];

    if (system && messages.length === 0) {
      messages.push({ role: "system", content: system });
    }

    messages.push({ role: "user", content: query });

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        inputs: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        parameters: {
          temperature: 0.6,
          top_p: 0.9,
          max_new_tokens: 1024
        },
        stream: true
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        responseType: 'stream'
      }
    );

    let fullResponse = '';

    response.data.on('data', chunk => {
      const text = chunk.toString();
      fullResponse += text;
    });

    response.data.on('end', () => {
      messages.push({ role: "assistant", content: fullResponse });
      conversations.set(uid, messages);

      res.json({
        result: fullResponse,
        model,
        avail_models: models.data.map(m => m.id)
      });
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
      avail_models: models.data.map(m => m.id)
    });
  }
}

module.exports = { meta, onStart };
