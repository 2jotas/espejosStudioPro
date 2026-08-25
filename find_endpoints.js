const fs = require('fs');

const html = fs.readFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_browser.html', 'utf8');

// Find all script src URLs
const jsUrls = (html.match(/src="(https:\/\/cdn\.grok\.com\/_next\/static\/chunks\/[^"]+\.js)"/g) || [])
  .map(m => m.replace('src="', '').replace('"', ''));

console.log('JS Chunks found:', jsUrls.length);

async function searchJs() {
  for (const url of jsUrls) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      if (text.includes('share') || text.includes('Share')) {
        const matches = text.match(/\/api\/[a-zA-Z0-9_\/]+/g) || text.match(/Get[a-zA-Z0-9_]+/g) || [];
        const unique = [...new Set(matches)].filter(m => m.toLowerCase().includes('share') || m.toLowerCase().includes('chat'));
        if (unique.length > 0) {
          console.log(`URL ${url.split('/').pop()} matches:`, unique);
        }
      }
    } catch(e) {}
  }
}

searchJs();
