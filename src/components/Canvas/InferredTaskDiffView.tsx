import React, { useState, useEffect } from 'react';

interface InferredTaskDiffViewProps {
  file: any;
  theme?: 'light' | 'dark';
  className?: string;
  hideFooterText?: boolean;
}

export const RenderDocMarkdown = ({ text, isDark = false }: { text: string; isDark?: boolean }) => {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div 
      style={{ color: isDark ? '#FFFFFF' : '#111827' }}
      className="space-y-3 font-sans leading-relaxed text-[13px] sm:text-[14px]"
    >
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;

        // Document Section H1 (# Title)
        if (trimmed.startsWith('# ')) {
          return (
            <h2 
              key={i} 
              style={{ color: isDark ? '#FFFFFF' : '#111827' }}
              className={`text-[18px] sm:text-[20px] font-extrabold tracking-tight border-b pb-2 mb-3 ${isDark ? 'border-neutral-700' : 'border-slate-200'}`}
            >
              {trimmed.replace(/^#\s+/, '')}
            </h2>
          );
        }

        // Subheading H2 (## Section Title)
        if (trimmed.startsWith('## ')) {
          return (
            <h3 
              key={i} 
              style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}
              className={`text-[15px] sm:text-[16px] font-bold tracking-tight border-b pb-1 mb-2 mt-4 ${isDark ? 'border-neutral-700' : 'border-slate-200'}`}
            >
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }

        // Subheading H3
        if (trimmed.startsWith('### ')) {
          return (
            <h4 
              key={i} 
              style={{ color: isDark ? '#E5E7EB' : '#1F2937' }}
              className="text-[14px] sm:text-[15px] font-semibold tracking-tight mb-1.5"
            >
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
              <span style={{ color: isDark ? '#9CA3AF' : '#4B5563' }} className="font-bold shrink-0 mt-1 text-[8px]">●</span>
              <span style={{ color: isDark ? '#E5E7EB' : '#1F2937' }} className="leading-snug">
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={pIdx} style={{ color: isDark ? '#FFFFFF' : '#111827' }} className="font-semibold">{part.slice(2, -2)}</strong>;
                  }
                  if (part.startsWith('`') && part.endsWith('`')) {
                    return <code key={pIdx} className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium ${isDark ? 'bg-neutral-800 text-amber-300 border border-neutral-700' : 'bg-slate-100 text-[#111827] border border-slate-200'}`}>{part.slice(1, -1)}</code>;
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
          <p key={i} style={{ color: isDark ? '#D1D5DB' : '#374151' }} className="my-1.5">
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pIdx} style={{ color: isDark ? '#FFFFFF' : '#111827' }} className="font-semibold">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={pIdx} className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${isDark ? 'bg-neutral-800 text-amber-300' : 'bg-slate-100 text-[#111827] border border-slate-200'}`}>{part.slice(1, -1)}</code>;
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
          <span style={{ color: isDark ? '#CBD5E1' : '#4B5563' }} className="text-sm sm:text-base font-medium tracking-wide font-sans">
            Drive
          </span>
          <h1 style={{ color: isDark ? '#FFFFFF' : '#1F304E' }} className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] font-sans">
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
        <div className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'bg-neutral-800/90 text-amber-300' : 'bg-blue-50 text-blue-950'
        }`}>
          <div className="text-[13px] sm:text-[14px] font-bold leading-snug">
            {heroContent.replace(/\*\*/g, '').replace(/`/g, '')}
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-extrabold font-mono tracking-wide ${
            isDark ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-200/70 text-blue-950'
          }`}>
            KEY METRIC
          </span>
        </div>

        {/* Bullet Points below Hero Metric */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          {nonQuoteSections.map((secStr, sIdx) => (
            <div key={sIdx} className={`p-3.5 rounded-xl min-w-0 ${
              isDark ? 'bg-neutral-800/50' : 'bg-slate-50'
            }`}>
              {secStr.split('\n').map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('> ')) return null;
                if (trimmed.startsWith('## ')) {
                  return (
                    <h3 key={lIdx} className={`text-[13px] font-bold pb-1 mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
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
            <div key={sIdx} className={`p-3.5 rounded-xl flex flex-col justify-between min-w-0 ${
              isDark ? 'bg-neutral-800/60 text-white' : 'bg-slate-50 text-slate-900'
            }`}>
              <div className="space-y-1.5">
                {secStr.split('\n').map((line, lIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return null;
                  if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
                    return (
                      <h3 key={lIdx} className={`text-[13px] font-bold pb-1 ${isDark ? 'text-amber-300' : 'text-slate-900'}`}>
                        {trimmed.replace(/^#+\s+/, '')}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                    return (
                      <p key={lIdx} className={`text-[12px] leading-snug my-1 ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                        {trimmed.replace(/^[\-•]\s*/, '').replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  return (
                    <p key={lIdx} className={`text-[12px] leading-snug my-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
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
            <div key={sIdx} className={`p-4 rounded-xl min-w-0 ${
              isDark ? 'bg-neutral-800/70 text-white' : 'bg-slate-50 text-slate-900'
            }`}>
              {secStr.split('\n').map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
                  return (
                    <h3 key={lIdx} className={`text-[14px] font-bold pb-1.5 mb-2 border-b ${isDark ? 'text-slate-100 border-neutral-700' : 'text-slate-900 border-slate-200'}`}>
                      {trimmed.replace(/^#+\s+/, '')}
                    </h3>
                  );
                }
                if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                  const content = trimmed.replace(/^[\-•]\s*/, '');
                  return (
                    <div key={lIdx} className="flex items-start gap-2 my-1.5">
                      <span className={`font-bold text-[7px] mt-1 shrink-0 ${isDark ? 'text-amber-400' : 'text-slate-500'}`}>▪</span>
                      <span className={`text-[13px] leading-relaxed ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
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
              if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
                return (
                  <h3 key={i} className={`text-[14px] font-bold pb-1 border-b ${isDark ? 'text-slate-200 border-neutral-700' : 'text-slate-900 border-slate-200'}`}>
                    {trimmed.replace(/^#+\s+/, '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                return (
                  <div key={i} className="flex items-start gap-2 pl-0.5 my-1">
                    <span className={`font-bold shrink-0 mt-1 text-[7px] ${isDark ? 'text-amber-400' : 'text-slate-600'}`}>▪</span>
                    <span className={`text-[13px] leading-relaxed ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
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

interface BlockItem {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'bullet' | 'p';
  content: string;
}

function parseMarkdownToBlocks(text: string): BlockItem[] {
  if (!text) return [{ id: 'b-0', type: 'p', content: '' }];
  const lines = text.split(/\r?\n/);
  const blocks: BlockItem[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed && idx > 0 && idx < lines.length - 1 && !lines[idx-1].trim()) {
      return;
    }
    const id = `block-${idx}-${Math.random().toString(36).substr(2, 4)}`;
    if (trimmed.startsWith('# ')) {
      blocks.push({ id, type: 'h1', content: trimmed.replace(/^#\s+/, '') });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ id, type: 'h2', content: trimmed.replace(/^##\s+/, '') });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ id, type: 'h3', content: trimmed.replace(/^###\s+/, '') });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      blocks.push({ id, type: 'bullet', content: trimmed.replace(/^[\-•]\s*/, '') });
    } else {
      blocks.push({ id, type: 'p', content: trimmed });
    }
  });

  return blocks.length > 0 ? blocks : [{ id: 'b-0', type: 'p', content: '' }];
}

function serializeBlocksToMarkdown(blocks: BlockItem[]): string {
  return blocks.map(b => {
    if (b.type === 'h1') return `# ${b.content}`;
    if (b.type === 'h2') return `## ${b.content}`;
    if (b.type === 'h3') return `### ${b.content}`;
    if (b.type === 'bullet') return `- ${b.content}`;
    return b.content;
  }).join('\n\n');
}

const RenderFormattedLine = ({
  content,
  type,
  isDark = false,
  onClick
}: {
  content: string;
  type: 'h1' | 'h2' | 'h3' | 'bullet' | 'p';
  isDark?: boolean;
  onClick: () => void;
}) => {
  const parseInline = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={pIdx} className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${isDark ? 'bg-neutral-800 text-amber-300' : 'bg-slate-100 text-slate-900 border border-slate-200'}`}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (type === 'h1') {
    return (
      <h2
        onClick={onClick}
        className={`w-full text-[18px] sm:text-[20px] font-extrabold tracking-tight border-b pb-1 cursor-text select-text ${
          isDark ? 'text-white border-neutral-700' : 'text-slate-900 border-slate-200'
        }`}
      >
        {parseInline(content) || '\u00A0'}
      </h2>
    );
  }

  if (type === 'h2') {
    return (
      <h3
        onClick={onClick}
        className={`w-full text-[15px] sm:text-[16px] font-bold tracking-tight border-b pb-1 mt-2 cursor-text select-text ${
          isDark ? 'text-slate-100 border-neutral-700' : 'text-slate-800 border-slate-200'
        }`}
      >
        {parseInline(content) || '\u00A0'}
      </h3>
    );
  }

  if (type === 'h3') {
    return (
      <h4
        onClick={onClick}
        className={`w-full text-[14px] sm:text-[15px] font-semibold tracking-tight cursor-text select-text ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}
      >
        {parseInline(content) || '\u00A0'}
      </h4>
    );
  }

  if (type === 'bullet') {
    return (
      <div onClick={onClick} className="flex items-start gap-2.5 pl-1 my-0.5 cursor-text select-text">
        <span className={`font-bold shrink-0 mt-1 text-[8px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>●</span>
        <span className={`w-full text-[13px] sm:text-[14px] leading-snug ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {parseInline(content) || '\u00A0'}
        </span>
      </div>
    );
  }

  return (
    <p
      onClick={onClick}
      className={`w-full text-[13px] sm:text-[14px] leading-relaxed cursor-text select-text min-h-[22px] ${
        isDark ? 'text-slate-300' : 'text-slate-700'
      }`}
    >
      {parseInline(content) || '\u00A0'}
    </p>
  );
};

export const RenderBlockMarkdownEditor = ({
  text,
  isDark = false,
  isSlide = false,
  onChange
}: {
  text: string;
  isDark?: boolean;
  isSlide?: boolean;
  onChange?: (newMarkdown: string) => void;
}) => {
  const [blocks, setBlocks] = useState<BlockItem[]>(() => parseMarkdownToBlocks(text));
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(null);

  useEffect(() => {
    setBlocks(parseMarkdownToBlocks(text));
  }, [text]);

  const updateBlock = (index: number, newContent: string) => {
    const next = [...blocks];
    let type = next[index].type;

    if (type === 'p' && (newContent.startsWith('- ') || newContent.startsWith('• '))) {
      type = 'bullet';
      newContent = newContent.replace(/^[\-•]\s*/, '');
    }

    next[index] = { ...next[index], type, content: newContent };
    setBlocks(next);
    if (onChange) {
      onChange(serializeBlocksToMarkdown(next));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const currentBlock = blocks[index];
      const nextType = (currentBlock.type === 'h1' || currentBlock.type === 'h2' || currentBlock.type === 'h3') ? 'p' : currentBlock.type;
      
      const newBlock: BlockItem = {
        id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: nextType,
        content: ''
      };
      const next = [...blocks];
      next.splice(index + 1, 0, newBlock);
      setBlocks(next);
      setFocusedBlockIndex(index + 1);
      if (onChange) onChange(serializeBlocksToMarkdown(next));
    } else if (e.key === 'Backspace' && blocks[index].content === '' && blocks.length > 1) {
      e.preventDefault();
      const next = blocks.filter((_, i) => i !== index);
      setBlocks(next);
      setFocusedBlockIndex(Math.max(0, index - 1));
      if (onChange) onChange(serializeBlocksToMarkdown(next));
    }
  };

  return (
    <div className={`w-full h-full flex flex-col justify-start space-y-2 select-text ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {blocks.map((block, i) => {
        const isEditingThisLine = focusedBlockIndex === i;

        if (!isEditingThisLine) {
          return (
            <RenderFormattedLine
              key={block.id || i}
              content={block.content}
              type={block.type}
              isDark={isDark}
              onClick={() => setFocusedBlockIndex(i)}
            />
          );
        }

        if (block.type === 'h1') {
          return (
            <textarea
              key={block.id || i}
              autoFocus
              value={block.content}
              onChange={(e) => updateBlock(i, e.target.value)}
              onBlur={() => setFocusedBlockIndex(null)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              rows={1}
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = `${el.scrollHeight}px`;
                }
              }}
              className={`w-full bg-transparent text-[18px] sm:text-[20px] font-extrabold tracking-tight border-b pb-1 focus:outline-none resize-none font-sans ${
                isDark ? 'text-white border-neutral-700' : 'text-slate-900 border-slate-200'
              }`}
            />
          );
        }

        if (block.type === 'h2') {
          return (
            <textarea
              key={block.id || i}
              autoFocus
              value={block.content}
              onChange={(e) => updateBlock(i, e.target.value)}
              onBlur={() => setFocusedBlockIndex(null)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              rows={1}
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = `${el.scrollHeight}px`;
                }
              }}
              className={`w-full bg-transparent text-[15px] sm:text-[16px] font-bold tracking-tight border-b pb-1 mt-2 focus:outline-none resize-none font-sans ${
                isDark ? 'text-slate-100 border-neutral-700' : 'text-slate-800 border-slate-200'
              }`}
            />
          );
        }

        if (block.type === 'h3') {
          return (
            <textarea
              key={block.id || i}
              autoFocus
              value={block.content}
              onChange={(e) => updateBlock(i, e.target.value)}
              onBlur={() => setFocusedBlockIndex(null)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              rows={1}
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = `${el.scrollHeight}px`;
                }
              }}
              className={`w-full bg-transparent text-[14px] sm:text-[15px] font-semibold tracking-tight focus:outline-none resize-none font-sans ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}
            />
          );
        }

        if (block.type === 'bullet') {
          return (
            <div key={block.id || i} className="flex items-start gap-2.5 pl-1 my-0.5">
              <span className={`font-bold shrink-0 mt-1.5 text-[8px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>●</span>
              <textarea
                autoFocus
                value={block.content}
                onChange={(e) => updateBlock(i, e.target.value)}
                onBlur={() => setFocusedBlockIndex(null)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                rows={1}
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = `${el.scrollHeight}px`;
                  }
                }}
                className={`w-full bg-transparent text-[13px] sm:text-[14px] leading-snug focus:outline-none resize-none font-sans ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              />
            </div>
          );
        }

        return (
          <textarea
            key={block.id || i}
            autoFocus
            value={block.content}
            onChange={(e) => updateBlock(i, e.target.value)}
            onBlur={() => setFocusedBlockIndex(null)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            rows={1}
            ref={(el) => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = `${el.scrollHeight}px`;
              }
            }}
            className={`w-full bg-transparent text-[13px] sm:text-[14px] leading-relaxed focus:outline-none resize-none font-sans ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          />
        );
      })}
    </div>
  );
};

export const RenderEditableMarkdown = RenderBlockMarkdownEditor;

const SlideCard = ({
  markdown = "",
  isDark = false,
  onChange
}: {
  markdown?: string;
  isDark?: boolean;
  onChange?: (val: string) => void;
}) => {
  return (
    <div className={`w-full h-full flex-1 min-h-0 rounded-[20px] p-6 sm:p-7 flex flex-col justify-start relative overflow-y-auto select-text transition-all duration-300 ${
      isDark ? 'bg-[#1E2024] text-white' : 'bg-white text-slate-900 border border-slate-200/80 shadow-xs'
    }`}>
      <RenderBlockMarkdownEditor text={markdown} isDark={isDark} isSlide={true} onChange={onChange} />
    </div>
  );
};

const DocCard = ({
  markdown = "",
  isDark = false,
  onChange
}: {
  markdown?: string;
  isDark?: boolean;
  onChange?: (val: string) => void;
}) => {
  return (
    <div className={`w-full h-full flex-1 min-h-0 rounded-[18px] p-6 sm:p-7 flex flex-col justify-start relative overflow-y-auto select-text transition-all duration-300 ${
      isDark ? 'bg-[#222427] text-white' : 'bg-white text-slate-900 border border-slate-200/80 shadow-xs'
    }`}>
      <RenderBlockMarkdownEditor text={markdown} isDark={isDark} isSlide={false} onChange={onChange} />
    </div>
  );
};

export const InferredTaskDiffView: React.FC<InferredTaskDiffViewProps> = ({ file, theme = 'light', className, hideFooterText = false }) => {
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

  const defaultClasses = `w-full h-full flex flex-col items-stretch justify-start p-4 sm:p-6 overflow-y-auto transition-colors duration-300 ${
    isDark ? 'bg-[#18191B] text-white' : 'bg-white text-slate-800'
  }`;

  const CardComponent = isSlide ? SlideCard : DocCard;
  const isOuterDark = isDark || Boolean(className?.includes('bg-transparent'));
  const headerTextColor = isOuterDark ? 'text-white/90 dark:text-white/90' : 'text-[#1B1C1D]';

  return (
    <div className={className || defaultClasses}>
      {/* Full-width container filling available canvas height */}
      <div className={`w-full grid grid-cols-2 gap-4 sm:gap-6 ${hideFooterText ? 'items-stretch h-full flex-1 min-h-0 pt-0 pb-0' : 'items-start py-4'}`}>
        
        {/* Column 1: Original */}
        <div className={`flex flex-col min-w-0 ${hideFooterText ? 'flex-1 h-full min-h-0 overflow-hidden' : ''}`}>
          {/* Header Title: Google Sans Light 22/28 */}
          <h2 
            className={`font-['Google_Sans_Light','Google_Sans','Inter',sans-serif] text-[22px] leading-[28px] font-light mb-4 truncate shrink-0 ${headerTextColor}`}
          >
            Original
          </h2>

          <div className={hideFooterText ? "mb-0 flex-1 min-h-0 flex flex-col overflow-hidden" : "mb-4"}>
            <CardComponent 
              markdown={col1Markdown} 
              isDark={isDark} 
              onChange={(val: string) => {
                if (file) file.originalMarkdown = val;
                if (task) task.originalMarkdown = val;
              }}
            />
          </div>

          {!hideFooterText && (
            <p 
              className={`font-['Google_Sans_Text','Inter',sans-serif] text-[16px] leading-[24px] font-medium ${
                isDark ? 'text-neutral-300' : 'text-[#3C4043]'
              }`}
            >
              {col1Description}
            </p>
          )}
        </div>

        {/* Column 2: Suggested Update */}
        <div className={`flex flex-col min-w-0 ${hideFooterText ? 'flex-1 h-full min-h-0 overflow-hidden' : ''}`}>
          {/* Header Title: Google Sans Light 22/28 */}
          <h2 
            className={`font-['Google_Sans_Light','Google_Sans','Inter',sans-serif] text-[22px] leading-[28px] font-light mb-4 truncate shrink-0 ${headerTextColor}`}
          >
            Suggested Update
          </h2>

          <div className={hideFooterText ? "mb-0 flex-1 min-h-0 flex flex-col overflow-hidden" : "mb-4"}>
            <CardComponent 
              markdown={col2Markdown} 
              isDark={isDark} 
              onChange={(val: string) => {
                if (file) {
                  file.updatedMarkdown = val;
                  file.content = val;
                }
                if (task) {
                  task.updatedMarkdown = val;
                }
              }}
            />
          </div>

          {!hideFooterText && (
            <p 
              className={`font-['Google_Sans_Text','Inter',sans-serif] text-[16px] leading-[24px] font-medium ${
                isDark ? 'text-neutral-300' : 'text-[#3C4043]'
              }`}
            >
              {col2Description}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
