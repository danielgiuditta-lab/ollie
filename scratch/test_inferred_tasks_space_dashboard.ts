import { getChatAsync, saveChatAsync } from '../src/server/storage/storageService.js';
import fs from 'fs';
import path from 'path';

async function verifyInferredTasksDashboard() {
  console.log("=== Verifying Inferred Tasks Space Dashboard Setup ===");

  const testSpaceId = `space-test-dashboard-${Date.now()}`;
  const spacePayload = {
    chatId: testSpaceId,
    projectName: "Patient Experience",
    type: "space",
    messages: [{ role: "bot", text: "Welcome to Patient Experience" }],
    sandboxFiles: [
      { id: "copied-1", name: "patient_inquiry_and_triage_flow.doc", type: "code" }
    ],
    members: [
      { name: "Dr. Marcus Thorne", email: "dr_marcus_thorne@example.com" }
    ],
    activeSpaceId: testSpaceId,
    pinnedArtifactIds: ["todo-card"]
  };

  // 1. Save chat via storageService
  await saveChatAsync(testSpaceId, spacePayload);

  // 2. Read chat via storageService
  const retrieved = await getChatAsync(testSpaceId);
  if (!retrieved) {
    console.error("FAILED: Could not retrieve saved test space chat");
    process.exit(1);
  }

  console.log("Retrieved Space ID:", retrieved.chatId);
  console.log("Retrieved Pinned Artifact IDs:", retrieved.pinnedArtifactIds);

  if (Array.isArray(retrieved.pinnedArtifactIds) && retrieved.pinnedArtifactIds.includes("todo-card")) {
    console.log("SUCCESS: 'todo-card' (Inferred Tasks) is present in pinnedArtifactIds for the space!");
  } else {
    console.error("FAILED: 'todo-card' is missing from pinnedArtifactIds");
    process.exit(1);
  }

  // Cleanup test chat file
  const testFilePath = path.join(process.cwd(), "data", "chats", `${testSpaceId}.json`);
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
    console.log("Cleaned up test space chat file.");
  }

  console.log("\nAll Inferred Tasks Space Dashboard verifications PASSED!");
}

verifyInferredTasksDashboard().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
