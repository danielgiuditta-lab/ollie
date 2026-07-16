import http from 'http';

async function testFastPolicyTool() {
  console.log('Testing /api/vibe-code fast response for policy issue organization prompt...');
  const postData = JSON.stringify({
    prompt: 'help me organize policy issues from all clients',
    chatId: 'space-1784214248389',
    env_id: 'remote'
  });

  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/vibe-code',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let rawData = '';
    const startTime = Date.now();
    
    res.on('data', (chunk) => {
      rawData += chunk.toString();
    });

    res.on('end', () => {
      const duration = Date.now() - startTime;
      console.log(`Stream finished in ${duration}ms`);
      
      const containsHTML = rawData.includes('Cross-Client Policy Issues & Escalation Tracker') || rawData.includes('data-cached-policy');
      const containsStreamText = rawData.includes('Your Policy Issues & Escalation Tracker is ready');
      
      console.log('Contains Expected Tool Header:', containsHTML);
      console.log('Contains Completion Message:', containsStreamText);
      console.log('Response Duration < 3000ms:', duration < 3000);

      if (containsHTML && containsStreamText && duration < 3000) {
        console.log('SUCCESS: Fast policy tool generation verified!');
        process.exit(0);
      } else {
        console.error('FAILURE: Expected fast stream response was missing or delayed.', { duration });
        process.exit(1);
      }
    });
  });

  req.on('error', (e) => {
    console.error('HTTP Request error:', e);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

testFastPolicyTool();
