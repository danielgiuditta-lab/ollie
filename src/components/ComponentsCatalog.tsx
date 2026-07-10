import React from 'react';

// Navigation Components
import { CanvasHeader } from './Navigation/CanvasHeader';
import { HeaderTabButton } from './Navigation/HeaderTabButton';
import { LeftNav } from './Navigation/LeftNav';
import { TopBar } from './Navigation/TopBar';

// Chat Components
import { BotMessage } from './Chat/BotMessage';
import { ChatSidebar } from './Chat/ChatSidebar';
import { Composer } from './Chat/Composer';
import { InferredTaskCard } from './Chat/InferredTaskCard';
import { StatusIndicator } from './Chat/StatusIndicator';
import { TaskCard } from './Chat/TaskCard';
import { ThinkingAnimation } from './Chat/ThinkingAnimation';
import { UserMessage } from './Chat/UserMessage';

// Canvas Components
import { AISummaryView } from './Canvas/AISummaryView';
import { AppView } from './Canvas/AppView';
import { CanvasMain } from './Canvas/CanvasMain';
import { CanvasSidebar } from './Canvas/CanvasSidebar';
import { CanvasTopBar } from './Canvas/CanvasTopBar';
import { CoverSlide } from './Canvas/CoverSlide';
import { CreationJourney } from './Canvas/CreationJourney';
import { FileViewer } from './Canvas/FileViewer';
import { FilesList } from './Canvas/FilesList';
import { HomeLanding } from './Canvas/HomeLanding';
import { LandingInput } from './Canvas/LandingInput';
import { NativeViewer } from './Canvas/NativeViewer';
import { NullState } from './Canvas/NullState';
import { PeerCursors } from './Canvas/PeerCursors';
import { SearchJourney } from './Canvas/SearchJourney';
import { TypeAhead } from './Canvas/TypeAhead';

// Shared Components
import { AIModeButton } from './Shared/AIModeButton';
import { Button } from './Shared/Button';
import { CircularProgressIndicator } from './Shared/CircularProgressIndicator';
import { ContextMenu } from './Shared/ContextMenu';
import { FileIcon } from './Shared/FileIcon';
import { FileRow } from './Shared/FileRow';
import { FolderRow } from './Shared/FolderRow';
import { HeroTitle } from './Shared/HeroTitle';
import { IconButton } from './Shared/IconButton';
import { NullChat } from './Shared/NullChat';
import { NullTitle } from './Shared/NullTitle';
import { RainbowRimOverlay } from './Shared/RainbowRimOverlay';
import { ShapeLoader } from './Shared/ShapeLoader';
import { SourceChip } from './Shared/SourceChip';

