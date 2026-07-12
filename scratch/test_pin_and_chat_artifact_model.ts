import fs from 'fs';
import path from 'path';
import { resolveArtifactForChat } from '../src/utils/artifactResolver';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log("==========================================");
  console.log("🧪 RUNNING COMPREHENSIVE SYSTEM VERIFICATION");
  console.log("==========================================\n");

  const spaceId = `space_verify_${Date.now()}`;
  const childChatId = `${spaceId}-chat-${Date.now()}`;
  const artifactId1 = `artifact_doc_${Date.now()}`;
  const artifactId2 = `artifact_site_${Date.now()}`;

  // ----------------------------------------------------
  // TEST 1: Post initial space with pinnedArtifactIds
  // ----------------------------------------------------
  console.log("1. Testing initial space creation with pinned artifacts...");
  const createSpaceRes = await fetch(`${BASE_URL}/api/chats/${spaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'Master Verification Space',
      activeSpaceId: spaceId,
      pinnedArtifactIds: [artifactId1, artifactId2],
      sandboxFiles: [
        { id: artifactId1, name: 'requirements.doc', content: '# Requirements' },
        { id: artifactId2, name: 'index.html', content: '<h1>App</h1>' }
      ]
    })
  });
  const createSpaceData = await createSpaceRes.json();
  console.log("   Space POST response:", createSpaceData);

  // Read back space
  const readSpaceRes1 = await fetch(`${BASE_URL}/api/chats/${spaceId}`);
  const spaceData1 = await readSpaceRes1.json();
  if (JSON.stringify(spaceData1.pinnedArtifactIds) !== JSON.stringify([artifactId1, artifactId2])) {
    throw new Error(`TEST 1 FAILED: Expected pins [${artifactId1}, ${artifactId2}], got: ${JSON.stringify(spaceData1.pinnedArtifactIds)}`);
  }
  console.log("   ✅ Initial space pins verified in DB:", spaceData1.pinnedArtifactIds);

  // ----------------------------------------------------
  // TEST 2: Post update without pinnedArtifactIds (Simulating saveChatToDb)
  // ----------------------------------------------------
  console.log("\n2. Testing saveChatToDb update WITHOUT pinnedArtifactIds in payload...");
  const updateSpaceRes = await fetch(`${BASE_URL}/api/chats/${spaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'Master Verification Space Updated',
      activeSpaceId: spaceId,
      messages: [{ role: 'user', text: 'Updating message without sending pins' }]
    })
  });
  await updateSpaceRes.json();

  // Read back space to confirm pins were NOT erased
  const readSpaceRes2 = await fetch(`${BASE_URL}/api/chats/${spaceId}`);
  const spaceData2 = await readSpaceRes2.json();
  if (JSON.stringify(spaceData2.pinnedArtifactIds) !== JSON.stringify([artifactId1, artifactId2])) {
    throw new Error(`TEST 2 FAILED: Pins were erased! Got: ${JSON.stringify(spaceData2.pinnedArtifactIds)}`);
  }
  console.log("   ✅ Pins were preserved after message update without pins payload:", spaceData2.pinnedArtifactIds);

  // ----------------------------------------------------
  // TEST 3: Saving a child chat and auto-syncing parent space
  // ----------------------------------------------------
  console.log("\n3. Testing child chat save and parent space auto-sync...");
  const saveChildRes = await fetch(`${BASE_URL}/api/chats/${childChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'Master Verification Space',
      chatName: 'Custom Tool Session',
      taskType: 'site',
      associatedFileId: artifactId2,
      associatedFileName: 'index.html',
      activeSpaceId: spaceId,
      messages: [{ role: 'bot', text: 'Building custom tool' }],
      sandboxFiles: [{ id: artifactId2, name: 'index.html', content: '<h1>Updated App Code</h1>' }]
    })
  });
  await saveChildRes.json();

  // Read back parent space to verify files merged AND pins preserved
  const readSpaceRes3 = await fetch(`${BASE_URL}/api/chats/${spaceId}`);
  const spaceData3 = await readSpaceRes3.json();
  if (JSON.stringify(spaceData3.pinnedArtifactIds) !== JSON.stringify([artifactId1, artifactId2])) {
    throw new Error(`TEST 3 FAILED: Parent space pins erased during child sync! Got: ${JSON.stringify(spaceData3.pinnedArtifactIds)}`);
  }
  const hasUpdatedFile = spaceData3.sandboxFiles?.some((f: any) => f.id === artifactId2 && f.content === '<h1>Updated App Code</h1>');
  if (!hasUpdatedFile) {
    throw new Error(`TEST 3 FAILED: Child file was not merged into parent space sandboxFiles!`);
  }
  console.log("   ✅ Parent space preserved pins AND merged child chat sandbox files!");

  // ----------------------------------------------------
  // TEST 4: Explicit unpinning (passing empty array)
  // ----------------------------------------------------
  console.log("\n4. Testing explicit unpinning (passing pinnedArtifactIds: [])...");
  const unpinRes = await fetch(`${BASE_URL}/api/chats/${spaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pinnedArtifactIds: []
    })
  });
  await unpinRes.json();

  const readSpaceRes4 = await fetch(`${BASE_URL}/api/chats/${spaceId}`);
  const spaceData4 = await readSpaceRes4.json();
  if (spaceData4.pinnedArtifactIds.length !== 0) {
    throw new Error(`TEST 4 FAILED: Explicit unpinning failed! Pins: ${JSON.stringify(spaceData4.pinnedArtifactIds)}`);
  }
  console.log("   ✅ Explicit unpinning works as expected (pins cleared to [])");

  // ----------------------------------------------------
  // TEST 5: Artifact Resolver Unit Testing
  // ----------------------------------------------------
  console.log("\n5. Testing resolveArtifactForChat utility logic...");
  const filesList = [
    { id: 'file-doc-1', name: 'Product Requirements.doc', mimeType: 'application/vnd.google-apps.document' },
    { id: 'file-site-1', name: 'index.html', content: '<html></html>' },
    { id: 'file-task-1', name: 'inferred_tasks.json', content: '[]' }
  ];

  // Association match
  const matchById = resolveArtifactForChat(filesList, { associatedFileId: 'file-doc-1' }, 'doc');
  if (matchById?.id !== 'file-doc-1') {
    throw new Error(`TEST 5a FAILED: Expected file-doc-1, got ${matchById?.id}`);
  }
  console.log("   ✅ Resolved artifact by explicit associatedFileId");

  // Task type fallback match
  const matchTypeDoc = resolveArtifactForChat(filesList, { chatName: 'Product Requirements' }, 'doc');
  if (matchTypeDoc?.id !== 'file-doc-1') {
    throw new Error(`TEST 5b FAILED: Expected file-doc-1 for doc task type, got ${matchTypeDoc?.id}`);
  }
  console.log("   ✅ Resolved doc artifact by candidate taskType filtering");

  const matchTypeSite = resolveArtifactForChat(filesList, { chatName: 'Custom Tool' }, 'site');
  if (matchTypeSite?.id !== 'file-site-1') {
    throw new Error(`TEST 5c FAILED: Expected file-site-1 for site task type, got ${matchTypeSite?.id}`);
  }
  console.log("   ✅ Resolved site artifact by candidate taskType filtering");

  // Cleanup
  await fetch(`${BASE_URL}/api/chats/${spaceId}`, { method: 'DELETE' });
  await fetch(`${BASE_URL}/api/chats/${childChatId}`, { method: 'DELETE' });

  console.log("\n==========================================");
  console.log("🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
  console.log("==========================================");
}

runTests().catch(err => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
