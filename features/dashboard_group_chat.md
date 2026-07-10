# Space Dashboard & Group Chat Architecture Specification

## Executive Summary
This specification defines the transformation of the root Space experience in Ollie. When a user selects a parent Space (`targetChatId === spaceId`), the workspace will no longer default to a blank canvas or auto-mount a single custom tool. Instead, it transitions into a structured **Main Space Dashboard** capable of pinning any child artifact (tools, docs, sheets, tracking boards). Concurrently, the chat attached to the root space becomes a **Group Chat** (`[Space Name] Group Chat`) featuring distinct light grey styling to clearly differentiate it from 1-to-1 child artifact authoring chats.

---

## 1. Architectural Principles & Integration with Existing Models

### 1.1 Root vs. Child Domain Boundary
The recent transition to strict 1-to-1 primary key binding (`associatedFileId` / `associatedFileName`) for child chats makes this Dashboard model architecturally clean:
* **Child Chats (`${spaceId}-chat-...`)**: Remain dedicated, 1-to-1 authoring canvases locked to a single artifact ID (e.g. `PRD.doc` or `index.html`).
* **Root Space Chat (`targetChatId === spaceId`)**: Remains completely unbound to any single document (`associatedFileId: null`). Because it is free of single-artifact streaming rules, it operates as the multi-player orchestration hub and communication layer for the entire space.

### 1.2 The "Pinned" Data Model
To allow pinning any artifact from the library to the Main Space Dashboard, we will extend the canonical space manifest (`projects` array and `/api/chats/${spaceId}` schema):
```ts
interface SpaceManifest {
  id: string;
  name: string;
  type: 'space';
  pinnedArtifactIds?: string[]; // Ordered array of driveId / fileId strings
  dashboardLayout?: 'grid' | 'masonry' | 'list';
}
```
When a space is rendered in `<AppView />`, if `targetChatId === spaceId`, the app renders `<SpaceDashboard pinnedIds={space.pinnedArtifactIds} />` instead of a standalone file editor.

### 1.3 Dual-Collection Pinning Synchronization (`getSpacePins`)
Because newly created spaces exist in `recentTasks` and may not immediately reside in `projects`:
* **Dual Collection Updating:** All pinning modification handlers (`handlePinArtifact`, `handleUnpinArtifact`, `handleReorderPins`) must map and update both `setProjects(...)` and `setRecentTasks(...)` concurrently.
* **Unified Resolution (`getSpacePins`):** Whenever resolving `pinnedArtifactIds` for `<SpaceDashboard />` or pin toggle status in `<CanvasHeader />`, the application must use a unified `getSpacePins(spaceId)` helper searching both `projects` and `recentTasks`:
```ts
const getSpacePins = (spaceId: string | null) => {
  if (!spaceId) return [];
  const pObj = projects.find(p => p && (p.id === spaceId || p.activeSpaceId === spaceId));
  if (pObj && pObj.pinnedArtifactIds) return pObj.pinnedArtifactIds;
  const tObj = recentTasks.find(t => t && (t.id === spaceId || (t.type === 'space' && t.activeSpaceId === spaceId)));
  return tObj?.pinnedArtifactIds || [];
};
```

### 1.4 Dashboard Child Chat Artifact Aggregation (`getAllSpaceFiles`) & Session-Scoped IDs
* **Child Chat Artifact Aggregation (`getAllSpaceFiles`):** When viewing the root Space Dashboard (`viewState === 'dashboard'`), custom tools and documents generated inside child authoring chats (`${spaceId}-chat-...`) are not present in the root space's direct `sandboxFiles` array. To ensure pinned custom tools and docs resolve and render live previews on the grid, the app must pass `getAllSpaceFiles(activeSpaceId)` to `<SpaceDashboard />`. This helper aggregates `sandboxFiles` across the root space and all child chats in `recentTasks`, `projects`, and `workspaceCacheRef`, preserving `.chatId` for authoring jumps.
* **Session-Scoped File IDs:** In `/api/vibe-code`, generated code files must never be assigned generic IDs like `'sandbox-file-0'`, as this causes ID collisions across multiple tools in the same space. All generated files must be scoped to their chat session: `id: `${targetChatId || activeChatId || 'sandbox'}-file-${i}``.

---

## 2. Component Specifications

