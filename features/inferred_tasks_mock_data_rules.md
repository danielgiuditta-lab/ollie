# Feature Specification & Mock Data Rules — Inferred Tasks

## 1. Architecture & Storage Isolation
- **Mock Data Isolation**: All simulated inferred tasks for non-OAuth mock logins reside exclusively in the backend database/disk data store (`data/mock_inferred_tasks.json`) and are served via `GET /api/mock-inferred-tasks`.
- **Zero UI Hardcoding**: UI components (`.tsx` files) must NOT hardcode mock task arrays into component state. When authenticated via OAuth (`accessToken`), live Google Workspace APIs synthesize real digest data; when in mock mode, tasks are fetched dynamically from the database endpoint.

## 2. Proactive Diff View Layout (2-Card Standard)
The proactive view renders a clean, unadorned 2-column comparison:
- **Left Column (Original)**:
  - Header: `Original`
  - Card: Standard `DriveArtifactCard` displaying original baseline bullet points (`originalContentLines`).
  - Subtext: Description of collaborator comment context (`originalContext`).
- **Right Column (Suggested Update)**:
  - Header: `Suggested Update`
  - Card: Standard `DriveArtifactCard` displaying updated bullet points reflecting the agent fix (`updatedContentLines`).
  - Subtext: Summary of changes performed by the agent (`summaryOfChanges`).

## 3. Data Schema Specifications (`data/mock_inferred_tasks.json`)

To mock the three buckets of tasks effectively, mock objects must include:
- `category`: `"needs_approval" | "needs_input" | "fyi"` (mandatory).
- `type`: `"email" | "chat" | "comment" | "calendar" | "buganizer" | "doc" | "slide" | "sheet" | "fyi"` (mandatory).
- `links`: Array of `{ "label": "string", "url": "string" }` (optional, for FYI tasks).

### Data Schema Example
```json
[
  {
    "id": "todo-1",
    "title": "I updated Q3 Strategy Deck slide 3 per David's comment",
    "workspace": "Branding",
    "sourceName": "Q3 Strategy Deck.gslides",
    "sourceMimeType": "application/vnd.google-apps.presentation",
    "type": "slide",
    "category": "needs_input",
    "personName": "David",
    "personAvatar": "/people/david.jpg",
    "commentText": "The color scheme on this slide feels too cold and plain. Can we update it to our warm amber brand palette, and highlight the 45% YoY growth in a bold callout?",
    "originalContext": "David commented on Q3 Strategy Deck to use warm amber palette and feature 45% YoY growth.",
    "summaryOfChanges": "I updated the slide palette to warm amber tones and highlighted the 45% YoY growth metric callout.",
    "originalContentLines": [
      "• Q3 growth up year-over-year across core product tiers",
      "• Distribution extended to 12 new domestic and international regions",
      "• Pipeline performance and conversion figures pending layout review"
    ],
    "updatedContentLines": [
      "• 🚀 45% YoY Revenue Growth (Enterprise Tier Lead)",
      "• Distribution extended to 12 new domestic and international regions",
      "• Color palette updated to warm amber brand tokens per David's feedback"
    ]
  },
  {
    "id": "todo-cal-conflict",
    "title": "I proposed a meeting slot to resolve a focus block conflict",
    "workspace": "Calendar Alerts",
    "sourceName": "Google Calendar",
    "type": "calendar",
    "category": "needs_approval",
    "personName": "Chloe Bennett",
    "personAvatar": "/people/juyun.jpg",
    "description": "Chloe requested a sync during your afternoon focus block. I proposed an alternative slot.",
    "action": "Proposed alternative time slot.",
    "status": "done"
  },
  {
    "id": "todo-fyi-compliance",
    "title": "Complete Corporate Compliance Training",
    "workspace": "HR & Admin",
    "sourceName": "Compliance Portal",
    "type": "fyi",
    "category": "fyi",
    "personName": "Ollie",
    "personAvatar": "/people/default_user.jpg",
    "description": "Your mandatory annual corporate security training is due in 3 days.",
    "action": "Please complete the mandatory modules.",
    "status": "done",
    "links": [
      { "label": "Launch Training Portal", "url": "https://hr-training.example.com" }
    ]
  }
]
```
