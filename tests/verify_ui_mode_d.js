import fs from 'fs';
import path from 'path';

console.log("Verifying UI Mode D implementation (strictly reusing TheatreView in Light Mode)...");

// Check 1: OptionDView.tsx is removed (no custom UI file)
const optionDPath = path.resolve('src/components/Canvas/OptionDView.tsx');
if (fs.existsSync(optionDPath)) {
  console.error("FAIL: OptionDView.tsx still exists; it should be deleted to reuse existing TheatreView component.");
  process.exit(1);
}
console.log("PASS: OptionDView.tsx custom UI file deleted.");

// Check 2: TheatreView.tsx supports light mode
const theatrePath = path.resolve('src/components/Canvas/TheatreView.tsx');
const theatreContent = fs.readFileSync(theatrePath, 'utf-8');
if (!theatreContent.includes("theme === 'light'") && !theatreContent.includes("isLight")) {
  console.error("FAIL: TheatreView.tsx does not include light theme support.");
  process.exit(1);
}
console.log("PASS: TheatreView.tsx includes light mode theme support.");

// Check 3: LeftNav.tsx contains Option D in popover
const leftNavPath = path.resolve('src/components/Navigation/LeftNav.tsx');
const leftNavContent = fs.readFileSync(leftNavPath, 'utf-8');
if (!leftNavContent.includes("Option D: Light Column UI")) {
  console.error("FAIL: LeftNav.tsx does not include Option D button.");
  process.exit(1);
}
console.log("PASS: LeftNav.tsx includes Option D popover menu entry.");

// Check 4: App.tsx mounts TheatreView with theme="light" for playOptionMode === 'D'
const appPath = path.resolve('src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');
if (!appContent.includes("playOptionMode === 'D'") || !appContent.includes('theme="light"')) {
  console.error("FAIL: App.tsx does not mount TheatreView with theme='light' for Mode D.");
  process.exit(1);
}
console.log("PASS: App.tsx mounts existing TheatreView with theme='light' for Mode D.");

console.log("UI Mode D verification successful!");
