import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  PenTool, 
  FileText, 
  Brain, 
  Sparkles
} from 'lucide-react';
import Markdown from 'react-markdown';
import { StatusIndicator } from './StatusIndicator';

export interface TaskStepItem {
  title: string;
  subItems: string[];
  icon: React.ReactNode;
  status: 'working' | 'done' | 'pending' | 'blocked';
}

interface TaskCardProps {
  status?: 'working' | 'done' | 'blocked';
  title?: string;
  stage?: string;
  steps?: any[];
  onAction?: (actionType?: string) => void;
  actionLabel?: string;
  actionType?: string;
  
  // Legacy support for other callers if any
  taskTitle?: string;
  isLoading?: boolean;
  isBlocked?: boolean;
  theme?: 'light' | 'dark';
  fullText?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  status, 
  title, 
  stage, 
  steps = [], 
  onAction, 
  actionLabel, 
  actionType,
  
  taskTitle,
  isLoading,
  isBlocked = false,
  theme = 'light',
  fullText = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [expandedTimelineStep, setExpandedTimelineStep] = useState<number>(0);
  const [currentMetaIndex, setCurrentMetaIndex] = useState(0);

  const isDark = theme === 'dark';

  // Resolve fallbacks for maximum compatibility
  const resolvedTitle = title || taskTitle || "Assembling Project Workspace";
  
  // Resolve overall status
  let resolvedStatus: 'working' | 'done' | 'blocked' = status || 'working';
  if (!status) {
    if (isBlocked) {
      resolvedStatus = 'blocked';
    } else if (isLoading) {
      resolvedStatus = 'working';
    } else {
      resolvedStatus = 'done';
    }
  }

  // 1. Synthesize actual pipeline timeline phases dynamically
  const getTimelinePhases = (): TaskStepItem[] => {
    const isAiSearch = resolvedTitle === 'AI Search Summary';

    if (isAiSearch) {
      const phases: TaskStepItem[] = [
        {
          title: "Drive Search & Retrieval",
          icon: <Search className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />,
          subItems: [],
          status: 'pending'
        },
        {
          title: "Content Extraction",
          icon: <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />,
          subItems: [],
          status: 'pending'
        },
        {
          title: "Summary Synthesis",
          icon: <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />,
          subItems: [],
          status: 'pending'
        }
      ];

      if (resolvedStatus === 'working') {
        phases[0].status = 'working';
        phases[0].subItems = ["Searching Google Drive files...", "Analyzing user prompt query"];
      } else {
        phases.forEach(p => p.status = 'done');
      }
      return phases;
    }

    const phases: TaskStepItem[] = [
      {
        title: "Research & Planning",
        icon: <Search className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />,
        subItems: [],
        status: 'pending'
      },
      {
        title: "Code & Asset Engineering",
        icon: <PenTool className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />,
        subItems: [],
        status: 'pending'
      },
      {
        title: "Integration & Verification",
        icon: <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />,
        subItems: [],
        status: 'pending'
      }
    ];

    if (!steps || steps.length === 0) {
      if (resolvedStatus === 'working') {
        phases[0].status = 'working';
        phases[0].subItems = ["Analyzing request parameters...", "Gathering insights from Workspace PRD"];
      } else {
        phases.forEach(p => p.status = 'done');
      }
      return phases;
    }

    // Process actual compiler steps
    steps.forEach((step) => {
      if (step.type === 'thought') {
        let text = step.text || (step.model_turn?.parts?.map((p: any) => p.text || p.thought || '').join('')) || "";
        if (text.length > 2000) text = text.substring(0, 2000);
        const thoughts = text
          .split('\n')
          .map((t: string) => t.replace(/^[-*•\s\d.]+/g, '').trim())
          .filter((t: string) => t.length > 10 && t.length < 120);
        
        if (thoughts.length > 0) {
          phases[0].subItems.push(...thoughts.slice(0, 3));
        } else if (step.summary) {
          const summaryStr = typeof step.summary === 'string' ? step.summary : (step.summary.text || JSON.stringify(step.summary));
          phases[0].subItems.push(summaryStr);
        } else {
          phases[0].subItems.push("Synthesizing strategic technical roadmap");
        }
      } else if (step.tool_calls) {
        step.tool_calls.forEach((tc: any) => {
          const name = tc.function_call?.name || "API Request";
          const args = tc.function_call?.args || {};
          if (name === 'vibe-code' || name === 'edit_file' || name === 'create_file') {
            const fileName = args.activeFileName || args.TargetFile || args.filename || "workspace target";
            phases[1].subItems.push(`Engineering modifications for ${String(fileName).split('/').pop()}`);
          } else {
            phases[0].subItems.push(`Consulting internal registry: ${name}`);
          }
        });
      } else if (step.type === 'model_output') {
        phases[2].subItems.push("Formulating visual responsive containers");
        phases[2].subItems.push("Rendering design preview inside iframe");
      }
    });

    // Enforce nice fallback placeholders
    if (phases[0].subItems.length === 0) {
      phases[0].subItems.push("Analyzing workspace context");
      phases[0].subItems.push("Validating file mappings");
    }
    if (phases[1].subItems.length === 0 && steps.length > 1) {
      phases[1].subItems.push("Deploying structural code additions");
    }
    if (phases[2].subItems.length === 0 && resolvedStatus === 'done') {
      phases[2].subItems.push("Hot-reload engine successfully synced");
      phases[2].subItems.push("Syncing modified assets with Drive folder");
    }

    // Assign appropriate visual state rings
    if (resolvedStatus === 'working') {
      const scale = steps.length;
      if (scale <= 2) {
        phases[0].status = 'working';
      } else if (scale <= 6) {
        phases[0].status = 'done';
        phases[1].status = 'working';
      } else {
        phases[0].status = 'done';
        phases[1].status = 'done';
        phases[2].status = 'working';
      }
    } else if (resolvedStatus === 'blocked') {
      phases[0].status = 'done';
      phases[1].status = 'blocked';
    } else {
      phases.forEach(p => p.status = 'done');
    }

    return phases;
  };

