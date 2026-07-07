# 🌌 Spaces Platform — Designer Onboarding Guide

Welcome to **Spaces Platform**! This repository is an AI-native workspace and collaborative design environment where users build web apps, generate documents, explore Drive files, and collaborate live with Gemini AI agents and teammates.

This guide is written specifically for **designers and builders**. It puts our **main user journeys right at the top** in simple, human terms, followed by core architecture terms, component taxonomy, and a vibe-coding cheat sheet.

---

## 🗺️ 1. Main User Journeys

### 📂 1. Finding, Selecting, and Viewing a File
* **What Happens**: Users browse their Google Drive files on the home landing page or search through the workspace file tree. Clicking any file opens it in the canvas viewport, smartly formatted for its type (interactive web apps run in a live preview iframe, Google Docs render on editorial paper cards, spreadsheets render in bordered grids, and code scripts display in monospace blocks).
* **Views & Components Used**: [`HomeLanding.tsx`](src/components/Canvas/HomeLanding.tsx) (home screen), [`FilesList.tsx`](src/components/Canvas/FilesList.tsx) (drive files list), [`CanvasSidebar.tsx`](src/components/Canvas/CanvasSidebar.tsx) (file directory rail), [`FileViewer.tsx`](src/components/Canvas/FileViewer.tsx) (viewer router), [`NativeViewer.tsx`](src/components/Canvas/NativeViewer.tsx) (doc/sheet/code viewer), [`AppView.tsx`](src/components/Canvas/AppView.tsx) (live app iframe).

---

### ✨ 2. Finding Information with AI Mode
* **What Happens**: Users toggle the "AI Mode" button to turn on intelligent generative search. As they type in the search bar, real-time typeahead suggestions appear with automated task summaries, and active search cards glow with an ambient rainbow gradient rim.
* **Views & Components Used**: [`AIModeButton.tsx`](src/components/Shared/AIModeButton.tsx) (mode toggle), [`TypeAhead.tsx`](src/components/Canvas/TypeAhead.tsx) (smart query completion menu), [`RainbowRimOverlay.tsx`](src/components/Shared/RainbowRimOverlay.tsx) (glowing rainbow aura overlay).

---

### 📝 3. Creating a Doc with Gemini
* **What Happens**: Users ask Gemini in the chat sidebar to research a topic, draft a proposal, or synthesize notes. Gemini analyzes workspace files and generates a beautiful document summary card in the canvas complete with clickable file citation badges.
* **Views & Components Used**: [`ChatSidebar.tsx`](src/components/Chat/ChatSidebar.tsx) (agent chat stream), [`AISummaryView.tsx`](src/components/Canvas/AISummaryView.tsx) (generated doc view card), [`SourceChip.tsx`](src/components/Shared/SourceChip.tsx) (citation capsule badges).

---

### ⚡ 4. Creating an App with Gemini
* **What Happens**: Users describe a web app they want to build (e.g., "Create an ad performance dashboard"). Gemini writes and compiles code in a live sandbox while showing clean, expandable progress cards in the chat stream. As Gemini codes, the web app immediately runs and updates live inside the preview iframe.
* **Views & Components Used**: [`Composer.tsx`](src/components/Chat/Composer.tsx) (prompt input), [`TaskCard.tsx`](src/components/Chat/TaskCard.tsx) (real-time build step cards), [`AppView.tsx`](src/components/Canvas/AppView.tsx) (live web preview iframe).

---

### 👥 5. Sharing My App & Collaborating Live with Cursors
* **What Happens**: Clicking the "Share" button generates a unique short link. When teammates open the link, they join the active workspace session and move around together with colored multiplayer cursor avatars displaying their names in real time.
* **Views & Components Used**: [`TopBar.tsx`](src/components/Navigation/TopBar.tsx) (top header & share modal trigger), [`PeerCursors.tsx`](src/components/Canvas/PeerCursors.tsx) (live multiplayer cursors overlay).

---

### 📽️ 6. Presenting Prototypes in Projector Mode
* **What Happens**: Users switch to Projector Mode to present their built app distraction-free. All sidebars, chat panes, and editing toolbars fade away, expanding the live running app to 100% full screen.
* **Views & Components Used**: [`Projector.tsx`](src/components/Canvas/Projector.tsx) (full-screen presenter view).

---

### ⚡ 7. Inferred Proactive Tasks
* **What Happens**: The platform scans the user's workspace history (emails, chat threads, Drive comments) in the background and uses Gemini to infer actionable To-Do tasks. If a task is actionable, a background developer agent automatically drafts the changes in an isolated sandbox, displaying a loading status loader on the dashboard followed by a visual preview card. The user can click the preview to inspect, edit, or approve and publish the draft back to Google Drive.
* **Views & Components Used**: [`InferredTaskCard.tsx`](src/components/Chat/InferredTaskCard.tsx) (flat task cells), [`StatusIndicator.tsx`](src/components/Chat/StatusIndicator.tsx) (animated progress indicator), `/api/workspace-digest` (LLM workspace synthesis route).

