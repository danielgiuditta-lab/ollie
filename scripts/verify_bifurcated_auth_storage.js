import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function verifyBifurcation() {
  console.log("🚀 Running Verification: OAuth vs Mock Data DB Bifurcation...\n");

  const oauthEmail = 'danielgiuditta@google.com';
  const mockEmail = 'mock-user@example.com';

  const oauthSpaceId = `verify-oauth-space-${Date.now()}`;
  const mockSpaceId = `verify-mock-space-${Date.now()}`;

  // 1. Create an OAuth Space
  console.log(`1️⃣ Creating test OAuth space: ${oauthSpaceId} for ${oauthEmail}...`);
  const oauthRes = await fetch(`${BASE_URL}/api/chats/${oauthSpaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: "OAuth Verification Project",
      type: "space",
      userEmail: oauthEmail,
      messages: [{ role: 'user', text: 'OAuth message test' }],
      sandboxFiles: [{ name: 'oauth.doc', content: 'OAuth data content' }]
    })
  });
  if (!oauthRes.ok) throw new Error(`Failed to create OAuth space: ${oauthRes.status}`);
  console.log("   ✅ OAuth space saved successfully.");

  // 2. Create a Mock Data Space
  console.log(`2️⃣ Creating test Mock space: ${mockSpaceId} for ${mockEmail}...`);
  const mockRes = await fetch(`${BASE_URL}/api/chats/${mockSpaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: "Mock Verification Project",
      type: "space",
      userEmail: mockEmail,
      messages: [{ role: 'user', text: 'Mock message test' }],
      sandboxFiles: [{ name: 'mock.doc', content: 'Mock data content' }]
    })
  });
  if (!mockRes.ok) throw new Error(`Failed to create Mock space: ${mockRes.status}`);
  console.log("   ✅ Mock space saved successfully.");

  // 3. Fetch OAuth chats
  console.log(`\n3️⃣ Fetching chats for OAuth user: GET /api/user-chats/${oauthEmail}...`);
  const getOauthRes = await fetch(`${BASE_URL}/api/user-chats/${encodeURIComponent(oauthEmail)}`);
  if (!getOauthRes.ok) throw new Error(`Failed to fetch OAuth user chats: ${getOauthRes.status}`);
  const oauthChats = await getOauthRes.json();
  const oauthHasOAuthItem = oauthChats.some((c) => c.chatId === oauthSpaceId);
  const oauthHasMockItem = oauthChats.some((c) => c.chatId === mockSpaceId);

  console.log(`   Fetched ${oauthChats.length} item(s) for OAuth user.`);
  console.log(`   - Contains target OAuth space: ${oauthHasOAuthItem ? '✅ YES' : '❌ NO'}`);
  console.log(`   - Contains target Mock space:  ${!oauthHasMockItem ? '✅ NO (Isolated)' : '❌ YES (BLED THROUGH)'}`);

  if (!oauthHasOAuthItem || oauthHasMockItem) {
    throw new Error("❌ FAILURE: OAuth chats query failed isolation check!");
  }

  // 4. Fetch Mock chats
  console.log(`\n4️⃣ Fetching chats for Mock user: GET /api/user-chats/${mockEmail}...`);
  const getMockRes = await fetch(`${BASE_URL}/api/user-chats/${encodeURIComponent(mockEmail)}`);
  if (!getMockRes.ok) throw new Error(`Failed to fetch Mock user chats: ${getMockRes.status}`);
  const mockChats = await getMockRes.json();
  const mockHasMockItem = mockChats.some((c) => c.chatId === mockSpaceId);
  const mockHasOAuthItem = mockChats.some((c) => c.chatId === oauthSpaceId);

  console.log(`   Fetched ${mockChats.length} item(s) for Mock user.`);
  console.log(`   - Contains target Mock space:  ${mockHasMockItem ? '✅ YES' : '❌ NO'}`);
  console.log(`   - Contains target OAuth space: ${!mockHasOAuthItem ? '✅ NO (Isolated)' : '❌ YES (BLED THROUGH)'}`);

  if (!mockHasMockItem || mockHasOAuthItem) {
    throw new Error("❌ FAILURE: Mock chats query failed isolation check!");
  }

  // 5. Clean up verification test spaces
  console.log("\n🧹 Cleaning up test spaces...");
  await fetch(`${BASE_URL}/api/chats/${oauthSpaceId}`, { method: 'DELETE' });
  await fetch(`${BASE_URL}/api/chats/${mockSpaceId}`, { method: 'DELETE' });
  console.log("   ✅ Test cleanup complete.");

  console.log("\n🎉 ALL CHECKS PASSED: OAuth and Mock Data are 100% bifurcated and isolated!");
}

verifyBifurcation().catch(err => {
  console.error("\n❌ VERIFICATION ERROR:", err);
  process.exit(1);
});
