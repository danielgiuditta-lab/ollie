import React from 'react';
import { FileText, Folder, FolderPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import ReactMarkdown from 'react-markdown';
import { SourceChip } from '../Shared/SourceChip';
import { Button } from '../Shared/Button';
import { FileRow } from '../Shared/FileRow';
import { FolderRow } from '../Shared/FolderRow';
import { FileIcon } from '../Shared/FileIcon';
import { themeTokens } from '../../utils/themeTokens';

interface BotMessageProps {
  text: string;
  thinking?: string;
  steps?: any[];
  theme?: 'light' | 'dark';
  isGroupChat?: boolean;
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
  isSpacePeopleSelector?: boolean;
  isSpaceDocsSelector?: boolean;
  isMembersAddedNotice?: boolean;
  addedMembers?: any[];
  suggestedPeople?: any[];
  suggestedDocs?: any[];
  selectedPeople?: any[];
  teamMembers?: any[];
  targetSpaceName?: string;
  onFinalizeSpace?: (name: string, selectedPeople: any[], selectedDocs?: any[]) => Promise<void> | void;
  onSelectSpacePeople?: (name: string, selectedPeople: any[]) => void;
  isProactiveReview?: boolean;
  proactiveTask?: any;
  onApproveProactive?: () => void;
  onFeedbackProactive?: () => void;
  actionPills?: Array<{ label: string; onClick: () => void }>;
}

const TeamAvatar = ({ avatar, name, size = 'md', isGroupChat = false }: { avatar?: string; name?: string; size?: 'sm' | 'md' | 'lg'; isGroupChat?: boolean }) => {
  const [error, setError] = React.useState(false);
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm';
  const bgClasses = size === 'sm' 
    ? 'bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-350' 
    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';

  const ringStyle = isGroupChat ? themeTokens.groupChat.facepileRing : 'ring-2 ring-white dark:ring-[#1E1F22]';

  if (avatar && !error) {
    return (
      <img 
        src={avatar} 
        className={`${sizeClasses} rounded-full object-cover shrink-0 ${ringStyle}`} 
        alt={name || 'User'} 
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClasses} ${bgClasses} rounded-full flex items-center justify-center font-bold shrink-0 ${ringStyle}`}>
      {(name || 'U').substring(0, 1).toUpperCase()}
    </div>
  );
};

export function formatPeopleNames(people: any[]): string {
  if (!people || people.length === 0) return "Team members";
  const names = people.map(p => p.name || p.displayName || 'Collaborator').filter(Boolean);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]}, and ${names[2]}`;
  return `${names[0]}, ${names[1]}, and ${names.length - 2} others`;
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
  isGroupChat = false,
  variant = 'chat',
  onSourceClick,
  sources = [],
  isOrganizationProposal = false,
  proposedMoves = [],
  isApplied = false,
  isOrganizing = false,
  onApplyMoves,
  onDoDifferently,
  isSpacePeopleSelector = false,
  isSpaceDocsSelector = false,
  isMembersAddedNotice = false,
  addedMembers = [],
  suggestedPeople = [],
  suggestedDocs = [],
  selectedPeople = [],
  teamMembers = [],
  targetSpaceName = '',
  onFinalizeSpace,
  onSelectSpacePeople,
  isProactiveReview = false,
  proactiveTask,
  onApproveProactive,
  onFeedbackProactive,
  actionPills = []
}: BotMessageProps) {
  const isDark = theme === 'dark';

  const createMarkdownComponents = (isInline: boolean) => ({
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
    },
    p: ({ children }: any) => isInline ? <span className="inline">{children}</span> : <p className="mb-2 last:mb-0">{children}</p>
  });

  const inlineMarkdownComponents = createMarkdownComponents(true);
  const fullMarkdownComponents = createMarkdownComponents(false);

  if (isMembersAddedNotice || (addedMembers && addedMembers.length > 0)) {
    const people = (addedMembers && addedMembers.length > 0) ? addedMembers : (selectedPeople || []);
    return (
      <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className={`px-1 text-sm sm:text-base leading-relaxed font-normal ${
          isDark ? 'text-[#E3E3E3]' : 'text-slate-700'
        }`} style={{ fontFamily: '"Inter", sans-serif' }}>
          <ReactMarkdown components={inlineMarkdownComponents}>{text}</ReactMarkdown>
        </div>

        {people.length > 0 && (
          <div className="flex items-center -space-x-2 pl-1 pt-0.5 select-none">
            {people.map((person: any, idx: number) => (
              <TeamAvatar 
                key={person.email || idx} 
                avatar={person.avatar} 
                name={person.name} 
                size="md" 
                isGroupChat={isGroupChat}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isProactiveReview && proactiveTask) {
    const [localApproved, setLocalApproved] = React.useState(false);
    const isApproved = localApproved || proactiveTask.status === 'done' || proactiveTask.status === 'approved';
    const sourceName = proactiveTask.sourceName || proactiveTask.workspace || 'Google Workspace';
    const proposalTitle = proactiveTask.titleDone || proactiveTask.title || 'proposed changes';
    
    const handleApprove = () => {
      setLocalApproved(true);
      if (onApproveProactive) {
        onApproveProactive();
      }
    };

    const handleFeedback = () => {
      if (onFeedbackProactive) {
        onFeedbackProactive();
      } else {
        const composerInput = document.querySelector('textarea[placeholder*="Ask Gemini"], textarea[placeholder*="Ask anything"], textarea') as HTMLTextAreaElement | null;
        if (composerInput) {
          composerInput.focus();
        }
      }
    };

    return (
      <div className="flex flex-col gap-3 w-full animate-fade-in-up">
        <div className={`px-1 text-sm sm:text-base leading-relaxed font-normal ${
          isDark ? 'text-[#E3E3E3]' : 'text-slate-700'
        }`} style={{ fontFamily: '"Inter", sans-serif' }}>
          Based on <strong>{sourceName}</strong> I've done <strong>{proposalTitle}</strong>, let me know what you think.
        </div>

        <div className={`flex flex-col border rounded-3xl p-5 w-full shadow-sm ${
          isDark ? 'bg-[#1E1F22] border-[#3B3D42]' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span 
              className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
              style={{ fontFamily: '"Product Sans", "Google Sans", sans-serif' }}
            >
              Proactive Agent Draft
            </span>
            {isApproved && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved</span>
              </div>
            )}
          </div>

          <div className={`p-3.5 rounded-2xl mb-4 text-xs sm:text-sm leading-relaxed border ${
            isDark ? 'bg-[#121314] border-[#2B2D31] text-gray-300' : 'bg-slate-50 border-slate-150 text-slate-700'
          }`}>
            <p className="font-semibold mb-1">Action Summary:</p>
            <p>{proactiveTask.descriptionDone || proactiveTask.description}</p>
          </div>

          <div className={`h-px w-full my-1 ${isDark ? 'bg-[#3B3D42]' : 'bg-slate-100'}`} />

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button 
              variant="secondary" 
              theme={theme} 
              onClick={handleFeedback}
            >
              Give feedback
            </Button>
            <Button 
              variant={isApproved ? "secondary" : "primary"} 
              theme={theme} 
              onClick={handleApprove}
              className={isApproved ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 cursor-pointer flex items-center gap-1.5" : "cursor-pointer"}
            >
              {isApproved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Approved</span>
                </>
              ) : (
                "Approve"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isSpacePeopleSelector) {
    const [selectedEmails, setSelectedEmails] = React.useState<string[]>(
      (suggestedPeople || []).map(p => p.email).filter(Boolean)
    );
    const [showPicker, setShowPicker] = React.useState(false);
    const [pickerSearch, setPickerSearch] = React.useState('');
    const [isCreating, setIsCreating] = React.useState(false);
    const [createdStatus, setCreatedStatus] = React.useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = React.useState(false);

    const togglePerson = (email: string) => {
      setSelectedEmails(prev =>
        prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
      );
    };

    const handleNextOrCreate = async () => {
      const selectedList = (teamMembers || []).filter(p => selectedEmails.includes(p.email));
      if (onSelectSpacePeople) {
        setIsSubmitted(true);
        onSelectSpacePeople(targetSpaceName || "New Space", selectedList);
      } else if (onFinalizeSpace) {
        setIsCreating(true);
        setCreatedStatus("Creating Drive folder...");
        
        try {
          await onFinalizeSpace(targetSpaceName || "New Space", selectedList);
          setCreatedStatus("Space created successfully!");
        } catch (err) {
          console.error(err);
          setCreatedStatus("Failed to create space");
        } finally {
          setIsCreating(false);
        }
      }
    };

    const filteredTeam = (teamMembers || []).filter(p => 
      p.name.toLowerCase().includes(pickerSearch.toLowerCase()) || 
      p.email.toLowerCase().includes(pickerSearch.toLowerCase())
    );

    return (
      <div className="flex flex-col gap-3 w-full animate-fade-in-up">
        <div className={`px-1 text-sm sm:text-base leading-relaxed font-normal ${
          isDark ? 'text-[#E3E3E3]' : 'text-slate-700'
        }`} style={{ fontFamily: '"Inter", sans-serif' }}>
          <ReactMarkdown components={inlineMarkdownComponents}>{text}</ReactMarkdown>
        </div>

        <div className={`flex flex-col rounded-3xl p-4 w-full shadow-card border-none ${
          isDark ? 'bg-[#1E1F22]' : 'bg-white'
        }`}>
          <div className="mb-2">
            <span 
              className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
              style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
            >
              Add Members to {targetSpaceName}
            </span>
          </div>

          {/* Suggested list */}
          <div className="flex flex-col gap-2 mb-4">
            {(suggestedPeople || []).map((person, idx) => {
              const isChecked = selectedEmails.includes(person.email);
              return (
                <div 
                  key={idx} 
                  onClick={() => !isSubmitted && togglePerson(person.email)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  } ${isSubmitted ? 'opacity-70 pointer-events-none' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <TeamAvatar avatar={person.avatar} name={person.name} size="md" />
                    <div className="flex flex-col">
                      <span 
                        className={`text-[15px] font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}
                        style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
                      >
                        {person.name}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-neutral-500">{person.email}</span>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => {}} 
                    disabled={isSubmitted}
                    className="rounded text-blue-500 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          {/* Picker Toggle Button */}
          {!isSubmitted && (
            <div className="mb-4">
              <button 
                onClick={() => setShowPicker(!showPicker)}
                className="text-xs font-semibold text-blue-550 hover:text-blue-650 flex items-center gap-0.5 cursor-pointer border-none bg-transparent p-0 outline-none"
                style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
              >
                <span className="material-symbols-rounded text-base">{showPicker ? 'expand_less' : 'expand_more'}</span>
                <span>{showPicker ? 'Hide team list' : 'Show team picker...'}</span>
              </button>

              {showPicker && (
                <div className={`mt-3 rounded-2xl p-3 flex flex-col gap-2.5 border-none ${
                  isDark ? 'bg-[#2B2D31]' : 'bg-slate-50'
                }`}>
                  <input 
                    type="text"
                    placeholder="Search team members..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className={`w-full text-xs px-3 py-2 rounded-xl outline-none border-none ${
                      isDark ? 'bg-[#1E1F22] text-white' : 'bg-white text-slate-800'
                    }`}
                    style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
                  />
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                    {filteredTeam.map((person, idx) => {
                      const isChecked = selectedEmails.includes(person.email);
                      return (
                        <div 
                          key={idx}
                          onClick={() => togglePerson(person.email)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                            isDark ? 'hover:bg-white/5' : 'hover:bg-white/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <TeamAvatar avatar={person.avatar} name={person.name} size="md" />
                            <div className="flex flex-col">
                              <span 
                                className={`text-[15px] font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}
                                style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
                              >
                                {person.name}
                              </span>
                              <span className="text-xs text-slate-450">{person.email}</span>
                            </div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={() => {}} 
                            className="rounded text-blue-500 h-3.5 w-3.5 cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={`h-px w-full my-1 ${isDark ? 'bg-[#3B3D42]' : 'bg-slate-100'}`} />

          {/* Actions */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {createdStatus || (isSubmitted ? 'Team members confirmed' : `${selectedEmails.length} selected`)}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="primary" 
                theme={theme} 
                onClick={handleNextOrCreate}
                disabled={isCreating || isSubmitted || createdStatus?.includes("successfully")}
              >
                {isCreating ? 'Creating...' : (isSubmitted ? 'Confirmed' : (onSelectSpacePeople ? 'Next' : 'Create Space'))}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSpaceDocsSelector) {
    const [selectedDocIds, setSelectedDocIds] = React.useState<string[]>(
      (suggestedDocs || []).map(d => d.id).filter(Boolean)
    );
    const [isCreating, setIsCreating] = React.useState(false);
    const [createdStatus, setCreatedStatus] = React.useState<string | null>(null);

    const toggleDoc = (id: string) => {
      setSelectedDocIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    };

    const handleCreate = async () => {
      if (onFinalizeSpace) {
        setIsCreating(true);
        const selectedList = (suggestedDocs || []).filter(d => selectedDocIds.includes(d.id));
        setCreatedStatus("Creating Drive folder...");
        
        try {
          await onFinalizeSpace(targetSpaceName || "New Space", selectedPeople || [], selectedList);
          setCreatedStatus("Space created successfully!");
        } catch (err) {
          console.error(err);
          setCreatedStatus("Failed to create space");
        } finally {
          setIsCreating(false);
        }
      }
    };

    return (
      <div className="flex flex-col gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className={`px-1 text-sm sm:text-base leading-relaxed font-normal ${
          isDark ? 'text-[#E3E3E3]' : 'text-slate-700'
        }`} style={{ fontFamily: '"Inter", sans-serif' }}>
          <ReactMarkdown components={inlineMarkdownComponents}>{text}</ReactMarkdown>
        </div>

        <div className={`flex flex-col rounded-3xl p-4 w-full shadow-card border-none ${
          isDark ? 'bg-[#1E1F22]' : 'bg-white'
        }`}>
          <div className="mb-1">
            <span 
              className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
              style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
            >
              Add Documents to {targetSpaceName}
            </span>
          </div>

          {/* Meta line */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 mb-2 font-medium">
            <span className="material-symbols-rounded text-sm text-blue-550">visibility</span>
            <span>Docs will be visible to everyone in the space</span>
          </div>

          {/* Suggested docs list */}
          <div className="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto scrollbar-thin pr-1">
            {(suggestedDocs || []).map((doc, idx) => {
              const isChecked = selectedDocIds.includes(doc.id);
              return (
                <div 
                  key={idx} 
                  onClick={() => toggleDoc(doc.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <FileIcon fileName={doc.name} mimeType={doc.mimeType} size={22} />
                    <div className="flex flex-col min-w-0">
                      <span 
                        className={`text-[15px] font-medium truncate ${isDark ? 'text-white' : 'text-slate-800'}`}
                        style={{ fontFamily: '"Product Sans", "Google Sans", "Segoe UI", sans-serif' }}
                      >
                        {doc.name}
                      </span>
                      {doc.description && (
                        <span className="text-xs text-slate-400 dark:text-neutral-500 truncate">{doc.description}</span>
                      )}
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => {}} 
                    className="rounded text-blue-500 focus:ring-blue-500 h-4 w-4 cursor-pointer shrink-0 ml-2"
                  />
                </div>
              );
            })}
            {(suggestedDocs || []).length === 0 && (
              <div className="text-xs text-slate-400 py-2">No documents found from initial workspace search.</div>
            )}
          </div>

          <div className={`h-px w-full my-1 ${isDark ? 'bg-[#3B3D42]' : 'bg-slate-100'}`} />

          {/* Actions */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {createdStatus || `${selectedDocIds.length} selected`}
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="primary" 
                theme={theme} 
                onClick={handleCreate}
                disabled={isCreating || createdStatus?.includes("successfully")}
              >
                {isCreating ? 'Creating...' : 'Create Space'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isOrganizationProposal) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <div className={`px-1 text-sm sm:text-base leading-relaxed font-normal ${
          isDark ? 'text-[#E3E3E3]' : 'text-slate-700'
        }`}>
          <ReactMarkdown components={inlineMarkdownComponents}>{text}</ReactMarkdown>
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
    return (
      <div 
        className="markdown-body w-full text-slate-700 dark:text-[#E3E3E3]"
      >
        {text ? (
          <ReactMarkdown components={fullMarkdownComponents}>
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
          <ReactMarkdown components={inlineMarkdownComponents}>
            {displayDescription}
          </ReactMarkdown>
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

      {/* Dynamic proposal action pills */}
      {actionPills && actionPills.length > 0 && (
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {actionPills.map((pill, i) => (
            <button
              key={i}
              type="button"
              onClick={pill.onClick}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full transition-all border border-blue-200/60 dark:border-blue-700/50 shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>⚡</span>
              <span>{pill.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

