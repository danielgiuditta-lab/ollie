import React, { useState } from 'react';
import { BotMessage } from './BotMessage';
import { UserMessage } from './UserMessage';
import { Composer } from './Composer';
import { HeroTitle } from '../Shared/HeroTitle';
import { NullTitle } from '../Shared/NullTitle';
import { IconButton } from '../Shared/IconButton';
import { TaskCard } from './TaskCard';
import { MessageSquare, History, FileText, ChevronRight, Activity, Smile, X, LayoutDashboard, CheckCircle2, Presentation, FolderKanban } from 'lucide-react';

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
  onFinalizeSpace
}: ChatSidebarProps) {
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
        <div className="flex items-center justify-between px-4 pt-4 pb-4">
          <h2 className={`font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{getTitle()}</h2>
          <div className="flex items-center gap-1.5">
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
            {/* Centered Title top block matching canvas h-[33.33%] */}
            <div className="w-full h-[33.33%] flex items-center justify-center shrink-0">
              <NullTitle theme={theme}>Start building</NullTitle>
            </div>

            {/* Suggestions list perfectly aligned at vertical baseline of Suggested Files top cell */}
            <div className="flex-1 flex flex-col gap-2.5 w-full items-start pointer-events-none animate-fade-in-up min-h-0" style={{ animationDelay: '200ms' }}>
              <button 
                onClick={() => onSendMessage("Make an interactive dashboard")}
                className="w-fit flex items-center gap-3 py-3 px-5 rounded-full transition-colors duration-250 text-left cursor-pointer border-none shadow-none pointer-events-auto bg-f8fafd hover:bg-f0f4f9"
              >
                <LayoutDashboard size={20} className="shrink-0 text-slate-800" />
                <span 
                  className="text-sm font-medium text-slate-800"
                  style={{ fontFamily: '"Google Sans Flex", "Google Sans", "Product Sans", "Inter", sans-serif' }}
                >
                  Make an interactive dashboard
                </span>
              </button>

              <button 
                onClick={() => onSendMessage("Make a project tracker")}
                className="w-fit flex items-center gap-3 py-3 px-5 rounded-full transition-colors duration-250 text-left cursor-pointer border-none shadow-none pointer-events-auto bg-f8fafd hover:bg-f0f4f9"
              >
                <CheckCircle2 size={20} className="shrink-0 text-slate-800" />
                <span 
                  className="text-sm font-medium text-slate-800"
                  style={{ fontFamily: '"Google Sans Flex", "Google Sans", "Product Sans", "Inter", sans-serif' }}
                >
                  Make a project tracker
                </span>
              </button>

              <button 
                onClick={() => onSendMessage("Make an interactive presentation")}
                className="w-fit flex items-center gap-3 py-3 px-5 rounded-full transition-colors duration-250 text-left cursor-pointer border-none shadow-none pointer-events-auto bg-f8fafd hover:bg-f0f4f9"
              >
                <Presentation size={20} className="shrink-0 text-slate-800" />
                <span 
                  className="text-sm font-medium text-slate-800"
                  style={{ fontFamily: '"Google Sans Flex", "Google Sans", "Product Sans", "Inter", sans-serif' }}
                >
                  Make an interactive presentation
                </span>
              </button>

              {fileCount > 3 && (
                <button 
                  onClick={() => onSendMessage("Organize files")}
                  className="w-fit flex items-center gap-3 py-3 px-5 rounded-full transition-colors duration-250 text-left cursor-pointer border-none shadow-none pointer-events-auto bg-f8fafd hover:bg-f0f4f9"
                >
                  <FolderKanban size={20} className="shrink-0 text-slate-800" />
                  <span 
                    className="text-sm font-medium text-slate-800"
                    style={{ fontFamily: '"Google Sans Flex", "Google Sans", "Product Sans", "Inter", sans-serif' }}
                  >
                    Organize files
                  </span>
                </button>
              )}
            </div>
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
              disabled={variant === 'gemini' ? isLoading : false} 
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
