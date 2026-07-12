export interface ChildChatSession {
  id: string;
  spaceId?: string;
  activeSpaceId?: string;
  taskType?: 'site' | 'tool' | 'doc' | 'slide' | 'sheet' | 'inferred' | 'tracking';
  associatedFileId?: string;
  associatedFileName?: string;
  chatName?: string;
  type?: string;
  raw?: any;
}

export interface SpaceContainer {
  id: string;
  name: string;
  type: string;
  pinnedArtifactIds?: string[];
  sandboxFiles?: any[];
}

export const inferChatName = (text: string): string => {
  const clean = text.replace(/[#*`_\[\]]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'New Chat';
  const candidate = words.slice(0, 5).join(' ');
  return candidate.length > 30 ? candidate.substring(0, 27) + '...' : candidate;
};

export const findAssociatedChatForFile = (file: any, recentTasks: any[]): any | null => {
  if (!file || !recentTasks || recentTasks.length === 0) return null;
  const fileId = file.id || file.driveId;

  if (fileId) {
    const match = recentTasks.find(t => t && (t.associatedFileId === fileId || t.raw?.associatedFileId === fileId));
    if (match) return match;
  }

  if (file.chatId) {
    const match = recentTasks.find(t => t && t.id === file.chatId);
    if (match) return match;
  }

  return null;
};

export const resolveArtifactForChat = (files: any[], task: any, taskType: string): any => {
  if (!files || files.length === 0) return null;
  
  // 1. Try explicit unique ID association first
  const associatedId = task?.associatedFileId || task?.raw?.associatedFileId;
  
  if (associatedId) {
    const byId = files.find(f => f && (f.id === associatedId || f.driveId === associatedId));
    if (byId) return byId;
  }

  // 2. Filter candidates strictly by taskType
  let candidates: any[] = [];
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
    return null;
  }

  // 3. Match within type candidates using strict chatName matching (never fallback to space name!)
  const chatName = (task?.chatName || task?.raw?.chatName || '').trim().toLowerCase();
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