  const timelinePhases = getTimelinePhases();

  // Find the single highly active step list
  const activeStepItem = resolvedStatus !== 'blocked' && timelinePhases
    ? (timelinePhases.find(s => s.status === 'working') 
       || timelinePhases.find(s => s.status === 'pending')
       || (timelinePhases.length > 0 ? timelinePhases[timelinePhases.length - 1] : null))
    : null;

  // Formulate rolling details for closed meta display
  const activeSubItems = timelinePhases
    .filter(p => p.status === 'working' || p.status === 'done')
    .flatMap(p => p.subItems.map((s: any) => (typeof s === 'string' ? s : (s?.text || String(s)))))
    .filter(Boolean);

  const fallbackStages = resolvedTitle === 'AI Search Summary'
    ? ["Scanning Google Drive items...", "Extracting relevant passages...", "Generating report summary..."]
    : ["Initializing asset parameters...", "Structuring files list view...", "Hot reloading workspace canvas..."];
  const stagesList = activeSubItems.length > 0 ? activeSubItems : fallbackStages;

  // Let display rotate through detailed active steps dynamically in closed state
  useEffect(() => {
    if (isOpen) return;
    const interval = setInterval(() => {
      setCurrentMetaIndex((prev) => (prev + 1) % stagesList.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [stagesList.length, isOpen]);

  useEffect(() => {
    if (currentMetaIndex >= stagesList.length) {
      setCurrentMetaIndex(0);
    }
  }, [stagesList.length]);

  const displayStage = stage || (activeStepItem ? activeStepItem.title : "Assembling project details");
  const rawMetaText = isOpen ? displayStage : stagesList[currentMetaIndex];
  const subMetaText = typeof rawMetaText === 'string' ? rawMetaText : (rawMetaText?.text || JSON.stringify(rawMetaText));

  return (
    <div 
      id="task-card-wrapper"
      className="w-full flex flex-col gap-2 font-sans select-none"
    >
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-3xl border cursor-pointer transition-all duration-300 ${
          isDark 
            ? 'bg-[#18191B] border-[#2B2D31] text-white hover:border-[#3B3D42]' 
            : 'bg-white border-[#E9EEF6] hover:border-slate-200 text-slate-800 shadow-card'
        }`}
        style={{
          boxSizing: 'border-box'
        }}
      >
        {/* Header Block / Closed State Layout matches exact spec */}
        <div 
          className="flex gap-4 items-center overflow-hidden px-4 h-[68px] relative w-full"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Status Loader Indicator */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <StatusIndicator status={resolvedStatus} />
          </div>

          {/* Title and Meta Information */}
          <div className="flex flex-1 flex-col items-flex-start justify-center min-w-0 pr-2">
            <p className={`m-0 font-semibold text-[15px] leading-tight truncate w-full ${
              isDark ? 'text-white' : 'text-[#1b1c1d]'
            }`} style={{ fontFamily: "'Google Sans', 'Inter', sans-serif" }}>
              {resolvedTitle}
            </p>
            <p className={`m-0 text-xs mt-0.5 leading-snug truncate w-full transition-all duration-300 ${
              isDark ? 'text-gray-400' : 'text-[#575b5f]'
            }`} style={{ fontFamily: "'Google Sans Text', 'Inter', sans-serif" }}>
              {subMetaText}
            </p>
          </div>

          {/* Action Trigger or Chevron Toggle Button */}
          {onAction && actionLabel ? (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction(actionType);
              }}
              className="px-4 py-1.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-500 border-none cursor-pointer font-medium text-xs sm:text-sm shrink-0 shadow-sm"
              style={{ fontFamily: "'Google Sans', 'Inter', sans-serif" }}
            >
              {actionLabel}
            </button>
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-[#252a2f] text-gray-400' : 'hover:bg-slate-50 text-slate-400'
            }`}>
              {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
          )}
        </div>

        {/* 2. Expanded Detail Timeline Block */}
        {isOpen && (
          <div className={`px-5 pb-5 pt-1 border-t transition-all duration-300 ${
            isDark ? 'border-[#2B2D31]' : 'border-slate-50'
          }`}>
            <div className="mt-4 flex flex-col gap-6 relative">
              {/* Timeline Connector Line */}
              <div className={`absolute left-[13px] top-[14px] bottom-[14px] w-[2px] ${
                isDark ? 'bg-[#2B2D31]' : 'bg-slate-100'
              }`} />

              {timelinePhases.map((phase, idx) => {
                const isStepExpanded = expandedTimelineStep === idx;
                
                let bulletBg = isDark ? 'bg-[#2B2D31]' : 'bg-slate-100';
                let circleBorder = isDark ? 'border-[#3B3D42]' : 'border-slate-200';
                
                if (phase.status === 'done') {
                  bulletBg = isDark ? 'bg-[#1E2D27]' : 'bg-emerald-50';
                  circleBorder = isDark ? 'border-[#284E3F]' : 'border-emerald-200';
                } else if (phase.status === 'working') {
                  bulletBg = isDark ? 'bg-[#1E2E33]' : 'bg-teal-50';
                  circleBorder = isDark ? 'border-[#244C54]' : 'border-teal-200';
                } else if (phase.status === 'blocked') {
                  bulletBg = isDark ? 'bg-[#3A1E1E]' : 'bg-red-50';
                  circleBorder = isDark ? 'border-[#5C2E2E]' : 'border-red-200';
                }

                return (
                  <div key={idx} className="flex gap-4 relative z-10">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 ${bulletBg} ${circleBorder}`}>
                      {phase.status === 'done' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : phase.status === 'blocked' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      ) : (
                        phase.icon
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedTimelineStep(isStepExpanded ? -1 : idx);
                        }}
                        className="w-full text-left flex items-center justify-between border-none outline-none p-0 cursor-pointer bg-transparent"
                      >
                        <span className={`text-[13px] font-semibold tracking-tight ${
                          phase.status === 'done' ? (isDark ? 'text-gray-300' : 'text-slate-600') :
                          phase.status === 'working' ? (isDark ? 'text-white font-bold' : 'text-slate-800 font-bold') :
                          (isDark ? 'text-gray-500' : 'text-slate-400')
                        }`}>
                          {phase.title}
                        </span>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isStepExpanded ? 'rotate-180 text-blue-500' : ''}`} />
                      </button>

                      {isStepExpanded && phase.subItems.length > 0 && (
                        <div className="mt-2.5 pl-1 flex flex-col gap-2">
                          {phase.subItems.map((sub, sIdx) => (
                            <div key={sIdx} className="flex gap-2 items-start text-xs leading-normal">
                              <span className={`font-mono text-[10px] shrink-0 ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
                                {sIdx + 1}.
                              </span>
                              <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>
                                {sub}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. Fully detailed fullText response trace inspect block inside task card */}
            {fullText && (
              <div className={`mt-5 pt-4 border-t ${isDark ? 'border-[#2B2D31]' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTraceOpen(!isTraceOpen);
                  }}
                  className={`w-full flex items-center justify-between text-xs font-semibold py-2 px-2.5 rounded-xl transition-colors cursor-pointer border-none outline-none bg-transparent ${
                    isDark 
                      ? 'text-gray-300 hover:bg-[#25272a]' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Brain className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                    <span>View trace output details</span>
                  </div>
                  {isTraceOpen ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronRight size={14} />}
                </button>

                {isTraceOpen && (
                  <div className={`mt-3 p-4 rounded-2xl border max-h-[300px] overflow-y-auto text-xs leading-relaxed ${
                    isDark 
                      ? 'bg-[#121314] border-[#25272a] text-[#DDDDDD]' 
                      : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}>
                    <div className="markdown-body prose prose-sm max-w-none text-left">
                      <Markdown>{fullText}</Markdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
