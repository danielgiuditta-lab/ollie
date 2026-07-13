import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, FolderKanban, Share2 } from 'lucide-react';
import { getFileIcon } from '../Shared/FileIcon';
import { Button } from '../Shared/Button';

interface ShareSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraryItems: any[];
  spaces: any[];
  activeSpaceId?: string | null;
  onShare: (selectedItemIds: string[], targetSpaceId: string) => void;
  theme?: 'light' | 'dark';
}

export function ShareSourcesModal({
  isOpen,
  onClose,
  libraryItems = [],
  spaces = [],
  activeSpaceId,
  onShare,
  theme = 'light'
}: ShareSourcesModalProps) {
  const isDark = theme === 'dark';

  // Filter out active space
  const availableSpaces = spaces.filter(s => {
    if (!s) return false;
    const spaceId = s.id || s.spaceId || s.activeSpaceId || s.chatId;
    if (!spaceId) return false;
    const lowerSpaceId = String(spaceId).toLowerCase().trim();
    if (lowerSpaceId === 'home' || lowerSpaceId === 'home_guest' || lowerSpaceId.startsWith('home_') || lowerSpaceId.startsWith('home-')) return false;
    if (activeSpaceId && (spaceId === activeSpaceId || lowerSpaceId === String(activeSpaceId).toLowerCase().trim())) return false;
    return true;
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetSpaceId, setTargetSpaceId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Hydrate initial selection and default target space
  useEffect(() => {
    if (isOpen) {
      const allItemIds = libraryItems
        .map(item => item.id || item.driveId || item.name)
        .filter(Boolean);
      setSelectedIds(allItemIds);

      if (availableSpaces.length > 0) {
        setTargetSpaceId(prev => {
          const isValid = availableSpaces.some(s => (s.id || s.spaceId || s.activeSpaceId) === prev);
          return isValid ? prev : (availableSpaces[0].id || availableSpaces[0].spaceId || availableSpaces[0].activeSpaceId);
        });
      } else {
        setTargetSpaceId('');
      }
    }
  }, [isOpen, libraryItems, spaces, activeSpaceId]);

  if (!isOpen) return null;

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allItemIds = libraryItems
      .map(item => item.id || item.driveId || item.name)
      .filter(Boolean);

    if (selectedIds.length === allItemIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allItemIds);
    }
  };

  const filteredItems = libraryItems.filter(item => {
    const name = item.name || item.filename || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleShareClick = () => {
    if (selectedIds.length === 0 || !targetSpaceId) return;
    onShare(selectedIds, targetSpaceId);
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
            Share Sources and Skills
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
            <button
              onClick={toggleSelectAll}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer border-none bg-transparent"
              style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
            >
              {selectedIds.length === libraryItems.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Library Items Checklist (transparent container, styled cells) */}
          <div className="max-h-56 overflow-y-auto bg-transparent p-0 flex flex-col gap-1.5 scrollbar-thin">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                No matching sources found
              </div>
            ) : (
              filteredItems.map(item => {
                const itemId = item.id || item.driveId || item.name;
                const isChecked = selectedIds.includes(itemId);
                const itemName = item.name || item.filename || 'Untitled';

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

          {/* Spaces Dropdown Selector */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label 
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
              style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
            >
              Share to Space:
            </label>
            {availableSpaces.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                No other spaces available. Create a new Space first.
              </div>
            ) : (
              <select
                value={targetSpaceId}
                onChange={(e) => setTargetSpaceId(e.target.value)}
                className={`w-full h-11 px-3.5 rounded-xl outline-none text-xs font-semibold cursor-pointer border-none transition-all ${
                  isDark 
                    ? 'bg-[#282A2D] text-white' 
                    : 'bg-slate-100/80 text-slate-800'
                }`}
                style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
              >
                {availableSpaces.map(s => {
                  const spaceId = s.id || s.spaceId;
                  const spaceName = s.name || s.chatName || s.projectName || `Space (${spaceId})`;
                  return (
                    <option key={spaceId} value={spaceId}>
                      {spaceName}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 pb-4 pt-1 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            theme={theme}
            onClick={onClose}
            className="h-10 px-4 text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            theme={theme}
            disabled={selectedIds.length === 0 || !targetSpaceId}
            onClick={handleShareClick}
            className="h-10 px-5 text-xs font-semibold"
          >
            Share ({selectedIds.length})
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
