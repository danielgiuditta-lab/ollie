import { resolveArtifactForChat } from '../src/utils/artifactResolver.ts';
import assert from 'assert';

console.log("=== Running Unit & Architectural Tests for resolveArtifactForChat ===");

// Test 1: Explicit associatedFileId matching
const driveFiles = [
  { id: 'gslide-123', name: 'Ollie', mimeType: 'application/vnd.google-apps.presentation' },
  { id: 'doc-456', name: 'CodeMender PRD.doc', mimeType: 'application/vnd.google-apps.document' },
  { id: 'tool-789', name: 'index.html', mimeType: 'text/html' }
];

const docTask = {
  id: 'space-1-chat-1',
  chatName: 'CodeMender PRD',
  taskType: 'doc',
  associatedFileId: 'doc-456',
  associatedFileName: 'CodeMender PRD.doc'
};

const resolvedDoc = resolveArtifactForChat(driveFiles, docTask, 'doc');
assert.strictEqual(resolvedDoc?.id, 'doc-456', "Doc chat should resolve to doc-456 by associatedFileId");
console.log("PASS: Test 1 - Explicit associatedFileId matching");

// Test 2: TaskType candidate filtering prevents cross-type matching (e.g. gslides matching for doc chat)
const docTaskWithoutId = {
  id: 'space-1-chat-2',
  name: 'Ollie', // Space name
  chatName: 'CodeMender PRD',
  taskType: 'doc'
};

const resolvedDocNoId = resolveArtifactForChat(driveFiles, docTaskWithoutId, 'doc');
assert.strictEqual(resolvedDocNoId?.id, 'doc-456', "Doc chat should resolve to CodeMender PRD.doc, NOT Ollie.gslides");
console.log("PASS: Test 2 - TaskType filtering prevents selecting gslides presentation");

// Test 3: Site / Custom Tool chat resolution
const toolTask = {
  id: 'space-1-chat-3',
  name: 'Ollie',
  chatName: 'Custom Tool',
  taskType: 'site',
  associatedFileName: 'index.html'
};

const resolvedTool = resolveArtifactForChat(driveFiles, toolTask, 'site');
assert.strictEqual(resolvedTool?.name, 'index.html', "Tool chat should resolve to index.html");
console.log("PASS: Test 3 - Custom tool resolves to index.html");

// Test 4: When no candidate matching taskType exists, returns null (does not fall back to wrong file type)
const emptyDocTask = {
  id: 'space-1-chat-4',
  chatName: 'Nonexistent Doc',
  taskType: 'doc'
};
const onlySlides = [
  { id: 'gslide-123', name: 'Ollie.gslides', mimeType: 'application/vnd.google-apps.presentation' }
];
const resolvedEmpty = resolveArtifactForChat(onlySlides, emptyDocTask, 'doc');
assert.strictEqual(resolvedEmpty, null, "When no doc file exists, resolveArtifactForChat must return null (NOT fall back to gslides)");
console.log("PASS: Test 4 - Returns null when candidate type is missing");

console.log("\nALL 4 UNIT TESTS PASSED PERFECTLY!");
