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

  // Test 3: Simulate Parametric Vibe-Coding Turn in Child Chat (Modifying inferred_tasks.json directly)
  console.log(`\n3. Simulating Parametric Vibe-Coding turn: User requests header & source scope adjustment...`);
  try {
    const updatedJsonContent = JSON.stringify({
      title: "Email-Sourced To-dos",
      headerHeight: 40,
      sourceScope: "Emails Only",
      summary: "Email agenda items",
      immediateActions: [
        {
          id: "todo-email-1",
          title: "Review Pricing Proposal Thread",
          description: "Daniel requested feedback on the Q3 pricing deck",
          sourceName: "Daniel (Gmail)",
          sourceMimeType: "application/vnd.google-apps.mail",
          personName: "Daniel Giuditta",
          personAvatar: "",
          status: "done"
        }
      ]
    }, null, 2);

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
        { role: 'user', text: 'make the header 40px and scope sources to emails' },
        { role: 'bot', text: 'I updated your To-dos configuration: set header height to 40px, title to "Email-Sourced To-dos", and scoped sources to emails.' }
      ],
      sandboxFiles: [
        {
          id: 'todo-card',
          name: 'inferred_tasks.json',
          type: 'code',
          mimeType: 'application/json',
          content: updatedJsonContent,
          isInferredTask: true,
          taskType: 'inferred'
        }
      ]
    });

    if (res.status === 200) {
      console.log("   ✅ Parametric JSON updates (title, headerHeight, sourceScope) successfully saved to child chat session");
    } else {
      console.error(`   ❌ Failed to update parametric child chat JSON. Status: ${res.status}`);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ Error during parametric JSON turn test:", err.message);
    failures++;
  }

  // Test 4: Retrieve updated chat and verify inferred_tasks.json artifact content
  console.log(`\n4. Verifying GET /api/chats/${childChatId} returns updated inferred_tasks.json content...`);
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${childChatId}`,
      method: 'GET'
    });

    const file = res.data.sandboxFiles?.find(f => f.name === 'inferred_tasks.json');
    if (res.status === 200 && file && file.content && file.content.includes('Email-Sourced To-dos') && file.content.includes('headerHeight')) {
      console.log("   ✅ Verified: GET /api/chats returned updated inferred_tasks.json containing parametric metadata (title & headerHeight)!");
    } else {
      console.error("   ❌ Failed: GET /api/chats missing updated inferred_tasks.json content:", res.data);
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
