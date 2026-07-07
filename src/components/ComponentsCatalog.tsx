import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Layers, 
  MessageSquare, 
  Home, 
  Grid, 
  Sliders, 
  Compass, 
  Moon, 
  Sun, 
  Sparkles, 
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

// Shared Components
import { Button } from './Shared/Button';
import { IconButton } from './Shared/IconButton';
import { CircularProgressIndicator } from './Shared/CircularProgressIndicator';
import { HeroTitle } from './Shared/HeroTitle';
import { NullTitle } from './Shared/NullTitle';

// Navigation Components
import { LeftNav } from './Navigation/LeftNav';
import { HeaderTabButton } from './Navigation/HeaderTabButton';
import { TopBar } from './Navigation/TopBar';

// Landing Page Components
import { LandingInput } from './Canvas/LandingInput';
import { CoverSlide } from './Canvas/CoverSlide';

// Chat Components
import { UserMessage } from './Chat/UserMessage';
import { BotMessage } from './Chat/BotMessage';
import { ThinkingAnimation } from './Chat/ThinkingAnimation';
import { StatusIndicator } from './Chat/StatusIndicator';
import { TaskCard } from './Chat/TaskCard';

// Canvas Components
import { CanvasTopBar } from './Canvas/CanvasTopBar';
import { FilesList } from './Canvas/FilesList';
import { CanvasSidebar } from './Canvas/CanvasSidebar';
import { NativeViewer } from './Canvas/NativeViewer';