---

## 🎨 2. Core Architecture & Terminology

Here are the core domain terms used throughout the code and design system so you can vibe-code with precision.

| Term | What It Is & What It Does | Key Components / Files |
| :--- | :--- | :--- |
| **`Spaces`** | The workspace engine. When a user imports files or starts a prompt, the app dynamically creates a local virtual Space titled with an AI summary of the task, copies selected files into it, and keeps them synced. | [`App.tsx`](src/App.tsx), `server.ts` |
| **`CanvasMain`** | The primary workspace panel on the right side of the split screen. It holds the file directory navigation sidebar on its left edge and the main document/preview viewport on the right. | [`CanvasMain.tsx`](src/components/Canvas/CanvasMain.tsx) |
| **`ChatSidebar`** | The AI assistant panel on the left side of the split screen where users chat with the AI, submit prompts, attach files, and inspect build tasks. | [`ChatSidebar.tsx`](src/components/Chat/ChatSidebar.tsx) |
| **`AppView`** | The live web app preview viewport. It executes and runs web applications (`index.html`) inside an interactive, responsive iframe. | [`AppView.tsx`](src/components/Canvas/AppView.tsx) |
| **`NativeViewer`** | A smart multi-format viewer that formats Google Docs, Markdown files, CSV spreadsheets, and raw code with tailored typography and custom layouts. | [`NativeViewer.tsx`](src/components/Canvas/NativeViewer.tsx) |
| **`TaskCard`** | An interactive progress card in the AI chat stream. It expands to show step-by-step progress, tool execution steps, timeline phases, and terminal logs as the AI works. | [`TaskCard.tsx`](src/components/Chat/TaskCard.tsx) |
| **`AI Mode`** | A generative enhancement state toggled via `AIModeButton`. It wraps active cards and prompt inputs in an ambient glowing rainbow aura (`RainbowRimOverlay`). | [`AIModeButton.tsx`](src/components/Shared/AIModeButton.tsx) |
| **`Projector Mode`** | An immersive, distraction-free presenter view that hides all sidebars, chat panes, and editing controls so users can showcase live working prototypes full-screen. | [`Projector.tsx`](src/components/Canvas/Projector.tsx) |

---

## 🧩 3. Complete Component Directory & Taxonomy

Below is the master catalog of all React UI components in the repository, organized by directory:

### 📱 `src/components/Canvas/` (Workspace & Viewing Engines)
* **[`CanvasMain.tsx`](src/components/Canvas/CanvasMain.tsx)** — Top-level host for the workspace canvas. Manages split layout between `CanvasSidebar` and the active viewer.
* **[`CanvasSidebar.tsx`](src/components/Canvas/CanvasSidebar.tsx)** — Clean files directory navigation panel on the left of Canvas. Supports file search filtering, selection states, and contextual file icons.
* **[`CanvasTopBar.tsx`](src/components/Canvas/CanvasTopBar.tsx)** — Header bar embedded inside the canvas for controlling device viewports (mobile/desktop) and refresh actions.
* **[`AppView.tsx`](src/components/Canvas/AppView.tsx)** — Responsive iframe executor for live HTML/JS web previews.
* **[`NativeViewer.tsx`](src/components/Canvas/NativeViewer.tsx)** — Core native document renderer for Docs, Markdown, CSV tables, and raw code.
* **[`FileViewer.tsx`](src/components/Canvas/FileViewer.tsx)** — High-level router that decides whether to delegate to `AppView` or `NativeViewer`.
* **[`HomeLanding.tsx`](src/components/Canvas/HomeLanding.tsx)** — Modern hero landing view featuring prompt quick-starts and workspace creation templates.
* **[`NullState.tsx`](src/components/Canvas/NullState.tsx)** — Drive recent files viewer and file upload ingestion zone before a workspace is created.
* **[`LandingInput.tsx`](src/components/Canvas/LandingInput.tsx)** — Prominent central search/prompt input bar on the landing screen.
* **[`FilesList.tsx`](src/components/Canvas/FilesList.tsx)** — Grid/list layout displaying drive files with multi-select checkboxes.
* **[`Projector.tsx`](src/components/Canvas/Projector.tsx)** — Full-screen, distraction-free presenter component.
* **[`PeerCursors.tsx`](src/components/Canvas/PeerCursors.tsx)** — Real-time multiplayer cursor pointers overlay.
* **[`AISummaryView.tsx`](src/components/Canvas/AISummaryView.tsx)** — Formatted summary view card generated by AI agent operations.
* **[`CoverSlide.tsx`](src/components/Canvas/CoverSlide.tsx)** — Presentation style cover card component.

