import React from 'react';

interface InferredTaskDiffViewProps {
  file: any;
  theme?: 'light' | 'dark';
}

export const RenderDocMarkdown = ({ text, isDark = false }: { text: string; isDark?: boolean }) => {
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
            <h3 key={i} className={`text-[15px] sm:text-[16px] font-bold tracking-tight border-b pb-1 mb-2 mt-4 ${isDark ? 'text-slate-200 border-neutral-700' : 'text-slate-800 border-slate-200'}`}>
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
              <span className={`font-bold shrink-0 mt-1 text-[8px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>●</span>
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

  const lowerText = text.toLowerCase();
  if (lowerText.includes('new drive') || lowerText.includes('drive refresh') || lowerText.includes('ux improvement') || (lowerText.includes('# drive') && lowerText.includes('new drive'))) {
    return (
      <div className="w-full h-full min-h-[220px] flex items-center justify-between px-6 sm:px-10 py-4 select-text">
        <div className="flex flex-col justify-center gap-1.5">
          <span className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 tracking-wide font-sans">
            Drive
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#1F304E] dark:text-white leading-[1.05] font-sans">
            New<br />Drive
          </h1>
        </div>
        <div className="flex items-center justify-center shrink-0">
          <svg viewBox="0 0 87.3 78" className="w-28 h-28 sm:w-40 sm:h-40 shrink-0 drop-shadow-sm">
            <path d="M6.6 66.85l16.15-28 31.95 28H6.6z" fill="#0066DA"/>
            <path d="M43.8 11.15l16.2 28H87.3L71.1 11.15H43.8z" fill="#00AC47"/>
            <path d="M71.1 11.15L54.7 39.55 22.75 38.85 38.95 11.15H71.1z" fill="#EA4335"/>
            <path d="M6.6 66.85L22.75 38.85 54.7 39.55 38.55 66.85H6.6z" fill="#FFBA00"/>
          </svg>
        </div>
      </div>
    );
  }

  const hasH1 = text.trim().startsWith('# ');
  let titleBlock: string | null = null;
  let bodyText = text;

  if (hasH1) {
    const lines = text.split('\n');
    titleBlock = lines[0];
    bodyText = lines.slice(1).join('\n');
  }

  const sections = bodyText.split(/(?=\n## )|(?=^## )|\n---/g).filter(s => s.trim().length > 0);
  const quoteMatch = text.match(/>\s*(.+)/);
  const hasHeroStat = Boolean(quoteMatch);
  // Layout 0: Standalone Big Title Cover Slide Layout (if no sub-sections or body text)
  if (titleBlock && sections.length === 0) {
    return (
      <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 select-text font-sans">
        <h1 className={`text-[32px] sm:text-[44px] font-extrabold tracking-tight leading-[1.15] max-w-2xl ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          {titleBlock.replace(/^#\s+/, '')}
        </h1>
      </div>
    );
  }

  // Layout 1: Hero Stat Layout (Header + Metric Banner Card + Key Takeaways)
  if (hasHeroStat) {
    const heroContent = quoteMatch ? quoteMatch[1] : '';
    const nonQuoteSections = sections.filter(s => !s.trim().startsWith('> '));

    return (
      <div className="flex flex-col gap-3 font-sans w-full select-text">
        {titleBlock && (
          <h2 className={`text-[26px] sm:text-[34px] font-extrabold tracking-tight mb-2 sm:mb-3 leading-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {titleBlock.replace(/^#\s+/, '')}
          </h2>
        )}

        {/* Hero Stat Banner Pill */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
          isDark ? 'bg-neutral-800/90 border-neutral-700 text-amber-300' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <div className="text-[13px] sm:text-[14px] font-bold leading-snug">
            {heroContent.replace(/\*\*/g, '').replace(/`/g, '')}
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-extrabold font-mono tracking-wide ${
            isDark ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-amber-400 text-slate-950'
          }`}>
            KEY METRIC
          </span>
        </div>

        {/* Bullet Points below Hero Metric */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          {nonQuoteSections.map((secStr, sIdx) => (
            <div key={sIdx} className={`p-3.5 rounded-xl border min-w-0 ${
              isDark ? 'bg-neutral-800/50 border-neutral-700/80' : 'bg-slate-50 border-slate-200/80'
            }`}>
              {secStr.split('\n').map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('> ')) return null;
                if (trimmed.startsWith('## ')) {
                  return (
                    <h3 key={lIdx} className={`text-[13px] font-bold pb-1 mb-1 border-b ${isDark ? 'text-slate-200 border-neutral-700' : 'text-slate-800 border-slate-200'}`}>
                      {trimmed.replace(/^##\s+/, '')}
                    </h3>
                  );
                }
                if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                  const content = trimmed.replace(/^[\-•]\s*/, '');
                  return (
                    <div key={lIdx} className="flex items-start gap-1.5 my-1">
                      <span className={`font-bold text-[7px] mt-1 shrink-0 ${isDark ? 'text-amber-400' : 'text-slate-500'}`}>▪</span>
                      <span className={`text-[12px] leading-snug ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
                        {content.replace(/\*\*/g, '')}
                      </span>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className={`text-[12px] leading-snug my-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {trimmed.replace(/\*\*/g, '')}
                  </p>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Layout 2: 3-Column Feature Cards Layout (if 3 or more sections)
  if (sections.length >= 3) {
    return (
      <div className="flex flex-col gap-3 font-sans w-full select-text">
        {titleBlock && (
          <h2 className={`text-[26px] sm:text-[34px] font-extrabold tracking-tight mb-2 sm:mb-3 leading-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {titleBlock.replace(/^#\s+/, '')}
          </h2>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          {sections.map((secStr, sIdx) => (
            <div key={sIdx} className={`p-3.5 rounded-xl border flex flex-col justify-between min-w-0 shadow-2xs ${
              isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-white border-slate-200'
            }`}>
              <div className="space-y-1.5">
                {secStr.split('\n').map((line, lIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;
                  if (trimmed.startsWith('## ')) {
                    return (
                      <h3 key={lIdx} className={`text-[13px] font-bold pb-1 border-b ${isDark ? 'text-amber-300 border-neutral-700' : 'text-slate-900 border-slate-150'}`}>
                        {trimmed.replace(/^##\s+/, '')}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                    return (
                      <p key={lIdx} className={`text-[12px] leading-snug my-1 ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
                        {trimmed.replace(/^[\-•]\s*/, '').replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  return (
                    <p key={lIdx} className={`text-[12px] leading-snug my-1 ${isDark ? 'text-neutral-300' : 'text-slate-600'}`}>
                      {trimmed.replace(/\*\*/g, '')}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Layout 3: 2-Column Split Cards Layout (if 2 sections)
  if (sections.length === 2) {
    return (
      <div className="flex flex-col gap-3 font-sans w-full select-text">
        {titleBlock && (
          <h2 className={`text-[26px] sm:text-[34px] font-extrabold tracking-tight mb-2 sm:mb-3 leading-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {titleBlock.replace(/^#\s+/, '')}
          </h2>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start w-full">
          {sections.map((secStr, sIdx) => (
            <div key={sIdx} className={`p-4 rounded-xl border min-w-0 shadow-2xs ${
              isDark ? 'bg-neutral-800/70 border-neutral-700' : 'bg-slate-50 border-slate-200/90'
            }`}>
              {secStr.split('\n').map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith('## ')) {
                  return (
                    <h3 key={lIdx} className={`text-[14px] font-bold pb-1.5 mb-2 border-b ${isDark ? 'text-slate-100 border-neutral-700' : 'text-slate-900 border-slate-200'}`}>
                      {trimmed.replace(/^##\s+/, '')}
                    </h3>
                  );
                }
                if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                  const content = trimmed.replace(/^[\-•]\s*/, '');
                  return (
                    <div key={lIdx} className="flex items-start gap-2 my-1.5">
                      <span className={`font-bold text-[7px] mt-1 shrink-0 ${isDark ? 'text-amber-400' : 'text-slate-500'}`}>▪</span>
                      <span className={`text-[13px] leading-relaxed ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
                        {content.replace(/\*\*/g, '')}
                      </span>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className={`text-[13px] leading-relaxed my-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                    {trimmed.replace(/\*\*/g, '')}
                  </p>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default Standard Layout
  return (
    <div className="flex flex-col gap-2 font-sans w-full select-text">
      {titleBlock && (
        <h2 className={`text-[19px] sm:text-[22px] font-extrabold tracking-tight mb-2 leading-tight ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          {titleBlock.replace(/^#\s+/, '')}
        </h2>
      )}

      <div className="w-full flex flex-col gap-2">
        {sections.map((secStr, idx) => (
          <div key={idx} className="flex flex-col gap-1 min-w-0">
            {secStr.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={i} className={`text-[14px] font-bold pb-1 border-b ${isDark ? 'text-slate-200 border-neutral-700' : 'text-slate-800 border-slate-200'}`}>
                    {trimmed.replace(/^##\s+/, '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                return (
                  <div key={i} className="flex items-start gap-2 pl-0.5 my-1">
                    <span className={`font-bold shrink-0 mt-1 text-[7px] ${isDark ? 'text-amber-400' : 'text-slate-600'}`}>▪</span>
                    <span className={`text-[13px] leading-relaxed ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
                      {trimmed.replace(/^[\-•]\s*/, '').replace(/\*\*/g, '')}
                    </span>
                  </div>
                );
              }
              return (
                <p key={i} className={`text-[13px] leading-relaxed my-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  {trimmed.replace(/\*\*/g, '')}
                </p>
              );
            })}
          </div>
        ))}
      </div>
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
      isDark ? 'border-[#3E4042] bg-[#1E2024] text-white' : 'border-slate-200/90 bg-[#FAFAFC] text-slate-800'
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
    (typeof file?.content === 'string' && file.content.trim().length > 0 ? file.content : null) ||
    `# ${cleanTitle}\n\n- Baseline content before collaborator review.\n- ${col1Description}`;

  const col2Markdown = 
    task?.updatedMarkdown || 
    file?.updatedMarkdown || 
    (Array.isArray(task?.updatedContentLines) ? task.updatedContentLines.join('\n') : null) ||
    (Array.isArray(file?.updatedContentLines) ? file.updatedContentLines.join('\n') : null) ||
    (typeof file?.content === 'string' && file.content.trim().length > 0 ? file.content : null) ||
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
            <SlideCard markdown={col1Markdown} isDark={isDark} />
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
            <SlideCard markdown={col2Markdown} isDark={isDark} />
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
