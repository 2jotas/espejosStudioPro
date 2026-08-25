const fs = require('fs');

const text = fs.readFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_interesting.txt', 'utf8');

// Extract all string values from JSON/React tree format
const strings = [];
const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
let m;
while ((m = regex.exec(text)) !== null) {
  const val = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  if (val.length > 15 && !val.includes('https:') && !val.includes('static/chunks') && !val.includes('module')) {
    strings.push(val);
  }
}

console.log('Total extracted string nodes:', strings.length);
fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_strings.txt', strings.join('\n\n---\n\n'));
