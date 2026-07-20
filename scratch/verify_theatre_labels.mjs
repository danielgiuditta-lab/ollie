import assert from 'node:assert';

// Simulate getNativeToolLabel logic from TheatreView.tsx
function getNativeToolLabel(activeTask) {
  if (!activeTask) return 'Open in Drive';

  const targetUrl = activeTask.links?.[0]?.url || '';
  const textToMatch = [
    activeTask.type,
    activeTask.sourceMimeType,
    activeTask.sourceName,
    activeTask.workspace,
    activeTask.title,
    activeTask.description,
    targetUrl,
    activeTask.filesToLoad?.[0]?.type,
    activeTask.filesToLoad?.[0]?.mimeType,
    activeTask.filesToLoad?.[0]?.name
  ].filter(Boolean).join(' ').toLowerCase();

  if (textToMatch.includes('slide') || textToMatch.includes('presentation') || textToMatch.includes('gslides') || textToMatch.includes('ppt')) {
    return 'Open in Slides';
  }
  if (textToMatch.includes('doc') || textToMatch.includes('word') || textToMatch.includes('gdoc') || textToMatch.includes('pdf') || textToMatch.includes('essay') || textToMatch.includes('brief')) {
    return 'Open in Docs';
  }
  if (textToMatch.includes('sheet') || textToMatch.includes('csv') || textToMatch.includes('excel') || textToMatch.includes('gsheet') || textToMatch.includes('spreadsheet')) {
    return 'Open in Sheets';
  }
  if (textToMatch.includes('mail') || textToMatch.includes('gmail') || textToMatch.includes('email') || textToMatch.includes('gemail') || textToMatch.includes('inbox')) {
    return 'Open in Gmail';
  }
  if (textToMatch.includes('chat') || textToMatch.includes('message')) {
    return 'Open in Chat';
  }
  if (textToMatch.includes('calendar') || textToMatch.includes('event') || textToMatch.includes('schedule')) {
    return 'Open in Calendar';
  }
  if (textToMatch.includes('form')) {
    return 'Open in Forms';
  }
  if (textToMatch.includes('meet')) {
    return 'Open in Meet';
  }

  return 'Open in Drive';
}

const mockTasks = [
  {
    task: { type: 'chat', workspace: 'Google Chat', sourceName: 'Google Chat' },
    expected: 'Open in Chat'
  },
  {
    task: { type: 'slide', sourceMimeType: 'application/vnd.google-apps.presentation', sourceName: 'Deck.gslides' },
    expected: 'Open in Slides'
  },
  {
    task: { type: 'doc', sourceMimeType: 'application/vnd.google-apps.document', sourceName: 'Essay.gdoc' },
    expected: 'Open in Docs'
  },
  {
    task: { type: 'sheet', sourceName: 'Data.csv' },
    expected: 'Open in Sheets'
  },
  {
    task: { type: 'mail', sourceName: 'Gmail' },
    expected: 'Open in Gmail'
  },
  {
    task: { workspace: 'Calendar Alerts', sourceName: 'Google Calendar' },
    expected: 'Open in Calendar'
  },
  {
    task: { type: 'fyi', sourceName: 'Compliance Portal' },
    expected: 'Open in Drive'
  }
];

for (const { task, expected } of mockTasks) {
  const result = getNativeToolLabel(task);
  console.log(`Task [${task.sourceName || task.type}]: got "${result}", expected "${expected}"`);
  assert.strictEqual(result, expected);
}

console.log('ALL THEATRE NATIVE TOOL LABEL TESTS PASSED SUCCESSFULLY!');
