import React, { useEffect } from 'react';
import { Trash2, Pin } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRemove: () => void;
  label?: string;
  onPin?: () => void;
  isPinned?: boolean;
}

export function ContextMenu({ x, y, onClose, onRemove, label = "Remove", onPin, isPinned }: ContextMenuProps) {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates so menu doesn't overflow screen
  const menuWidth = 180;
  const menuHeight = onPin ? 90 : 50;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

  return (
    <div
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-[9999] bg-white dark:bg-[#2B2D31] rounded-xl border border-slate-200 dark:border-white/10 shadow-xl p-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100 select-none"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {onPin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin();
            onClose();
          }}
          className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 flex items-center gap-2.5 transition-colors cursor-pointer outline-none mb-1"
        >
          <Pin size={16} className="shrink-0" />
          <span>{isPinned ? "Unpin from Dashboard" : "Pin to Dashboard"}</span>
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
          onClose();
        }}
        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2.5 transition-colors cursor-pointer outline-none"
      >
        <Trash2 size={16} className="shrink-0" />
        <span>{label}</span>
      </button>
    </div>
  );
}
