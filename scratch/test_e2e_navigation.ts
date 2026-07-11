import { resolveArtifactForChat } from '../src/utils/artifactResolver.ts';
import assert from 'assert';

async function runE2ENavigationSimulation() {
  console.log("=== Running End-to-End Navigation Simulation Test ===");

  const spaceId = `space_e2e_${Date.now()}`;
  const toolChatId = `${spaceId}-chat-tool`;
  const docChatId = `${spaceId}-chat-doc`;

  const availableFiles = [
    { id: 'slide-1', name: 'Ollie.gslides', mimeType: 'application/vnd.google-apps.presentation' },
    { id: 'tool-1', name: 'index.html', mimeType: 'text/html', content: '<h1>Kanban Board</h1>' },
    { id: 'doc-1', name: 'CodeMender PRD.doc', mimeType: 'application/vnd.google-apps.document', content: '# PRD details' }
  ];

  // 1. Persist Space Root
  await fetch(`http://localhost:3000/api/chats/${spaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: "Project Ollie",
      activeSpaceId: spaceId,
      sandboxFiles: availableFiles
    })
  });

  // 2. Persist Custom Tool Child Chat
  await fetch(`http://localhost:3000/api/chats/${toolChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: "Project Ollie",
      chatName: "Custom Tool",
      taskType: "site",
      associatedFileId: "tool-1",
      associatedFileName: "index.html",
      activeSpaceId: spaceId,
      sandboxFiles: availableFiles
    })
  });

  // 3. Persist Document Child Chat
  await fetch(`http://localhost:3000/api/chats/${docChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: "Project Ollie",
      chatName: "CodeMender PRD",
      taskType: "doc",
      associatedFileId: "doc-1",
      associatedFileName: "CodeMender PRD.doc",
      activeSpaceId: spaceId,
      sandboxFiles: availableFiles
    })
  });

  // 4. Test Navigation to Custom Tool Chat
  const toolRes = await fetch(`http://localhost:3000/api/chats/${toolChatId}`);
  const toolData = await toolRes.json();
  const resolvedToolFile = resolveArtifactForChat(availableFiles, toolData, toolData.taskType);

  assert.strictEqual(resolvedToolFile?.name, "index.html", "Custom tool chat MUST resolve to index.html");
  assert.notStrictEqual(resolvedToolFile?.name, "Ollie.gslides", "Custom tool chat MUST NOT resolve to Ollie.gslides");
  console.log("PASS: 1. Custom tool chat navigation resolved cleanly to index.html");

  // 5. Test Navigation to Document Chat
  const docRes = await fetch(`http://localhost:3000/api/chats/${docChatId}`);
  const docData = await docRes.json();
  const resolvedDocFile = resolveArtifactForChat(availableFiles, docData, docData.taskType);

  assert.strictEqual(resolvedDocFile?.name, "CodeMender PRD.doc", "Document chat MUST resolve to CodeMender PRD.doc");
  assert.notStrictEqual(resolvedDocFile?.name, "Ollie.gslides", "Document chat MUST NOT resolve to Ollie.gslides");
  console.log("PASS: 2. Document chat navigation resolved cleanly to CodeMender PRD.doc");

  console.log("\nALL END-TO-END SIMULATION TESTS PASSED 100%!");
}

runE2ENavigationSimulation().catch(err => {
  console.error("Simulation test failed:", err);
  process.exit(1);
});