### 2.1 The Space Dashboard Canvas (`<SpaceDashboard />`)
* **Null State (Empty Dashboard):** Displays a clean, minimalist placeholder on the canvas stating "No pinned artifacts yet. Click the pin icon on any library item or child chat to pin it here." The choice onboarding pills remain located strictly inside the Group Chat sidebar when the space is new.
* **Pinned Items Grid (Interactive Widget Grid):** Loops over `pinnedArtifactIds`, resolves the corresponding files from `sandboxFiles`, and renders interactive mini-preview widgets in a responsive masonry/grid layout:
  * **Custom Tools (`index.html`, site):** Live scaled iframe preview or responsive rendering with an "Open Tool" badge.
  * **Documents (`.doc`, `.md`):** Clean serif typography card showing author, last modified timestamp, and live excerpt snippet.
  * **Tracking Boards (`inferred_tasks.json`):** Miniature live Kanban summary widget showing To Do / In Progress / Done counts and assignee avatars.
### 2.3 Pinned Card Interaction & Layout Mechanics
* **Live Previews:** All cards render actual live previews of their artifacts:
  * Custom tools (`index.html`) render via scaled live iframe.
  * Documents (`.doc`, `.md`) and Slides render via scaled live document previews.
* **Hover Menu (Top-Right 3 Dots):**
  * Hovering over any card reveals a 3-dots icon button in the top right corner.
  * Clicking the 3 dots opens a styled dropdown menu (using our shared design system tokens) with two options: **"Edit"** and **"Remove"**.
  * **Edit:** Opens the artifact and navigates the sidebar to its child chat session for authoring.
  * **Remove:** Unpins the artifact from the dashboard (`pinnedArtifactIds`) without deleting the file from the library.
* **Proportional Resizing (Side Handles):**
  * Hovering over the vertical edges of a card reveals interactive drag resizing handles.
  * Dragging a handle adjusts the card's proportional flex width. When > 2 artifacts share a dashboard row, resizing one card proportionately inversely scales the adjacent card widths.
* **Drag-and-Drop Reordering:**
  * Grabbing and dragging the 3-dots handle allows dragging one artifact over another to swap their positions in the grid (`pinnedArtifactIds` array order).

---

## 3. Execution Roadmap & Phased Delivery

### Phase 1: Data Model & Root State Refactoring
1. **Extend Space Manifest:** Add `pinnedArtifactIds` and custom card width ratios to state definitions in `App.tsx` and persistence endpoints in `server.ts`.
2. **View State Routing:** Modify `App.tsx` canvas resolution so selecting a root space (`targetChatId === spaceId`) sets `viewState = 'dashboard'` instead of falling back to empty null states. Ensure `isParentSpaceClick` is enforced across memory cache hits, database chat restoration, and Drive context ingestion fallbacks.
3. **Dual-Collection Pinning:** Implement `getSpacePins(spaceId)` and update pinning modification handlers to synchronize both `projects` and `recentTasks`.
4. **Root Space Preservation (`LeftNav`):** Update `processChatSession` to preserve root space raw objects when computing workspace trees so child authoring chats never override root space identifiers.

### Phase 2: Group Chat Visual Differentiation
1. **ChatSidebar Theme Prop:** Pass an `isGroupChat={targetChatId === activeSpaceId}` boolean prop to `<ChatSidebar />`.
2. **Style Injection:** Apply conditional Tailwind background classes (`bg-slate-100/80 dark:bg-[#18191B]`) and update header typography to render `"${spaceName} Group Chat"`.

### Phase 3: Dashboard Canvas & Resizing Implementation
1. **Build `<SpaceDashboard />` Component:** Create a new component in `/src/components/Canvas/SpaceDashboard.tsx` supporting flex-row grid wrapping and custom proportional width tracking.
2. **Live Widget Renders & Hover Menu:** Implement scaled live iframe/doc renderers, 3-dots hover button, and styled Edit/Remove dropdown.
3. **Resizing & Reordering Handlers:** Wire up side edge drag listeners for proportional adjacent card scaling and HTML5 drag-and-drop position swapping on the 3-dots handle.

### Phase 4: E2E Testing & Verification
1. **Automated Verification:** Create a Puppeteer test script verifying space selection renders the dashboard, pinning/unpinning persists to disk across both collections, and group chat styling applies cleanly.
2. **Human Walkthrough:** Review the feel of the light grey visual distinction and resizing fluid mechanics with the founder.
