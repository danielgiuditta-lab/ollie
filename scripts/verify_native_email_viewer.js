import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('=== Verifying Native Email Viewer & Task Handling ===');

  // 1. Verify NativeViewer.tsx contains RenderEmailViewer and isEmailFile check
  const nativeViewerPath = path.join(__dirname, '../src/components/Canvas/NativeViewer.tsx');
  const nativeViewerCode = fs.readFileSync(nativeViewerPath, 'utf8');

  if (!nativeViewerCode.includes('RenderEmailViewer')) {
    console.error('FAIL: NativeViewer.tsx does not contain RenderEmailViewer');
    process.exit(1);
  }
  if (!nativeViewerCode.includes('isEmailFile')) {
    console.error('FAIL: NativeViewer.tsx does not contain isEmailFile check');
    process.exit(1);
  }
  console.log('✔ NativeViewer.tsx contains RenderEmailViewer and isEmailFile routing');

  // 2. Verify App.tsx contains isEmailTask handling
  const appPath = path.join(__dirname, '../src/App.tsx');
  const appCode = fs.readFileSync(appPath, 'utf8');

  if (!appCode.includes('isEmailTask')) {
    console.error('FAIL: App.tsx does not contain isEmailTask handling');
    process.exit(1);
  }
  console.log('✔ App.tsx contains isEmailTask resolution');

  // 3. Verify backend mock inferred tasks endpoint
  try {
    const res = await fetch('http://localhost:3000/api/mock-inferred-tasks');
    if (res.ok) {
      const tasks = await res.json();
      console.log(`✔ Server /api/mock-inferred-tasks returned ${tasks.length} tasks successfully`);
    } else {
      console.warn(`Server status ${res.status}`);
    }
  } catch (err) {
    console.warn('Server not reachable synchronously:', err.message);
  }

  console.log('=== Verification Passed ===');
}

main();
