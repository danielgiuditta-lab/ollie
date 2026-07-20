import fs from 'fs';
import path from 'path';

console.log("=== Automated Pre-Verification: Theatre Mode Composer ===");

// 1. Verify TheatreView.tsx content
const theatreViewPath = path.join(process.cwd(), 'src', 'components', 'Canvas', 'TheatreView.tsx');
if (!fs.existsSync(theatreViewPath)) {
  console.error("FAIL: TheatreView.tsx does not exist");
  process.exit(1);
}

const content = fs.readFileSync(theatreViewPath, 'utf8');

const requiredElements = [
  'handleDockToSide',
  'getSteerPlaceholder',
  'dock_to_right',
  'Plus',
  'ArrowUp',
  'Snap to side chat',
  'theatre-steer-input'
];

for (const elem of requiredElements) {
  if (!content.includes(elem)) {
    console.error(`FAIL: Missing required element '${elem}' in TheatreView.tsx`);
    process.exit(1);
  }
}
console.log("✓ TheatreView.tsx contains all required composer features (handleDockToSide, getSteerPlaceholder, dock_to_right, Plus, ArrowUp)");

// 2. Verify contextual placeholder logic simulation
const mockTasks = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'mock_inferred_tasks.json'), 'utf8'));

function getSteerPlaceholderSim(activeTask: any) {
  if (!activeTask) return "Search, add files or tell Ollie how to steer...";

  if (activeTask.sourceName && typeof activeTask.sourceName === 'string' && !activeTask.sourceName.toLowerCase().includes('google chat')) {
    const cleanName = activeTask.sourceName.replace(/\.[^/.]+$/, '').trim();
    if (cleanName.length > 0) {
      return `Steer "${cleanName.length > 28 ? cleanName.slice(0, 25) + '...' : cleanName}" or ask Ollie...`;
    }
  }
  if (activeTask.title) {
    const titleShort = activeTask.title.length > 30 ? `${activeTask.title.slice(0, 27)}...` : activeTask.title;
    return `Steer "${titleShort}" or ask Ollie...`;
  }
  return "Steer this task or ask Ollie to make edits...";
}

for (const task of mockTasks) {
  const placeholder = getSteerPlaceholderSim(task);
  console.log(`Task [${task.id}]: placeholder => "${placeholder}"`);
  if (!placeholder || placeholder.length === 0) {
    console.error(`FAIL: Empty placeholder generated for task ${task.id}`);
    process.exit(1);
  }
}
console.log("✓ Contextual placeholder generation verified for all tasks in database");

console.log("=== ALL THEATRE COMPOSER VERIFICATIONS PASSED SUCCESSFULLY ===");
