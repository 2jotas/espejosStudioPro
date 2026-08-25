const fs = require('fs');

const html = fs.readFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_browser.html', 'utf8');

const regex = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
let m;
let fullText = '';
while ((m = regex.exec(html)) !== null) {
  try {
    const unescaped = JSON.parse('"' + m[1] + '"');
    fullText += unescaped + '\n';
  } catch (e) {
    fullText += m[1] + '\n';
  }
}

fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_full_stream.txt', fullText);
console.log('Saved stream, total size:', fullText.length);

// Let's search for keywords in fullText
const lines = fullText.split('\n');
console.log('Total lines:', lines.length);

const interesting = lines.filter(l => l.length > 50 && !l.startsWith(':') && !l.includes('webpack') && !l.includes('font-family'));
console.log('Interesting lines:', interesting.length);
fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_interesting.txt', interesting.join('\n\n---\n\n'));
