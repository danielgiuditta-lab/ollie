import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  Play, 
  Sparkles, 
  PanelRight, 
  Send,
  FileText,
  Presentation,
  Mail,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';
import { NativeViewer } from './NativeViewer';
import { InferredTaskDiffView } from './InferredTaskDiffView';

interface TheatreViewProps {
  todoItems: any[];
  initialIndex?: number;
  onClose: () => void;
  onSendMessage: (text: string, aiMode?: boolean, contextFiles?: any[]) => void;
  setActiveSidebar?: (sidebar: 'gemini' | 'files' | null) => void;
  onUpdateTaskStatus?: (taskId: string, status: 'done' | 'working' | 'rejected') => void;
  userProfile?: any;
  accessToken?: string | null;
  theme?: 'light' | 'dark';
}

export function TheatreView({
  todoItems = [],
  initialIndex = 0,
  onClose,
  onSendMessage,
  setActiveSidebar,
  onUpdateTaskStatus,
  userProfile,
  accessToken,
  theme = 'dark'
}: TheatreViewProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [steerText, setSteerText] = useState('');
  const [isMorphed, setIsMorphed] = useState(false);

  // Sync initial index if todoItems changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < todoItems.length) {
      setActiveIndex(initialIndex);
    }
  }, [initialIndex, todoItems.length]);

  const activeTask = todoItems[activeIndex] || todoItems[0] || null;

  // Handle task approval (Yes)
  const handleApprove = () => {
    if (!activeTask) return;
    const nextCompleted = new Set(completedTaskIds);
    nextCompleted.add(activeTask.id);
    setCompletedTaskIds(nextCompleted);

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(activeTask.id, 'done');
    }

    // Advance to next task if available
    if (activeIndex < todoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  // Handle task rejection (No)
  const handleReject = () => {
    if (!activeTask) return;
    const nextCompleted = new Set(completedTaskIds);
    nextCompleted.add(activeTask.id);
    setCompletedTaskIds(nextCompleted);

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(activeTask.id, 'rejected');
    }

    // Advance to next task if available
    if (activeIndex < todoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveIndex(prev => Math.min(todoItems.length - 1, prev + 1));
  };

  // Handle text steer submission
  const handleSteerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!steerText.trim()) return;

    const fullMsg = activeTask 
      ? `Regarding task "${activeTask.title || activeTask.description}": ${steerText}`
      : steerText;

    onSendMessage(fullMsg);
    if (setActiveSidebar) {
      setActiveSidebar('gemini');
    }
    setSteerText('');
  };

  // Helper to open source link in a new tab
  const handleOpenSourceChip = (urlOrName?: string) => {
    if (!urlOrName) return;
    if (urlOrName.startsWith('http')) {
      window.open(urlOrName, '_blank', 'noopener,noreferrer');
    } else {
      // Search or open drive search
      window.open(`https://drive.google.com/drive/search?q=${encodeURIComponent(urlOrName)}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Group tasks for Left List
  const doneTasks = todoItems.filter(t => t.status === 'done' || completedTaskIds.has(t.id));
  const startedTasks = todoItems.filter(t => t.status !== 'done' && t.type !== 'fyi' && t.category !== 'fyi' && !completedTaskIds.has(t.id));
  const fyiTasks = todoItems.filter(t => (t.type === 'fyi' || t.category === 'fyi') && !completedTaskIds.has(t.id));

  // Determine native tool button text
  const getNativeToolLabel = () => {
    if (!activeTask) return 'Open in Drive';
    const type = activeTask.type || activeTask.sourceMimeType || '';
    if (type.includes('slide') || type.includes('presentation')) return 'Open in Slides';
    if (type.includes('doc') || type.includes('word')) return 'Open in Docs';
    if (type.includes('sheet') || type.includes('csv') || type.includes('excel')) return 'Open in Sheets';
    if (type.includes('mail') || type.includes('gmail')) return 'Open in Gmail';
    if (type.includes('calendar')) return 'Open in Calendar';
    return 'Open in native tool';
  };

  // Construct file object for NativeViewer/DiffView
  const getTaskFileObject = (task: any) => {
    if (!task) return null;
    if (task.filesToLoad && task.filesToLoad.length > 0) {
      return {
        ...task.filesToLoad[0],
        id: task.id,
        isInferredTask: true,
        title: task.title,
        description: task.description,
        originalMarkdown: task.originalMarkdown,
        updatedMarkdown: task.updatedMarkdown,
        summaryOfChanges: task.summaryOfChanges,
        commentText: task.commentText,
        personName: task.personName,
        personAvatar: task.personAvatar
      };
    }
    return {
      id: task.id,
      name: task.sourceName || task.title || 'Task Details',
      mimeType: task.sourceMimeType || (task.type === 'slide' ? 'application/vnd.google-apps.presentation' : 'application/vnd.google-apps.document'),
      isInferredTask: true,
      title: task.title,
      description: task.description,
      originalMarkdown: task.originalMarkdown,
      updatedMarkdown: task.updatedMarkdown,
      summaryOfChanges: task.summaryOfChanges,
      commentText: task.commentText,
      personName: task.personName,
      personAvatar: task.personAvatar
    };
  };

  const activeFileObject = getTaskFileObject(activeTask);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col select-none text-white font-sans animate-in fade-in duration-200 p-4 md:p-6 overflow-hidden">
      {/* Top Menu Bar */}
      <div className="w-full shrink-0 flex items-center justify-between pb-4 px-2">
        {/* Left Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium text-neutral-400">
          <span className="hover:text-white transition-colors cursor-pointer" onClick={onClose}>Home</span>
          <span>&gt;</span>
          <span className="text-white font-semibold">Taskview</span>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenSourceChip(activeTask?.sourceName || activeTask?.title)}
            className="h-9 px-4 rounded-full bg-[#222428] hover:bg-[#2C2E33] text-neutral-200 hover:text-white text-xs font-medium border border-neutral-700 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>{getNativeToolLabel()}</span>
            <ExternalLink size={13} />
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#222428] hover:bg-[#2C2E33] text-neutral-300 hover:text-white border border-neutral-700 flex items-center justify-center transition-all cursor-pointer"
            title="Close Theatre View"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Split Container */}
      <div className="flex-1 w-full min-h-0 flex gap-6 overflow-hidden pb-4">
        {/* Left Panel: Tasks Directory & Selected Task Card */}
        <div className="w-80 md:w-96 shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 select-text">
          {/* Section 1: What I did... */}
          {doneTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-neutral-400 tracking-wide">What I did...</h3>
              <div className="flex flex-col gap-2">
                {doneTasks.map((item) => {
                  const itemIndex = todoItems.findIndex(t => t.id === item.id);
                  const isSelected = itemIndex === activeIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveIndex(itemIndex)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-[#26282D] border-neutral-600 shadow-md' 
                          : 'bg-[#1E1F22] border-neutral-800/80 hover:bg-[#24262B] hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="text-xs font-medium text-neutral-200 line-clamp-1">
                          {item.titleDone || item.title || item.description}
                        </div>
                        <div className="text-[11px] text-neutral-400 line-clamp-1">
                          {item.descriptionDone || item.description || 'Task completed'}
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-black/60 border border-neutral-700 flex items-center justify-center text-neutral-200 shrink-0">
                        <Check size={13} className="stroke-[2.5]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: What I started... */}
          {startedTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-neutral-400 tracking-wide">What I started...</h3>
              <div className="flex flex-col gap-2.5">
                {startedTasks.map((item) => {
                  const itemIndex = todoItems.findIndex(t => t.id === item.id);
                  const isSelected = itemIndex === activeIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveIndex(itemIndex)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                        isSelected 
                          ? 'bg-[#24262B] border-neutral-500 ring-1 ring-neutral-500/50 shadow-lg' 
                          : 'bg-[#1E1F22] border-neutral-800 hover:bg-[#24262B] hover:border-neutral-700'
                      }`}
                    >
                      {/* 2 lines title of what needs to be done */}
                      <div className="text-xs leading-snug font-medium text-neutral-100 line-clamp-2">
                        {item.title || item.titleDone || item.description}
                      </div>

                      {/* 2 meta lines about sources & who asked for it + what agent is proposing */}
                      <div className="text-[11px] leading-relaxed text-neutral-400 line-clamp-2">
                        {item.description || item.summaryOfChanges || item.action || 'Agent initialized task response and outlines.'}
                      </div>

                      {/* Source Chips */}
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {item.personName && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSourceChip(item.personName);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161719] hover:bg-[#2C2E33] border border-neutral-700/70 text-[10.5px] text-neutral-300 font-medium transition-colors cursor-pointer"
                          >
                            {item.personAvatar ? (
                              <img src={item.personAvatar} alt={item.personName} className="w-3.5 h-3.5 rounded-full object-cover" />
                            ) : (
                              <Mail size={11} className="text-blue-400" />
                            )}
                            <span className="line-clamp-1">{item.personName}</span>
                          </div>
                        )}

                        {item.sourceName && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSourceChip(item.sourceName);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161719] hover:bg-[#2C2E33] border border-neutral-700/70 text-[10.5px] text-neutral-300 font-medium transition-colors cursor-pointer"
                          >
                            <Presentation size={11} className="text-amber-400" />
                            <span className="line-clamp-1">{item.sourceName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: FYI */}
          {fyiTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-neutral-400 tracking-wide">FYI</h3>
              <div className="flex flex-col gap-2">
                {fyiTasks.map((item) => {
                  const itemIndex = todoItems.findIndex(t => t.id === item.id);
                  const isSelected = itemIndex === activeIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveIndex(itemIndex)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected 
                          ? 'bg-[#26282D] border-neutral-600 shadow-md' 
                          : 'bg-[#1E1F22] border-neutral-800/80 hover:bg-[#24262B] hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-medium text-neutral-200 line-clamp-1">
                        {item.title || item.description}
                      </div>
                      <div className="text-[11px] text-neutral-400 line-clamp-1">
                        {item.description || item.action}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Artifact Canvas View */}
        <div className="flex-1 h-full rounded-2xl overflow-hidden bg-[#111214] border border-neutral-800/80 relative shadow-2xl flex flex-col">
          {activeFileObject ? (
            <div 
              key={activeTask?.id || activeIndex}
              className="w-full h-full animate-in slide-in-from-bottom-6 duration-300 ease-out flex flex-col overflow-hidden"
            >
              {activeFileObject.originalMarkdown || activeFileObject.updatedMarkdown ? (
                <InferredTaskDiffView 
                  file={activeFileObject}
                  theme="dark"
                />
              ) : (
                <NativeViewer
                  file={activeFileObject}
                  hideHeader={true}
                  mode="preview"
                  theme="dark"
                  todoItems={todoItems}
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm font-medium">
              No artifact preview available for this task.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full shrink-0 flex items-center justify-center gap-3 pt-2 pb-1 relative z-10">
        {/* Previous Task Arrow */}
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="w-11 h-11 rounded-full bg-[#222428] hover:bg-[#2C2E33] disabled:opacity-40 disabled:hover:bg-[#222428] text-white border border-neutral-700/80 flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="Previous task"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Reject / No Button */}
        <button
          onClick={handleReject}
          className="w-11 h-11 rounded-full bg-[#222428] hover:bg-red-950/40 hover:border-red-600/60 text-red-400 border border-neutral-700/80 flex items-center justify-center transition-all cursor-pointer shadow-md group"
          title="Reject task suggestion"
        >
          <X size={20} className="group-hover:scale-110 transition-transform" />
        </button>

        {/* Text Steer Input Bar */}
        <form 
          onSubmit={handleSteerSubmit}
          className={`bg-[#18191B] border border-neutral-700/90 rounded-full px-4 py-2 flex items-center gap-2.5 transition-all duration-300 shadow-xl ${
            isMorphed || steerText.trim().length > 0 ? 'w-96 md:w-[480px] border-blue-500/70 ring-1 ring-blue-500/30' : 'w-72 md:w-96'
          }`}
        >
          <input
            type="text"
            value={steerText}
            onChange={(e) => {
              setSteerText(e.target.value);
              if (!isMorphed && e.target.value.length > 0) setIsMorphed(true);
            }}
            onFocus={() => setIsMorphed(true)}
            onBlur={() => {
              if (!steerText.trim()) setIsMorphed(false);
            }}
            placeholder={activeTask?.type === 'slide' ? "Suggest an update to the slides..." : "Give agent a steer..."}
            className="flex-1 bg-transparent border-none outline-none text-xs text-neutral-100 placeholder-neutral-500 font-medium"
          />

          {/* Morph controls: Side Chat toggle & Send button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {setActiveSidebar && (
              <button
                type="button"
                onClick={() => setActiveSidebar('gemini')}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Open Side Chat Panel"
              >
                <PanelRight size={15} />
              </button>
            )}

            <button
              type="submit"
              disabled={!steerText.trim()}
              className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Send steer to agent"
            >
              <Send size={13} />
            </button>
          </div>
        </form>

        {/* Approve / Yes Button */}
        <button
          onClick={handleApprove}
          className="w-11 h-11 rounded-full bg-[#222428] hover:bg-emerald-950/40 hover:border-emerald-600/60 text-emerald-400 border border-neutral-700/80 flex items-center justify-center transition-all cursor-pointer shadow-md group"
          title="Approve task suggestion"
        >
          <Check size={20} className="group-hover:scale-110 transition-transform stroke-[2.5]" />
        </button>

        {/* Next Task Arrow */}
        <button
          onClick={handleNext}
          disabled={activeIndex === todoItems.length - 1}
          className="w-11 h-11 rounded-full bg-[#222428] hover:bg-[#2C2E33] disabled:opacity-40 disabled:hover:bg-[#222428] text-white border border-neutral-700/80 flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="Next task"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
