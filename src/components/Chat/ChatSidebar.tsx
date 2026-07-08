import React, { useState } from 'react';
import { BotMessage } from './BotMessage';
import { UserMessage } from './UserMessage';
import { Composer } from './Composer';
import { HeroTitle } from '../Shared/HeroTitle';
import { NullTitle } from '../Shared/NullTitle';
import { IconButton } from '../Shared/IconButton';
import { TaskCard } from './TaskCard';
import { MessageSquare, History, FileText, ChevronRight, Activity, Smile, X, LayoutDashboard, CheckCircle2, Presentation, FolderKanban, Sparkles } from 'lucide-react';

interface ChatSidebarProps {
  messages: any[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  variant?: 'gemini' | 'comments' | 'history';
  onClose?: () => void;
  theme?: 'light' | 'dark';
  onCreateArtifact?: (type: 'doc' | 'slide' | 'sheet' | 'pix' | 'site' | 'upload') => void;
  currentTask?: string;
  isAiSummarySnapped?: boolean;
  onUnsnapAiSummary?: () => void;
  onSourceClick?: (fileId: string) => void;
  sources?: any[];
  fileCount?: number;
  onApplyMoves?: (msgIndex: number) => void;
  onDoDifferently?: (msgIndex: number) => void;
  isOrganizingFiles?: boolean;
  chatDockPosition?: 'side' | 'bottom';
  onChangeChatDockPosition?: (pos: 'side' | 'bottom') => void;
  onFinalizeSpace?: (name: string, selectedPeople: any[]) => Promise<void> | void;
  chatModel?: 'A' | 'B';
  onNewChat?: () => void;
  isLoggedIn?: boolean;
  onLogin?: () => void;
  onBypassAuth?: () => void;
  projectName?: string;
  todoItems?: any[];
  isNewSpaceCreation?: boolean;
  spaceMode?: 'choice' | 'tracking' | 'tool';
  onSelectSpaceMode?: (mode: 'tracking' | 'tool') => void;
  activeSpaceId?: string | null;
}

export function ChatSidebar({ 
  messages, 
  onSendMessage, 
  isLoading, 
  variant = 'gemini', 
  onClose,
  theme = 'light',
  onCreateArtifact,
  currentTask = "Building a project",
  isAiSummarySnapped = false,
  onUnsnapAiSummary,
  onSourceClick,
  sources = [],
  fileCount = 0,
  onApplyMoves,
  onDoDifferently,
  isOrganizingFiles = false,
  chatDockPosition = 'side',
  onChangeChatDockPosition,
  onFinalizeSpace,
  chatModel = 'A',
  onNewChat,
  isLoggedIn = false,
  onLogin,
  onBypassAuth,
  projectName = '',
  todoItems = [],
  isNewSpaceCreation = false,
  spaceMode,
  onSelectSpaceMode,
  activeSpaceId
}: ChatSidebarProps) {
  const isHome = !projectName || projectName === 'Home Dashboard' || projectName === 'Home';

  const getSuggestions = () => {
    if (activeSpaceId && activeSpaceId.startsWith('space-creation-')) {
      return [];
    }

    if (!isHome && isNewSpaceCreation && (!spaceMode || spaceMode === 'choice')) {
      return [
        { label: "Let Ollie track your work", prompt: "Let Ollie track your work", mode: 'tracking' as const },
        { label: "Build a custom tool with Ollie", prompt: "Build a custom tool with Ollie", mode: 'tool' as const }
      ];
    }

    const list = todoItems || [];
    
    const getPillLabel = (title: string) => {
      const lower = title.toLowerCase();
      if (lower.includes('brand') || lower.includes('guidelines')) return 'Review Brand Guidelines';
      if (lower.includes('marketing') || lower.includes('brief')) return 'Add Marketing Design Strategy';
      if (lower.includes('pricing') || lower.includes('proposal')) return 'Draft Pricing Proposal Strategy';
      if (lower.includes('sales') || lower.includes('performance')) return 'Update Sales Tracker';
      if (lower.includes('operations') || lower.includes('leads')) return 'Update Operations Leads';
      return title.length > 40 ? title.substring(0, 40) + '...' : title;
    };

    let filtered = [];
    if (isHome) {
      filtered = list.filter(item => item.involvesMe !== false);
    } else {
      const currentProject = (projectName || '').toLowerCase().trim();
      filtered = list.filter(item => {
        const itemWorkspace = (item.workspace || '').toLowerCase().trim();
        return itemWorkspace === currentProject || currentProject.includes(itemWorkspace) || itemWorkspace.includes(currentProject);
      });
    }

    if (filtered.length > 0) {
      return filtered.map(item => ({
        label: getPillLabel(item.title),
        prompt: `Help me with: ${item.title}`
      }));
    }

    // Fallback default suggestions
    return [
      { label: "Make an interactive dashboard", prompt: "Make an interactive dashboard" },
      { label: "Make a project tracker", prompt: "Make a project tracker" },
      { label: "Make an interactive presentation", prompt: "Make an interactive presentation" },
      ...(fileCount > 3 ? [{ label: "Organize files", prompt: "Organize files" }] : [])
    ];
  };

  const suggestions = getSuggestions();

  const getTaskIcon = (title: string) => {
    if (title === "Let Ollie track your work") {
      return <span className="text-lg shrink-0 select-none">🛡️</span>;
    }
    if (title === "Build a custom tool with Ollie") {
      return <span className="text-lg shrink-0 select-none">⚡</span>;
    }
    const lower = title.toLowerCase();
    if (lower.includes('dashboard') || lower.includes('visual')) {
      return <LayoutDashboard size={20} className="shrink-0 text-slate-800 dark:text-neutral-200" />;
    }
    if (lower.includes('tracker') || lower.includes('sales') || lower.includes('guidelines') || lower.includes('review') || lower.includes('brief') || lower.includes('marketing')) {
      return <CheckCircle2 size={20} className="shrink-0 text-slate-800 dark:text-neutral-200" />;
    }
    if (lower.includes('presentation') || lower.includes('proposal') || lower.includes('strategy')) {
      return <Presentation size={20} className="shrink-0 text-slate-800 dark:text-neutral-200" />;
    }
    return <FolderKanban size={20} className="shrink-0 text-slate-800 dark:text-neutral-200" />;
  };

  // Local state for comment stream prototyping
  const [localComments, setLocalComments] = useState<any[]>([]);

  const handlePostComment = (text: string) => {
    setLocalComments(prev => [
      ...prev,
      { author: "Daniel (You)", text, time: "Just now" }
    ]);
  };

  // Generate a dynamic list of activity logs based on the active session
  const getActivityTimeline = () => {
    const baseEvents: any[] = [];

    // Append user prompts as activity points
    messages.forEach((msg, idx) => {
      if (msg.role === 'user') {
        baseEvents.unshift({
          title: "Prompt Sent",
          time: `${messages.length - idx}m ago`,
          desc: `User: "${msg.text.length > 40 ? msg.text.substring(0, 40) + '...' : msg.text}"`,
          type: "prompt"
        });
      }
    });

    return baseEvents;
  };

  const [width, setWidth] = useState<number>(400);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const newWidth = Math.max(280, Math.min(800, startWidth + deltaX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('is-resizing');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.classList.add('is-resizing');
  };

  const getTitle = () => {
    switch (variant) {
      case 'comments': return "Comments";
      case 'history': return "History";
      default: return "Chat";
    }
  };

  const isBottom = chatDockPosition === 'bottom';

  return (
    <div className={`flex ${isBottom ? 'flex-col w-full h-full' : 'items-center h-full shrink-0'} relative z-10`}>
      {!isBottom && (
        <div 
          className="sidebar-resizer-grabber -ml-4" 
          onMouseDown={startResize} 
          title="Drag to resize chat panel"
        />
      )}
      <div 
        style={isBottom ? undefined : { width: `${width}px` }}
        className={`h-full w-full flex flex-col pt-0 shrink-0 ${
          theme === 'dark' 
            ? 'bg-[#1E1F22] border-r border-[#2B2D31]' 
            : 'bg-white border-r border-slate-200'
        } rounded-none relative overflow-hidden z-10 spring-transition shadow-none`}
      >
        {/* Header Panel */}
        <div className="flex items-center justify-between px-6 w-full h-[64px] shrink-0 border-b border-transparent">
          <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{getTitle()}</h2>
          <div className="flex items-center gap-1.5">
            {chatModel === 'B' && onNewChat && variant === 'gemini' && (
              <IconButton 
                variant="card" 
                onClick={onNewChat} 
                title="New Chat"
                theme={theme}
              >
                <span className="material-symbols-rounded text-[18px]">add</span>
              </IconButton>
            )}
            {onChangeChatDockPosition && (
              <IconButton 
                variant="card" 
                onClick={() => onChangeChatDockPosition(isBottom ? 'side' : 'bottom')} 
                title={isBottom ? "Dock to side" : "Dock to bottom"}
                theme={theme}
              >
                <span className="material-symbols-rounded text-[18px]">
                  {isBottom ? 'grid_layout_side' : 'dock_to_bottom'}
                </span>
              </IconButton>
            )}
            {isAiSummarySnapped && onUnsnapAiSummary && (
              <IconButton 
                variant="card" 
                onClick={onUnsnapAiSummary} 
                title="Dock to bottom (AI Summary view)"
                theme={theme}
              >
                <span className="material-symbols-rounded text-[18px]">dock_to_bottom</span>
              </IconButton>
            )}
            {onClose && (
              <IconButton 
                variant="card" 
                onClick={isAiSummarySnapped && onUnsnapAiSummary ? onUnsnapAiSummary : onClose} 
                title="Hide Sidebar"
                theme={theme}
              >
                <X size={18} className={theme === 'dark' ? 'text-white' : 'text-[#5F6368]'} />
              </IconButton>
            )}
          </div>
        </div>

        {/* Perfectly Spaced & Aligned Start Building Overlay */}
        {messages.length === 0 && variant === 'gemini' && (
          <div className="absolute inset-0 flex flex-col items-center px-6 pt-0 pb-[16px] pointer-events-none select-none z-15">
            {!isLoggedIn ? (
              <>
                <div className="w-full h-[33.33%] flex items-center justify-center shrink-0">
                  <NullTitle theme={theme}>Sign in with Google</NullTitle>
                </div>
                <div className="flex-1 flex flex-col gap-2.5 w-full items-start pointer-events-none animate-fade-in-up min-h-0 px-2" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center gap-3 justify-center w-full pointer-events-auto mt-4">
                    <button
                      onClick={onLogin}
                      className="h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-200 cursor-pointer shadow-none border-none outline-none flex items-center justify-center"
                    >
                      Login
                    </button>
                    <button
                      onClick={onBypassAuth}
                      className="h-10 px-6 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#2B2D31] dark:hover:bg-[#3E4042] text-slate-700 dark:text-[#E3E3E3] font-semibold text-sm transition-all duration-200 border-none cursor-pointer"
                    >
                      Mock Data
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Centered Title top block matching canvas h-[33.33%] */}
                <div className="w-full h-[33.33%] flex flex-col items-center justify-center shrink-0 gap-2 text-center">
                  {activeSpaceId && activeSpaceId.startsWith('space-creation-') ? (
                    <>
                      <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-sans">
                        What's this Space about?
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-neutral-400">
                        Tell me the what your trying to accomplish in this Space
                      </p>
                    </>
                  ) : (
                    <NullTitle theme={theme}>
                      {isHome ? 'How can I help?' : `How can I help on ${projectName || 'this space'}?`}
                    </NullTitle>
                  )}
                </div>

                {/* Suggestions list */}
                <div className="flex-1 flex flex-col gap-2.5 w-full items-start pointer-events-none animate-fade-in-up min-h-0 px-2" style={{ animationDelay: '200ms' }}>
                  {suggestions.map((pill, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        if ((pill as any).mode && onSelectSpaceMode) {
                          onSelectSpaceMode((pill as any).mode);
                        } else {
                          onSendMessage(pill.prompt);
                        }
                      }}
                      className="w-fit max-w-full flex items-center gap-3 py-3 px-5 rounded-full transition-colors duration-250 text-left cursor-pointer border-none shadow-none pointer-events-auto bg-f8fafd hover:bg-f0f4f9"
                    >
                      {getTaskIcon(pill.prompt)}
                      <span 
                        className="text-sm font-medium text-slate-800 dark:text-neutral-200 truncate"
                        style={{ fontFamily: '"Google Sans Flex", "Google Sans", "Product Sans", "Inter", sans-serif' }}
                      >
                        {pill.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Main Panel Content Scroll */}
        <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-6 scrollbar-hide py-4 relative z-10">
          {variant === 'gemini' && (
            <>
              {messages.length > 0 && (
                <>
                  {messages.map((msg, index) => {
                    if (msg.role === 'user') {
                      return <UserMessage key={index} text={msg.text} theme={theme} />;
                    }
                    return (
                      <BotMessage 
                        key={index} 
                        text={msg.text} 
                        theme={theme} 
                        variant={currentTask === 'AI Search Summary' ? 'summary' : 'chat'}
                        onSourceClick={onSourceClick}
                        sources={sources}
                        isOrganizationProposal={msg.isOrganizationProposal}
                        proposedMoves={msg.proposedMoves}
                        isApplied={msg.isApplied}
                        isOrganizing={isOrganizingFiles}
                        onApplyMoves={() => onApplyMoves && onApplyMoves(index)}
                        onDoDifferently={() => onDoDifferently ? onDoDifferently(index) : onSendMessage("I'd like to organize these files differently: ")}
                        isSpacePeopleSelector={msg.isSpacePeopleSelector}
                        suggestedPeople={msg.suggestedPeople}
                        teamMembers={msg.teamMembers}
                        targetSpaceName={msg.targetSpaceName}
                        onFinalizeSpace={onFinalizeSpace}
                        isProactiveReview={msg.isProactiveReview}
                        proactiveTask={msg.proactiveTask}
                        onApproveProactive={msg.onApproveProactive}
                        onFeedbackProactive={msg.onFeedbackProactive}
                      />
                    );
                  })}
                </>
              )}
              
              {/* Exactly one unified TaskCard representing the lifetime of the user's workspace progress */}
              {(messages.length > 0 || isLoading) && currentTask !== 'app' && (() => {
                const allSteps = messages.flatMap(msg => msg.steps || []);
                const lastBotMessage = [...messages].reverse().find(msg => msg.role === 'bot' || msg.role === 'assistant' || msg.role === 'model');
                const lastBotText = lastBotMessage ? lastBotMessage.text : '';
                return (
                  <div className="mt-2" key="unified-task-card" style={{ fontFamily: '"Inter", sans-serif' }}>
                    <TaskCard 
                      taskTitle={currentTask} 
                      steps={allSteps} 
                      isLoading={isLoading} 
                      theme={theme} 
                      fullText={lastBotText}
                    />
                  </div>
                );
              })()}
            </>
          )}

          {variant === 'comments' && (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                {localComments.length === 0 ? (
                  <div className="absolute top-[180px] left-0 w-full px-6 flex justify-center pointer-events-none opacity-80">
                    <HeroTitle theme={theme}>
                      No comments yet
                    </HeroTitle>
                  </div>
                ) : (
                  localComments.map((comment, index) => (
                    <div key={index} className={`${
                      theme === 'dark' 
                        ? 'bg-[#2B2D31]/40 border-[#2B2D31] text-white' 
                        : 'bg-white/80 border-slate-100'
                    } p-3.5 rounded-2xl border flex flex-col gap-1.5 transition-all hover:translate-x-1 duration-200`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{comment.author}</span>
                        <span className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-slate-400'} font-medium`}>{comment.time}</span>
                      </div>
                      <p className={`text-xs ${theme === 'dark' ? 'text-[#CCCCCC]' : 'text-slate-600'} leading-relaxed font-sans`}>{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {variant === 'history' && (
            <div className="flex-1 flex flex-col gap-4">
              {getActivityTimeline().length === 0 ? (
                <div className="absolute top-[180px] left-0 w-full px-6 flex justify-center pointer-events-none opacity-80">
                  <HeroTitle theme={theme}>
                    No history yet
                  </HeroTitle>
                </div>
              ) : (
                <div className={`relative border-l-2 ${theme === 'dark' ? 'border-[#2B2D31]' : 'border-slate-200/60'} ml-3.5 pl-5 space-y-6`}>
                  {getActivityTimeline().map((evt, idx) => (
                    <div key={idx} className="relative group">
                      {/* Indicator Dot */}
                      <div className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white ring-2 ${
                        evt.type === 'prompt' ? 'bg-indigo-500 ring-indigo-200' :
                        evt.type === 'drive' ? 'bg-emerald-500 ring-emerald-200' :
                        evt.type === 'server' ? 'bg-amber-500 ring-amber-200' : 'bg-slate-400 ring-slate-150'
                      }`} />
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{evt.title}</h4>
                          <span className="text-[10px] text-slate-400 font-medium">{evt.time}</span>
                        </div>
                        <p className={`text-xs ${theme === 'dark' ? 'text-[#CCCCCC]' : 'text-slate-500'} font-sans leading-relaxed`}>{evt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer/Composer State */}
        {variant !== 'history' && (
          <div className={`p-4 relative z-10 shrink-0 ${
            theme === 'dark' ? 'bg-[#1E1F22]' : 'bg-white'
          }`}>
            <Composer 
              onSend={variant === 'comments' ? handlePostComment : onSendMessage} 
              disabled={variant === 'gemini' ? (isLoading || !isLoggedIn) : false} 
              placeholder={
                variant === 'comments' 
                  ? "Add a comment..." 
                  : currentTask === 'AI Search Summary' 
                    ? "Ask follow-up questions about files..." 
                    : "Type a message..."
              }
              theme={theme}
              onCreateArtifact={onCreateArtifact}
            />
          </div>
        )}
      </div>
    </div>
  );
}
