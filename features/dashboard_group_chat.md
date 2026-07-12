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

### 1.3 Dual-Collection Pinning & Explicit Pinning Mandate (`getSpacePins`)
Because newly created spaces exist in `recentTasks` and may not immediately reside in `projects`:
* **Dual Collection Updating:** All pinning modification handlers (`handlePinArtifact`, `handleUnpinArtifact`, `handleReorderPins`) must map and update both `setProjects(...)` and `setRecentTasks(...)` concurrently.
* **Explicit User Pinning Only:** Document (`.doc`) and slide deck (`.gslides`) creation handlers MUST NOT auto-pin newly generated artifacts to space dashboards. Pinning occurs exclusively when the human user explicitly clicks the Pin action button in the breadcrumb toolbar (`CanvasHeader`) or right-hand File Library (`CanvasSidebar`).
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

### 1.4 Dashboard Child Chat Artifact Aggregation (`getAllSpaceFiles`), Session-Scoped IDs & Robust Card Matching
* **Child Chat Artifact Aggregation (`getAllSpaceFiles`):** When viewing the root Space Dashboard or Home (`viewState === 'dashboard'` or `'home'`), custom tools and documents generated inside child authoring chats (`${spaceId}-chat-...`) are aggregated across `recentTasks`, `projects`, and `workspaceCacheRef`, preserving `.chatId` for authoring jumps.
* **Robust Card Match Resolution:** In `<SpaceDashboard />`, matching `pinnedArtifactIds` against `sandboxFiles` checks `f.id === id || f.driveId === id`, with case-insensitive and suffix fallback checks (`id.endsWith('-' + f.name.toLowerCase())`). This guarantees custom tools pinned from spaces render live preview cards when viewed on Home.
* **Strict Container Object Guard (`isSpaceObject`):** Navigation handler `handleFileClick` strictly checks container flags (`type === 'space'`, `type === 'workspace'`, `isProject`, `chats`) and excludes file objects with file extensions (`!file.name?.includes('.')`). Clicking **Edit** or the card header on a dashboard preview card resolves `specificFileMatch` directly to the custom tool file (`index.html`) without misclassifying it as a space container.
* **Session-Scoped File IDs:** In `/api/vibe-code`, generated code files must never be assigned generic IDs like `'sandbox-file-0'`, as this causes ID collisions across multiple tools in the same space. All generated files must be scoped to their chat session: `id: `${targetChatId || activeChatId || 'sandbox'}-file-${i}``.

### 1.5 Canvas Container & Sidebar Visibility (`viewState === 'dashboard'`)
* **Canvas Wrapper Visibility:** When rendering `<CanvasMain />` in `App.tsx`, the conditional check MUST explicitly include `viewState === 'dashboard'`. Omitting `'dashboard'` causes the entire canvas container to unmount, leaving a blank screen when navigating to root spaces.
* **Library Panel Visibility:** The right-hand `<CanvasSidebar />` (Library drawer) MUST also include `viewState === 'dashboard'` in its rendering condition so users can toggle and view space library files while on the dashboard.

### 1.6 Home Dashboard Pinning Support (`<HomeLanding />`)
* **Home Pinning Grid:** In addition to custom space dashboards, the root Home dashboard (`viewState === 'home'`, via `<HomeLanding />`) supports pinning vibe coded apps and library artifacts. When `pinnedArtifactIds` is non-empty on Home, `<HomeLanding />` embeds `<SpaceDashboard />` directly above the "To Do:" section.
* **Cache & Persistence Synchronization:** To guarantee immediate responsiveness on Home, all pinning operations update `workspaceCacheRef.current[activeSpaceId]` alongside `projects` and `recentTasks`, and the backend endpoint (`POST /api/chats/:chatId`) explicitly destructures and stores `pinnedArtifactIds`.

---

## 2. Component Specifications

### 2.1 The Space Dashboard Canvas (`<SpaceDashboard />`)
* **Null State (Empty Dashboard):** Displays a clean, minimalist placeholder on the canvas stating "No pinned artifacts yet. Click the pin icon on any library item or child chat to pin it here." The choice onboarding pills remain located strictly inside the Group Chat sidebar when the space is new.
* **Pinned Items Grid (Interactive Widget Grid):** Loops over `pinnedArtifactIds`, resolves the corresponding files from `sandboxFiles`, and renders interactive mini-preview widgets in a responsive masonry/grid layout:
  * **Custom Tools (`index.html`, site):** Live scaled iframe preview or responsive rendering with an "Open Tool" badge.
  * **Documents (`.doc`, `.md`):** Clean serif typography card showing author, last modified timestamp, and live excerpt snippet.
  * **Tracking Boards (`inferred_tasks.json`):** Miniature live Kanban summary widget showing To Do / In Progress / Done counts and assignee avatars.
### 2.3 Pinned Card Interaction & Layout Mechanics
* **Live Previews & Full Interactivity:** All cards render full, unscaled, interactive live previews (`pointer-events-auto`, `h-[460px]`), allowing users to directly interact with vibe coded tools (e.g. dragging Kanban cards, clicking buttons) without leaving the dashboard grid. Clicking the title in the header toolbar opens the authoring chat.
* **Visual Drop Shadows:** Cards utilize premium elevation shadows matching the chat input composer (`shadow-[0_8px_30px_rgba(220,225,235,0.45)]` in light mode and `shadow-[0_8px_30px_rgba(0,0,0,0.3)]` in dark mode).
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
