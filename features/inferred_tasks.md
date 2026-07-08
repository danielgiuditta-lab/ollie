# Feature Specification — Inferred Proactive Tasks

**Inferred Proactive Tasks** is an AI-powered context aggregation and synthesis engine. By scanning a user's Google Workspace footprint (recent email threads, Google Chat messages, and document comment threads) via active OAuth credentials, the platform compiles a centralized To-Do agenda list. It simulates a proactive background agent working to draft necessary file changes, allowing users to review, edit, and publish drafts directly within the Spaces staging workspace.

---

## 1. Product & Architecture Overview

The feature uses a lightweight state machine. When the user logs in, the Home Dashboard queries the backend, which aggregates live Workspace records and routes them to Gemini to synthesize actionable agenda items.

```
       ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
       │      Gmail API       │      │   Google Chat API    │      │    Drive Comments    │
       └──────────┬───────────┘      └──────────┬───────────┘      └──────────┬───────────┘
                  │                             │                             │
                  └─────────────────────┐       │       ┌─────────────────────┘
                                        ▼       ▼       ▼
                                  ┌──────────────────────────┐
                                  │    Express App Server    │
                                  │ ┌──────────────────────┐ │
                                  │ │ /api/workspace-digest│ │
                                  │ └──────────┬───────────┘ │
                                  └────────────┼─────────────┘
                                               │
                                      Raw Activity Details
                                               ▼
                                  ┌──────────────────────────┐
                                  │   Gemini 3.5 Flash API   │
                                  └────────────┬─────────────┘
                                               │
                                      Structured JSON Task List
                                               ▼
                                  ┌──────────────────────────┐
                                  │      Home Dashboard      │
                                  │   (<InferredTaskCard/>)  │
                                  └──────────────────────────┘
```

---

## 2. Technical API Specification

### Endpoint: `GET /api/workspace-digest`

*   **Authentication**: Expects Google OAuth bearer token in the `Authorization` header.
*   **Data Aggregated**:
    *   **Gmail**: Up to 5 threads modified within the past 48 hours.
    *   **Google Chat**: Search query filters for messages across all spaces within the past 48 hours.
    *   **Drive Comments**: Queries active Docs, Sheets, and Slides modified in the past 7 days, fetching unresolved comment threads and author details.
*   **Prompt Synthesis**: Aggregated raw blocks are structured into a prompt and submitted to `gemini-3.5-flash` with a JSON-controlled schema.

#### JSON Output Format
```json
{
  "summary": "1-sentence overview of today's work.",
  "immediateActions": [
    {
      "id": "todo-proactive-1",
      "description": "Review Brand Guidelines & updates based on Emily's comments",
      "action": "Emily commented to consolidate the Brand Kit layout. Please review and update.",
      "source": "Branding",
      "type": "comment"
    }
  ],
  "followUps": [],
  "updates": []
}
```

---

## 3. Frontend State & Caching Layout

To prevent UI flickering and unnecessary Google API rate limit consumption:
1.  **SWR Caching**: The React engine uses a localized lookup table (`todoCacheRef.current`) indexed by space ID (`spaceKey`). If tasks have been loaded for an active space, they are served instantly from memory upon navigation.
2.  **Project Filtering**:
    *   **Home View**: Shows only tasks marked with high personal relevance (`involvesMe !== false`).
    *   **Project Space View**: Filters the global tasks list based on a smart-matching overlap routine (scanning title, description, space identifiers, and active files inside the sandbox).

---

## 4. Proactive Agent Simulation & Preview UI

A major part of the experience is showing a proactive agent drafting updates in the background.

*   **Simulation States**:
    *   `working`: Status indicator displays a rotating SVG gradient loader. The right preview thumbnail is rendered as a dark card with a pulsing sparkles icon and `Drafting...` text.
    *   `done`: Status indicator switches to a green checkmark circle. The preview card displays a small visual outline of the document/slide outline with a zoom-on-hover effect.
*   **Timer**: When a task has status `working`, a client-side timer triggers for $40$ seconds. Upon expiration, the status switches to `done` and updates the task descriptions with the synthesized outcome.
*   **Staging Access**: Clicking the draft preview thumbnail loads the sandbox files (e.g. `Galaxy Deck.gslides`) and redirects the user to the files workspace canvas.

---

## 5. New Space Onboarding Choice Flow

When a user creates a new space, instead of immediately generating and jumping into inferred tasks, the application presents a structured choice lifecycle:
1. **Initial Creation State**: In the chat sidebar null state, the blue headline displays `What's this Space about?` with metaline `Tell me the what your trying to accomplish in this Space`, with no initial suggestion pills and context drawer collapsed. The canvas viewport remains completely blank (`bg-transparent`).
2. **Onboarding Choice Pills**: Once the topic and team members are finalized (`handleFinalizeSpace`), the newly created space presents two onboarding choice pills in the chat null state:
   - 🛡️ **Let Ollie track your work**: Sets space mode to `'tracking'`, activating the inferred task list (`To Do:`) in the space canvas.
   - ⚡ **Build a custom tool with Ollie**: Sets space mode to `'tool'`, initiating a conversational prompt from Ollie to vibe code a custom collaborative app for the space.
3. **Canonical Tool Launching**: When navigating back to any space where a custom tool (`index.html`) has been built, the canvas auto-selects that tool and mounts it in `<AppView>`, making the canvas itself function as that canonical tool.
