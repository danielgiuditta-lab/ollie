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

### Invariant 13: Explicit Artifact-to-Chat Mapping (`associatedFileId`, `associatedFileName`)
To prevent fuzzy substring matching collisions (e.g. clicking a doc chat whose title contains "Ollie" erroneously matching and loading an `Ollie.gslides` presentation from the library), every child chat session created for an artifact MUST explicitly store `associatedFileId` and `associatedFileName` pointing to the artifact it created or manages. This is enforced across:
- **Creation (`handleCreateArtifactApp`, `handleSelectSpaceMode`)**: When creating a tool, doc, slide, sheet, or tracking task, `associatedFileId` and `associatedFileName` are attached to the chat session in `recentTasks` and saved via `saveChatToDb(...)`.
- **AI Generation (`/api/doc-journey`)**: Upon renaming or updating document artifacts during streaming, the updated file ID and name are passed as `associatedFileId` and `associatedFileName` to `saveChatToDb(...)`.
- **Backend Persistence (`POST /api/chats/:chatId`)**: Both client and server endpoints explicitly accept and store `associatedFileId` and `associatedFileName`.
- **Artifact Resolution (`resolveArtifactForChat`)**: When navigating between chats in `LeftNav` via `handleFileClick`, `resolveArtifactForChat` checks for explicit `associatedFileId` / `associatedFileName` first. If missing (legacy chats), it filters candidates strictly by `taskType` (`doc`, `slide`, `sheet`, `site`, `inferred`) before performing exact or prefix base name matching, guaranteeing zero cross-type artifact collisions.

### Invariant 14: Space Mode Automatic Reversion (`spaceModes`)
When all canonical custom tool chats (`site` / `tool`) or work tracking tasks (`inferred` / `tracking`) and their corresponding filesystem artifacts (`index.html`, `inferred_tasks.json`) are deleted from a Space via `handleRemoveTask` or `handleRemoveFile`, the application MUST automatically reset `spaceModes[spaceId]` back to `'choice'`. This guarantees that deleting all active custom tools or tracking tasks restores the initial choice onboarding pills ("Let Ollie track your work" and "Build a custom tool with Ollie") in the chat sidebar.

### Invariant 15: Space Dashboard & Main Space Group Chat (`viewState === 'dashboard'`)
When selecting a root Space (`targetChatId === spaceId` and `!isHomeChatId(spaceId)`):
- The application sets `viewState = 'dashboard'`, rendering `<SpaceDashboard />` on the main canvas instead of defaulting to a blank canvas or auto-mounting a single tool.
- The dashboard displays all items pinned to `pinnedArtifactIds` as live interactive preview cards (scaled iframes for custom tools, scaled native document renderers for docs/slides/sheets). Clicking on a card body jumps to its dedicated child authoring chat.
- Cards feature a top-right 3-dots hover menu with **Edit** (navigates to child chat) and **Remove** (unpins from `pinnedArtifactIds`), proportional drag handles on vertical edges for resizing width ratios against adjacent cards, and drag-and-drop reordering.
- In `CanvasHeader`, hovering over any artifact title displays a pin icon button next to the close `X` button, allowing users to toggle pin status directly from breadcrumbs.
- The root Space chat sidebar operates as a **Group Chat** (`"${spaceName} Group Chat"`), featuring distinct light-grey surface styling (`bg-slate-100/90 dark:bg-[#18191B]/95`) to cleanly differentiate space orchestration from 1-to-1 child artifact authoring sessions.

### Invariant 16: Combined Library & Sandbox Resolution (`resolveArtifactForChat`)
When resolving the artifact associated with a chat session (`handleFileClick` or database chat restoration), `resolveArtifactForChat` MUST search across a combined array of all available file repositories: `const allAvailableFiles = [...(cached?.sandboxFiles || []), ...sandboxFiles, ...driveFiles];`. Because documents (`.doc`), spreadsheets, and slide decks (`.gslides`) synced from Google Drive reside in `driveFiles` rather than local `sandboxFiles`, combining both arrays guarantees that `associatedFileId` and `taskType` matching can reliably locate Drive-backed artifacts without falling back to default tool files (`index.html`).

