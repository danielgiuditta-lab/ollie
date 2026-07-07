import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ContextMenu } from '../Shared/ContextMenu';

// Configuration switch to toggle between:
// - Model A (false): 1 canonical chat per space (chevron points right, clicks directly open the space).
// - Model B (true): Many chats per space (chevron expands inline to show indented chats list).
const ENABLE_MANY_CHATS_MODEL = false;

interface LeftNavProps {
  theme?: 'light' | 'dark';
  hideControls?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (val: boolean) => void;
  activeView?: string;
  onViewChange?: (view: 'home' | 'files' | 'null') => void;
  projects?: any[];
  onSelectProject?: (project: any) => void;
  onRemoveProject?: (project: any) => void;
  recentTasks?: any[];
  onSelectTask?: (task: any) => void;
  onRemoveTask?: (task: any) => void;
  projectName?: string;
  driveFolderId?: string | null;
  activeAiSummaryTaskId?: string | null;
  userProfile?: any;
}

// Deterministic emoji helper based on space name hash
const getSpaceEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('ollie')) return '🙂';
  if (lower.includes('production') || lower.includes('build') || lower.includes('construct')) return '🏗';
  if (lower.includes('marketing') || lower.includes('brand')) return '📢';
  if (lower.includes('sales') || lower.includes('revenue')) return '📈';
  if (lower.includes('design') || lower.includes('art')) return '🎨';
  if (lower.includes('data') || lower.includes('sheet') || lower.includes('csv')) return '📊';
  
  const emojis = ['📁', '💼', '💡', '🚀', '🌟', '🛠', '⚙️', '📝', '🎯', '🌱'];
  const sum = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return emojis[sum % emojis.length];
};

