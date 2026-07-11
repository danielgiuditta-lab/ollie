import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, path, options = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
    
    if (!res.ok) {
      console.log(`ℹ️ [${name}] Status ${res.status}`);
      return { ok: false, status: res.status, data };
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

  if (!postChatRes.ok || !postChatRes.data.success) {
    console.error('FAILED POST Chat verification');
    process.exit(1);
  }

  // 2. Read Chat
  const getChatRes = await testEndpoint('GET /api/chats/:chatId', `/api/chats/${testChatId}`);
  if (!getChatRes.ok || getChatRes.data.projectName !== 'Test Verification Project') {
    console.error('FAILED GET Chat verification mismatch');
    process.exit(1);
  }

  // 3. Sync State Endpoint
  const syncKey = `key_${Date.now()}`;
  await testEndpoint('POST /api/sync/:envId/:key', `/api/sync/test_env/${syncKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { columns: ['todo', 'done'] } })
  });

  const getSyncRes = await testEndpoint('GET /api/sync/:envId/:key', `/api/sync/test_env/${syncKey}`);
  if (!getSyncRes.ok || !getSyncRes.data || !getSyncRes.data.data) {
    console.error('FAILED GET Sync verification');
    process.exit(1);
  }

  // 4. Share Endpoint
  const shareRes = await testEndpoint('POST /api/share', '/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      envId: 'test_env_123',
      workspaceName: 'Shared Verification Sandbox',
      files: [{ name: 'index.html', content: '<h1>Shared</h1>' }]
    })
  });
  if (!shareRes.ok || !shareRes.data.slug) {
    console.error('FAILED POST Share verification');
    process.exit(1);
  }

  const getShareRes = await testEndpoint('GET /api/share/:slug', `/api/share/${shareRes.data.slug}`);
  if (!getShareRes.ok || !getShareRes.data.envId) {
    console.error('FAILED GET Share verification');
    process.exit(1);
  }

  // 5. Workspace Digest Endpoint (Requires authorization header check)
  const digestRes = await testEndpoint('GET /api/workspace-digest', `/api/workspace-digest?folderId=${testSpaceId}`);
  if (digestRes.status !== 401 && !digestRes.ok) {
    console.error('FAILED GET Workspace digest verification unexpected status', digestRes.status);
    process.exit(1);
  }

  // 6. Cleanup Test Chat
  const delChatRes = await testEndpoint('DELETE /api/chats/:chatId', `/api/chats/${testChatId}`, { method: 'DELETE' });
  if (!delChatRes.ok) {
    console.error('FAILED DELETE Chat verification');
    process.exit(1);
  }

  console.log('\n✨ ALL BASELINE VERIFICATION TESTS PASSED SUCCESSFULLY! ✨');
}

runSuite().catch(err => {
  console.error('Fatal Test Suite Failure:', err);
  process.exit(1);
});
