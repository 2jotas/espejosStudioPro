const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\.system_generated\\steps\\2216\\content.md', 'utf8');

// Find all matches for "text" or "message" or "content" or "response"
const regex = /"message":\s*\{[\s\S]*?\}/g;
let m;
const messages = [];
while ((m = regex.exec(raw)) !== null) {
  messages.push(m[0]);
}
console.log('Matches:', messages.length);

// Let's print string sequences that look like Spanish conversation text or shell code
const textRegex = /[A-Za-z0-9_#áéíóúÁÉÍÓÚñÑ\s\/\-\.:]{30,}/g;
const matchesText = raw.match(textRegex) || [];
const filtered = matchesText.filter(t => !t.includes('UniversalSans') && !t.includes('stylesheet') && !t.includes('chunk') && !t.includes('webpack') && !t.includes('function'));

console.log('Filtered text blocks:', filtered.length);
fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_filtered_texts.txt', filtered.slice(0, 100).join('\n---\n'));
