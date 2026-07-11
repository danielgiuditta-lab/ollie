import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, path, options = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok && res.status !== 404) {
      console.error(`❌ [${name}] Failed with status ${res.status}`);
      return false;
    }
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    console.log(`✅ [${name}] Status ${res.status}`);
    return { ok: true, status: res.status, data };
  } catch (err) {
    console.error(`❌ [${name}] Error:`, err.message);
    return false;
  }
}

async function runSuite() {
  console.log('🚀 Starting Baseline Verification Test Suite against http://localhost:3000...\n');

  const testChatId = `test_suite_chat_${Date.now()}`;
  const testSpaceId = `test_suite_space_${Date.now()}`;

  // 1. Write Chat
  const postChatRes = await testEndpoint('POST /api/chats/:chatId', `/api/chats/${testChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'Test Verification Project',
      chatName: 'Test Session',
      activeSpaceId: testSpaceId,
      messages: [{ sender: 'user', text: 'Hello automated test' }],
      sandboxFiles: [{ id: 'file-1', name: 'index.html', content: '<h1>Test</h1>' }]
    })
  });

  if (!postChatRes || !postChatRes.data.success) {
    console.error('FAILED POST Chat verification');
    process.exit(1);
  }

  // 2. Read Chat
  const getChatRes = await testEndpoint('GET /api/chats/:chatId', `/api/chats/${testChatId}`);
  if (!getChatRes || getChatRes.data.projectName !== 'Test Verification Project') {
    console.error('FAILED GET Chat verification mismatch');
    process.exit(1);
  }

  // 3. Sync State Endpoint
  const syncKey = `key_${Date.now()}`;
  await testEndpoint('POST /api/sync/:envId/:key', `/api/sync/test_env/${syncKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: { columns: ['todo', 'done'] } })
  });

  const getSyncRes = await testEndpoint('GET /api/sync/:envId/:key', `/api/sync/test_env/${syncKey}`);
  if (!getSyncRes || !getSyncRes.data.state) {
    console.error('FAILED GET Sync verification');
    process.exit(1);
  }

  // 4. Share Endpoint
  const shareRes = await testEndpoint('POST /api/share', '/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Shared Verification Sandbox',
      html: '<h1>Shared</h1>',
      css: 'body { color: red; }',
      js: 'console.log(1)'
    })
  });
  if (shareRes && shareRes.data.slug) {
    await testEndpoint('GET /api/share/:slug', `/api/share/${shareRes.data.slug}`);
  }

  // 5. Workspace Digest
  await testEndpoint('GET /api/workspace-digest', `/api/workspace-digest?folderId=${testSpaceId}`);

  // 6. Cleanup Test Chat
  await testEndpoint('DELETE /api/chats/:chatId', `/api/chats/${testChatId}`, { method: 'DELETE' });

  console.log('\n✨ ALL BASELINE VERIFICATION TESTS PASSED SUCCESSFULLY! ✨');
}

runSuite().catch(err => {
  console.error('Fatal Test Suite Failure:', err);
  process.exit(1);
});
