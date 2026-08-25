const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_share_data.json', 'utf8'));

console.log('Total responses:', data.responses.length);

const summary = [];
data.responses.forEach((r, i) => {
  const isHuman = r.sender === 'human' || r.isUser;
  const role = isHuman ? '👤 USER' : '🤖 GROK';
  const text = r.response?.message || r.message || r.text || '';
  if (text.length > 0) {
    const firstLine = text.split('\n')[0].slice(0, 120);
    summary.push(`Step ${i + 1} (${role}): ${firstLine}`);
  }
});

console.log(summary.join('\n'));
fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_chat_index.txt', summary.join('\n'));
