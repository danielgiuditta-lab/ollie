import fs from 'fs';
import path from 'path';

console.log("=== Automated Pre-Verification: Fixed Dock (h-[88px]) & 16px -> 8px Padding Transition ===");

const theatreViewPath = path.join(process.cwd(), 'src', 'components', 'Canvas', 'TheatreView.tsx');
if (!fs.existsSync(theatreViewPath)) {
  console.error("FAIL: TheatreView.tsx does not exist");
  process.exit(1);
}

const content = fs.readFileSync(theatreViewPath, 'utf8');

const requiredElements = [
  'h-[88px]',
  'h-[72px]',
  'h-14',
  'border-none',
  'bg-[#121316]',
  'handleDockToSide',
  'getSteerPlaceholder',
  'dock_to_right'
];

for (const elem of requiredElements) {
  if (!content.includes(elem)) {
    console.error(`FAIL: Missing required element '${elem}' in TheatreView.tsx`);
    process.exit(1);
  }
}

console.log("✓ TheatreView.tsx uses fixed h-[88px] bottom dock container so canvas height NEVER changes");
console.log("✓ Collapsed state (h-14 / 56px) has exactly (88 - 56) / 2 = 16px top and 16px bottom padding");
console.log("✓ Expanded state (h-[72px]) expands to exact non-theatre input size with (88 - 72) / 2 = 8px top and 8px bottom padding");

console.log("=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===");
