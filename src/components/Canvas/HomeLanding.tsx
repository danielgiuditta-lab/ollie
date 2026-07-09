import React, { useState, useEffect } from 'react';
import { LayoutGrid, Columns3, Plus, Folder, LogIn, ArrowRight, Mail, MessageSquare, AlertCircle, Clock, Info, CheckCircle2, Sparkles, FileText, Presentation } from 'lucide-react';
import { InferredTaskCard } from '../Chat/InferredTaskCard';
import { LandingInput } from './LandingInput';
import { CoverSlide, CoverSlideItem } from './CoverSlide';
import { FilesList } from './FilesList';
import { SearchJourney } from './SearchJourney';
import { CreationJourney } from './CreationJourney';
import { ShapeLoader } from '../Shared/ShapeLoader';
import { NullTitle } from '../Shared/NullTitle';
import { NullChat } from '../Shared/NullChat';

import docsIcon from '../../assets/docs.png';
import sheetsIcon from '../../assets/sheets.png';
import slidesIcon from '../../assets/slides.png';
import formsIcon from '../../assets/forms.png';
import htmlIcon from '../../assets/html.png';
import imageIcon from '../../assets/image.png';

export function cleanWorkspaceName(raw: string): string {
  if (!raw) return 'Workspace';
  let cleaned = raw;
  const commentOnMatch = cleaned.match(/(?:commented|tagged|mentioned|replied|comment)\s+(?:you\s+|by\s+.*?\s+)?(?:in|on|at)\s+['"]?([^'".]+?)['"]?(?:\s+regarding|\s+to|\s+for|\s+with|\s*\.\s*|$)/i);
  if (commentOnMatch && commentOnMatch[1]) {
    cleaned = commentOnMatch[1];
  } else {
    const commentMatch = cleaned.match(/Comment\s+(?:by\s+.*?\s+)?(?:in|on)\s+['"]?([^'"]+)['"]?/i);
    if (commentMatch && commentMatch[1]) {
      cleaned = commentMatch[1];
    } else if (cleaned.startsWith("Email from ")) {
      cleaned = cleaned.replace("Email from ", "");
    } else if (cleaned.startsWith("Chat in ")) {
      cleaned = cleaned.replace("Chat in ", "");
    } else {
      const quoteMatch = cleaned.match(/(?:in|on|to|for|regarding)\s+['"]([^'"]+)['"]/i);
      if (quoteMatch && quoteMatch[1]) {
        cleaned = quoteMatch[1];
      }
    }
  }
  cleaned = cleaned.split(' · ')[0].split(' / ')[0].replace(/\s*\/\s*Calendar Invite.*$/i, '').replace(/(?:from|by|at)\s+.*$/i, '').trim();
  cleaned = cleaned.replace(/^['"]|['"]$/g, '').trim();
  return cleaned || 'Workspace';
}

export const DEFAULT_TODO_ITEMS = [
  {
    id: 'todo-proactive-1',
    title: "I addressed Emily's comment on Brand Guidelines",
    titleDone: "I addressed Emily's comment on Brand Guidelines",
    description: "Emily commented to consolidate the Brand Kit layout. I consolidated the layout for your review.",
    descriptionDone: "Emily commented to consolidate the Brand Kit layout. I consolidated the layout for your review.",
    workspace: "Branding",
    sourceName: "Brand Guidelines",
    sourceMimeType: "application/vnd.google-apps.document",
    personName: "Emily",
    personAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    status: 'blocked',
    hasPreview: true,
    involvesMe: true,
    filesToLoad: [
      {
        name: 'Brand Guidelines.gdoc',
        type: 'code',
        content: `# Brand Guidelines & Policies\n\nAuthor: Brand Operations\nContributors: Emily\n\n## Brand Kit Layout (Consolidated)\nOur brand emphasizes sustainability, transparent sourcing, and modern design aesthetic. All public collateral adheres to our updated color system and typography per Emily's feedback.`,
        mimeType: 'application/vnd.google-apps.document'
      }
    ]
  },
  {
    id: 'todo-2',
    title: "I changed the slide color based on David's feedback",
    titleDone: "I changed the slide color based on David's feedback",
    description: "David commented on Q3 Strategy Deck to use warm palette. I updated the palette for your review.",
    descriptionDone: "David commented on Q3 Strategy Deck to use warm palette. I updated the palette for your review.",
    workspace: 'Branding',
    sourceName: "Q3 Strategy Deck",
    sourceMimeType: "application/vnd.google-apps.presentation",
    personName: "David",
    personAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    status: 'blocked',
    hasPreview: true,
    involvesMe: true,
    filesToLoad: [
      {
        name: 'Q3 Strategy Deck.gslides',
        type: 'code',
        content: `# Q3 Brand Strategy\n\n## Warm Palette Transition\n- Replaced cool slate with warm amber tones per David's feedback\n- Adjusted typography contrast for accessibility\n- Consolidated Q3 brand metrics and targets\n\n## Next Steps\n- Roll out warm palette across marketing collateral\n- Share preview deck with design stakeholders`,
        mimeType: 'application/vnd.google-apps.presentation'
      }
    ]
  },
  {
    id: 'todo-3',
    title: "I removed the section from paragraph based on Juyun's feedback",
    titleDone: "I removed the section from paragraph based on Juyun's feedback",
    description: "Juyun commented on Brand Guidelines doc to remove legacy pricing. I removed the section for your review.",
    descriptionDone: "Juyun commented on Brand Guidelines doc to remove legacy pricing. I removed the section for your review.",
    workspace: 'Branding',
    sourceName: "Brand Guidelines",
    sourceMimeType: "application/vnd.google-apps.document",
    personName: "Juyun",
    personAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
    status: 'blocked',
    hasPreview: true,
    involvesMe: true,
    filesToLoad: [
      {
        name: 'Brand Guidelines.gdoc',
        type: 'code',
        content: `# Brand Guidelines & Policies\n\nAuthor: Brand Operations\nContributors: Juyun, Michael\n\n## Core Principles\nOur brand emphasizes sustainability, transparent sourcing, and modern design aesthetic. All public collateral must adhere to our updated color system and typography.\n\n## Pricing Policy (Updated)\n*Note: Legacy distributor pricing tier section has been cleanly removed per Juyun's feedback.*`,
        mimeType: 'application/vnd.google-apps.document'
      }
    ]
  },
  {
    id: 'todo-space-external-1',
    title: "I updated the branding layout visuals for David",
    description: "David left feedback for Chandu to fix visuals. I updated the layout visuals for your review.",
    workspace: "Branding",
    sourceName: "Branding",
    sourceMimeType: "text/html",
    personName: "David",
    personAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    status: 'done',
    hasPreview: false,
    involvesMe: false
  },
  {
    id: 'todo-4',
    title: 'I updated the sales performance tracker (annual_sales.csv)',
    description: "David commented on annual_sales.csv. I updated the figures against monthly data.",
    workspace: 'Sales',
    sourceName: "Sales",
    sourceMimeType: "application/vnd.google-apps.spreadsheet",
    personName: "David",
    personAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
    status: 'done',
    hasPreview: false,
    involvesMe: true
  },
  {
    id: 'todo-5',
    title: 'I compiled an operations status update on leads',
    description: "Bora and Megan messaged about leads. I compiled the operations status summary.",
    workspace: 'Operations',
    sourceName: "Operations",
    sourceMimeType: "application/vnd.google-apps.chat",
    personName: "Bora & Megan",
    personAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80',
    status: 'done',
    hasPreview: false,
    involvesMe: true
  }
];

interface HomeLandingProps {
  accessToken: string | null;
  userProfile: any;
  onLogin: () => void;
  setViewState: (state: 'home' | 'null' | 'app' | 'files' | 'file_viewer' | 'projector' | 'public_projector' | 'ai_summary') => void;
  setSandboxFiles: (files: any[]) => void;
  setSelectedFile: (file: any) => void;
  setProjectName: (name: string) => void;
  handleSendMessage: (text: string, aiMode?: boolean, contextFiles?: any[]) => void;
  setActiveSpaceId?: (id: string | null) => void;
  handleSpaceIngest?: (file: any) => Promise<void>;
  suggestedList: CoverSlideItem[];
  setSuggestedList: React.Dispatch<React.SetStateAction<CoverSlideItem[]>>;
  isLoadingDrive: boolean;
  setIsLoadingDrive: React.Dispatch<React.SetStateAction<boolean>>;
  sandboxUrl?: string;
  setActiveSidebar?: (sidebar: 'gemini' | 'comments' | 'history' | null) => void;
  theme?: 'light' | 'dark';
  journey?: 'search' | 'create';
  onFileRemove?: (file: any) => void;
  onCreateArtifact?: (type: 'doc' | 'slide' | 'sheet' | 'pix' | 'site' | 'upload') => void;
  onResetChat?: () => void;
  activeSpaceId?: string | null;
  projectName?: string;
  sandboxFiles?: any[];
  todoItems: any[];
  setTodoItems: React.Dispatch<React.SetStateAction<any[]>>;
  isLoggedIn?: boolean;
  onBypassAuth?: () => void;
  todoCacheRef?: React.MutableRefObject<Record<string, any[]>>;
  onProactiveTaskClick?: (task: any) => void;
  spaceMode?: 'choice' | 'tracking' | 'tool';
  onSelectSpaceMode?: (mode: 'tracking' | 'tool') => void;
}

// Full set of suggested items shown in the screenshots with appropriate preview classifications
export const SUGGESTED_ITEMS: CoverSlideItem[] = [
  { 
    id: 'sug-marketing', 
    name: 'Marketing', 
    type: 'space', 
    previewType: 'marketing',
    filesToLoad: [
      {
        name: 'Marketing/Ad Performance/Ad Dashboard.html',
        type: 'code',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marketing Campaign Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Space Grotesk', sans-serif; }
  </style>
</head>
<body class="bg-stone-50 text-slate-800 p-8 min-h-screen">
  <div class="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
    <header class="flex justify-between items-center border-b pb-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-stone-900">ecopaws</h1>
        <p class="text-xs text-stone-500">Q3 Marketing Campaign & Launch Hub</p>
      </div>
      <span class="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full font-semibold text-xs animate-pulse">● Campaign Live</span>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-[#FCDBDB] rounded-3xl p-6 border shadow-2xs">
        <span class="text-xs font-bold text-red-950 uppercase block mb-3">Post Content</span>
        <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-base mb-4 shadow-3xs">🐶</div>
        <h3 class="text-lg font-bold text-red-900 mb-1">Bon appétit, pup.</h3>
        <p class="text-xs text-red-850/80">Instagram focus piece showcasing active pet food bowls and wholesome organic recipes.</p>
      </div>
      
      <div class="bg-[#DFF1FD] rounded-3xl p-6 border shadow-2xs">
        <span class="text-xs font-bold text-sky-950 uppercase block mb-3">Cat Lifestyle</span>
        <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-bold text-base mb-4 shadow-3xs">🐈</div>
        <h3 class="text-lg font-bold text-sky-900 mb-1">Playtime, elevated.</h3>
        <p class="text-xs text-sky-850/80">Interactive feline scratching trees, matching modern minimalist interior styling perfectly.</p>
      </div>

      <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs">
        <span class="text-xs font-bold text-slate-400 uppercase block mb-3">Product Catalog</span>
        <div class="w-12 h-12 bg-[#FCF6E0] rounded-xl flex items-center justify-center font-bold text-base mb-4 shadow-3xs">🦴</div>
        <h3 class="text-lg font-bold text-slate-800 mb-1">Bone & Chew Toys</h3>
        <p class="text-xs text-slate-500">Robust catalog representing biodegradable natural rubber canine dental exercises.</p>
      </div>
    </div>

    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs">
      <h3 class="font-bold text-slate-900 mb-2 text-md">Campaign Goals & Targets</h3>
      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-xs text-slate-600 mb-1">
            <span>Social Engagement Index</span>
            <span class="font-bold">78%</span>
          </div>
          <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="bg-blue-600 h-full rounded-full" style="width: 78%"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs text-slate-600 mb-1">
            <span>Conversion Outflow</span>
            <span class="font-bold">54%</span>
          </div>
          <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div class="bg-emerald-500 h-full rounded-full" style="width: 54%"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
      },
      {
        name: 'Marketing/Ad Performance/campaign_brief.md',
        type: 'code',
        content: `# ecopaws - Marketing Campaign Brief
        
## 1. Objectives
- Accelerate influencer engagement in urban areas.
- Maintain premium branding focused around organic materials and sustainable lifestyles.

## 2. Demographic Targets
- Young professional dog/cat owners.
- High-interest index on raw meals and eco-safe cardboard accessories.`
      },
      {
        name: 'Marketing/Strategy Proposal.docx',
        type: 'code',
        content: `# Strategy Proposal for Brand Expansion
Created by Marketing Operations

Our goal is to execute 3 distinct key milestones:
1. Product Design Overhaul
2. Multi-tier Retail Engagements
3. Ambient Pet Lounges Pop-ups`
      },
      {
        name: 'campaign_brief.md',
        type: 'code',
        content: `# Base level Marketing Campaign Brief
This brief sits at the root directory level.`
      }
    ]
  },
  { 
    id: 'sug-sales', 
    name: 'Sales', 
    type: 'space', 
    previewType: 'sales',
    filesToLoad: [
      {
        name: 'Sales/Revenue Report.html',
        type: 'code',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sales Revenue Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 p-8 min-h-screen text-slate-800">
  <div class="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-slate-200/60 shadow-lg mt-12">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-3xl font-extrabold text-slate-900">$32,550</h2>
        <p class="text-xs text-blue-650 font-semibold tracking-wider uppercase">Active Sales Volume</p>
      </div>
      <span class="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">📈 +24.08% Growth</span>
    </div>
    <div class="h-32 w-full mt-4 flex items-end gap-2 bg-slate-50 p-4 rounded-2xl">
      <div class="flex-1 bg-blue-100 h-[20%] rounded-t-lg transition-all duration-300"></div>
      <div class="flex-1 bg-blue-200 h-[35%] rounded-t-lg"></div>
      <div class="flex-1 bg-blue-300 h-[50%] rounded-t-lg"></div>
      <div class="flex-1 bg-blue-400 h-[65%] rounded-t-lg"></div>
      <div class="flex-1 bg-blue-500 h-[80%] rounded-t-lg"></div>
      <div class="flex-1 bg-blue-600 h-[100%] rounded-t-lg"></div>
    </div>
    <p class="text-xs text-slate-400 text-center mt-3">Monthly ecopaws Inflow performance representation</p>
  </div>
</body>
</html>`
      },
      {
        name: 'Sales/Data Sheets/annual_sales.csv',
        type: 'code',
        content: `Month,Revenue,Profit,GrowthRate
January,18200,5400,12%
February,19500,6100,14%
March,22000,7200,18%
April,24500,8100,21%
May,28900,9400,22%
June,32550,11300,24%`
      }
    ]
  },
  { 
    id: 'sug-pricing', 
    name: 'Pricing Proposal', 
    type: 'file', 
    mimeType: 'application/vnd.google-apps.document', 
    previewType: 'pricing',
    filesToLoad: [
      {
        name: 'pricing.doc',
        type: 'code',
        content: `# ecopaws - Product Pricing Matrices
Created by: Brand Operations
Date: June 2026

## Core Margins
- **Toys Wholesale cost**: $5.50
- **Toys Retail targeted price**: $18.99
- **Distributor margin buffer**: 35%

## Volume Discount Tiers
1. Order size > 1,000 units: 5% discount
2. Order size > 5,000 units: 10% discount`
      }
    ]
  },
  { 
    id: 'sug-ads', 
    name: 'Ad performance', 
    type: 'space', 
    previewType: 'ads',
    filesToLoad: [
      {
        name: 'index.html',
        type: 'code',
        content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-neutral-900 text-white p-8 flex items-center justify-center min-h-screen">
  <div class="grid grid-cols-2 gap-4 max-w-sm w-full">
    <div class="bg-indigo-950 p-4 rounded-2xl border border-indigo-900">
      <span class="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Estimated Profit</span>
      <h3 class="text-2xl font-bold">$1,245</h3>
      <span class="text-[10px] text-emerald-400 mt-2 block">Spend: $480</span>
    </div>
    <div class="bg-stone-900 p-4 rounded-2xl border border-stone-800">
      <span class="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Total Conversion</span>
      <h3 class="text-2xl font-bold">14.08%</h3>
      <span class="text-[10px] text-emerald-400 mt-2 block">Active clicks: 12.4k</span>
    </div>
  </div>
</body>
</html>`
      }
    ]
  },
  { 
    id: 'sug-branding', 
    name: 'Branding', 
    type: 'space', 
    previewType: 'branding',
    filesToLoad: [
      {
        name: 'branding.html',
        type: 'code',
        content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-neutral-50 p-12 flex flex-col items-center justify-center min-h-screen">
  <h1 class="text-5xl font-bold tracking-tight text-neutral-800">ecopaws</h1>
  <p class="text-sm uppercase tracking-wider text-neutral-400 mt-2">Sustainable Pet Brand Launch Kit</p>
  <div class="flex gap-3 mt-8">
    <div class="w-10 h-10 rounded-full bg-[#FCDBDB]"></div>
    <div class="w-10 h-10 rounded-full bg-[#DFF1FD]"></div>
    <div class="w-10 h-10 rounded-full bg-[#FFF2E0]"></div>
  </div>
</body>
</html>`
      }
    ]
  },
  { 
    id: 'sug-support', 
    name: 'Support', 
    type: 'space', 
    previewType: 'support',
    filesToLoad: [
      {
        name: 'tickets.csv',
        type: 'code',
        content: `ID,Subject,Status,Priority
1,Kibbles and Bits Return request,Pending,High
2,Defective canine collar replacement,Solved,Medium
3,Billing query regarding subscription trial,Solved,Low`
      }
    ]
  },
  { 
    id: 'sug-fall2026', 
    name: 'Fall 2026 Marketing proposal', 
    type: 'file', 
    mimeType: 'application/vnd.google-apps.document', 
    previewType: 'doc-proposal',
    filesToLoad: [
      {
        name: 'proposal.md',
        type: 'code',
        content: `# Fall 2026 Marketing proposal

**Author**: Sakura Okoro
**Contributors**: Adam Lee, Malik Harold

---

## Brand Proposition
Our mission is to lead the organic, eco-friendly pet supplies industry by establishing modular, compostable scratchpads and natural dog treats.

## Social Strategy
We aim to harness micro-influencers and pet channels to demonstrate eco-consciousness values in real-world scenarios.`
      }
    ]
  },
  { 
    id: 'sug-operations', 
    name: 'Operations', 
    type: 'space', 
    previewType: 'operations',
    filesToLoad: [
      {
        name: 'index.html',
        type: 'code',
        content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F8F9FB] p-8 text-indigo-950 font-sans">
  <div class="max-w-sm mx-auto space-y-4 bg-white p-6 rounded-3xl border shadow-sm">
    <h3 class="font-bold text-base mb-4">Operations Status Indicator</h3>
    <div>
      <div class="flex justify-between text-xs font-semibold mb-1">
        <span>Ads channel conversion</span>
        <span class="text-indigo-600">80%</span>
      </div>
      <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div class="bg-indigo-600 h-full" style="width: 80%"></div>
      </div>
    </div>
    <div>
      <div class="flex justify-between text-xs font-semibold mb-1">
        <span>Sales allocations</span>
        <span class="text-indigo-500">45%</span>
      </div>
      <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div class="bg-indigo-550 h-full" style="width: 45%"></div>
      </div>
    </div>
  </div>
</body>
</html>`
      }
    ]
  },
];

const isHomeId = (id: string | null | undefined) => {
  if (!id) return true;
  const lower = String(id).toLowerCase().trim();
  return lower === 'home' || lower === 'home_guest' || lower.startsWith('home_') || lower.startsWith('home-') || lower === 'home dashboard';
};

export function HomeLanding({
  accessToken,
  userProfile,
  onLogin,
  setViewState,
  setSandboxFiles,
  setSelectedFile,
  setProjectName,
  handleSendMessage,
  setActiveSpaceId,
  handleSpaceIngest,
  suggestedList,
  setSuggestedList,
  isLoadingDrive,
  setIsLoadingDrive,
  sandboxUrl,
  setActiveSidebar,
  theme = 'light',
  journey = 'search',
  onFileRemove,
  onCreateArtifact: onCreateArtifactProp,
  onResetChat,
  activeSpaceId,
  projectName,
  sandboxFiles = [],
  todoItems,
  setTodoItems,
  isLoggedIn: isLoggedInProp,
  onBypassAuth,
  todoCacheRef: todoCacheRefProp,
  onProactiveTaskClick,
  spaceMode,
  onSelectSpaceMode
}: HomeLandingProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localBypassAuth, setLocalBypassAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [digestData, setDigestData] = useState<any | null>(null);
  const [isDigestLoading, setIsDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);

  const localTodoCacheRef = React.useRef<Record<string, any[]>>({});
  const todoCacheRef = todoCacheRefProp || localTodoCacheRef;
  const globalDigestCacheRef = React.useRef<{ token: string | null, data: any } | null>(null);

  // Bind live Workspace Digest data to Tasks when loaded
  useEffect(() => {
    if (!digestData || digestData.spaceId !== activeSpaceId) return;

    const actions = digestData.immediateActions || [];
    const followUps = digestData.followUps || [];
    const combined = [...actions, ...followUps];

    if (combined.length === 0) {
      setTodoItems([]);
      return;
    }

    const mappedTodos = combined.map((item: any, idx: number) => {
      const cleanSpace = cleanWorkspaceName(item.source || item.workspace || 'Workspace Document');
      const textForMime = `${item.source || ''} ${item.description || ''} ${item.action || ''}`.toLowerCase();
      
      let mimeType = 'application/vnd.google-apps.document';
      if (item.type === 'email') {
        mimeType = 'application/vnd.google-apps.mail';
      } else if (item.type === 'chat') {
        mimeType = 'application/vnd.google-apps.chat';
      } else if (textForMime.includes('slide') || textForMime.includes('presentation') || textForMime.includes('deck')) {
        mimeType = 'application/vnd.google-apps.presentation';
      } else if (textForMime.includes('sheet') || textForMime.includes('spreadsheet') || textForMime.includes('csv') || textForMime.includes('tracker') || textForMime.includes('ranking') || textForMime.includes('estimates') || textForMime.includes('sizing') || textForMime.includes('table')) {
        mimeType = 'application/vnd.google-apps.spreadsheet';
      }

      let personName = 'Collaborator';
      if (item.source) {
        const matches = item.source.match(/(?:from|by|at)\s+([A-Z][a-z]+)/i);
        if (matches && matches[1]) {
          personName = matches[1];
        }
      }

      const avatars = [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80'
      ];
      const personAvatar = avatars[idx % avatars.length];
      const isProactive = idx === 0;

      let fileName = cleanSpace;
      let contentVal = '';

      if (mimeType === 'application/vnd.google-apps.presentation') {
        if (!fileName.toLowerCase().endsWith('.gslides') && !fileName.toLowerCase().endsWith('.pptx')) {
          fileName = `${fileName.replace(/\.[^/.]+$/, "")}.gslides`;
        }
        contentVal = `# Presentation Draft: ${cleanSpace}\n\n## Updated Slides & Visuals\n- Applied design improvements per feedback: ${item.action || item.description || 'Updated layout and colors'}\n- Synchronized slide formatting across all cards\n\n## Next Steps\n- Share updated presentation deck with team\n- Ready for stakeholder review`;
      } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        if (!fileName.toLowerCase().endsWith('.gsheet') && !fileName.toLowerCase().endsWith('.csv')) {
          fileName = `${fileName.replace(/\.[^/.]+$/, "")}.gsheet`;
        }
        if (cleanSpace.toLowerCase().includes('ranking') || textForMime.includes('sizing') || textForMime.includes('estimates')) {
          contentVal = `Project ID,Project Name,Priority,DI Engineering Months,Status,Owner\nPRJ-101,AI Threat Defense Platform,P0,12.5 Mo,Drafted,Laurence F.\nPRJ-102,Data Intelligence (DI) Sizing Pipeline,P0,8.0 Mo,Updated (Per Li Fang),Li Fang\nPRJ-103,Cloud Infrastructure Refactor,P1,4.5 Mo,In Review,@clsimon\nPRJ-104,Security Threat Modeling,P1,6.0 Mo,Drafted,@connorsimmons\nPRJ-105,UI/UX Workspace Refresh,P2,3.0 Mo,Planned,@adamws`;
        } else {
          contentVal = `ID,Metric Item,Target Value,Current Status,Collaborator\n1,${item.description || 'Primary Task Target'},100%,Updated (Per Feedback),${personName}\n2,Sandbox Execution Stage,Complete,Verified,Gemini Agent\n3,Q3 Target Review,On Track,In Progress,Team Lead`;
        }
      } else {
        if (!fileName.toLowerCase().includes('.')) {
          fileName = `${fileName}.gdoc`;
        }
        if (cleanSpace.toLowerCase().includes('threat defense') || textForMime.includes('mapping')) {
          contentVal = `# ${cleanSpace}\n\nAuthor: Laurence Fahey\nContributors: Gemini Agent, Threat Defense Team\n\n## Project ID Mapping (First Pass Review)\n- **PRJ-101 (Core AI Threat Defense Engine)**: Mapped to enterprise security telemetry pipeline.\n- **PRJ-102 (Seller Guidance Ruleset)**: Integrated automated threat detection heuristics and seller playbook triggers.\n- **PRJ-108 (Threat Defense Monitoring)**: Aligned with cloud threat feeds per Laurence Fahey's request.\n\n## Review Feedback & Recommendations\n- **Completed Modification**: ${item.action || item.description || 'Reviewed Project ID mapping section and added comprehensive feedback notes.'}\n- All mappings verified against current project taxonomy and security guidelines.\n- Ready for Laurence Fahey's final review and approval.`;
        } else {
          contentVal = `# ${cleanSpace}\n\nAuthor: Workspace Operations\nContributors: ${personName}, Gemini Agent\n\n## Overview\nThis document defines the core guidelines, technical requirements, and action items for **${cleanSpace}**. All sections reflect recent team feedback and automated intelligence adjustments.\n\n## Updated Guidance (Consolidated)\n- **Action Taken**: ${item.action || item.description || 'Consolidated layout and updated wording per collaborator comments.'}\n- Aligned documentation structure with active workspace standards and guidelines.\n- Verified changes in isolated staging sandbox environment.\n\n## Next Steps\n- Ready for final stakeholder review and merge into production folder.`;
        }
      }

      let derivedWorkspace = item.workspace;
      if (!derivedWorkspace || derivedWorkspace === 'Google Workspace' || derivedWorkspace === 'Workspace') {
        const isHomeView = isHomeId(activeSpaceId);
        derivedWorkspace = !isHomeView && projectName ? projectName : 'Home';
      }

      return {
        id: item.id || `todo-real-${idx}`,
        title: item.title || item.description || 'I processed a Workspace action item',
        description: isProactive ? `${item.action || 'Analyzing details'}. Working on task...` : (item.action || 'I completed this task for your review.'),
        descriptionDone: `${item.action || 'I completed this task for your review.'}`,
        workspace: derivedWorkspace,
        sourceName: cleanSpace,
        sourceMimeType: mimeType,
        personName,
        personAvatar,
        status: isProactive ? 'working' : 'done',
        involvesMe: idx !== 3,
        hasPreview: isProactive,
        previewContent: item.description || "Consolidated details draft",
        filesToLoad: [
          {
            name: fileName,
            type: 'code',
            content: contentVal,
            mimeType: mimeType
          }
        ]
      };
    });

    let finalTodos = [...mappedTodos];
    const isHome = isHomeId(activeSpaceId);
    if (!isHome && projectName) {
      const spaceName = projectName.trim();
      const hasSpaceTasks = mappedTodos.some(t => 
        (t.workspace || '').toLowerCase().includes(spaceName.toLowerCase()) ||
        spaceName.toLowerCase().includes((t.workspace || '').toLowerCase())
      );
      
      if (!hasSpaceTasks) {
        const generatedTasks = [
          {
            id: `todo-gen-${activeSpaceId}-1`,
            title: `I structured the ${spaceName} index layout`,
            description: `I consolidated components and resources in ${spaceName}. Working on task...`,
            descriptionDone: `I consolidated components and resources in ${spaceName} for your review.`,
            workspace: spaceName,
            sourceName: `${spaceName} Files`,
            sourceMimeType: 'application/vnd.google-apps.document',
            personName: 'Emily',
            personAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
            status: 'working',
            involvesMe: true,
            hasPreview: true,
            previewContent: `Proposed index structure for ${spaceName}`,
            filesToLoad: [
              {
                name: 'index.html',
                type: 'code',
                content: `<!-- ${spaceName} Dashboard -->\n<!DOCTYPE html>\n<html>\n<head>\n<title>${spaceName}</title>\n</head>\n<body>\n<h1>Welcome to ${spaceName}</h1>\n</body>\n</html>`,
                mimeType: 'text/html'
              }
            ]
          },
          {
            id: `todo-gen-${activeSpaceId}-2`,
            title: `I drafted the presentation deck for ${spaceName} goals`,
            description: `I incorporated team feedback into the ${spaceName} roadmap presentation for your review.`,
            descriptionDone: `I incorporated team feedback into the ${spaceName} roadmap presentation for your review.`,
            workspace: spaceName,
            sourceName: 'Goals Deck',
            sourceMimeType: 'application/vnd.google-apps.presentation',
            personName: 'David',
            personAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
            status: 'done',
            involvesMe: true,
            hasPreview: false,
            previewContent: '',
            filesToLoad: []
          }
        ];
        finalTodos = [...generatedTasks, ...finalTodos];
      }
    }

    setTodoItems(finalTodos);
    const spaceKey = activeSpaceId || 'home';
    todoCacheRef.current[spaceKey] = finalTodos;
  }, [digestData, activeSpaceId, projectName]);

  // 40 seconds simulation timer when loading active proactive tasks
  useEffect(() => {
    const proactiveItem = todoItems.find(item => item.status === 'working');
    if (!proactiveItem) return;

    const timer = setTimeout(() => {
      setTodoItems(prev => {
        const updated = prev.map(item => {
          if (item.status === 'working') {
            return {
              ...item,
              status: 'done',
              description: item.descriptionDone || item.description
            };
          }
          return item;
        });
        const spaceKey = activeSpaceId || 'home';
        todoCacheRef.current[spaceKey] = updated;
        return updated;
      });
    }, 40000); // 40 seconds

    return () => clearTimeout(timer);
  }, [todoItems, activeSpaceId]);

  // Filter todoItems based on the active space/project
  const filteredTodoItems = React.useMemo(() => {
    const isHome = isHomeId(activeSpaceId);
    if (isHome) {
      // Home Dashboard shows ONLY tasks that involve the user (involvesMe !== false)
      return todoItems.filter(item => item.involvesMe !== false);
    }

    const currentProject = (projectName || '').toLowerCase().trim();
    if (!currentProject || currentProject === 'home dashboard') {
      return todoItems.filter(item => item.involvesMe !== false);
    }

    // Helper function for smart matching (bidirectional + word overlap)
    const matchesText = (target: string, query: string) => {
      if (!target || !query) return false;
      const t = target.toLowerCase().trim();
      const q = query.toLowerCase().trim();
      if (t.includes(q) || q.includes(t)) return true;
      
      const wordsT = t.split(/[\s·_\-\/]+/).filter(w => w.length > 3);
      const wordsQ = q.split(/[\s·_\-\/]+/).filter(w => w.length > 3);
      return wordsT.some(w => wordsQ.includes(w));
    };

    // Space Dashboard shows ALL tasks for the space, including teammate tasks
    return todoItems.filter(item => {
      const itemWorkspace = (item.workspace || '').toLowerCase().trim();
      const itemSourceName = (item.sourceName || '').toLowerCase().trim();
      const itemTitle = (item.title || '').toLowerCase().trim();
      const itemDesc = (item.description || '').toLowerCase().trim();
      
      const isProjectMatch = matchesText(itemWorkspace, currentProject) || 
                             matchesText(itemSourceName, currentProject) ||
                             matchesText(itemTitle, currentProject);
                             
      if (isProjectMatch) return true;

      // Scan sandboxFiles list inside the space context for matching titles or source references
      return (sandboxFiles || []).some(file => {
        if (!file || !file.name) return false;
        const cleanFileName = file.name.split('/').pop().toLowerCase().replace(/\.[^/.]+$/, "").trim();
        if (cleanFileName.length < 3) return false;

        return matchesText(itemWorkspace, cleanFileName) || 
               matchesText(itemSourceName, cleanFileName) ||
               matchesText(itemTitle, cleanFileName) ||
               matchesText(itemDesc, cleanFileName);
      });
    });
  }, [todoItems, activeSpaceId, projectName, sandboxFiles]);

  const handleAgendaItemClick = (item: any) => {
    if (!item) return;

    if (item.type === 'email') {
      const emailFile = {
        id: `email-${item.id || Date.now()}`,
        name: item.description || 'Email Thread',
        type: 'email_thread',
        subject: item.description,
        from: item.source || 'Gmail Workspace',
        snippet: item.action || 'No email body snippet available.',
        date: 'Today',
        mimeType: 'application/vnd.google-apps.mail'
      };
      setSandboxFiles([emailFile]);
      setSelectedFile(emailFile);
      setViewState('files');
    } 
    else if (item.type === 'chat') {
      const chatFile = {
        id: `chat-${item.id || Date.now()}`,
        name: item.description || 'Chat Space',
        type: 'chat_space',
        spaceName: item.source || 'Google Chat Workspace',
        content: item.action || 'No message history.',
        mimeType: 'application/vnd.google-apps.chat'
      };
      setSandboxFiles([chatFile]);
      setSelectedFile(chatFile);
      setViewState('files');
    }
    else if (item.type === 'comment') {
      // Find comment file if any, otherwise alert
      alert(`Opening document comments: ${item.description}`);
    }
  };

  React.useEffect(() => {
    const spaceKey = activeSpaceId || 'home';
    const isHomeViewForDigest = isHomeId(activeSpaceId);
    if (!isHomeViewForDigest && spaceMode !== 'tracking') {
      setTodoItems([]);
      setIsDigestLoading(false);
      return;
    }

    const cached = todoCacheRef.current[spaceKey];
    if (cached && cached.length > 0) {
      setTodoItems(cached);
      setIsDigestLoading(false);
      setDigestError(null);
      return;
    }

    if (globalDigestCacheRef.current && globalDigestCacheRef.current.token === accessToken && accessToken) {
      setDigestData({ ...globalDigestCacheRef.current.data, spaceId: activeSpaceId });
      setIsDigestLoading(false);
      setDigestError(null);
      return;
    }

    setDigestData(null);

    const isMock = localBypassAuth || isLoggedInProp;
    if (!accessToken && !isMock) {
      setTodoItems([]);
      return;
    }

    setTodoItems([]); // Clear mock tasks immediately when accessToken or space changes

    if (!accessToken && isMock) {
      const mockDigest = {
        spaceId: activeSpaceId,
        immediateActions: [
          {
            id: 'todo-proactive-1',
            description: "I addressed Emily's comment on Brand Guidelines",
            action: "Emily commented to consolidate the Brand Kit layout. I consolidated the layout for your review.",
            source: "Branding"
          },
          {
            id: 'todo-2',
            description: 'I added the design strategy to the Marketing campaign brief',
            action: "A teammate suggested adding key design guidelines. I updated the Marketing brief for your review.",
            source: "Marketing"
          },
          {
            id: 'todo-3',
            description: 'I crafted the pricing strategy on Pricing Proposal doc',
            action: "I updated pricing tiers and structure on the pricing doc for your review.",
            source: 'Pricing Proposal'
          }
        ],
        followUps: [
          {
            id: 'todo-4',
            description: 'I updated the sales performance tracker (annual_sales.csv)',
            action: "I verified monthly figures against actual performance data.",
            source: 'Sales'
          },
          {
            id: 'todo-5',
            description: 'I compiled an operations status update on leads',
            action: "I reviewed the leads pipeline and compiled an operations status summary.",
            source: 'Operations'
          }
        ]
      };
      setDigestData(mockDigest);
      return;
    }

    const loadDigest = async () => {
      setIsDigestLoading(true);
      setDigestError(null);
      try {
        const res = await fetch('/api/workspace-digest', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          globalDigestCacheRef.current = { token: accessToken, data };
          setDigestData({ ...data, spaceId: activeSpaceId });
        } else {
          const errText = await res.text();
          console.error("Failed to load digest:", errText);
          setDigestError("Unable to load daily digest.");
        }
      } catch (err) {
        console.error("Error loading digest:", err);
        setDigestError("Error connecting to server.");
      } finally {
        setIsDigestLoading(false);
      }
    };

    loadDigest();
  }, [accessToken, activeSpaceId, spaceMode]);

  // Fallback check to support bypassing authentication or showing login CTA
  const isLoggedIn = isLoggedInProp !== undefined ? isLoggedInProp : (accessToken !== null || localBypassAuth);

  React.useEffect(() => {
    if (!accessToken) {
      setSuggestedList(prev => {
        const sessionItems = prev.filter(item => !SUGGESTED_ITEMS.some(s => s.id === item.id));
        if (sessionItems.length > 0) {
          const filteredMock = SUGGESTED_ITEMS.filter(m => !sessionItems.some(s => s.name.toLowerCase() === m.name.toLowerCase()));
          return [...sessionItems, ...filteredMock];
        }
        return SUGGESTED_ITEMS;
      });
      return;
    }

    // Cache guard: If we have already successfully loaded real Drive items once, skip re-fetching to avoid flicker
    const hasRealDriveItems = suggestedList.some(item => item.isReal && !item.filesToLoad?.some(f => f.content?.includes('<html')));
    if (hasRealDriveItems && suggestedList.length > 5) {
      return;
    }

    const fetchRealDriveItems = async () => {
      setIsLoadingDrive(true);
      try {
        const foldersQ = "trashed = false and mimeType = 'application/vnd.google-apps.folder'";
        const foldersUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(foldersQ)}&pageSize=16&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,size,owners)`;

        const filesQ = "trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.presentation' or mimeType = 'text/plain')";
        const filesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(filesQ)}&pageSize=16&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,size,owners)`;

        const headers = {
          'Authorization': `Bearer ${accessToken}`
        };

        const [foldersRes, filesRes] = await Promise.all([
          fetch(foldersUrl, { headers }),
          fetch(filesUrl, { headers })
        ]);

        let driveFolders: any[] = [];
        let driveFiles: any[] = [];

        if (foldersRes.ok) {
          const folderData = await foldersRes.json();
          driveFolders = folderData.files || [];
        } else {
          console.error(`Folder query failed: ${foldersRes.status}`);
        }

        if (filesRes.ok) {
          const fileData = await filesRes.json();
          const rawFiles = fileData.files || [];
          // Filter out app.js files so they don't appear in suggested files
          driveFiles = rawFiles.filter((file: any) => (file.name || '').toLowerCase().trim() !== 'app.js');
        } else {
          console.error(`Files query failed: ${filesRes.status}`);
        }

        // Combine folders and files, then sort them together by modifiedTime descending
        const combinedRaw = [...driveFolders, ...driveFiles];
        combinedRaw.sort((a: any, b: any) => {
          const timeA = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
          const timeB = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
          return timeB - timeA;
        });

        // Take up to 16 items in total, naturally interspersed based on recency
        const combined = combinedRaw.slice(0, 16);

        if (combined.length > 0) {
          const mappedItems: CoverSlideItem[] = await Promise.all(
            combined.map(async (file: any) => {
              const type = file.mimeType === 'application/vnd.google-apps.folder' ? 'space' : 'file';
              const isFolder = type === 'space';
              
              const item: CoverSlideItem = {
                id: file.id,
                name: file.name,
                type: type,
                mimeType: file.mimeType,
                isReal: true,
                filesToLoad: [],
                size: file.size,
                modifiedTime: file.modifiedTime,
                owners: file.owners
              };

              if (isFolder) {
                try {
                  const childQuery = `'${file.id}' in parents and trashed = false`;
                  const childUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(childQuery)}&pageSize=5&fields=files(id,name,mimeType)`;
                  const childRes = await fetch(childUrl, { headers });
                  if (childRes.ok) {
                    const childData = await childRes.json();
                    const allChildren = childData.files || [];
                    // Filter out app.js files so they don't clutter the children preview
                    const rawChildren = allChildren.filter((c: any) => (c.name || '').toLowerCase().trim() !== 'app.js');
                    item.realChildren = rawChildren;
                    
                    const bestChild = rawChildren.find((c: any) => {
                      const nameLower = (c.name || '').toLowerCase();
                      const mimeLower = (c.mimeType || '').toLowerCase();
                      return nameLower.endsWith('.html') || nameLower.endsWith('.htm') || mimeLower.includes('html');
                    }) || rawChildren.find((c: any) => {
                      const nameLower = (c.name || '').toLowerCase();
                      const mimeLower = (c.mimeType || '').toLowerCase();
                      return mimeLower.startsWith('image/') || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.gif') || nameLower.endsWith('.svg');
                    }) || rawChildren.find((c: any) => {
                      const mimeLower = (c.mimeType || '').toLowerCase();
                      return mimeLower.includes('document') || mimeLower.includes('presentation') || c.name.toLowerCase().endsWith('.md');
                    }) || rawChildren.find((c: any) => {
                      const mimeLower = (c.mimeType || '').toLowerCase();
                      return mimeLower.includes('spreadsheet') || mimeLower.includes('sheet') || mimeLower.includes('csv') || c.name.toLowerCase().endsWith('.csv');
                    }) || rawChildren[0];

                    if (bestChild) {
                      let bestContent = "";
                      const mType = (bestChild.mimeType || '').toLowerCase().trim();
                      const isIframeChild = mType.includes('document') || mType.includes('presentation') || mType.includes('slides') || mType.includes('gdoc') || mType.includes('gslides');
                      
                      if (!isIframeChild) {
                        try {
                          let expUrl = '';
                          if (mType.includes('google-apps.spreadsheet')) {
                            expUrl = `https://www.googleapis.com/drive/v3/files/${bestChild.id}/export?mimeType=text/csv`;
                          } else if (mType.includes('google-apps.document')) {
                            expUrl = `https://www.googleapis.com/drive/v3/files/${bestChild.id}/export?mimeType=text/plain`;
                          } else if (mType.includes('google-apps.presentation')) {
                            expUrl = `https://www.googleapis.com/drive/v3/files/${bestChild.id}?fields=description,name,mimeType`;
                          } else {
                            expUrl = `https://www.googleapis.com/drive/v3/files/${bestChild.id}?alt=media`;
                          }

                          const bestContentRes = await fetch(expUrl, { headers });
                          if (bestContentRes.ok) {
                            if (mType.includes('google-apps.presentation')) {
                              const pMeta = await bestContentRes.json();
                              bestContent = `# Presentation: ${pMeta.name}\n\nType: Google Slides\nFile ID: ${bestChild.id}`;
                            } else if (mType.startsWith('image/') || bestChild.name.toLowerCase().endsWith('.png') || bestChild.name.toLowerCase().endsWith('.jpg') || bestChild.name.toLowerCase().endsWith('.jpeg')) {
                              const blob = await bestContentRes.blob();
                              bestContent = await new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result as string);
                                reader.readAsDataURL(blob);
                              });
                            } else {
                              bestContent = await bestContentRes.text();
                            }
                          }
                        } catch (bestErr) {
                          console.warn("Failed to load content for bestChild folder preview:", bestErr);
                        }
                      }

                      item.filesToLoad = rawChildren.map((child: any) => ({
                        id: child.id,
                        name: child.name,
                        type: 'code',
                        content: child.id === bestChild.id && bestContent ? bestContent : `# ${child.name}\n\nContents will load dynamically upon active selection.`,
                        driveId: child.id,
                        mimeType: child.mimeType
                      }));
                    } else {
                      item.filesToLoad = [];
                    }
                  }
                } catch (folderErr) {
                  console.error("Failed to fetch folder children for cover card:", folderErr);
                }
              } else {
                const mType = (file.mimeType || '').toLowerCase();
                const isIframeFile = mType.includes('document') || mType.includes('presentation') || mType.includes('slides') || mType.includes('gdoc') || mType.includes('gslides');
                
                if (isIframeFile) {
                  item.filesToLoad = [
                    {
                      id: file.id,
                      name: file.name,
                      type: 'code',
                      content: '',
                      driveId: file.id,
                      mimeType: file.mimeType
                    }
                  ];
                } else {
                  try {
                    let expUrl = '';
                    if (mType.includes('spreadsheet')) {
                      expUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
                    } else if (mType.includes('document')) {
                      expUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
                    } else {
                      expUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
                    }
                    const contentRes = await fetch(expUrl, { headers });
                    if (contentRes.ok) {
                      const rawText = await contentRes.text();
                      item.realDocText = rawText.substring(0, 450);
                      item.filesToLoad = [
                        {
                          id: file.id,
                          name: file.name,
                          type: 'code',
                          content: rawText,
                          driveId: file.id,
                          mimeType: file.mimeType
                        }
                      ];
                    }
                  } catch (fileErr) {
                    console.error("Failed to fetch file content preview for cover card:", fileErr);
                    item.realDocText = "Google Document - click to launch work workspace.";
                  }
                }
              }

              return item;
            })
          );

          setSuggestedList(prev => {
            const sessionItems = prev.filter(item => !SUGGESTED_ITEMS.some(s => s.id === item.id) && !mappedItems.some(m => m.id === item.id));
            return [...sessionItems, ...mappedItems];
          });
        } else {
          setSuggestedList(prev => {
            const sessionItems = prev.filter(item => !SUGGESTED_ITEMS.some(s => s.id === item.id));
            if (sessionItems.length > 0) {
              const filteredMock = SUGGESTED_ITEMS.filter(m => !sessionItems.some(s => s.name.toLowerCase() === m.name.toLowerCase()));
              return [...sessionItems, ...filteredMock];
            }
            return SUGGESTED_ITEMS;
          });
        }
      } catch (err) {
        console.warn("Failed to load real drive items. Falling back to default mock items:", err);
        setSuggestedList(prev => {
          const sessionItems = prev.filter(item => !SUGGESTED_ITEMS.some(s => s.id === item.id));
          if (sessionItems.length > 0) {
            const filteredMock = SUGGESTED_ITEMS.filter(m => !sessionItems.some(s => s.name.toLowerCase() === m.name.toLowerCase()));
            return [...sessionItems, ...filteredMock];
          }
          return SUGGESTED_ITEMS;
        });
      } finally {
        setIsLoadingDrive(false);
      }
    };

    fetchRealDriveItems();
  }, [accessToken]);

  // Handle clicking a suggested card item
  const handleItemClick = async (item: any) => {
    if (onResetChat) {
      onResetChat();
    }
    if (setActiveSidebar) {
      setActiveSidebar('gemini');
    }
    const isRealFile = item.isReal || !!item.mimeType || !!item.driveId || item.type === 'file';
    if (isRealFile) {
      if (item.type === 'space') {
        if (setActiveSpaceId) {
          setActiveSpaceId(item.id);
        }
        setProjectName(item.name);
        if (handleSpaceIngest) {
          await handleSpaceIngest(item);
        }
        setViewState('files');
      } else {
        // Real single document/file
        setProjectName(item.name);
        
        const mType = (item.mimeType || '').toLowerCase();
        
        let loadedContent = item.filesToLoad?.[0]?.content || item.realDocText || item.content || '';
        
        const fileObj: any = {
          name: item.name,
          type: 'code',
          content: loadedContent,
          driveId: item.id || item.driveId,
          mimeType: item.mimeType,
          id: item.id ? `real-file-${item.id}` : `real-file-${Date.now()}`
        };

        // Render in the canvas instantly (non-blocking)
        setSandboxFiles([fileObj]);
        setSelectedFile(fileObj);
        setViewState('files');

        // Fetch file content in the background so it is cached and available to the developer agent/composer
        if (!loadedContent && accessToken) {
          (async () => {
            try {
              let expUrl = '';
              if (mType.includes('document')) {
                expUrl = `https://www.googleapis.com/drive/v3/files/${item.id}/export?mimeType=text/plain`;
              } else if (mType.includes('spreadsheet')) {
                expUrl = `https://www.googleapis.com/drive/v3/files/${item.id}/export?mimeType=text/csv`;
              } else {
                expUrl = `https://www.googleapis.com/drive/v3/files/${item.id}?alt=media`;
              }
              
              const contentRes = await fetch(expUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
              });
              
              if (contentRes.ok) {
                let textOrDataUrl = '';
                if (mType.includes('image') || mType.includes('video') || mType.includes('audio') || mType.includes('pdf')) {
                  const blob = await contentRes.blob();
                  textOrDataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                  });
                } else {
                  textOrDataUrl = await contentRes.text();
                }
                fileObj.content = textOrDataUrl;
                // Silently update sandbox files state with the downloaded content
                setSandboxFiles([fileObj]);
                setSelectedFile(prev => prev && prev.driveId === item.id ? { ...prev, content: textOrDataUrl } : prev);
              }
            } catch (err) {
              console.error("Error fetching file content in background:", err);
            }
          })();
        }
      }
      return;
    }

    if (!item.filesToLoad || item.filesToLoad.length === 0) return;

    // Capitalize name to establish matching premium aesthetics
    setProjectName(item.name);
    setSandboxFiles(item.filesToLoad);

    // Auto-select preferred file to show immediately
    const indexHTML = item.filesToLoad.find(f => f.name.toLowerCase() === 'index.html');
    const firstDoc = item.filesToLoad.find(f => f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.doc'));
    const defaultSelect = indexHTML || firstDoc || item.filesToLoad[0];
    
    if (defaultSelect) {
      setSelectedFile(defaultSelect);
    }

    setViewState('files');
  };

  // Convert mimeType into corresponding file icon used elsewhere in NullState List views
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return docsIcon;
    const lower = mimeType.toLowerCase();
    if (lower.includes('document')) return docsIcon;
    if (lower.includes('sheet') || lower.includes('spreadsheet') || lower.includes('csv')) return sheetsIcon;
    if (lower.includes('presentation') || lower.includes('slide')) return slidesIcon;
    if (lower.includes('form')) return formsIcon;
    if (lower.includes('html')) return htmlIcon;
    return docsIcon;
  };

  const handleCreateArtifact = (type: 'doc' | 'slide' | 'sheet' | 'pix' | 'site' | 'upload') => {
    if (type === 'upload') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string || '';
            const newFile = {
              name: file.name,
              type: 'code',
              content: content,
              mimeType: file.type || 'text/plain',
              id: `uploaded-${Date.now()}`
            };
            setSandboxFiles([newFile]);
            setSelectedFile(newFile);
            setViewState('files');
            if (setActiveSidebar) {
              setActiveSidebar('gemini');
            }
          };
          reader.readAsText(file);
        }
      };
      fileInput.click();
      return;
    }

    let name = '';
    let content = '';
    let mimeType = '';

    if (type === 'doc') {
      name = 'document.doc';
      content = `# New document\n\n## Tell me what you want to write`;
      mimeType = 'application/vnd.google-apps.document';
      setProjectName('New Document');
    } else if (type === 'slide') {
      name = 'presentation.gslides';
      content = `# Slide 1\n## Welcome to Presentation\n\n- Write content or ask Gemini to design your deck.`;
      mimeType = 'application/vnd.google-apps.presentation';
      setProjectName('New Slide Deck');
    } else if (type === 'sheet') {
      name = 'spreadsheet.gsheet';
      content = `Row,Column,Value\n1,A,Welcome to your Spreadsheet\n2,B,`;
      mimeType = 'application/vnd.google-apps.spreadsheet';
      setProjectName('New Spreadsheet');
    } else if (type === 'pix') {
      name = 'image.png';
      content = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%233186FF;stop-opacity:1"/><stop offset="100%" style="stop-color:%23DFF1FD;stop-opacity:1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><text x="50%" y="50%" font-family="sans-serif" font-size="32" font-weight="bold" fill="white" dominant-baseline="middle" text-anchor="middle">Ask Gemini to Generate Image</text></svg>`;
      mimeType = 'image/png';
      setProjectName('New Image');
    } else if (type === 'site') {
      name = 'index.html';
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Site Workspace</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 p-8 min-h-screen flex items-center justify-center">
  <div class="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-3xl border shadow-sm">
    <h1 class="text-3xl font-bold text-slate-950">My Web Workspace</h1>
    <p class="text-xs text-slate-500">Ask Gemini to design pages or integrate widgets.</p>
  </div>
</body>
</html>`;
      mimeType = 'text/html';
      setProjectName('New Website');
    }

    const newArtifact: any = {
      name,
      type: 'code',
      content,
      mimeType,
      fontFamily: type === 'doc' ? 'Google Sans' : undefined,
      isDocJourney: type === 'doc',
      id: `created-artifact-${Date.now()}`
    };

    setSandboxFiles([newArtifact]);
    setSelectedFile(newArtifact);
    setViewState('files');
    if (setActiveSidebar) {
      setActiveSidebar('gemini');
    }
  };

  // 1. NOT LOGGED IN VIEW - Center CTA cleanly in the viewport
  if (!isLoggedIn) {
    return (
      <div id="home-login-overlay" className="w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-300 px-6 select-none bg-transparent">
        <div className="w-full h-[33.33%] flex items-center justify-center shrink-0">
          <NullTitle theme={theme}>Sign in with Google</NullTitle>
        </div>
        <div className="flex items-center gap-3 justify-center w-full mt-6">
          <button
            id="home-landing-login-btn"
            onClick={onLogin}
            className="h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-none border-none outline-none flex items-center justify-center"
          >
            Login
          </button>
          <button
            id="home-landing-mock-btn"
            onClick={() => onBypassAuth ? onBypassAuth() : setLocalBypassAuth(true)}
            className="h-10 px-6 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#2B2D31] dark:hover:bg-[#3E4042] text-slate-700 dark:text-[#E3E3E3] font-semibold text-sm transition-all duration-200 border-none cursor-pointer"
          >
            Mock Data
          </button>
        </div>
      </div>
    );
  }

  console.log("[DEBUG] HomeLanding render state:", {
    activeSpaceId,
    projectName,
    todoCount: filteredTodoItems.length
  });

  const isSpaceCreation = activeSpaceId && activeSpaceId.startsWith('space-creation-');

  if (isSpaceCreation) {
    return <div className="w-full h-full bg-transparent" />;
  }

  const isHome = isHomeId(activeSpaceId);
  if (!isHome && spaceMode !== 'tracking') {
    return <div className="w-full h-full bg-transparent" />;
  }

  if (isDigestLoading) {
    return (
      <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-transparent">
        <div className="relative z-10 flex items-center justify-center -translate-y-12">
          <ShapeLoader size={324} />
        </div>
      </div>
    );
  }

  return (
    <div id="home-landing-content" className="w-full h-full flex flex-col items-center justify-start overflow-y-auto pt-16 px-10 pb-16 animate-in fade-in-30 slide-in-from-bottom-2 duration-300 bg-transparent select-text">
      <div className="w-full max-w-[640px] mt-8 text-left space-y-6">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-[#E3E3E3] font-sans pl-1">
          To Do:
        </h2>
        <div className="flex flex-col gap-3.5 w-full">
          {filteredTodoItems.map((item) => (
            <InferredTaskCard 
              key={item.id}
              item={item}
              getFileIcon={getFileIcon}
              onClick={() => {
                if (onProactiveTaskClick) {
                  onProactiveTaskClick(item);
                } else {
                  if (item.filesToLoad) {
                    setSandboxFiles(item.filesToLoad);
                    setSelectedFile(item.filesToLoad[0]);
                  } else {
                    setSandboxFiles([]);
                    setSelectedFile(null);
                  }
                  setProjectName(item.workspace.split(' · ')[0]);
                  setViewState('files');
                  if (setActiveSidebar) {
                    setActiveSidebar('gemini');
                  }
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
