const fs = require('fs');

const file = 'C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\.system_generated\\steps\\2216\\content.md';
const content = fs.readFileSync(file, 'utf8');

// Find all JSON blocks or search for conversation content
const matches = [];
const regex = /"message":\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  matches.push(match[1]);
}

console.log(`Found ${matches.length} messages.`);

// Search for prompt / user queries and assistant responses
const conversation = [];
const termRegex = /"text":\s*"([^"]+)"/g;
while ((match = termRegex.exec(content)) !== null) {
  const text = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  if (text.length > 20 && !text.includes('UniversalSans') && !text.includes('webpack')) {
    conversation.push(text);
  }
}

console.log(`Extracted ${conversation.length} text fragments.`);

fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_summary.txt', conversation.join('\n\n====================\n\n'));
console.log('Saved to scratch/grok_summary.txt');
