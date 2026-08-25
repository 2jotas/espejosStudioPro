const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_share_data.json', 'utf8'));

let formattedMarkdown = `# Transcript of Shared Grok Conversation\n\n`;

if (data.conversation) {
  formattedMarkdown += `**Conversation ID**: ${data.conversation.conversationId || 'N/A'}\n`;
  formattedMarkdown += `**Title**: ${data.conversation.title || 'VPS Optimization & Multi-App Hosting Plan'}\n\n`;
}

if (data.responses && Array.isArray(data.responses)) {
  data.responses.forEach((item, index) => {
    const sender = item.sender || (item.response?.model ? 'GROK AI' : 'USER');
    const messageText = item.response?.message || item.message || item.text || item.response?.text || '';
    const senderIcon = sender.includes('USER') || sender.includes('user') || item.sender === 'human' ? '👤 USUARIO' : '🤖 GROK AI';
    
    formattedMarkdown += `## Step ${index + 1}: ${senderIcon}\n\n`;
    formattedMarkdown += `${messageText}\n\n`;
    formattedMarkdown += `---\n\n`;
  });
}

fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_conversation_formatted.md', formattedMarkdown);
console.log(`Successfully formatted ${data.responses?.length || 0} conversation messages!`);
