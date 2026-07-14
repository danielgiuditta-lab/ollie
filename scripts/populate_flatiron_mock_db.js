import fs from 'fs';
import path from 'path';

const MOCK_EMAIL = 'mock-user@example.com';
const CHATS_DIR = path.join(process.cwd(), 'data', 'chats');

if (!fs.existsSync(CHATS_DIR)) {
  fs.mkdirSync(CHATS_DIR, { recursive: true });
}

function saveJson(filename, data) {
  const filePath = path.join(CHATS_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Saved: ${filename}`);
}

const now = new Date().toISOString();

// --- POLARIS / M3 DESIGN SYSTEM HEAD (FROM src/agent-system-prompt.md Section 8) ---
const POLARIS_M3_HEAD = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Google+Sans+Text:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root {
      --gemini-rail-icon-gap: 0px;
      --gemini-side-panel-padding-left: 16px;
      --gemini-side-panel-padding-right: 16px;
      --gemini-header-padding-left: 10px;
      --gemini-header-padding-right: 12px;
      --gemini-header-elements-gap: 8px;
    }
    body {
      font-family: 'Google Sans Text', sans-serif;
      background-color: #ffffff;
      color: #1f1f1f;
    }
    h1, h2, h3, h4, h5, button {
      font-family: 'Google Sans', sans-serif;
    }
  </style>
`;

// --- 1. HOME DASHBOARD ---
const homeChat = {
  chatId: 'home_mock_user_example_com',
  projectName: 'Home Dashboard',
  chatName: null,
  type: 'space',
  taskType: null,
  associatedFileId: null,
  associatedFileName: null,
  messages: [],
  envId: null,
  activeSpaceId: 'home_mock_user_example_com',
  sandboxUrl: '',
  sandboxFiles: [],
  userEmail: MOCK_EMAIL,
  members: [],
  pinnedArtifactIds: [
    'todo-card',
    'space-flatiron-ui-design',
    'space-flatiron-gtm',
    'space-flatiron-new-app-launch'
  ],
  updatedAt: now
};

// --- 2. SPACE 1: UI DESIGN ---
const spaceUiDesignId = 'space-flatiron-ui-design';
const spaceUiDesign = {
  chatId: spaceUiDesignId,
  projectName: 'UI Design',
  chatName: null,
  type: 'space',
  taskType: null,
  associatedFileId: null,
  associatedFileName: null,
  messages: [
    {
      role: 'bot',
      text: 'Elena Vance, Dr. Marcus Thorne, and Sarah Lin added to this space.',
      isMembersAddedNotice: true,
      addedMembers: ['Elena Vance', 'Dr. Marcus Thorne', 'Sarah Lin']
    }
  ],
  envId: null,
  activeSpaceId: spaceUiDesignId,
  sandboxUrl: '',
  sandboxFiles: [
    {
      id: `${spaceUiDesignId}-file-0`,
      name: 'index.html',
      type: 'code',
      mimeType: 'text/html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  ${POLARIS_M3_HEAD}
  <title>Trial Matcher</title>
</head>
<body class="p-6 bg-white text-[#1f1f1f]">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Action Controls -->
    <div class="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
      <div>
        <h2 class="text-lg font-medium text-[#1f1f1f]">Eleanor Vance (MRN #94821)</h2>
        <p class="text-xs text-[#5f6368]">62 y/o Female • Stage III NSCLC Adenocarcinoma • ECOG 1</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 bg-[#d3e3fd] text-[#041e49] text-xs rounded-full font-medium">12 Protocol Matches</span>
        <button class="px-4 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-lg transition shadow-xs cursor-pointer">Flag Selected Patient</button>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Genomic Panel Sidebar -->
      <div class="md:col-span-1 bg-[#f0f4f9] border border-[#e2e8f0] rounded-xl p-4 space-y-4">
        <h3 class="text-xs font-semibold text-[#444746] uppercase tracking-wider">Genomic Panel (FoundationOne® CDx)</h3>
        <div class="flex flex-wrap gap-2">
          <span class="px-2.5 py-1 bg-white border border-[#c4c7c5] text-[#1f1f1f] rounded-md text-xs font-medium">EGFR L858R (+)</span>
          <span class="px-2.5 py-1 bg-white border border-[#c4c7c5] text-[#1f1f1f] rounded-md text-xs font-medium">PD-L1 High (55%)</span>
          <span class="px-2.5 py-1 bg-white border border-[#e2e8f0] text-[#5f6368] rounded-md text-xs">KRAS Wildtype</span>
        </div>
        
        <div class="border-t border-[#e2e8f0] pt-3">
          <span class="text-xs font-semibold text-[#444746] uppercase tracking-wider">Treatment History</span>
          <p class="text-xs text-[#444746] mt-1 leading-relaxed">Completed Platinum-doublet chemotherapy (April 2026). No active CNS metastases.</p>
        </div>
      </div>

      <!-- Protocol Match Cards -->
      <div class="md:col-span-2 space-y-4">
        <!-- Match Filter Tabs -->
        <div class="flex gap-2 border-b border-[#e2e8f0] pb-2 text-xs">
          <button class="px-3 py-1.5 bg-[#d3e3fd] text-[#041e49] font-medium rounded-md">All Matches (3)</button>
          <button class="px-3 py-1.5 text-[#5f6368] hover:text-[#1f1f1f]">High Confidence (2)</button>
          <button class="px-3 py-1.5 text-[#5f6368] hover:text-[#1f1f1f]">Pending CRC Check (1)</button>
        </div>

        <!-- Card 1 -->
        <div class="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3 shadow-xs hover:border-[#a8c7fa] transition">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-[11px] font-medium text-[#0b57d0] uppercase tracking-wide">Phase 3 Protocol FL-LUNG-304</span>
              <h4 class="text-sm font-medium text-[#1f1f1f] mt-0.5">Targeted EGFR Tyrosine Kinase Inhibitor vs Standard SOC in Advanced NSCLC</h4>
            </div>
            <span class="text-sm font-bold text-[#0b57d0] bg-[#d3e3fd] px-2.5 py-1 rounded-md">98% Match</span>
          </div>
          <div class="bg-[#f0f4f9] p-3 rounded-lg text-xs text-[#444746] space-y-1">
            <div><strong>Inclusion Criteria:</strong> EGFR L858R mutation confirmed • ECOG 0-1</div>
            <div><strong>Site Access:</strong> OncoTrials Partner Practice (2.4 miles)</div>
          </div>
          <div class="flex justify-between items-center text-xs pt-1">
            <span class="text-[#5f6368]">Sponsor: Global Bio Oncology</span>
            <button class="px-3 py-1.5 bg-[#0b57d0] hover:bg-[#0842a0] text-white font-medium rounded-md cursor-pointer">Flag Patient</button>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3 shadow-xs hover:border-[#a8c7fa] transition">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-[11px] font-medium text-[#5f6368] uppercase tracking-wide">Phase 2 Protocol FL-IMMUNO-201</span>
              <h4 class="text-sm font-medium text-[#1f1f1f] mt-0.5">Novel Anti-PD-1 Combination Therapy for Solid Tumors</h4>
            </div>
            <span class="text-sm font-medium text-[#1f1f1f] bg-[#f0f4f9] px-2.5 py-1 rounded-md">85% Match</span>
          </div>
          <div class="flex justify-between items-center text-xs pt-1">
            <span class="text-[#5f6368]">Requires biomarker re-confirmation</span>
            <button class="px-3 py-1.5 bg-white border border-[#747775] text-[#1f1f1f] hover:bg-[#f0f4f9] font-medium rounded-md cursor-pointer">View Protocol</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
    },
    {
      id: `${spaceUiDesignId}-file-1`,
      name: 'patient_eligibility_uxr_readout.doc',
      type: 'code',
      mimeType: 'application/vnd.google-apps.document',
      content: `# OncoEMR Clinical Trial Screening - UXR Readout & Synthesis

**Author:** Sarah Lin (UX Research Lead, Flatiron Health)  
**Participants:** 14 Clinical Research Coordinators (CRCs) & 8 Community Oncologists  
**Context:** Evaluating point-of-care trial matching UI within routine OncoEMR chart workflows.

---

### Core Findings & User Needs

1. **Screening Fatigue is the #1 Barrier to Trial Enrollment**
   * Community CRCs review an average of 45 patient charts per week manually.
   * Finding biomarker-eligible patients takes 20-30 minutes per chart when cross-referencing external lab portals.
   * *Quote:* "If trial eligibility isn't visible right on the main chart summary when the oncologist orders lab tests, the patient gets started on standard chemo before we even know they qualified for a protocol."

2. **Desire for Automated Biomarker Highlights**
   * Oncologists strongly prefer inline pill badges for genomic markers (e.g. EGFR, ALK, PD-L1) rather than multi-page pathology PDFs.
   * High-confidence match scores (90%+) drive immediate flag requests to research teams.

3. **Design Recommendations for Sprint 4**
   * Embed eligibility match cards directly adjacent to OncoEMR treatment plan selection.
   * Provide one-click "Flag Patient for CRC Review" action with automated protocol pre-check.`
    },
    {
      id: `${spaceUiDesignId}-file-2`,
      name: 'oncology_component_specs.md',
      type: 'code',
      mimeType: 'text/markdown',
      content: `# Flatiron Design System Specs: Point-of-Care Trial Indicators

## Visual Hierarchy & Token Standards

- **Primary Brand Accent:** Polaris Blue (\`#0b57d0\`)
- **Trial Phase Badges:**
  - Standard Container: \`#f0f4f9\`
  - Active Selection: \`#d3e3fd\`
- **Accessibility & Contrast:**
  - Text contrast ratio against plain white background (\`#ffffff\`) must exceed 4.5:1.
  - Biomarker status indicators must convey positive/negative state via explicit textual labels (+ / -).`
    },
    {
      id: `${spaceUiDesignId}-file-3`,
      name: 'trial_matcher_deck.gslides',
      type: 'code',
      mimeType: 'application/vnd.google-apps.presentation',
      content: `# Presentation: OncoEMR Trial Matcher UI Design Review & Sprint Readout

Type: Google Slides
File ID: flatiron-deck-ui-design-01`
    }
  ],
  userEmail: MOCK_EMAIL,
  members: ['Elena Vance', 'Dr. Marcus Thorne', 'Sarah Lin'],
  pinnedArtifactIds: ['todo-card', `${spaceUiDesignId}-file-0`, `${spaceUiDesignId}-file-1`],
  updatedAt: now
};

// Child chats for Space 1
const space1Task1 = {
  chatId: `${spaceUiDesignId}-task-1`,
  projectName: 'UI Design',
  chatName: 'Update UX Deck Quotes',
  type: 'inferred',
  taskType: 'inferred',
  associatedFileId: `${spaceUiDesignId}-file-3`,
  associatedFileName: 'trial_matcher_deck.gslides',
  messages: [
    { role: 'user', text: 'Please extract quotes from the UXR synthesis doc and format them for Slides 4 & 5 in trial_matcher_deck.gslides.' },
    { role: 'bot', text: 'I have parsed `patient_eligibility_uxr_readout.doc` and structured quotes from Community CRCs regarding chart screening fatigue and biomarker pill visibility ready for Slide 4 and Slide 5.' }
  ],
  envId: null,
  activeSpaceId: spaceUiDesignId,
  sandboxUrl: '',
  sandboxFiles: spaceUiDesign.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceUiDesign.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space1Task2 = {
  chatId: `${spaceUiDesignId}-task-2`,
  projectName: 'UI Design',
  chatName: 'Refine UI Specs',
  type: 'inferred',
  taskType: 'inferred',
  associatedFileId: `${spaceUiDesignId}-file-2`,
  associatedFileName: 'oncology_component_specs.md',
  messages: [
    { role: 'user', text: 'Ensure visual specs meet WCAG AA standards for point-of-care clinical environments.' },
    { role: 'bot', text: 'Updated `oncology_component_specs.md` with explicit contrast ratios and dual color/text accessibility guidelines.' }
  ],
  envId: null,
  activeSpaceId: spaceUiDesignId,
  sandboxUrl: '',
  sandboxFiles: spaceUiDesign.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceUiDesign.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space1Task3 = {
  chatId: `${spaceUiDesignId}-task-3`,
  projectName: 'UI Design',
  chatName: 'Prepare Prototype Review',
  type: 'inferred',
  taskType: 'inferred',
  associatedFileId: `${spaceUiDesignId}-file-0`,
  associatedFileName: 'index.html',
  messages: [
    { role: 'user', text: 'Verify the interactive trial matcher prototype index.html is loaded for Dr. Thorne\'s medical review.' },
    { role: 'bot', text: 'The interactive prototype index.html with live biomarker filtering and protocol match scoring is ready for the review.' }
  ],
  envId: null,
  activeSpaceId: spaceUiDesignId,
  sandboxUrl: '',
  sandboxFiles: spaceUiDesign.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceUiDesign.members,
  pinnedArtifactIds: [],
  updatedAt: now
};


// --- 3. SPACE 2: GO TO MARKET ---
const spaceGtmId = 'space-flatiron-gtm';
const spaceGtm = {
  chatId: spaceGtmId,
  projectName: 'Go to Market',
  chatName: null,
  type: 'space',
  taskType: null,
  associatedFileId: null,
  associatedFileName: null,
  messages: [
    {
      role: 'bot',
      text: 'David Ross, Priya Patel, and Elena Vance added to this space.',
      isMembersAddedNotice: true,
      addedMembers: ['David Ross', 'Priya Patel', 'Elena Vance']
    }
  ],
  envId: null,
  activeSpaceId: spaceGtmId,
  sandboxUrl: '',
  sandboxFiles: [
    {
      id: `${spaceGtmId}-file-0`,
      name: 'index.html',
      type: 'code',
      mimeType: 'text/html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  ${POLARIS_M3_HEAD}
  <title>Expansion Tracker</title>
</head>
<body class="p-6 bg-white text-[#1f1f1f]">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Control Header -->
    <div class="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
      <div>
        <h2 class="text-lg font-medium text-[#1f1f1f]">OncoTrials® Practice Expansion Tracker</h2>
        <p class="text-xs text-[#5f6368]">Q3 Goal: Onboard 250 Community Research Sites</p>
      </div>
      <button class="px-4 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-lg transition cursor-pointer">Download Enablement Package</button>
    </div>

    <!-- M3 Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Active Sites</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">142</div>
        <div class="text-[11px] text-[#0b57d0] mt-1">+18 this month</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Monthly Screened</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">18,450</div>
        <div class="text-[11px] text-[#5f6368] mt-1">EHR auto-screened</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Flagged Referrals</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">2,140</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Point-of-care alerts</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Accrual Velocity</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">3.4x</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Speedup vs baseline</div>
      </div>
    </div>

    <!-- Practice Expansion Table -->
    <div class="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
      <h3 class="text-sm font-medium text-[#1f1f1f]">Regional Practice Onboarding Pipeline</h3>
      <table class="w-full text-left text-xs">
        <thead class="text-[#5f6368] border-b border-[#e2e8f0]">
          <tr>
            <th class="pb-2 font-medium">Practice Name</th>
            <th class="pb-2 font-medium">Oncologists</th>
            <th class="pb-2 font-medium">EMR Platform</th>
            <th class="pb-2 font-medium">Stage</th>
            <th class="pb-2 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#e2e8f0] text-[#1f1f1f]">
          <tr>
            <td class="py-3 font-medium">Texas Oncology Associates</td>
            <td>48</td>
            <td>OncoEMR Live</td>
            <td>CRC Workflow Training</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#d3e3fd] text-[#041e49] rounded text-[11px] font-medium">Active</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">Rocky Mountain Cancer Centers</td>
            <td>24</td>
            <td>OncoEMR Live</td>
            <td>Biomarker Gateway Setup</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#f0f4f9] text-[#1f1f1f] rounded text-[11px] font-medium">Onboarding</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">Highlands Oncology Group</td>
            <td>16</td>
            <td>OncoEMR Integrated</td>
            <td>Staff Protocol Kickoff</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#f0f4f9] text-[#1f1f1f] rounded text-[11px] font-medium">Kickoff</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`
    },
    {
      id: `${spaceGtmId}-file-1`,
      name: 'site_enablement_strategy_v2.doc',
      type: 'code',
      mimeType: 'application/vnd.google-apps.document',
      content: `# OncoTrials Site Enablement & CRC Onboarding Blueprint

**Author:** Priya Patel (Product Marketing Manager) & David Ross (VP Network Growth)

### Overview
Strategies for rapidly scaling OncoTrials point-of-care clinical trial screening across 250+ community oncology practices.

### Key Milestones
1. **Week 1-2:** OncoEMR system integration & biomarker data pipeline activation.
2. **Week 3:** Clinical Research Coordinator (CRC) workflow training session.
3. **Week 4:** Full go-live with biopharma trial enrollment tracking.`
    },
    {
      id: `${spaceGtmId}-file-2`,
      name: 'biopharma_partnership_proposal.doc',
      type: 'code',
      mimeType: 'application/vnd.google-apps.document',
      content: `# Flatiron Real-World Evidence & Trial Accelerator - Biopharma Overview

**Strategic Value Proposition for Sponsor Partners:**
- Access to de-identified real-world clinical data from 3.5M+ cancer patients across community practices.
- Accelerating protocol accrual rates by 3x through automated point-of-care matching.`
    },
    {
      id: `${spaceGtmId}-file-3`,
      name: 'gtm_executive_pitch.gslides',
      type: 'code',
      mimeType: 'application/vnd.google-apps.presentation',
      content: `# Presentation: OncoTrials Network Expansion & Biopharma GTM Pitch Deck

Type: Google Slides
File ID: flatiron-deck-gtm-02`
    }
  ],
  userEmail: MOCK_EMAIL,
  members: ['David Ross', 'Priya Patel', 'Elena Vance'],
  pinnedArtifactIds: ['todo-card', `${spaceGtmId}-file-0`, `${spaceGtmId}-file-3`],
  updatedAt: now
};

// Child chats for Space 2
const space2Task1 = {
  chatId: `${spaceGtmId}-task-1`,
  projectName: 'Go to Market',
  chatName: 'Update GTM Pitch Deck',
  type: 'inferred',
  taskType: 'inferred',
  associatedFileId: `${spaceGtmId}-file-3`,
  associatedFileName: 'gtm_executive_pitch.gslides',
  messages: [
    { role: 'user', text: 'Incorporate the latest Q3 enrollment velocity projections (3.4x accrual speedup) into Slides 7 and 12 of gtm_executive_pitch.gslides.' },
    { role: 'bot', text: 'I have extracted the trial enrollment growth metrics from `index.html` and updated the outline for Slide 7 and Slide 12 in `gtm_executive_pitch.gslides`.' }
  ],
  envId: null,
  activeSpaceId: spaceGtmId,
  sandboxUrl: '',
  sandboxFiles: spaceGtm.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceGtm.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space2Task2 = {
  chatId: `${spaceGtmId}-task-2`,
  projectName: 'Go to Market',
  chatName: 'Refine Onboarding Diagram',
  type: 'inferred',
  taskType: 'inferred',
  associatedFileId: `${spaceGtmId}-file-3`,
  associatedFileName: 'gtm_executive_pitch.gslides',
  messages: [
    { role: 'user', text: 'Simplify the diagram on Slide 10 of the GTM Deck to emphasize automated EHR alerts over manual email summaries.' },
    { role: 'bot', text: 'Slide 10 outline has been updated to highlight native OncoEMR inline notifications.' }
  ],
  envId: null,
  activeSpaceId: spaceGtmId,
  sandboxUrl: '',
  sandboxFiles: spaceGtm.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceGtm.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space2Task3 = {
  chatId: `${spaceGtmId}-task-3`,
  projectName: 'Go to Market',
  chatName: 'Finalize Sponsor Matrix',
  type: 'inferred',
  taskType: 'inferred',
  associatedFileId: `${spaceGtmId}-file-2`,
  associatedFileName: 'biopharma_partnership_proposal.doc',
  messages: [
    { role: 'user', text: 'Finalize pricing tiers for biopharma sponsor protocol listings.' },
    { role: 'bot', text: 'Updated `biopharma_partnership_proposal.doc` with protocol tiering structures.' }
  ],
  envId: null,
  activeSpaceId: spaceGtmId,
  sandboxUrl: '',
  sandboxFiles: spaceGtm.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceGtm.members,
  pinnedArtifactIds: [],
  updatedAt: now
};


// --- 4. SPACE 3: NEW APP LAUNCH ---
const spaceLaunchId = 'space-flatiron-new-app-launch';
const spaceLaunch = {
  chatId: spaceLaunchId,
  projectName: 'New App Launch',
  chatName: null,
  type: 'space',
  taskType: null,
  associatedFileId: null,
  associatedFileName: null,
  messages: [
    {
      role: 'bot',
      text: 'Rachel Chang, Elena Vance, and Dr. Jason Miller added to this space.',
      isMembersAddedNotice: true,
      addedMembers: ['Rachel Chang', 'Elena Vance', 'Dr. Jason Miller']
    }
  ],
  envId: null,
  activeSpaceId: spaceLaunchId,
  sandboxUrl: '',
  sandboxFiles: [
    {
      id: `${spaceLaunchId}-file-0`,
      name: 'index.html',
      type: 'code',
      mimeType: 'text/html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  ${POLARIS_M3_HEAD}
  <title>Mobile Launch Status</title>
</head>
<body class="p-6 bg-white text-[#1f1f1f]">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
      <div>
        <h2 class="text-lg font-medium text-[#1f1f1f]">Flatiron Assist™ Mobile Launch Status</h2>
        <p class="text-xs text-[#5f6368]">T-Minus 18 Days to Enterprise MDM Distribution</p>
      </div>
      <button class="px-4 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-lg transition cursor-pointer">Launch Executive Review</button>
    </div>

    <!-- M3 Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl space-y-2">
        <span class="text-xs text-[#5f6368] font-medium">Beta Pilot Satisfaction</span>
        <div class="text-3xl font-bold text-[#1f1f1f]">94%</div>
        <p class="text-xs text-[#444746]">42 Oncologists actively testing mobile pathway recommendations during clinical rounds.</p>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl space-y-2">
        <span class="text-xs text-[#5f6368] font-medium">NCCN Pathway Queries</span>
        <div class="text-3xl font-bold text-[#1f1f1f]">4,280</div>
        <p class="text-xs text-[#444746]">Average latency: 1.2s for preferred clinical guideline lookup.</p>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl space-y-2">
        <span class="text-xs text-[#5f6368] font-medium">HIPAA Security Sign-off</span>
        <div class="text-3xl font-bold text-[#0b57d0]">Approved</div>
        <p class="text-xs text-[#444746]">SOC2 Type II, BAA, and Mobile Device Management (MDM) cleared.</p>
      </div>
    </div>
  </div>
</body>
</html>`
    },
    {
      id: `${spaceLaunchId}-file-1`,
      name: 'beta_user_feedback_summary.doc',
      type: 'code',
      mimeType: 'application/vnd.google-apps.document',
      content: `# Flatiron Assist Mobile Beta - Oncologist Feedback & Usability Summary

**Author:** Rachel Chang (Lead Mobile PM) & Elena Vance (Staff Product Designer)  
**Sample:** 42 Oncologists testing iOS/Android builds in clinical practice settings.

### Key Insights
- 94% overall satisfaction rating.
- Oncologists praise instant access to NCCN guidelines during rounding.
- Requested feature: Direct push notification when biomarker results return from pathology.`
    },
    {
      id: `${spaceLaunchId}-file-2`,
      name: 'mobile_app_launch_plan.doc',
      type: 'code',
      mimeType: 'application/vnd.google-apps.document',
      content: `# Flatiron Assist Mobile App Launch Operations Plan

**Target Distribution Date:** August 1, 2026  
**Channels:** Apple Enterprise App Store & Managed Google Play (MDM Enrolled Devices).`
    },
    {
      id: `${spaceLaunchId}-file-3`,
      name: 'app_launch_review_deck.gslides',
      type: 'code',
      mimeType: 'application/vnd.google-apps.presentation',
      content: `# Presentation: Flatiron Assist Mobile App Launch Executive Review Deck

Type: Google Slides
File ID: flatiron-deck-launch-03`
    }
  ],
  userEmail: MOCK_EMAIL,
  members: ['Rachel Chang', 'Elena Vance', 'Dr. Jason Miller'],
  pinnedArtifactIds: ['todo-card', `${spaceLaunchId}-file-0`, `${spaceLaunchId}-file-3`],
  updatedAt: now
};

// Child chats for Space 3
const space3Task1 = {
  chatId: `${spaceLaunchId}-task-1`,
  projectName: 'New App Launch',
  chatName: 'Add Beta Findings to Deck',
  type: 'inferred',
  taskType: 'inferred',
  associatedFileId: `${spaceLaunchId}-file-3`,
  associatedFileName: 'app_launch_review_deck.gslides',
  messages: [
    { role: 'user', text: 'Summarize the 94% satisfaction score and clinician survey metrics for Slide 6 in app_launch_review_deck.gslides.' },
    { role: 'bot', text: 'I have compiled the Beta pilot survey statistics into bullet points formatted for Slide 6 of `app_launch_review_deck.gslides`.' }
  ],
  envId: null,
  activeSpaceId: spaceLaunchId,
  sandboxUrl: '',
  sandboxFiles: spaceLaunch.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceLaunch.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space3Task2 = {
  chatId: `${spaceLaunchId}-task-2`,
  projectName: 'New App Launch',
  chatName: 'Update Security Checklist',
  type: 'inferred',
  taskType: 'inferred',
  associatedFileId: `${spaceLaunchId}-file-3`,
  associatedFileName: 'app_launch_review_deck.gslides',
  messages: [
    { role: 'user', text: 'Update Slide 14 in app_launch_review_deck.gslides with confirmed SOC2 Type II, BAA, and MDM sign-off status.' },
    { role: 'bot', text: 'Slide 14 outline has been updated with the completed security and compliance checklist items.' }
  ],
  envId: null,
  activeSpaceId: spaceLaunchId,
  sandboxUrl: '',
  sandboxFiles: spaceLaunch.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceLaunch.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space3Task3 = {
  chatId: `${spaceLaunchId}-task-3`,
  projectName: 'New App Launch',
  chatName: 'Review Mobile Wireframes',
  type: 'inferred',
  taskType: 'inferred',
  associatedFileId: `${spaceLaunchId}-file-1`,
  associatedFileName: 'beta_user_feedback_summary.doc',
  messages: [
    { role: 'user', text: 'Schedule a design review session with Dr. Miller to go over mobile pathway UI feedback.' },
    { role: 'bot', text: 'Design review session notes attached to `beta_user_feedback_summary.doc`.' }
  ],
  envId: null,
  activeSpaceId: spaceLaunchId,
  sandboxUrl: '',
  sandboxFiles: spaceLaunch.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceLaunch.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

// WRITE ALL FILES TO DISK
saveJson('home_mock_user_example_com.json', homeChat);

saveJson(`${spaceUiDesignId}.json`, spaceUiDesign);
saveJson(`${spaceUiDesignId}-task-1.json`, space1Task1);
saveJson(`${spaceUiDesignId}-task-2.json`, space1Task2);
saveJson(`${spaceUiDesignId}-task-3.json`, space1Task3);

saveJson(`${spaceGtmId}.json`, spaceGtm);
saveJson(`${spaceGtmId}-task-1.json`, space2Task1);
saveJson(`${spaceGtmId}-task-2.json`, space2Task2);
saveJson(`${spaceGtmId}-task-3.json`, space2Task3);

saveJson(`${spaceLaunchId}.json`, spaceLaunch);
saveJson(`${spaceLaunchId}-task-1.json`, space3Task1);
saveJson(`${spaceLaunchId}-task-2.json`, space3Task2);
saveJson(`${spaceLaunchId}-task-3.json`, space3Task3);

console.log("🎉 Successfully updated Flatiron Health mock database with ultra-short concise titles!");
