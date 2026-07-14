import { useState, useEffect, useCallback } from 'react';

function sanitizeForLocalStorage(items: any[]) {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (!item || typeof item !== 'object') return item;
    const sanitized = { ...item };
    
    // Strip heavy file contents from localStorage cache
    if (Array.isArray(sanitized.sandboxFiles)) {
      sanitized.sandboxFiles = sanitized.sandboxFiles.map((f: any) => {
        if (!f) return f;
        const { content, ...restFile } = f;
        return restFile;
      });
    }

    // Trim heavy message array buffers if present
    if (Array.isArray(sanitized.messages) && sanitized.messages.length > 10) {
      sanitized.messages = sanitized.messages.slice(-5);
    }

    return sanitized;
  });
}

export function useWorkspaceState(userProfile: any) {
  const [recentTasks, setRecentTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('drive_recent_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(t => {
            if (t && typeof t === 'object') {
              const lowerName = (t.name || '').toLowerCase().trim();
              const lowerSpaceId = String(t.activeSpaceId || t.id || '').toLowerCase().trim();
              if (lowerName === 'home' || lowerSpaceId === 'home' || lowerSpaceId === 'home_guest' || lowerSpaceId.startsWith('home_') || lowerSpaceId.startsWith('home-')) {
                return { ...t, activeSpaceId: 'home', name: 'Home' };
              }
            }
            return t;
          });
        }
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  const [projects, setProjects] = useState<any[]>(() => {
    const saved = localStorage.getItem('drive_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [];
  });

  useEffect(() => {
    try {
      const lightData = sanitizeForLocalStorage(recentTasks);
      localStorage.setItem('drive_recent_tasks', JSON.stringify(lightData));
    } catch (e) {
      try {
        const minimal = recentTasks.map(t => ({
          id: t?.id,
          name: t?.name,
          activeSpaceId: t?.activeSpaceId,
          taskType: t?.taskType,
          pinnedArtifactIds: t?.pinnedArtifactIds,
          associatedFileId: t?.associatedFileId,
          associatedFileName: t?.associatedFileName
        }));
        localStorage.setItem('drive_recent_tasks', JSON.stringify(minimal));
      } catch (fallbackErr) {
        // Safe silent catch if storage is completely full
      }
    }
  }, [recentTasks]);

  useEffect(() => {
    try {
      const lightData = sanitizeForLocalStorage(projects);
      localStorage.setItem('drive_projects', JSON.stringify(lightData));
    } catch (e) {
      try {
        const minimal = projects.map(p => ({
          id: p?.id,
          name: p?.name,
          activeSpaceId: p?.activeSpaceId,
          taskType: p?.taskType,
          pinnedArtifactIds: p?.pinnedArtifactIds,
          associatedFileId: p?.associatedFileId,
          associatedFileName: p?.associatedFileName
        }));
        localStorage.setItem('drive_projects', JSON.stringify(minimal));
      } catch (fallbackErr) {
        // Safe silent catch if storage is completely full
      }
    }
  }, [projects]);

  const [activeSpaceId, setActiveSpaceId] = useState<string | null>('home_guest');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [spaceModes, setSpaceModes] = useState<Record<string, 'choice' | 'tracking' | 'tool'>>({});
  const [newlyCreatedSpaceIds, setNewlyCreatedSpaceIds] = useState<Set<string>>(new Set());
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [spaceCreationSources, setSpaceCreationSources] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const getHomeChatId = useCallback(() => {
    const email = userProfile?.email || 'guest';
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9_\-]/g, "_");
    return `home_${sanitizedEmail}`;
  }, [userProfile?.email]);

  const isHomeChatId = useCallback((id: string | null) => {
    if (!id) return true;
    const lower = String(id).toLowerCase().trim();
    return lower === 'home' || lower === 'home_guest' || lower.startsWith('home_') || lower.startsWith('home-') || lower === 'home dashboard';
  }, []);

  return {
    recentTasks,
    setRecentTasks,
    projects,
    setProjects,
    activeSpaceId,
    setActiveSpaceId,
    activeChatId,
    setActiveChatId,
    spaceModes,
    setSpaceModes,
    newlyCreatedSpaceIds,
    setNewlyCreatedSpaceIds,
    isCreatingSpace,
    setIsCreatingSpace,
    spaceCreationSources,
    setSpaceCreationSources,
    members,
    setMembers,
    getHomeChatId,
    isHomeChatId
  };
}
