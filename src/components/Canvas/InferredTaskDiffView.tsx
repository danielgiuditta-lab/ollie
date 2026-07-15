import React from 'react';

interface InferredTaskDiffViewProps {
  file: any;
  theme?: 'light' | 'dark';
}

const RenderDocMarkdown = ({ text, isDark = false }: { text: string; isDark?: boolean }) => {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-3 font-sans leading-relaxed text-[13px] sm:text-[14px]">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;

        // Document Section H1 (# Title)
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={i} className={`text-[18px] sm:text-[20px] font-extrabold tracking-tight border-b pb-2 mb-3 ${isDark ? 'text-white border-neutral-700' : 'text-slate-900 border-slate-200'}`}>
              {trimmed.replace(/^#\s+/, '')}
            </h2>
          );
        }

        // Subheading H2 (## Section Title)
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className={`text-[15px] sm:text-[16px] font-bold tracking-tight border-b pb-1 mb-2 mt-4 ${isDark ? 'text-blue-300 border-neutral-700' : 'text-blue-700 border-slate-200'}`}>
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }

        // Subheading H3
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={i} className={`text-[14px] sm:text-[15px] font-semibold tracking-tight mb-1.5 ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }

        // Bullet Point (- item or • item)
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const content = trimmed.replace(/^[\-•]\s*/, '');
          const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
          return (
            <div key={i} className="flex items-start gap-2.5 pl-1 my-1.5">
              <span className={`font-bold shrink-0 mt-1 text-[8px] ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>●</span>
              <span className={`leading-snug ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} className={`font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>{part.slice(2, -2)}</strong>;
                  }
                  if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={pIdx} className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${isDark ? 'bg-neutral-800 text-amber-300 border border-neutral-700' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>{part.slice(1, -1)}</code>;
                  }
                  return part;
                })}
              </span>
            </div>
          );
        }

        // Regular Paragraph
        const parts = trimmed.split(/(\*\*.*?\*\*|`.*?`)/g);
        return (
          <p key={i} className={`my-1.5 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pIdx} className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={pIdx} className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${isDark ? 'bg-neutral-800 text-amber-300' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>{part.slice(1, -1)}</code>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

export const RenderSlideMarkdown = ({ text, isDark = false }: { text: string; isDark?: boolean }) => {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="flex flex-col gap-2 font-sans w-full">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Slide Title (# Title) - 22px/24px Impact Heading
        if (trimmed.startsWith('# ')) {
          return (
            <div key={i} className="mb-2">
              <h2 className={`text-[20px] sm:text-[23px] font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {trimmed.replace(/^#\s+/, '')}
              </h2>
            </div>
          );
        }

        // Callout Block (> Quote / Stat Callout) - Highlighted Callout Box
        if (trimmed.startsWith('> ')) {
          const calloutText = trimmed.replace(/^>\s+/, '');
          const parts = calloutText.split(/(\*\*.*?\*\*|`.*?`)/g);
          return (
            <div key={i} className={`p-3 sm:p-3.5 my-1.5 rounded-xl border-l-4 border-blue-500 ${
              isDark ? 'bg-blue-950/40 border-blue-500 text-blue-100' : 'bg-gradient-to-r from-blue-50/80 to-indigo-50/50 text-slate-800 border-blue-600'
            }`}>
              <p className="text-[13px] sm:text-[14px] font-medium leading-snug">
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} className="font-extrabold text-blue-600 dark:text-blue-300">{part.slice(2, -2)}</strong>;
                  }
                  if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={pIdx} className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-blue-100 dark:bg-blue-900/60 font-bold">{part.slice(1, -1)}</code>;
                  }
                  return part;
                })}
              </p>
            </div>
          );
        }

        // Section Heading (## Subheader) - 15px/16px Bold Header with Divider Line
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className={`text-[15px] sm:text-[16px] font-bold tracking-tight border-b pb-1 mt-2.5 mb-1 ${isDark ? 'text-amber-300 border-neutral-700' : 'text-amber-700 border-slate-200'}`}>
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }

        // Bullet Cards (- **Title**: description) - Floating Feature Cards
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const content = trimmed.replace(/^[\-•]\s*/, '');
          const hasBoldHeader = content.startsWith('**') && content.includes('**:');
          
          if (hasBoldHeader) {
            const match = content.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
            if (match) {
              const [_, boldTitle, restText] = match;
              const restParts = restText.split(/(`.*?`)/g);
              return (
                <div key={i} className={`p-2.5 rounded-xl border flex items-start gap-2.5 my-1 transition-all ${
                  isDark ? 'bg-neutral-800/60 border-neutral-700/60' : 'bg-slate-50/90 border-slate-200/70'
                }`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isDark ? 'bg-amber-400' : 'bg-amber-500'}`} />
                  <div className="text-[13px] sm:text-[14px] leading-relaxed">
                    <span className={`font-bold mr-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{boldTitle}:</span>
                    <span className={isDark ? 'text-neutral-200' : 'text-slate-700'}>
                      {restParts.map((part, pIdx) => {
                        if (part.startsWith('`') && part.endsWith('`')) {
                          return <code key={pIdx} className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${isDark ? 'bg-neutral-900 text-amber-300 border border-neutral-700' : 'bg-white text-slate-800 border border-slate-200 shadow-2xs'}`}>{part.slice(1, -1)}</code>;
                        }
                        return part;
                      })}
                    </span>
                  </div>
                </div>
              );
            }
          }

          // Standard bullets
          const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
          return (
            <div key={i} className="flex items-start gap-2.5 pl-0.5 my-1">
              <span className={`font-bold shrink-0 mt-1 text-[8px] ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>◆</span>
              <span className={`text-[13px] sm:text-[14px] leading-relaxed ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
                  }
                  if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={pIdx} className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${isDark ? 'bg-neutral-800 text-amber-300' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>{part.slice(1, -1)}</code>;
                  }
                  return part;
                })}
              </span>
            </div>
          );
        }

        // Regular Paragraph
        const parts = trimmed.split(/(\*\*.*?\*\*|`.*?`)/g);
        return (
          <p key={i} className={`text-[13px] sm:text-[14px] leading-relaxed my-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pIdx} className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={pIdx} className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${isDark ? 'bg-neutral-800 text-amber-300' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>{part.slice(1, -1)}</code>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

const SlideCard = ({
  markdown = "",
  isDark = false
}: {
  markdown?: string;
  isDark?: boolean;
}) => {
  return (
    <div className={`w-full aspect-[16/9] max-h-[50vh] rounded-[20px] border shadow-xs p-6 sm:p-7 flex flex-col justify-start relative overflow-y-auto select-text transition-all duration-300 ${
      isDark ? 'border-[#3E4042] bg-[#242629] text-white' : 'border-slate-200/90 bg-white text-slate-800'
    }`}>
      <RenderSlideMarkdown text={markdown} isDark={isDark} />
    </div>
  );
};

const DocCard = ({
  markdown = "",
  isDark = false
}: {
  markdown?: string;
  isDark?: boolean;
}) => {
  return (
    <div className={`w-full aspect-[8.5/11] max-h-[50vh] rounded-[18px] border shadow-sm p-6 sm:p-7 flex flex-col justify-start relative overflow-y-auto select-text transition-all duration-300 ${
      isDark ? 'border-[#3E4042] bg-[#222427] text-white' : 'border-slate-200/90 bg-white text-slate-800'
    }`}>
      <RenderDocMarkdown text={markdown} isDark={isDark} />
    </div>
  );
};

export const InferredTaskDiffView: React.FC<InferredTaskDiffViewProps> = ({ file, theme = 'light' }) => {
  const isDark = theme === 'dark';

  const task = file?.task || file || {};
  const rawTitle = task?.sourceName || file?.sourceName || file?.name || file?.title || 'Workspace Artifact';
  const cleanTitle = rawTitle.replace(/\.[^/.]+$/, "").replace(/^(real-file-|suggested-|copied-|sandbox-|sug-|created-|ingested-)+/, "").trim();

  const mimeLower = String(task?.sourceMimeType || file?.sourceMimeType || file?.mimeType || '').toLowerCase();
  const nameLower = String(task?.sourceName || file?.sourceName || file?.name || '').toLowerCase();
  const typeLower = String(task?.type || task?.taskType || file?.type || file?.taskType || '').toLowerCase();

  const isSlide = Boolean(
    typeLower === 'slide' ||
    mimeLower.includes('presentation') ||
    mimeLower.includes('slide') ||
    nameLower.endsWith('.gslides') ||
    nameLower.endsWith('.pptx') ||
    nameLower.endsWith('.ppt') ||
    nameLower.includes('deck') ||
    nameLower.includes('presentation') ||
    nameLower.includes('slide')
  );

  const col1Description = task?.originalContext || file?.originalContext || file?.draftData?.originalContext || file?.description || 'Collaborator comment requesting updates to this artifact.';
  const col2Description = task?.summaryOfChanges || file?.summaryOfChanges || file?.draftData?.summaryOfChanges || file?.descriptionDone || 'Agent updated the content based on the collaborator comment.';

  const col1Markdown = 
    task?.originalMarkdown || 
    file?.originalMarkdown || 
    (Array.isArray(task?.originalContentLines) ? task.originalContentLines.join('\n') : null) ||
    (Array.isArray(file?.originalContentLines) ? file.originalContentLines.join('\n') : null) ||
    `# ${cleanTitle}\n\n- Baseline content before collaborator review.\n- ${col1Description}`;

  const col2Markdown = 
    task?.updatedMarkdown || 
    file?.updatedMarkdown || 
    (Array.isArray(task?.updatedContentLines) ? task.updatedContentLines.join('\n') : null) ||
    (Array.isArray(file?.updatedContentLines) ? file.updatedContentLines.join('\n') : null) ||
    `# ${cleanTitle}\n\n- ${col2Description}`;

  return (
    <div className={`w-full h-full flex flex-col items-stretch justify-start p-4 sm:p-6 overflow-y-auto transition-colors duration-300 ${
      isDark ? 'bg-[#18191B] text-white' : 'bg-white text-slate-800'
    }`}>
      {/* Full-width container with 16px gap and padding filling available canvas */}
      <div className="w-full grid grid-cols-2 gap-4 sm:gap-6 items-start py-4">
        
        {/* Column 1: Original */}
        <div className="flex flex-col min-w-0">
          {/* Header Title: Google Sans Light 22/28 */}
          <h2 
            className={`font-['Google_Sans_Light','Google_Sans','Inter',sans-serif] text-[22px] leading-[28px] font-light mb-4 truncate ${
              isDark ? 'text-white' : 'text-[#1B1C1D]'
            }`}
          >
            Original
          </h2>

          <div className="mb-4">
            {isSlide ? (
              <SlideCard markdown={col1Markdown} isDark={isDark} />
            ) : (
              <DocCard markdown={col1Markdown} isDark={isDark} />
            )}
          </div>

          <p 
            className={`font-['Google_Sans_Text','Inter',sans-serif] text-[16px] leading-[24px] font-medium ${
              isDark ? 'text-neutral-300' : 'text-[#3C4043]'
            }`}
          >
            {col1Description}
          </p>
        </div>

        {/* Column 2: Suggested Update */}
        <div className="flex flex-col min-w-0">
          {/* Header Title: Google Sans Light 22/28 */}
          <h2 
            className={`font-['Google_Sans_Light','Google_Sans','Inter',sans-serif] text-[22px] leading-[28px] font-light mb-4 truncate ${
              isDark ? 'text-white' : 'text-[#1B1C1D]'
            }`}
          >
            Suggested Update
          </h2>

          <div className="mb-4">
            {isSlide ? (
              <SlideCard markdown={col2Markdown} isDark={isDark} />
            ) : (
              <DocCard markdown={col2Markdown} isDark={isDark} />
            )}
          </div>

          <p 
            className={`font-['Google_Sans_Text','Inter',sans-serif] text-[16px] leading-[24px] font-medium ${
              isDark ? 'text-neutral-300' : 'text-[#3C4043]'
            }`}
          >
            {col2Description}
          </p>
        </div>

      </div>
    </div>
  );
};