export function ComponentsCatalog() {
  const mockFileHtml = { id: 'f1', name: 'index.html', mimeType: 'text/html', content: '<div style="padding:16px;font-family:sans-serif;"><h1>Preview HTML</h1></div>' };
  const mockFileDoc = { id: 'f2', name: 'proposal.doc', mimeType: 'application/vnd.google-apps.document', content: '# Project Proposal\n\nThis is sample markdown text for preview.' };
  const mockFileSheet = { id: 'f3', name: 'data.csv', mimeType: 'application/vnd.google-apps.spreadsheet', content: 'Item,Price\nApple,$1\nBanana,$2' };
  const mockFiles = [mockFileHtml, mockFileDoc, mockFileSheet];
  const mockPeers = { 'user1': { id: 'user1', name: 'Gentle Giraffe', color: '#3b82f6', x: 10, y: 10, status: 'active' as const } };
  const mockMessages = [
    { role: 'user', text: 'Hello!' },
    { role: 'assistant', text: 'Hi! How can I assist you today?' }
  ];

  const renderItem = (name: string, component: React.ReactNode) => (
    <div key={name} className="flex flex-col">
      <div className="bg-gray-100 p-6 rounded flex items-center justify-center overflow-auto min-h-[160px] max-h-[360px] w-full">
        {component}
      </div>
      <div className="mt-2 text-sm text-gray-700">{name}</div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-gray-900 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-8">Components</h1>

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderItem('CanvasHeader', <div className="w-full"><CanvasHeader viewState="app" projectName="Sample Workspace" onHomeClick={() => {}} onCloseWorkspace={() => {}} /></div>)}
          {renderItem('HeaderTabButton', <div className="flex gap-2"><HeaderTabButton tabType="gemini" isSelected={true} onClick={() => {}} icon={<span>✦</span>} /><HeaderTabButton tabType="comments" isSelected={false} onClick={() => {}} icon={<span>💬</span>} /></div>)}
          {renderItem('LeftNav', <div className="h-[200px] w-[80px] relative"><LeftNav /></div>)}
          {renderItem('TopBar', <div className="w-full"><TopBar projectName="Sample Workspace" syncStatus="synced" activeSidebar="gemini" setActiveSidebar={() => {}} /></div>)}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Chat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderItem('BotMessage', <BotMessage text="Hello! I am ready to build your application." />)}
          {renderItem('ChatSidebar', <div className="w-full h-[300px] relative overflow-hidden"><ChatSidebar messages={mockMessages} onSendMessage={() => {}} isLoading={false} /></div>)}
          {renderItem('Composer', <div className="w-full"><Composer disabled={false} onSend={() => {}} placeholder="Type a message..." /></div>)}
          {renderItem('InferredTaskCard', <div className="w-full"><InferredTaskCard item={{ id: '1', title: 'Update documentation', description: 'Review readme', workspace: 'Docs', sourceName: 'readme.md', sourceMimeType: 'text/markdown', personName: 'Dan', personAvatar: '', status: 'working' }} getFileIcon={() => ''} onClick={() => {}} /></div>)}
          {renderItem('StatusIndicator', <div className="flex gap-4 items-center"><StatusIndicator status="working" /><StatusIndicator status="done" /><StatusIndicator status="blocked" /></div>)}
          {renderItem('TaskCard', <div className="w-full"><TaskCard status="working" title="Building App" stage="Compiling JSX..." steps={[{ type: 'thought', text: 'Thinking...' }]} fullText="Running preview..." /></div>)}
          {renderItem('ThinkingAnimation', <ThinkingAnimation />)}
          {renderItem('UserMessage', <UserMessage text="Please add a dark mode toggle to the dashboard." />)}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Canvas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderItem('AISummaryView', <div className="w-full h-[280px] relative overflow-hidden"><AISummaryView sources={mockFiles} messages={mockMessages} onSendMessage={() => {}} isLoading={false} onSnap={() => {}} /></div>)}
          {renderItem('AppView', <div className="w-full h-[180px]"><AppView files={[mockFileHtml]} selectedFile={mockFileHtml} /></div>)}
          {renderItem('CanvasMain', <div className="w-full h-[180px]"><CanvasMain viewState="home" setViewState={() => {}}><div className="p-4 text-center text-gray-500">Canvas Main Content</div></CanvasMain></div>)}
          {renderItem('CanvasSidebar', <div className="w-full h-[220px]"><CanvasSidebar files={mockFiles} selectedFile={mockFileHtml} onFileSelect={() => {}} indexFileSelected={true} activeSidebar={null} currentPath={[]} setCurrentPath={() => {}} /></div>)}
          {renderItem('CanvasTopBar', <div className="w-full"><CanvasTopBar file={mockFileHtml} viewMode="preview" onViewModeChange={() => {}} onClose={() => {}} onExpand={() => {}} /></div>)}
          {renderItem('CoverSlide', <div className="w-[260px]"><CoverSlide item={{ id: '1', name: 'Sample Slide Deck', type: 'space', previewType: 'marketing', filesToLoad: [mockFileHtml] }} onClick={() => {}} /></div>)}
          {renderItem('CreationJourney', <div className="w-full"><CreationJourney /></div>)}
          {renderItem('FileViewer', <div className="w-full h-[220px]"><FileViewer selectedFile={mockFileDoc} files={mockFiles} onClose={() => {}} /></div>)}
          {renderItem('FilesList', <div className="w-full h-[180px]"><FilesList files={mockFiles} onFileSelect={() => {}} /></div>)}
          {renderItem('HomeLanding', <div className="w-full h-[280px] overflow-hidden relative"><HomeLanding accessToken={null} userProfile={null} onLogin={() => {}} setViewState={() => {}} setSandboxFiles={() => {}} setSelectedFile={() => {}} setProjectName={() => {}} handleSendMessage={() => {}} suggestedList={[]} setSuggestedList={() => {}} isLoadingDrive={false} setIsLoadingDrive={() => {}} todoItems={[]} setTodoItems={() => {}} onCreateArtifact={() => {}} /></div>)}
          {renderItem('LandingInput', <div className="w-full"><LandingInput onSubmit={() => {}} /></div>)}
          {renderItem('NativeViewer', <div className="w-full h-[180px] overflow-hidden"><NativeViewer file={mockFileDoc} hideHeader={true} /></div>)}
          {renderItem('NullState', <div className="w-full h-[260px] overflow-hidden"><NullState /></div>)}
          {renderItem('PeerCursors', <div className="w-full h-[80px] relative"><PeerCursors peers={mockPeers} /></div>)}
          {renderItem('SearchJourney', <div className="w-full"><SearchJourney /></div>)}
          {renderItem('TypeAhead', <div className="w-full"><TypeAhead filteredRecentFiles={mockFiles} apiResults={[]} filteredRecentPeople={[]} isSearchingApi={false} onAddContext={() => {}} /></div>)}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Shared</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderItem('AIModeButton', <div className="flex gap-4 items-center"><AIModeButton aiMode={true} onToggle={() => {}} /><AIModeButton aiMode={false} onToggle={() => {}} /></div>)}
          {renderItem('Button', <div className="flex gap-2"><Button variant="primary">Primary</Button><Button variant="secondary">Secondary</Button></div>)}
          {renderItem('CircularProgressIndicator', <div className="flex gap-4 items-center"><CircularProgressIndicator isIndeterminate size={32} /><CircularProgressIndicator value={75} size={32} showLabel /></div>)}
          {renderItem('ContextMenu', <div className="relative h-[60px] w-[120px]"><ContextMenu x={10} y={10} onClose={() => {}} onRemove={() => {}} label="Delete Item" /></div>)}
          {renderItem('FileIcon', <div className="flex gap-3 items-center"><FileIcon fileName="index.html" /><FileIcon fileName="doc.doc" /><FileIcon fileName="sheet.csv" /></div>)}
          {renderItem('FileRow', <div className="w-full"><FileRow name="proposal.doc" subtitle="Modified today" /></div>)}
          {renderItem('FolderRow', <div className="w-full"><FolderRow name="Project Assets" /></div>)}
          {renderItem('HeroTitle', <HeroTitle>Hero Title</HeroTitle>)}
          {renderItem('IconButton', <div className="flex gap-2"><IconButton variant="header">✦</IconButton><IconButton variant="card">⚙</IconButton></div>)}
          {renderItem('NullChat', <div className="h-[120px] w-full"><NullChat headline="No messages yet" metaline="Start typing below" /></div>)}
          {renderItem('NullTitle', <NullTitle>Null Title</NullTitle>)}
          {renderItem('RainbowRimOverlay', <div className="relative w-[150px] h-[60px] bg-white rounded flex items-center justify-center shadow-xs"><RainbowRimOverlay active={true} /><span>Rainbow Rim</span></div>)}
          {renderItem('ShapeLoader', <div className="h-[80px] w-[80px] relative flex items-center justify-center"><ShapeLoader /></div>)}
          {renderItem('SourceChip', <div className="flex gap-2"><SourceChip href="#1">index.html</SourceChip><SourceChip href="#2">styles.css</SourceChip></div>)}
        </div>
      </section>
    </div>
  );
}
