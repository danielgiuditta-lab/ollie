export const inferChatName = (text: string): string => {
  const clean = text.replace(/[#*`_\[\]]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'New Chat';
  const candidate = words.slice(0, 5).join(' ');
  return candidate.length > 30 ? candidate.substring(0, 27) + '...' : candidate;
};

export const resolveArtifactForChat = (files: any[], task: any, taskType: string): any => {
  if (!files || files.length === 0) return null;
  
  // 1. Try explicit ID/name association first
  const associatedId = task?.associatedFileId || task?.raw?.associatedFileId;
  const associatedName = task?.associatedFileName || task?.raw?.associatedFileName;
  
  if (associatedId) {
    const byId = files.find(f => f && (f.id === associatedId || f.driveId === associatedId));
    if (byId) return byId;
  }
  if (associatedName) {
    const byName = files.find(f => f && f.name && f.name.toLowerCase() === associatedName.toLowerCase());
    if (byName) return byName;
  }

  // 2. Filter candidates strictly by taskType
  let candidates = files;
  if (taskType === 'doc') {
    candidates = files.filter(f => f && f.name && (f.name.toLowerCase().endsWith('.doc') || f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.md') || f.name.toLowerCase().endsWith('.txt') || f.isDocJourney || f.mimeType?.includes('document')));
  } else if (taskType === 'slide') {
    candidates = files.filter(f => f && f.name && (f.name.toLowerCase().endsWith('.gslides') || f.name.toLowerCase().endsWith('.ppt') || f.name.toLowerCase().endsWith('.pptx') || f.mimeType?.includes('presentation')));
  } else if (taskType === 'sheet') {
    candidates = files.filter(f => f && f.name && (f.name.toLowerCase().endsWith('.gsheet') || f.name.toLowerCase().endsWith('.csv') || f.name.toLowerCase().endsWith('.xls') || f.name.toLowerCase().endsWith('.xlsx') || f.mimeType?.includes('spreadsheet')));
  } else if (taskType === 'site' || taskType === 'tool') {
    candidates = files.filter(f => f && f.name && (f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.js') || f.name.toLowerCase().endsWith('.css')));
  } else if (taskType === 'inferred' || taskType === 'tracking') {
    candidates = files.filter(f => f && f.name && f.name.toLowerCase() === 'inferred_tasks.json');
  }

  if (candidates.length === 0) {
    candidates = files;
  }

  // 3. Match within type candidates using strict name matching
  const chatName = (task?.chatName || task?.name || '').trim().toLowerCase();
  if (chatName && chatName !== 'new document' && chatName !== 'custom tool' && chatName !== 'new slide deck' && chatName !== 'new spreadsheet') {
    const exactBase = candidates.find(f => {
      if (!f || !f.name) return false;
      const baseName = f.name.toLowerCase().replace(/\.[^/.]+$/, '').trim();
      return baseName === chatName;
    });
    if (exactBase) return exactBase;

    if (chatName.length >= 4) {
      const prefixMatch = candidates.find(f => {
        if (!f || !f.name) return false;
        const baseName = f.name.toLowerCase().replace(/\.[^/.]+$/, '').trim();
        return baseName.length >= 4 && (baseName.startsWith(chatName) || chatName.startsWith(baseName));
      });
      if (prefixMatch) return prefixMatch;
    }
  }

  // 4. Default to standard type defaults among candidates
  if (taskType === 'site' || taskType === 'tool') {
    return candidates.find(f => f && f.name && (f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('.html'))) || candidates[0] || null;
  } else if (taskType === 'doc') {
    return candidates.find(f => f && f.name && (f.name.toLowerCase().endsWith('.doc') || f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase() === 'document.doc')) || candidates[0] || null;
  } else if (taskType === 'slide') {
    return candidates.find(f => f && f.name && (f.name.toLowerCase().endsWith('.gslides') || f.name.toLowerCase().endsWith('.ppt') || f.name.toLowerCase().endsWith('.pptx'))) || candidates[0] || null;
  } else if (taskType === 'inferred' || taskType === 'tracking') {
    return candidates.find(f => f && f.name && f.name.toLowerCase() === 'inferred_tasks.json') || candidates[0] || null;
  }

  return candidates[0] || null;
};
