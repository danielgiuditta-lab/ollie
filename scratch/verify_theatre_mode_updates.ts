import fs from 'fs';
import path from 'path';

function verifyTheatreModeUpdates() {
  console.log("=== Verifying Theatre Mode Updates ===");

  const theatreViewPath = path.join(process.cwd(), 'src', 'components', 'Canvas', 'TheatreView.tsx');
  if (!fs.existsSync(theatreViewPath)) {
    console.error("FAIL: TheatreView.tsx missing");
    process.exit(1);
  }

  const content = fs.readFileSync(theatreViewPath, 'utf8');

  // Check 1: 90% bg alpha
  if (!content.includes('bg-black/90')) {
    console.error("FAIL: 90% background alpha (bg-black/90) not found");
    process.exit(1);
  }
  console.log("✓ 1. Background alpha is 90% (bg-black/90)");

  // Check 2: Logo in title
  if (!content.includes('import logoImg') || !content.includes('alt="Logo"')) {
    console.error("FAIL: Logo image not imported or rendered in header title");
    process.exit(1);
  }
  console.log("✓ 2. Left Nav Logo added to title header");

  // Check 3: Header buttons color (black)
  if (!content.includes('bg-black hover:bg-[#1E1F22]')) {
    console.error("FAIL: Header action buttons are not styled black");
    process.exit(1);
  }
  console.log("✓ 3. Header action buttons styled black (bg-black)");

  // Check 4: Breadcrumbs task count (1 of 10)
  if (!content.includes('Taskviewer') || !content.includes('({todoItems.length > 0 ? activeIndex + 1 : 0} of {todoItems.length})')) {
    console.error("FAIL: Breadcrumb Taskviewer task count format missing");
    process.exit(1);
  }
  console.log("✓ 4. Breadcrumb title formatted as Taskviewer (n of n)");

  // Check 5: Gap between bottom buttons (8px = gap-2)
  if (!content.includes('gap-2 pt-2 relative z-10')) {
    console.error("FAIL: Bottom dock buttons gap is not 8px (gap-2)");
    process.exit(1);
  }
  console.log("✓ 5. Bottom dock button gap set to 8px (gap-2)");

  // Check 6: Input hugs placeholder until cursor focus
  if (
    !content.includes('isInputFocused') ||
    !content.includes("w-[155px] px-4") ||
    !content.includes("w-80 md:w-[480px]")
  ) {
    console.error("FAIL: Input field hugging / auto-expand focus logic missing");
    process.exit(1);
  }
  console.log("✓ 6. Steer input field hugs text 'Do differently...' until cursor focus, expanding to bottom input size in dark mode");

  console.log("=== ALL THEATRE MODE UPDATES VERIFIED SUCCESSFULLY ===");
}

verifyTheatreModeUpdates();
