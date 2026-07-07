import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import driveLogo from '../../assets/driveLogo.png';
import { ContextMenu } from '../Shared/ContextMenu';

interface LeftNavProps {
  theme?: 'light' | 'dark';
  hideControls?: boolean;
  onPlusClick?: () => void;
  onSearchClick?: () => void;
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
}

export function LeftNav({ 
  theme = 'light', 
  hideControls = false,
  onPlusClick,
  onSearchClick,
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
  activeAiSummaryTaskId = null
}: LeftNavProps) {
  const isDark = theme === 'dark';
  const [localExpanded, setLocalExpanded] = useState(false);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: any; isProject?: boolean } | null>(null);

  // Support both parent-controlled and self-controlled expansion states
  const isExpandedActive = isExpanded !== undefined ? isExpanded : localExpanded;

  const toggleExpand = (val: boolean) => {
    if (onToggleExpand) {
      onToggleExpand(val);
    } else {
      setLocalExpanded(val);
    }
  };

  if (hideControls) {
    return (
      <div className="w-[72px] shrink-0 z-20 h-full" />
    );
  }

  // Navigation Items with standard Material Symbol icons
  const navItems = [
    { id: 'home', label: 'Home', icon: 'home', view: 'home' as const, disabled: false },
    { id: 'drive', label: 'My Drive', icon: 'add_to_drive', view: 'files' as const, disabled: true },
    { id: 'group', label: 'Shared with me', icon: 'group', view: 'null' as const, disabled: true },
  ];

  // Check which item is currently highlighted as active
  const getIsActive = (itemId: string) => {
    if (itemId === 'home') return activeView === 'home';
    return false;
  };

  // Filter Tasks based on search query
  const filteredTasks = recentTasks;

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isExpandedActive ? 256 : 72,
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="h-full py-5 flex flex-col gap-5 shrink-0 z-20 select-none border-none outline-none overflow-hidden relative bg-f8fafd dark:bg-[#0B0B0C] text-slate-800 dark:text-white"
      id={isExpandedActive ? 'left-nav-expanded' : 'left-nav-collapsed'}
    >
      {/* 1. Top Header Row: Drive Logo, Text "Drive", Chevron (Rotate/Flip) */}
      <div className="flex items-center justify-between w-full h-[48px] relative select-none">
        <div 
          onClick={() => onViewChange && onViewChange('home')}
          className="flex items-center cursor-pointer hover:opacity-85 transition select-none"
        >
          {/* Logo container: outer width 72px, centered logo */}
          <div className="w-[72px] h-[48px] flex items-center justify-center shrink-0">
            <img src={driveLogo} alt="Google Drive" className="w-[32px] h-[32px] object-contain" />
          </div>
          
          <AnimatePresence initial={false}>
            {isExpandedActive && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[22px] font-normal font-sans tracking-tight leading-none overflow-hidden whitespace-nowrap ml-1 text-slate-900"
                style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
              >
                Ollie
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Top Chevron (Only visible when Expanded) */}
        <AnimatePresence initial={false}>
          {isExpandedActive && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => toggleExpand(false)}
              className="absolute right-4 p-1.5 rounded-full transition-colors cursor-pointer outline-none border-none flex items-center justify-center hover:bg-gray-100 text-slate-700 hover:text-slate-900"
              title="Collapse Panel"
            >
              <span className="material-symbols-rounded" style={{ fontSize: '24px' }}>chevron_left</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Create Pill Button */}
      <div className="w-full flex select-none relative h-[48px] items-center">
        <motion.button 
          onClick={onPlusClick}
          className="h-[48px] rounded-full flex items-center cursor-pointer shadow-sm hover:shadow outline-none overflow-hidden absolute left-[12px] transition-colors duration-200 bg-white dark:bg-[#2D2F31] text-slate-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#35373A] border border-gray-200 dark:border-transparent"
          animate={{
            width: isExpandedActive ? 232 : 48,
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          title="Create new workspace project"
        >
          <div className="w-[48px] h-full flex items-center justify-center shrink-0">
            <Plus size={20} className="text-slate-900 dark:text-white" />
          </div>
          <AnimatePresence initial={false}>
            {isExpandedActive && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[14px] font-medium tracking-wide whitespace-nowrap overflow-hidden pr-4 ml-1 text-slate-900 dark:text-white"
                style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
              >
                Create
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* 3. Search Drive Pill */}
      <div className="w-full flex select-none relative h-[48px] items-center">
        <motion.button 
          onClick={onSearchClick}
          className="h-[48px] rounded-full flex items-center cursor-pointer border-none outline-none overflow-hidden absolute left-[12px] transition-colors duration-200 bg-[#EEF2FA] dark:bg-[#282A2D] text-slate-700 dark:text-slate-200 hover:bg-[#E0EBFD] dark:hover:bg-[#35373A]"
          animate={{
            width: isExpandedActive ? 232 : 48,
          }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          title="Search Drive"
        >
          {/* Search Icon */}
          <div className="w-[48px] h-full flex items-center justify-center shrink-0">
            <span 
              className="material-symbols-rounded select-none text-slate-700 dark:text-slate-200" 
              style={{ fontSize: '22px', fontVariationSettings: "'wght' 360" }}
            >
              search
            </span>
          </div>

          <AnimatePresence initial={false}>
            {isExpandedActive && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[14px] font-medium tracking-wide whitespace-nowrap overflow-hidden pr-4 ml-1 text-slate-700 dark:text-slate-200"
                style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
              >
                Search
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Conditionally render the Expand Chevron right below search when collapsed as an absolute overlay to prevent layout shifting */}
      <AnimatePresence>
        {!isExpandedActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[224px] left-[12px] w-[48px] h-[48px] flex justify-center items-center z-30 select-none"
          >
            <button 
              onClick={() => toggleExpand(true)}
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center cursor-pointer transition border-none outline-none hover:bg-gray-100 text-slate-700 hover:text-slate-900"
              title="Expand Side Panel"
            >
              <span className="material-symbols-rounded" style={{ fontSize: '24px', fontVariationSettings: "'wght' 360" }}>chevron_right</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* spacer to push upcoming components */}
      <div className="h-2" />

      {/* 4 & 5. Navigation Rows and Recent Tasks (Fades and collapses/expands smoothly) */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <AnimatePresence initial={false}>
          {isExpandedActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5 flex-1 min-h-0 overflow-hidden w-full px-1"
            >
              {/* 4. Navigation Menu list: 40px row heights, Google symbols filled 28 for active, text Google Sans 14 */}
              <div className="flex flex-col gap-0.5 w-[232px] select-none ml-[12px]">
                {navItems.map((item) => {
                  const isActive = getIsActive(item.id);
                  return (
                    <div 
                      key={item.id}
                      onClick={() => !item.disabled && onViewChange && onViewChange(item.view)}
                      className={`h-[40px] px-2.5 rounded-[20px] flex items-center gap-3.5 transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? 'bg-f0f4f9 dark:bg-[#2B2D31] text-slate-900 dark:text-white font-semibold shadow-none'
                          : 'text-slate-700 dark:text-[#E3E3E3] hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span 
                        className="material-symbols-rounded shrink-0" 
                        style={{ 
                          fontSize: '28px', 
                          fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 360" 
                        }}
                      >
                        {item.icon}
                      </span>
                      <span 
                        className={`text-[14px] leading-none whitespace-nowrap ${isActive ? 'font-semibold' : 'font-normal'}`}
                        style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 5. Projects Segment (Collapsible, above Recent Tasks) */}
              <div className="flex flex-col shrink-0 w-[232px] ml-[12px]">
                <div 
                  onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                  className="flex items-center justify-between px-3 pb-1 select-none cursor-pointer group"
                >
                  <span 
                    className="text-[12px] font-semibold tracking-wider uppercase opacity-80 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                    style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
                  >
                    Projects
                  </span>
                  <button 
                    type="button"
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 opacity-80 hover:opacity-100 outline-none border-none cursor-pointer text-slate-500 dark:text-slate-400"
                  >
                    <span 
                      className="material-symbols-rounded flex items-center justify-center transition-transform duration-200" 
                      style={{ 
                        fontSize: '18px',
                        transform: isProjectsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
                      }}
                    >
                      expand_more
                    </span>
                  </button>
                </div>
                
                <AnimatePresence initial={false}>
                  {isProjectsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden space-y-0.5 pointer-events-auto max-h-[160px] overflow-y-auto no-scrollbar"
                    >
                      {projects && projects.length > 0 ? (
                        projects.map((proj, idx) => {
                          const projName = typeof proj === 'string' ? proj : proj?.name || '';
                          const projId = typeof proj === 'string' ? '' : proj?.id;
                          const isSelected = activeView === 'ai_summary' && (
                            (activeAiSummaryTaskId && projId)
                              ? activeAiSummaryTaskId === projId
                              : (projectName && projectName.toLowerCase() === projName.toLowerCase())
                          );
                          return (
                            <div 
                              key={projId || idx}
                              onClick={() => onSelectProject ? onSelectProject(proj) : onSelectTask && onSelectTask(proj)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setContextMenu({ x: e.clientX, y: e.clientY, task: proj, isProject: true });
                              }}
                              className={`h-[40px] px-3.5 rounded-[20px] flex items-center cursor-pointer transition truncate ${
                                isSelected 
                                  ? 'bg-f0f4f9 dark:bg-[#2B2D31] text-slate-900 dark:text-white font-semibold shadow-none'
                                  : 'text-slate-700 dark:text-[#E3E3E3] hover:bg-black/5 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                              }`}
                              title={projName}
                            >
                              <span 
                                className="text-[14px] truncate leading-none"
                                style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
                              >
                                {projName}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-2 select-none italic font-sans">
                          No projects pinned
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 6. Recent Tasks segment */}
              <div className="flex flex-col flex-1 overflow-hidden min-h-0 w-[232px] ml-[12px]">
                <div className="flex items-center justify-between px-3 pb-2 select-none">
                  <span 
                    className="text-[12px] font-semibold tracking-wider uppercase opacity-80 text-slate-500"
                    style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
                  >
                    Recent Tasks
                  </span>
                  <button className="p-1.5 rounded-full hover:bg-gray-100 opacity-80 hover:opacity-100 outline-none border-none cursor-pointer text-slate-500 hover:text-slate-900">
                    <span className="material-symbols-rounded flex items-center justify-center" style={{ fontSize: '18px' }}>filter_list</span>
                  </button>
                </div>
                
                {/* Scrollable list containing individual session tasks */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-0.5 pointer-events-auto pr-0.5">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task, idx) => {
                      const taskName = typeof task === 'string' ? task : task?.name || '';
                      const taskId = typeof task === 'string' ? '' : task?.id;
                      const isSelected = activeView !== 'home' && (
                        (driveFolderId && taskId)
                          ? driveFolderId === taskId
                          : (projectName && projectName.toLowerCase() === taskName.toLowerCase())
                      );
                      return (
                        <div 
                          key={idx}
                          onClick={() => onSelectTask && onSelectTask(task)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, task, isProject: false });
                          }}
                          className={`h-[40px] px-3.5 rounded-[20px] flex items-center cursor-pointer transition truncate ${
                            isSelected 
                              ? 'bg-f0f4f9 text-slate-900 font-semibold shadow-none'
                              : 'text-slate-700 hover:bg-gray-100 hover:text-slate-900'
                          }`}
                          title={taskName}
                        >
                          <span 
                            className="text-[14px] truncate leading-none"
                            style={{ fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif" }}
                          >
                            {taskName}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-4 select-none italic font-sans">
                      No tasks found
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
