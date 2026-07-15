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

const hasBulletLines = mockTasks.every(t => Array.isArray(t.originalContentLines) && Array.isArray(t.updatedContentLines));
if (!hasBulletLines) {
  console.error('FAIL: mock tasks missing originalContentLines or updatedContentLines bullet point arrays');
  process.exit(1);
}

console.log('SUCCESS: data/mock_inferred_tasks.json contains bullet point lines for slides and docs.');

// 2. Verify InferredTaskDiffView 2-column layout
if (!diffViewContent.includes('DriveArtifactCard') || !diffViewContent.includes('Original') || !diffViewContent.includes('Suggested Update')) {
  console.error('FAIL: InferredTaskDiffView missing 2-column DriveArtifactCard diff layout');
  process.exit(1);
}

console.log('SUCCESS: InferredTaskDiffView preserves the 2-card Original vs Suggested Update diff layout.');
console.log('--- ALL INFERRED TASK VERIFICATIONS PASSED ---');
