import React from 'react';
import { FileText, Folder, FolderPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import ReactMarkdown from 'react-markdown';
import { SourceChip } from '../Shared/SourceChip';
import { Button } from '../Shared/Button';
import { FileRow } from '../Shared/FileRow';
import { FolderRow } from '../Shared/FolderRow';
import { FileIcon } from '../Shared/FileIcon';

interface BotMessageProps {
  text: string;
  thinking?: string;
  steps?: any[];
  theme?: 'light' | 'dark';
  isLoading?: boolean;
  taskTitle?: string;
  key?: number | string;
  variant?: 'chat' | 'summary';
  onSourceClick?: (fileId: string) => void;
  sources?: any[];
  isOrganizationProposal?: boolean;
  proposedMoves?: any[];
  isApplied?: boolean;
  isOrganizing?: boolean;
  onApplyMoves?: () => void;
  onDoDifferently?: () => void;
}

// Utility to extract 2-3 high-level lines tops describing the action
function cleanSummaryDescription(fullText: string): string {
  if (!fullText) return "Assembling response... Check detailed steps below.";
  
  // Strip any trailing unclosed code block first
  let clean = fullText.replace(/```[A-Za-z]*\s*\n?[\s\S]*$/i, '').trim();
  // Strip completed code blocks completely
  clean = clean.replace(/```[\s\S]*?```/g, '').trim();
  // Strip comments and selectors
  clean = clean.replace(/<!--[\s\S]*?-->/g, '').trim();
  
  // Filter out headers and raw HTML lines
  const lines = clean.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('<') && !l.startsWith('<!'));

  if (lines.length === 0) return "Generating application assets and workspace files...";
  
  // Take the first readable line/paragraph
  let firstParagraph = lines[0];
  if (firstParagraph.length > 300) {
    firstParagraph = firstParagraph.substring(0, 300);
  }
  
  // Get sentences
  const sentences = firstParagraph.match(/[^.!?]+[.!?]+(\s|$)/g) || [firstParagraph];
  
  // Limit to 2 sentences for perfect 2-line visual alignment
  const result = sentences.slice(0, Math.min(2, sentences.length)).join('').trim();
  
  if (result.length > 200) {
    return result.substring(0, 197) + "...";
  }
  return result;
}

export function BotMessage({ 
  text, 
  theme = 'light',
  variant = 'chat',
  onSourceClick,
  sources = [],
  isOrganizationProposal = false,
  proposedMoves = [],
  isApplied = false,
  isOrganizing = false,
  onApplyMoves,
  onDoDifferently
}: BotMessageProps) {
  const isDark = theme === 'dark';
  
  if (isOrganizationProposal) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <div className={`px-1 text-sm sm:text-base leading-relaxed font-normal ${
          isDark ? 'text-[#E3E3E3]' : 'text-slate-700'
        }`}>
          {text}
        </div>

        <div className={`flex flex-col border rounded-3xl p-5 w-full shadow-sm ${
          isDark ? 'bg-[#1E1F22] border-[#3B3D42]' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center gap-2.5 mb-4">
            <Folder className="w-5 h-5 text-blue-500 shrink-0" />
            <span 
              className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
              style={{ fontFamily: '"Product Sans", "Google Sans", sans-serif' }}
            >
              Proposed Organization ({proposedMoves.length} files)
            </span>
          </div>

          <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin mb-4">
            {proposedMoves.map((move: any, idx: number) => (
              <div 
                key={idx} 
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left select-none transition-colors ${
                  isDark ? 'hover:bg-white/5 text-gray-200' : 'hover:bg-gray-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                  <FileIcon fileName={move.fileName || move.name} mimeType={move.fileMime || move.mimeType} size={18} />
                  <span 
                    className="text-xs truncate font-medium"
                    style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
                  >
                    {move.fileName || move.name}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 pl-2">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 opacity-60" />
                  <div className="flex items-center gap-1.5 truncate">
                    <span 
                      className="material-symbols-rounded select-none shrink-0 inline-flex items-center justify-center text-[#444746] dark:text-[#C4C7C5]" 
                      style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                    >
                      {move.actionType === 'CREATE_AND_MOVE' ? 'create_new_folder' : 'folder'}
                    </span>
                    <span 
                      className="text-xs truncate font-medium text-slate-700 dark:text-gray-300"
                      style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
                    >
                      {move.targetFolderName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`h-px w-full my-1 ${isDark ? 'bg-[#3B3D42]' : 'bg-slate-100'}`} />

          <div className="flex items-center justify-end gap-3 pt-3">
            {isApplied ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <span>Organized & Applied</span>
              </div>
            ) : (
              <>
                <Button 
                  variant="secondary" 
                  theme={theme} 
                  onClick={onDoDifferently}
                  disabled={isOrganizing}
                >
                  Do differently
                </Button>
                <Button 
                  variant="primary" 
                  theme={theme} 
                  onClick={onApplyMoves}
                  disabled={isOrganizing}
                >
                  {isOrganizing ? 'Organizing...' : 'Go ahead'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  if (variant === 'summary') {
    const markdownComponents = {
      a: ({ href, children }: any) => {
        const isDriveLink = href && (href.includes('drive.google.com/open') || href.includes('drive.google.com/file'));
        
        const handleClick = (e: React.MouseEvent) => {
          if (isDriveLink) {
            e.preventDefault();
            try {
              const urlObj = new URL(href);
              const fileId = urlObj.searchParams.get('id');
              if (fileId && onSourceClick) {
                onSourceClick(fileId);
                return;
              }
            } catch (err) {
              console.error("Error parsing link URL:", err);
            }
            window.open(href, '_blank', 'noopener,noreferrer');
          }
        };

        if (isDriveLink) {
          return (
            <SourceChip href={href} onClick={handleClick} sources={sources}>
              {children}
            </SourceChip>
          );
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {children}
          </a>
        );
      }
    };

    return (
      <div 
        className="markdown-body w-full text-slate-700 dark:text-[#E3E3E3]"
      >
        {text ? (
          <ReactMarkdown components={markdownComponents}>
            {text}
          </ReactMarkdown>
        ) : (
          <div className="flex items-center gap-3 py-4 text-slate-400 dark:text-neutral-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400 dark:border-neutral-500"></div>
            <span className="text-sm font-medium font-sans">Generating response...</span>
          </div>
        )}
      </div>
    );
  }
  
  const displayDescription = cleanSummaryDescription(text);

  return (
    <div className="flex flex-col gap-3">
      {/* 1. Concise, high-level 2-3 lines description goes at the top */}
      {displayDescription && (
        <div className={`px-1 text-xs sm:text-base leading-relaxed font-normal ${
          isDark ? 'text-[#E3E3E3]' : 'text-slate-700'
        }`} style={{ fontFamily: '"Inter", sans-serif' }}>
          {displayDescription}
        </div>
      )}

      {/* Mock tool execution UI if it's the specific first generation step and we are starting off */}
      {text && text.includes("Here is a project tracker") && (
        <div className={`p-4 border rounded-2xl flex items-center gap-4 shadow-sm ${
          isDark ? 'bg-[#2B2D31] border-[#3B3D42] text-white' : 'bg-white border-slate-100 text-slate-800'
        }`}>
          <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center">
            <FileText size={20} className="text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="font-semibold text-sm">Project Tracker</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">Workspace sync completed</div>
          </div>
        </div>
      )}
    </div>
  );
}

