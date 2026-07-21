import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  X,
  Pencil,
  ArrowUp,
  MessageSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { NativeViewer } from './NativeViewer';
import { InferredTaskDiffView } from './InferredTaskDiffView';
import { getFileIcon } from '../Shared/FileIcon';
import { getAvatarForPerson } from '../../utils/personAvatars';
import { IconButton } from '../Shared/IconButton';

interface OptionDViewProps {
  todoItems: any[];
  initialIndex?: number;
  onClose: () => void;
  onSendMessage: (text: string, aiMode?: boolean, contextFiles?: any[]) => void;
  setActiveSidebar?: any;
  onUpdateTaskStatus?: (taskId: string, status: 'done' | 'working' | 'rejected') => void;
  userProfile?: any;
  accessToken?: string | null;
  theme?: 'light' | 'dark';
  driveFiles?: any[];
}

function getAbbreviatedCellTitle(item: any, isSignedOff: boolean): string {
  if (!item) return '';
  if (item.shortTitle) return item.shortTitle;

  const raw = isSignedOff 
    ? (item.titleDone || item.title || item.description || '')
    : (item.title || item.titleDone || item.description || '');

  if (!raw) return item.sourceName || 'Task';
  return raw.trim();
}

export function OptionDView({
  todoItems = [],
  initialIndex = 0,
  onClose,
  onSendMessage,
  setActiveSidebar,
  onUpdateTaskStatus,
  userProfile,
  accessToken,
  theme = 'light',
  driveFiles = []
}: OptionDViewProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [steerInput, setSteerInput] = useState('');
  const [actionToast, setActionToast] = useState<{ text: 'Approved' | 'Declined' | 'Skipped'; key: number } | null>(null);

  const triggerActionToast = (text: 'Approved' | 'Declined' | 'Skipped') => {
    const key = Date.now();
    setActionToast({ text, key });
    setTimeout(() => {
      setActionToast(prev => (prev?.key === key ? null : prev));
    }, 750);
  };

  // Group tasks for Left List maintaining fixed section structure matching inferred task list
  const approvalTasks = useMemo(() => todoItems.filter(t => t.category === 'needs_approval' || t.type === 'chat'), [todoItems]);
  const continueWorkingTasks = useMemo(() => todoItems.filter(t => t.category === 'needs_input' || t.category === 'continue_working' || (t.type !== 'chat' && t.type !== 'fyi' && t.category !== 'needs_approval' && t.category !== 'fyi')), [todoItems]);
  const fyiTasks = useMemo(() => todoItems.filter(t => t.type === 'fyi' || t.category === 'fyi'), [todoItems]);

  const orderedTodoItems = useMemo(() => {
    const combined = [...approvalTasks, ...continueWorkingTasks, ...fyiTasks];
    return combined.length > 0 ? combined : todoItems;
  }, [approvalTasks, continueWorkingTasks, fyiTasks]);

  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < orderedTodoItems.length) {
      setActiveIndex(initialIndex);
      setSteerInput('');
    }
  }, [initialIndex, orderedTodoItems.length]);

  const activeTask = orderedTodoItems[activeIndex] || orderedTodoItems[0] || null;

  const isChatReplyTask = Boolean(
    activeTask && (
      activeTask.type === 'chat' ||
      activeTask.type === 'message' ||
      activeTask.senderMessage ||
      activeTask.proposedReply ||
      (typeof activeTask.sourceName === 'string' && activeTask.sourceName.toLowerCase().includes('chat'))
    )
  );

  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [editableProposalText, setEditableProposalText] = useState('');

  useEffect(() => {
    if (activeTask) {
      setEditableProposalText(
        activeTask.proposedReply || activeTask.action || "hey alan!\nconversion is steady at 21%"
      );
      setIsEditingProposal(false);
    }
  }, [activeTask?.id]);

  const activeSourceName = activeTask?.sourceName || activeTask?.workspace || 'Google Drive';
  const activePersonName = activeTask?.personName || 'Maya Lin';
  const activeAvatar = activeTask?.personAvatar || getAvatarForPerson(activePersonName);

  const isCurrentSignedOff = activeTask ? completedTaskIds.has(activeTask.id) : false;

  const canvasTitleText = activeTask ? (
    isCurrentSignedOff 
      ? (activeTask.titleDone || activeTask.title || activeTask.description)
      : (activeTask.title || activeTask.titleDone || activeTask.description)
  ) : '';

  const canvasMetaText = activeTask ? (
    isCurrentSignedOff
      ? (activeTask.descriptionDone || activeTask.description || activeTask.action || 'Your tasks will be added to "My tasks" when notes are ready')
      : (activeTask.description || activeTask.descriptionDone || activeTask.action || 'Gemini will write a professional follow-up email for you...')
  ) : '';

  const handleApprove = () => {
    if (!activeTask) return;
    triggerActionToast('Approved');
    const nextCompleted = new Set(completedTaskIds);
    nextCompleted.add(activeTask.id);
    setCompletedTaskIds(nextCompleted);
    setSteerInput('');

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(activeTask.id, 'done');
    }

    if (activeIndex < orderedTodoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handleReject = () => {
    if (!activeTask) return;
    triggerActionToast('Declined');
    const nextCompleted = new Set(completedTaskIds);
    nextCompleted.add(activeTask.id);
    setCompletedTaskIds(nextCompleted);
    setSteerInput('');

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(activeTask.id, 'rejected');
    }

    if (activeIndex < orderedTodoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex === 0) return;
    triggerActionToast('Skipped');
    setActiveIndex(prev => Math.max(0, prev - 1));
    setSteerInput('');
  };

  const handleNext = () => {
    if (activeIndex === orderedTodoItems.length - 1) return;
    triggerActionToast('Skipped');
    setActiveIndex(prev => Math.min(orderedTodoItems.length - 1, prev + 1));
    setSteerInput('');
  };

  const handleSteerSubmit = (val: string) => {
    if (!val.trim()) return;
    triggerActionToast('Approved');

    if (activeTask) {
      if (isChatReplyTask) {
        activeTask.proposedReply = val;
        setEditableProposalText(val);
      }
      const nextCompleted = new Set(completedTaskIds);
      nextCompleted.add(activeTask.id);
      setCompletedTaskIds(nextCompleted);

      if (onUpdateTaskStatus) {
        onUpdateTaskStatus(activeTask.id, 'done');
      }
    }

    const fullMsg = activeTask 
      ? `Regarding task "${activeTask.title || activeTask.description}": ${val}`
      : val;

    onSendMessage(fullMsg);
    if (setActiveSidebar) {
      setActiveSidebar('gemini');
    }

    setSteerInput('');

    if (activeTask && activeIndex < orderedTodoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handleToggleComplete = (taskId: string) => {
    const nextCompleted = new Set(completedTaskIds);
    if (nextCompleted.has(taskId)) {
      nextCompleted.delete(taskId);
    } else {
      nextCompleted.add(taskId);
    }
    setCompletedTaskIds(nextCompleted);

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(taskId, nextCompleted.has(taskId) ? 'done' : 'working');
    }
  };

  const getSteerPlaceholder = () => {
    if (!activeTask) return "Tell Ollie how to respond differently...";

    if (
      activeTask.type === 'chat' || 
      activeTask.workspace === 'Google Chat' || 
      activeTask.sourceName?.toLowerCase().includes('chat') ||
      activeTask.senderMessage ||
      activeTask.proposedReply
    ) {
      if (activeTask.personName) {
        const firstName = activeTask.personName.split(' ')[0];
        return `Tell Ollie how to respond to ${firstName} differently...`;
      }
      return "Tell Ollie how to respond differently...";
    }

    if (activeTask.sourceName && typeof activeTask.sourceName === 'string' && !activeTask.sourceName.toLowerCase().includes('google chat')) {
      const cleanName = activeTask.sourceName.replace(/\.[^/.]+$/, '').trim();
      if (cleanName.length > 0) {
        const shortName = cleanName.length > 25 ? cleanName.slice(0, 22) + '...' : cleanName;
        return `Tell Ollie how to edit "${shortName}" differently...`;
      }
    }

    if (activeTask.title) {
      const titleShort = activeTask.title.length > 28 ? `${activeTask.title.slice(0, 25)}...` : activeTask.title;
      return `Tell Ollie how to work on "${titleShort}" differently...`;
    }

    return "Tell Ollie how to respond differently...";
  };

  const handleOpenSourceChip = (urlOrName?: string) => {
    if (!urlOrName) return;
    if (urlOrName.startsWith('http')) {
      window.open(urlOrName, '_blank', 'noopener,noreferrer');
      return;
    }

    const lower = urlOrName.toLowerCase();
    if (lower.includes('chat')) {
      window.open('https://chat.google.com', '_blank', 'noopener,noreferrer');
    } else if (lower.includes('calendar')) {
      window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer');
    } else if (lower.includes('gmail') || lower.includes('mail')) {
      window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://drive.google.com/drive/search?q=${encodeURIComponent(urlOrName)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const getTaskFileObject = (task: any) => {
    if (!task) return null;

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

    let matchingDriveFile = null;
    if (driveFiles && driveFiles.length > 0) {
      matchingDriveFile = driveFiles.find((df: any) => 
        df.id === task.driveId || 
        df.id === task.fileId || 
        df.name?.toLowerCase() === task.sourceName?.toLowerCase() ||
        df.name?.toLowerCase() === task.title?.toLowerCase()
      );
    }

    return {
      id: matchingDriveFile?.id || task.driveId || task.fileId || task.id,
      name: matchingDriveFile?.name || task.sourceName || task.title || 'Document',
      mimeType: matchingDriveFile?.mimeType || task.sourceMimeType || (task.type === 'slide' ? 'application/vnd.google-apps.presentation' : 'application/vnd.google-apps.document'),
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

  const activeFileObj = getTaskFileObject(activeTask);

  const renderTaskSection = (title: string, items: any[]) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="flex flex-col gap-1.5 mb-4">
        <h3 className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wider px-2">
          {title} ({items.length})
        </h3>
        <div className="flex flex-col gap-1">
          {items.map((item) => {
            const itemIdx = orderedTodoItems.findIndex(t => t.id === item.id);
            const isSelected = itemIdx === activeIndex;
            const isSignedOff = completedTaskIds.has(item.id);
            const titleText = getAbbreviatedCellTitle(item, isSignedOff);
            const descText = isSignedOff
              ? (item.descriptionDone || item.description || item.action || 'Completed')
              : (item.description || item.descriptionDone || item.action || 'Pending task...');

            return (
              <div
                key={item.id}
                onClick={() => setActiveIndex(itemIdx)}
                className={`p-3 rounded-xl transition-all cursor-pointer border select-none flex items-start justify-between gap-2.5 ${
                  isSelected 
                    ? 'bg-blue-50/90 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700/60 shadow-3xs' 
                    : 'bg-white dark:bg-[#1E1F22] border-slate-200/80 dark:border-[#2B2D31] hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className={`flex-1 min-w-0 flex flex-col gap-0.5 ${isSignedOff && !isSelected ? 'opacity-50' : 'opacity-100'}`}>
                  <h4 className={`text-[13px] leading-snug font-medium truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {titleText}
                  </h4>
                  <p className="text-[11px] leading-tight text-slate-500 dark:text-neutral-400 truncate">
                    {descText}
                  </p>
                </div>

                {isSignedOff && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(item.id);
                    }}
                    className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 self-center transition-colors cursor-pointer"
                    title="Unmark completed"
                  >
                    <Check size={13} className="stroke-[2.5]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9FA] dark:bg-[#121316] flex flex-row overflow-hidden font-sans text-slate-800 dark:text-slate-100 animate-in fade-in duration-200">
      {/* Toast Overlay */}
      <AnimatePresence>
        {actionToast && (
          <motion.div
            key={actionToast.key}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full font-medium text-xs shadow-lg backdrop-blur flex items-center gap-2 border ${
              actionToast.text === 'Approved' 
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                : actionToast.text === 'Declined'
                  ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            {actionToast.text === 'Approved' && <Check size={14} className="stroke-[2.5]" />}
            {actionToast.text === 'Declined' && <X size={14} className="stroke-[2.5]" />}
            <span>Task {actionToast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Task Column (Snapped mode) */}
      <div className="w-72 sm:w-80 shrink-0 bg-white dark:bg-[#18191C] border-r border-slate-200/90 dark:border-[#2B2D31] flex flex-col h-full overflow-y-auto p-4 select-none">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-[#2B2D31]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tasks</h2>
          </div>
          <span className="text-xs bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 px-2 py-0.5 rounded-full font-medium">
            {orderedTodoItems.length} items
          </span>
        </div>

        {renderTaskSection("Needs Approval", approvalTasks)}
        {renderTaskSection("Continue Working", continueWorkingTasks)}
        {renderTaskSection("FYI", fyiTasks)}
      </div>

      {/* Main Artifact Canvas Area */}
      <div className="flex-1 flex flex-col h-full bg-[#F8F9FA] dark:bg-[#121316] relative min-w-0 overflow-hidden">
        {/* Top Bar inside Artifact Canvas (with standard close button top right) */}
        <div className="h-14 px-6 border-b border-slate-200/80 dark:border-[#2B2D31] bg-white/70 dark:bg-[#18191C]/70 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => handleOpenSourceChip(activeSourceName)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-neutral-700 transition cursor-pointer"
            >
              <img 
                src={activeAvatar} 
                alt={activePersonName} 
                className="w-4 h-4 rounded-full object-cover shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = '/people/sarah_lin.jpg'; }}
              />
              <span className="truncate max-w-[120px]">{activeSourceName}</span>
              <ExternalLink size={12} className="text-slate-400" />
            </button>
            <span className="text-slate-300 dark:text-neutral-700">•</span>
            <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {canvasTitleText}
            </h1>
          </div>

          {/* Standard Close button in the top right of the artifact canvas */}
          <IconButton 
            variant="card" 
            onClick={onClose} 
            title="Close Mode D"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-neutral-300" />
          </IconButton>
        </div>

        {/* Artifact Viewport Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start relative">
          <div className="w-full max-w-4xl flex flex-col gap-4">
            {canvasMetaText && (
              <p className="text-xs text-slate-500 dark:text-neutral-400 bg-white dark:bg-[#1E1F22] p-3 rounded-xl border border-slate-200/80 dark:border-[#2B2D31]">
                {canvasMetaText}
              </p>
            )}

            {isChatReplyTask ? (
              <div className="bg-white dark:bg-[#1E1F22] rounded-2xl border border-slate-200 dark:border-[#2B2D31] p-6 shadow-3xs flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#2B2D31]">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Proposed Reply</span>
                    <span className="text-[11px] text-slate-400">To {activePersonName} on {activeSourceName}</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-[#18191C] p-4 rounded-xl text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap border border-slate-200/60 dark:border-neutral-800">
                  {editableProposalText}
                </div>
              </div>
            ) : activeFileObj?.originalMarkdown || activeFileObj?.updatedMarkdown ? (
              <div className="bg-white dark:bg-[#1E1F22] rounded-2xl border border-slate-200 dark:border-[#2B2D31] p-6 shadow-3xs">
                <InferredTaskDiffView file={activeFileObj} theme={theme} />
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1E1F22] rounded-2xl border border-slate-200 dark:border-[#2B2D31] p-6 shadow-3xs">
                <NativeViewer file={activeFileObj} theme={theme} />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="w-full px-6 py-3.5 bg-white/95 dark:bg-[#18191C]/95 backdrop-blur border-t border-slate-200/90 dark:border-[#2B2D31] flex items-center justify-between gap-4 shrink-0 shadow-lg">
          {/* Previous Task Arrow */}
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
            title="Previous task"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Steer Input Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSteerSubmit(steerInput);
            }}
            className="flex-1 max-w-2xl relative flex items-center"
          >
            <input
              type="text"
              value={steerInput}
              onChange={(e) => setSteerInput(e.target.value)}
              placeholder={getSteerPlaceholder()}
              className="w-full bg-slate-100 dark:bg-[#222428] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-neutral-500 rounded-full pl-4 pr-10 py-2.5 text-xs border border-slate-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              disabled={!steerInput.trim()}
              className="absolute right-1.5 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
            >
              <ArrowUp size={14} />
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReject}
              className="px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-medium text-xs border border-rose-200 dark:border-rose-800/60 flex items-center gap-1.5 transition cursor-pointer"
            >
              <X size={14} className="stroke-[2.5]" />
              <span>Decline</span>
            </button>

            <button
              onClick={handleApprove}
              className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-3xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check size={14} className="stroke-[2.5]" />
              <span>Approve</span>
            </button>

            {/* Next Task Arrow */}
            <button
              onClick={handleNext}
              disabled={activeIndex === orderedTodoItems.length - 1}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ml-1"
              title="Next task"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