### Invariant 17: Drive ID Validation & Additive Manifest Merging
To maintain stability across Google Drive syncing and database caching:
- **Drive ID Guards:** Before calling Google Drive APIs or `/api/ingest-context`, the application MUST verify that an ID is a valid Drive folder ID (`!id.startsWith('space-')` and `!id.startsWith('local-')`), eliminating `400 Bad Request` ("Invalid Value") errors when working in local or virtual space containers.
- **Additive Manifest Merging:** In `saveChatToDb`, when a child chat saves an artifact inside a space, it MUST merge its files into `workspaceCacheRef.current[resolvedSpaceId].sandboxFiles` (updating matching IDs or pushing new files) rather than overwriting the entire array with a single file. This ensures concurrent custom tools, docs, and slide decks are preserved in the space manifest.

### Invariant 18: Simulated Native Viewers & Disabled Iframes for Docs/Slides (`isIframeViewer`)
Because Google Docs and Google Slides actively block iframe embedding on localhost and unauthenticated preview URLs (throwing `Could not establish connection` or `target-densitydpi` errors), the application MUST set `isIframeViewer = false;` in `<NativeViewer />`. All Google Workspace documents, slide decks, and spreadsheets MUST render via interactive, high-fidelity simulated native viewers (`renderGoogleDocSim`, `renderGoogleSlidesSim`, `renderGoogleSheetSim`) rather than raw iframe previews.

### Invariant 19: Synchronous `driveFiles` Updating & Combined Library Rendering
To prevent newly generated documents from disappearing from the Library sidebar or dashboard:
- **Synchronous Generation Sync:** During AI streaming generation in `/api/doc-journey`, the client response handler MUST synchronously update both `setSandboxFiles` and `setDriveFiles` with new document titles and body content as chunks arrive and upon stream completion.
- **Combined Library Source List:** In `<CanvasSidebar />`, the root directory level (`prefix.length === 0`) MUST merge local and remote repositories: `const sourceList = [...(files || []), ...(driveFiles || [])];`. Similarly, `<SpaceDashboard />` MUST receive `sandboxFiles={[...sandboxFiles, ...driveFiles]}` so pinned items are always resolved.

### Invariant 20: LeftNav Selection & `skipSelect = false` Architecture
When selecting any child artifact or task in `<LeftNav />` (`onSelectTask`), the navigation handler MUST explicitly pass `skipSelect = false` and bind `targetChatId: task.id` when calling `handleFileClick`:
```ts
await handleFileClick(task, false, { isFromRecents: true, targetChatId: task.id });
```
Passing `skipSelect = true` is strictly prohibited for task/artifact chat selections, as it forces `setSelectedFile(null)` inside `handleFileClick`, clearing the canvas viewport and displaying an empty screen.

### Invariant 21: Root Space Preservation & Canonical Root Selection (`LeftNav.tsx`)
To prevent child artifact authoring chats from overriding the parent space and causing header clicks to show documents instead of the Space Dashboard:
- **Root Space Preservation (`processChatSession`):** When computing `spacesMap` in `LeftNav.tsx` from `projects` and `recentTasks`, if `c.id === spaceId || c.type === 'space'` (meaning `c` is the canonical space root object), the handler MUST explicitly update `spacesMap[spaceId].raw = c` and set `type: 'space'`. This guarantees that even if a newly created child document chat (`${spaceId}-chat-...`) resides at index 0 of `recentTasks`, the parent space header retains the true space root object.
- **Canonical Root Selection (`onSelectSpace`):** When a user clicks a parent space header in `LeftNav`, `onSelectSpace` MUST construct a canonical `rootSpaceObj` bound strictly to `id: space.id, activeSpaceId: space.id, chatId: space.id, type: 'space'` before delegating to `onSelectProject` or `onSelectTask`.
- **Global `isParentSpaceClick` Guards (`App.tsx`):** In `handleFileClick`, `isParentSpaceClick` (`targetChatId === folderId || (skipSelect && targetChatId === folderId)`) MUST be computed before cache evaluation and checked across all asynchronous branches (including database restoration and Drive ingestion fallbacks). If `isParentSpaceClick && !isHomeChatId(folderId)` is true, the handler MUST execute `setSelectedFile(null); setIndexFileSelected(false); setViewState('dashboard');`.

