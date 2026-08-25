const fs = require('fs');

async function main() {
  const res = await fetch('https://grok.com/share/bGVnYWN5_f5d3596a-a213-4189-8547-793a5ae7e053', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  const html = await res.text();
  console.log('HTML size:', html.length);
  fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_browser.html', html);
  
  // Extract text within script tags or Next data
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (nextDataMatch) {
    console.log('__NEXT_DATA__ found!');
    fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\next_data.json', nextDataMatch[1]);
  } else {
    console.log('No __NEXT_DATA__ script tag found directly.');
  }

  // Let's search for "ssh espejos" or text in the html
  const idx = html.indexOf('espejos');
  console.log('Index of espejos in html:', idx);
  if (idx !== -1) {
    console.log(html.slice(idx - 200, idx + 500));
  }
}

main();
