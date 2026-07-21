import fs from 'fs';
import path from 'path';

console.log("Verifying UI Mode D implementation...");

// Check 1: OptionDView.tsx exists and exports OptionDView
const optionDPath = path.resolve('src/components/Canvas/OptionDView.tsx');
if (!fs.existsSync(optionDPath)) {
  console.error("FAIL: OptionDView.tsx does not exist");
  process.exit(1);
}
const optionDContent = fs.readFileSync(optionDPath, 'utf-8');
if (!optionDContent.includes('export function OptionDView')) {
  console.error("FAIL: OptionDView.tsx does not export OptionDView component");
  process.exit(1);
}
console.log("PASS: OptionDView.tsx exists and exports component.");

// Check 2: LeftNav.tsx contains Option D in popover and updated types
const leftNavPath = path.resolve('src/components/Navigation/LeftNav.tsx');
const leftNavContent = fs.readFileSync(leftNavPath, 'utf-8');
if (!leftNavContent.includes("Option D: Light Column UI")) {
  console.error("FAIL: LeftNav.tsx does not include Option D button");
  process.exit(1);
}
console.log("PASS: LeftNav.tsx includes Option D popover menu entry.");

// Check 3: App.tsx imports and renders OptionDView
const appPath = path.resolve('src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');
if (!appContent.includes("import { OptionDView }")) {
  console.error("FAIL: App.tsx does not import OptionDView");
  process.exit(1);
}
if (!appContent.includes("playOptionMode === 'D'") || !appContent.includes("<OptionDView")) {
  console.error("FAIL: App.tsx does not render OptionDView for playOptionMode === 'D'");
  process.exit(1);
}
console.log("PASS: App.tsx imports and mounts OptionDView.");

console.log("UI Mode D verification successful!");
