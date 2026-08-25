const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_share_data.json', 'utf8'));

console.log('Keys in data:', Object.keys(data));

// Walk through messages in post / responses / chat history
let markdown = `# Conversation Title: ${data.title || data.shareLink?.title || 'Shared Grok Chat'}\n\n`;

function extractMessages(obj) {
  if (!obj) return;
  
  if (Array.isArray(obj)) {
    obj.forEach(extractMessages);
    return;
  }
  
  if (typeof obj === 'object') {
    if (obj.sender || obj.role || obj.message || obj.text) {
      const sender = obj.sender || obj.role || (obj.isUser ? 'USER' : 'GROK');
      const text = obj.message || obj.text || obj.content || obj.response;
      if (typeof text === 'string') {
        markdown += `### 👤 ${sender}:\n${text}\n\n---\n\n`;
      }
    }
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object') {
        extractMessages(obj[key]);
      }
    }
  }
}

// Inspect top level structure
fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_json_summary.json', JSON.stringify(data, (k, v) => {
  if (typeof v === 'string' && v.length > 300) return v.slice(0, 300) + '...[truncated]';
  return v;
}, 2));

console.log('Saved JSON summary to scratch/grok_json_summary.json');
