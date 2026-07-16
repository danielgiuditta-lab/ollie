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

function getAvatarPath(personName) {
  const slug = personName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return `/people/${slug}.jpg`;
}

// --- POLARIS / M3 DESIGN SYSTEM HEAD ---
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
const homeChatData = {
  projectName: 'Home Dashboard',
  chatName: null,
  type: 'space',
  taskType: null,
  associatedFileId: null,
  associatedFileName: null,
  messages: [],
  envId: null,
  sandboxUrl: '',
  sandboxFiles: [],
  userEmail: MOCK_EMAIL,
  members: [],
  pinnedArtifactIds: [
    'todo-card',
    'space-aegis-ai',
    'space-veritas-social',
    'space-nexus-pay'
  ],
  updatedAt: now
};

const homeChatUnderscore = {
  ...homeChatData,
  chatId: 'home_mock_user_example_com',
  activeSpaceId: 'home_mock_user_example_com'
};

const homeChatHyphen = {
  ...homeChatData,
  chatId: 'home_mock-user_example_com',
  activeSpaceId: 'home_mock-user_example_com'
};

// --- 2. SPACE 1: AEGIS AI (AI Policy & Governance Review) ---
const spaceAegisId = 'space-aegis-ai';
const spaceAegis = {
  chatId: spaceAegisId,
  projectName: 'AI Policy & Governance',
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
  activeSpaceId: spaceAegisId,
  sandboxUrl: '',
  sandboxFiles: [
    {
      id: `${spaceAegisId}-file-0`,
      name: 'index.html',
      type: 'code',
      mimeType: 'text/html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  ${POLARIS_M3_HEAD}
  <title>Global AI & Technology Policy Issues Tracker</title>
</head>
<body class="p-6 bg-white text-[#1f1f1f]">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
      <div>
        <h2 class="text-lg font-medium text-[#1f1f1f]">Global AI & Tech Policy Issues Tracker</h2>
        <p class="text-xs text-[#5f6368]">Policy Commentary, Legislative Frameworks & Opinion Column Pipeline</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 bg-[#d3e3fd] text-[#041e49] text-xs rounded-full font-medium">18 Policy Articles Published</span>
        <button class="px-4 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-lg transition shadow-xs cursor-pointer">Export Policy Briefing</button>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Published Op-Eds</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">18</div>
        <div class="text-[11px] text-[#0b57d0] mt-1">Foreign Affairs & Tech Journals</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Monitored Legislation</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">12 Frameworks</div>
        <div class="text-[11px] text-[#5f6368] mt-1">EU, US, UK & Multilateral</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Testimony & Keynotes</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">6 Sessions</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Legislative policy briefings</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Policy Citation Index</div>
        <div class="text-2xl font-bold text-[#0b57d0] mt-1">98.4% Impact</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Cited in statutory debates</div>
      </div>
    </div>

    <!-- Active Policy Issues Tracker Table -->
    <div class="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
      <h3 class="text-sm font-medium text-[#1f1f1f]">High-Level Policy Proposals & Governance Commentary</h3>
      <table class="w-full text-left text-xs border-collapse">
        <thead class="text-[#5f6368] border-b border-[#e2e8f0]">
          <tr>
            <th class="pb-2 font-medium">Policy Proposal & Debate</th>
            <th class="pb-2 font-medium">Jurisdiction / Body</th>
            <th class="pb-2 font-medium">Recommended Stance</th>
            <th class="pb-2 font-medium">Legislative Stage</th>
            <th class="pb-2 font-medium text-right">Article Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#e2e8f0] text-[#1f1f1f]">
          <tr>
            <td class="py-3 font-medium">EU AI Act High-Risk Model Audits</td>
            <td>EU Commission</td>
            <td>Pro-Mandatory Independent Audits</td>
            <td>Enacted / Implementation</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#d3e3fd] text-[#041e49] rounded text-[11px] font-medium">Op-Ed Published</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">US Executive Order AI Safety Rules</td>
            <td>US White House / Commerce</td>
            <td>Support Compute Disclosure Thresholds</td>
            <td>Implementation Stage</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#d3e3fd] text-[#041e49] rounded text-[11px] font-medium">Brief Complete</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">Open-Weights vs. Proprietary Model Licensing</td>
            <td>US Senate Judiciary</td>
            <td>Protect Open Scientific Research Rights</td>
            <td>Committee Hearings</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#f0f4f9] text-[#1f1f1f] rounded text-[11px] font-medium">Draft Review</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">Copyright & AI Training Dataset Transparency</td>
            <td>WIPO & Federal Courts</td>
            <td>Mandate Public Dataset Disclosures</td>
            <td>Legal Precedent Review</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#f0f4f9] text-[#1f1f1f] rounded text-[11px] font-medium">Outline Stage</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`
    },
    {
      id: `${spaceAegisId}-file-1`,
      name: 'ai_red_teaming_audit_summary.doc',
      type: 'code',
      mimeType: 'application/vnd.google-apps.document',
      content: `# Regulating Frontier AI — Public Policy & Institutional Oversight Strategy

**Authors:** Senior Policy Fellow & Technology Governance Board  
**Publication Target:** Global Policy Briefing & Regulatory Review  
**Subject:** High-Level Assessment of AI Governance, Democratic Accountability, and International Standards  

---

### Executive Policy Outlook & Regulatory Philosophy
As artificial intelligence foundation models rapidly expand in capability, national regulatory bodies face a fundamental governance choice: adopting static technology-specific mandates or building adaptive, risk-proportional policy frameworks. This paper outlines recommendations for democratic institutions balancing innovation with mandatory safety protocols.

### Key Policy Recommendations & Pillars
1. **Tiered Regulatory Oversight by Capabilities Threshold:**
   - Legislative oversight should scale based on capability and compute thresholds rather than imposing blanket registration rules on academic and open-source developers.
2. **Mandatory Public Provenance & Watermarking Rules:**
   - Governments should mandate standardized cryptographic watermarking for synthetic media to protect election integrity and public trust.
3. **Independent Third-Party Impact Assessments:**
   - Enterprise model providers must submit to third-party safety audits prior to commercial deployment in critical societal infrastructure.
4. **Preserving Academic & Open-Source Inquiry:**
   - Statutory safe harbors must safeguard public-interest research, ensuring open model weights remain available for independent security inspection.`
    },
    {
      id: `${spaceAegisId}-file-2`,
      name: 'safety_guardrail_policy_spec.md',
      type: 'code',
      mimeType: 'text/markdown',
      content: `# Governance Principles for Foundation Model Development

**Document Version:** Policy Strategy Brief v3.4  
**Lead Author:** Senior Technology Policy Advisor  

## 1. Statutory Transparency & Public Disclosure Standards
- **Primary Stance:** Democratic Alignment & Proportional Governance
- **Dataset Disclosure Principles:** Foundation model creators must publish high-level documentation regarding training data sources, copyright compliance, and privacy filtering.
- **Systemic Risk Mitigation:** High-impact deployments must maintain documented evaluation protocols for civil rights, fairness, and non-discrimination.

## 2. Institutional Oversight & Compliance Frameworks
- **Pre-Deployment Safety Verification:** Required independent audit sign-off for critical civic infrastructure deployment.
- **Multilateral Harmonization:** Aligning federal directives with international norms to prevent regulatory arbitrage while preserving open market access.`
    },
    {
      id: `${spaceAegisId}-file-3`,
      name: 'aegis_ai_safety_deck.gslides',
      type: 'code',
      mimeType: 'application/vnd.google-apps.presentation',
      content: `# Presentation: AI Governance & International Technology Policy Keynote

> **Executive Synthesis**: Policy options for regulating frontier foundation models, protecting open scientific inquiry, and establishing global transparency standards.

- **Regulatory Model**: Comparative analysis of risk-based rules versus innovation incentives.
- **Public Trust**: Institutional recommendations on watermarking synthetic media and protecting election integrity.
- **Democratic Accountability**: Independent audit frameworks for high-risk applications.

---

# Strategic Architecture & International Policy Roadmap

## Pillar 1: Proportional Risk Classification
- Statutory regulatory burdens scale based on deployment domain and system capabilities.

## Pillar 2: Open Source & Academic Safe Harbors
- Safeguarding democratized scientific progress while enforcing provider liability at the frontier.

---

# Foundation Model Liability & IP Governance Protocols

## Upstream Provider Liability
- Imposing statutory duty-of-care obligations on base model creators for systemic harms.
- Safe harbors for non-profit and academic developers.

## Training Data Transparency
- Public registry disclosure of copyright-protected ingestion corpora.

---

# Bilateral Trade Agreements & Global Governance Accords

## Harmonized Safety Benchmarks
- Multilateral recognition of capability benchmarks and synthetic media watermarking.
- Establishing permanent international safety advisory councils.`
    }
  ],
  userEmail: MOCK_EMAIL,
  members: ['Elena Vance', 'Dr. Marcus Thorne', 'Sarah Lin'],
  pinnedArtifactIds: ['todo-card', `${spaceAegisId}-file-0`, `${spaceAegisId}-file-1`],
  updatedAt: now
};

// Child chats for Space 1 (AI Policy & Governance)
const space1Task1 = {
  chatId: `${spaceAegisId}-task-1`,
  projectName: 'AI Policy & Governance',
  chatName: 'Update Governance Slide Quotes',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Sarah Lin',
  personAvatar: getAvatarPath('Sarah Lin'),
  associatedFileId: `${spaceAegisId}-file-3`,
  associatedFileName: 'aegis_ai_safety_deck.gslides',
  messages: [
    { role: 'user', text: 'Extract policy insights from the governance briefing and incorporate them into Slide 4 of aegis_ai_safety_deck.gslides.' },
    { role: 'bot', text: 'I have compiled the policy recommendation points from `ai_red_teaming_audit_summary.doc` ready for Slide 4.' }
  ],
  envId: null,
  activeSpaceId: spaceAegisId,
  sandboxUrl: '',
  sandboxFiles: spaceAegis.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceAegis.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space1Task2 = {
  chatId: `${spaceAegisId}-task-2`,
  projectName: 'AI Policy & Governance',
  chatName: 'Refine Governance Stance Specs',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Elena Vance',
  personAvatar: getAvatarPath('Elena Vance'),
  associatedFileId: `${spaceAegisId}-file-2`,
  associatedFileName: 'safety_guardrail_policy_spec.md',
  messages: [
    { role: 'user', text: 'Ensure governance principles align with global public interest standards.' },
    { role: 'bot', text: 'Updated `safety_guardrail_policy_spec.md` with dataset transparency guidelines and statutory public audit frameworks.' }
  ],
  envId: null,
  activeSpaceId: spaceAegisId,
  sandboxUrl: '',
  sandboxFiles: spaceAegis.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceAegis.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space1Task3 = {
  chatId: `${spaceAegisId}-task-3`,
  projectName: 'AI Policy & Governance',
  chatName: 'Prepare Policy Issues Tracker',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Dr. Marcus Thorne',
  personAvatar: getAvatarPath('Dr. Marcus Thorne'),
  associatedFileId: `${spaceAegisId}-file-0`,
  associatedFileName: 'index.html',
  messages: [
    { role: 'user', text: 'Verify the interactive policy issues tracker index.html is loaded for Dr. Thorne\'s regulatory review.' },
    { role: 'bot', text: 'The interactive policy issues tracker index.html with global legislative debates and op-ed status tracking is ready.' }
  ],
  envId: null,
  activeSpaceId: spaceAegisId,
  sandboxUrl: '',
  sandboxFiles: spaceAegis.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceAegis.members,
  pinnedArtifactIds: [],
  updatedAt: now
};


// --- 3. SPACE 2: VERITAS SOCIAL (Platform Regulation & Speech Policy) ---
const spaceVeritasId = 'space-veritas-social';
const spaceVeritas = {
  chatId: spaceVeritasId,
  projectName: 'Platform Regulation & Speech',
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
  activeSpaceId: spaceVeritasId,
  sandboxUrl: '',
  sandboxFiles: [
    {
      id: `${spaceVeritasId}-file-0`,
      name: 'index.html',
      type: 'code',
      mimeType: 'text/html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  ${POLARIS_M3_HEAD}
  <title>Digital Speech & Platform Policy Issues Tracker</title>
</head>
<body class="p-6 bg-white text-[#1f1f1f]">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
      <div>
        <h2 class="text-lg font-medium text-[#1f1f1f]">Digital Speech & Platform Policy Tracker</h2>
        <p class="text-xs text-[#5f6368]">Policy Commentary on Intermediary Liability, Section 230 & Public Speech</p>
      </div>
      <button class="px-4 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-lg transition cursor-pointer">Download Policy Matrix</button>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Policy Articles</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">24</div>
        <div class="text-[11px] text-[#0b57d0] mt-1">Columns & Law Reviews</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Platform Bills Tracked</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">14 Laws</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Intermediary liability statutes</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Civil Liberties Briefs</div>
        <div class="text-2xl font-bold text-[#0b57d0] mt-1">8 Briefs</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Amicus submissions & opinions</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Regulatory Alignment</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">100% Active</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Global free expression standards</div>
      </div>
    </div>

    <!-- Active Platform Policy Tracker Table -->
    <div class="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
      <h3 class="text-sm font-medium text-[#1f1f1f]">Platform Regulation & Digital Freedom Policy Proposals</h3>
      <table class="w-full text-left text-xs border-collapse">
        <thead class="text-[#5f6368] border-b border-[#e2e8f0]">
          <tr>
            <th class="pb-2 font-medium">Policy Issue / Bill</th>
            <th class="pb-2 font-medium">Legislative Body</th>
            <th class="pb-2 font-medium">Policy Opinion Stance</th>
            <th class="pb-2 font-medium">Timeline</th>
            <th class="pb-2 font-medium text-right">Publication Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#e2e8f0] text-[#1f1f1f]">
          <tr>
            <td class="py-3 font-medium">Section 230 Modernization & Liability Shields</td>
            <td>US Congress / Supreme Court</td>
            <td>Distinguish Passive Hosting from Active Curation</td>
            <td>Q3 Floor Debate</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#d3e3fd] text-[#041e49] rounded text-[11px] font-medium">Published Op-Ed</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">UK Online Safety Act Intermediary Scope</td>
            <td>UK Parliament / Ofcom</td>
            <td>Protect End-to-End Encryption Privacy Rights</td>
            <td>Implementation Guidance</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#f0f4f9] text-[#1f1f1f] rounded text-[11px] font-medium">Policy Brief Review</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">Algorithmic Amplification & Election Integrity</td>
            <td>Federal Election Committee</td>
            <td>Mandate Transparent Ad Registries & Data Access</td>
            <td>Rulemaking Stage</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#d3e3fd] text-[#041e49] rounded text-[11px] font-medium">Column Complete</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`
    },
    {
      id: `${spaceVeritasId}-file-1`,
      name: 'content_moderation_policy_v2.doc',
      type: 'code',
      mimeType: 'application/vnd.google-apps.document',
      content: `# Digital Speech & Intermediary Accountability — Policy Opinion

**Authors:** Senior Fellow in Platform Governance & Digital Rights  
**Scope:** Policy Recommendations for Balancing Expression, Democratic Oversight, and Content Regulation  

---

### Policy Overview & Democratic Mandate
Modern social media platforms function as contemporary public squares. Protecting freedom of expression while establishing procedural due process and algorithmic accountability requires updating legal frameworks beyond legacy immunity shields.

### Core Policy Recommendations
1. **Procedural Transparency & User Rights:**
   - Content removal rules must require explicit statutory explanations and statutory appeal rights for creators before account termination.
2. **Independent Researcher Audit Access:**
   - Legislation must grant accredited academic researchers secure access to platform recommendation data to evaluate systemic risks.
3. **Decoupling Curation from Distribution:**
   - Policy should encourage open protocols allowing users to choose third-party curation services while preserving underlying platform hosting.`
    },
    {
      id: `${spaceVeritasId}-file-2`,
      name: 'csam_ncii_compliance_spec.doc',
      type: 'code',
      mimeType: 'text/markdown',
      content: `# Balancing Online Child Safety & Encryption Policy

**Authors:** Digital Civil Liberties Policy Desk  

## Policy Framework & Trade-Off Analysis
- **Preserving End-to-End Encryption:** Public policy must resist client-side scanning mandates that compromise fundamental cybersecurity infrastructure.
- **Targeted Law Enforcement Cooperation:** Policy frameworks should focus on server-side intelligence sharing, hash matching on public endpoints, and international law enforcement cooperation.
- **Harmonized Transatlantic Standards:** Aligning child online protection acts with international human rights treaties.`
    },
    {
      id: `${spaceVeritasId}-file-3`,
      name: 'veritas_safety_roadmap.gslides',
      type: 'code',
      mimeType: 'application/vnd.google-apps.presentation',
      content: `# Presentation: Platform Regulation & Speech Policy Roadmap

> **Policy Executive Summary**: Institutional policy options for reforming intermediary liability, preserving free expression, and requiring algorithmic transparency.

- **Liability Reform**: Duty-of-care obligations for recommendation algorithms.
- **Democratic Curation**: User control over feed parameters and open protocol standards.
- **Civil Liberties Safeguards**: Statutory protections against over-broad private censorship.

---

# Operational Policy Roadmap & Milestones

## Intermediary Reform Proposals
- Legislative policy briefs delivered to Senate Judiciary Committee.
- Comparative law recommendations on transatlantic digital speech rules.

---

# Algorithmic Transparency & Civic Discourse Safeguards

## Independent Researcher Data Access
- Legislation enabling vetted academics to inspect engagement-maximizing algorithms.
- Establishing secure data cleanrooms preserving user privacy.

---

# Digital Rights & Global Human Rights Treaties

## Universal Expression Declarations
- Harmonizing platform moderation obligations with Article 19 expression guarantees.`
    }
  ],
  userEmail: MOCK_EMAIL,
  members: ['David Ross', 'Priya Patel', 'Elena Vance'],
  pinnedArtifactIds: ['todo-card', `${spaceVeritasId}-file-0`, `${spaceVeritasId}-file-3`],
  updatedAt: now
};

// Child chats for Space 2 (Platform Regulation & Speech Policy)
const space2Task1 = {
  chatId: `${spaceVeritasId}-task-1`,
  projectName: 'Platform Regulation & Speech',
  chatName: 'Incorporate Policy Arguments into Deck',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Priya Patel',
  personAvatar: getAvatarPath('Priya Patel'),
  associatedFileId: `${spaceVeritasId}-file-3`,
  associatedFileName: 'veritas_safety_roadmap.gslides',
  messages: [
    { role: 'user', text: 'Incorporate the latest liability reform commentary into Slide 7 of veritas_safety_roadmap.gslides.' },
    { role: 'bot', text: 'I have compiled the policy reform statistics and integrated them into the outline for Slide 7 in `veritas_safety_roadmap.gslides`.' }
  ],
  envId: null,
  activeSpaceId: spaceVeritasId,
  sandboxUrl: '',
  sandboxFiles: spaceVeritas.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceVeritas.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space2Task2 = {
  chatId: `${spaceVeritasId}-task-2`,
  projectName: 'Platform Regulation & Speech',
  chatName: 'Simplify Governance Flow Outline',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'David Ross',
  personAvatar: getAvatarPath('David Ross'),
  associatedFileId: `${spaceVeritasId}-file-3`,
  associatedFileName: 'veritas_safety_roadmap.gslides',
  messages: [
    { role: 'user', text: 'Simplify the governance policy overview on Slide 10 to highlight procedural appeal rights.' },
    { role: 'bot', text: 'Slide 10 outline updated to emphasize user due process and independent appeal channels.' }
  ],
  envId: null,
  activeSpaceId: spaceVeritasId,
  sandboxUrl: '',
  sandboxFiles: spaceVeritas.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceVeritas.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space2Task3 = {
  chatId: `${spaceVeritasId}-task-3`,
  projectName: 'Platform Regulation & Speech',
  chatName: 'Finalize Encryption Policy Brief',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Priya Patel',
  personAvatar: getAvatarPath('Priya Patel'),
  associatedFileId: `${spaceVeritasId}-file-2`,
  associatedFileName: 'csam_ncii_compliance_spec.doc',
  messages: [
    { role: 'user', text: 'Finalize regulatory trade-off recommendations in the encryption policy paper.' },
    { role: 'bot', text: 'Updated `csam_ncii_compliance_spec.doc` with cybersecurity and civil liberties protection policy options.' }
  ],
  envId: null,
  activeSpaceId: spaceVeritasId,
  sandboxUrl: '',
  sandboxFiles: spaceVeritas.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceVeritas.members,
  pinnedArtifactIds: [],
  updatedAt: now
};


// --- 4. SPACE 3: NEXUS PAY (Fintech & Monetary Policy) ---
const spaceNexusId = 'space-nexus-pay';
const spaceNexus = {
  chatId: spaceNexusId,
  projectName: 'Fintech & Monetary Policy',
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
  activeSpaceId: spaceNexusId,
  sandboxUrl: '',
  sandboxFiles: [
    {
      id: `${spaceNexusId}-file-0`,
      name: 'index.html',
      type: 'code',
      mimeType: 'text/html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  ${POLARIS_M3_HEAD}
  <title>Fintech & Digital Economy Policy Issues Tracker</title>
</head>
<body class="p-6 bg-white text-[#1f1f1f]">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
      <div>
        <h2 class="text-lg font-medium text-[#1f1f1f]">Fintech & Digital Economy Policy Issues Tracker</h2>
        <p class="text-xs text-[#5f6368]">Policy Analysis on Digital Currency, Financial Privacy & Market Competition</p>
      </div>
      <button class="px-4 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-lg transition cursor-pointer">Run Policy Simulation</button>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl space-y-2">
        <span class="text-xs text-[#5f6368] font-medium">Financial Policy Columns</span>
        <div class="text-3xl font-bold text-[#1f1f1f]">15 Articles</div>
        <p class="text-xs text-[#444746]">Published commentary on CBDCs & digital assets.</p>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl space-y-2">
        <span class="text-xs text-[#5f6368] font-medium">Monitored Financial Bills</span>
        <div class="text-3xl font-bold text-[#1f1f1f]">9 Proposals</div>
        <p class="text-xs text-[#444746]">SEC, Federal Reserve & EU MiCA legislation.</p>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl space-y-2">
        <span class="text-xs text-[#5f6368] font-medium">Financial Inclusion Briefs</span>
        <div class="text-3xl font-bold text-[#0b57d0]">5 Briefs</div>
        <p class="text-xs text-[#444746]">Policy papers on consumer payment access.</p>
      </div>
    </div>
  </div>
</body>
</html>`
    },
    {
      id: `${spaceNexusId}-file-1`,
      name: 'fraud_risk_audit_readout.doc',
      type: 'code',
      mimeType: 'application/vnd.google-apps.document',
      content: `# Digital Money & Sovereign Governance — Policy Opinion

**Authors:** Senior Fellow in Financial Governance  
**Publication Target:** Economic Policy Journal & Parliamentary Policy Review  

---

### Executive Policy Assessment
As paper cash usage declines globally, digital payment infrastructure has become core sovereign utility. Policy makers face critical questions regarding monetary sovereignty, digital surveillance risks, and open competition in digital asset regulation.

### Key Policy Recommendations
1. **Protecting Financial Transaction Privacy:**
   - Sovereign digital currencies (CBDCs) must incorporate cryptographic privacy guarantees to prevent government overreach in consumer spending.
2. **Prudential Rules for Private Stablecoins:**
   - Reserve backing mandates must enforce strict 1:1 liquid asset requirements to prevent systemic financial contagion.
3. **Open Banking & Consumer Data Ownership:**
   - Statutory data portability rights empowering consumers to transfer financial history across competing fintech providers.`
    },
    {
      id: `${spaceNexusId}-file-2`,
      name: 'kyc_identity_verification_plan.doc',
      type: 'code',
      mimeType: 'application/vnd.google-apps.document',
      content: `# Financial Inclusion & Anti-Money Laundering Policy Brief

**Authors:** Economic Policy Advisory Council  
**Target Release:** Congressional Economic Policy Hearing  

## 1. Balancing Anti-Money Laundering (AML) Rules with Financial Inclusion
- **Risk-Based Tiered Customer Verification:** Exempt low-value transactions from burdensome identity verification to prevent disenfranchising unbanked populations.
- **Digital Identity Infrastructure:** Supporting public open-standard digital IDs to reduce onboarding friction for underserved consumers.`
    },
    {
      id: `${spaceNexusId}-file-3`,
      name: 'nexus_risk_review_deck.gslides',
      type: 'code',
      mimeType: 'application/vnd.google-apps.presentation',
      content: `# Presentation: Congressional Briefing — Policy Options for Digital Money

> **Policy Executive Summary**: Analytical briefing on sovereign CBDC design, stablecoin reserve regulation, and financial privacy protections.

- **Monetary Sovereignty**: Preserving central bank monetary policy controls.
- **Consumer Privacy**: Codifying legal limits on transaction monitoring.
- **Systemic Risk Mitigation**: Regulatory frameworks for digital asset liquidity.

---

# Strategic Architecture & Regulatory Options

## CBDC vs. Private Innovation
- Comparative evaluation of public digital currency options versus regulated private bank tokens.

---

# Financial Privacy & Zero-Knowledge Architecture

## Surveillance Prevention Safeguards
- Statutory limits preventing government inspection of sub-threshold transaction metadata.
- Third-party cryptographic audits for central bank ledger endpoints.

---

# Interoperability & Global Cross-Border Remittances

## Reducing Cross-Border Fees
- Multilateral policy frameworks reducing payment settlement costs across developing economy corridors.`
    }
  ],
  userEmail: MOCK_EMAIL,
  members: ['Rachel Chang', 'Elena Vance', 'Dr. Jason Miller'],
  pinnedArtifactIds: ['todo-card', `${spaceNexusId}-file-0`, `${spaceNexusId}-file-3`],
  updatedAt: now
};

// Child chats for Space 3 (Fintech & Monetary Policy)
const space3Task1 = {
  chatId: `${spaceNexusId}-task-1`,
  projectName: 'Fintech & Monetary Policy',
  chatName: 'Summarize Monetary Policy Points in Deck',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Rachel Chang',
  personAvatar: getAvatarPath('Rachel Chang'),
  associatedFileId: `${spaceNexusId}-file-3`,
  associatedFileName: 'nexus_risk_review_deck.gslides',
  messages: [
    { role: 'user', text: 'Summarize financial privacy arguments for Slide 6 in nexus_risk_review_deck.gslides.' },
    { role: 'bot', text: 'I have compiled the monetary policy statistics into bullet points formatted for Slide 6 of `nexus_risk_review_deck.gslides`.' }
  ],
  envId: null,
  activeSpaceId: spaceNexusId,
  sandboxUrl: '',
  sandboxFiles: spaceNexus.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceNexus.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space3Task2 = {
  chatId: `${spaceNexusId}-task-2`,
  projectName: 'Fintech & Monetary Policy',
  chatName: 'Update AML Compliance Recommendations',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Dr. Jason Miller',
  personAvatar: getAvatarPath('Dr. Jason Miller'),
  associatedFileId: `${spaceNexusId}-file-3`,
  associatedFileName: 'nexus_risk_review_deck.gslides',
  messages: [
    { role: 'user', text: 'Update Slide 14 in nexus_risk_review_deck.gslides with confirmed policy recommendations on open banking.' },
    { role: 'bot', text: 'Slide 14 outline has been updated with the completed consumer financial data ownership checklist.' }
  ],
  envId: null,
  activeSpaceId: spaceNexusId,
  sandboxUrl: '',
  sandboxFiles: spaceNexus.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceNexus.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

const space3Task3 = {
  chatId: `${spaceNexusId}-task-3`,
  projectName: 'Fintech & Monetary Policy',
  chatName: 'Review Financial Inclusion Paper',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Elena Vance',
  personAvatar: getAvatarPath('Elena Vance'),
  associatedFileId: `${spaceNexusId}-file-1`,
  associatedFileName: 'fraud_risk_audit_readout.doc',
  messages: [
    { role: 'user', text: 'Schedule a policy review session with Dr. Miller to review digital currency transaction privacy recommendations.' },
    { role: 'bot', text: 'Policy review notes attached to `fraud_risk_audit_readout.doc`.' }
  ],
  envId: null,
  activeSpaceId: spaceNexusId,
  sandboxUrl: '',
  sandboxFiles: spaceNexus.sandboxFiles,
  userEmail: MOCK_EMAIL,
  members: spaceNexus.members,
  pinnedArtifactIds: [],
  updatedAt: now
};

// --- REMOVE OBSOLETE FLATIRON FILES ---
const obsoleteFiles = [
  'space-flatiron-gtm.json',
  'space-flatiron-gtm-chat-1784081644185.json',
  'space-flatiron-gtm-task-1.json',
  'space-flatiron-gtm-task-2.json',
  'space-flatiron-gtm-task-3.json',
  'space-flatiron-new-app-launch.json',
  'space-flatiron-new-app-launch-chat-1784071625538.json',
  'space-flatiron-new-app-launch-chat-1784147978220.json',
  'space-flatiron-new-app-launch-task-1.json',
  'space-flatiron-new-app-launch-task-2.json',
  'space-flatiron-new-app-launch-task-3.json',
  'space-flatiron-ui-design.json',
  'space-flatiron-ui-design-task-1.json',
  'space-flatiron-ui-design-task-2.json',
  'space-flatiron-ui-design-task-3.json'
];

obsoleteFiles.forEach(f => {
  const p = path.join(CHATS_DIR, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Removed obsolete file: ${f}`);
  }
});

// --- WRITE ALL NEW FILES TO DISK ---
saveJson('home_mock_user_example_com.json', homeChatUnderscore);
saveJson('home_mock-user_example_com.json', homeChatHyphen);

saveJson(`${spaceAegisId}.json`, spaceAegis);
saveJson(`${spaceAegisId}-task-1.json`, space1Task1);
saveJson(`${spaceAegisId}-task-2.json`, space1Task2);
saveJson(`${spaceAegisId}-task-3.json`, space1Task3);

saveJson(`${spaceVeritasId}.json`, spaceVeritas);
saveJson(`${spaceVeritasId}-task-1.json`, space2Task1);
saveJson(`${spaceVeritasId}-task-2.json`, space2Task2);
saveJson(`${spaceVeritasId}-task-3.json`, space2Task3);

saveJson(`${spaceNexusId}.json`, spaceNexus);
saveJson(`${spaceNexusId}-task-1.json`, space3Task1);
saveJson(`${spaceNexusId}-task-2.json`, space3Task2);
saveJson(`${spaceNexusId}-task-3.json`, space3Task3);

console.log("🎉 Successfully updated Policy Expert & Op-Ed Columnist mock database!");
