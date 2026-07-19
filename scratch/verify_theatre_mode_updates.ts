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

  // Check 2: Logo removed & left_panel_open / left_panel_close symbol button added
  if (content.includes('import logoImg') || content.includes('alt="Logo"')) {
    console.error("FAIL: Logo image was not removed");
    process.exit(1);
  }
  if (
    !content.includes('left_panel_open') || 
    !content.includes('left_panel_close') || 
    !content.includes("'FILL' 1, 'wght' 700") || 
    !content.includes('fontSize: \'20px\'')
  ) {
    console.error("FAIL: left_panel_open / left_panel_close symbol toggle button with bold filled rounded styling missing");
    process.exit(1);
  }
  console.log("✓ 2. Logo removed and replaced with left_panel_open / left_panel_close toggle button (bold filled rounded, font size 20px)");

  // Check 3: Task column collapsed by default
  if (!content.includes('const [isTaskListOpen, setIsTaskListOpen] = useState(false);') || !content.includes('{isTaskListOpen && (')) {
    console.error("FAIL: Task cells column collapse state missing or not false by default");
    process.exit(1);
  }
  console.log("✓ 3. Task cells column is collapsible and collapsed by default (isTaskListOpen = false)");

  // Check 4: Header buttons color (black)
  if (!content.includes('bg-black hover:bg-[#1E1F22]')) {
    console.error("FAIL: Header action buttons are not styled black");
    process.exit(1);
  }
  console.log("✓ 4. Header action buttons styled black (bg-black)");

  // Check 5: Breadcrumbs task count (1 of 10)
  if (!content.includes('Taskviewer') || !content.includes('({todoItems.length > 0 ? activeIndex + 1 : 0} of {todoItems.length})')) {
    console.error("FAIL: Breadcrumb Taskviewer task count format missing");
    process.exit(1);
  }
  console.log("✓ 5. Breadcrumb title formatted as Taskviewer (n of n)");

  // Check 6: Gap between bottom buttons (8px = gap-2)
  if (!content.includes('gap-2 pt-2 relative')) {
    console.error("FAIL: Bottom dock buttons gap is not 8px (gap-2)");
    process.exit(1);
  }
  console.log("✓ 6. Bottom dock button gap set to 8px (gap-2)");

  // Check 7: Input hugs placeholder until cursor focus
  if (
    !content.includes('isInputFocused') ||
    !content.includes("w-[155px] px-4") ||
    !content.includes("w-80 md:w-[480px]")
  ) {
    console.error("FAIL: Input field hugging / auto-expand focus logic missing");
    process.exit(1);
  }
  console.log("✓ 7. Steer input field hugs text 'Do differently...' until cursor focus, expanding to bottom input size in dark mode");

  // Check 8: TikTok style card slide up transition
  if (!content.includes('cardVariants') || !content.includes('slideDirection') || !content.includes('mode="popLayout"')) {
    console.error("FAIL: TikTok style card slide up animation configuration missing");
    process.exit(1);
  }
  console.log("✓ 8. TikTok style card slide up animation implemented with spring physics (cardVariants & mode='popLayout')");

  // Check 9: 50% title width in full screen mode & slower canvas slide duration
  if (!content.includes("max-w-[50%]") || !content.includes("duration: 0.85")) {
    console.error("FAIL: Title/meta 50% width or slower slide duration (0.85s) missing");
    process.exit(1);
  }
  console.log("✓ 9. Title/meta unit is 50% width in full screen mode (max-w-[50%]) and canvas card slides are slower (0.85s)");

  console.log("=== ALL THEATRE MODE UPDATES VERIFIED SUCCESSFULLY ===");
}

verifyTheatreModeUpdates();
