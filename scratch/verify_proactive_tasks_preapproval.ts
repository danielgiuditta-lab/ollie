import fs from 'fs';
import path from 'path';

async function verifyMockInferredTasks() {
  const filePath = path.join(process.cwd(), 'data', 'mock_inferred_tasks.json');
  if (!fs.existsSync(filePath)) {
    console.error("Error: mock_inferred_tasks.json does not exist!");
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const tasks = JSON.parse(raw);

  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.error("Error: mock_inferred_tasks.json is empty or not an array!");
    process.exit(1);
  }

  console.log(`Loaded ${tasks.length} mock inferred tasks.`);

  for (const task of tasks) {
    console.log(`Checking task ID: ${task.id}`);
    if (task.status === 'done' || task.status === 'approved') {
      console.error(`Task ${task.id} is in approved/done state prematurely! Status: ${task.status}`);
      process.exit(1);
    }
    console.log(`- Task "${task.title}": status is "${task.status}" (pre-approval state).`);
  }

  console.log("SUCCESS: All mock inferred tasks are in pre-approval state!");
}

verifyMockInferredTasks().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
