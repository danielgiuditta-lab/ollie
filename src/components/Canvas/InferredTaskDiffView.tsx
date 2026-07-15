import React from 'react';

interface InferredTaskDiffViewProps {
  file: any;
  theme?: 'light' | 'dark';
}

const RenderMarkdown = ({ text, isDark = false }: { text: string; isDark?: boolean }) => {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-2.5 font-sans leading-relaxed text-[13px] sm:text-[14px]">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        // Header 1 (# Title)
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={i} className={`text-[17px] sm:text-[19px] font-bold tracking-tight border-b pb-2 mb-2 ${isDark ? 'text-white border-neutral-700' : 'text-slate-900 border-slate-200'}`}>
              {trimmed.replace(/^#\s+/, '')}
            </h2>
          );
        }

        // Header 2 (## Subheading)
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className={`text-[14px] sm:text-[15px] font-semibold tracking-tight border-b pb-1.5 mb-1.5 ${isDark ? 'text-neutral-100 border-neutral-700' : 'text-slate-800 border-slate-200'}`}>
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }

        // Bullet Point (- item or • item)
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const content = trimmed.replace(/^[\-•]\s*/, '');
          const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
          return (
            <div key={i} className="flex items-start gap-2 pl-0.5">
              <span className={`font-bold shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>•</span>
              <span className={isDark ? 'text-neutral-200' : 'text-slate-700'}>
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
                  }
                  if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={pIdx} className={`px-1.5 py-0.5 rounded text-[12px] font-mono ${isDark ? 'bg-neutral-800 text-amber-300' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>{part.slice(1, -1)}</code>;
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
          <p key={i} className={isDark ? 'text-neutral-300' : 'text-slate-650'}>
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pIdx} className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={pIdx} className={`px-1.5 py-0.5 rounded text-[12px] font-mono ${isDark ? 'bg-neutral-800 text-amber-300' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>{part.slice(1, -1)}</code>;
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
      <RenderMarkdown text={markdown} isDark={isDark} />
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
      <RenderMarkdown text={markdown} isDark={isDark} />
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
    nameLower.includes('kiosk') ||
    nameLower.includes('deck') ||
    nameLower.includes('audit') ||
    nameLower.includes('roadmap') ||
    nameLower.includes('optimization')
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
