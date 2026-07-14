import http from 'http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runVerification() {
  console.log("=== Autonomous Pre-Verification Test: Home Inferred Tasks Pinning Default & Persistence ===");
  let failures = 0;

  const testHomeId = `test-home-pin-${Date.now()}`;

  // Step 1: POST /api/chats/testHomeId WITHOUT pinnedArtifactIds
  console.log(`\n1. Creating fresh Home chat (${testHomeId}) without explicit pinnedArtifactIds...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${testHomeId}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      projectName: 'Home Dashboard',
      chatName: 'Home',
      type: 'home',
      messages: []
    });

    if (res.status === 200 && res.data.success) {
      console.log("   ✅ POST /api/chats succeeded with status 200!");
    } else {
      console.error(`   ❌ Failed: Unexpected response body for fresh Home chat:`, res.data);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error connecting to backend server:", err.message);
    failures++;
  }

  // Step 2: GET /api/chats/testHomeId to verify default ['todo-card'] pin persistence
  console.log(`\n2. Verifying GET /api/chats/${testHomeId} returns default ['todo-card'] out of the box...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${testHomeId}`,
      method: 'GET'
    });

    if (res.status === 200 && res.data.pinnedArtifactIds && res.data.pinnedArtifactIds.includes('todo-card')) {
      console.log("   ✅ GET /api/chats returned default pinnedArtifactIds containing 'todo-card'!");
    } else {
      console.error("   ❌ Failed: GET /api/chats did not return 'todo-card' in pinnedArtifactIds:", res.data);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error during GET request:", err.message);
    failures++;
  }

  // Step 3: Simulate user explicitly removing / unpinning 'todo-card'
  console.log(`\n3. Simulating explicit user unpin: POSTing pinnedArtifactIds: []...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${testHomeId}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      projectName: 'Home Dashboard',
      pinnedArtifactIds: []
    });

    if (res.status === 200 && res.data.success) {
      console.log("   ✅ POST unpin request succeeded with status 200!");
    } else {
      console.error("   ❌ Failed to persist explicit unpinning (empty array):", res.data);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error during explicit unpin request:", err.message);
    failures++;
  }

  // Step 4: GET /api/chats/testHomeId to verify explicit [] remains []
  console.log(`\n4. Verifying GET /api/chats/${testHomeId} after unpinning returns empty array []...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${testHomeId}`,
      method: 'GET'
    });

    if (res.status === 200 && Array.isArray(res.data.pinnedArtifactIds) && res.data.pinnedArtifactIds.length === 0) {
      console.log("   ✅ Verified: explicit unpin [] is maintained and does NOT revert back to default!");
    } else {
      console.error("   ❌ Failed: GET /api/chats after unpin did not maintain empty array:", res.data);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error during GET request after unpin:", err.message);
    failures++;
  }

  // Step 5: Clean up test chat
  console.log("\n5. Cleaning up test chat...");
  await request({ hostname: 'localhost', port: 3000, path: `/api/chats/${testHomeId}`, method: 'DELETE' });
  console.log("   ✅ Test chat deleted.");

  console.log("\n==================================================");
  if (failures === 0) {
    console.log("RESULT: ALL HOME INFERRED TASKS PINNING TESTS PASSED! ✅");
    process.exit(0);
  } else {
    console.error(`RESULT: ${failures} TEST(S) FAILED! ❌`);
    process.exit(1);
  }
}

runVerification();
