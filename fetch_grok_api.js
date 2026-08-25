const fs = require('fs');

async function testApi(url, body) {
  try {
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    console.log(`URL: ${url} => Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log('API Response keys:', Object.keys(data));
      fs.writeFileSync('C:\\Users\\dyna\\.gemini\\antigravity\\brain\\42d0f76e-8bdd-4513-86fb-c1ee8991ef7c\\scratch\\grok_api_success.json', JSON.stringify(data, null, 2));
      return true;
    }
  } catch (e) {
    console.log(`URL: ${url} => Error: ${e.message}`);
  }
  return false;
}

async function main() {
  const shareId = 'bGVnYWN5_f5d3596a-a213-4189-8547-793a5ae7e053';
  await testApi(`https://grok.com/api/share/${shareId}`);
  await testApi(`https://grok.com/api/chats/share/${shareId}`);
  await testApi(`https://grok.com/api/rpc/grok.chat.v1.ChatService/GetSharedChat`, { shareId });
  await testApi(`https://grok.com/api/rpc/grok.chat.v1.ChatService/GetSharedChat`, { sharedChatId: shareId });
  await testApi(`https://grok.com/api/rpc/grok.chat.v1.ChatService/GetSharedChat`, { id: shareId });
}

main();
