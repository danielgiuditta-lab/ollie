import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  ExternalLink, 
  X,
  ChevronRight,
  FileText,
  Presentation,
  Mail,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { NativeViewer } from './NativeViewer';
import { InferredTaskDiffView } from './InferredTaskDiffView';
import { Composer } from '../Chat/Composer';

interface TheatreViewProps {
  todoItems: any[];
  initialIndex?: number;
  onClose: () => void;
  onSendMessage: (text: string, aiMode?: boolean, contextFiles?: any[]) => void;
  setActiveSidebar?: any;
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

  // Handle steer submission using shared Composer
  const handleSteerSubmit = (val: string) => {
    if (!val.trim()) return;

    const fullMsg = activeTask 
      ? `Regarding task "${activeTask.title || activeTask.description}": ${val}`
      : val;

    onSendMessage(fullMsg);
    if (setActiveSidebar) {
      setActiveSidebar('gemini');
    }
  };

  // Helper to open source link in a new tab
  const handleOpenSourceChip = (urlOrName?: string) => {
    if (!urlOrName) return;
    if (urlOrName.startsWith('http')) {
      window.open(urlOrName, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://drive.google.com/drive/search?q=${encodeURIComponent(urlOrName)}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Group tasks for Left List
  const doneTasks = todoItems.filter(t => t.status === 'done' || completedTaskIds.has(t.id));
  const startedTasks = todoItems.filter(t => t.status !== 'done' && t.type !== 'fyi' && t.category !== 'fyi' && !completedTaskIds.has(t.id));
  const fyiTasks = todoItems.filter(t => (t.type === 'fyi' || t.category === 'fyi') && !completedTaskIds.has(t.id));

  // Determine native tool button label
  const getNativeToolLabel = () => {
    if (!activeTask) return 'Open in Drive';
    const type = (activeTask.type || activeTask.sourceMimeType || '').toLowerCase();
    if (type.includes('slide') || type.includes('presentation')) return 'Open in Slides';
    if (type.includes('doc') || type.includes('word')) return 'Open in Docs';
    if (type.includes('sheet') || type.includes('csv') || type.includes('excel')) return 'Open in Sheets';
    if (type.includes('mail') || type.includes('gmail')) return 'Open in Gmail';
    if (type.includes('calendar')) return 'Open in Calendar';
    return 'Open in native tool';
  };

  // Construct target document file object for NativeViewer/DiffView
  const getTaskFileObject = (task: any) => {
    if (!task) return null;
    
    // If explicit filesToLoad array exists on the task, load the first target file
    if (task.filesToLoad && task.filesToLoad.length > 0) {
      const target = task.filesToLoad[0];
      return {
        ...target,
        id: target.id || task.id,
        name: target.name || task.sourceName || task.title || 'Document',
        mimeType: target.mimeType || (task.type === 'slide' ? 'application/vnd.google-apps.presentation' : 'application/vnd.google-apps.document'),
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

    // Resolve file type based on mimeType / source text
    const textForMime = `${task.sourceName || ''} ${task.sourceMimeType || ''} ${task.type || ''} ${task.description || ''}`.toLowerCase();
    let resolvedMime = 'application/vnd.google-apps.document';
    let resolvedType = 'doc';

    if (textForMime.includes('slide') || textForMime.includes('presentation')) {
      resolvedMime = 'application/vnd.google-apps.presentation';
      resolvedType = 'slide';
    } else if (textForMime.includes('sheet') || textForMime.includes('csv') || textForMime.includes('spreadsheet')) {
      resolvedMime = 'application/vnd.google-apps.spreadsheet';
      resolvedType = 'sheet';
    }

    return {
      id: task.id,
      name: task.sourceName || task.title || 'Task Document',
      mimeType: task.sourceMimeType || resolvedMime,
      type: resolvedType,
      title: task.title,
      description: task.description,
      content: task.updatedMarkdown || task.description || '',
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
    <div className="dark fixed inset-0 z-50 bg-[#141517] text-white flex flex-col select-none font-sans animate-in fade-in duration-200 p-4 md:p-6 overflow-hidden">
      {/* Top Header Bar matching design specs */}
      <div className="w-full shrink-0 flex items-center justify-between pb-3 px-1">
        {/* Left Breadcrumbs */}
        <div className="flex items-center gap-2 text-[17px] font-normal text-neutral-400">
          <span 
            onClick={onClose}
            className="cursor-pointer hover:text-white transition-colors font-normal text-neutral-300"
          >
            Home
          </span>
          <ChevronRight size={18} className="text-neutral-500 shrink-0" />
          <span className="text-white font-medium">Taskview</span>
        </div>

        {/* Right Action Buttons (Open in Native Tool + Close) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenSourceChip(activeTask?.sourceName || activeTask?.title)}
            className="h-9 px-4 rounded-full bg-[#282A2D] hover:bg-[#35373A] text-white text-xs font-medium border border-neutral-700/60 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            {getNativeToolLabel()}
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#282A2D] hover:bg-[#35373A] text-white border border-neutral-700/60 flex items-center justify-center transition-all cursor-pointer"
            title="Close Taskview"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Split Container */}
      <div className="flex-1 w-full min-h-0 flex gap-6 overflow-hidden pb-4">
        {/* Left Panel: Home Tasks Directory */}
        <div className="w-80 md:w-96 shrink-0 flex flex-col gap-5 overflow-y-auto pr-2 select-text">
          {/* Active Tasks ("What I started...") */}
          {startedTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">What I started</h3>
              <div className="flex flex-col gap-2">
                {startedTasks.map((item) => {
                  const itemIndex = todoItems.findIndex(t => t.id === item.id);
                  const isSelected = itemIndex === activeIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveIndex(itemIndex)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                        isSelected 
                          ? 'bg-[#24262B] border-blue-500/80 ring-1 ring-blue-500/30 shadow-lg' 
                          : 'bg-[#1C1D20] border-neutral-800 hover:bg-[#222428] hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-neutral-100 line-clamp-2 leading-snug">
                        {item.title || item.titleDone || item.description}
                      </div>

                      <div className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {item.description || item.action || 'Task review and outline draft'}
                      </div>

                      {/* Metadata Chips */}
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        {item.personName && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSourceChip(item.personName);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#161719] hover:bg-[#2C2E33] border border-neutral-700/60 text-[10px] text-neutral-300 font-medium transition-colors"
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
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#161719] hover:bg-[#2C2E33] border border-neutral-700/60 text-[10px] text-neutral-300 font-medium transition-colors"
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

          {/* Completed Tasks ("What I did...") */}
          {doneTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">What I did</h3>
              <div className="flex flex-col gap-2">
                {doneTasks.map((item) => {
                  const itemIndex = todoItems.findIndex(t => t.id === item.id);
                  const isSelected = itemIndex === activeIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveIndex(itemIndex)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'bg-[#24262B] border-blue-500/80 shadow-md' 
                          : 'bg-[#1C1D20] border-neutral-800/80 hover:bg-[#222428] hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <div className="text-xs font-medium text-neutral-200 line-clamp-1">
                          {item.titleDone || item.title || item.description}
                        </div>
                        <div className="text-[11px] text-neutral-400 line-clamp-1">
                          {item.descriptionDone || item.description || 'Task completed'}
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-emerald-950/60 border border-emerald-600/60 flex items-center justify-center text-emerald-400 shrink-0">
                        <Check size={12} className="stroke-[2.5]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FYI Tasks */}
          {fyiTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">FYI</h3>
              <div className="flex flex-col gap-2">
                {fyiTasks.map((item) => {
                  const itemIndex = todoItems.findIndex(t => t.id === item.id);
                  const isSelected = itemIndex === activeIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveIndex(itemIndex)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected 
                          ? 'bg-[#24262B] border-blue-500/80 shadow-md' 
                          : 'bg-[#1C1D20] border-neutral-800/80 hover:bg-[#222428] hover:border-neutral-700'
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

        {/* Right Center Canvas: Selected Task Target Artifact View */}
        <div className="flex-1 h-full rounded-2xl overflow-hidden bg-[#18191B] border border-neutral-800 relative shadow-2xl flex flex-col">
          {activeFileObject ? (
            <div 
              key={activeTask?.id || activeIndex}
              className="w-full h-full animate-in slide-in-from-bottom-4 duration-200 ease-out flex flex-col overflow-hidden"
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

      {/* Bottom Controls Dock: Reusing Shared Bottom Composer */}
      <div className="w-full shrink-0 flex items-center justify-center gap-3 pt-2 pb-1 relative z-10">
        {/* Previous Task Arrow Button */}
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="w-12 h-12 rounded-full bg-[#282A2D] hover:bg-[#35373A] text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-md"
          title="Previous task"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Reject / Decline Button matching InferredTaskCard style */}
        <button
          onClick={handleReject}
          className="w-12 h-12 rounded-full bg-[#FCE8E6] dark:bg-red-950/40 hover:bg-[#FAD2CF] dark:hover:bg-red-900/60 text-[#C5221F] dark:text-red-400 flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-md"
          title="Decline"
        >
          <X size={24} className="stroke-[2.5]" />
        </button>

        {/* Center Steer Input using bottom layout Composer */}
        <div className="w-96 md:w-[600px] flex items-center">
          <Composer
            onSend={handleSteerSubmit}
            disabled={false}
            placeholder={activeTask?.type === 'slide' ? "Suggest an update to the slides..." : "Give agent a steer..."}
            theme="dark"
            layout="bottom"
          />
        </div>

        {/* Approve / Accept Button matching InferredTaskCard style */}
        <button
          onClick={handleApprove}
          className="w-12 h-12 rounded-full bg-[#E6F4EA] dark:bg-green-950/40 hover:bg-[#CEEAD6] dark:hover:bg-green-900/60 text-[#137333] dark:text-green-400 flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-md"
          title="Accept"
        >
          <Check size={24} className="stroke-[2.5]" />
        </button>

        {/* Next Task Arrow Button */}
        <button
          onClick={handleNext}
          disabled={activeIndex === todoItems.length - 1}
          className="w-12 h-12 rounded-full bg-[#282A2D] hover:bg-[#35373A] text-white flex items-center justify-center cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-md"
          title="Next task"
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
