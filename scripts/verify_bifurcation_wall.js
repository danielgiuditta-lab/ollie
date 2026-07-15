import fs from 'fs';
import path from 'path';

console.log("--- STARTING BIFURCATION WALL AUDIT ---");

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
const canvasContainerPath = path.join(process.cwd(), 'src', 'components', 'Layout', 'CanvasContainer.tsx');
const homeLandingPath = path.join(process.cwd(), 'src', 'components', 'Canvas', 'HomeLanding.tsx');

const appContent = fs.readFileSync(appPath, 'utf-8');
const canvasContent = fs.readFileSync(canvasContainerPath, 'utf-8');
const homeContent = fs.readFileSync(homeLandingPath, 'utf-8');

// Check 1: InferredTaskDiffView in App.tsx is guarded by !accessToken
if (!appContent.includes('!accessToken && (selectedFile?.isProactiveDraft')) {
  console.error("FAIL: InferredTaskDiffView in App.tsx is not strictly guarded by !accessToken");
  process.exit(1);
} else {
  console.log("SUCCESS: InferredTaskDiffView in App.tsx is strictly guarded by !accessToken");
}

// Check 2: isDiffItem in CanvasContainer.tsx is guarded by !accessToken
if (!canvasContent.includes('const isDiffItem = !accessToken && Boolean(')) {
  console.error("FAIL: CanvasContainer.tsx does not guard isDiffItem with !accessToken");
  process.exit(1);
} else {
  console.log("SUCCESS: CanvasContainer.tsx strictly guards isDiffItem with !accessToken");
}

// Check 3: Synthetic space task generation in HomeLanding.tsx is guarded by !accessToken
if (!homeContent.includes('if (!accessToken && !isHome && projectName)')) {
  console.error("FAIL: Synthetic task generation in HomeLanding.tsx is not guarded by !accessToken");
  process.exit(1);
} else {
  console.log("SUCCESS: Synthetic task generation in HomeLanding.tsx is strictly guarded by !accessToken");
}

// Check 4: Digest error handlers in HomeLanding.tsx set empty arrays in OAuth mode
if (homeContent.includes("id: 'todo-proactive-1'")) {
  console.error("FAIL: Hardcoded mock tasks present in HomeLanding.tsx digest error handler");
  process.exit(1);
} else {
  console.log("SUCCESS: Zero hardcoded mock tasks in HomeLanding.tsx digest error handlers");
}

// Check 5: DEFAULT_TODO_ITEMS in HomeLanding.tsx is empty array []
if (!homeContent.includes('export const DEFAULT_TODO_ITEMS: any[] = [];')) {
  console.error("FAIL: DEFAULT_TODO_ITEMS in HomeLanding.tsx is not empty array []");
  process.exit(1);
} else {
  console.log("SUCCESS: DEFAULT_TODO_ITEMS in HomeLanding.tsx is empty array []");
}

console.log("--- ALL BIFURCATION WALL AUDITS PASSED SUCCESSFULLY ---");
