import fs from 'fs';
import path from 'path';

async function runMockTasksVerification() {
  console.log("=== STARTING MOCK TASKS AND THEATRE MODE VERIFICATION ===");

  const jsonPath = path.join(process.cwd(), 'data', 'mock_inferred_tasks.json');
  if (!fs.existsSync(jsonPath)) {
    console.error("FAIL: data/mock_inferred_tasks.json does not exist");
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const tasks = JSON.parse(raw);

  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.error("FAIL: data/mock_inferred_tasks.json is empty");
    process.exit(1);
  }

  console.log(`✓ Loaded ${tasks.length} tasks from data/mock_inferred_tasks.json`);

  // 1. Verify "Continue working on..." items (docs & slides in diff view)
  const continueWorking = tasks.filter((t: any) => t.category === 'needs_input');
  if (continueWorking.length === 0) {
    console.error("FAIL: No tasks found for 'Continue working on...' section");
    process.exit(1);
  }

  for (const task of continueWorking) {
    const isDocOrSlide = task.type === 'doc' || task.type === 'slide';
    if (!isDocOrSlide) {
      console.error(`FAIL: Task ${task.id} in 'Continue working on...' is not a doc or slide (type: ${task.type})`);
      process.exit(1);
    }
    if (!task.originalMarkdown || !task.updatedMarkdown) {
      console.error(`FAIL: Task ${task.id} missing originalMarkdown or updatedMarkdown for diff view`);
      process.exit(1);
    }
    if (task.showDiffView === false) {
      console.error(`FAIL: Task ${task.id} has showDiffView: false`);
      process.exit(1);
    }
  }
  console.log(`✓ 'Continue working on...' section contains ${continueWorking.length} docs and slides with diff view enabled`);

  // 2. Verify "Needs your approval" items (chats with someone asking & agent proposed reply)
  const approvalTasks = tasks.filter((t: any) => t.category === 'needs_approval');
  if (approvalTasks.length === 0) {
    console.error("FAIL: No tasks found for 'Needs your approval' section");
    process.exit(1);
  }

  for (const task of approvalTasks) {
    if (task.type !== 'chat') {
      console.error(`FAIL: Task ${task.id} in 'Needs your approval' is not type 'chat' (type: ${task.type})`);
      process.exit(1);
    }
    if (!task.senderMessage || typeof task.senderMessage !== 'string') {
      console.error(`FAIL: Task ${task.id} missing senderMessage (someone asking for something)`);
      process.exit(1);
    }
    if (!task.proposedReply || typeof task.proposedReply !== 'string') {
      console.error(`FAIL: Task ${task.id} missing proposedReply (agent suggests sending a response)`);
      process.exit(1);
    }
  }
  console.log(`✓ 'Needs your approval' section contains ${approvalTasks.length} chat tasks where someone asks for something and agent suggests response`);

  // 3. Verify TheatreView and SpaceDashboard section headers
  const theatreViewContent = fs.readFileSync(path.join(process.cwd(), 'src/components/Canvas/TheatreView.tsx'), 'utf-8');
  const spaceDashboardContent = fs.readFileSync(path.join(process.cwd(), 'src/components/Canvas/SpaceDashboard.tsx'), 'utf-8');

  if (!theatreViewContent.includes('Continue working on...') || !theatreViewContent.includes('Needs your approval')) {
    console.error("FAIL: TheatreView.tsx missing section headers");
    process.exit(1);
  }
  if (!spaceDashboardContent.includes('Continue working on...') || !spaceDashboardContent.includes('Needs your approval')) {
    console.error("FAIL: SpaceDashboard.tsx missing section headers");
    process.exit(1);
  }
  console.log("✓ Both TheatreView.tsx and SpaceDashboard.tsx contain synchronized section headers");

  // 4. Verify HTTP server response
  const res = await fetch('http://localhost:3000/api/mock-inferred-tasks');
  if (!res.ok) {
    console.error(`FAIL: Server endpoint returned HTTP ${res.status}`);
    process.exit(1);
  }
  const httpTasks = await res.json();
  if (httpTasks.length !== tasks.length) {
    console.error(`FAIL: Expected ${tasks.length} tasks from endpoint, got ${httpTasks.length}`);
    process.exit(1);
  }
  console.log(`✓ Live HTTP endpoint /api/mock-inferred-tasks returned ${httpTasks.length} matching tasks`);

  console.log("=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

runMockTasksVerification().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
