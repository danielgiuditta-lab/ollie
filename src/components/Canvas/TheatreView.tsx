import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  X,
  ChevronRight,
  Pencil,
  Plus,
  ArrowUp
} from 'lucide-react';
import { NativeViewer } from './NativeViewer';
import { InferredTaskDiffView } from './InferredTaskDiffView';
import { Composer } from '../Chat/Composer';
import { getFileIcon } from '../Shared/FileIcon';
import { getAvatarForPerson } from '../../utils/personAvatars';

interface TheatreTaskCellProps {
  item: any;
  isSelected: boolean;
  isSignedOff: boolean;
  onClick: () => void;
  onOpenSource: (urlOrName?: string) => void;
  onToggleComplete?: (taskId: string) => void;
  theme?: 'light' | 'dark';
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

export function TheatreTaskCell({ item, isSelected, isSignedOff, onClick, onOpenSource, onToggleComplete, theme = 'dark' }: TheatreTaskCellProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const titleText = item.titleCell || item.shortTitle || getAbbreviatedCellTitle(item, isSignedOff);

  const descText = isSignedOff
    ? (item.descriptionDone || item.description || item.action || 'Your tasks will be added to "My tasks" when notes are ready')
    : (item.description || item.descriptionDone || item.action || 'Gemini will write a professional follow-up email for you...');

  const resolvedSourceName = item.sourceName || item.workspace || 'Google Drive';
  const resolvedPersonName = item.personName || 'Maya Lin';
  const resolvedAvatar = item.personAvatar || getAvatarForPerson(resolvedPersonName);

  const isLight = theme === 'light';

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-[4px] cursor-pointer transition-all duration-150 select-none flex items-start justify-between gap-3 min-w-0 ${
        isLight
          ? isSelected ? 'bg-blue-50/80 text-blue-900 font-medium' : 'bg-slate-100/60 hover:bg-slate-100 text-slate-800'
          : isSelected ? 'bg-[#222428]' : 'bg-[#1E1F22] hover:bg-[#232529]'
      }`}
    >
      <div className={`flex-1 min-w-0 flex flex-col gap-1 ${isSignedOff && !isSelected ? 'opacity-30' : 'opacity-100'}`}>
        <h4 className={`text-[16px] leading-[22px] font-normal font-['Google_Sans','Google_Sans_Text',sans-serif] truncate ${
          isLight ? (isSelected ? 'text-blue-900 font-medium' : 'text-slate-800') : 'text-[#E3E3E3]'
        }`}>
          {titleText}
        </h4>

        <p className={`text-[14px] leading-[20px] font-normal font-['Google_Sans','Google_Sans_Text',sans-serif] truncate ${
          isLight ? 'text-slate-500' : 'text-[#E3E3E3]/70'
        }`}>
          {descText}
        </p>
      </div>

      {isSignedOff && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleComplete) onToggleComplete(item.id);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 self-center transition-colors cursor-pointer ${
            isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-[#28292D] hover:bg-[#33353B] text-slate-300'
          }`}
          title="Unmark as completed"
        >
          <Check size={16} className={`stroke-[2.5] ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
        </div>
      )}
    </div>
  );
}

interface TheatreViewProps {
  todoItems: any[];
  initialIndex?: number;
  activeIndexProp?: number;
  onIndexChange?: (index: number) => void;
  completedTaskIdsProp?: Set<string>;
  onCompletedTaskIdsChange?: (completedIds: Set<string>) => void;
  onClose: () => void;
  onSendMessage: (text: string, aiMode?: boolean, contextFiles?: any[]) => void;
  setActiveSidebar?: any;
  onChangeChatDockPosition?: (pos: 'side' | 'bottom') => void;
  onUpdateTaskStatus?: (taskId: string, status: 'done' | 'working' | 'rejected') => void;
  userProfile?: any;
  accessToken?: string | null;
  theme?: 'light' | 'dark';
  driveFiles?: any[];
  initialTaskListOpen?: boolean;
  embedded?: boolean;
}

export function TheatreView({
  todoItems = [],
  initialIndex = 0,
  activeIndexProp,
  onIndexChange,
  completedTaskIdsProp,
  onCompletedTaskIdsChange,
  onClose,
  onSendMessage,
  setActiveSidebar,
  onChangeChatDockPosition,
  onUpdateTaskStatus,
  userProfile,
  accessToken,
  theme = 'dark',
  driveFiles = [],
  initialTaskListOpen,
  embedded = false
}: TheatreViewProps) {
  const [localActiveIndex, setLocalActiveIndex] = useState(initialIndex);
  const [localCompletedTaskIds, setLocalCompletedTaskIds] = useState<Set<string>>(new Set());

  const activeIndex = activeIndexProp !== undefined ? activeIndexProp : localActiveIndex;
  const completedTaskIds = completedTaskIdsProp !== undefined ? completedTaskIdsProp : localCompletedTaskIds;

  const setActiveIndex = (newVal: number | ((prev: number) => number)) => {
    const computed = typeof newVal === 'function' ? newVal(activeIndex) : newVal;
    if (onIndexChange) onIndexChange(computed);
    setLocalActiveIndex(computed);
  };

  const setCompletedTaskIds = (newVal: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const computed = typeof newVal === 'function' ? newVal(completedTaskIds) : newVal;
    if (onCompletedTaskIdsChange) onCompletedTaskIdsChange(computed);
    setLocalCompletedTaskIds(computed);
  };

  const [steerInput, setSteerInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isTaskListOpen, setIsTaskListOpen] = useState(initialTaskListOpen !== undefined ? initialTaskListOpen : false);
  const [slideDirection, setSlideDirection] = useState(1);
  const [actionToast, setActionToast] = useState<{ text: 'Approved' | 'Declined' | 'Skipped'; key: number } | null>(null);

  const triggerActionToast = (text: 'Approved' | 'Declined' | 'Skipped') => {
    const key = Date.now();
    setActionToast({ text, key });
    setTimeout(() => {
      setActionToast(prev => (prev?.key === key ? null : prev));
    }, 750);
  };

  const cardVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.96,
    }),
  };

  // Group tasks for Left List maintaining fixed section structure matching inferred task list
  const approvalTasks = React.useMemo(() => todoItems.filter(t => t.category === 'needs_approval' || t.type === 'chat'), [todoItems]);
  const continueWorkingTasks = React.useMemo(() => todoItems.filter(t => t.category === 'needs_input' || t.category === 'continue_working' || (t.type !== 'chat' && t.type !== 'fyi' && t.category !== 'needs_approval' && t.category !== 'fyi')), [todoItems]);
  const fyiTasks = React.useMemo(() => todoItems.filter(t => t.type === 'fyi' || t.category === 'fyi'), [todoItems]);

  const orderedTodoItems = React.useMemo(() => {
    return [...approvalTasks, ...continueWorkingTasks, ...fyiTasks];
  }, [approvalTasks, continueWorkingTasks, fyiTasks]);

  // Sync initial index if todoItems changes
  useEffect(() => {
    if (initialIndex >= 0 && initialIndex < orderedTodoItems.length && activeIndexProp === undefined) {
      setLocalActiveIndex(initialIndex);
      setSteerInput('');
    }
  }, [initialIndex, orderedTodoItems.length, activeIndexProp]);

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

  const proposalTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (proposalTextareaRef.current) {
      proposalTextareaRef.current.style.height = 'auto';
      proposalTextareaRef.current.style.height = `${proposalTextareaRef.current.scrollHeight}px`;
    }
  }, [editableProposalText, isEditingProposal]);

  const activeSourceName = activeTask?.sourceName || activeTask?.workspace || 'Google Drive';
  const activePersonName = activeTask?.personName || 'Maya Lin';
  const activeAvatar = activeTask?.personAvatar || getAvatarForPerson(activePersonName);

  const canvasAvatarElement = (
    <img 
      src={activeAvatar} 
      alt={activePersonName} 
      className="w-4 h-4 rounded-full object-cover shrink-0"
      onError={(e) => { (e.target as HTMLImageElement).src = '/people/sarah_lin.jpg'; }}
    />
  );

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

  // Handle task approval (Yes)
  const handleApprove = () => {
    if (!activeTask) return;
    setSlideDirection(1);
    triggerActionToast('Approved');
    const nextCompleted = new Set(completedTaskIds);
    nextCompleted.add(activeTask.id);
    setCompletedTaskIds(nextCompleted);
    setSteerInput('');

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
    setSlideDirection(1);
    triggerActionToast('Declined');
    const nextCompleted = new Set(completedTaskIds);
    nextCompleted.add(activeTask.id);
    setCompletedTaskIds(nextCompleted);
    setSteerInput('');

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(activeTask.id, 'rejected');
    }

    // Advance to next task if available
    if (activeIndex < todoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setSlideDirection(-1);
    triggerActionToast('Skipped');
    setActiveIndex(prev => Math.max(0, prev - 1));
    setSteerInput('');
  };

  const handleNext = () => {
    setSlideDirection(1);
    triggerActionToast('Skipped');
    setActiveIndex(prev => Math.min(todoItems.length - 1, prev + 1));
    setSteerInput('');
  };

  const handleSelectIndex = (newIndex: number) => {
    setSlideDirection(newIndex > activeIndex ? 1 : -1);
    setActiveIndex(newIndex);
  };

  // Handle steer submission
  const handleSteerSubmit = (val: string) => {
    if (!val.trim()) return;

    setSlideDirection(1);
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

    // Advance to next task if available
    if (activeTask && activeIndex < todoItems.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  };

  // Handle unmarking task as complete (return to default in-queue state)
  const handleToggleComplete = (taskId: string) => {
    const nextCompleted = new Set(completedTaskIds);
    if (nextCompleted.has(taskId)) {
      nextCompleted.delete(taskId);
    }
    setCompletedTaskIds(nextCompleted);

    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(taskId, 'working');
    }
  };

  // Handle docking to side chat from Theatre Mode
  const handleDockToSide = () => {
    if (steerInput.trim()) {
      const fullMsg = activeTask 
        ? `Regarding task "${activeTask.title || activeTask.description}": ${steerInput.trim()}`
        : steerInput.trim();
      onSendMessage(fullMsg);
      setSteerInput('');
    }
    if (!embedded) {
      onClose();
    }
    if (onChangeChatDockPosition) {
      onChangeChatDockPosition('side');
    }
    if (setActiveSidebar) {
      setActiveSidebar('gemini');
    }
  };

  // Get contextual ghost text / placeholder for steering in theatre mode
  const getSteerPlaceholder = () => {
    if (!activeTask) return "Tell Ollie how to respond differently...";

    // For chat or messaging task
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

    // For file / document / slide / sheet tasks
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

  // Helper to open source link in a new tab
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

  // Determine native tool button label
  const getNativeToolLabel = () => {
    if (!activeTask) return 'Open in Drive';

    const sourceAndType = [
      activeTask.type,
      activeTask.sourceMimeType,
      activeTask.sourceName,
      activeTask.workspace,
    ].filter(Boolean).join(' ').toLowerCase();

    // Check workspace, type, and sourceName first
    if (sourceAndType.includes('chat') || sourceAndType.includes('message')) {
      return 'Open in Chat';
    }
    if (sourceAndType.includes('mail') || sourceAndType.includes('gmail') || sourceAndType.includes('email') || sourceAndType.includes('gemail') || sourceAndType.includes('inbox')) {
      return 'Open in Gmail';
    }
    if (sourceAndType.includes('calendar') || sourceAndType.includes('event') || sourceAndType.includes('schedule')) {
      return 'Open in Calendar';
    }
    if (sourceAndType.includes('meet')) {
      return 'Open in Meet';
    }
    if (sourceAndType.includes('slide') || sourceAndType.includes('presentation') || sourceAndType.includes('gslides') || sourceAndType.includes('ppt')) {
      return 'Open in Slides';
    }
    if (sourceAndType.includes('sheet') || sourceAndType.includes('csv') || sourceAndType.includes('excel') || sourceAndType.includes('gsheet') || sourceAndType.includes('spreadsheet')) {
      return 'Open in Sheets';
    }
    if (sourceAndType.includes('form')) {
      return 'Open in Forms';
    }
    if (sourceAndType.includes('doc') || sourceAndType.includes('word') || sourceAndType.includes('gdoc') || sourceAndType.includes('pdf') || sourceAndType.includes('essay') || sourceAndType.includes('brief')) {
      return 'Open in Docs';
    }

    // Fallback to checking title, description, links, and filesToLoad
    const targetUrl = activeTask.links?.[0]?.url || '';
    const fullTextToMatch = [
      sourceAndType,
      activeTask.title,
      activeTask.description,
      targetUrl,
      activeTask.filesToLoad?.[0]?.type,
      activeTask.filesToLoad?.[0]?.mimeType,
      activeTask.filesToLoad?.[0]?.name
    ].filter(Boolean).join(' ').toLowerCase();

    if (fullTextToMatch.includes('chat') || fullTextToMatch.includes('message')) {
      return 'Open in Chat';
    }
    if (fullTextToMatch.includes('mail') || fullTextToMatch.includes('gmail') || fullTextToMatch.includes('email') || fullTextToMatch.includes('gemail') || fullTextToMatch.includes('inbox')) {
      return 'Open in Gmail';
    }
    if (fullTextToMatch.includes('calendar') || fullTextToMatch.includes('event') || fullTextToMatch.includes('schedule')) {
      return 'Open in Calendar';
    }
    if (fullTextToMatch.includes('meet')) {
      return 'Open in Meet';
    }
    if (fullTextToMatch.includes('slide') || fullTextToMatch.includes('presentation') || fullTextToMatch.includes('gslides') || fullTextToMatch.includes('ppt')) {
      return 'Open in Slides';
    }
    if (fullTextToMatch.includes('sheet') || fullTextToMatch.includes('csv') || fullTextToMatch.includes('excel') || fullTextToMatch.includes('gsheet') || fullTextToMatch.includes('spreadsheet')) {
      return 'Open in Sheets';
    }
    if (fullTextToMatch.includes('form')) {
      return 'Open in Forms';
    }
    if (fullTextToMatch.includes('doc') || fullTextToMatch.includes('word') || fullTextToMatch.includes('gdoc') || fullTextToMatch.includes('pdf') || fullTextToMatch.includes('essay') || fullTextToMatch.includes('brief')) {
      return 'Open in Docs';
    }

    return 'Open in Drive';
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

    // Try matching drive file from driveFiles
    let matchingDriveFile = null;
    if (driveFiles && driveFiles.length > 0) {
      const taskDriveId = task.driveId || task.fileId;
      const taskNameLower = (task.sourceName || task.title || '').toLowerCase().trim();
      matchingDriveFile = driveFiles.find((f: any) => {
        if (taskDriveId && (f.id === taskDriveId || f.driveId === taskDriveId)) return true;
        if (taskNameLower && f.name && (f.name.toLowerCase().includes(taskNameLower) || taskNameLower.includes(f.name.toLowerCase()))) return true;
        return false;
      });
    }

    if (matchingDriveFile) {
      return {
        ...matchingDriveFile,
        id: matchingDriveFile.id || task.id,
        name: matchingDriveFile.name || task.sourceName || task.title || 'Document',
        title: task.title,
        description: task.description,
        content: matchingDriveFile.content || task.updatedMarkdown || task.description || '',
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
      content: task.updatedMarkdown || task.description || task.action || task.title || '',
      originalMarkdown: task.originalMarkdown,
      updatedMarkdown: task.updatedMarkdown,
      summaryOfChanges: task.summaryOfChanges,
      commentText: task.commentText,
      personName: task.personName,
      personAvatar: task.personAvatar
    };
  };

  const activeFileObject = getTaskFileObject(activeTask);

  const hasAnyDone = orderedTodoItems.some(t => completedTaskIds.has(t.id));

  const isLight = theme === 'light';

  return (
    <div className={`${embedded ? 'w-full h-full relative p-0' : 'fixed inset-0 z-50 p-4 md:p-6 pb-0 md:pb-0'} flex flex-col select-none font-sans animate-in fade-in duration-200 overflow-hidden ${
      isLight ? (embedded ? 'bg-white text-slate-900' : 'bg-[#F8F9FA] text-slate-900') : 'bg-black/85 backdrop-blur-xl text-white'
    }`}>
      {/* Top Header Bar matching design specs (only rendered when NOT embedded) */}
      {!embedded && (
        <div className="w-full shrink-0 flex items-center justify-between pb-3 px-1">
          {/* Left Title with Toggle Button & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTaskListOpen(!isTaskListOpen)}
              className={`p-1 transition-colors cursor-pointer flex items-center justify-center rounded-lg shrink-0 ${
                isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-neutral-300 hover:text-white hover:bg-white/10'
              }`}
              title={isTaskListOpen ? "Close task list" : "Open task list"}
            >
              <span 
                className="material-symbols-rounded select-none"
                style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1, 'wght' 700" }}
              >
                {isTaskListOpen ? 'left_panel_close' : 'left_panel_open'}
              </span>
            </button>
            <div className={`flex items-center gap-2 text-[17px] font-normal ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              <span 
                onClick={onClose}
                className={`cursor-pointer transition-colors font-normal ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-300 hover:text-white'}`}
              >
                Home
              </span>
              <ChevronRight size={18} className={isLight ? 'text-slate-400 shrink-0' : 'text-neutral-500 shrink-0'} />
              <span className={`font-medium ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Taskviewer <span className={`font-normal ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>({orderedTodoItems.length > 0 ? activeIndex + 1 : 0} of {orderedTodoItems.length})</span>
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenSourceChip(activeTask?.links?.[0]?.url || activeTask?.sourceName || activeTask?.title)}
              className={`h-9 px-4 rounded-full text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-800' : 'bg-black hover:bg-[#1E1F22] text-white'
              }`}
            >
              {getFileIcon(activeTask?.sourceName || activeTask?.title, activeTask?.sourceMimeType || activeTask?.type)}
              <span>{getNativeToolLabel()}</span>
            </button>
            <button
              onClick={onClose}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-800' : 'bg-black hover:bg-[#1E1F22] text-white'
              }`}
              title="Close Taskview"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Split Container */}
      <div className="flex-1 w-full min-h-0 flex gap-6 overflow-hidden">
        {/* Left Panel: Home Tasks Directory Card */}
        <AnimatePresence initial={false}>
          {isTaskListOpen && (
            <motion.div 
              key="theatre-task-list"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="shrink-0 h-full overflow-hidden"
            >
              <div className={`w-80 md:w-[380px] h-full rounded-[24px] p-4 flex flex-col overflow-y-auto select-text font-['Google_Sans','Google_Sans_Text',sans-serif] ${
                isLight ? 'bg-white text-slate-900' : 'bg-[#131314]/90 text-white backdrop-blur-md'
              }`}>
                {/* Needs your approval */}
                {approvalTasks.length > 0 && (
                  <div className="flex flex-col">
                    <h3 className={`text-lg font-normal pt-2 mb-3 px-4 text-left ${isLight ? 'text-slate-900' : 'text-[#E3E3E3]'}`}>
                      Needs your approval
                    </h3>
                    <div className="flex flex-col gap-[4px] rounded-[16px] overflow-hidden">
                      {approvalTasks.map((item) => {
                        const itemIndex = orderedTodoItems.findIndex(t => t.id === item.id);
                        const isSelected = itemIndex === activeIndex;
                        const isSignedOff = completedTaskIds.has(item.id);
                        return (
                          <TheatreTaskCell
                            key={item.id}
                            item={item}
                            isSelected={isSelected}
                            isSignedOff={isSignedOff}
                            onClick={() => handleSelectIndex(itemIndex)}
                            onOpenSource={handleOpenSourceChip}
                            onToggleComplete={handleToggleComplete}
                            theme={theme}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Continue working on... */}
                {continueWorkingTasks.length > 0 && (
                  <div className="flex flex-col">
                    <h3 className={`text-lg font-normal mb-3 px-4 text-left ${approvalTasks.length > 0 ? 'pt-6' : 'pt-2'} ${isLight ? 'text-slate-900' : 'text-[#E3E3E3]'}`}>
                      Continue working on...
                    </h3>
                    <div className="flex flex-col gap-[4px] rounded-[16px] overflow-hidden">
                      {continueWorkingTasks.map((item) => {
                        const itemIndex = orderedTodoItems.findIndex(t => t.id === item.id);
                        const isSelected = itemIndex === activeIndex;
                        const isSignedOff = completedTaskIds.has(item.id);
                        return (
                          <TheatreTaskCell
                            key={item.id}
                            item={item}
                            isSelected={isSelected}
                            isSignedOff={isSignedOff}
                            onClick={() => handleSelectIndex(itemIndex)}
                            onOpenSource={handleOpenSourceChip}
                            onToggleComplete={handleToggleComplete}
                            theme={theme}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* FYI Tasks ("For your FYI") */}
                {fyiTasks.length > 0 && (
                  <div className="flex flex-col">
                    <h3 className={`text-lg font-normal mb-3 px-4 text-left ${(approvalTasks.length > 0 || continueWorkingTasks.length > 0) ? 'pt-6' : 'pt-2'} ${isLight ? 'text-slate-900' : 'text-[#E3E3E3]'}`}>
                      For your FYI
                    </h3>
                    <div className="flex flex-col gap-[4px] rounded-[16px] overflow-hidden">
                      {fyiTasks.map((item) => {
                        const itemIndex = orderedTodoItems.findIndex(t => t.id === item.id);
                        const isSelected = itemIndex === activeIndex;
                        const isSignedOff = completedTaskIds.has(item.id);
                        return (
                          <TheatreTaskCell
                            key={item.id}
                            item={item}
                            isSelected={isSelected}
                            isSignedOff={isSignedOff}
                            onClick={() => handleSelectIndex(itemIndex)}
                            onOpenSource={handleOpenSourceChip}
                            onToggleComplete={handleToggleComplete}
                            theme={theme}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Area: Artifact View */}
        <div className="flex-1 h-full min-w-0 flex flex-col gap-0 overflow-hidden">
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <AnimatePresence mode="popLayout" custom={slideDirection} initial={false}>
              <motion.div
                key={activeTask?.id || activeIndex}
                custom={slideDirection}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  y: { duration: 0.85, ease: [0.25, 1, 0.5, 1] },
                  opacity: { duration: 0.75 },
                  scale: { duration: 0.75 }
                }}
                className={`w-full h-full ${embedded ? 'rounded-none' : 'rounded-[24px]'} overflow-y-auto flex flex-col p-8 select-text absolute inset-0 ${
                  isLight ? 'bg-white text-slate-900' : 'bg-[#131314]/90 text-white backdrop-blur-md'
                }`}
              >
                {isChatReplyTask ? (
                  <div className="w-full h-full flex flex-row items-center justify-between gap-6 md:gap-10 p-6 md:p-10 select-text font-['Google_Sans','Google_Sans_Text',sans-serif]">
                    {/* Left Column: Title, Meta, and Context Unit (Half of Canvas) */}
                    <div className="w-1/2 h-full flex flex-col items-start justify-center pr-4 md:pr-6 min-w-0">
                      {/* Title */}
                      <h3 className={`text-[32px] md:text-[36px] leading-[40px] font-normal tracking-normal font-['Google_Sans','Google_Sans_Text',sans-serif] ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {canvasTitleText}
                      </h3>

                      {/* Meta */}
                      <p className={`text-[20px] md:text-[22px] leading-[28px] font-normal mt-3 md:mt-4 font-['Google_Sans','Google_Sans_Text',sans-serif] ${
                        isLight ? 'text-slate-500' : 'text-[#9AA0A6]'
                      }`}>
                        {canvasMetaText}
                      </p>

                      {/* Context Unit (Chips) */}
                      <div className="flex items-center gap-2 flex-wrap mt-3.5 md:mt-4.5">
                        {activePersonName && (
                          <div 
                            onClick={() => handleOpenSourceChip(activePersonName)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-normal transition-colors cursor-pointer ${
                              isLight ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-800' : 'bg-[#28292D] hover:bg-[#33353B] text-[#E3E3E3]'
                            }`}
                          >
                            {canvasAvatarElement}
                            <span className="truncate max-w-[140px]">{activePersonName}</span>
                          </div>
                        )}

                        {activeSourceName && (
                          <div 
                            onClick={() => handleOpenSourceChip(activeSourceName)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-normal transition-colors cursor-pointer ${
                              isLight ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-800' : 'bg-[#28292D] hover:bg-[#33353B] text-[#E3E3E3]'
                            }`}
                          >
                            {getFileIcon(activeSourceName, activeTask?.sourceMimeType || activeTask?.type)}
                            <span className="truncate max-w-[160px]">{activeSourceName}</span>
                          </div>
                        )}

                        {activeTask?.links && activeTask.links.map((link: any, idx: number) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-normal transition-colors ${
                              isLight ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-blue-950/40 hover:bg-blue-900/50 text-blue-400'
                            }`}
                          >
                            {link.label || 'Open Link'}
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Chat UI (Half of Canvas) */}
                    <div className="w-1/2 h-full flex flex-col justify-center gap-6 pl-4 md:pl-6 min-w-0 select-text">
                      {/* Sender Message Row */}
                      <div className="flex items-start gap-3 justify-start max-w-[85%]">
                        {/* Sender Avatar */}
                        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                          {activeAvatar ? (
                            <img 
                              src={activeAvatar} 
                              alt={activePersonName} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                              {activePersonName.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Sender Bubble */}
                        <div className={`text-[17px] md:text-[18px] leading-[25px] md:leading-[26px] font-normal px-6 py-4 rounded-[26px] max-w-[70%] font-['Google_Sans','Google_Sans_Text',sans-serif] ${
                          isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#2D2E30] text-white/90 shadow-lg'
                        }`}>
                          {activeTask?.senderMessage || activeTask?.commentText || "hey dan, what was the conversation rate right after launch?"}
                        </div>
                      </div>

                      {/* Proposed Reply Row */}
                      <div className="flex items-end gap-3 justify-end max-w-[85%] ml-auto mt-2">
                        {/* Proposed Reply Bubble */}
                        <div className={`text-[17px] md:text-[18px] leading-[25px] md:leading-[26px] font-normal px-6 py-4 rounded-[26px] max-w-[85%] font-['Google_Sans','Google_Sans_Text',sans-serif] flex items-start justify-between gap-3 relative group ${
                          isLight ? 'bg-blue-50/80 text-blue-950' : 'bg-[#45474A] text-white shadow-lg'
                        }`}>
                          <textarea
                            ref={proposalTextareaRef}
                            value={editableProposalText}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditableProposalText(val);
                              if (activeTask) activeTask.proposedReply = val;
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onFocus={() => setIsEditingProposal(true)}
                            onBlur={() => {
                              if (activeTask) activeTask.proposedReply = editableProposalText;
                              setIsEditingProposal(false);
                            }}
                            style={{ height: 'auto', minHeight: '26px' }}
                            className={`w-full bg-transparent text-[17px] md:text-[18px] leading-[25px] md:leading-[26px] font-normal focus:outline-none resize-none overflow-hidden font-['Google_Sans','Google_Sans_Text',sans-serif] ${
                              isLight ? 'text-blue-950 placeholder-blue-400' : 'text-white placeholder-neutral-400'
                            }`}
                            placeholder="Type reply..."
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isEditingProposal) {
                                if (activeTask) activeTask.proposedReply = editableProposalText;
                                setIsEditingProposal(false);
                              } else {
                                setIsEditingProposal(true);
                              }
                            }}
                            className={`inline-flex items-center justify-center p-1 rounded-full transition-all cursor-pointer shrink-0 self-start mt-0.5 ${
                              isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-white/90 hover:text-white hover:bg-white/20'
                            }`}
                            title={isEditingProposal ? "Save proposed reply" : "Edit proposed reply"}
                          >
                            {isEditingProposal ? (
                              <Check size={20} className="stroke-[2.5] text-green-600 dark:text-green-400" />
                            ) : (
                              <Pencil size={20} className="stroke-[2.2]" />
                            )}
                          </button>
                        </div>

                        {/* User Avatar */}
                        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                          <img 
                            src={userProfile?.picture || '/people/sarah_lin.jpg'} 
                            alt="User" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute('src', '/people/sarah_lin.jpg');
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Title, Metaline (capped at 2 lines), and Sources Unit (50% max width when full screen/collapsed, 70% when open) */}
                    {activeTask && (
                      <div className={`w-full shrink-0 flex flex-col items-start ${isTaskListOpen ? 'max-w-[70%]' : 'max-w-[50%]'} mb-[40px] font-['Google_Sans','Google_Sans_Text',sans-serif] transition-all duration-300`}>
                        {/* Title: 32px with tightened line spacing (leading-[38px]) */}
                        <h3 className={`text-[32px] leading-[38px] font-normal ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {canvasTitleText}
                        </h3>

                        {/* Metaline: 20px with auto line height, capped at 2 lines */}
                        <p className={`text-[20px] leading-normal font-normal mt-2 line-clamp-2 overflow-hidden text-ellipsis ${isLight ? 'text-slate-500' : 'text-neutral-300'}`}>
                          {canvasMetaText}
                        </p>

                        {/* Sources below that */}
                        <div className="flex items-center gap-2 flex-wrap mt-4">
                          {activePersonName && (
                            <div 
                              onClick={() => handleOpenSourceChip(activePersonName)}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-normal transition-colors cursor-pointer ${
                                isLight ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-800' : 'bg-[#28292D] hover:bg-[#33353B] text-[#E3E3E3]'
                              }`}
                            >
                              {canvasAvatarElement}
                              <span className="truncate max-w-[140px]">{activePersonName}</span>
                            </div>
                          )}

                          {activeSourceName && (
                            <div 
                              onClick={() => handleOpenSourceChip(activeSourceName)}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-normal transition-colors cursor-pointer ${
                                isLight ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-800' : 'bg-[#28292D] hover:bg-[#33353B] text-[#E3E3E3]'
                              }`}
                            >
                              {getFileIcon(activeSourceName, activeTask?.sourceMimeType || activeTask?.type)}
                              <span className="truncate max-w-[160px]">{activeSourceName}</span>
                            </div>
                          )}

                          {activeTask?.links && activeTask.links.map((link: any, idx: number) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-normal transition-colors ${
                                isLight ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-blue-950/40 hover:bg-blue-900/50 text-blue-400'
                              }`}
                            >
                              {link.label || 'Open Link'}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Artifacts in Diff View Filling Remaining Canvas Height */}
                    {activeFileObject ? (
                      <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
                        {activeFileObject.originalMarkdown || activeFileObject.updatedMarkdown ? (
                          <InferredTaskDiffView 
                            file={activeFileObject}
                            theme="light"
                            className="w-full h-full flex flex-col items-stretch justify-start bg-transparent p-0 overflow-hidden"
                            hideFooterText={true}
                          />
                        ) : (
                          <NativeViewer
                            file={activeFileObject}
                            hideHeader={true}
                            mode="preview"
                            theme="light"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm font-medium">
                        No artifact preview available for this task.
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Animated Action Toast Overlay (Approved / Declined / Skipped) */}
            <AnimatePresence>
              {actionToast && (
                <motion.div
                  key={actionToast.key}
                  initial={{ opacity: 0, scale: 0.85, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -12 }}
                  transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                  className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                >
                  <div className={`font-['Google_Sans','Google_Sans_Text',sans-serif] text-[32px] leading-none font-normal p-4 px-8 rounded-full flex items-center gap-3 ${
                    isLight ? 'bg-slate-900 text-white' : 'bg-black/95 text-white border border-white/10 backdrop-blur-md'
                  }`}>
                    {actionToast.text === 'Approved' && (
                      <Check className="w-8 h-8 text-[#34A853] stroke-[2.5] shrink-0" />
                    )}
                    {actionToast.text === 'Declined' && (
                      <X className="w-8 h-8 text-[#EA4335] stroke-[2.5] shrink-0" />
                    )}
                    {actionToast.text === 'Skipped' && (
                      <ArrowRight className="w-8 h-8 text-white stroke-[2] shrink-0" />
                    )}
                    <span>{actionToast.text}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Controls Dock */}
          <div className="w-full h-[88px] shrink-0 flex items-center justify-center gap-2 relative z-20">
            {/* Previous Task Arrow Button */}
            <button
              onClick={handlePrev}
              disabled={activeIndex === 0}
              className={`w-12 h-12 rounded-full active:scale-95 flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 ${
                isLight ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-800' : 'bg-[#121316] hover:bg-[#1C1D21] text-white'
              }`}
              title="Previous task"
            >
              <ArrowLeft className={`w-5 h-5 stroke-[2] ${isLight ? 'text-slate-800' : 'text-white'}`} />
            </button>

            {/* Reject / Decline Button */}
            <button
              onClick={handleReject}
              className={`w-14 h-14 rounded-full active:scale-95 flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                isLight ? 'bg-slate-100 hover:bg-slate-200/80 text-rose-600' : 'bg-[#121316] hover:bg-[#1C1D21]'
              }`}
              title="Decline"
            >
              <X className="w-6 h-6 text-[#EA4335] stroke-[2.5]" />
            </button>

            {/* Center Steer Input Pill */}
            <div 
              className={`rounded-full flex items-center gap-3 transition-all duration-300 ease-in-out ${
                isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#121316] text-white backdrop-blur-md'
              } ${
                (isInputFocused || steerInput.trim().length > 0)
                  ? 'h-[72px] w-[340px] md:w-[620px] px-4' 
                  : 'h-14 w-[160px] px-4 cursor-pointer'
              }`}
              onClick={() => {
                const el = document.getElementById('theatre-steer-input');
                if (el) el.focus();
              }}
            >
              {/* Left Plus Attachment Button */}
              {(isInputFocused || steerInput.trim().length > 0) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition shrink-0 cursor-pointer border-none outline-none ${
                    isLight ? 'hover:bg-slate-200/70 text-slate-500 hover:text-slate-800' : 'hover:bg-white/10 text-neutral-400 hover:text-white'
                  }`}
                  title="Add attachment or context"
                >
                  <Plus size={20} className="stroke-[2.5]" />
                </button>
              )}

              {/* Text Input */}
              <input
                id="theatre-steer-input"
                type="text"
                value={steerInput}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onChange={(e) => setSteerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (steerInput.trim()) {
                      handleSteerSubmit(steerInput);
                      setSteerInput('');
                    } else {
                      handleApprove();
                    }
                  }
                }}
                placeholder={(isInputFocused || steerInput.trim().length > 0) ? getSteerPlaceholder() : "Do differently..."}
                className={`w-full bg-transparent text-[15px] font-normal focus:outline-none truncate px-1 border-none ring-0 ${
                  isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-neutral-400'
                }`}
              />

              {/* Right Action Buttons */}
              {(isInputFocused || steerInput.trim().length > 0) && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDockToSide();
                    }}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer border-none outline-none ${
                      isLight ? 'hover:bg-slate-200/70 text-slate-500 hover:text-slate-800' : 'hover:bg-white/10 text-neutral-400 hover:text-white'
                    }`}
                    title="Snap to side chat"
                  >
                    <span className="material-symbols-rounded text-[22px] select-none">dock_to_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (steerInput.trim()) {
                        handleSteerSubmit(steerInput);
                        setSteerInput('');
                      } else {
                        handleApprove();
                      }
                    }}
                    disabled={!steerInput.trim()}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition border-none outline-none ${
                      steerInput.trim()
                        ? 'bg-[#0B57D0] text-white hover:bg-blue-600 cursor-pointer'
                        : isLight ? 'bg-slate-200/60 text-slate-400 cursor-not-allowed' : 'bg-white/10 text-neutral-500 cursor-not-allowed'
                    }`}
                    title={steerInput.trim() ? "Submit steer" : "Send"}
                  >
                    <ArrowUp size={18} className="stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>

            {/* Approve / Accept Button */}
            <button
              onClick={() => {
                if (steerInput.trim()) {
                  handleSteerSubmit(steerInput);
                  setSteerInput('');
                } else {
                  handleApprove();
                }
              }}
              className={`w-14 h-14 rounded-full active:scale-95 flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                isLight ? 'bg-slate-100 hover:bg-slate-200/80' : 'bg-[#121316] hover:bg-[#1C1D21]'
              }`}
              title={steerInput.trim() ? "Submit steer" : "Accept"}
            >
              <Check className="w-6 h-6 text-[#34A853] stroke-[2.5]" />
            </button>

            {/* Next Task Arrow Button */}
            <button
              onClick={handleNext}
              disabled={activeIndex === todoItems.length - 1}
              className={`w-12 h-12 rounded-full active:scale-95 flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0 ${
                isLight ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-800' : 'bg-[#121316] hover:bg-[#1C1D21] text-white'
              }`}
              title="Next task"
            >
              <ArrowRight className={`w-5 h-5 stroke-[2] ${isLight ? 'text-slate-800' : 'text-white'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
