import assert from 'assert';

async function testBackendPersistence() {
  console.log("=== Running Integration Test for Backend Chat Persistence ===");
  
  const testSpaceId = `space_test_${Date.now()}`;
  const testChildChatId = `${testSpaceId}-chat-${Date.now()}`;

  const payload = {
    projectName: "Ollie Test Workspace",
    chatName: "CodeMender PRD",
    type: "workspace",
    taskType: "doc",
    associatedFileId: "created-doc-9999",
    associatedFileName: "CodeMender PRD.doc",
    activeSpaceId: testSpaceId,
    messages: [
      { role: "bot", text: "How can I help with your doc?" },
      { role: "user", text: "write a prd for the project" }
    ],
    sandboxFiles: [
      {
        name: "CodeMender PRD.doc",
        type: "code",
        content: "# CodeMender PRD\n\nContent details...",
        id: "created-doc-9999",
        isDocJourney: true
      }
    ]
  };

  // 1. Post to backend endpoint /api/chats/:chatId
  const postRes = await fetch(`http://localhost:3000/api/chats/${testChildChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(postRes.status, 200, `POST /api/chats/${testChildChatId} should return HTTP 200`);
  console.log("PASS: 1. POST /api/chats/:chatId persisted successfully");

  // 2. Fetch back from /api/chats/:chatId
  const getRes = await fetch(`http://localhost:3000/api/chats/${testChildChatId}`);
  assert.strictEqual(getRes.status, 200, `GET /api/chats/${testChildChatId} should return HTTP 200`);
  
  const fetchedChat = await getRes.json();
  assert.strictEqual(fetchedChat.chatName, "CodeMender PRD", "Fetched chatName must equal CodeMender PRD");
  assert.strictEqual(fetchedChat.taskType, "doc", "Fetched taskType must equal doc");
  assert.strictEqual(fetchedChat.associatedFileId, "created-doc-9999", "Fetched associatedFileId must equal created-doc-9999");
  assert.strictEqual(fetchedChat.associatedFileName, "CodeMender PRD.doc", "Fetched associatedFileName must equal CodeMender PRD.doc");
  assert.strictEqual(fetchedChat.sandboxFiles.length, 1, "Fetched sandboxFiles length must equal 1");
  assert.strictEqual(fetchedChat.sandboxFiles[0].name, "CodeMender PRD.doc", "Fetched artifact name must equal CodeMender PRD.doc");

  console.log("PASS: 2. GET /api/chats/:chatId verified all fields and associated artifacts!");
  console.log("\nALL BACKEND PERSISTENCE TESTS PASSED PERFECTLY!");
}

testBackendPersistence().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
