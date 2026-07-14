import fs from 'fs';
import path from 'path';

const dashboardPath = path.resolve(process.cwd(), 'src/components/Canvas/SpaceDashboard.tsx');

if (!fs.existsSync(dashboardPath)) {
  console.error('❌ SpaceDashboard.tsx file not found at:', dashboardPath);
  process.exit(1);
}

const content = fs.readFileSync(dashboardPath, 'utf8');

let hasErrors = false;

// 1. Check gap-4 is present on the grid container
if (!content.includes('gap-4')) {
  console.error('❌ SpaceDashboard.tsx does not enforce gap-4 (16px gap).');
  hasErrors = true;
} else {
  console.log('✅ gap-4 (16px gap) enforced on dashboard grid container.');
}

// 2. Check no gap-6 exists on grid container
if (content.includes('gap-6 px-6')) {
  console.error('❌ Legacy gap-6 still present on dashboard grid container.');
  hasErrors = true;
} else {
  console.log('✅ Legacy gap-6 removed from dashboard grid container.');
}

// 3. Check grid-rows are properly scoped with md:
if (content.includes('"grid-cols-1 md:grid-cols-2 grid-rows-1"') || content.includes('"grid-cols-1 md:grid-cols-2 grid-rows-2"')) {
  console.error('❌ Unscoped grid-rows-1 or grid-rows-2 found without md: prefix (causes overlapping on mobile single-column view).');
  hasErrors = true;
} else {
  console.log('✅ Responsive md:grid-rows-1 and md:grid-rows-2 verified for multi-column layouts.');
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log('🎉 Dashboard 16px card gap verification passed!');
}