### Invariant 22: Unified Pinning Synchronization (`getSpacePins`)
Because newly created spaces exist in `recentTasks` and may not immediately reside in `projects`:
- **Dual Collection Updating:** All pinning modification handlers (`handlePinArtifact`, `handleUnpinArtifact`, `handleReorderPins`) MUST map and update both `setProjects(...)` and `setRecentTasks(...)` concurrently.
- **Unified Resolution (`getSpacePins`):** Whenever resolving `pinnedArtifactIds` for `<SpaceDashboard />` or pin toggle status in `<CanvasHeader />`, the application MUST use a unified `getSpacePins(spaceId)` helper searching both `projects` and `recentTasks`:
```ts
const getSpacePins = (spaceId: string | null) => {
  if (!spaceId) return [];
  const pObj = projects.find(p => p && (p.id === spaceId || p.activeSpaceId === spaceId));
  if (pObj && pObj.pinnedArtifactIds) return pObj.pinnedArtifactIds;
  const tObj = recentTasks.find(t => t && (t.id === spaceId || (t.type === 'space' && t.activeSpaceId === spaceId)));
  return tObj?.pinnedArtifactIds || [];
};
```

### Invariant 23: Dashboard Child Chat Artifact Aggregation (`getAllSpaceFiles`) & Session-Scoped IDs
* **Child Chat Artifact Aggregation (`getAllSpaceFiles`):** When viewing the root Space Dashboard (`viewState === 'dashboard'`), custom tools and documents generated inside child authoring chats (`${spaceId}-chat-...`) are not present in the root space's direct `sandboxFiles` array. To ensure pinned custom tools and docs resolve and render live previews on the grid, the app MUST pass `getAllSpaceFiles(activeSpaceId)` to `<SpaceDashboard />`. This helper aggregates `sandboxFiles` across the root space and all child chats in `recentTasks`, `projects`, and `workspaceCacheRef`, preserving `.chatId` for authoring jumps.
* **Session-Scoped File IDs:** In `/api/vibe-code`, generated code files MUST NEVER be assigned generic IDs like `'sandbox-file-0'`, as this causes ID collisions across multiple tools in the same space. All generated files MUST be scoped to their chat session: `id: `${targetChatId || activeChatId || 'sandbox'}-file-${i}``.

### Invariant 26: Parent Space Title Immutability & Breadcrumbs
`projectName` in application state MUST strictly represent the parent Space's title (or `'Home Dashboard'`). Opening child authoring chats or child artifacts in `handleFileClick` MUST NOT mutate `projectName` to match the child artifact's name. `CanvasHeader` resolves `spaceName` by looking up the parent space object matching `activeSpaceId` from `projects` and `recentTasks`, ensuring breadcrumbs strictly render `Space > Artifact` (e.g. `Ollie > Product Requirements Document`) and never `Artifact 1 > Artifact 2`.

### Invariant 27: Direct Artifact Target Resolution on Edit / Selection
When `handleFileClick` is invoked with a specific file object (such as clicking **Edit** or the card title on a pinned card in `<SpaceDashboard />`), `getAllSpaceFiles` attaches `activeSpaceId` to all resolved files so `folderId` evaluates to the parent space ID rather than the individual file ID. Additionally, `handleFileClick` matches and selects the exact file object directly (`specificFileMatch`) across memory cache and database restoration branches instead of falling through to default `resolveArtifactForChat` type guessing, guaranteeing pinned custom tools (`index.html`) open directly in `'app'` view.

### Invariant 28: Space Object Exclusion from `specificFileMatch`
In `handleFileClick`, when opening a Space or child chat session from `LeftNav`, `file` is passed as the parent Space raw object (e.g. `{ id: 'space-123', name: 'Ollie', type: 'space' }`). To prevent `specificFileMatch` from mistakenly comparing `f.name === file.name` against the parent space's title and selecting a random presentation or file from Google Drive (e.g. `Ollie.gslides`), `isSpaceObject` MUST verify container types exclusively (`Boolean(file.type?.includes('space') || file.type === 'workspace' || file.isProject || file.chats)`). Crucially, `isSpaceObject` MUST NOT check `file.activeSpaceId`, because `activeSpaceId` is attached to every resolved artifact file object by `getAllSpaceFiles`. Checking `activeSpaceId` erroneously causes custom tool files (`index.html`) to evaluate as Space containers, breaking `specificFileMatch` and preventing dashboard cards from opening in `'app'` view.

