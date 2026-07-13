import { useState, useEffect, useCallback } from 'react';

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
      localStorage.setItem('drive_recent_tasks', JSON.stringify(recentTasks));
    } catch (e) {
      console.warn('Failed to save drive_recent_tasks to localStorage (quota exceeded):', e);
    }
  }, [recentTasks]);

  useEffect(() => {
    try {
      localStorage.setItem('drive_projects', JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save drive_projects to localStorage (quota exceeded):', e);
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
