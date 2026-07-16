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

// --- 2. SPACE 1: AEGIS AI (LLM Red Teaming & Guardrails) ---
const spaceAegisId = 'space-aegis-ai';
const spaceAegis = {
  chatId: spaceAegisId,
  projectName: 'Aegis AI',
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
  <title>Aegis AI - Safety Guardrails & Red Teaming Console</title>
</head>
<body class="p-6 bg-white text-[#1f1f1f]">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
      <div>
        <h2 class="text-lg font-medium text-[#1f1f1f]">Aegis AI — LLM Safety Guardrails & Red Teaming</h2>
        <p class="text-xs text-[#5f6368]">Client Advisory: Foundation Model Input/Output Moderation</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 bg-[#d3e3fd] text-[#041e49] text-xs rounded-full font-medium">99.4% Classifier Precision</span>
        <button class="px-4 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-lg transition shadow-xs cursor-pointer">Export Safety Audit</button>
      </div>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Daily Injections Blocked</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">1.2M</div>
        <div class="text-[11px] text-[#0b57d0] mt-1">0 Critical Escapes</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Guardrail Overhead</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">42 ms</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Target &lt; 50ms</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Red Team Benchmarks</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">1,200+</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Jailbreak prompts tested</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">PII & Leakage Score</div>
        <div class="text-2xl font-bold text-[#0b57d0] mt-1">100% Cleared</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Automated anonymization</div>
      </div>
    </div>

    <!-- Active Safety Guardrails Table -->
    <div class="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
      <h3 class="text-sm font-medium text-[#1f1f1f]">LLM Safety Vector Enforcement Matrix</h3>
      <table class="w-full text-left text-xs border-collapse">
        <thead class="text-[#5f6368] border-b border-[#e2e8f0]">
          <tr>
            <th class="pb-2 font-medium">Harm Category</th>
            <th class="pb-2 font-medium">Detection Model</th>
            <th class="pb-2 font-medium">Action Trigger</th>
            <th class="pb-2 font-medium">Confidence SLA</th>
            <th class="pb-2 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#e2e8f0] text-[#1f1f1f]">
          <tr>
            <td class="py-3 font-medium">Adversarial Jailbreak & System Prompt Extraction</td>
            <td>Neural Classifier v3.4</td>
            <td>Block &amp; Reframe Prompt</td>
            <td>99.8% Threshold</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#d3e3fd] text-[#041e49] rounded text-[11px] font-medium">Enforced</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">Toxicity &amp; Hate Speech Filter</td>
            <td>BERT Toxicity Guard</td>
            <td>Sanitize Output Tokens</td>
            <td>99.2% Threshold</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#d3e3fd] text-[#041e49] rounded text-[11px] font-medium">Enforced</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">PII / Credential Leakage Scanner</td>
            <td>Regex + NER Entity Guard</td>
            <td>Redact / Mask Matching Tokens</td>
            <td>100% Deterministic</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#d3e3fd] text-[#041e49] rounded text-[11px] font-medium">Enforced</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">Hallucination &amp; Grounding Verification</td>
            <td>RAG Fact-Check Engine</td>
            <td>Attach Evidence Citations</td>
            <td>94.5% Baseline</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#f0f4f9] text-[#1f1f1f] rounded text-[11px] font-medium">Tuning</span></td>
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
      content: `# Aegis AI — LLM Red Teaming & Adversarial Vulnerability Audit Report

**Authors:** Elena Vance (Trust & Safety Lead Consultant) & Dr. Marcus Thorne (Staff Safety Engineer)  
**Target Platform:** Aegis AI Foundation Model Gateway & Real-Time Prompt Pipeline  
**Audit Period:** Q2 2026 Executive Review  

---

### Executive Overview & Security Posture
Aegis AI provides enterprise LLM safety guardrails, prompt injection filtering, and automated red-teaming evaluations. During the Q2 2026 audit, our red teaming team executed over 1,200 adversarial probe vectors testing multi-turn jailbreaks, role-playing bypasses, system prompt extraction, and PII exfiltration.

### Critical Telemetry & Performance Benchmarks
1. **Prompt Injection SLA Overhead (< 42ms):**
   - High-throughput neural classifiers analyze input prompt tokens in parallel prior to LLM execution.
   - Total latency added to streaming socket connections is capped at 42ms (Target: < 50ms).
2. **Jailbreak Escape Rate (0.0% Escapes):**
   - 1,200+ known adversarial jailbreak templates tested; 100% blocked at input gateway without leakages into production endpoints.
3. **PII & Credential NER Masking (100% Anonymized):**
   - Automated Regex + Named Entity Recognition (NER) models sanitize sensitive tokens (SSNs, API keys, patient records) before response streaming.
4. **Hallucination & Evidence Citation Baseline (94.5% Grounded):**
   - RAG Fact-Check Engine matches model citations against retrieved source docs in real-time.

### Vulnerability Vector Findings & Remediations
- **Vector A: Cipher-Encoded Multi-Turn Jailbreaks:**
  - *Risk Level:* High
  - *Mitigation:* Deployed Neural Classifier v3.4 trained on Base64, ROT13, and Unicode multi-layer evasion payloads.
- **Vector B: System Prompt Extraction via Context Wrapping:**
  - *Risk Level:* Medium
  - *Mitigation:* Enforced system prompt token immutability guard in LLM context middleware.

### Advisory Recommendations for Q3 Engineering Roadmap
- Implement sub-30ms distilled BERT toxicity classifiers for mobile SDK integrations.
- Extend out-of-court dispute integration and biannual EU DSA compliance audit logging.`
    },
    {
      id: `${spaceAegisId}-file-2`,
      name: 'safety_guardrail_policy_spec.md',
      type: 'code',
      mimeType: 'text/markdown',
      content: `# Aegis AI — Input/Output Safety Rules & Toxicity Threshold Specification

**Document Version:** v3.4.1  
**Lead Contributor:** Dr. Marcus Thorne  

## 1. Classification Thresholds & Confidence Cutoffs
- **Primary Design Token:** Safety Blue ('#0b57d0')
- **Toxicity Classifier Confidence Cutoff:** Hard block triggered at **99.2%** certainty.
- **Adversarial Jailbreak Confidence Cutoff:** Hard block triggered at **99.8%** certainty.
- **PII Leakage Policy:** Deterministic 100% token redacting; redacts email addresses, social security numbers, OAuth secret tokens, and phone numbers.

## 2. Real-Time Processing Budgets
- **Maximum Input Latency Budget:** '< 50ms' total inspection overhead per prompt.
- **Streaming Socket Buffer Limit:** Max 256 tokens per chunk inspection window.
- **Emergency Circuit Breaker:** Automatic fallback to sterile default response if classifier processing exceeds 100ms.

## 3. Escalation Protocols
- High-risk zero-day jailbreak escapes automatically flag an incident for Elena Vance and trigger Slack notifications to '#aegis-safety-ops'.`
    },
    {
      id: `${spaceAegisId}-file-3`,
      name: 'aegis_ai_safety_deck.gslides',
      type: 'code',
      mimeType: 'application/vnd.google-apps.presentation',
      content: `# Presentation: Aegis AI LLM Red Teaming & Guardrails Board Review

> **Executive Synthesis**: Comprehensive evaluation of LLM input/output safety guardrails, zero-day jailbreak mitigations, and performance latency SLAs.

- **Classifier Overhead Target**: < 50ms budget (Achieved: 42ms median latency).
- **Red Team Corpus**: 1,200+ multi-turn adversarial prompts evaluated with 0 critical escapes.
- **PII Anonymization**: 100% automated NER stripping for private keys and identity credentials.

---

# Key Architectural Pillars & Milestones

## Guardrail Pipeline Architecture
- Pre-execution neural classifier filters adversarial prompt injections before LLM tokenization.
- Parallel NER masking strips sensitive PII tokens prior to web socket streaming.

## Next Horizon: Hallucination Verification
- Fine-tuning RAG Fact-Check engine to reach > 98% evidence citation accuracy.`
    }
  ],
  userEmail: MOCK_EMAIL,
  members: ['Elena Vance', 'Dr. Marcus Thorne', 'Sarah Lin'],
  pinnedArtifactIds: ['todo-card', `${spaceAegisId}-file-0`, `${spaceAegisId}-file-1`],
  updatedAt: now
};

