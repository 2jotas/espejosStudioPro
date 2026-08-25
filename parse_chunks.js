const fs = require('fs');

const raw = fs.readFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_raw.txt', 'utf8');

// Find all text between self.__next_f.push([1,"..."])
const chunks = [];
const regex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
let m;
while ((m = regex.exec(raw)) !== null) {
  try {
    const unescaped = JSON.parse('"' + m[1] + '"');
    chunks.push(unescaped);
  } catch (e) {
    chunks.push(m[1]);
  }
}

console.log(`Extracted ${chunks.length} chunks.`);

const textResult = chunks.join('\n');
fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_conversation_clean.md', textResult);
console.log('Saved to scratch/grok_conversation_clean.md');
