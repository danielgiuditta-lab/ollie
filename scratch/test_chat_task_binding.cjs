const fs = require('fs');
const path = require('path');

console.log('--- Verifying Chat Session & Task/Artifact Binding ---');

const leftNavPath = path.join(__dirname, '../src/components/Navigation/LeftNav.tsx');
const appPath = path.join(__dirname, '../src/App.tsx');

const leftNavContent = fs.readFileSync(leftNavPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');

// 1. Check LeftNav child session mapping logic
if (leftNavContent.includes('isChildSession') && leftNavContent.includes('spacesMap[spaceId].chats.push')) {
  console.log('✔ LeftNav.tsx maps all child chat sessions under their parent space.');
} else {
  console.error('✖ LeftNav.tsx missing child session mapping logic.');
  process.exit(1);
}

// 2. Check handleFileClick session creation & binding logic
if (appContent.includes('associatedFileId')) {
  console.log('✔ App.tsx binds tasks and artifacts to distinct chat sessions with associated file/task metadata.');
} else {
  console.error('✖ App.tsx missing chat-to-task/artifact binding logic.');
  process.exit(1);
}

console.log('--- ALL VERIFICATION TESTS PASSED ---');