### 💬 `src/components/Chat/` (Agent Dialogue System)
* **[`ChatSidebar.tsx`](src/components/Chat/ChatSidebar.tsx)** — Main container for agent conversation trajectory and streaming state.
* **[`Composer.tsx`](src/components/Chat/Composer.tsx)** — Input text box featuring file attachment chips, prompt send controls, and AI mode switches.
* **[`TaskCard.tsx`](src/components/Chat/TaskCard.tsx)** — Expandable accordion card rendering agent tool calls, execution steps, and progress timeline.
* **[`InferredTaskCard.tsx`](src/components/Chat/InferredTaskCard.tsx)** — Flat light-grey cell representing inferred proactive tasks on the Home landing dashboard.
* **[`BotMessage.tsx`](src/components/Chat/BotMessage.tsx)** — Agent speech bubble.
* **[`UserMessage.tsx`](src/components/Chat/UserMessage.tsx)** — User prompt bubble with attached resource capsule chips.
* **[`ThinkingAnimation.tsx`](src/components/Chat/ThinkingAnimation.tsx)** — Smooth looping pulsing indicator representing model inference.

### 🧭 `src/components/Navigation/` (App Navigation Chrome)
* **[`LeftNav.tsx`](src/components/Navigation/LeftNav.tsx)** — Primary app navigation bar (Drive, Home, Recent Workspaces, Settings). Supports collapsibility.
* **[`TopBar.tsx`](src/components/Navigation/TopBar.tsx)** — Header bar displaying active workspace title, user authentication profile, and Share flow modal trigger.

### 🧩 `src/components/Shared/` (Design Primitives & Micro-Interactions)
* **[`AIModeButton.tsx`](src/components/Shared/AIModeButton.tsx)** — Toggle pill button for switching in and out of AI Mode.
* **[`RainbowRimOverlay.tsx`](src/components/Shared/RainbowRimOverlay.tsx)** — Ethereal animated gradient border overlay used during generative AI tasks.
* **[`SourceChip.tsx`](src/components/Shared/SourceChip.tsx)** — Compact pill badge displaying referenced drive files or citations.
* **[`Button.tsx`](src/components/Shared/Button.tsx)** & **[`IconButton.tsx`](src/components/Shared/IconButton.tsx)** — Core atomic button primitives with hover states and micro-animations.

---

## 🛠️ 4. Design & Coding Rules (Strict Conventions)

When adding or modifying components, strictly follow these project rules established in [`AGENTS.md`](AGENTS.md):

1. **Tailwind First Styling**: Rely exclusively on Tailwind CSS utility classes. Avoid inline `style={}` attributes or custom CSS files.
2. **Visual Aesthetic**: Maintain clean, high-contrast visual design, generous negative space, intentional typography pairings, and subtle interactive animations.
3. **No Unsolicited UI Volume**: Do not add unrequested floating docks, complex layout switchers, or extra decorative buttons unless explicitly requested by the user. True quality comes from immaculate spacing and clean layout.
4. **Real Data Connections**: Never use hardcoded mock placeholders for files or user state. Always use real Google Drive OAuth data and live sandbox state.

---

## 💡 5. Vibe-Coding Cheat Sheet (Prompting Guide)

When using AI coding assistants to modify this application, copy and use these exact prompt patterns for maximum accuracy:

| Goal | Example Vibe-Coding Prompt | Key Components Targeted |
| :--- | :--- | :--- |
| **Modify Document Rendering** | *"Update `NativeViewer` to render Google Docs with a wider paper margin and larger serif headers."* | [`NativeViewer.tsx`](src/components/Canvas/NativeViewer.tsx) |
| **Adjust Chat Progress Steps** | *"Style the collapsed state of `TaskCard` in `ChatSidebar` to show a subtle progress ring and clean timeline phase labels."* | [`TaskCard.tsx`](src/components/Chat/TaskCard.tsx), [`ChatSidebar.tsx`](src/components/Chat/ChatSidebar.tsx) |
| **Tweak File Tree Side Nav** | *"Enhance `CanvasSidebar` so active files highlight with a rounded left accent indicator and clean file icons."* | [`CanvasSidebar.tsx`](src/components/Canvas/CanvasSidebar.tsx) |
| **Refine Home Landing** | *"Update `HomeLanding` and `NullState` to give the recent files list a cleaner grid layout with hover shadows."* | [`HomeLanding.tsx`](src/components/Canvas/HomeLanding.tsx), [`NullState.tsx`](src/components/Canvas/NullState.tsx) |
| **Enhance AI Mode Effects** | *"Adjust `RainbowRimOverlay` to have a slower, softer gradient animation when `AIModeButton` is active."* | [`RainbowRimOverlay.tsx`](src/components/Shared/RainbowRimOverlay.tsx), [`AIModeButton.tsx`](src/components/Shared/AIModeButton.tsx) |

---

## 🚀 Getting Started Locally & Team Collaboration

For complete step-by-step instructions on forking, cloning, configuring API keys, running locally, and submitting Pull Requests back to the main repository, see **[`FORK_INSTRUCTIONS.md`](FORK_INSTRUCTIONS.md)**.