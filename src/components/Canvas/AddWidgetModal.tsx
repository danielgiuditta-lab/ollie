import React, { useState } from 'react';
import { X, Search, Plus, Check, Sparkles, Pin } from 'lucide-react';
import { FileIcon } from '../Shared/FileIcon';
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
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const filteredWidgets = availableWidgets.filter(item => {
    if (!item) return false;
    let name = item.name || item.title || item.chatName || '';
    if (item.id === 'todo-card' || item.isInferredTask) name = 'To-dos';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getWidgetTitle = (item: any) => {
    if (!item) return 'Widget';
    if (item.id === 'todo-card' || item.isInferredTask || item.name === 'inferred_tasks.json') {
      return 'To-dos Tracker';
    }
    if (item.title) return item.title;
    if (item.chatName && item.chatName !== 'Custom Tool') return item.chatName;
    if (item.name) {
      return item.name.replace(/\.(html|htm|gdoc|gslides|gsheet|csv|doc|docx)$/i, '');
    }
    return 'Widget';
  };

  const isWidgetPinned = (item: any) => {
    const fileId = item.id || item.driveId || (item.name ? item.name : null);
    if (!fileId) return false;
    return pinnedArtifactIds.some(id => 
      id === fileId || 
      String(id).toLowerCase() === String(fileId).toLowerCase() ||
      (fileId === 'todo-card' && (id === 'todo-card' || id.includes('inferred')))
    );
  };

  const handleTogglePin = (item: any) => {
    const fileId = item.id || item.driveId || item.name;
    if (isWidgetPinned(item)) {
      onUnpinWidget(fileId);
    } else {
      onPinWidget(item);
    }
  };

  const handleCreateToolClick = () => {
    if (onCreateCustomTool) {
      onCreateCustomTool();
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-lg rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border-none ${
          isDark ? 'bg-[#1E1F22] text-white' : 'bg-white text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/10">
          <div>
            <h2 
              className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
              style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}
            >
              Add a Widget to your Dashboard
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-sans mt-0.5">
              Pin widgets from this space or build a custom interactive tool.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {/* Option: Create Custom Tool */}
          <div
            onClick={handleCreateToolClick}
            className="group p-4 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/20 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 cursor-pointer flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 
                  className="text-sm font-semibold text-blue-950 dark:text-blue-200"
                  style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}
                >
                  Build a custom tool
                </h4>
                <p className="text-xs text-blue-800/70 dark:text-blue-300/70">
                  Ask Ollie to generate a custom app or widget in a new chat
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors">
              <Plus size={14} />
              <span>Create</span>
            </div>
          </div>

          {/* Section Divider / Label */}
          {availableWidgets.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                  Available Space Widgets ({availableWidgets.length})
                </span>
                {availableWidgets.length > 3 && (
                  <div className={`h-8 px-3 rounded-full flex items-center gap-2 ${
                    isDark ? 'bg-[#282A2D]' : 'bg-slate-100'
                  }`}>
                    <Search size={14} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-24 bg-transparent border-none outline-none text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400"
                    />
                  </div>
                )}
              </div>

              {/* Widgets List */}
              <div className="flex flex-col gap-2">
                {filteredWidgets.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">
                    No matching widgets found
                  </div>
                ) : (
                  filteredWidgets.map((item, idx) => {
                    const pinned = isWidgetPinned(item);
                    const title = getWidgetTitle(item);
                    const mimeType = item.mimeType || (item.name?.endsWith('.html') ? 'text/html' : undefined);

                    return (
                      <div
                        key={item.id || item.driveId || idx}
                        className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                          isDark 
                            ? 'bg-[#282A2D] hover:bg-[#323438]' 
                            : 'bg-slate-50 hover:bg-slate-100/80 border border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1E1F22] shadow-2xs border border-slate-200/50 dark:border-white/5 flex items-center justify-center shrink-0">
                            <FileIcon fileName={item.name || title} mimeType={mimeType} size={18} />
                          </div>
                          <div className="min-w-0">
                            <h4 
                              className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
                              style={{ fontFamily: '"Google Sans", "Product Sans", "Inter", sans-serif' }}
                            >
                              {title}
                            </h4>
                            <span className="text-[11px] text-slate-400 dark:text-neutral-400 capitalize">
                              {item.id === 'todo-card' || item.isInferredTask ? 'Task Tracker' : (item.mimeType ? item.mimeType.split('.').pop()?.replace('vnd.google-apps.', '') : 'Interactive Tool')}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleTogglePin(item)}
                          className={`h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border-none ${
                            pinned
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                              : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-[#3186FF] dark:text-blue-400'
                          }`}
                        >
                          {pinned ? (
                            <>
                              <Check size={14} className="stroke-[2.5px]" />
                              <span>Pinned</span>
                            </>
                          ) : (
                            <>
                              <Pin size={14} />
                              <span>Pin Widget</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#18191B]/50">
          <Button
            variant="secondary"
            theme={theme}
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
