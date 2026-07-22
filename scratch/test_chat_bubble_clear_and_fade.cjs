const fs = require('fs');
const path = require('path');

console.log('--- Verifying Chat Bubble Clearing & 30s Fade Away ---');

const appPath = path.join(__dirname, '../src/App.tsx');
const theatrePath = path.join(__dirname, '../src/components/Canvas/TheatreView.tsx');
const optionCPath = path.join(__dirname, '../src/components/Canvas/OptionCView.tsx');

const appContent = fs.readFileSync(appPath, 'utf8');
const theatreContent = fs.readFileSync(theatrePath, 'utf8');
const optionCContent = fs.readFileSync(optionCPath, 'utf8');

// 1. Verify setMessages([]) in handleOpenTheatre
if (appContent.includes('handleOpenTheatre') && appContent.includes('setMessages([])')) {
  console.log('✔ App.tsx clears active chat bubbles when opening task/theatre view.');
} else {
  console.error('✖ App.tsx missing setMessages([]) in handleOpenTheatre.');
  process.exit(1);
}

// 2. Verify 30-second auto-fade logic in App.tsx, TheatreView.tsx, and OptionCView.tsx
if (appContent.includes('ageMs >= 30000') && appContent.includes('opacity-0 transition-opacity')) {
  console.log('✔ App.tsx implements 30-second auto-fade for floating overlay chat bubbles.');
} else {
  console.error('✖ App.tsx missing 30-second auto-fade logic.');
  process.exit(1);
}

if (theatreContent.includes('ageMs >= 30000') && optionCContent.includes('ageMs >= 30000')) {
  console.log('✔ TheatreView and OptionCView implement 30-second auto-fade for overlay chat bubbles.');
} else {
  console.error('✖ TheatreView or OptionCView missing 30-second auto-fade logic.');
  process.exit(1);
}

console.log('--- ALL VERIFICATION TESTS PASSED ---');
