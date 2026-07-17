import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2, Pin, Plus, Columns3, LayoutGrid, List } from 'lucide-react';
import { AppView } from './AppView';
import { NativeViewer } from './NativeViewer';
import { InferredTaskCardExperimental } from '../Chat/InferredTaskCardExperimental';
import { Card } from '../Shared/Card';
import { CardHeader } from '../Shared/CardHeader';
import { NullTitle } from '../Shared/NullTitle';
import { AddWidgetModal } from './AddWidgetModal';

interface SpaceDashboardProps {
  spaceId: string;
  spaceName: string;
  pinnedArtifactIds?: string[];
  sandboxFiles: any[];
  onSelectArtifact: (file: any) => void;
  onRemovePin: (fileId: string) => void;
  onPinArtifact?: (file: any) => void;
  onReorderPins: (newOrderedIds: string[]) => void;
  onCreateArtifact?: (type: 'doc' | 'slide' | 'sheet' | 'pix' | 'site' | 'upload') => void;
  sandboxUrl?: string;
  envId?: string | null;
  theme?: 'light' | 'dark';
  todoItems?: any[];
  getFileIcon?: (mimeType?: string) => string;
  onProactiveTaskClick?: (item: any) => void;
  setSandboxFiles?: (files: any[]) => void;
  setSelectedFile?: (file: any) => void;
  setProjectName?: (name: string) => void;
  setViewState?: (state: any) => void;
  setActiveSidebar?: (sidebar: any) => void;
  userProfile?: any;
}

