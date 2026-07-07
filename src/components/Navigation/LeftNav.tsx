import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ContextMenu } from '../Shared/ContextMenu';
import logoImg from '../../assets/logo.png';

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
  activeSpaceId?: string | null;
  activeAiSummaryTaskId?: string | null;
  userProfile?: any;
  onCreateSpace?: () => void;
  isChatSide?: boolean;
  chatModel?: 'A' | 'B';
  onChangeChatModel?: (model: 'A' | 'B') => void;
  activeChatId?: string | null;
  onSelectChat?: (space: any, chat: any) => void;
  onLogout?: () => void;
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
  activeSpaceId = null,
  activeAiSummaryTaskId = null,
  userProfile = null,
  onCreateSpace,
  isChatSide = false,
  chatModel = 'A',
  onChangeChatModel,
  activeChatId = null,
  onSelectChat: onSelectChatProp,
  onLogout
}: LeftNavProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: any; isProject?: boolean } | null>(null);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);

  const isExpandedActive = isExpanded !== undefined ? isExpanded : localExpanded;

  const toggleExpand = (val: boolean) => {
    if (onToggleExpand) {
      onToggleExpand(val);
    } else {
      setLocalExpanded(val);
    }
  };

  if (hideControls) {
    return <div className="w-[72px] shrink-0 z-10 h-full" />;
  }

  // Combine projects (pinned) and recentTasks (recent workspaces) into a single Spaces list
  const spaces = React.useMemo(() => {
    const spacesMap: Record<string, {
      id: string;
      name: string;
      type: string;
      isProject: boolean;
      raw: any;
      chats: Array<{ id: string; name: string; raw: any }>;
    }> = {};

    const processChatSession = (c: any, isProject: boolean) => {
      if (!c) return;
      const chatIdVal = c.id || c.chatId;
      const spaceId = c.activeSpaceId || chatIdVal;
      if (!spaceId) return;

      if (!spacesMap[spaceId]) {
        spacesMap[spaceId] = {
          id: spaceId,
          name: c.name || 'Workspace',
          type: c.type || 'workspace',
          isProject,
          raw: c,
          chats: []
        };
      }

      if (c.messages && c.messages.length > 0) {
        const exists = spacesMap[spaceId].chats.some(item => item.id === chatIdVal);
        if (!exists) {
          spacesMap[spaceId].chats.push({
            id: chatIdVal,
            name: c.chatName || `Chat ${spacesMap[spaceId].chats.length + 1}`,
            raw: c
          });
        }
      }
    };

    projects.forEach((p) => processChatSession(p, true));
    recentTasks.forEach((t) => processChatSession(t, false));

    return Object.values(spacesMap);
  }, [projects, recentTasks]);

  const onSelectSpace = (space: any) => {
    if (space.isProject) {
      if (onSelectProject) onSelectProject(space.raw);
    } else {
      if (onSelectTask) onSelectTask(space.raw);
    }
  };

  const handleSelectChat = (space: any, chat: any) => {
    if (onSelectChatProp) {
      onSelectChatProp(space.raw, chat);
    } else {
      if (space.isProject) {
        if (onSelectProject) onSelectProject({ ...space.raw, chatId: chat.id });
      } else {
        if (onSelectTask) onSelectTask({ ...space.raw, chatId: chat.id });
      }
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
    
    if (activeView === 'ai_summary') {
      return activeAiSummaryTaskId === spaceId;
    }
    if (activeView !== 'home') {
      return activeSpaceId === spaceId;
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
      className={`h-full pt-0 pb-6 flex flex-col gap-6 shrink-0 z-10 select-none border-t-0 border-b-0 border-l-0 ${
        isChatSide ? 'border-r-0' : 'border-r border-slate-200 dark:border-[#2B2D31]'
      } outline-none overflow-hidden relative bg-white dark:bg-[#0B0B0C] text-slate-800 dark:text-white`}
      id={isExpandedActive ? 'left-nav-expanded' : 'left-nav-collapsed'}
    >
      {/* 1. Brand Logo Header */}
      <div className="flex items-center shrink-0 w-full relative h-[64px] pl-[24px] justify-start">
        <div 
          onClick={() => onViewChange && onViewChange('home')}
          className="cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center w-6 h-6 shrink-0"
        >
          <img src={logoImg} alt="Logo" className="w-6 h-6 object-contain" />
        </div>
      </div>

      {/* 2. Main Navigation Menu / Spaces Scroll Container */}
      <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar w-full px-4 gap-4">
        
        {/* Home Row (Dashboard) */}
        <div className="flex flex-col gap-1 w-full shrink-0">
          <div 
            onClick={() => onViewChange && onViewChange('home')}
            className={`h-[40px] px-2 rounded-[20px] flex items-center justify-between cursor-pointer transition-colors duration-200 shrink-0 ${
              activeView === 'home' 
                ? 'bg-[#f0f4f9] dark:bg-[#2B2D31] text-slate-900 dark:text-white font-semibold'
                : 'text-slate-700 dark:text-[#E3E3E3] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={isExpandedActive ? undefined : "Home"}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <span 
                  className="material-symbols-rounded shrink-0" 
                  style={{ 
                    fontSize: '24px', 
                    fontVariationSettings: activeView === 'home' ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 360" 
                  }}
                >
                  home
                </span>
              </div>
              <span className={`text-[14px] leading-none font-medium whitespace-nowrap transition-opacity duration-200 ${isExpandedActive ? 'opacity-100' : 'opacity-0'}`}>
                Home
              </span>
            </div>
            {isExpandedActive && (
              <span className="material-symbols-rounded text-slate-400 text-sm shrink-0">
                chevron_right
              </span>
            )}
          </div>
        </div>

        {/* Spaces items */}
        <div className="flex flex-col gap-1 w-full shrink-0">
          {spaces.map((space) => {
            const isActive = isSpaceActive(space) && !(
              chatModel === 'B' && 
              space.chats.some((chat: any) => chat.id === activeChatId)
            );
            const isSpaceExpanded = expandedSpaces[space.id];

            return (
              <div key={space.id} className="w-full flex flex-col">
                {/* Space primary row */}
                <div 
                  onClick={() => onSelectSpace(space)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, task: space.raw, isProject: space.isProject });
                  }}
                  className={`h-[40px] px-2 rounded-[20px] flex items-center justify-between group cursor-pointer transition-colors duration-200 shrink-0 ${
                    isActive 
                      ? 'bg-[#f0f4f9] dark:bg-[#2B2D31] text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-700 dark:text-[#E3E3E3] hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={isExpandedActive ? undefined : space.name}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-xl shrink-0 leading-none w-6 h-6 flex items-center justify-center">
                      {getSpaceEmoji(space.name)}
                    </span>
                    <span 
                      className={`text-[14px] truncate leading-none whitespace-nowrap transition-opacity duration-200 ${
                        isActive ? 'font-semibold' : 'font-medium'
                      } ${isExpandedActive ? 'opacity-100' : 'opacity-0'}`}
                      style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
                    >
                      {space.name}
                    </span>
                  </div>
                  
                  {isExpandedActive && (
                    chatModel === 'B' ? (
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
                    )
                  )}
                </div>

                {/* Model B chats list */}
                {chatModel === 'B' && isSpaceExpanded && isExpandedActive && (
                  <div className="pl-10 pr-2 py-1 space-y-0.5 w-full shrink-0">
                    {space.chats.map((chat: any) => {
                      const isChatActive = chat.id === activeChatId;
                      return (
                        <div 
                          key={chat.id}
                          onClick={() => handleSelectChat(space, chat)}
                          className={`h-[32px] px-3 rounded-[20px] flex items-center cursor-pointer text-[14px] transition-colors duration-200 ${
                            isChatActive
                              ? 'bg-[#f0f4f9] dark:bg-[#2B2D31] text-slate-900 dark:text-white font-semibold'
                              : 'text-slate-700 dark:text-[#E3E3E3] hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white font-medium'
                          }`}
                          style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
                        >
                          {chat.name}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* New Space Button below the last space */}
          <div 
            onClick={onCreateSpace}
            className="h-[40px] px-2 rounded-[20px] flex items-center cursor-pointer transition-colors duration-200 shrink-0 text-slate-700 dark:text-[#E3E3E3] hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white mt-2"
            title="Create space"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <span 
                  className="material-symbols-rounded shrink-0" 
                  style={{ 
                    fontSize: '24px', 
                    fontVariationSettings: "'FILL' 0, 'wght' 360"
                  }}
                >
                  add
                </span>
              </div>
              <span 
                className={`text-[14px] leading-none font-medium whitespace-nowrap transition-opacity duration-200 ${isExpandedActive ? 'opacity-100' : 'opacity-0'}`}
                style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
              >
                Create space
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bottom controls: Collapse button, Profile Avatar */}
      <div className="mt-auto flex flex-col items-start gap-4 pl-[16px] w-full select-none pb-2 shrink-0">
        <button 
          onClick={() => toggleExpand(!isExpandedActive)}
          className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition border-none outline-none hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          title={isExpandedActive ? "Collapse Panel" : "Expand Panel"}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>
            {isExpandedActive ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>
        
        <div 
          onClick={() => setShowSettingsPopover(!showSettingsPopover)}
          className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-650 dark:text-blue-400 shadow-3xs ml-[2px] cursor-pointer hover:opacity-85 transition-opacity"
        >
          {userProfile?.picture ? (
            <img src={userProfile.picture} alt="user profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold font-sans uppercase">{userProfile?.name?.substring(0, 2) || "U"}</span>
          )}
        </div>
      </div>

      {showSettingsPopover && (
        <div 
          className="absolute bottom-16 left-4 bg-white dark:bg-[#1E1F22] border border-slate-200 dark:border-[#2B2D31] rounded-2xl p-4 shadow-xl z-50 w-56 flex flex-col gap-3"
        >
          <div className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
            Workspace Settings
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (onChangeChatModel) onChangeChatModel('A');
                setShowSettingsPopover(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex flex-col gap-0.5 ${
                chatModel === 'A'
                  ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-neutral-300'
              }`}
            >
              <span>Model A: Replies</span>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-normal">
                Single canonical chat per space.
              </span>
            </button>
            <button
              onClick={() => {
                if (onChangeChatModel) onChangeChatModel('B');
                setShowSettingsPopover(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex flex-col gap-0.5 ${
                chatModel === 'B'
                  ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-neutral-300'
              }`}
            >
              <span>Model B: Multi-Chat</span>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-normal">
                Multiple chats per space.
              </span>
            </button>
          </div>
          {onLogout && userProfile && (
            <div className="border-t border-slate-100 dark:border-[#2B2D31] pt-2">
              <button 
                className="w-full text-left px-3 py-2 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition font-medium border-none outline-none cursor-pointer bg-transparent"
                onClick={() => {
                  onLogout();
                  setShowSettingsPopover(false);
                }}
              >
                Sign Out
              </button>
            </div>
          )}
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
