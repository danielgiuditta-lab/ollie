import React, { useState } from 'react';
import { LayoutGrid, Columns3, Plus, Folder, LogIn, ArrowRight, Mail, MessageSquare, AlertCircle, Clock, Info, CheckCircle2, Sparkles } from 'lucide-react';
import { LandingInput } from './LandingInput';
import { CoverSlide, CoverSlideItem } from './CoverSlide';
import { FilesList } from './FilesList';
import { SearchJourney } from './SearchJourney';
import { CreationJourney } from './CreationJourney';

import docsIcon from '../../assets/docs.png';
import sheetsIcon from '../../assets/sheets.png';
import slidesIcon from '../../assets/slides.png';
import formsIcon from '../../assets/forms.png';
import htmlIcon from '../../assets/html.png';
import imageIcon from '../../assets/image.png';

interface HomeLandingProps {
  accessToken: string | null;
  userProfile: any;
  onLogin: () => void;
  setViewState: (state: 'home' | 'null' | 'app' | 'files' | 'file_viewer' | 'projector' | 'public_projector' | 'ai_summary') => void;
  setSandboxFiles: (files: any[]) => void;
  setSelectedFile: (file: any) => void;
  setProjectName: (name: string) => void;
  handleSendMessage: (text: string, aiMode?: boolean, contextFiles?: any[]) => void;
  setDriveFolderId?: (id: string | null) => void;
  handleFolderIngest?: (file: any) => Promise<void>;
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
}

