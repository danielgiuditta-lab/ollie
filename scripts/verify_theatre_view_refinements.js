import fs from 'fs';
import path from 'path';

const theatreViewPath = path.join(process.cwd(), 'src/components/Canvas/TheatreView.tsx');

if (!fs.existsSync(theatreViewPath)) {
  console.error('ERROR: TheatreView.tsx not found!');
  process.exit(1);
}

const content = fs.readFileSync(theatreViewPath, 'utf8');

// Checks:
// 1. No border/stroke on canvas container
const canvasNoBorder = !content.includes('bg-[#18191B] border border-neutral-800');

// 2. No border/stroke on header buttons
const headerButtonsNoBorder = !content.includes('bg-[#282A2D] hover:bg-[#35373A] text-white text-xs font-medium border');

// 3. No border/stroke on done check button
const doneCheckNoBorder = !content.includes('bg-[#080809] border border-neutral-800');

// 4. Selected done task has full alpha (opacity-100)
const fullAlphaOnSelection = content.includes('isSignedOff && !isSelected ? \'opacity-30\' : \'opacity-100\'');

// 5. Unmark complete on check button click
const hasUnmarkComplete = content.includes('onToggleComplete(item.id)') && content.includes('handleToggleComplete');

console.log('--- Verification Checks ---');
console.log('Canvas container border removed:', canvasNoBorder);
console.log('Header buttons border removed:', headerButtonsNoBorder);
console.log('Done check button border removed:', doneCheckNoBorder);
console.log('Full alpha when revisiting completed task:', fullAlphaOnSelection);
console.log('Unmark completed task on checkmark click:', hasUnmarkComplete);

if (canvasNoBorder && headerButtonsNoBorder && doneCheckNoBorder && fullAlphaOnSelection && hasUnmarkComplete) {
  console.log('\nSUCCESS: All new Theatre View refinement checks passed!');
} else {
  console.error('\nFAILURE: One or more checks failed!');
  process.exit(1);
}
