import assert from 'assert';

// Simulated app state logic from App.tsx
function determineTaskMode(selectedFile: any, currentTask: string): string {
  if (selectedFile && selectedFile.name) {
    const fileName = selectedFile.name;
    const fileNameLower = fileName.toLowerCase();
    const mimeLower = (selectedFile.mimeType || '').toLowerCase();
    
    const isSlide = selectedFile.type === 'slide' ||
                    selectedFile.taskType === 'slide' ||
                    fileNameLower.endsWith('.gslides') ||
                    fileNameLower.endsWith('.pptx') ||
                    fileNameLower.endsWith('.ppt') ||
                    fileNameLower.includes('slide') ||
                    mimeLower.includes('presentation') ||
                    mimeLower.includes('slide');
                    
    const isDoc = selectedFile.type === 'doc' ||
                  selectedFile.taskType === 'doc' ||
                  fileNameLower.endsWith('.doc') ||
                  fileNameLower.endsWith('.gdoc') ||
                  fileNameLower.endsWith('.md') ||
                  fileNameLower.endsWith('.txt') ||
                  fileNameLower.includes('document') ||
                  mimeLower.includes('document');

    if (isSlide) {
      return 'slide';
    } else if (isDoc) {
      return 'doc';
    } else {
      return 'app';
    }
  }
  return currentTask;
}

function shouldRouteToDocJourney(activeTaskMode: string, prompt: string): boolean {
  const textLower = prompt.toLowerCase();
  const isToolBuildingPrompt = ['kanban', 'board', 'custom tool', 'build a tool', 'build a site', 'build an app', 'create an app', 'create a tool', 'tracker tool', 'vibe code'].some(kw => textLower.includes(kw));
  
  const isDocJourneyMode = (activeTaskMode === 'doc' || activeTaskMode === 'slide') && !isToolBuildingPrompt;
  return isDocJourneyMode;
}

console.log("=== Running Slide Task Mode Synchronization & Routing Tests ===");

// Scenario 1: A slide presentation is selected. Task mode should synchronize to 'slide'
const slideFile = {
  name: 'AI Policy & Governance Keynote Outline.gslides',
  type: 'slide',
  mimeType: 'application/vnd.google-apps.presentation'
};
const taskMode = determineTaskMode(slideFile, 'app');
assert.strictEqual(taskMode, 'slide', "Task mode should update to 'slide' when a presentation is active");

// Scenario 2: Prompt "make more concise" is sent when task mode is 'slide'
const routeToDocJourney = shouldRouteToDocJourney(taskMode, "make more concise");
assert.strictEqual(routeToDocJourney, true, "Should route directly to doc-journey when active task mode is 'slide'");

// Scenario 3: Stale task mode (e.g. 'app') from previous message, but slide is still active
const staleTaskMode = 'app';
const resolvedTaskMode = determineTaskMode(slideFile, staleTaskMode);
assert.strictEqual(resolvedTaskMode, 'slide', "Task mode should evaluate to 'slide' because the active selected file is a presentation");

console.log("✔ Slide Task Mode Routing Verification Passed successfully!");