export function ComponentsCatalog() {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab2] = useState<'gemini' | 'comments' | 'history'>('gemini');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = (localStorage.getItem('manual-theme') || localStorage.getItem('app-theme')) as 'light' | 'dark' | null;
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      return 'dark';
    }
    document.documentElement.classList.remove('dark');
    return 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('manual-theme', nextTheme);
    localStorage.setItem('app-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mock data for components
  const mockFileHTML = {
    id: 'f1',
    name: 'index.html',
    mimeType: 'text/html',
    content: `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 p-6 flex flex-col items-center justify-center">
  <h1 class="text-2xl font-bold text-slate-800">Hello Universe</h1>
</body>
</html>`
  };

  const mockFileDoc = {
    id: 'f2',
    name: 'proposal.doc',
    mimeType: 'application/vnd.google-apps.document',
    content: `# Brand Identity Proposal
    
We focus entirely on durable minimalist items with rich organic compositions to deliver superior sustainability index guidelines.`
  };

  const mockFileSheet = {
    id: 'f3',
    name: 'inventory.csv',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    content: `Product,Cost,Stock
Rubber Bone,5.50,1400
Rope Toy,3.25,980
Bio Dish,12.00,450`
  };

  const mockCoverSlideItem = {
    id: 'cover-marketing',
    name: 'Q3 Marketing Launch Campaign',
    type: 'folder' as const,
    previewType: 'marketing' as const,
    filesToLoad: [mockFileHTML]
  };

  const mockFilesListFiles = [
    { id: '1', name: 'proposal.doc', mimeType: 'application/vnd.google-apps.document', size: '2542', modifiedTime: new Date().toISOString() },
    { id: '2', name: 'data_points.csv', mimeType: 'application/vnd.google-apps.spreadsheet', size: '7823', modifiedTime: new Date().toISOString() },
    { id: '3', name: 'index.html', mimeType: 'text/html', size: '1024', modifiedTime: new Date().toISOString() }
  ];

  const mockTimelineSteps = [
    { type: 'thought', text: '- Setting up the sandbox environment' },
    { type: 'tool_call', function_call: { name: 'edit_file', args: { TargetFile: 'index.html' } } },
    { type: 'model_output' }
  ];

  return (
    <div className="w-full min-h-screen bg-[#F6F8FC] dark:bg-[#0B0B0C] text-slate-800 dark:text-[#E3E3E3] select-text overflow-y-auto transition-colors duration-250">
      {/* Catalog Header Accent Banner */}
      <div className="bg-slate-900 text-white py-6 px-10 border-b border-slate-800 relative shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { window.location.href = '/'; }}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Layers className="text-blue-400 shrink-0" size={24} />
                <h1 className="text-2xl font-bold font-sans tracking-tight">App Component Catalog</h1>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Immaculate components rendered in actual sizes. Resize window to witness fluid reflowing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer border border-slate-700/60"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <div className="flex items-center gap-2 bg-slate-850 py-2 px-4 rounded-2xl border border-slate-700/60 font-mono text-xs text-white">
              <Smartphone size={14} className="text-blue-400" />
              <span className="text-slate-400">Viewport:</span>
              <span className="font-bold">{viewportWidth}px</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-16">
        
        {/* ==================== LANDING PAGE COMPONENTS ==================== */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-sm">LP</div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Landing Page Components</h2>
          </div>
          
          <div className="flex flex-wrap gap-6 items-start">
            {/* Component: LandingInput */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-teal-600 uppercase tracking-wider mb-3 block">LandingInput</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden w-[600px] max-w-full">
                <LandingInput 
                  onSubmit={(val) => alert(`Keyword submitted: ${val}`)}
                  onCreateArtifact={(type) => alert(`Create artifact triggered: ${type}`)}
                />
              </div>
            </div>

            {/* Component: CoverSlide */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-teal-600 uppercase tracking-wider mb-3 block">CoverSlide</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden w-[300px] max-w-full">
                <CoverSlide 
                  item={mockCoverSlideItem} 
                  onClick={() => alert('CoverSlide clicked!')}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==================== CHAT COMPONENTS ==================== */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-sm">CH</div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Chat & Feed Components</h2>
          </div>

          <div className="flex flex-wrap gap-6 items-start">
            {/* Component: UserMessage */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-indigo-600 uppercase tracking-wider mb-3 block">UserMessage</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden max-w-[340px] flex flex-col">
                <UserMessage text="Please add a responsive conversion chart to the pricing workspace." />
              </div>
            </div>

            {/* Component: BotMessage */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-indigo-600 uppercase tracking-wider mb-3 block">BotMessage</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden max-w-[340px]">
                <BotMessage text="Assembling workspace requirements. I have completed deploying natural-rubber chews catalog." />
              </div>
            </div>

            {/* Component: ThinkingAnimation */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full text-center">
              <span className="text-xxs font-mono font-bold text-indigo-600 uppercase tracking-wider mb-3 block">ThinkingAnimation</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden flex items-center justify-center w-[160px] h-[100px]">
                <ThinkingAnimation />
              </div>
            </div>

            {/* Component: StatusIndicator */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-indigo-600 uppercase tracking-wider mb-3 block">StatusIndicator</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden flex items-center gap-6 h-[100px]">
                <div className="flex flex-col items-center gap-1">
                  <StatusIndicator status="working" />
                  <span className="text-[10px] font-mono text-slate-400">working</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <StatusIndicator status="done" />
                  <span className="text-[10px] font-mono text-slate-400">done</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <StatusIndicator status="blocked" />
                  <span className="text-[10px] font-mono text-slate-400">blocked</span>
                </div>
              </div>
            </div>

            {/* Component: TaskCard */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-indigo-600 uppercase tracking-wider mb-3 block">TaskCard</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden w-[380px] max-w-full">
                <TaskCard 
                  status="working"
                  title="Executing Code Artifact Adjustments"
                  stage="Hot reloading workspace canvas..."
                  steps={mockTimelineSteps}
                  fullText="Analyzing parameters and launching local preview container..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==================== NAVIGATION COMPONENTS ==================== */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-sm">NV</div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Navigation Components</h2>
          </div>

          <div className="flex flex-wrap gap-6 items-start">
            {/* Component: HeaderTabButton */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-purple-600 uppercase tracking-wider mb-3 block">HeaderTabButton</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden flex items-center gap-4 h-[100px]">
                <HeaderTabButton 
                  tabType="gemini"
                  isSelected={activeTab === 'gemini'}
                  onClick={() => setActiveTab2('gemini')}
                  icon={
                    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                      <path d="M14 28C14 26.0633 13.6267 24.2433 12.88 22.54C12.1567 20.8367 11.165 19.355 9.905 18.095C8.645 16.835 7.16333 15.8433 5.46 15.12C3.75667 14.3733 1.93667 14 0 14C1.93667 14 3.75667 13.6383 5.46 12.915H14Z" fill="currentColor"/>
                    </svg>
                  }
                />
                <HeaderTabButton 
                  tabType="comments"
                  isSelected={activeTab === 'comments'}
                  onClick={() => setActiveTab2('comments')}
                  icon={
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Component: LeftNav */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-purple-600 uppercase tracking-wider mb-3 block">LeftNav</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden w-[90px] h-[180px] flex items-center justify-center">
                <LeftNav />
              </div>
            </div>

            {/* Component: TopBar */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-purple-600 uppercase tracking-wider mb-3 block">TopBar</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden w-[650px] max-w-full">
                <TopBar 
                  projectName="Sustainable Pet Co Workspace" 
                  syncStatus="synced"
                  userProfile={{ picture: '', email: 'developer@google.com', name: 'G-Developer' }}
                  activeSidebar={activeTab}
                  setActiveSidebar={setActiveTab2}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==================== CANVAS COMPONENTS ==================== */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold text-sm">CV</div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Canvas & Workspace Components</h2>
          </div>

          <div className="flex flex-wrap gap-6 items-start">
            {/* Component: CanvasTopBar */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-pink-600 uppercase tracking-wider mb-3 block">CanvasTopBar</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden w-[550px] max-w-full h-[90px] relative">
                <CanvasTopBar 
                  file={mockFileHTML} 
                  viewMode="preview" 
                  onViewModeChange={() => {}} 
                  onClose={() => {}} 
                  onExpand={() => {}} 
                />
              </div>
            </div>

            {/* Component: CanvasSidebar */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-pink-600 uppercase tracking-wider mb-3 block">CanvasSidebar</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden w-[240px] max-w-full h-[220px]">
                <CanvasSidebar 
                  files={[mockFileDoc, mockFileSheet, mockFileHTML]} 
                  selectedFile={mockFileHTML} 
                  onFileSelect={() => {}} 
                  indexFileSelected={true} 
                  activeSidebar={null}
                  currentPath={[]}
                  setCurrentPath={() => {}}
                />
              </div>
            </div>

            {/* Component: FilesList */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-pink-600 uppercase tracking-wider mb-3 block">FilesList</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden w-[450px] max-w-full h-[220px] overflow-y-auto">
                <FilesList files={mockFilesListFiles} onFileSelect={() => {}} />
              </div>
            </div>

            {/* Component: NativeViewer (Document Simulation) */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-pink-600 uppercase tracking-wider mb-3 block">NativeViewer Doc Preview</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl overflow-hidden w-[550px] max-w-full h-[320px] overflow-y-auto">
                <NativeViewer file={mockFileDoc} hideHeader={true} />
              </div>
            </div>

            {/* Component: NativeViewer (Spreadsheet Simulation) */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-pink-600 uppercase tracking-wider mb-3 block">NativeViewer Spreadsheet Preview</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl overflow-hidden w-[550px] max-w-full h-[280px]">
                <NativeViewer file={mockFileSheet} hideHeader={true} />
              </div>
            </div>
          </div>
        </section>

        {/* ==================== SHARED & UTILITY COMPONENTS ==================== */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-sm">UT</div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Shared & Utility Components</h2>
          </div>

          <div className="flex flex-wrap gap-6 items-start">
            {/* Component: Button */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-orange-600 uppercase tracking-wider mb-3 block">Button (Dark / Light themes)</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden flex flex-wrap gap-3 items-center">
                <Button variant="primary">Primary Light</Button>
                <Button variant="secondary" theme="light">Secondary Light</Button>
                <Button variant="secondary" theme="dark">Secondary Dark</Button>
              </div>
            </div>

            {/* Component: IconButton */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-orange-600 uppercase tracking-wider mb-3 block">IconButton (Header / Card / Borderless)</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden flex flex-wrap gap-4 items-center">
                <IconButton variant="header">
                  <Compass size={18} />
                </IconButton>
                <IconButton variant="card">
                  <Sliders size={18} />
                </IconButton>
                <IconButton variant="borderless">
                  <Grid size={18} />
                </IconButton>
              </div>
            </div>

            {/* Component: CircularProgressIndicator */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-orange-600 uppercase tracking-wider mb-3 block">CircularProgressIndicator</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden flex flex-wrap gap-4 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <CircularProgressIndicator isIndeterminate size={32} strokeWidth={3} className="text-blue-500" />
                  <span className="text-[10px] font-mono text-slate-400">indeterminate</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <CircularProgressIndicator value={65} size={32} strokeWidth={3} className="text-emerald-500" showLabel />
                  <span className="text-[10px] font-mono text-slate-400">determinate (65%)</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <CircularProgressIndicator isIndeterminate size={32} strokeWidth={3} className="text-purple-600 animate-pulse" variant="gemini" />
                  <span className="text-[10px] font-mono text-slate-400">gemini layout</span>
                </div>
              </div>
            </div>

            {/* Component: HeroTitle */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-orange-600 uppercase tracking-wider mb-3 block">HeroTitle</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden w-[220px]">
                <HeroTitle>Brand Campaign</HeroTitle>
              </div>
            </div>

            {/* Component: NullTitle */}
            <div className="flex flex-col rounded-2xl bg-white dark:bg-[#1E1F22] shadow-xs p-5 max-w-full">
              <span className="text-xxs font-mono font-bold text-orange-600 uppercase tracking-wider mb-3 block">NullTitle</span>
              <div className="bg-slate-50 dark:bg-[#2B2D31] rounded-xl p-4 overflow-hidden w-[220px]">
                <NullTitle>Connect Workspace</NullTitle>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
