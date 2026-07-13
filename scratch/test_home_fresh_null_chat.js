import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const testHomeId = 'home_test_user_verification';

async function runHomeNullChatVerification() {
  console.log('🚀 Running Home Fresh Null Chat Verification Script...\n');

  // Step 1: POST to Home chat endpoint with pinnedArtifactIds and messages: []
  const postRes = await fetch(`${BASE_URL}/api/chats/${testHomeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'Home Dashboard',
      messages: [],
      pinnedArtifactIds: ['todo-card']
    })
  });

  if (!postRes.ok) {
    console.error(`❌ POST /api/chats/${testHomeId} failed with status ${postRes.status}`);
    process.exit(1);
  }
  const postData = await postRes.json();
  console.log('✅ POST /api/chats response:', postData);

  // Step 2: GET Home chat endpoint to verify pinnedArtifactIds persisted and messages is empty
  const getRes = await fetch(`${BASE_URL}/api/chats/${testHomeId}`);
  if (!getRes.ok) {
    console.error(`❌ GET /api/chats/${testHomeId} failed with status ${getRes.status}`);
    process.exit(1);
  }
  const getData = await getRes.json();
  console.log('✅ GET /api/chats data:', getData);

  if (Array.isArray(getData.messages) && getData.messages.length > 0) {
    console.error('❌ FAILURE: Home chat returned non-empty messages in response!');
    process.exit(1);
  }

  if (!getData.pinnedArtifactIds || !getData.pinnedArtifactIds.includes('todo-card')) {
    console.error('❌ FAILURE: Pinned artifacts missing from Home chat data!');
    process.exit(1);
  }

  console.log('\n🎉 ALL HOME NULL CHAT VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runHomeNullChatVerification().catch(err => {
  console.error('❌ Verification script error:', err);
  process.exit(1);
});
