import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function runCustomToolVerification() {
  console.log("==========================================");
  console.log("🧪 VERIFYING CUSTOM TOOL & DASHBOARD PINNING");
  console.log("==========================================\n");

  const spaceId = `space_multi_tool_${Date.now()}`;
  const tool1Id = `tool1_file_${Date.now()}`;
  const tool2Id = `tool2_file_${Date.now()}`;
  const chat1Id = `${spaceId}-chat-tool1-${Date.now()}`;
  const chat2Id = `${spaceId}-chat-tool2-${Date.now()}`;

  // 1. Create Tool 1 Chat ("Ollie Control Panel")
  console.log("1. Creating Tool 1 ('Ollie Control Panel')...");
  const tool1Content = `<!DOCTYPE html>
<html>
<head>
  <title>Ollie Control Panel</title>
</head>
<body>
  <div class="p-6">
    <h2>Microservice Registry</h2>
  </div>
</body>
</html>`;

  const chat1Res = await fetch(`${BASE_URL}/api/chats/${chat1Id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'Multi-Tool Engineering Space',
      chatName: 'Ollie Control Panel',
      taskType: 'site',
      associatedFileId: tool1Id,
      associatedFileName: 'ollie_control_panel.html',
      activeSpaceId: spaceId,
      messages: [{ role: 'user', text: 'Build control panel' }],
      sandboxFiles: [{ id: tool1Id, title: 'Ollie Control Panel', name: 'ollie_control_panel.html', content: tool1Content }]
    })
  });
  console.log("   Tool 1 chat created:", (await chat1Res.json()).success);

  // 2. Create Tool 2 Chat ("Sales Performance Tracker")
  console.log("\n2. Creating Tool 2 ('Sales Performance Tracker')...");
  const tool2Content = `<!DOCTYPE html>
<html>
<head>
  <title>Sales Performance Tracker</title>
</head>
<body>
  <div class="p-6">
    <h2>Quarterly Targets</h2>
  </div>
</body>
</html>`;

  const chat2Res = await fetch(`${BASE_URL}/api/chats/${chat2Id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'Multi-Tool Engineering Space',
      chatName: 'Sales Performance Tracker',
      taskType: 'site',
      associatedFileId: tool2Id,
      associatedFileName: 'sales_tracker.html',
      activeSpaceId: spaceId,
      messages: [{ role: 'user', text: 'Build sales tracker' }],
      sandboxFiles: [{ id: tool2Id, title: 'Sales Performance Tracker', name: 'sales_tracker.html', content: tool2Content }]
    })
  });
  console.log("   Tool 2 chat created:", (await chat2Res.json()).success);

  // 3. Pin both custom tools to the parent space dashboard
  console.log("\n3. Pinning both custom tools to the parent space dashboard...");
  const pinSpaceRes = await fetch(`${BASE_URL}/api/chats/${spaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'Multi-Tool Engineering Space',
      activeSpaceId: spaceId,
      pinnedArtifactIds: [tool1Id, tool2Id]
    })
  });
  console.log("   Parent space pin save:", (await pinSpaceRes.json()).success);

  // 4. Verify parent space readback contains both pinned artifacts and merged sandbox files
  console.log("\n4. Reading parent space from DB to verify multi-tool state...");
  const spaceReadRes = await fetch(`${BASE_URL}/api/chats/${spaceId}`);
  const spaceData = await spaceReadRes.json();

  console.log("   Parent Space Pinned Artifact IDs:", spaceData.pinnedArtifactIds);
  console.log("   Parent Space Merged Sandbox Files count:", spaceData.sandboxFiles?.length);
  console.log("   Sandbox file names:", spaceData.sandboxFiles?.map((f: any) => f.name));

  if (!spaceData.pinnedArtifactIds || !spaceData.pinnedArtifactIds.includes(tool1Id) || !spaceData.pinnedArtifactIds.includes(tool2Id)) {
    throw new Error("FAILED: Parent space did not persist multiple pinned tool IDs!");
  }

  if (!spaceData.sandboxFiles || spaceData.sandboxFiles.length < 2) {
    throw new Error("FAILED: Parent space sandboxFiles does not contain merged custom tools!");
  }

  console.log("\n==========================================");
  console.log("✅ MULTI-TOOL CREATION & PINNING VERIFIED SUCCESSFULLY!");
  console.log("==========================================");
}

runCustomToolVerification().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
