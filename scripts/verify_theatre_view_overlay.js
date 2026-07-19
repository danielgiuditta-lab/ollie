import fs from 'fs';
import path from 'path';

const theatreViewPath = path.join(process.cwd(), 'src/components/Canvas/TheatreView.tsx');

if (!fs.existsSync(theatreViewPath)) {
  console.error('ERROR: TheatreView.tsx not found!');
  process.exit(1);
}

const content = fs.readFileSync(theatreViewPath, 'utf8');

// Checks:
// 1. Overlay background has 80% black alpha and backdrop blur
const hasBgBlurOverlay = content.includes('bg-black/80 backdrop-blur-xl');

// 2. Circular arrow left/right buttons exist with solid dark background
const hasArrowLeftBtn = content.includes('<ArrowLeft className="w-5 h-5 text-white stroke-[2]" />');
const hasArrowRightBtn = content.includes('<ArrowRight className="w-5 h-5 text-white stroke-[2]" />');

// 3. Red X decline button with red glyph (#EA4335)
const hasRedXBtn = content.includes('text-[#EA4335]') && content.includes('<X className="w-6 h-6 text-[#EA4335] stroke-[2.5]" />');

// 4. Center pill steer input with "Do differently..." placeholder
const hasPillInput = content.includes('placeholder="Do differently..."') && content.includes('rounded-full bg-[#121316]');

// 5. Green Check accept button with green glyph (#34A853)
const hasGreenCheckBtn = content.includes('text-[#34A853]') && content.includes('<Check className="w-6 h-6 text-[#34A853] stroke-[2.5]" />');

console.log('--- Verification Checks for Theatre View Overlay & Bottom Bar ---');
console.log('1. 80% Black Alpha Backdrop Blur Overlay:', hasBgBlurOverlay);
console.log('2. Circular Left/Right Navigation Arrows:', hasArrowLeftBtn && hasArrowRightBtn);
console.log('3. Circular Red X Button with Red Glyph:', hasRedXBtn);
console.log('4. Center Pill Input ("Do differently..."):', hasPillInput);
console.log('5. Circular Green Check Button with Green Glyph:', hasGreenCheckBtn);

if (hasBgBlurOverlay && hasArrowLeftBtn && hasArrowRightBtn && hasRedXBtn && hasPillInput && hasGreenCheckBtn) {
  console.log('\nSUCCESS: All Theatre View overlay and bottom bar requirements verified!');
} else {
  console.error('\nFAILURE: One or more checks failed!');
  process.exit(1);
}
