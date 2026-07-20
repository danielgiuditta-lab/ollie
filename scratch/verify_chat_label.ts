import fs from 'fs';
import path from 'path';

console.log("=== Verifying TheatreView Native Tool Label Logic ===");

const mockTasksPath = path.join(process.cwd(), 'data', 'mock_inferred_tasks.json');
const tasks = JSON.parse(fs.readFileSync(mockTasksPath, 'utf8'));

const liamTask = tasks.find((t: any) => t.id === 'todo-share-files');

if (!liamTask) {
  console.error("FAIL: Liam task (todo-share-files) not found!");
  process.exit(1);
}

console.log("Found Liam Task:", {
  id: liamTask.id,
  type: liamTask.type,
  workspace: liamTask.workspace,
  sourceName: liamTask.sourceName,
  title: liamTask.title,
  description: liamTask.description
});

function getNativeToolLabel(activeTask: any) {
  if (!activeTask) return 'Open in Drive';

  const sourceAndType = [
    activeTask.type,
    activeTask.sourceMimeType,
    activeTask.sourceName,
    activeTask.workspace,
  ].filter(Boolean).join(' ').toLowerCase();

  if (sourceAndType.includes('chat') || sourceAndType.includes('message')) {
    return 'Open in Chat';
  }
  if (sourceAndType.includes('mail') || sourceAndType.includes('gmail') || sourceAndType.includes('email') || sourceAndType.includes('gemail') || sourceAndType.includes('inbox')) {
    return 'Open in Gmail';
  }
  if (sourceAndType.includes('calendar') || sourceAndType.includes('event') || sourceAndType.includes('schedule')) {
    return 'Open in Calendar';
  }
  if (sourceAndType.includes('meet')) {
    return 'Open in Meet';
  }
  if (sourceAndType.includes('slide') || sourceAndType.includes('presentation') || sourceAndType.includes('gslides') || sourceAndType.includes('ppt')) {
    return 'Open in Slides';
  }
  if (sourceAndType.includes('sheet') || sourceAndType.includes('csv') || sourceAndType.includes('excel') || sourceAndType.includes('gsheet') || sourceAndType.includes('spreadsheet')) {
    return 'Open in Sheets';
  }
  if (sourceAndType.includes('form')) {
    return 'Open in Forms';
  }
  if (sourceAndType.includes('doc') || sourceAndType.includes('word') || sourceAndType.includes('gdoc') || sourceAndType.includes('pdf') || sourceAndType.includes('essay') || sourceAndType.includes('brief')) {
    return 'Open in Docs';
  }

  const targetUrl = activeTask.links?.[0]?.url || '';
  const fullTextToMatch = [
    sourceAndType,
    activeTask.title,
    activeTask.description,
    targetUrl,
    activeTask.filesToLoad?.[0]?.type,
    activeTask.filesToLoad?.[0]?.mimeType,
    activeTask.filesToLoad?.[0]?.name
  ].filter(Boolean).join(' ').toLowerCase();

  if (fullTextToMatch.includes('chat') || fullTextToMatch.includes('message')) {
    return 'Open in Chat';
  }
  if (fullTextToMatch.includes('mail') || fullTextToMatch.includes('gmail') || fullTextToMatch.includes('email') || fullTextToMatch.includes('gemail') || fullTextToMatch.includes('inbox')) {
    return 'Open in Gmail';
  }
  if (fullTextToMatch.includes('calendar') || fullTextToMatch.includes('event') || fullTextToMatch.includes('schedule')) {
    return 'Open in Calendar';
  }
  if (fullTextToMatch.includes('meet')) {
    return 'Open in Meet';
  }
  if (fullTextToMatch.includes('slide') || fullTextToMatch.includes('presentation') || fullTextToMatch.includes('gslides') || fullTextToMatch.includes('ppt')) {
    return 'Open in Slides';
  }
  if (fullTextToMatch.includes('sheet') || fullTextToMatch.includes('csv') || fullTextToMatch.includes('excel') || fullTextToMatch.includes('gsheet') || fullTextToMatch.includes('spreadsheet')) {
    return 'Open in Sheets';
  }
  if (fullTextToMatch.includes('form')) {
    return 'Open in Forms';
  }
  if (fullTextToMatch.includes('doc') || fullTextToMatch.includes('word') || fullTextToMatch.includes('gdoc') || fullTextToMatch.includes('pdf') || fullTextToMatch.includes('essay') || fullTextToMatch.includes('brief')) {
    return 'Open in Docs';
  }

  return 'Open in Drive';
}

const label = getNativeToolLabel(liamTask);
console.log(`Resulting Button Label: "${label}"`);

if (label === 'Open in Chat') {
  console.log("SUCCESS: Button label is correctly 'Open in Chat'!");
} else {
  console.error(`FAIL: Expected 'Open in Chat', but got '${label}'`);
  process.exit(1);
}
