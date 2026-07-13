import React, { useState, useEffect } from 'react';
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
    const spaceId = s.id || s.spaceId;
    if (!spaceId) return false;
    if (activeSpaceId && spaceId === activeSpaceId) return false;
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
        setTargetSpaceId(availableSpaces[0].id || availableSpaces[0].spaceId);
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

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md rounded-3xl border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 ${
          isDark ? 'bg-[#1E1F22] border-[#3B3D42] text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-[#2B2D31]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Share2 size={18} />
            </div>
            <div>
              <h2 
                className="text-lg font-semibold tracking-tight leading-snug"
                style={{ fontFamily: '"Google Sans", "Product Sans", sans-serif' }}
              >
                Share Sources
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select files to share with another space
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Search bar & Select All toggle */}
          <div className="flex items-center gap-2">
            <div className={`flex-1 h-9 px-3 rounded-full flex items-center gap-2 border ${
              isDark ? 'bg-[#282A2D] border-[#3B3D42]' : 'bg-slate-50 border-slate-200'
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
            >
              {selectedIds.length === libraryItems.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* Library Items Checklist */}
          <div className={`max-h-56 overflow-y-auto rounded-2xl border p-2 flex flex-col gap-1 ${
            isDark ? 'bg-[#121314] border-[#2B2D31]' : 'bg-slate-50/50 border-slate-150'
          }`}>
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
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isChecked 
                        ? (isDark ? 'bg-blue-950/30 text-white' : 'bg-blue-50/70 text-slate-900')
                        : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-white text-slate-700')
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="shrink-0 flex items-center justify-center">
                        {getFileIcon(itemName, item.mimeType || item.type, 18)}
                      </div>
                      <span className="text-xs font-medium truncate">
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
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <FolderKanban size={14} className="text-blue-500" />
              <span>Share to Space:</span>
            </label>
            {availableSpaces.length === 0 ? (
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                No other spaces available. Create a new Space first.
              </div>
            ) : (
              <select
                value={targetSpaceId}
                onChange={(e) => setTargetSpaceId(e.target.value)}
                className={`w-full h-11 px-3.5 rounded-xl border outline-none text-xs font-semibold cursor-pointer transition-all ${
                  isDark 
                    ? 'bg-[#282A2D] border-[#3B3D42] text-white focus:border-blue-500' 
                    : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
                }`}
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
        <div className="px-6 py-4 border-t border-slate-100 dark:border-[#2B2D31] flex items-center justify-end gap-3">
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
    </div>
  );
}
