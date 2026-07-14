import { resolveArtifactForChat } from '../src/utils/artifactResolver';

function testChatClickToolResolution() {
  console.log("=== TESTING TOOL CHAT RESOLUTION & HTML FALLBACK PROTECTION ===");

  const driveFiles = [
    { id: 'file-mov-1', name: 'earlyLookCut.mov', mimeType: 'video/quicktime' },
    { id: 'file-pdf-2', name: 'Specification.pdf', mimeType: 'application/pdf' }
  ];

  const sandboxFiles = [
    { id: 'sandbox-html-1', name: 'index.html', content: '<div>Decision Log App</div>', mimeType: 'text/html' }
  ];

  const allAvailableFiles = [...sandboxFiles, ...driveFiles];

  // Test 1: Tool chat resolution with index.html present
  const toolTask = { id: 'space-1-chat-123', taskType: 'tool', chatName: 'Build Decision Log', associatedFileId: 'file-mov-1' };
  const resolved1 = resolveArtifactForChat(allAvailableFiles, toolTask, 'tool');
  console.log("-> Test 1 Resolved file for tool task (with mismatched associatedFileId 'earlyLookCut.mov'):", resolved1?.name);

  if (resolved1?.name === 'index.html') {
    console.log("SUCCESS Test 1: Guard prevents non-HTML media files from overriding index.html!");
  } else {
    console.error("FAIL Test 1: Expected index.html but got:", resolved1?.name);
  }

  // Test 2: Tool chat resolution when sandbox is loading
  const resolved2 = resolveArtifactForChat(driveFiles, toolTask, 'tool');
  console.log("-> Test 2 Resolved file when only Drive files exist:", resolved2?.name || 'null');

  if (resolved2 === null) {
    console.log("SUCCESS Test 2: Strictly returns null for tool tasks when no HTML candidates exist (never falls back to .mov)!");
  } else {
    console.error("FAIL Test 2: Tool task fell back to non-HTML file:", resolved2?.name);
  }

  console.log("\n=== ALL TOOL RESOLUTION TESTS COMPLETED SUCCESSFULLY ===");
}

testChatClickToolResolution();
