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
  console.log("=== Comprehensive Autonomous Pre-Verification Test: Inferred Tasks Edit & Vibe Coding ===");
  let failures = 0;

  const spaceId = `test-space-edit-${Date.now()}`;
  const childChatId = `${spaceId}-chat-inferred`;

  // Test 1: Verify 404 behavior for non-existent child chat prior to first Edit click
  console.log(`\n1. Verifying GET /api/chats/${childChatId} before first Edit click returns 404...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${childChatId}`,
      method: 'GET'
    });
    if (res.status === 404) {
      console.log("   ✅ Server correctly returns 404 for fresh uncached child chat (triggering frontend uncached initialization handler)");
    } else {
      console.error(`   ❌ Unexpected response status for uncached child chat: ${res.status}`);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error connecting to backend server:", err.message);
    failures++;
  }

  // Test 2: Simulate clicking Edit on the To-dos card and persisting the brand-new child chat session
  console.log(`\n2. Simulating Edit action: Initializing child chat session for ${childChatId}...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${childChatId}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      projectName: 'Branding',
      chatName: 'To-dos',
      type: 'inferred',
      taskType: 'inferred',
      associatedFileId: 'todo-card',
      associatedFileName: 'inferred_tasks.json',
      activeSpaceId: spaceId,
      messages: [],
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
      console.log("   ✅ Child authoring chat successfully initialized and saved to DB");
    } else {
      console.error(`   ❌ Failed to save initialized child chat. Status: ${res.status}`);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error persisting child chat session:", err.message);
    failures++;
  }

  // Test 3: Simulate Vibe-Coding Turn in Child Chat (e.g. "only tell me about Google Workspace items")
  console.log(`\n3. Simulating Vibe-Coding turn: User sends natural language customization prompt...`);
  try {
    const updatedHtmlTool = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <title>Workspace To-Dos</title>
</head>
<body class="bg-slate-900 text-white p-6 font-sans">
  <h1 class="text-2xl font-bold mb-4">Google Workspace To-Dos</h1>
  <div class="space-y-3">
    <div class="p-4 bg-slate-800 rounded-2xl border border-slate-700">
      <span class="text-xs text-blue-400 font-semibold uppercase block mb-1">Emily's Comment</span>
      <p class="text-sm font-medium">Brand Guidelines Layout Update</p>
    </div>
  </div>
</body>
</html>`;

    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${childChatId}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      projectName: 'Branding',
      chatName: 'To-dos',
      type: 'inferred',
      taskType: 'inferred',
      associatedFileId: 'todo-card',
      associatedFileName: 'inferred_tasks.json',
      activeSpaceId: spaceId,
      messages: [
        { role: 'user', text: 'only tell me about google workspace items and change layout to dark cards' },
        { role: 'bot', text: 'I updated your To-dos widget to display Google Workspace items in a dark theme layout.' }
      ],
      sandboxFiles: [
        {
          id: 'todo-card',
          name: 'inferred_tasks.json',
          type: 'code',
          mimeType: 'application/json',
          isInferredTask: true
        },
        {
          id: `${childChatId}-file-0`,
          name: 'index.html',
          type: 'code',
          content: updatedHtmlTool,
          mimeType: 'text/html'
        }
      ]
    });

    if (res.status === 200) {
      console.log("   ✅ Vibe-coded tool output (index.html) successfully saved to child chat session");
    } else {
      console.error(`   ❌ Failed to update vibe-coded child chat. Status: ${res.status}`);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error during vibe coding turn test:", err.message);
    failures++;
  }

  // Test 4: Retrieve updated chat and verify index.html artifact presence
  console.log(`\n4. Verifying GET /api/chats/${childChatId} returns vibe-coded index.html tool...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${childChatId}`,
      method: 'GET'
    });

    if (res.status === 200 && res.data.sandboxFiles?.some(f => f.name === 'index.html')) {
      console.log("   ✅ Verified: GET /api/chats returned updated sandboxFiles containing vibe-coded index.html tool!");
    } else {
      console.error("   ❌ Failed: GET /api/chats missing vibe-coded index.html artifact:", res.data);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error fetching updated chat:", err.message);
    failures++;
  }

  // Test 5: Cleanup test chats
  console.log("\n5. Cleaning up test chats...");
  await request({ hostname: 'localhost', port: 3000, path: `/api/chats/${spaceId}`, method: 'DELETE' });
  await request({ hostname: 'localhost', port: 3000, path: `/api/chats/${childChatId}`, method: 'DELETE' });
  console.log("   ✅ Test chats cleaned up.");

  console.log("\n==================================================");
  if (failures === 0) {
    console.log("RESULT: ALL COMPREHENSIVE EDIT & VIBE CODING TESTS PASSED! ✅");
    process.exit(0);
  } else {
    console.error(`RESULT: ${failures} TEST(S) FAILED! ❌`);
    process.exit(1);
  }
}

runVerification();
