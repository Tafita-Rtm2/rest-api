const axios = require('axios');
const conversations = new Map();

const meta = {
  name: 'TypeGPT',
  path: '/typegpt?query=&uid=&model=&system=',
  method: 'get',
  category: 'ai',
  description: ''
};

const models = {
  "data": [
    {"id": "deepseek-ai/DeepSeek-V3.1"},
    {"id": "qwen/qwen2.5-7b-instruct/bf-16"},
    {"id": "Qwen/Qwen3-235B-A22B-Thinking-2507-FP8"},
    {"id": "Qwen/Qwen3-235B-A22B-Thinking-2507"},
    {"id": "Qwen/Qwen3-30B-A3B-Instruct-2507"},
    {"id": "Qwen/Qwen3-30B-A3B-Thinking-2507"},
    {"id": "Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8"},
    {"id": "Qwen/Qwen3-Next-80B-A3B-Thinking"},
    {"id": "Qwen/Qwen3-Next-80B-A3B-Instruct"},
    {"id": "gpt-5"},
    {"id": "gpt-5(openai)"},
    {"id": "zai-org/GLM-4.5-Air-FP8"},
    {"id": "deepseek-ai/DeepSeek-V3.2-Exp"},
    {"id": "NAI/Uncensored-R1"},
    {"id": "openai/gpt-oss-20b"},
    {"id": "openai/gpt-oss-120b"},
    {"id": "meta-llama/llama-3.1-8b-instruct/fp-16"},
    {"id": "mistralai/mistral-nemo-12b-instruct/fp-8"},
    {"id": "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"},
    {"id": "meta-llama/Llama-3.3-70B-Instruct"},
    {"id": "deepseek-ai/DeepSeek-R1-0528"},
    {"id": "moonshotai/Kimi-K2-Instruct-0905"},
    {"id": "deepseek-ai/DeepSeek-V3-0324"}
  ],
  "success": true
};

async function onStart({ req, res }) {
  const { query, uid, model, system } = req.query;

  if (!query || !uid || !model) {
    const availModels = models.data.map(m => m.id);
    return res.status(400).json({
      error: "Please provide 'query', 'uid' and 'model'.",
      example: "/typegpt?query=hi&uid=69&model=deepseek-ai/DeepSeek-V3.1",
      avail_models: availModels
    });
  }

  try {
    let messages = conversations.get(uid) || [];
    if (system) messages.unshift({ role: 'system', content: system });
    messages.push({ role: 'user', content: query });
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
          "Referer": "https://chat.typegpt.net/"
        },
        responseType: 'stream'
      }
    );

    let fullResponse = '';
    const chunks = [];

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
              chunks.push(content);
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