export function SpaceDashboardExperimental({
  spaceId,
  spaceName,
  pinnedArtifactIds = [],
  sandboxFiles = [],
  onSelectArtifact,
  onRemovePin,
  onPinArtifact,
  onReorderPins,
  onCreateArtifact,
  sandboxUrl,
  envId,
  theme = 'light',
  todoItems,
  getFileIcon,
  onProactiveTaskClick,
  setSandboxFiles,
  setSelectedFile,
  setProjectName,
  setViewState,
  setActiveSidebar,
  userProfile
}: SpaceDashboardProps) {
  const [cardWidths, setCardWidths] = useState<Record<string, number>>({});
  const [activeMenuCardId, setActiveMenuCardId] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'left' | 'right' | 'top' | 'bottom' | null>(null);
  const [dashboardLayoutMode, setDashboardLayoutMode] = useState<'auto' | 'rows' | 'cols'>('auto');
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  
  // Resizing state
  const resizingRef = useRef<{
    activeId: string;
    adjacentId: string | null;
    startX: number;
    startWidthActive: number;
    startWidthAdjacent: number;
    containerWidth: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // ResizeObserver to detect dashboard container width
  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Resolve synthetic or real To-dos artifact
  const hasTodoCard = Boolean(todoItems && todoItems.length > 0);
  const todoArtifact = sandboxFiles.find(f => f && (f.isInferredTask || f.name?.toLowerCase() === 'inferred_tasks.json' || f.id === 'todo-card')) || {
    id: 'todo-card',
    name: 'inferred_tasks.json',
    type: 'code',
    mimeType: 'application/json',
    isInferredTask: true,
    taskType: 'inferred'
  };

  const availableWidgets = React.useMemo(() => {
    const list: any[] = [];
    const seenIds = new Set<string>();

    if (hasTodoCard) {
      const todoId = todoArtifact.id || 'todo-card';
      seenIds.add(todoId);
      list.push(todoArtifact);
    }

    sandboxFiles.forEach(file => {
      if (!file) return;
      const isTodoFile = file.id === 'todo-card' || file.isInferredTask || file.name === 'inferred_tasks.json';
      if (isTodoFile && !hasTodoCard) return;
      const fileId = file.id || file.driveId || file.name;
      if (!fileId || seenIds.has(fileId)) return;
      seenIds.add(fileId);
      list.push(file);
    });

    return list;
  }, [sandboxFiles, hasTodoCard, todoArtifact]);

  const isHomeDashboard = spaceId === 'home' || spaceId === 'home_guest' || String(spaceId).toLowerCase().startsWith('home_') || String(spaceId).toLowerCase().startsWith('home-') || String(spaceId).toLowerCase() === 'home dashboard';
  const pinnedFiles = pinnedArtifactIds
    .map(id => {
      const isTodoId = id === 'todo-card' || id === 'inferred-tasks' || String(id).toLowerCase().includes('todo') || String(id).toLowerCase().includes('inferred');
      if (isTodoId) {
        return (hasTodoCard && !isHomeDashboard) ? todoArtifact : null;
      }
      return sandboxFiles.find(f => f && (
        f.id === id || 
        f.driveId === id ||
        (f.id && id && String(f.id).toLowerCase() === String(id).toLowerCase()) ||
        (f.name && id && (String(id).toLowerCase().endsWith('-' + f.name.toLowerCase()) || String(id).toLowerCase().endsWith('_' + f.name.toLowerCase()) || String(id).toLowerCase() === f.name.toLowerCase()))
      ));
    })
    .filter(Boolean);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuCardId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Proportional resize mouse listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { activeId, adjacentId, startX, startWidthActive, startWidthAdjacent, containerWidth } = resizingRef.current;
      const deltaX = e.clientX - startX;
      const deltaPercentage = (deltaX / containerWidth) * 100;

      let newActive = Math.max(20, Math.min(80, startWidthActive + deltaPercentage));
      let newAdjacent = adjacentId ? Math.max(20, Math.min(80, startWidthAdjacent - deltaPercentage)) : null;

      if (adjacentId && newAdjacent) {
        setCardWidths(prev => ({
          ...prev,
          [activeId]: newActive,
          [adjacentId]: newAdjacent!
        }));
      } else {
        setCardWidths(prev => ({
          ...prev,
          [activeId]: newActive
        }));
      }
    };

    const handleMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = (e: React.MouseEvent, activeId: string, index: number, direction: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    document.body.style.cursor = 'col-resize';

    const containerWidth = containerRef.current?.clientWidth || 1000;
    const adjacentIndex = direction === 'right' ? index + 1 : index - 1;
    const adjacentFile = pinnedFiles[adjacentIndex];
    const adjacentId = adjacentFile ? (adjacentFile.id || adjacentFile.driveId) : null;

    const startWidthActive = cardWidths[activeId] || (100 / Math.min(pinnedFiles.length, 2));
    const startWidthAdjacent = adjacentId ? (cardWidths[adjacentId] || (100 / Math.min(pinnedFiles.length, 2))) : 50;

    resizingRef.current = {
      activeId,
      adjacentId,
      startX: e.clientX,
      startWidthActive,
      startWidthAdjacent,
      containerWidth
    };
  };

  const resolvePinId = (cardId: string): string => {
    if (!cardId) return '';
    if (pinnedArtifactIds.includes(cardId)) {
      return cardId;
    }
    const isTodo = cardId === 'todo-card' || cardId === 'inferred-tasks' || cardId.toLowerCase().includes('todo') || cardId.toLowerCase().includes('inferred');
    if (isTodo) {
      const todoMatch = pinnedArtifactIds.find(id => id === 'todo-card' || id === 'inferred-tasks' || String(id).toLowerCase().includes('todo') || String(id).toLowerCase().includes('inferred'));
      if (todoMatch) return todoMatch;
    }
    const matchedFile = [...sandboxFiles, todoArtifact].find(f => f && (
      f.id === cardId || 
      f.driveId === cardId || 
      f.name === cardId ||
      (f.id && String(f.id).toLowerCase() === String(cardId).toLowerCase())
    ));
    if (matchedFile) {
      const pinMatch = pinnedArtifactIds.find(id => 
        id === matchedFile.id ||
        id === matchedFile.driveId ||
        id === matchedFile.name ||
        (matchedFile.id && String(id).toLowerCase() === String(matchedFile.id).toLowerCase()) ||
        (matchedFile.name && (String(id).toLowerCase().endsWith('-' + matchedFile.name.toLowerCase()) || String(id).toLowerCase().endsWith('_' + matchedFile.name.toLowerCase()) || String(id).toLowerCase() === matchedFile.name.toLowerCase()))
      );
      if (pinMatch) return pinMatch;
    }
    return cardId;
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedCardId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggedCardId || activeMenuCardId;
    if (id !== sourceId) {
      setDragOverCardId(id);
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const offsetX = e.clientX - rect.left;
      const relY = Math.max(0, Math.min(1, offsetY / rect.height));
      const relX = Math.max(0, Math.min(1, offsetX / rect.width));

      const distLeft = relX;
      const distRight = 1 - relX;
      const distTop = relY;
      const distBottom = 1 - relY;

      const minHoriz = Math.min(distLeft, distRight);
      const minVert = Math.min(distTop, distBottom);

      if (minHoriz < minVert) {
        if (distLeft < distRight) {
          setDragOverPosition('left');
        } else {
          setDragOverPosition('right');
        }
      } else {
        if (distTop < distBottom) {
          setDragOverPosition('top');
        } else {
          setDragOverPosition('bottom');
        }
      }
    }
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = draggedCardId || activeMenuCardId;
    if (!sourceId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;

    if (relX < 0.15) {
      setDragOverCardId('container-left');
      setDragOverPosition('left');
    } else if (relX > 0.85) {
      setDragOverCardId('container-right');
      setDragOverPosition('right');
    } else {
      setDragOverCardId('container-cols');
      setDragOverPosition('right');
    }
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = draggedCardId || activeMenuCardId;
    if (!sourceId) {
      setDragOverCardId(null);
      setDragOverPosition(null);
      return;
    }

    const sourcePin = resolvePinId(sourceId);
    let newOrder = [...pinnedArtifactIds];
    let sourceIndex = newOrder.indexOf(sourcePin);

    if (sourceIndex === -1) {
      newOrder = pinnedFiles.map(f => resolvePinId(f.id || f.driveId || f.name));
      sourceIndex = newOrder.indexOf(sourcePin);
    }

    if (sourceIndex !== -1) {
      newOrder.splice(sourceIndex, 1);
    }

    if (dragOverCardId === 'container-left') {
      newOrder.unshift(sourcePin);
    } else {
      newOrder.push(sourcePin);
    }

    onReorderPins(newOrder);
    setDashboardLayoutMode('cols');

    setDragOverCardId(null);
    setDragOverPosition(null);
    setDraggedCardId(null);
    setActiveMenuCardId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggedCardId || activeMenuCardId;
    if (!sourceId || sourceId === targetId) {
      setDragOverCardId(null);
      setDragOverPosition(null);
      return;
    }

    const sourcePin = resolvePinId(sourceId);
    const targetPin = resolvePinId(targetId);

    let newOrder = [...pinnedArtifactIds];
    let sourceIndex = newOrder.indexOf(sourcePin);
    let targetIndex = newOrder.indexOf(targetPin);

    if (sourceIndex === -1 || targetIndex === -1) {
      newOrder = pinnedFiles.map(f => resolvePinId(f.id || f.driveId || f.name));
      sourceIndex = newOrder.indexOf(sourcePin);
      targetIndex = newOrder.indexOf(targetPin);
    }

    if (sourceIndex !== -1) {
      newOrder.splice(sourceIndex, 1);
      targetIndex = newOrder.indexOf(targetPin);
      if (targetIndex !== -1) {
        if (dragOverPosition === 'right' || dragOverPosition === 'bottom') {
          targetIndex += 1;
        }
        newOrder.splice(targetIndex, 0, sourcePin);
      } else {
        newOrder.push(sourcePin);
      }
      onReorderPins(newOrder);
    }

    if (dragOverPosition === 'top' || dragOverPosition === 'bottom') {
      setDashboardLayoutMode('rows');
    } else if (dragOverPosition === 'left' || dragOverPosition === 'right') {
      setDashboardLayoutMode('cols');
    }

    setDragOverCardId(null);
    setDragOverPosition(null);
    setDraggedCardId(null);
    setActiveMenuCardId(null);
  };

  const isTwoColumns = dashboardLayoutMode === 'cols' || (dashboardLayoutMode === 'auto' && pinnedFiles.length >= 2);
  const isNarrowDashboardCard = isTwoColumns || (containerWidth > 0 && (containerWidth < 900 || (containerWidth / Math.max(1, pinnedFiles.length)) < 520));

  let gridLayoutClass = "grid-cols-1 md:grid-cols-2 md:grid-rows-1 auto-rows-fr";
  if (dashboardLayoutMode === 'rows') {
    gridLayoutClass = "grid-cols-1 auto-rows-fr";
  } else if (dashboardLayoutMode === 'cols') {
    gridLayoutClass = "grid-cols-1 md:grid-cols-2 md:grid-rows-1 auto-rows-fr";
  } else {
    if (pinnedFiles.length === 1) {
      gridLayoutClass = "grid-cols-1 auto-rows-fr";
    } else if (pinnedFiles.length === 2) {
      gridLayoutClass = "grid-cols-1 md:grid-cols-2 md:grid-rows-1 auto-rows-fr";
    } else if (pinnedFiles.length <= 4) {
      gridLayoutClass = "grid-cols-1 md:grid-cols-2 md:grid-rows-2 auto-rows-fr";
    } else {
      gridLayoutClass = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr";
    }
  }

  const renderCard = (file: any, idx: number) => {
    if (!file) return null;
    const fileId = file.id || file.driveId || 'file-' + idx;
    const isTodo = file.isInferredTask || file.id === 'todo-card' || file.name === 'inferred_tasks.json' || file.name === 'To-dos';
    const isHtml = !isTodo && file.name && (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase() === 'index.html');
    const isDragOver = dragOverCardId === fileId;
    const isSelected = activeMenuCardId === fileId || draggedCardId === fileId;
    let todoTitle = 'To-dos';
    if (isTodo && file.content) {
      try {
        const parsed = JSON.parse(file.content);
        if (parsed.title) todoTitle = parsed.title;
      } catch (e) {}
    }
    let cardTitle = file.name;
    if (isTodo) {
      cardTitle = todoTitle;
    } else if (isHtml) {
      let extractedTitle = file.title;
      if (!extractedTitle && file.content && typeof file.content === 'string') {
        const titleMatch = file.content.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1] && titleMatch[1].trim() !== 'App' && titleMatch[1].trim() !== 'My Web Workspace') {
          extractedTitle = titleMatch[1].trim();
        }
      }
      if (!extractedTitle && file.chatName && file.chatName !== 'Custom Tool' && file.chatName !== 'New Site Workspace') {
        extractedTitle = file.chatName;
      }
      if (extractedTitle) {
        cardTitle = extractedTitle;
      } else if (file.name) {
        const cleaned = file.name.replace(/\.(html|htm)$/i, '');
        cardTitle = (cleaned.toLowerCase() === 'index' || cleaned.toLowerCase() === 'custom tool') ? 'Custom Tool' : cleaned;
      }
    }

    const isGhost = draggedCardId === fileId;

    return (
      <div 
        key={fileId} 
        className="card-container-item relative w-full h-full min-h-[340px] flex flex-col min-w-0"
        onDragOver={(e) => handleDragOver(e, fileId)}
        onDragLeave={() => {
          setDragOverCardId(null);
          setDragOverPosition(null);
        }}
        onDrop={(e) => handleDrop(e, fileId)}
      >
        {/* Dynamic Destination Line Indicators */}
        {isDragOver && dragOverPosition === 'top' && (
          <div className="absolute -top-3.5 left-0 right-0 h-1.5 bg-[#3186FF] rounded-full shadow-[0_0_12px_rgba(49,134,255,0.9)] z-40 pointer-events-none animate-pulse" />
        )}
        {isDragOver && dragOverPosition === 'bottom' && (
          <div className="absolute -bottom-3.5 left-0 right-0 h-1.5 bg-[#3186FF] rounded-full shadow-[0_0_12px_rgba(49,134,255,0.9)] z-40 pointer-events-none animate-pulse" />
        )}
        {isDragOver && dragOverPosition === 'left' && (
          <div className="absolute -left-3.5 top-0 bottom-0 w-1.5 bg-[#3186FF] rounded-full shadow-[0_0_12px_rgba(49,134,255,0.9)] z-40 pointer-events-none animate-pulse" />
        )}
        {isDragOver && dragOverPosition === 'right' && (
          <div className="absolute -right-3.5 top-0 bottom-0 w-1.5 bg-[#3186FF] rounded-full shadow-[0_0_12px_rgba(49,134,255,0.9)] z-40 pointer-events-none animate-pulse" />
        )}
        <Card
          theme={theme}
          isSelected={isSelected}
          isGhost={isGhost}
          isDragOver={isDragOver}
          className="w-full h-full flex-1 flex flex-col overflow-hidden"
          header={
            <div 
              draggable
              onDragStart={(e) => handleDragStart(e, fileId)}
              className="cursor-grab active:cursor-grabbing w-full"
            >
              <CardHeader
                title={cardTitle}
                count={isTodo && todoItems && todoItems.length > 0 ? todoItems.length : undefined}
                onTitleClick={(e) => {
                  e.stopPropagation();
                  onSelectArtifact(file);
                }}
                titleTooltip="Click to open artifact authoring chat"
                theme={theme}
                actions={
                  <div className="relative">
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, fileId)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuCardId(activeMenuCardId === fileId ? null : fileId);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? 'text-[#3186FF] bg-blue-50 dark:bg-blue-950/50'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-neutral-800'
                      }`}
                      title="Drag to reorder or click for options"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuCardId === fileId && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-9 w-36 rounded-xl bg-white dark:bg-[#2B2D31] border border-slate-200 dark:border-white/10 shadow-xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          onClick={() => {
                            setActiveMenuCardId(null);
                            onSelectArtifact(file);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuCardId(null);
                            onRemovePin(fileId);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          }
        >
          {/* Interactive Live Viewport */}
          <div className={`flex-1 w-full h-full relative overflow-hidden bg-slate-50/30 dark:bg-black/20 ${draggedCardId ? 'pointer-events-none' : 'pointer-events-auto select-auto'}`}>
            <div className="absolute inset-0 w-full h-full">
              {isTodo ? (
                isHtml ? (
                  <AppView
                    sandboxUrl={file.sandboxUrl || sandboxUrl}
                    files={sandboxFiles}
                    envId={file.envId || file.activeSpaceId || file.chatId || envId}
                    selectedFile={file}
                    theme={theme}
                  />
                ) : (
                  <div className="w-full h-full overflow-y-auto p-4 flex flex-col gap-[4px]">
                    {todoItems && todoItems.map((item) => (
                      <InferredTaskCardExperimental 
                        key={item.id}
                        item={item}
                        getFileIcon={getFileIcon || (() => '')}
                        onClick={() => {
                          if (onProactiveTaskClick) {
                            onProactiveTaskClick(item);
                          } else {
                            if (item.filesToLoad && setSandboxFiles && setSelectedFile) {
                              setSandboxFiles(item.filesToLoad);
                              setSelectedFile(item.filesToLoad[0]);
                            } else if (setSandboxFiles && setSelectedFile) {
                              setSandboxFiles([]);
                              setSelectedFile(null);
                            }
                            if (setProjectName) {
                              setProjectName(item.workspace.split(' · ')[0]);
                            }
                            if (setViewState) {
                              setViewState('files');
                            }
                            if (setActiveSidebar) {
                              setActiveSidebar('gemini');
                            }
                          }
                        }}
                      />
                    ))}
                  </div>
                )
              ) : isHtml ? (
                <AppView
                  sandboxUrl={file.sandboxUrl || sandboxUrl}
                  files={sandboxFiles}
                  envId={file.envId || file.activeSpaceId || file.chatId || envId}
                  selectedFile={file}
                  theme={theme}
                />
              ) : (
                <NativeViewer
                  file={file}
                  hideHeader={true}
                  mode="preview"
                  theme={theme}
                />
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  if (isHomeDashboard) {
    console.log("[DEBUG] SpaceDashboardExperimental isHomeDashboard todoItems:", todoItems);
    
    // Segment items based on category
    const needsApprovalTasks = (todoItems || []).filter(item => 
      item.category === 'needs_approval' || 
      (item.category === undefined && (
        (item.title || '').toLowerCase().includes('rsvp') || 
        (item.title || '').toLowerCase().includes('approve') ||
        (item.title || '').toLowerCase().includes('confirm') ||
        (item.description || '').toLowerCase().includes('rsvp') ||
        (item.description || '').toLowerCase().includes('approve') ||
        (item.description || '').toLowerCase().includes('confirm')
      ))
    );

    const needsInputTasks = (todoItems || []).filter(item => 
      item.category === 'needs_input' ||
      (item.category === undefined && !needsApprovalTasks.includes(item))
    );

    const fyiTasks = (todoItems || []).filter(item => 
      item.category === 'fyi'
    );

    const name = userProfile?.given_name || userProfile?.name || 'User';

    return (
      <div className="w-full h-full overflow-y-auto bg-white dark:bg-[#111214] select-text">
        <div className="max-w-4xl mx-auto px-12 py-12 flex flex-col gap-8">
          {/* Welcome Greeting */}
          <div className="flex flex-col text-left gap-1 mt-2">
            <h1 className="text-[45px] leading-[52px] font-normal font-sans text-slate-900 dark:text-white">
              Welcome back, {name}.
            </h1>
            <p className="text-[15px] text-slate-650 dark:text-neutral-300 font-sans">
              Your next meeting, <span className="font-semibold">"New Drive"</span>, starts in 10 minutes. <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Join Call.</a>
            </p>
          </div>

          {/* Section 1: Needs your approval */}
          {needsApprovalTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-[20px] font-medium text-slate-800 dark:text-neutral-200 mt-2 mb-1">
                Needs your approval...
              </h2>
              <div className="w-full flex flex-col gap-[4px] py-1 bg-transparent">
                {needsApprovalTasks.map((item) => (
                  <InferredTaskCardExperimental
                    key={item.id}
                    item={item}
                    sectionType="decision"
                    onClick={() => {
                      if (onProactiveTaskClick) {
                        onProactiveTaskClick(item);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Continue working on */}
          {needsInputTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-[20px] font-medium text-slate-800 dark:text-neutral-200 mt-2 mb-1">
                Continue working on...
              </h2>
              <div className="w-full flex flex-col gap-[4px] py-1 bg-transparent">
                {needsInputTasks.map((item) => (
                  <InferredTaskCardExperimental
                    key={item.id}
                    item={item}
                    sectionType="generative"
                    onClick={() => {
                      if (onProactiveTaskClick) {
                        onProactiveTaskClick(item);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 3: For your information */}
          {fyiTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-[20px] font-medium text-slate-800 dark:text-neutral-200 mt-2 mb-1">
                For your information...
              </h2>
              <div className="w-full flex flex-col gap-[4px] py-1 bg-transparent">
                {fyiTasks.map((item) => (
                  <InferredTaskCardExperimental
                    key={item.id}
                    item={item}
                    sectionType="fyi"
                    onClick={() => {
                      if (onProactiveTaskClick) {
                        onProactiveTaskClick(item);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Pinned Widgets / Cards */}
          {pinnedFiles.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-[20px] font-medium text-slate-800 dark:text-neutral-200 mt-2 mb-1 text-left font-sans">
                Pinned
              </h2>
              <div className={`grid ${gridLayoutClass} gap-4 items-stretch justify-stretch relative`}>
                {pinnedFiles.map((file, idx) => renderCard(file, idx))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const totalCardsCount = pinnedFiles.length;

  if (totalCardsCount === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-transparent text-center select-none animate-in fade-in duration-300">
        <div 
          onClick={() => {
            if (availableWidgets.length === 0) {
              if (onCreateArtifact) {
                onCreateArtifact('site');
              }
            } else {
              setIsWidgetModalOpen(true);
            }
          }}
          className="group flex flex-col items-center justify-center cursor-pointer select-none"
        >
          <NullTitle theme={theme}>
            Add a Widget <br /> to your Dashboard
          </NullTitle>

          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 group-hover:scale-110 transition-transform duration-200 flex items-center justify-center text-[#3186FF] shadow-2xs mt-6">
            <Plus size={24} className="stroke-[2.5px]" />
          </div>
        </div>

        {isWidgetModalOpen && (
          <AddWidgetModal
            isOpen={isWidgetModalOpen}
            onClose={() => setIsWidgetModalOpen(false)}
            availableWidgets={availableWidgets}
            pinnedArtifactIds={pinnedArtifactIds}
            onPinWidget={(file) => {
              if (onPinArtifact) onPinArtifact(file);
            }}
            onUnpinWidget={onRemovePin}
            onCreateCustomTool={() => {
              if (onCreateArtifact) onCreateArtifact('site');
            }}
            theme={theme}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 relative select-none">
      <div 
        ref={containerRef}
        onDragOver={handleContainerDragOver}
        onDragLeave={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setDragOverCardId(null);
            setDragOverPosition(null);
          }
        }}
        onDrop={handleContainerDrop}
        className={`w-full flex-1 grid ${gridLayoutClass} gap-4 px-4 sm:px-6 pt-2 pb-6 overflow-y-auto items-stretch justify-stretch relative`}
      >
        {/* Dynamic Container Side Indicators */}
        {dragOverCardId === 'container-left' && (
          <div className="absolute left-2 top-2 bottom-6 w-2 bg-[#3186FF] rounded-full shadow-[0_0_16px_rgba(49,134,255,1)] z-40 pointer-events-none animate-pulse" />
        )}
        {dragOverCardId === 'container-right' && (
          <div className="absolute right-2 top-2 bottom-6 w-2 bg-[#3186FF] rounded-full shadow-[0_0_16px_rgba(49,134,255,1)] z-40 pointer-events-none animate-pulse" />
        )}
        {pinnedFiles.map((file, idx) => renderCard(file, idx))}

        {isWidgetModalOpen && (
          <AddWidgetModal
            isOpen={isWidgetModalOpen}
            onClose={() => setIsWidgetModalOpen(false)}
            availableWidgets={availableWidgets}
            pinnedArtifactIds={pinnedArtifactIds}
            onPinWidget={(file) => {
              if (onPinArtifact) onPinArtifact(file);
            }}
            onUnpinWidget={onRemovePin}
            onCreateCustomTool={() => {
              if (onCreateArtifact) onCreateArtifact('site');
            }}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}

