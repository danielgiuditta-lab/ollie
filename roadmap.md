# Google Workspace Digest & Spaces Platform — Feature Roadmap & Milestones

This file tracks the development milestones for adding Google Workspace integrations (Gmail, Google Chat, and document comments), synthesizing "Today's Tasks" using Gemini, building Personal Spaces, and enabling Multiplayer Spaces.

---

## 🛠 Milestones & Implementation Status

### 📍 Phase 1: Planning & Feasibility
- [x] Analyze Google Chat search and Drive comments APIs feasibility
- [x] Align on design approach (reusing existing UI components)
- [x] Create implementation roadmap

### 📍 Phase 2: OAuth Scope & Backend Fetch Setup
- [x] Update frontend OAuth login scopes in `App.tsx` (add Gmail and Chat scopes)
- [x] Implement backend `/api/workspace-digest` query routes in `server.ts`:
  - [x] Fetch recent Gmail threads/messages (past 48h)
  - [x] Fetch Google Chat messages across all spaces (`POST /v1/spaces/-/messages:search`)
  - [x] Query recently modified Drive documents (Docs/Sheets/Slides) and fetch unresolved comment threads

### 📍 Phase 3: Today's Tasks Digest Synthesis
- [x] Connect fetched Workspace data to Gemini (`gemini-3.5-flash`) inside `/api/workspace-digest`
- [x] Define the structured prompt and JSON schema for agenda/task categories
- [x] Return synthesized action items and notifications back to the frontend

### 📍 Phase 4: Dashboard Home Landing UI
- [x] Create a new Dashboard view within `HomeLanding.tsx` (Today's Tasks panel, Recent Emails list, Chat feed, Active Comments)
- [x] Assemble UI using existing style components, lists, cards, and icon states

### 📍 Phase 5: Personal Spaces & Navigation Refactoring
- [x] Redesign LeftNav to display Home (Dashboard) and Spaces (using dynamic emojis, inline expand chevrons for nested chats, and bottom avatar controls)
- [x] Build sub-tabs and canvas views to list email threads, chat spaces, and docs comments in detail

### 📍 Phase 6: Project Spaces & Multiplayer Collaboration
- [x] Implement Private Spaces (Just Me) for isolated document and code authoring
- [x] Link Shared Spaces (With People) to shared workspace shards (`/api/share`)
- [x] Display co-presence cursor tracks, shared task backlog list, and collaborative documents
