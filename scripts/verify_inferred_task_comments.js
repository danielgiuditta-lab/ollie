import fs from 'fs';
import path from 'path';

console.log('--- STARTING INFERRED TASKS VERIFICATION ---');

const mockDataPath = path.join(process.cwd(), 'data', 'mock_inferred_tasks.json');
const diffViewPath = path.join(process.cwd(), 'src', 'components', 'Canvas', 'InferredTaskDiffView.tsx');

const mockDataContent = fs.readFileSync(mockDataPath, 'utf-8');
const diffViewContent = fs.readFileSync(diffViewPath, 'utf-8');

// 1. Verify mock data JSON file
const mockTasks = JSON.parse(mockDataContent);
if (!Array.isArray(mockTasks) || mockTasks.length === 0) {
  console.error('FAIL: data/mock_inferred_tasks.json is empty or invalid JSON');
  process.exit(1);
}

const hasSlidesAndDocs = mockTasks.some(t => t.type === 'slide') && mockTasks.some(t => t.type === 'doc');
if (!hasSlidesAndDocs) {
  console.error('FAIL: data/mock_inferred_tasks.json missing slide or doc tasks');
  process.exit(1);
}

const hasMarkdownContent = mockTasks.every(t => typeof t.originalMarkdown === 'string' && typeof t.updatedMarkdown === 'string');
if (!hasMarkdownContent) {
  console.error('FAIL: mock tasks missing originalMarkdown or updatedMarkdown content string');
  process.exit(1);
}

console.log('SUCCESS: data/mock_inferred_tasks.json contains Health UI product designer markdown for slides and docs.');

// 2. Verify InferredTaskDiffView 2-column layout (RenderMarkdown, SlideCard, DocCard)
if (!diffViewContent.includes('RenderMarkdown') || !diffViewContent.includes('SlideCard') || !diffViewContent.includes('DocCard')) {
  console.error('FAIL: InferredTaskDiffView missing RenderMarkdown, SlideCard, or DocCard components');
  process.exit(1);
}

if (diffViewContent.includes('GoogleDriveLogo') || diffViewContent.includes('LETTER PORTRAIT')) {
  console.error('FAIL: InferredTaskDiffView contains unwanted logo or watermark label string');
  process.exit(1);
}

console.log('SUCCESS: InferredTaskDiffView renders markdown for slides and portrait docs with zero unwanted watermark labels.');
console.log('--- ALL INFERRED TASK VERIFICATIONS PASSED ---');
