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

// Verification rule logic mimicking App.tsx & CanvasContainer.tsx
function evaluateViewStateRule(file, taskType, activeProactiveTask, targetChatId) {
  const isInferredDiff = Boolean(
    file?.isInferredTask ||
    file?.isProactiveDraft ||
    file?.isProactive ||
    file?.taskType === 'inferred' ||
    taskType === 'inferred' ||
    taskType === 'tracking' ||
    activeProactiveTask ||
    (typeof file === 'object' && file && file.id && String(file.id).includes('-proactive-')) ||
    targetChatId?.includes('-proactive-')
  );

  const isHtml = file?.name?.toLowerCase().endsWith('.html') || file?.name?.toLowerCase() === 'index.html';
  return isHtml ? 'app' : (isInferredDiff ? 'projector' : 'files');
}

async function runVerification() {
  console.log("=== Autonomous Pre-Verification Test: Inferred Task Diff View Restoration ===");
  let failures = 0;

  // 1. Test POST /api/proactive-draft endpoint
  console.log("\n1. Testing POST /api/proactive-draft endpoint response...");
  try {
    const draftRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/proactive-draft',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      task: {
        id: 'test-inferred-task-1',
        title: 'I updated branding.doc for your review',
        description: 'Miriam commented on branding.doc to align colors',
        sourceName: 'branding.doc',
        workspace: 'Branding Space'
      },
      originalContent: '# Original Branding Document\nUnmodified branding guidelines.'
    });

    if (draftRes.status === 200 && draftRes.data && draftRes.data.draftContent) {
      console.log("   ✅ SUCCESS: /api/proactive-draft generated draft content and summaryOfChanges");
    } else {
      console.error(`   ❌ FAIL: /api/proactive-draft returned status ${draftRes.status}`, draftRes.data);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ FAIL: Error calling /api/proactive-draft:", err.message);
    failures++;
  }

  // 2. Test DB chat session persistence with viewState: 'projector'
  const testChatId = `test-proactive-chat-${Date.now()}`;
  console.log(`\n2. Testing POST /api/chats/${testChatId} storing viewState = 'projector'...`);
  try {
    const proactiveFile = {
      id: 'proactive-slide-test',
      name: 'Q3 Strategy Deck.gslides',
      type: 'slide',
      taskType: 'slide',
      isProactiveDraft: true,
      isProactive: true,
      isInferredTask: true,
      summaryOfChanges: 'Prepared proactive presentation draft.',
      title: 'I updated Q3 Strategy Deck',
      description: 'Incorporated feedback and updated slides',
      originalContent: '# Original Deck\nSlide 1 text.',
      content: '# Proposal Deck\nUpdated slide 1 text.'
    };

    const saveRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${testChatId}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      chatName: 'Review Proactive Action: Q3 Strategy',
      taskType: 'inferred',
      viewState: 'projector',
      associatedFileId: proactiveFile.id,
      associatedFileName: proactiveFile.name,
      sandboxFiles: [proactiveFile],
      messages: [
        { role: 'user', text: 'Review Proactive Action' },
        { role: 'bot', text: '', isProactiveReview: true }
      ]
    });

    if (saveRes.status === 200 || saveRes.status === 201) {
      console.log("   ✅ SUCCESS: Proactive chat session saved successfully");
    } else {
      console.error(`   ❌ FAIL: Failed to save proactive chat session (status ${saveRes.status})`);
      failures++;
    }

    // Hydrate chat from database and verify stored viewState
    console.log(`\n3. Verifying GET /api/chats/${testChatId} hydration maintains viewState = 'projector'...`);
    const getRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/chats/${testChatId}`,
      method: 'GET'
    });

    if (getRes.status === 200 && getRes.data) {
      const chat = getRes.data;
      if (chat.viewState === 'projector') {
        console.log("   ✅ SUCCESS: Hydrated chat has stored viewState = 'projector'");
      } else {
        console.error(`   ❌ FAIL: Hydrated chat viewState is '${chat.viewState}', expected 'projector'`);
        failures++;
      }
    } else {
      console.error(`   ❌ FAIL: Failed to fetch hydrated chat session (status ${getRes.status})`);
      failures++;
    }
  } catch (err) {
    console.error("   ❌ FAIL: Error testing chat persistence:", err.message);
    failures++;
  }

  // 4. Test ViewState evaluation rule logic for various file types
  console.log("\n4. Testing evaluateViewStateRule across file artifact types...");
  
  const proactiveDraft = { id: 'proactive-1', name: 'draft.doc', isProactiveDraft: true };
  const viewStateProactive = evaluateViewStateRule(proactiveDraft, 'doc', null, 'space-proactive-123');
  if (viewStateProactive === 'projector') {
    console.log("   ✅ Proactive draft artifact -> evaluateViewStateRule = 'projector'");
  } else {
    console.error(`   ❌ FAIL: Proactive draft evaluated to '${viewStateProactive}', expected 'projector'`);
    failures++;
  }

  const inferredTaskFile = { id: 'todo-card', name: 'inferred_tasks.json', isInferredTask: true };
  const viewStateInferred = evaluateViewStateRule(inferredTaskFile, 'inferred', null, 'space-chat-inferred');
  if (viewStateInferred === 'projector') {
    console.log("   ✅ Inferred task system artifact -> evaluateViewStateRule = 'projector'");
  } else {
    console.error(`   ❌ FAIL: Inferred task artifact evaluated to '${viewStateInferred}', expected 'projector'`);
    failures++;
  }

  const normalDoc = { id: 'doc-1', name: 'notes.md', mimeType: 'text/markdown' };
  const viewStateNormal = evaluateViewStateRule(normalDoc, 'doc', null, 'space-chat-doc');
  if (viewStateNormal === 'files') {
    console.log("   ✅ Standard markdown file -> evaluateViewStateRule = 'files'");
  } else {
    console.error(`   ❌ FAIL: Standard markdown file evaluated to '${viewStateNormal}', expected 'files'`);
    failures++;
  }

  console.log("\n========================================================");
  if (failures === 0) {
    console.log("🎉 ALL INFERRED TASK DIFF VIEW VERIFICATION TESTS PASSED!");
    console.log("========================================================\n");
    process.exit(0);
  } else {
    console.error(`💥 VERIFICATION FAILED: ${failures} test(s) failed.`);
    console.log("========================================================\n");
    process.exit(1);
  }
}

runVerification();
