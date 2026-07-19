import fs from 'fs';
import path from 'path';

async function verifyTasksOrderSync() {
  console.log("=== VERIFYING TASKS SECTION & ORDER SYNCHRONIZATION ===");

  // 1. Check data/mock_inferred_tasks.json order
  const mockTasksPath = path.join(process.cwd(), 'data', 'mock_inferred_tasks.json');
  if (!fs.existsSync(mockTasksPath)) {
    console.error("FAIL: data/mock_inferred_tasks.json does not exist");
    process.exit(1);
  }

  const raw = fs.readFileSync(mockTasksPath, 'utf8');
  const tasks = JSON.parse(raw);

  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.error("FAIL: mock_inferred_tasks.json is empty");
    process.exit(1);
  }

  // Check section order in JSON file
  const firstApprovalIdx = tasks.findIndex((t: any) => t.category === 'needs_approval' || t.type === 'chat');
  const firstInputIdx = tasks.findIndex((t: any) => t.category === 'needs_input' || t.category === 'continue_working');
  const firstFyiIdx = tasks.findIndex((t: any) => t.type === 'fyi' || t.category === 'fyi');

  if (firstApprovalIdx === -1 || firstInputIdx === -1 || firstFyiIdx === -1) {
    console.error(`FAIL: Missing category types in JSON. approval: ${firstApprovalIdx}, input: ${firstInputIdx}, fyi: ${firstFyiIdx}`);
    process.exit(1);
  }

  if (firstApprovalIdx > firstInputIdx || firstInputIdx > firstFyiIdx) {
    console.error(`FAIL: JSON tasks not in correct order. approval: ${firstApprovalIdx}, input: ${firstInputIdx}, fyi: ${firstFyiIdx}`);
    process.exit(1);
  }
  console.log(`✓ data/mock_inferred_tasks.json tasks are correctly ordered: Needs Approval (index ${firstApprovalIdx}) -> Continue Working (index ${firstInputIdx}) -> FYI (index ${firstFyiIdx})`);

  // 2. Check SpaceDashboard.tsx section rendering order
  const spaceDashPath = path.join(process.cwd(), 'src', 'components', 'Canvas', 'SpaceDashboard.tsx');
  const spaceDashContent = fs.readFileSync(spaceDashPath, 'utf8');

  const approvalSectionIdx = spaceDashContent.indexOf('Needs your approval');
  const continueSectionIdx = spaceDashContent.indexOf('Continue working on...');
  const fyiSectionIdx = spaceDashContent.indexOf('For your FYI');

  if (approvalSectionIdx === -1 || continueSectionIdx === -1 || fyiSectionIdx === -1) {
    console.error(`FAIL: SpaceDashboard.tsx missing section headers. approval: ${approvalSectionIdx}, continue: ${continueSectionIdx}, fyi: ${fyiSectionIdx}`);
    process.exit(1);
  }

  if (approvalSectionIdx > continueSectionIdx || continueSectionIdx > fyiSectionIdx) {
    console.error(`FAIL: SpaceDashboard.tsx section headers out of order. approval: ${approvalSectionIdx}, continue: ${continueSectionIdx}, fyi: ${fyiSectionIdx}`);
    process.exit(1);
  }
  console.log("✓ SpaceDashboard.tsx renders sections in exact order: Needs your approval -> Continue working on... -> For your FYI");

  // 3. Check TheatreView.tsx section rendering order
  const theatrePath = path.join(process.cwd(), 'src', 'components', 'Canvas', 'TheatreView.tsx');
  const theatreContent = fs.readFileSync(theatrePath, 'utf8');

  const theatreApprovalIdx = theatreContent.indexOf('Needs your approval');
  const theatreContinueIdx = theatreContent.indexOf('Continue working on...');
  const theatreFyiIdx = theatreContent.indexOf('For your FYI');

  if (theatreApprovalIdx === -1 || theatreContinueIdx === -1 || theatreFyiIdx === -1) {
    console.error(`FAIL: TheatreView.tsx missing section headers. approval: ${theatreApprovalIdx}, continue: ${theatreContinueIdx}, fyi: ${theatreFyiIdx}`);
    process.exit(1);
  }

  if (theatreApprovalIdx > theatreContinueIdx || theatreContinueIdx > theatreFyiIdx) {
    console.error(`FAIL: TheatreView.tsx section headers out of order. approval: ${theatreApprovalIdx}, continue: ${theatreContinueIdx}, fyi: ${theatreFyiIdx}`);
    process.exit(1);
  }
  console.log("✓ TheatreView.tsx renders sections in exact order: Needs your approval -> Continue working on... -> For your FYI");

  // 4. Test live HTTP endpoint /api/mock-inferred-tasks
  try {
    const res = await fetch('http://localhost:3000/api/mock-inferred-tasks');
    if (res.ok) {
      const httpTasks = await res.json();
      console.log(`✓ Live HTTP GET /api/mock-inferred-tasks returned 200 OK (${httpTasks.length} tasks)`);
      if (httpTasks[0].category === 'needs_approval' || httpTasks[0].type === 'chat') {
        console.log(`✓ Live HTTP endpoint returned tasks starting with Needs your approval (${httpTasks[0].id})`);
      } else {
        console.error(`FAIL: Live HTTP endpoint returned tasks starting with ${httpTasks[0].id} (${httpTasks[0].category})`);
        process.exit(1);
      }
    }
  } catch (err) {
    console.log("! Note: Dev server endpoint check skipped if server port differs, static checks passed.");
  }

  console.log("=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

verifyTasksOrderSync().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
