import fetch from 'node-fetch';
import { findAssociatedChatForFile, resolveArtifactForChat } from '../src/utils/artifactResolver';

const BASE_URL = 'http://localhost:3000';

async function runPermanentArchitecturalTest() {
  console.log("====================================================");
  console.log("🚀 ARCHITECTURAL SOLUTION VERIFICATION SUITE");
  console.log("====================================================\n");

  const timestamp = Date.now();
  const spaceId = `space_perm_${timestamp}`;
  const toolChatId = `${spaceId}-chat-tool`;
  const docChatId = `${spaceId}-chat-doc`;
  const toolFileId = `${spaceId}-file-html`;
  const docFileId = `${spaceId}-file-doc`;

  // Step 1: Initialize Parent Space
  console.log("1. Initializing Parent Space Container on Backend...");
  const spacePayload = {
    projectName: "Permanent Architecture Test Space",
    type: "space",
    activeSpaceId: spaceId,
    userEmail: "dan1@c.googlers.com",
    sandboxFiles: [
      { id: toolFileId, name: "index.html", content: "<html><body>Tool App</body></html>", chatId: toolChatId },
      { id: docFileId, name: "PRD.doc", content: "## Product Requirements", chatId: docChatId }
    ],
    pinnedArtifactIds: [toolFileId]
  };

  const spaceRes = await fetch(`${BASE_URL}/api/chats/${spaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(spacePayload)
  });
  if (!spaceRes.ok) throw new Error(`Failed to save space: ${spaceRes.statusText}`);
  console.log("   ✅ Parent space initialized with pinned artifact ID:", spacePayload.pinnedArtifactIds);

  // Step 2: Initialize Child Tool Chat
  console.log("\n2. Initializing Child Tool Chat Session...");
  const toolChatPayload = {
    projectName: "Permanent Architecture Test Space",
    chatName: "Custom Tool Chat",
    type: "chat",
    taskType: "site",
    associatedFileId: toolFileId,
    associatedFileName: "index.html",
    activeSpaceId: spaceId,
    userEmail: "dan1@c.googlers.com",
    messages: [{ role: 'user', content: 'Build a custom tool' }, { role: 'model', content: 'Here is your tool' }],
    sandboxFiles: [{ id: toolFileId, name: "index.html", content: "<html><body>Tool App</body></html>" }]
  };
  await fetch(`${BASE_URL}/api/chats/${toolChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toolChatPayload)
  });
  console.log("   ✅ Child Tool Chat created with associatedFileId:", toolFileId);

  // Step 3: Initialize Child Doc Chat
  console.log("\n3. Initializing Child Doc Chat Session...");
  const docChatPayload = {
    projectName: "Permanent Architecture Test Space",
    chatName: "PRD Document Chat",
    type: "chat",
    taskType: "doc",
    associatedFileId: docFileId,
    associatedFileName: "PRD.doc",
    activeSpaceId: spaceId,
    userEmail: "dan1@c.googlers.com",
    messages: [{ role: 'user', content: 'Draft PRD' }, { role: 'model', content: 'Here is PRD' }],
    sandboxFiles: [{ id: docFileId, name: "PRD.doc", content: "## Product Requirements" }]
  };
  await fetch(`${BASE_URL}/api/chats/${docChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(docChatPayload)
  });
  console.log("   ✅ Child Doc Chat created with associatedFileId:", docFileId);

  // Step 4: Test Reverse Lookup (Library Artifact Selection -> Owning Chat Resolution)
  console.log("\n4. Testing Reverse Lookup (findAssociatedChatForFile)...");
  const recentTasks = [
    { id: spaceId, activeSpaceId: spaceId, type: 'space', pinnedArtifactIds: [toolFileId] },
    { id: toolChatId, activeSpaceId: spaceId, taskType: 'site', associatedFileId: toolFileId, associatedFileName: 'index.html', chatName: 'Custom Tool Chat' },
    { id: docChatId, activeSpaceId: spaceId, taskType: 'doc', associatedFileId: docFileId, associatedFileName: 'PRD.doc', chatName: 'PRD Document Chat' }
  ];

  const clickedLibraryDoc = { id: docFileId, name: 'PRD.doc' };
  const resolvedDocChat = findAssociatedChatForFile(clickedLibraryDoc, recentTasks);
  if (!resolvedDocChat || resolvedDocChat.id !== docChatId) {
    throw new Error(`Reverse lookup failed for PRD.doc! Expected ${docChatId}, got ${resolvedDocChat?.id}`);
  }
  console.log("   ✅ Reverse lookup succeeded: Clicked PRD.doc directly resolved to owning chat:", resolvedDocChat.id);

  const clickedLibraryTool = { id: toolFileId, name: 'index.html' };
  const resolvedToolChat = findAssociatedChatForFile(clickedLibraryTool, recentTasks);
  if (!resolvedToolChat || resolvedToolChat.id !== toolChatId) {
    throw new Error(`Reverse lookup failed for index.html! Expected ${toolChatId}, got ${resolvedToolChat?.id}`);
  }
  console.log("   ✅ Reverse lookup succeeded: Clicked index.html directly resolved to owning chat:", resolvedToolChat.id);

  // Step 5: Simulate Page Reload Hydration & Partial Metadata Preservation Guard
  console.log("\n5. Simulating Partial Post Save (Preservation Middleware Guard)...");
  // Simulate stream completion sending partial body without explicitly passing associatedFileId or pinnedArtifactIds
  await fetch(`${BASE_URL}/api/chats/${toolChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Build a custom tool' }, { role: 'model', content: 'Updated tool code' }]
    })
  });

  const getToolRes = await fetch(`${BASE_URL}/api/chats/${toolChatId}`);
  const toolData: any = await getToolRes.json();
  if (toolData.associatedFileId !== toolFileId || toolData.taskType !== 'site') {
    throw new Error(`Metadata preservation guard failed! Expected associatedFileId=${toolFileId}, got ${toolData.associatedFileId}`);
  }
  console.log("   ✅ Metadata preservation guard succeeded! Stream save preserved associatedFileId:", toolData.associatedFileId);

  // Step 6: Verify Space Pins Integrity After Cold Fetch
  console.log("\n6. Verifying Space Pins & Cold Fetch Integrity...");
  const getSpaceRes = await fetch(`${BASE_URL}/api/chats/${spaceId}`);
  const spaceData: any = await getSpaceRes.json();
  if (!spaceData.pinnedArtifactIds || !spaceData.pinnedArtifactIds.includes(toolFileId)) {
    throw new Error(`Space pins dropped after reload! Expected ${toolFileId} in pinnedArtifactIds`);
  }
  console.log("   ✅ Cold fetch space pins intact:", spaceData.pinnedArtifactIds);

  console.log("\n====================================================");
  console.log("🎉 ALL ARCHITECTURAL SOLUTION VERIFICATION TESTS PASSED!");
  console.log("====================================================");
}

runPermanentArchitecturalTest().catch(err => {
  console.error("\n❌ Test Suite Failed:", err);
  process.exit(1);
});
