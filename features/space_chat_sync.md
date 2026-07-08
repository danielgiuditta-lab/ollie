# Space and Chat ID Synchronization Architecture

This document specifies the invariants, state synchronization rules, and database safety guards for tying chat sessions (`activeChatId`) to workspace spaces and home dashboards (`activeSpaceId`).

---

## 1. Problem Definition & Architecture Goals
Previously, when navigating to or creating a new Space, the React state for the active workspace (`activeSpaceId`) was updated while the chat session identifier (`activeChatId`) remained unchanged (often pointing to the user's Home chat ID, e.g., `home_danielgiuditta_google_com`). 

When a user submitted a message in the newly created space, the message handler resolved the target chat session against `activeChatId`, causing the project workspace's chat to be persisted into the Home chat JSON file on disk/database. On a hard refresh, the Home dashboard would load this corrupted file and display project-specific chat threads.

The goal of this architecture is to ensure strict 1-to-1 synchronization between spaces and their respective chat sessions across all UI transitions and database operations.

---

## 2. Core Architectural Invariants

### Invariant 1: Explicit Co-Synchronization on Creation and Switch
Whenever `setActiveSpaceId` is invoked to change the current workspace context, `setActiveChatId` MUST be invoked concurrently with the matching target ID. This applies to:
- **Space Creation (`handleCreateSpace`, `createSpace`, `handleFinalizeSpace`, `handleCreateArtifactApp`)**: Newly minted space IDs (e.g., `space-creation-...` or `space-...`) must immediately become the active chat ID. When creating a doc/slide artifact inside an unfinalized space (`space-creation-...`), the space MUST be auto-finalized into a persistent ID (`space-...`), updated in state, and added to `recentTasks` before creating the artifact.
- **Home Navigation (`loadHomeChat`, `onViewChange`)**: When switching to the home dashboard, `activeChatId` must explicitly be set to `getHomeChatId()`.
- **Proactive Task Journeys (`handleProactiveTaskClick`)**: When entering a task review, both `activeSpaceId` and `activeChatId` must resolve to the parent workspace or home. To prevent matching against home chats, proactive task matching must explicitly exclude any target where `isHomeChatId(s.activeSpaceId || s.id)` is true.
- **Doc Journey Fallbacks**: When creating temporary local workspaces for document drafting (`local-workspace-...`), the chat ID must match the local workspace ID.

### Invariant 2: Composer Target Chat Resolution Guard & Child Chats
In `handleSendMessage`, target chat session resolution (`targetChatId`) must obey strict domain isolation:
```ts
let targetChatId = activeChatId;
if (isHomeChatId(resolvedFolderId)) {
  // If the active workspace is Home, targetChatId is strictly bound to getHomeChatId()
  targetChatId = getHomeChatId();
} else if (!targetChatId || isHomeChatId(targetChatId)) {
  // If in a project workspace but activeChatId is missing or pointing to Home, fall back to space ID
  targetChatId = resolvedFolderId;
}
```
When spinning up an artifact via `handleCreateArtifactApp` (e.g. from an onboarding pill or composer), a dedicated child chat session (`${targetFolder}-chat-${Date.now()}`) MUST be created with `activeSpaceId` set to `targetFolder`. In `LeftNav.tsx`, the parent space auto-expands so child chat sessions are displayed directly below their parent space.

### Invariant 3: Database Persistence Guard (`saveChatToDb`)
To guarantee that UI edge cases or race conditions never corrupt the Home chat history, `saveChatToDb` enforces a strict validation rule before initiating network requests:
```ts
const resolvedSpaceId = spaceIdVal || activeSpaceId || chatIdVal;
if (isHomeChatId(chatIdVal) && !isHomeChatId(resolvedSpaceId)) {
  console.warn("Prevented saving workspace project chat into home chat ID:", { chatIdVal, resolvedSpaceId });
  return;
}
```

### Invariant 4: LocalStorage Normalization & `isHomeChatId`
When loading `recentTasks` from `localStorage`, entries representing home or home-like dashboards (`'home'`, `'home_guest'`, `'home dashboard'`, or IDs starting with `'home_'` / `'home-'`) MUST be normalized on parse to have `activeSpaceId: 'home'` and `name: 'Home'`. Furthermore, `isHomeChatId(id)` must trim strings and check all home prefix variations (`'home'`, `'home_guest'`, `'home_'`, `'home-'`, `'home dashboard'`).

---

## 3. Verification & Maintenance
When adding new navigation tabs, space onboarding flows, or sidecar chats:
1. Check that any call to `setActiveSpaceId` is accompanied by `setActiveChatId`.
2. Verify that database persistence calls do not overwrite `home_*.json` files when working inside a non-home project workspace.
3. Ensure child chats created in workspaces explicitly set `activeSpaceId` to their parent space ID so `LeftNav` groups them cleanly.

