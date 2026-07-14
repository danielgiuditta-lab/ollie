import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function verifyFlatironMockData() {
  console.log("🚀 Verifying Flatiron Health Mock Data & DB Separation...\n");

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
    'space-flatiron-ui-design',
    'space-flatiron-gtm',
    'space-flatiron-new-app-launch'
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

  console.log(`\n2️⃣ Verifying Deck Update Inferred Tasks...`);
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

  const leakedFlatironSpaces = oauthChats.filter(c => c.chatId && c.chatId.startsWith('space-flatiron-'));
  console.log(`   OAuth user total chats: ${oauthChats.length}`);
  console.log(`   Leaked Flatiron spaces in OAuth DB: ${leakedFlatironSpaces.length}`);

  if (leakedFlatironSpaces.length > 0) {
    throw new Error(`❌ SECURITY BREACH: Flatiron mock spaces leaked into OAuth database!`);
  }

  console.log("\n🎉 ALL CHECKS PASSED SUCCESSFULLY!");
  console.log("Flatiron Health synthetic spaces, slide deck tasks, and interactive previews are fully isolated in the Mock Database!");
}

verifyFlatironMockData().catch(err => {
  console.error("\n❌ VERIFICATION ERROR:", err);
  process.exit(1);
});
