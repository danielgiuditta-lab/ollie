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
  console.log("=== Autonomous Pre-Verification Test: Inferred Tasks Widget & Vibe-Coding ===");
  let failures = 0;

  // 1. Verify Parent Space Chat Save & Persistence with pinnedArtifactIds containing todo-card
  const spaceId = `test-space-${Date.now()}`;
  console.log(`\n1. Testing Parent Space Chat saving for ${spaceId}...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${spaceId}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      projectName: 'Test Branding Space',
      type: 'space',
      pinnedArtifactIds: ['todo-card'],
      sandboxFiles: [
        {
          id: 'todo-card',
          name: 'inferred_tasks.json',
          type: 'code',
          mimeType: 'application/json',
          isInferredTask: true,
          taskType: 'inferred'
        }
      ]
    });

    if (res.status === 200) {
      console.log("   ✅ Parent Space Chat successfully saved with pinnedArtifactIds ['todo-card']");
    } else {
      console.error(`   ❌ Failed to save parent space chat. Status: ${res.status}`);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error connecting to backend server:", err.message);
    failures++;
  }

  // 2. Verify GET /api/chats/:chatId returns pinnedArtifactIds and sandboxFiles
  console.log(`\n2. Verifying GET /api/chats/${spaceId}...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${spaceId}`,
      method: 'GET'
    });

    if (res.status === 200 && res.data.pinnedArtifactIds?.includes('todo-card')) {
      console.log("   ✅ GET /api/chats returned correctly persisted pinnedArtifactIds:", res.data.pinnedArtifactIds);
    } else {
      console.error("   ❌ GET /api/chats failed or missing pinnedArtifactIds:", res.data);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error fetching chat:", err.message);
    failures++;
  }

  // 3. Verify Child Authoring Chat for Inferred Tasks (${spaceId}-chat-inferred)
  const childChatId = `${spaceId}-chat-inferred`;
  console.log(`\n3. Testing Child Authoring Chat saving for ${childChatId}...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${childChatId}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      projectName: 'Test Branding Space',
      chatName: 'To-dos',
      type: 'workspace',
      taskType: 'inferred',
      associatedFileId: 'todo-card',
      associatedFileName: 'inferred_tasks.json',
      activeSpaceId: spaceId,
      messages: [
        { role: 'user', text: 'only tell me about google workspace items' }
      ],
      sandboxFiles: [
        {
          id: 'todo-card',
          name: 'inferred_tasks.json',
          type: 'code',
          mimeType: 'application/json',
          isInferredTask: true
        }
      ]
    });

    if (res.status === 200) {
      console.log("   ✅ Child Chat session saved with taskType 'inferred' and associatedFileId 'todo-card'");
    } else {
      console.error(`   ❌ Failed to save child chat session. Status: ${res.status}`);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error connecting to backend server:", err.message);
    failures++;
  }

  // 4. Verify GET /api/chats for Child Chat
  console.log(`\n4. Verifying GET /api/chats/${childChatId}...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${childChatId}`,
      method: 'GET'
    });

    if (res.status === 200 && res.data.taskType === 'inferred' && res.data.associatedFileId === 'todo-card') {
      console.log("   ✅ GET child chat verified: taskType='inferred', associatedFileId='todo-card'");
    } else {
      console.error("   ❌ GET child chat failed or missing attributes:", res.data);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error fetching child chat:", err.message);
    failures++;
  }

  // Clean up test chats
  console.log("\n5. Cleaning up test chats...");
  await request({ hostname: 'localhost', port: 3000, path: `/api/chats/${spaceId}`, method: 'DELETE' });
  await request({ hostname: 'localhost', port: 3000, path: `/api/chats/${childChatId}`, method: 'DELETE' });
  console.log("   ✅ Test chats cleaned up.");

  console.log("\n==================================================");
  if (failures === 0) {
    console.log("RESULT: ALL AUTONOMOUS VERIFICATION TESTS PASSED SUCCESSFULLY! ✅");
    process.exit(0);
  } else {
    console.error(`RESULT: ${failures} TEST(S) FAILED! ❌`);
    process.exit(1);
  }
}

runVerification();
