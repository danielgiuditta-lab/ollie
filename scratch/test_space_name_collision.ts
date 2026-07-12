import { resolveArtifactForChat } from '../src/utils/artifactResolver';

function runCollisionTest() {
  console.log("====================================================");
  console.log("🚀 TESTING SPACE NAME COLLISION FIX");
  console.log("====================================================\n");

  const spaceName = "Ollie";
  const spaceId = "space-123";
  const customToolChatId = "space-123-chat-tool";

  // Simulate Drive files containing a Google Slides deck named "Ollie"
  const driveFiles = [
    { id: "13fWjGKeE-Uq2ZPpdnXJ1xFkvA5JlticOHJ8UpDsNgE", driveId: "13fWjGKeE-Uq2ZPpdnXJ1xFkvA5JlticOHJ8UpDsNgE", name: "Ollie", mimeType: "application/vnd.google-apps.presentation" }
  ];

  // Simulate sandbox files containing the custom tool index.html
  const sandboxFiles = [
    { id: "space-123-file-0", name: "index.html", content: "<html><body>Custom Tool</body></html>" }
  ];

  const allAvailableFiles = [...sandboxFiles, ...driveFiles];

  // Simulate clicking the "Custom Tool" chat in LeftNav
  const clickedChatObj = {
    id: customToolChatId,
    name: spaceName, // "Ollie"
    chatId: customToolChatId,
    activeSpaceId: spaceId,
    taskType: 'site',
    associatedFileId: 'space-123-file-0',
    associatedFileName: 'index.html'
  };

  // Replicate handleFileClick logic
  const file = clickedChatObj;
  const isSpaceObject = typeof file === 'object' && file && Boolean(
    file.type?.includes('space') || 
    file.type === 'workspace' || 
    file.isProject || 
    file.chats || 
    file.chatId || 
    (typeof file.id === 'string' && (file.id.includes('-chat-') || file.id.startsWith('space-') || file.id.startsWith('local-')))
  );

  const specificFileMatch = (typeof file === 'object' && file && file.name && !isSpaceObject)
    ? (allAvailableFiles.find((f: any) => f && ((file.id && f.id === file.id) || (file.driveId && f.driveId === file.driveId) || (file.isFromFileList && f.name === file.name))) || (file.isFromFileList ? file : null))
    : null;

  console.log("1. Evaluating isSpaceObject for clicked chat object:", { isSpaceObject });
  if (!isSpaceObject) {
    throw new Error("FAIL: Chat session object evaluated as non-space object!");
  }
  console.log("   ✅ isSpaceObject correctly evaluated to TRUE.");

  console.log("2. Evaluating specificFileMatch for clicked chat object:", { specificFileMatch });
  if (specificFileMatch !== null) {
    throw new Error(`FAIL: specificFileMatch erroneously matched ${specificFileMatch.name}!`);
  }
  console.log("   ✅ specificFileMatch correctly evaluated to NULL (bypassing fuzzy Drive file collision).");

  // Step 3: Test resolveArtifactForChat fallback
  const resolved = resolveArtifactForChat(allAvailableFiles, clickedChatObj, 'site');
  console.log("3. Resolving artifact for chat via resolveArtifactForChat:", resolved);
  if (resolved.name !== "index.html") {
    throw new Error(`FAIL: Artifact resolved to ${resolved.name} instead of index.html!`);
  }
  console.log("   ✅ Artifact correctly resolved to index.html!");

  console.log("\n====================================================");
  console.log("🎉 ALL COLLISION TESTS PASSED SUCCESSFULLY!");
  console.log("====================================================");
}

runCollisionTest();
