import { getChatAsync } from '../src/server/storage/storageService.js';
import fs from 'fs';
import path from 'path';

async function verifyDiskData() {
  console.log("=== Verifying Patient Experience Disk & Backend Setup ===");

  // 1. Verify space JSON file existence and contents
  const spaceChat = await getChatAsync("space-patient-experience");
  if (!spaceChat) {
    console.error("FAILED to load space-patient-experience via storageService");
    process.exit(1);
  }
  console.log("SUCCESS: Loaded space-patient-experience database object!");
  console.log("Project Name:", spaceChat.projectName);
  console.log("Members count:", spaceChat.members?.length);
  console.log("Sandbox Files count:", spaceChat.sandboxFiles?.length);
  console.log("Sandbox File Names:", spaceChat.sandboxFiles?.map((f: any) => f.name));

  // 2. Verify Home pinned artifacts contain space-patient-experience
  const homeChatPath = path.join(process.cwd(), "data", "chats", "home_mock-user_example_com.json");
  const homeData = JSON.parse(fs.readFileSync(homeChatPath, "utf-8"));
  if (homeData.pinnedArtifactIds.includes("space-patient-experience")) {
    console.log("SUCCESS: space-patient-experience is pinned on Home Dashboard!");
  } else {
    console.error("FAILED: space-patient-experience missing from Home Dashboard pins");
    process.exit(1);
  }

  console.log("\nAll backend database verifications PASSED successfully!");
}

verifyDiskData().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
