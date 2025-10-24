const axios = require('axios');

const meta = {
  name: "Inbox V2",
  version: "1.0.0",
  description: "Check temporary email inbox",
  author: "RTM (jm)",
  method: "get",
  category: "tempmail",
  path: "/tempmail/inboxv2?token="
};

async function onStart({ res, req }) {
  try {
    const token = req.query.token;
    if (!token) return res.json({ error: "Token is required" });
    
    const messages = await getMessages(token);
    const formattedMessages = messages.map(message => ({
      id: message.id,
      from: message.from,
      subject: message.subject,
      intro: message.intro,
      date: message.createdAt,
      read: message.seen
    }));
    
    return res.json(formattedMessages);
  } catch (error) {
    return res.json({ error: error.message });
  }
}

async function getMessages(token) {
  const { data } = await axios.get('https://api.mail.tm/messages', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return data['hydra:member'];
}

module.exports = { meta, onStart };