export function LeftNav({ 
  theme = 'light', 
  hideControls = false,
  isExpanded,
  onToggleExpand,
  activeView = 'home',
  onViewChange,
  projects = [],
  onSelectProject,
  onRemoveProject,
  recentTasks = [],
  onSelectTask,
  onRemoveTask,
  projectName = '',
  driveFolderId = null,
  activeAiSummaryTaskId = null,
  userProfile = null
}: LeftNavProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: any; isProject?: boolean } | null>(null);

  const isExpandedActive = isExpanded !== undefined ? isExpanded : localExpanded;

  const toggleExpand = (val: boolean) => {
    if (onToggleExpand) {
      onToggleExpand(val);
    } else {
      setLocalExpanded(val);
    }
  };

  if (hideControls) {
    return <div className="w-[72px] shrink-0 z-20 h-full" />;
  }

  // Combine projects (pinned) and recentTasks (recent workspaces) into a single Spaces list
  const spaces = React.useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    projects.forEach((p) => {
      const id = p.id || p.chatId || p.name;
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push({
          id,
          name: p.name || 'Project',
          type: p.type || 'workspace',
          raw: p,
          isProject: true,
          chats: p.chats || [
            { id: `${id}-chat-1`, name: 'Chat 1' },
            { id: `${id}-chat-2`, name: 'Chat 2' }
          ]
        });
      }
    });

    recentTasks.forEach((t) => {
      const id = t.id || t.chatId || t.name;
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push({
          id,
          name: t.name || 'Task',
          type: t.type || 'workspace',
          raw: t,
          isProject: false,
          chats: t.chats || [
            { id: `${id}-chat-1`, name: 'Chat 1' },
            { id: `${id}-chat-2`, name: 'Chat 2' }
          ]
        });
      }
    });

    return list;
  }, [projects, recentTasks]);

  const onSelectSpace = (space: any) => {
    if (space.isProject) {
      if (onSelectProject) onSelectProject(space.raw);
    } else {
      if (onSelectTask) onSelectTask(space.raw);
    }
  };

  const onSelectChat = (space: any, chat: any) => {
    if (space.isProject) {
      if (onSelectProject) onSelectProject({ ...space.raw, chatId: chat.id });
    } else {
      if (onSelectTask) onSelectTask({ ...space.raw, chatId: chat.id });
    }
  };

  const toggleSpaceExpand = (spaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSpaces((prev) => ({
      ...prev,
      [spaceId]: !prev[spaceId]
    }));
  };

  const isSpaceActive = (space: any) => {
    const spaceId = space.id;
    const spaceName = space.name.toLowerCase();
    
    if (activeView === 'ai_summary') {
      return activeAiSummaryTaskId === spaceId || projectName.toLowerCase() === spaceName;
    }
    if (activeView !== 'home') {
      return driveFolderId === spaceId || projectName.toLowerCase() === spaceName;
    }
    return false;
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isExpandedActive ? 256 : 72,
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="h-full py-6 flex flex-col gap-6 shrink-0 z-20 select-none border-none outline-none overflow-hidden relative bg-f8fafd dark:bg-[#0B0B0C] text-slate-800 dark:text-white"
      id={isExpandedActive ? 'left-nav-expanded' : 'left-nav-collapsed'}
    >
      {/* 1. Brand Logo Header */}
      <div className={`flex items-center shrink-0 w-full px-4 relative h-[48px] ${isExpandedActive ? 'justify-start' : 'justify-center'}`}>
        <div 
          onClick={() => onViewChange && onViewChange('home')}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3186FF] via-[#E03B8B] to-[#00C676] p-[2.5px] flex items-center justify-center shadow-3xs cursor-pointer hover:scale-102 active:scale-98 transition-transform duration-150"
        >
          <div className="w-full h-full bg-white dark:bg-[#1E1F22] rounded-[9px] flex items-center justify-center">
            <div className="w-[12px] h-[12px] bg-gradient-to-tr from-[#3186FF] via-[#E03B8B] to-[#00C676] rounded-[3px]"></div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Menu / Spaces Scroll Container */}
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar w-full px-4 gap-4">
        
        {/* Home Row (Dashboard) */}
        {isExpandedActive ? (
          <div 
            onClick={() => onViewChange && onViewChange('home')}
            className={`h-[40px] px-3 rounded-[20px] flex items-center justify-between cursor-pointer transition-colors duration-200 shrink-0 ${
              activeView === 'home' 
                ? 'bg-f0f4f9 dark:bg-[#2B2D31] text-slate-900 dark:text-white font-semibold'
                : 'text-slate-700 dark:text-[#E3E3E3] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span 
                className="material-symbols-rounded shrink-0" 
                style={{ 
                  fontSize: '24px', 
                  fontVariationSettings: activeView === 'home' ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 360" 
                }}
              >
                home
              </span>
              <span className="text-[14px] leading-none font-medium">Home</span>
            </div>
            <span className="material-symbols-rounded text-slate-400 text-sm shrink-0">
              chevron_right
            </span>
          </div>
        ) : (
          <div 
            onClick={() => onViewChange && onViewChange('home')}
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0 mx-auto ${
              activeView === 'home' 
                ? 'bg-f0f4f9 dark:bg-[#2B2D31] text-slate-900 dark:text-white font-semibold' 
                : 'text-slate-700 dark:text-[#E3E3E3] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title="Home"
          >
            <span 
              className="material-symbols-rounded" 
              style={{ 
                fontSize: '24px', 
                fontVariationSettings: activeView === 'home' ? "'FILL' 1" : "'FILL' 0" 
              }}
            >
              home
            </span>
          </div>
        )}

        {/* Spaces items */}
        <div className="flex flex-col gap-1 w-full shrink-0">
          {spaces.map((space) => {
            const isActive = isSpaceActive(space);
            const isSpaceExpanded = expandedSpaces[space.id];

            return isExpandedActive ? (
              <div key={space.id} className="w-full flex flex-col">
                {/* Space primary row */}
                <div 
                  onClick={() => onSelectSpace(space)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, task: space.raw, isProject: space.isProject });
                  }}
                  className={`h-[40px] px-3 rounded-[20px] flex items-center justify-between group cursor-pointer transition-colors duration-200 shrink-0 ${
                    isActive 
                      ? 'bg-f0f4f9 dark:bg-[#2B2D31] text-slate-900 dark:text-white font-semibold shadow-none'
                      : 'text-slate-700 dark:text-[#E3E3E3] hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-xl shrink-0 leading-none">{getSpaceEmoji(space.name)}</span>
                    <span 
                      className={`text-[14px] truncate leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}
                      style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
                    >
                      {space.name}
                    </span>
                  </div>
                  
                  {ENABLE_MANY_CHATS_MODEL ? (
                    <button 
                      onClick={(e) => toggleSpaceExpand(space.id, e)}
                      className="p-1 rounded-full hover:bg-gray-250/50 dark:hover:bg-white/10 cursor-pointer text-slate-500 hover:text-slate-800"
                    >
                      <span 
                        className="material-symbols-rounded flex items-center justify-center transition-transform duration-205" 
                        style={{ 
                          fontSize: '18px',
                          transform: isSpaceExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
                        }}
                      >
                        expand_more
                      </span>
                    </button>
                  ) : (
                    <span className="material-symbols-rounded text-slate-400 text-sm shrink-0">
                      chevron_right
                    </span>
                  )}
                </div>

                {/* Model B chats list */}
                {ENABLE_MANY_CHATS_MODEL && isSpaceExpanded && (
                  <div className="pl-10 pr-2 py-1 space-y-0.5 w-full shrink-0">
                    {space.chats.map((chat: any) => (
                      <div 
                        key={chat.id}
                        onClick={() => onSelectChat(space, chat)}
                        className="h-[32px] px-3 rounded-lg flex items-center cursor-pointer text-xs text-slate-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5 font-medium transition-colors"
                      >
                        {chat.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div 
                key={space.id} 
                onClick={() => onSelectSpace(space)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({ x: e.clientX, y: e.clientY, task: space.raw, isProject: space.isProject });
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0 mx-auto ${
                  isActive 
                    ? 'bg-f0f4f9 dark:bg-[#2B2D31]' 
                    : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title={space.name}
              >
                <span className="text-xl shrink-0 leading-none">{getSpaceEmoji(space.name)}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* 3. Bottom controls: Collapse button, Profile Avatar */}
      {isExpandedActive ? (
        <div className="mt-auto flex flex-col items-start gap-4 pl-[20px] w-full select-none pb-2 shrink-0">
          <button 
            onClick={() => toggleExpand(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition border-none outline-none hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            title="Collapse Panel"
          >
            <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>chevron_left</span>
          </button>
          
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-650 dark:text-blue-400 shadow-3xs">
            {userProfile?.picture ? (
              <img src={userProfile.picture} alt="user profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold font-sans uppercase">{userProfile?.name?.substring(0, 2) || "U"}</span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-auto flex flex-col items-center gap-4 w-[72px] select-none pb-2 shrink-0 mx-auto">
          <button 
            onClick={() => toggleExpand(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition border-none outline-none hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            title="Expand Panel"
          >
            <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>chevron_right</span>
          </button>
          
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-3xs">
            {userProfile?.picture ? (
              <img src={userProfile.picture} alt="user profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold font-sans uppercase">{userProfile?.name?.substring(0, 2) || "U"}</span>
            )}
          </div>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          label={contextMenu.isProject ? "Remove Project" : "Remove"}
          onClose={() => setContextMenu(null)}
          onRemove={() => {
            if (contextMenu.isProject) {
              if (onRemoveProject) onRemoveProject(contextMenu.task);
            } else {
              if (onRemoveTask) onRemoveTask(contextMenu.task);
            }
          }}
        />
      )}
    </motion.div>
  );
}
