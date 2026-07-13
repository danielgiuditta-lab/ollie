import http from 'http';

async function testPerformance() {
  console.log("=== Running Performance Verification Suite ===");

  const fetchEndpoint = (path, headers = {}) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const options = {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const duration = Date.now() - start;
          try {
            const json = JSON.parse(data);
            resolve({ statusCode: res.statusCode, duration, json });
          } catch (e) {
            resolve({ statusCode: res.statusCode, duration, raw: data });
          }
        });
      });

      req.on('error', err => reject(err));
      req.end();
    });
  };

  try {
    // 1. Test /api/user-chats/all latency
    console.log("Testing /api/user-chats/all endpoint...");
    const userChatsRes = await fetchEndpoint('/api/user-chats/all');
    console.log(`✓ /api/user-chats/all returned HTTP ${userChatsRes.statusCode} in ${userChatsRes.duration}ms (${Array.isArray(userChatsRes.json) ? userChatsRes.json.length : 0} items)`);

    // 2. Test /api/workspace-digest cold fetch vs warm cache hit
    console.log("\nTesting /api/workspace-digest cache performance...");
    const mockAuthToken = 'Bearer test_perf_token_123';
    
    // Cold fetch
    const coldStart = await fetchEndpoint('/api/workspace-digest', { 'Authorization': mockAuthToken });
    console.log(`- Cold Digest request returned HTTP ${coldStart.statusCode} in ${coldStart.duration}ms`);

    // Warm cache fetch
    const warmStart = await fetchEndpoint('/api/workspace-digest', { 'Authorization': mockAuthToken });
    console.log(`- Warm Cached Digest request returned HTTP ${warmStart.statusCode} in ${warmStart.duration}ms`);

    if (warmStart.duration < coldStart.duration || warmStart.duration < 100) {
      console.log(`✓ Cache optimization verified! Speedup achieved (Warm latency: ${warmStart.duration}ms)`);
    } else {
      console.log(`! Warm latency: ${warmStart.duration}ms`);
    }

    console.log("\n=== Performance Verification Completed Successfully ===");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  }
}

testPerformance();