### Invariant 29: Child Memory Cache Dual-Indexing & Stream Target Preservation
During creation and AI streaming generation in `/api/vibe-code`, `saveChatToDb` and `setRecentTasks` MUST index and save memory cache and task list entries for both `targetChatId` (the active child chat ID) and `resolvedSpaceId` (the parent space ID). Preserving `targetChatId` with its associated `taskType`, `associatedFileId`, and `associatedFileName` guarantees instant memory cache restoration (`workspaceCacheRef.current[targetChatId]`) and prevents cross-type artifact collisions when switching chats in `LeftNav`.

### Invariant 30: De-polymorphized Navigation Helpers (`openSpace`, `openChat`, `openFile`)
`LeftNav.tsx` navigation callbacks (`onSelectSpace`, `onSelectChat`, `onSelectProject`, `onSelectTask`) MUST use explicit, strongly-typed helpers (`openSpace`, `openChat`, `openFile`) in `App.tsx` rather than passing generic, polymorphic objects directly to `handleFileClick`. This ensures that opening a space header (`openSpace(spaceId)`), switching authoring chats (`openChat(chatId)`), or viewing an artifact (`openFile(fileId)`) execute distinct, non-overlapping initialization steps.

### Invariant 31: Mount Cache Pre-Seeding & Task Mapping Integrity (`fetchGeminiTasks`)
When loading user chats on initial mount or page reload, `fetchGeminiTasks` MUST map and preserve `pinnedArtifactIds`, `sandboxFiles`, `associatedFileId`, `associatedFileName`, `taskType`, and `activeSpaceId` on every entry in `recentTasks`. Furthermore, `fetchGeminiTasks` MUST synchronously seed `workspaceCacheRef.current[c.chatId]` and `workspaceCacheRef.current[folderId]` during list processing so synchronous hooks (`getSpacePins`, `getAllSpaceFiles`, and `resolveArtifactForChat`) execute without cache misses upon initial page reload.

### Invariant 32: Database Pin Preservation Guard (`saveChatToDb` & `server.ts`)
Frontend persistence (`saveChatToDb`) MUST resolve current pinned IDs via `getSpacePins(...)` and include `pinnedArtifactIds` in POST payloads sent to `/api/chats/${chatIdVal}` and parent space syncs (`/api/chats/${resolvedSpaceId}`). The backend endpoint (`POST /api/chats/:chatId` in `server.ts`) MUST preserve existing backend document pins when `req.body.pinnedArtifactIds` is `undefined`, overwriting pins only when an explicit array (including `[]` for intentional unpinning) is supplied in `req.body`.

### Invariant 33: Child Chat Parent Space ID Guard (`handleFileClick`)
When navigating or switching context, `handleFileClick` MUST resolve parent space IDs (`folderId`) using string split fallback (`file.id.split('-chat-')[0]` or `targetChatId.split('-chat-')[0]`) if `activeSpaceId` is omitted. This guarantees `activeSpaceId` remains strictly bound to the parent Space ID and never mutates to a child chat session ID.

### Invariant 34: Auto-Pinning Artifacts on Creation (`handleCreateArtifactApp`)
When a custom tool, document, or slide deck artifact is initialized inside a Space (`!isHomeChatId(targetFolder)`), `handleCreateArtifactApp` MUST invoke `handlePinArtifact(newArtifact, targetFolder)` to automatically attach its `id` to the parent Space's `pinnedArtifactIds`. This ensures newly generated tools and artifacts immediately appear as live interactive preview cards on the parent `<SpaceDashboard>`.

### Invariant 35: Pin Isolation Guard for Child Chats (`saveChatToDb` & `fetchGeminiTasks`)
Only parent space containers (`chatIdVal === resolvedSpaceId`) and Home (`isHomeChatId(chatIdVal)`) store and transmit `pinnedArtifactIds`. Child chat sessions (`${spaceId}-chat-...`) MUST NOT carry separate `pinnedArtifactIds` in backend database payloads (`saveChatToDb`) or `recentTasks` items (`fetchGeminiTasks`), preventing pin leakage into Home or child chats upon page reload.

### Invariant 36: Consistent File ID Preservation (`/api/vibe-code`)
When processing generated code files (`deduplicatedParsedFiles`) upon vibe-code streaming completion, if a file with the same name already exists in `sandboxFiles` or `workspaceCacheRef.current[targetChatId]`, the handler MUST preserve the existing file's `id` and `driveId`. Preserving existing file IDs guarantees that `pinnedArtifactIds`, `associatedFileId`, and `resolveArtifactForChat` remain perfectly synchronized, allowing custom tools (`index.html`) to render cleanly both on the Space Dashboard and when clicking child tool chats.

