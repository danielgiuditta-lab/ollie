# Product User Journey — Inferred Proactive Tasks

This guide walks through the complete end-to-end user journey for **Inferred Proactive Tasks** across the global Home Dashboard and project-scoped Space viewports.

---

## 🚀 Step 1: Authentication & Global Scanned Ingestion
1. The user visits the Spaces Platform homepage.
2. If unauthenticated, the **Google OAuth gate** displays. The user clicks **Login to Drive** to grant read/write access to Gmail, Chat, and Drive.
3. Upon successful sign-in, the viewport defaults to the **Home Dashboard** (`viewState === 'home'`, `activeSpaceId === 'home_guest'`).
4. In the background, the client triggers the `/api/workspace-digest` scanner.
5. The backend fetches active unread email threads, Google Chat messages, and document comment threads from the past 7 days, and relays them to Gemini to synthesize today's To-Do list.

---

## 📊 Step 2: Aggregated Home Dashboard View
1. The Home Dashboard aggregates and displays **all inferred tasks** across every space.
2. The user sees a list of To-Do items (e.g. Slide deck updates for "Galaxy Deck", H2 Planning Doc updates, Spreadsheet edits for "Team priorities").
3. The very first task automatically initiates the **Proactive Agent drafting timeline**:
   - The status circle displays the rotating SVG gradient loader (status: `working`).
   - The description says: `Working on task...`
   - The right side shows a dark preview thumbnail block containing `Drafting...` text and a pulsing `Sparkles` icon.
4. Other tasks in the list show a green `CheckCircle2` (status: `done`).

---

## 📂 Step 3: Project-Scoped Space Viewport (The Space Dashboard)
1. The user clicks on a project space in the Left Navigation pane (e.g. **Galaxy Deck**).
2. The active folder switches to the space ID (`activeSpaceId === 'space-123'`), and the Canvas transitions to `'files'` view.
3. Because no specific file is selected (`selectedFile === null`), the viewport renders the **Space Dashboard** (powered by `HomeLanding`).
4. **Scoped Filtering**: The dashboard scans `todoItems` and filters them, showing **only inferred tasks relevant to Galaxy Deck** (e.g. "Review Deck updates based on Chandu's comments"). Tasks from "H2 Planning Doc" or "Team priorities" are filtered out.
5. The background compiler timer continues running inside this viewport.

---

## ⚡ Step 4: Proactive Agent Draft Completion & Preview
1. After 40 seconds, the simulation timer completes.
2. The active task's status transitions to `done` (green checkmark circle).
3. The description updates to: `Chandu commented on to consolidate slides. I did, please review.`
4. The right-hand preview container renders a visual thumbnail representing the updated draft slide deck with a zoom hover effect.
5. The user clicks the preview thumbnail.
6. The editor sidebar opens, loading the sandbox files state with the compiled draft (`Galaxy Deck.gslides`).
7. The user can view the draft slides in the preview iframe, chat with Gemini to adjust the draft, or click **Approve & Publish** to save the changes back to Google Drive.
