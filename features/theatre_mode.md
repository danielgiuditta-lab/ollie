# Feature Specification — Theatre Mode (Taskview)

**Theatre Mode** (also known as **Taskview**) is a full-screen, cinematic task review and steering viewport. It allows users to iterate through and triage all inferred proactive tasks from the Home Dashboard in an immersive split-screen experience: a sidebar task directory on the left and the task's corresponding live artifact canvas in the center.

---

## 1. Product Vision & Structural Architecture

Theatre Mode reuses the platform's core UI components (`<Composer layout="bottom">`, `<NativeViewer>`, and `<InferredTaskDiffView>`) inside a high-contrast dark overlay (`dark bg-[#141517] text-white`).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Home > Taskview                                                    [Open in Slides] [X]│
├──────────────────────────────────┬─────────────────────────────────────────────────────┤
│                                  │                                                     │
│  Home Tasks Directory            │              ACTIVE TASK ARTIFACT VIEW              │
│  (All Home Inferred Tasks)       │                                                     │
│                                  │      ┌───────────────────────────────────────┐      │
│  ┌────────────────────────────┐  │      │                                       │      │
│  │ [▸] Consolidate Slides     │──┼─────>│   Actual Document / Slide Preview     │      │
│  │     (Selected Task Cell)   │  │      │   via <NativeViewer theme="dark" /> or│      │
│  └────────────────────────────┘  │      │   <InferredTaskDiffView theme="dark"/>│      │
│  │ [✓] Approved Task 2        │  │      │   (Matches canvas task click view)    │      │
│  │ [i] Compliance Training    │  │      │                                       │      │
│                                  │      └───────────────────────────────────────┘      │
├──────────────────────────────────┴─────────────────────────────────────────────────────┤
│      [◄]    [✕ (Decline)]   [<Composer layout="bottom" theme="dark" />] [✓ (Accept)] [►]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Reuse & Dark Theme Integration

Theatre Mode strictly leverages the application's standard design system components adjusted for dark background context:

1. **Root Overlay**: Wraps the viewport in `className="dark fixed inset-0 z-50 bg-[#141517] text-white"`, ensuring all Tailwind `dark:` utility styles activate across nested components.
2. **Top Header**: Left-aligned breadcrumbs (`Home > Taskview`), and right-aligned action buttons positioned all the way to the right (`Open in Slides/Docs` pill button `bg-[#282A2D]` + circular `X` close button `w-9 h-9 bg-[#282A2D]`).
3. **Inferred Task Decision Buttons**: Reuses the exact decision action buttons from inferred task cards (`InferredTaskCardExperimental.tsx`):
   - **Accept / Yes**: Circular green button (`w-12 h-12 rounded-full bg-[#E6F4EA] dark:bg-green-950/40 text-[#137333] dark:text-green-400 hover:bg-[#CEEAD6] dark:hover:bg-green-900/60`).
   - **Decline / No**: Circular red button (`w-12 h-12 rounded-full bg-[#FCE8E6] dark:bg-red-950/40 text-[#C5221F] dark:text-red-400 hover:bg-[#FAD2CF] dark:hover:bg-red-900/60`).
   - **Navigation Arrows**: Circular dark slate buttons (`w-12 h-12 rounded-full bg-[#282A2D] hover:bg-[#35373A] text-white`).
4. **Bottom Steer Composer**: Reuses `<Composer layout="bottom" theme="dark" />` (from `src/components/Chat/Composer.tsx`) for submitting steer prompt feedback in bottom composer mode.
5. **Artifact Center Canvas**: Displays the selected task's resolved document preview using `<NativeViewer>` or `<InferredTaskDiffView>`. Validates drive IDs (`isRealDriveId`) to prevent Google Docs `DocumentNotFoundException` errors for local/simulated task previews.

---

## 3. Direct Task-to-Artifact Navigation Mechanics

1. **Left Directory (Home Tasks List)**:
   - Displays all inferred proactive tasks available on the Home Dashboard.
   - Clicking any task cell selects that task and highlights its item card.

2. **Center Viewport (Resolved Task Artifact)**:
   - When a task cell is selected, the center canvas instantly resolves and displays **the exact artifact** associated with that task:
     - **Slide Decks (`.gslides`)**: Rendered via `<NativeViewer mode="preview" theme="dark" />`.
     - **Google Docs (`.doc`) / Spreadsheets (`.csv`)**: Rendered via `<NativeViewer mode="preview" theme="dark" />`.
     - **Proposed Edits & Diffs**: Rendered via `<InferredTaskDiffView theme="dark" />` showing baseline vs. agent draft changes.

---

## 4. Control Dock & Steer Workflow

- **Steer Input**: Reuses `<Composer layout="bottom" theme="dark" />` for submitting prompt feedback to the AI agent context.
- **Decision Buttons**:
  - **Accept (`Check`)**: Circular green button, marks task status as `'done'`, and auto-advances to the next task in the directory.
  - **Decline (`X`)**: Circular red button, marks task status as `'rejected'`, and auto-advances to the next task.
- **Navigation Arrows**: Circular dark slate buttons (`ArrowLeft`/`ArrowRight`) to cycle through the task directory.