// Full set of suggested items shown in the screenshots with appropriate preview classifications
export const SUGGESTED_ITEMS: CoverSlideItem[] = [
  { 
    id: 'sug-marketing', 
    name: 'Marketing', 
    type: 'folder', 
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
    type: 'folder', 
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
    type: 'folder', 
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
    type: 'folder', 
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
    type: 'folder', 
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
    type: 'folder', 
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

export function HomeLanding({
  accessToken,
  userProfile,
  onLogin,
  setViewState,
  setSandboxFiles,
  setSelectedFile,
  setProjectName,
  handleSendMessage,
  setDriveFolderId,
  handleFolderIngest,
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
  onResetChat
}: HomeLandingProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bypassAuth, setBypassAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [digestData, setDigestData] = useState<any | null>(null);
  const [isDigestLoading, setIsDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!accessToken) {
      setDigestData(null);
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
          setDigestData(data);
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
  }, [accessToken]);

  // Fallback check to support bypassing authentication or showing login CTA
  const isLoggedIn = accessToken !== null || bypassAuth;

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
              const type = file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file';
              const isFolder = type === 'folder';
              
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
      if (item.type === 'folder') {
        if (setDriveFolderId) {
          setDriveFolderId(item.id);
        }
        setProjectName(item.name);
        if (handleFolderIngest) {
          await handleFolderIngest(item);
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
        <div className="max-w-md w-full bg-white dark:bg-[#1E1F22] border border-slate-200 dark:border-[#2B2D31] p-8 text-center flex flex-col items-center gap-6 relative shadow-none">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-3xl mb-2 shadow-none">
            🔑
          </div>
          <h2 className="text-3xl font-sans tracking-tight font-medium text-slate-800 dark:text-[#E3E3E3]">
            Sign In with Google
          </h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed max-w-sm mb-4">
            Connect your workspace to access real-time cloud data, fetch suggested folders, and run live interactive sandboxes.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              id="home-landing-login-btn"
              onClick={onLogin}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-none"
            >
              <LogIn size={16} /> Login to Drive
            </button>
            <button
              id="home-landing-mock-btn"
              onClick={() => setBypassAuth(true)}
              className="w-full h-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#2B2D31] dark:hover:bg-[#3E4042] text-slate-700 dark:text-[#E3E3E3] font-semibold text-sm transition-all duration-200 border border-slate-200 dark:border-[#3E4042] cursor-pointer"
            >
              Examine Mock Sandbox
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED/BYPASSED VIEW - Welcome Title + Search Input + Suggested Board Grid/List
  return (
    <div id="home-landing-content" className="absolute inset-0 w-full h-full flex flex-col items-center overflow-y-auto pt-16 px-10 pb-16 animate-in fade-in-30 slide-in-from-bottom-2 duration-300 text-center select-none bg-transparent">
      
      {/* Journey conditional rendering */}
      {journey === 'search' ? (
        <SearchJourney 
          onSubmit={(val, aiMode, contextFiles) => handleSendMessage(val, aiMode, contextFiles)}
          onChange={(val) => setSearchQuery(val)}
          onFileSelect={handleItemClick}
          theme={theme}
          accessToken={accessToken}
          recentItems={suggestedList}
        />
      ) : (
        <CreationJourney 
          onSubmit={(val, aiMode, contextFiles) => handleSendMessage(val, aiMode, contextFiles)}
          onChange={(val) => setSearchQuery(val)}
          onCreateArtifact={(type) => {
            if (onCreateArtifactProp) onCreateArtifactProp(type);
            else handleCreateArtifact(type);
          }}
          theme={theme}
        />
      )}

      {/* Workspace Agenda Dashboard */}
      {isLoggedIn && (
        <div className="w-full max-w-7xl mt-10 text-left select-none animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span 
              className="text-[24px] font-sans text-slate-800 dark:text-[#E3E3E3] font-normal tracking-tight"
              style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}
            >
              Today's Agenda
            </span>
            {isDigestLoading && (
              <span className="text-xs text-slate-400 animate-pulse flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                Syncing workspace...
              </span>
            )}
          </div>

          {isDigestLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-[#1E1F22] border border-[#E9EEF6] dark:border-[#2B2D31] rounded-3xl p-6 h-64 animate-pulse flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-[#2B2D31] rounded-full w-2/3"></div>
                    <div className="h-3 bg-slate-100 dark:bg-[#2B2D31] rounded-full w-5/6"></div>
                    <div className="h-3 bg-slate-100 dark:bg-[#2B2D31] rounded-full w-1/2"></div>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-[#2B2D31] rounded-full w-1/3"></div>
                </div>
              ))}
            </div>
          ) : digestError ? (
            <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 p-6 rounded-3xl text-center text-sm text-red-655 dark:text-red-400">
              {digestError}
            </div>
          ) : digestData ? (
            <div className="space-y-6">
              {/* Daily Summary banner */}
              <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/30 p-5 rounded-3xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100/60 dark:bg-blue-900/30 text-blue-650 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-1">Morning Overview</h4>
                  <p className="text-sm text-slate-650 dark:text-neutral-350 leading-relaxed font-medium">
                    {digestData.summary || "Your daily workspace activity summary."}
                  </p>
                </div>
              </div>

              {/* Three-column Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Column 1: Immediate Action */}
                <div className="bg-white dark:bg-[#1E1F22] border border-[#E9EEF6] dark:border-[#2B2D31] rounded-[24px] overflow-hidden flex flex-col h-[340px]">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#FCF8F7] dark:bg-[#2E201B] flex items-center justify-between shrink-0">
                    <span className="font-semibold text-sm text-red-800 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                      Immediate Attention
                    </span>
                    <span className="text-[10px] bg-red-100/60 dark:bg-red-950/40 text-red-800 dark:text-red-400 font-bold px-2 py-0.5 rounded-full">
                      {digestData.immediateActions?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                    {(!digestData.immediateActions || digestData.immediateActions.length === 0) ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                        All caught up!
                      </div>
                    ) : (
                      digestData.immediateActions.map((item: any) => (
                        <div key={item.id} className="p-3.5 bg-slate-50/50 dark:bg-[#2B2D31]/40 border border-slate-100 dark:border-[#2B2D31] rounded-2xl space-y-2 hover:border-red-200 dark:hover:border-red-900/60 transition-colors duration-150">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 shrink-0">
                              {item.type === 'email' ? <Mail size={14} className="text-slate-500" /> : item.type === 'comment' ? <MessageSquare size={14} className="text-slate-500" /> : <MessageSquare size={14} className="text-slate-500" />}
                            </span>
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-[#E3E3E3] leading-snug">
                                {item.description}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {item.source}
                              </p>
                            </div>
                          </div>
                          {item.action && (
                            <div className="text-[10px] text-red-855 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20 px-2.5 py-1 rounded-lg border border-red-100/40 dark:border-red-900/20 font-medium">
                              Action: {item.action}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 2: Follow-ups */}
                <div className="bg-white dark:bg-[#1E1F22] border border-[#E9EEF6] dark:border-[#2B2D31] rounded-[24px] overflow-hidden flex flex-col h-[340px]">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F3F6FC] dark:bg-[#1D253A] flex items-center justify-between shrink-0">
                    <span className="font-semibold text-sm text-indigo-800 dark:text-indigo-400 flex items-center gap-2">
                      <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
                      Follow-ups
                    </span>
                    <span className="text-[10px] bg-indigo-100/60 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                      {digestData.followUps?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                    {(!digestData.followUps || digestData.followUps.length === 0) ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                        No pending follow-ups.
                      </div>
                    ) : (
                      digestData.followUps.map((item: any) => (
                        <div key={item.id} className="p-3.5 bg-slate-50/50 dark:bg-[#2B2D31]/40 border border-slate-100 dark:border-[#2B2D31] rounded-2xl space-y-2 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-colors duration-150">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 shrink-0">
                              {item.type === 'email' ? <Mail size={14} className="text-slate-500" /> : item.type === 'comment' ? <MessageSquare size={14} className="text-slate-500" /> : <MessageSquare size={14} className="text-slate-500" />}
                            </span>
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-[#E3E3E3] leading-snug">
                                {item.description}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {item.source}
                              </p>
                            </div>
                          </div>
                          {item.action && (
                            <div className="text-[10px] text-indigo-855 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg border border-indigo-100/40 dark:border-indigo-900/20 font-medium">
                              Action: {item.action}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 3: Important Updates */}
                <div className="bg-white dark:bg-[#1E1F22] border border-[#E9EEF6] dark:border-[#2B2D31] rounded-[24px] overflow-hidden flex flex-col h-[340px]">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F4F4F5] dark:bg-[#252528] flex items-center justify-between shrink-0">
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-350 flex items-center gap-2">
                      <Info size={16} className="text-slate-500 dark:text-slate-400" />
                      Important Updates
                    </span>
                    <span className="text-[10px] bg-slate-200/60 dark:bg-neutral-850/60 text-slate-700 dark:text-slate-350 font-bold px-2 py-0.5 rounded-full">
                      {digestData.updates?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                    {(!digestData.updates || digestData.updates.length === 0) ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                        No general updates.
                      </div>
                    ) : (
                      digestData.updates.map((item: any) => (
                        <div key={item.id} className="p-3.5 bg-slate-50/50 dark:bg-[#2B2D31]/40 border border-slate-100 dark:border-[#2B2D31] rounded-2xl space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-150">
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 shrink-0">
                              {item.type === 'email' ? <Mail size={14} className="text-slate-500" /> : item.type === 'comment' ? <MessageSquare size={14} className="text-slate-500" /> : <MessageSquare size={14} className="text-slate-500" />}
                            </span>
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-[#E3E3E3] leading-snug">
                                {item.description}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {item.source}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Suggested Folders & Files Main Header Section */}
      <div className="w-full max-w-7xl mt-4 select-none">
        
        {/* Row Header with Segmented View Controller */}
        <div className="flex items-center justify-between mb-8 pb-3">
          <span 
            className="text-[24px] font-sans text-slate-800 dark:text-[#E3E3E3] font-normal tracking-tight"
            style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}
          >
            Jump back in
          </span>
          
          {/* Segmented Grid / Columns Control Tabs */}
          <div id="home-segmented-controller" className="flex bg-[#f0f4f9] dark:bg-[#2B2D31] p-1.5 rounded-full items-center gap-1.5">
            <button
               id="view-list-toggle"
               onClick={() => setViewMode('list')}
               aria-label="Columns view"
               className={`w-12 h-12 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none ${
                 viewMode === 'list'
                   ? 'bg-[#dbdee6] dark:bg-[#3E4042] text-[#1f2024] dark:text-white'
                   : 'text-[#5f6368] dark:text-[#A9ABB0] hover:bg-[#e1e5ed]/50 dark:hover:bg-white/5'
               }`}
            >
              <Columns3 size={20} className={viewMode === 'list' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            </button>
            <button
               id="view-grid-toggle"
               onClick={() => setViewMode('grid')}
               aria-label="Grid view"
               className={`w-12 h-12 rounded-full transition-colors duration-200 cursor-pointer flex items-center justify-center outline-none focus:outline-none focus-visible:outline-none ${
                 viewMode === 'grid'
                   ? 'bg-[#dbdee6] dark:bg-[#3E4042] text-[#1f2024] dark:text-white'
                   : 'text-[#5f6368] dark:text-[#A9ABB0] hover:bg-[#e1e5ed]/50 dark:hover:bg-white/5'
               }`}
            >
              <LayoutGrid size={20} className={viewMode === 'grid' ? 'stroke-[2.5]' : 'stroke-[2]'} />
            </button>
          </div>
        </div>

        {/* 1. GRID ACTION (Interactive CoverSlides aspect 4:3 block grid) */}
        {isLoadingDrive ? (
          <div className="w-full flex flex-col items-center justify-center py-16 bg-slate-50/50 border border-slate-150/50 rounded-3xl animate-pulse">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-slate-500 font-medium text-xs font-sans tracking-tight">Fetching real templates and structures from your Drive account...</p>
          </div>
        ) : (
          (() => {
            const filteredList = suggestedList;

            return viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                {filteredList.map((item) => (
                  <CoverSlide 
                    key={item.id} 
                    item={item} 
                    onClick={() => handleItemClick(item)} 
                    onRemove={(it) => onFileRemove && onFileRemove(it)}
                    sandboxUrl={sandboxUrl}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full rounded-3xl overflow-hidden bg-white dark:bg-[#1E1F22] border border-[#E9EEF6] dark:border-[#2B2D31] text-left select-none">
                <FilesList files={filteredList} onFileSelect={handleItemClick} onFileRemove={onFileRemove} userProfile={userProfile} theme={theme} />
              </div>
            );
          })()
        )}
      </div>

    </div>
  );
}
