const fs = require('fs');

const text = fs.readFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_strings.txt', 'utf8');

const blocks = text.split('\n\n---\n\n');
console.log('Total blocks:', blocks.length);

const spanishBlocks = [];
for (let i = 0; i < blocks.length; i++) {
  const b = blocks[i];
  if (b.includes('VPS') || b.includes('docker') || b.includes('Docker') || b.includes('Nginx') || b.includes('nginx') || b.includes('espejos') || b.includes('puerto') || b.includes('SSH') || b.includes('ssh') || b.includes('servidor') || b.includes('despliegue')) {
    spanishBlocks.push(`[Block ${i}]:\n${b}`);
  }
}

console.log('Found matching blocks:', spanishBlocks.length);
fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_chat_matches.txt', spanishBlocks.join('\n\n====================\n\n'));
