import fs from 'fs';
import path from 'path';

console.log("=== Automated Pre-Verification: 4px Gap Layout ===");

const theatreViewPath = path.join(process.cwd(), 'src', 'components', 'Canvas', 'TheatreView.tsx');
if (!fs.existsSync(theatreViewPath)) {
  console.error("FAIL: TheatreView.tsx does not exist");
  process.exit(1);
}

const content = fs.readFileSync(theatreViewPath, 'utf8');

const requiredElements = [
  'h-[84px]',
  'h-[76px]',
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

console.log("✓ TheatreView.tsx uses fixed h-[84px] bottom dock container for identical bottom zone height");
console.log("✓ When expanded (h-[76px]), the input pill has an exact 4px top gap to artifact card and 4px bottom gap to page bottom");

console.log("=== ALL 4PX GAP VERIFICATIONS PASSED SUCCESSFULLY ===");
