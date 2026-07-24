import http from 'http';

async function testHealth() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('[VERIFICATION] Server Health Status Code:', res.statusCode);
        console.log('[VERIFICATION] Server Response:', data);
        resolve(res.statusCode === 200);
      });
    }).on('error', err => {
      console.error('[VERIFICATION] Server connection error:', err.message);
      resolve(false);
    });
  });
}

testHealth().then(ok => {
  if (ok) console.log('✅ Server health check passed!');
  else console.log('❌ Server health check failed!');
});
