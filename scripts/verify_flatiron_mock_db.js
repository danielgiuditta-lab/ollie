import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function verifyPolicyExpertMockData() {
  console.log("🚀 Verifying Policy Expert & Op-Ed Columnist Mock Data & DB Separation...\n");

  const mockEmail = 'mock-user@example.com';
  const oauthEmail = 'danielgiuditta@google.com';

  // 1. Fetch Mock User Chats
  console.log(`1️⃣ Fetching chats for Mock User (${mockEmail})...`);
  const mockRes = await fetch(`${BASE_URL}/api/user-chats/${encodeURIComponent(mockEmail)}`);
  if (!mockRes.ok) throw new Error(`Failed to fetch mock chats: ${mockRes.status}`);
  const mockChats = await mockRes.json();

  console.log(`   Found ${mockChats.length} chat/space entries for Mock User.`);

  // Verify spaces
  const spaceIds = [
    'space-aegis-ai',
    'space-veritas-social',
    'space-nexus-pay'
  ];

  for (const sId of spaceIds) {
    const found = mockChats.find(c => c.chatId === sId);
    if (!found) {
      throw new Error(`❌ Missing required space: ${sId} in mock database!`);
    }
    console.log(`   ✅ Found Space: "${found.projectName}" (${found.chatId})`);
  }

  // Verify slide deck inferred tasks
  const deckTasks = mockChats.filter(c => 
    c.taskType === 'inferred' && 
    c.associatedFileName && 
    c.associatedFileName.includes('.gslides')
  );

  console.log(`\n2️⃣ Verifying Keynote & Briefing Slide Deck Inferred Tasks...`);
  console.log(`   Found ${deckTasks.length} inferred slide deck update task(s):`);
  deckTasks.forEach(t => {
    console.log(`   - 📌 [${t.chatName}] -> Deck: ${t.associatedFileName} (Space: ${t.activeSpaceId})`);
  });

  if (deckTasks.length < 3) {
    throw new Error(`❌ Expected at least 3 slide deck update tasks, found ${deckTasks.length}`);
  }

  // 3. Verify OAuth User Data Isolation
  console.log(`\n3️⃣ Verifying OAuth User (${oauthEmail}) Data Isolation...`);
  const oauthRes = await fetch(`${BASE_URL}/api/user-chats/${encodeURIComponent(oauthEmail)}`);
  if (!oauthRes.ok) throw new Error(`Failed to fetch OAuth chats: ${oauthRes.status}`);
  const oauthChats = await oauthRes.json();

  const leakedSpaces = oauthChats.filter(c => c.chatId && (c.chatId.startsWith('space-aegis-') || c.chatId.startsWith('space-veritas-') || c.chatId.startsWith('space-nexus-')));
  console.log(`   OAuth user total chats: ${oauthChats.length}`);
  console.log(`   Leaked Policy Expert spaces in OAuth DB: ${leakedSpaces.length}`);

  if (leakedSpaces.length > 0) {
    throw new Error(`❌ SECURITY BREACH: Policy Expert mock spaces leaked into OAuth database!`);
  }

  console.log("\n🎉 ALL CHECKS PASSED SUCCESSFULLY!");
  console.log("Policy Expert policy opinions, op-ed decks, and high-level issue tracking tools are fully isolated in the Mock Database!");
}

verifyPolicyExpertMockData().catch(err => {
  console.error("\n❌ VERIFICATION ERROR:", err);
  process.exit(1);
});
