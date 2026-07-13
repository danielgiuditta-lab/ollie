const BASE_URL = 'http://localhost:3000';

async function runVerification() {
  console.log("==========================================");
  console.log("🧪 VERIFYING ONE-OFF CHAT DELETION");
  console.log("==========================================\n");

  const spaceId = `space_delete_test_${Date.now()}`;
  const childChatId = `${spaceId}-chat-${Date.now()}`;

  // 1. Create a child chat in DB
  console.log("1. Creating child chat session in DB...");
  const postRes = await fetch(`${BASE_URL}/api/chats/${childChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'Test Space',
      chatName: 'One-off Analysis Session',
      activeSpaceId: spaceId,
      taskType: 'doc',
      messages: [{ role: 'user', text: 'Analyze report' }]
    })
  });

  if (!postRes.ok) {
    console.error("❌ FAILED to create child chat");
    process.exit(1);
  }
  console.log("   ✅ Child chat created successfully.");

  // 2. Read back chat to verify it exists
  const getRes = await fetch(`${BASE_URL}/api/chats/${childChatId}`);
  if (!getRes.ok) {
    console.error("❌ FAILED to fetch created chat");
    process.exit(1);
  }
  const chatData = await getRes.json();
  console.log("   ✅ Child chat retrieved:", chatData.chatName);

  // 3. Delete the child chat via DELETE /api/chats/:chatId
  console.log("\n2. Executing DELETE for child chat...");
  const deleteRes = await fetch(`${BASE_URL}/api/chats/${childChatId}`, {
    method: 'DELETE'
  });

  if (!deleteRes.ok) {
    console.error("❌ FAILED to delete child chat");
    process.exit(1);
  }
  console.log("   ✅ Server returned successful deletion.");

  // 4. Verify chat no longer exists in DB (404)
  const getAfterDeleteRes = await fetch(`${BASE_URL}/api/chats/${childChatId}`);
  if (getAfterDeleteRes.status === 404) {
    console.log("   ✅ Confirmed 404 response after deletion.");
  } else {
    console.error("❌ ERROR: Chat still exists after deletion! Status:", getAfterDeleteRes.status);
    process.exit(1);
  }

  console.log("\n🎉 ONE-OFF CHAT DELETION TEST PASSED!");
}

runVerification();
