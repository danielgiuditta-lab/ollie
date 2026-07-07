import React, { useEffect } from 'react';
import { Trash2 } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRemove: () => void;
  label?: string;
}

export function ContextMenu({ x, y, onClose, onRemove, label = "Remove" }: ContextMenuProps) {
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
  const menuWidth = 160;
  const menuHeight = 50;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

  return (
    <div
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-[9999] bg-white dark:bg-[#2B2D31] rounded-xl border border-slate-200 dark:border-white/10 shadow-xl p-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-100 select-none"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
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
