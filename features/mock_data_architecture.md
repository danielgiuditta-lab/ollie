# Comprehensive Mock Data Architecture & Rules

## 1. General Principles & Database Isolation
- **Mock Storage Isolation**: All mock data (inferred tasks, chat histories, recent files, space states) must be stored in data files under the `data/` directory (e.g. `data/mock_inferred_tasks.json`, `data/chats/*.json`) and served via backend endpoints (`/api/mock-inferred-tasks`, `/api/user-chats/:email`, `/api/chats/:chatId`).
- **MANDATORY: ZERO HARDCODED MOCK DATA IN TSX FILES**: Under NO circumstances should mock dataset objects, task items, or placeholder arrays be written into `.tsx` files or React component state constants (e.g. `DEFAULT_TODO_ITEMS = []`). All mock data MUST reside exclusively in backend JSON files under `data/` and be fetched dynamically via server endpoints (`/api/...`). Modifying `.tsx` files to hardcode mock data items is strictly prohibited.
- **Strict Bifurcation Rule**:
  - **OAuth Authenticated (`accessToken !== null`)**: App fetches real Google Workspace content via Google APIs (`/api/workspace-digest`, Drive API). Mock datasets evaluate to empty arrays (`[]`).
  - **Simulated Mock Login (`!accessToken` / Mock User)**: App loads simulated database items from backend JSON files (`data/`).

## 2. Domain Context: Health UI Product Designer Persona
Mock data across the system reflects real artifacts and workflows owned by a Senior Product Designer at a Health UI / MedTech software company (**Aura Health Systems**):
- **Clinical UX Artifacts**: Patient Intake Kiosk Flows, Kiosk Registration Audits, HIPAA Biometric Consent.
- **Design System Tokens**: Telehealth Mobile UI, HSL Clinical Alert Tokens, Gloved Input Touch Targets.
- **EHR & Critical Care**: eMAR Nursing 4-Click Medication Flow, ICU Bedside Monitor Specs, 178° Wide-Angle Display Rules.
- **Medical Wearables & Compliance**: Continuous Glucose Monitor BLE Protocols, WCAG 2.2 AAA Accessibility Scorecards.

## 3. Proactive Diff View Layout (2-Column Standard)
- **Original Column**: Displays the baseline slide/doc content prior to requested changes.
- **Suggested Update Column**: Displays the modified slide/doc content updated by the agent based on collaborator comments.
- **No Unwanted Watermark Labels**: Cards do NOT display arbitrary "GOOGLE DOC (LETTER PORTRAIT)" or background glyph labels.
- **Pure Markdown Content**: Slide and document card contents render pure markdown (`originalMarkdown` & `updatedMarkdown`) containing rich, realistic domain information (6+ detailed bullet points / structured sections).
- **Slides Aspect Ratio**: Presentation decks render in landscape card containers (`aspect-[16/9]`).
- **Docs Letter Portrait Aspect Ratio**: Documents render in standard letter portrait containers (`aspect-[8.5/11]`).

## 4. Inferred Task Schema Example (`data/mock_inferred_tasks.json`)
```json
[
  {
    "id": "todo-1",
    "title": "I updated Patient Intake Kiosk UX per Dr. Vance's comment",
    "workspace": "Clinical UX",
    "sourceName": "Patient Intake Kiosk UX Audit.gslides",
    "sourceMimeType": "application/vnd.google-apps.presentation",
    "type": "slide",
    "personName": "Dr. Vance",
    "personAvatar": "/people/david.jpg",
    "commentText": "Slide 4 needs the updated HIPAA biometric consent flow. Add the 5-step patient verification steps, WCAG AAA font size requirements, and emergency override protocol.",
    "originalContext": "Dr. Vance requested adding 5-step biometric check, HIPAA session rules, and WCAG AAA font accessibility to Slide 4.",
    "summaryOfChanges": "I added 5-step biometric verification, 30s HIPAA timeout rules, and WCAG AAA accessibility standards to Slide 4.",
    "originalMarkdown": "# Patient Intake Kiosk — Registration Flow Audit\n\n- Initial touchscreen kiosk workflow tested across 3 hospital trial sites.\n- Basic patient demographic input and insurance card scanning screen.\n- Single-factor identity verification via birthdate and zip code lookup.\n- Emergency check-in queue routing options pending clinical review.\n- Accessibility features adhering to standard WCAG 2.1 AA baseline.\n- Manual paper consent backup form printed for patient signature.",
    "updatedMarkdown": "# Patient Intake Kiosk — Registration & Biometric Flow\n\n- Touchscreen kiosk workflow tested across 3 hospital trial sites (98.4% success rate).\n- **Biometric Identity Verification**: 5-step biometric check (fingerprint + photo ID match).\n- **HIPAA Compliance**: Encrypted ephemeral session storage with automatic 30s timeout.\n- **WCAG 2.2 AAA Accessibility**: Minimum 18pt font scale, 7:1 contrast ratio & audio assist mode.\n- **Clinical Emergency Override**: One-touch triage bypass button for acute symptoms.\n- **Insurance Processing**: Instant eligibility verification API integration with primary payers.\n- **Digital Consent Signature**: Biometrically signed e-form logged to patient EHR ledger."
  }
]
```
