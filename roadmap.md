# makeFolder Workspace — Feature Roadmap & Milestones

This file tracks the development milestones for adding the **Sharing Flow** (collaborative workspace sharing) and **Projector Mode** (presenter/viewer-only canvas). As features are designed, implemented, and verified, their items will be checked off here.

---

## 🛠 Milestones & Implementation Status

### 📍 Phase 1: Conceptualization & Architecture Specifications
- [x] Create feature guidelines and requirements for Projector Mode (`/features/projector.md`)
- [x] Create architectural specifications for the Google Drive and Firestore-based Share Flow (`/features/sharing.md`)
- [x] Link the roadmap to the master developer instructions (`/AGENTS.md`)

### 📍 Phase 2: Projector Mode Foundations
- [x] Create basic `/src/components/Canvas/Projector.tsx` component
- [x] Incorporate Projector Route / Viewstate detection in the main React routing engine (`/src/App.tsx`)
- [x] Style Projector Mode using high-contrast, immersive cinematic canvas aesthetics (full screen app viewer iframe, hide chat/files/control sidebars)
- [x] Implement computed style theme synchronizer feedback loop inside Projector Mode

### 📍 Phase 3: Sharing Flow Mechanics (Multiplayer MVP)
- [x] Check for existing Firestore setup and database definitions
- [x] Implement backend Express routes under `/api/share`:
  - `POST /api/share`: Map active `env_id` to a unique Firestore document ID, return short link slug
  - `GET /api/share/:slug`: Fetch associated `env_id` from the database given a unique key/slug
- [x] Build a "Share" action dialog/popover in the Top Bar and Left Sidebar navigation
- [x] Wire share link instantiation, copy-to-clipboard actions, and visual confirmations
- [x] Add URL parameter parsing (`?share=X`) to client-side initialization to trigger automated oauth validation and sandbox takeover

### 📍 Phase 4: Read-Only Viewer / Projector Share Flow Integration
- [x] Implement special routing parameter `?fullscreen=true` or `?mode=projector` that locks unauthorized or viewing-only users directly into full-screen Projector mode
- [x] Enforce security checks: check if the user has edit access or viewer access to decide whether to launch the full-workspace or locked Projector view
- [x] Verify clean, responsive rendering across mobile, presentation screens, and standard dashboards

### 📍 Phase 5: Verification & Hardening
- [ ] Validate codebase builds successfully using linting and compilation pipelines
- [ ] Perform comprehensive dry-runs of sandbox association, URL parsing, and state preservation
- [ ] Confirm no OAuth leakages or unauthorized file modifications occur under restricted viewer roles

### 📍 Phase 6: makeFolder Dynamic Drive Workspaces
- [x] Expand landing page file list with multi-file selection (checkboxes)
- [x] Store chosen files in React state as the workspace context
- [x] Create folder dynamically on Google Drive when a vibe-code conversation is started or files are imported:
  - Fetch 1-4 word task summary from `/api/summarize-task` for the folder's name
  - POST `https://www.googleapis.com/drive/v3/files` to create the folder
- [x] Copy selected files from Google Drive into the new folder:
  - POST `https://www.googleapis.com/drive/v3/files/{file_id}/copy` with `{ parents: [folder_id] }`
- [x] Dynamically ingest/download contents of original or copied files to populate `sandboxFiles`
- [x] Automatically save any new or modified vibe-coded files (e.g. `index.html`, `app.js`, `styles.css`) back to the Google Drive folder:
  - Create file inside the folder: POST `https://www.googleapis.com/drive/v3/files` with `{ name, parents: [folderId] }`
  - Upload file contents: PATCH `https://www.googleapis.com/upload/drive/v3/files/{file_id}?uploadType=media`
- [x] Provide nice visual indicators/status states on the TopBar or Files list showing active folder sync (icon and sync status)

### 📍 Phase 7: Unified Canvas Side Navigation & Native Viewers
- [x] Create modular `/src/components/Canvas/CanvasSidebar.tsx` displaying the sandbox files directory list
- [x] Implement real-time client-side search filtering within the sidebar
- [x] Highlight active files and style selected states cleanly to replicate Figma designs
- [x] Remove obsolete middle segmented controller from `/src/components/Canvas/CanvasMain.tsx`
- [x] Adjust padding rails to let files side nav flush elegantly with the top edge of the viewport
- [x] Create core `/src/components/Canvas/NativeViewer.tsx` to handle and separate file format rendering:
  - If `index.html` is selected: Execute code running in the `<AppView>` iframe
  - If `.md` or `.markdown` is selected: Format text into rich Markdown with `<ReactMarkdown>`
  - If a document is selected (e.g., `proposal`): Parse title, author, contributors, and related files dynamically into premium pill capsule badges, and render details in a warm Google Doc-style page layout
  - If spreadsheet is selected (e.g., `.csv` files): Parse and render as interactive tabular data sheets framed with column and row index rails
  - If development stylesheets/scripts are selected (e.g., `.css`, `.js`, `.json`): Render styled syntax-highlight feel raw code blocks in monospace
- [x] Incorporate reactive synchronization effects in `src/App.tsx` ensuring selected file states update dynamically on workspace delta events

### 📍 Phase 8: Agent Task Monitoring & Task Card
- [x] Create modular, expandable `/src/components/Chat/TaskCard.tsx` following high-fidelity screenshots
- [x] Integrate collapsed/open state interactions with chevrons and circular progress indicator
- [x] Map real-time agent output steps, tool calls, and model outputs into logical timeline phases
- [x] Rethink agent chat dialogue behavior to suppress logs, raw timestamps, and excessive paragraph explanations
- [x] Retain fully inspectable trace details inside the Task Card even after agent completions



