import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search } from 'lucide-react';
import { getFileIcon } from '../Shared/FileIcon';
import { Button } from '../Shared/Button';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableWidgets: any[];
  pinnedArtifactIds: string[];
  onPinWidget: (file: any) => void;
  onUnpinWidget: (fileId: string) => void;
  onCreateCustomTool?: () => void;
  theme?: 'light' | 'dark';
}

export function AddWidgetModal({
  isOpen,
  onClose,
  availableWidgets = [],
  pinnedArtifactIds = [],
  onPinWidget,
  onUnpinWidget,
  onCreateCustomTool,
  theme = 'light'
}: AddWidgetModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = theme === 'dark';

  // Unchecked by default when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter out folders
  const nonFolderWidgets = availableWidgets.filter(item => {
    if (!item) return false;
    const mimeLower = (item.mimeType || item.type || '').toLowerCase();
    if (mimeLower.includes('folder') || item.type === 'folder' || item.isFolder) {
      return false;
    }
    return true;
  });

  const isInteractiveArtifact = (item: any) => {
    if (!item) return false;
    const nameLower = (item.name || item.title || item.chatName || '').toLowerCase();
    const mimeLower = (item.mimeType || item.type || '').toLowerCase();
    
    return (
      item.id === 'todo-card' ||
      item.isInferredTask ||
      nameLower.endsWith('.html') ||
      nameLower === 'index.html' ||
      nameLower.includes('custom tool') ||
      nameLower.includes('kanban') ||
      nameLower.includes('inferred') ||
      mimeLower.includes('site') ||
      mimeLower.includes('inferred')
    );
  };

  // Filter by search and sort interactive artifacts at top
  const filteredItems = nonFolderWidgets
    .filter(item => {
      const name = item.name || item.title || item.chatName || item.filename || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const aInteractive = isInteractiveArtifact(a);
      const bInteractive = isInteractiveArtifact(b);
      if (aInteractive && !bInteractive) return -1;
      if (!aInteractive && bInteractive) return 1;
      return 0;
    });

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allFilteredIds = filteredItems
      .map(item => item.id || item.driveId || item.name)
      .filter(Boolean);

    if (selectedIds.length === allFilteredIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const handleAddSelected = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => {
      const item = nonFolderWidgets.find(f => (f.id || f.driveId || f.name) === id);
      if (item) {
        onPinWidget(item);
      }
    });
    onClose();
  };

  const handleCreateCustomTool = () => {
    if (onCreateCustomTool) {
      onCreateCustomTool();
    }
    onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border-none ${
          isDark ? 'bg-[#1E1F22] text-white' : 'bg-white text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 
            className="text-lg font-normal tracking-tight leading-snug"
            style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
          >
            Add a Widget to your Dashboard
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3">
          {/* Search bar & Select All toggle */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-9 px-3 rounded-full flex items-center gap-2 ${
              isDark ? 'bg-[#282A2D]' : 'bg-slate-100/80'
            }`}>
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Filter items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
            {filteredItems.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer border-none bg-transparent"
                style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
              >
                {selectedIds.length === filteredItems.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {/* Library Items Checklist (same cells and styling as ShareSourcesModal) */}
          <div className="max-h-64 overflow-y-auto bg-transparent p-0 flex flex-col gap-1.5 scrollbar-thin">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                No matching artifacts found
              </div>
            ) : (
              filteredItems.map(item => {
                const itemId = item.id || item.driveId || item.name;
                const isChecked = selectedIds.includes(itemId);
                let itemName = item.name || item.title || item.chatName || item.filename || 'Untitled';
                if (item.id === 'todo-card' || item.isInferredTask || item.name === 'inferred_tasks.json') {
                  itemName = 'To-dos Tracker';
                }

                return (
                  <div
                    key={itemId}
                    onClick={() => toggleSelectItem(itemId)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-colors ${
                      isChecked 
                        ? (isDark ? 'bg-blue-950/40 text-blue-100' : 'bg-blue-50/80 text-blue-900')
                        : (isDark ? 'bg-[#282A2D] hover:bg-[#35373A] text-slate-200' : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-800')
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="shrink-0 flex items-center justify-center">
                        {getFileIcon(itemName, item.mimeType || item.type, 18)}
                      </div>
                      <span 
                        className="text-xs font-medium truncate"
                        style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
                      >
                        {itemName}
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer shrink-0"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stacked CTAs in Footer */}
        <div className="px-4 pb-4 pt-1 flex flex-col gap-2 w-full">
          <Button
            variant="primary"
            theme={theme}
            onClick={handleCreateCustomTool}
            className="w-full h-10 text-xs font-semibold"
          >
            Make a custom tool
          </Button>
          <Button
            variant="secondary"
            theme={theme}
            disabled={selectedIds.length === 0}
            onClick={handleAddSelected}
            className="w-full h-10 text-xs font-semibold"
          >
            Add selected
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
