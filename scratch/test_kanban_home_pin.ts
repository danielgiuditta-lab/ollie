import assert from 'assert';

// Verification of envId resolution logic for pinned artifacts
function resolveCardEnvId(file: any, defaultEnvId: string | null) {
  return file.envId || file.activeSpaceId || file.chatId || defaultEnvId;
}

const pinnedFileFromSpace = {
  id: 'kanban-board-file-1',
  name: 'index.html',
  chatId: 'space-12345-chat-999',
  activeSpaceId: 'space-12345',
  envId: 'space-env-abc123'
};

const homeDefaultEnvId = null;

const resolvedEnv = resolveCardEnvId(pinnedFileFromSpace, homeDefaultEnvId);
assert.strictEqual(resolvedEnv, 'space-env-abc123', 'Should resolve origin space envId even when rendered on Home');

console.log('✅ Kanban board envId resolution test passed successfully!');