// Child chats for Space 1 (Aegis AI)
const space1Task1 = {
  chatId: `${spaceAegisId}-task-1`,
  projectName: 'Aegis AI',
  chatName: 'Update Red Teaming Slide Quotes',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Sarah Lin',
  personAvatar: getAvatarPath('Sarah Lin'),
  associatedFileId: `${spaceAegisId}-file-3`,
  associatedFileName: 'aegis_ai_safety_deck.gslides',
  messages: [
    { role: 'user', text: 'Extract key insights from the red teaming audit report and incorporate them into Slide 4 of aegis_ai_safety_deck.gslides.' },
    { role: 'bot', text: 'I have compiled the jailbreak prevention metrics and latency overhead benchmarks from `ai_red_teaming_audit_summary.doc` ready for Slide 4.' }
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
  projectName: 'Aegis AI',
  chatName: 'Refine Toxicity Threshold Specs',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Elena Vance',
  personAvatar: getAvatarPath('Elena Vance'),
  associatedFileId: `${spaceAegisId}-file-2`,
  associatedFileName: 'safety_guardrail_policy_spec.md',
  messages: [
    { role: 'user', text: 'Ensure toxicity thresholds meet strict enterprise AI governance standards.' },
    { role: 'bot', text: 'Updated `safety_guardrail_policy_spec.md` with 99.2% classifier confidence cutoffs and sub-50ms latency budgets.' }
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
  projectName: 'Aegis AI',
  chatName: 'Prepare Safety Review Prototype',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Dr. Marcus Thorne',
  personAvatar: getAvatarPath('Dr. Marcus Thorne'),
  associatedFileId: `${spaceAegisId}-file-0`,
  associatedFileName: 'index.html',
  messages: [
    { role: 'user', text: 'Verify the interactive guardrails console index.html is loaded for Dr. Thorne\'s AI safety review.' },
    { role: 'bot', text: 'The interactive prototype index.html with live prompt injection metrics and harm categorization tables is ready.' }
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


// --- 3. SPACE 2: VERITAS SOCIAL (Content Moderation & Harassment SOP) ---
const spaceVeritasId = 'space-veritas-social';
const spaceVeritas = {
  chatId: spaceVeritasId,
  projectName: 'Veritas Social',
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
  <title>Veritas Social - Trust & Safety Operations Queue</title>
</head>
<body class="p-6 bg-white text-[#1f1f1f]">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
      <div>
        <h2 class="text-lg font-medium text-[#1f1f1f]">Veritas Social — Moderation Operations & Escalations</h2>
        <p class="text-xs text-[#5f6368]">Community Guidelines &amp; Minor Protection Enforcement SLA</p>
      </div>
      <button class="px-4 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-lg transition cursor-pointer">Download Compliance Log</button>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Hourly Screened Posts</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">12,450</div>
        <div class="text-[11px] text-[#0b57d0] mt-1">85% Automated pre-filter</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Median Review SLA</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">4.2 min</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Target &lt; 15 min</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">PhotoDNA CSAM Hash Alerts</div>
        <div class="text-2xl font-bold text-[#0b57d0] mt-1">0 Pending</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Instant NCMEC automated dispatch</div>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl">
        <div class="text-xs text-[#5f6368] font-medium">Appeal Turnaround</div>
        <div class="text-2xl font-bold text-[#1f1f1f] mt-1">100% Cleared</div>
        <div class="text-[11px] text-[#5f6368] mt-1">Within 48h deadline</div>
      </div>
    </div>

    <!-- Active Moderation Queue Table -->
    <div class="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
      <h3 class="text-sm font-medium text-[#1f1f1f]">Priority Moderation Escalation Pipeline</h3>
      <table class="w-full text-left text-xs border-collapse">
        <thead class="text-[#5f6368] border-b border-[#e2e8f0]">
          <tr>
            <th class="pb-2 font-medium">Incident Category</th>
            <th class="pb-2 font-medium">Report Queue</th>
            <th class="pb-2 font-medium">Primary Risk Factor</th>
            <th class="pb-2 font-medium">Current SLA</th>
            <th class="pb-2 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#e2e8f0] text-[#1f1f1f]">
          <tr>
            <td class="py-3 font-medium">Targeted Harassment &amp; Doxxing Campaign</td>
            <td>Tier 2 Safety Queue</td>
            <td>Creator Harm &amp; Privacy Breach</td>
            <td>3.1 min</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#d3e3fd] text-[#041e49] rounded text-[11px] font-medium">Active Review</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">Bypassed Hate Speech Classifier (Leetspeak)</td>
            <td>Policy Tuning Queue</td>
            <td>Model Miss Vector</td>
            <td>8.4 min</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#f0f4f9] text-[#1f1f1f] rounded text-[11px] font-medium">Classifier Updated</span></td>
          </tr>
          <tr>
            <td class="py-3 font-medium">Coordinated Automated Bot Spam Network</td>
            <td>Security Ops Desk</td>
            <td>Platform Abuse / Sybil Attack</td>
            <td>1.8 min</td>
            <td class="text-right"><span class="px-2 py-0.5 bg-[#d3e3fd] text-[#041e49] rounded text-[11px] font-medium">Purged</span></td>
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
      content: `# Veritas Social — Community Standards & Harassment Enforcement SOP

**Authors:** Priya Patel (Community Safety Ops) & David Ross (Head of Trust & Safety)  
**Scope:** Standard Operating Procedures (SOP) across global creator feeds, live chats, and direct messaging channels.  

---

### Executive Summary & Operational SLAs
Veritas Social serves millions of active daily creators. Protecting creator safety, enforcing anti-harassment standards, and maintaining rapid reviewer response times are critical operational mandates.

### Core Metrics & Performance Targets
1. **Median Human Review SLA (4.2 minutes):**
   - High-severity escalated reports are reviewed within 4.2 minutes (Target: < 15 minutes).
2. **Automated Pre-Filtering Efficiency (85% Auto-Quarantined):**
   - Machine learning toxic language classifiers auto-hold 85% of hate speech, doxxing attempts, and targeted harassment prior to feed distribution.
3. **Hourly Screened Content Volume (12,450 posts/hr):**
   - Multi-stage moderation pipeline processes over 12,000 posts every hour across global regional hubs.
4. **User Appeal Turnaround SLA (100% Cleared < 48 Hours):**
   - Second-tier moderation board resolves all creator account strikes and content appeal tickets within the 48-hour SLA deadline.

### Moderation Incident Triage Matrix
- **Category 1: Targeted Harassment & Doxxing Campaigns:**
  - *SLA Target:* < 5 minutes.
  - *Action:* Route to Tier 2 Safety Desk, initiate instant profile protection mode, freeze suspect accounts.
- **Category 2: Bypassed Toxicity Classifiers (Leetspeak & Evasion):**
  - *SLA Target:* < 15 minutes.
  - *Action:* Update BERT embedding dictionaries and retrain daily model weights.
- **Category 3: Coordinated Sybil Bot Spam Networks:**
  - *SLA Target:* Instant automated network purge via IP cluster fingerprinting.`
    },
    {
      id: `${spaceVeritasId}-file-2`,
      name: 'csam_ncii_compliance_spec.doc',
      type: 'code',
      mimeType: 'text/markdown',
      content: `# Veritas Social — Minor Safety & PhotoDNA Hash Matching Specification

**Compliance Leads:** David Ross & Priya Patel  

## Real-Time Media Hashing & Compliance SLA
- **SaferNet & PhotoDNA Database Sync:** Real-time hash comparison triggered instantly upon media payload upload.
- **NCMEC CyberTipline Dispatch SLA:** Validated positive matches trigger an encrypted, automated API transmission to the NCMEC CyberTipline within **15 minutes**.
- **Zero-Persistence Ephemeral Buffer:** Confirmed illegal media vectors are immediately quarantined and stripped from public storage buckets.
- **EU Digital Services Act (DSA) Compliance:** Maintains automated log audits supporting biannual DSA transparency reports and out-of-court dispute integration.`
    },
    {
      id: `${spaceVeritasId}-file-3`,
      name: 'veritas_safety_roadmap.gslides',
      type: 'code',
      mimeType: 'application/vnd.google-apps.presentation',
      content: `# Presentation: Veritas Social Trust & Safety Strategic Roadmap

> **Trust & Safety Milestones**: Scaling content moderation SLAs, perceptual hashing compliance, and creator protection tools.

- **Human Review SLA**: 4.2 min median turnaround (Target: < 15 min).
- **Automated Pre-Filter**: 85% high-confidence toxicity pre-filter efficiency.
- **Minor Protection**: 100% automated PhotoDNA hash matching & NCMEC reporting.

---

# Operational Roadmap & Metrics

## Triage Queue SLAs
- Tier 2 escalation desk clearing harassment reports in 3.1 minutes.
- Automated Sybil bot purge executing within 1.8 minutes of cluster discovery.`
    }
  ],
  userEmail: MOCK_EMAIL,
  members: ['David Ross', 'Priya Patel', 'Elena Vance'],
  pinnedArtifactIds: ['todo-card', `${spaceVeritasId}-file-0`, `${spaceVeritasId}-file-3`],
  updatedAt: now
};

// Child chats for Space 2 (Veritas Social)
const space2Task1 = {
  chatId: `${spaceVeritasId}-task-1`,
  projectName: 'Veritas Social',
  chatName: 'Incorporate Moderation Metrics into Deck',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Priya Patel',
  personAvatar: getAvatarPath('Priya Patel'),
  associatedFileId: `${spaceVeritasId}-file-3`,
  associatedFileName: 'veritas_safety_roadmap.gslides',
  messages: [
    { role: 'user', text: 'Incorporate the latest 4.2-minute review SLA metrics into Slide 7 of veritas_safety_roadmap.gslides.' },
    { role: 'bot', text: 'I have compiled the moderation SLA statistics and integrated them into the outline for Slide 7 in `veritas_safety_roadmap.gslides`.' }
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
  projectName: 'Veritas Social',
  chatName: 'Simplify Escalation Flow Diagram',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'David Ross',
  personAvatar: getAvatarPath('David Ross'),
  associatedFileId: `${spaceVeritasId}-file-3`,
  associatedFileName: 'veritas_safety_roadmap.gslides',
  messages: [
    { role: 'user', text: 'Simplify the escalation flow diagram on Slide 10 to highlight automated PhotoDNA hash blocking.' },
    { role: 'bot', text: 'Slide 10 outline updated to emphasize zero-latency PhotoDNA and SaferNet media quarantine.' }
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
  projectName: 'Veritas Social',
  chatName: 'Finalize Hash Matching SOP',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Priya Patel',
  personAvatar: getAvatarPath('Priya Patel'),
  associatedFileId: `${spaceVeritasId}-file-2`,
  associatedFileName: 'csam_ncii_compliance_spec.doc',
  messages: [
    { role: 'user', text: 'Finalize regulatory reporting timelines in the minor safety compliance spec.' },
    { role: 'bot', text: 'Updated `csam_ncii_compliance_spec.doc` with sub-15 minute NCMEC reporting API SLAs.' }
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


// --- 4. SPACE 3: NEXUS PAY (Fraud Prevention & Risk Ops) ---
const spaceNexusId = 'space-nexus-pay';
const spaceNexus = {
  chatId: spaceNexusId,
  projectName: 'Nexus Pay',
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
  <title>Nexus Pay - Fraud Prevention & Risk Operations Center</title>
</head>
<body class="p-6 bg-white text-[#1f1f1f]">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
      <div>
        <h2 class="text-lg font-medium text-[#1f1f1f]">Nexus Pay — Fraud Prevention &amp; Account Takeover Operations</h2>
        <p class="text-xs text-[#5f6368]">P2P Payments &amp; Merchant Identity Risk Telemetry</p>
      </div>
      <button class="px-4 py-2 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-lg transition cursor-pointer">Run Risk Audit Simulation</button>
    </div>

    <!-- Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl space-y-2">
        <span class="text-xs text-[#5f6368] font-medium">Prevented Fraud Losses</span>
        <div class="text-3xl font-bold text-[#1f1f1f]">$4.2M</div>
        <p class="text-xs text-[#444746]">Blocked credential stuffing &amp; ATO attacks in real-time.</p>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl space-y-2">
        <span class="text-xs text-[#5f6368] font-medium">Chargeback Rate</span>
        <div class="text-3xl font-bold text-[#1f1f1f]">0.04%</div>
        <p class="text-xs text-[#444746]">Significantly below payment network 0.1% threshold.</p>
      </div>
      <div class="bg-[#f0f4f9] border border-[#e2e8f0] p-4 rounded-xl space-y-2">
        <span class="text-xs text-[#5f6368] font-medium">Identity Verification (KYC)</span>
        <div class="text-3xl font-bold text-[#0b57d0]">99.1% Pass</div>
        <p class="text-xs text-[#444746]">Automated document validation &amp; biometric liveness check.</p>
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
      content: `# Nexus Pay — Fraud & Account Takeover Risk Assessment Report

**Authors:** Rachel Chang (Lead Risk PM) & Dr. Jason Miller (Chief Security Counsel)  
**Sample Corpus:** Audit of 1.4 Million P2P transactions and merchant API checkouts  

---

### Executive Assessment & Financial Recovery
Nexus Pay operates high-volume peer-to-peer payment processing and digital wallet services. During the recent risk telemetry period, our fraud engine thwarted multiple automated credential stuffing campaigns and localized Sybil merchant risk networks.

### Core Risk Telemetry & Achievements
1. **$4.2 Million in Prevented Fraud Losses:**
   - Real-time device fingerprinting and risk scoring blocked unauthorized account drain attempts.
2. **94.2% Reduction in Account Takeover (ATO) Attacks:**
   - Enforced dynamic WebAuthn passkey step-up authentication upon suspicious IP location shifts.
3. **0.04% Chargeback Baseline (Target: < 0.10%):**
   - Fraud chargeback ratio remains at less than half of major card network dispute caps.
4. **99.1% Seamless KYC Verification Rate:**
   - OCR document analysis combined with biometric liveness verification enables instant onboarding for 99.1% of low-risk users.

### Key Risk Domain Findings
- **Credential Stuffing Vectors:** Mitigated using progressive CAPTCHA challenges and rate-limiting endpoints.
- **Merchant Synthetic Identity Risks:** Enforced micro-deposit verification and automated TIN matching.`
    },
    {
      id: `${spaceNexusId}-file-2`,
      name: 'kyc_identity_verification_plan.doc',
      type: 'code',
      mimeType: 'application/vnd.google-apps.document',
      content: `# Nexus Pay — KYC & Anti-Phishing Operational Launch Plan

**Authors:** Rachel Chang & Dr. Jason Miller  
**Target Rollout Date:** August 1, 2026  
**SDK Platforms:** Web Application, iOS Native, Android Native  

## 1. Onboarding Identity Verification Strategy
- **Step 1: Automated Document Capture:** Instant OCR extraction for government-issued passports and driver licenses.
- **Step 2: Biometric Liveness Verification:** 3D depth map verification preventing video spoofing.
- **Step 3: Sanctions & PEP Screening:** Real-time lookup against OFAC and global watchlist API endpoints.

## 2. Compliance & SOC2 Controls
- **SOC2 Type II Audit:** Completed with zero material exceptions reported by independent auditors.
- **Data Encryption Standard:** AES-256 encryption at rest for all stored identity PII payload data.`
    },
    {
      id: `${spaceNexusId}-file-3`,
      name: 'nexus_risk_review_deck.gslides',
      type: 'code',
      mimeType: 'application/vnd.google-apps.presentation',
      content: `# Presentation: Nexus Pay Risk Operations & Fraud Mitigation Deck

> **Risk Executive Summary**: Telemetry results from 1.4M transactions, ATO prevention milestones, and KYC onboarding metrics.

- **Loss Prevention**: $4.2M in fraudulent transactions prevented.
- **ATO Reduction**: 94.2% drop in account takeovers via passkey step-up auth.
- **Chargeback Ratio**: 0.04% maintaining tier-1 card network status.

---

# Strategic Architecture & SOC2 Milestones

## KYC & Onboarding SDK
- 99.1% automated pass rate for frictionless customer identity verification.
- Complete SOC2 Type II compliance sign-off.`
    }
  ],
  userEmail: MOCK_EMAIL,
  members: ['Rachel Chang', 'Elena Vance', 'Dr. Jason Miller'],
  pinnedArtifactIds: ['todo-card', `${spaceNexusId}-file-0`, `${spaceNexusId}-file-3`],
  updatedAt: now
};

// Child chats for Space 3 (Nexus Pay)
const space3Task1 = {
  chatId: `${spaceNexusId}-task-1`,
  projectName: 'Nexus Pay',
  chatName: 'Summarize ATO Metrics in Deck',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Rachel Chang',
  personAvatar: getAvatarPath('Rachel Chang'),
  associatedFileId: `${spaceNexusId}-file-3`,
  associatedFileName: 'nexus_risk_review_deck.gslides',
  messages: [
    { role: 'user', text: 'Summarize the 94.2% ATO fraud drop and $4.2M prevented losses for Slide 6 in nexus_risk_review_deck.gslides.' },
    { role: 'bot', text: 'I have compiled the risk operations statistics into bullet points formatted for Slide 6 of `nexus_risk_review_deck.gslides`.' }
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
  projectName: 'Nexus Pay',
  chatName: 'Update KYC Compliance Checklist',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Dr. Jason Miller',
  personAvatar: getAvatarPath('Dr. Jason Miller'),
  associatedFileId: `${spaceNexusId}-file-3`,
  associatedFileName: 'nexus_risk_review_deck.gslides',
  messages: [
    { role: 'user', text: 'Update Slide 14 in nexus_risk_review_deck.gslides with confirmed SOC2 Type II and KYC sign-off status.' },
    { role: 'bot', text: 'Slide 14 outline has been updated with the completed security and compliance checklist items.' }
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
  projectName: 'Nexus Pay',
  chatName: 'Review Anti-Fraud User Journeys',
  type: 'inferred',
  taskType: 'inferred',
  personName: 'Elena Vance',
  personAvatar: getAvatarPath('Elena Vance'),
  associatedFileId: `${spaceNexusId}-file-1`,
  associatedFileName: 'fraud_risk_audit_readout.doc',
  messages: [
    { role: 'user', text: 'Schedule a risk review session with Dr. Miller to review anti-fraud passkey step-up prompts.' },
    { role: 'bot', text: 'Risk review notes attached to `fraud_risk_audit_readout.doc`.' }
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

console.log("🎉 Successfully updated Trust & Safety Freelance Consultant mock database!");