---

## 3. Verification & Maintenance
When adding new navigation tabs, space onboarding flows, or sidecar chats:
1. Check that any call to `setActiveSpaceId` is accompanied by `setActiveChatId`.
2. Verify that database persistence calls do not overwrite `home_*.json` files when working inside a non-home project workspace.
3. Ensure child chats created in workspaces explicitly set `activeSpaceId` to their parent space ID and include `taskType` so `LeftNav` groups and icons them cleanly.
4. Verify that closing breadcrumbs or selecting a space parent always navigates to top-level canonical artifacts (`index.html` / `inferred_tasks.json`) or clean onboarding chats without trapping the user in child doc sessions.
5. Ensure `setProjectName(...)` is guarded against running inside Spaces during artifact generation so space names remain immutable.
6. Confirm that backend storage APIs (`/api/chats/:chatId`) destructure and persist `chatName`, `type`, `taskType`, `associatedFileId`, and `associatedFileName`.
7. Verify that collaborator avatars are stripped and reset when viewing tasks or files under personal Home chats.
8. Ensure all asynchronous generation callbacks use frozen space ID closures (`initialSpaceId`) rather than live React state to prevent ghost workspaces when navigating during streaming.
9. Verify that any new artifact generation workflow attaches `associatedFileId` and `associatedFileName` to its corresponding chat session.
10. Verify that removing tasks or files from a Space triggers mode evaluation and resets `spaceModes[spaceId]` to `'choice'` when no tool or tracking artifacts remain.
11. Confirm that `resolveArtifactForChat` is always passed a combined array of cached sandbox files, active sandbox files, and Drive library files (`[...cached, ...sandboxFiles, ...driveFiles]`).
12. Verify that saving child chats performs additive merging against parent space file manifests in `workspaceCacheRef`.
13. Confirm that `pinnedArtifactIds` are only attached to parent space containers and Home, preserving ID consistency across `/api/vibe-code` generation so custom tools render live cards on `<SpaceDashboard>` and full HTML views when clicking child chats.
14. **Automated Page Reload & Navigation Matrix Verification**: Execute `npx tsx scratch/test_e2e_reload_and_navigation.ts` to simulate complete page reloads (wiping React memory state), pre-cache restoration from backend storage, and rapid click navigation across Home, Space Dashboards, Custom Tool chats, and Document chats without data loss or UI rendering errors.
13. Ensure Drive API queries and context ingestion endpoints validate folder IDs against local/virtual prefixes before making network requests.
14. Confirm that `<NativeViewer />` sets `isIframeViewer = false` and uses simulated native paper viewers for Google Workspace documents and presentations.
15. Ensure any document generation streaming handler updates both `sandboxFiles` and `driveFiles` with renamed titles and content.
16. Verify that clicking a child chat or task in `<LeftNav />` never passes `skipSelect = true`.
17. Confirm that `processChatSession` in `LeftNav.tsx` updates `spacesMap[spaceId].raw` when encountering canonical root space objects (`id === spaceId || type === 'space'`).
18. Verify that `onSelectSpace` constructs a canonical `rootSpaceObj` with `id: space.id` before calling selection handlers.
19. Confirm that `isParentSpaceClick` is enforced across memory cache hits, database chat restoration, and Drive context ingestion fallbacks in `handleFileClick`.
20. Verify that all pinning operations update both `projects` and `recentTasks`, and use `getSpacePins(spaceId)` to resolve dashboard and breadcrumb pin states.
21. Confirm that `<SpaceDashboard />` receives `getAllSpaceFiles(activeSpaceId)` so tools and docs from child authoring chats are visible when pinned.
22. Verify that `/api/vibe-code` scopes generated file IDs to the session (`${targetChatId || activeChatId || 'sandbox'}-file-${i}`) to prevent ID collisions.
23. Confirm that the outer `<CanvasMain />` conditional check explicitly includes `viewState === 'dashboard'` so the dashboard container mounts when root spaces are selected.
24. Verify that `<CanvasSidebar />` (Library drawer) includes `viewState === 'dashboard'` in its visibility condition so library files can be viewed and toggled while on the dashboard.
### Invariant 37: Bidirectional Library Reverse Lookup (`findAssociatedChatForFile`) & Preservation Middleware
- **Bidirectional Library Lookup**: When a user selects an artifact from the File Library panel on the right (`CanvasSidebar`), `handleFileClick` executes `findAssociatedChatForFile(file, recentTasks)` to locate the child chat session where `associatedFileId === file.id` or `associatedFileName === file.name`. If found, `targetChatId` is set to that child chat session ID, automatically activating its authoring conversation thread in the left sidebar.
- **Backend Schema Preservation Guard**: The server endpoint (`POST /api/chats/:chatId` in `chats.ts`) fetches the existing chat JSON payload from disk before saving updates. If optional metadata (`associatedFileId`, `associatedFileName`, `taskType`, `chatName`, or `pinnedArtifactIds`) is omitted in streaming or partial client POST bodies, the endpoint preserves the existing on-disk values instead of writing `null`/`undefined`. This guarantees cold browser reloads (F5) rehydrate complete structural metadata.
- **Verification**: Run `npx tsx scratch/test_permanent_architectural_solution.ts` to verify reverse-lookup resolution, stream save metadata preservation, and cold page reloads.

