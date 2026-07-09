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

### Invariant 5: Child Chats Hierarchy & Top-Level Artifact Landing
Within a Space (`activeSpaceId`), user actions generate dedicated child chat sessions (`${spaceId}-chat-${Date.now()}`) bound to `activeSpaceId = spaceId`:
- **Doc Creation**: Generating a document creates a child chat session with `taskType: 'doc'`, placing `document.doc` directly in the library as a top-level artifact.
- **Custom Tool Creation (`mode === 'tool'`)**: Choosing to build a custom tool creates a child chat session with `taskType: 'site'`, leaving the canvas blank without creating a placeholder `index.html` until Ollie generates the actual tool.
- **Inferred Tasks Setup (`mode === 'tracking'`)**: Enabling work tracking creates a child chat session with `taskType: 'inferred'` and places `inferred_tasks.json` as a top-level artifact in the library.
- **General Q&A / Research**: Asking a question from the parent space root chat (`targetChatId === resolvedFolderId`) generates a distinct child chat session under the Space hierarchy in `LeftNav`.

When navigating back to a Space (clicking the parent space in `LeftNav` or closing an artifact from breadcrumbs `Space > Doc`), the application MUST:
1. Set `targetChatId = spaceId` (or maintain a clean parent space chat) instead of falling back to previous doc child chats.
2. Check for canonical top-level artifacts (`index.html` or `inferred_tasks.json`). If present, the canvas automatically lands on that top-level artifact. If neither exists, the user lands on a clean space view with the choice onboarding pills.
3. Clicking on a specific child chat in `LeftNav` deterministically resolves and selects its corresponding artifact (`index.html` for tool chats, `document.doc` for doc chats, `inferred_tasks.json` for inferred task chats).

### Invariant 6: Consistent Iconography
To maintain visual clarity across `LeftNav` and the File Library (`FileIcon`):
- **Custom Tools (`site`, `index.html`)**: Must be represented by the Sites icon (`html.png`).
- **Inferred Tasks (`inferred`, `inferred_tasks.json`, tracking)**: Must be represented by the task tracking icon (`forms.png`).
- **Documents (`doc`)**: Must be represented by the document icon (`docs.png`).

### Invariant 7: Strict Unique ID Filtering (No Name Matching)
All array filtering and state updates against `recentTasks` and `projects` MUST operate strictly on unique identifiers (`t.id !== targetId` or `p.id !== targetId`). Legacy string name matching (`name.toLowerCase() !== projectName.toLowerCase()`) is strictly prohibited when updating workspaces or child chats. Because multiple child chats under a Space share the parent space's `name` (e.g., `'Ollie'`), filtering by name wipes out concurrent child chats. By relying exclusively on unique IDs, zero collision occurs, allowing multiple child chats (`Custom Tool`, `New Document`) to exist simultaneously under the same parent Space without overwriting or deleting one another.

### Invariant 8: Child Artifact Persistence Guard (`saveChatToDb`)
Whenever an AI streaming handler (`/api/vibe-code`, `/api/doc-journey`) finishes generating or updating artifact content for a child chat session (`targetChatId`), it MUST explicitly execute `saveChatToDb(...)` passing the full updated `sandboxFiles` list and any derived smart title. Without this explicit persistence call, generated documents or tools exist only in ephemeral React state and will fail to restore from database storage when the user switches between chats in `LeftNav`. Furthermore, when initializing new artifacts in `handleCreateArtifactApp`, `saveChatToDb` must always receive the full combined workspace files manifest (`[...sandboxFiles.filter(...), newArtifact]`) rather than a singleton array (`[newArtifact]`), preventing accidental deletion of other canonical files from storage.

### Invariant 10: Backend Domain Model Persistence (`chatName`, `type`, `taskType`)
To ensure child chats never lose their descriptive names or revert to `"Chat X"` fallbacks in `LeftNav`, both the frontend persistence client (`saveChatToDb`) and the backend endpoint (`POST /api/chats/:chatId`) MUST explicitly include and store `chatName`, `type`, and `taskType`. Preserving `taskType` (`doc`, `site`, `inferred`) is critical when restoring child chats in `handleFileClick`: without it, artifact resolution falls through to default tool matching (`index.html`), causing document chats to erroneously load custom tools into the Canvas viewport.

### Invariant 11: Home Workspace Collaborator Avatar Isolation
When navigating into personal Home dashboards or inferred tasks under Home (`isHomeChatId(activeSpaceId)` is true), collaborator avatars from previously visited shared Spaces MUST NOT leak into the header. `CanvasHeader` must explicitly check that the workspace is not a Home chat before rendering `<SharedMembersAvatars />`, and `App.tsx` must explicitly reset `setMembers([])` whenever switching to or restoring Home chat sessions.

---

## 3. Verification & Maintenance
When adding new navigation tabs, space onboarding flows, or sidecar chats:
1. Check that any call to `setActiveSpaceId` is accompanied by `setActiveChatId`.
2. Verify that database persistence calls do not overwrite `home_*.json` files when working inside a non-home project workspace.
3. Ensure child chats created in workspaces explicitly set `activeSpaceId` to their parent space ID and include `taskType` so `LeftNav` groups and icons them cleanly.
4. Verify that closing breadcrumbs or selecting a space parent always navigates to top-level canonical artifacts (`index.html` / `inferred_tasks.json`) or clean onboarding chats without trapping the user in child doc sessions.
5. Ensure `setProjectName(...)` is guarded against running inside Spaces during artifact generation so space names remain immutable.
6. Confirm that backend storage APIs (`/api/chats/:chatId`) destructure and persist `chatName`, `type`, and `taskType`.
7. Verify that collaborator avatars are stripped and reset when viewing tasks or files under personal Home chats.


