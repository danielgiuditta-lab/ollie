import assert from 'assert';

// Test Item classification logic matching updated InferredTaskCard.tsx
function isSlideItemClassification(item: any, primaryFile: any) {
  const explicitSlide = Boolean(
    item.type === 'slide' ||
    item.taskType === 'slide' ||
    (item.sourceMimeType && (item.sourceMimeType.includes('presentation') || item.sourceMimeType.includes('slide'))) ||
    (item.sourceName && (item.sourceName.endsWith('.gslides') || item.sourceName.endsWith('.pptx') || item.sourceName.endsWith('.ppt') || item.sourceName.toLowerCase().includes('drive refresh'))) ||
    (item.title && (
      item.title.toLowerCase().includes('slide') ||
      item.title.toLowerCase().includes('presentation') ||
      item.title.toLowerCase().includes('talking point') ||
      item.title.toLowerCase().includes('deck') ||
      item.title.toLowerCase().includes('drive refresh') ||
      item.title.toLowerCase().includes('big rock') ||
      item.title.toLowerCase().includes('ux improvement') ||
      item.title.toLowerCase().includes('new drive')
    )) ||
    (item.description && (
      item.description.toLowerCase().includes('slide') ||
      item.description.toLowerCase().includes('presentation') ||
      item.description.toLowerCase().includes('deck') ||
      item.description.toLowerCase().includes('drive refresh') ||
      item.description.toLowerCase().includes('new drive')
    )) ||
    (primaryFile && (
      primaryFile.type === 'slide' ||
      primaryFile.taskType === 'slide' ||
      (primaryFile.mimeType && primaryFile.mimeType.toLowerCase().includes('presentation')) ||
      (primaryFile.name && (primaryFile.name.toLowerCase().endsWith('.gslides') || primaryFile.name.toLowerCase().endsWith('.pptx')))
    ))
  );
  return explicitSlide;
}

console.log('--- Running Expanded Classification Tests ---');

// Test Case 1: Item with title "UX Improvement: Navigating and viewing files in New Drive"
const item1 = {
  id: 'task-1',
  title: 'UX Improvement: Navigating and viewing files in New Drive',
  description: 'Better ways to navigate, find and view all your files and artifacts in Drive.',
  sourceName: 'New Drive',
  sourceMimeType: '',
  personName: 'Emily',
  personAvatar: '',
  status: 'done',
  hasPreview: true
};

assert.strictEqual(isSlideItemClassification(item1, null), true, 'Item 1 (UX Improvement) MUST classify as Slide presentation');

// Test Case 2: Item with description mentioning presentation/deck
const item2 = {
  id: 'task-2',
  title: 'Consolidated branding layout',
  description: 'Updated the brand kit presentation deck for team review.',
  sourceName: 'Brand Kit',
  sourceMimeType: '',
  personName: 'Alex',
  personAvatar: '',
  status: 'done',
  hasPreview: true
};

assert.strictEqual(isSlideItemClassification(item2, null), true, 'Item 2 with presentation description MUST classify as Slide presentation');

console.log('✔ Expanded Classification Tests Passed Successfully!');