### Invariant 38: TaskType-Aware `primaryFile` Binding & Universal Library Pinning
- **TaskType-Aware `primaryFile` Resolution**: In `saveChatToDb`, when resolving `primaryFile` for a chat session, the resolution logic inspects `resolvedTaskType`. Custom Tool/Site chats (`resolvedTaskType === 'site' || 'tool'`) prioritize `index.html` or `.html` as their `associatedFileId`, strictly prohibiting taking on `.gslides` or `.doc` file IDs from Google Drive library items.
- **Fallback ID Generation in `handlePinArtifact`**: When pinning a custom tool or document artifact that lacks an explicit `.id` or `.driveId` property on its React state object, `handlePinArtifact` generates a deterministic fallback ID (`${targetId}-tool` for custom tools or `${targetId}-${file.name}`). This attaches directly to the artifact object and `pinnedArtifactIds`, allowing custom tools to be pinned to Home and Space dashboards without error.
- **Universal Library Pin Action**: Pin icon buttons are rendered directly on File Library rows (`CanvasSidebar.tsx`), allowing users to pin or unpin any library item directly to Home or Space with 1 click.

### Invariant 39: Explicit Pin-Only Creation Mandate & Strict Container Object Guard
- **Explicit Pinning Mandate**: `handleCreateArtifactApp` strictly omits automatic `handlePinArtifact` calls upon initializing new documents (`.doc`) or slide decks (`.gslides`). Pinning occurs exclusively when the human user explicitly clicks the Pin action button in the breadcrumb toolbar (`CanvasHeader`) or right-hand File Library (`CanvasSidebar`).
- **Strict Container Object Separation (`isSpaceObject`)**: In `handleFileClick`, `isSpaceObject` exclusively verifies container flags (`type === 'space'`, `type === 'workspace'`, `isProject`, `chats`) and excludes objects with file extensions (`!file.name?.includes('.')`). Artifact files generated inside child chats carrying session-scoped IDs (`space-123-chat-...-file-0`) or `.chatId` properties are recognized as `specificFileMatch` and open directly in their native viewer/editor when clicked from dashboard preview cards.

### Invariant 41: Home Pins React State Synchronization & Routing Guard
- **Dedicated `homePins` State**: Because root Home is filtered out of `recentTasks` (`!isHomeChatId(ft.id)`), updates to Home pins do not alter `recentTasks` array references. A dedicated `homePins` React state tracks Home dashboard pins in memory, rehydrating from `/api/chats/${homeId}` in `loadHomeChat` upon initial page mount.
- **Synchronous Pin Updating**: `handlePinArtifact` and `handleUnpinArtifact` inspect `isHomeChatId(targetId)` and update `homePins` synchronously, triggering an immediate UI re-render of `<HomeLanding>` without requiring a browser refresh.
- **Home Navigation Routing Guard**: In `handleFileClick`, navigating to root Home (`isParentSpaceClick` and `isHomeChatId(folderId)`) evaluates `viewState = 'home'` (when no standalone tool/inferred task is running), ensuring `<HomeLanding>` mounts and displays the pinned artifacts section.






