import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { AnimatePresence } from 'motion/react';
import { LeftNav } from './components/Navigation/LeftNav';
import { TopBar } from './components/Navigation/TopBar';
import { CanvasHeader } from './components/Navigation/CanvasHeader';
import { CanvasMain } from './components/Canvas/CanvasMain';
import { AppView } from './components/Canvas/AppView';
import { FilesList } from './components/Canvas/FilesList';
import { FileViewer } from './components/Canvas/FileViewer';
import { ChatSidebar } from './components/Chat/ChatSidebar';
import { usePresence } from './hooks/usePresence';
import { PeerCursors } from './components/Canvas/PeerCursors';
import { CanvasSidebar } from './components/Canvas/CanvasSidebar';
import { NativeViewer } from './components/Canvas/NativeViewer';
import { HomeLanding, SUGGESTED_ITEMS, DEFAULT_TODO_ITEMS, cleanWorkspaceName } from './components/Canvas/HomeLanding';
import { Composer } from './components/Chat/Composer';
import { AISummaryView } from './components/Canvas/AISummaryView';
import { ComponentsCatalog } from './components/ComponentsCatalog';
import { FileIcon } from './components/Shared/FileIcon';
import { ShapeLoader } from './components/Shared/ShapeLoader';
const inferChatName = (text: string): string => {
  const clean = text.replace(/[#*`_\[\]]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'New Chat';
  const candidate = words.slice(0, 5).join(' ');
  return candidate.length > 30 ? candidate.substring(0, 27) + '...' : candidate;
};

const resolveArtifactForChat = (files: any[], task: any, taskType: string): any => {
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

  // 3. Match within type candidates using strict name matching (exact base name without extension)
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

export default function App() {
  const [activeSidebar, setActiveSidebar] = useState<'gemini' | 'comments' | 'history' | null>('gemini');
  const [chatDockPosition, setChatDockPosition] = useState<'side' | 'bottom'>('side');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewState, setViewState] = useState<'home' | 'null' | 'app' | 'files' | 'file_viewer' | 'projector' | 'public_projector' | 'ai_summary'>('home');
  const [homeJourney, setHomeJourney] = useState<'search' | 'create'>('search');
  const [projectName, setProjectName] = useState('New');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [aiSummarySources, setAiSummarySources] = useState<any[]>([]);
  const [aiSummaryMessages, setAiSummaryMessages] = useState<any[]>([]);
  const [activeAiSummaryTaskId, setActiveAiSummaryTaskId] = useState<string | null>(null);
  const [isAiSummarySnapped, setIsAiSummarySnapped] = useState(false);
  const [previousViewState, setPreviousViewState] = useState<'home' | 'null' | 'app' | 'files' | 'file_viewer' | 'projector' | 'public_projector' | 'ai_summary' | null>(null);
  const lastSelectedFileRef = useRef<string | null>(null);

  const [chatModel, setChatModel] = useState<'A' | 'B'>(() => {
    return (localStorage.getItem('chat-model') as 'A' | 'B') || 'A';
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [spaceModes, setSpaceModes] = useState<Record<string, 'choice' | 'tracking' | 'tool'>>({});
  const [newlyCreatedSpaceIds, setNewlyCreatedSpaceIds] = useState<Set<string>>(new Set());


  // Unified filesystem mapping states
  const [directoryContentsMap, setFolderContentsMap] = useState<Record<string, any[]>>({});
  const [loadingDirectories, setLoadingFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedFile && selectedFile.name) {
      const fileName = selectedFile.name;
      if (fileName !== lastSelectedFileRef.current) {
        lastSelectedFileRef.current = fileName;
        if (fileName.includes('/')) {
          const parts = fileName.split('/').filter(Boolean);
          const parentPath = parts.length > 1 ? parts.slice(0, parts.length - 1) : [];
          setCurrentPath(parentPath);
        }
      }
    } else if (!selectedFile) {
      lastSelectedFileRef.current = null;
    }
  }, [selectedFile]);
  const [messages, setMessages] = useState<any[]>([]);
  const [envId, setEnvId] = useState<string | null>(null);
  const [sandboxUrl, setSandboxUrl] = useState<string>('');
  const [sandboxFiles, setSandboxFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Agent File Moving Animation overlay states
  const [geminiCursor, setGeminiCursor] = useState<{
    x: number;
    y: number;
    visible: boolean;
    status: 'idle' | 'grabbing';
  }>({ x: 0, y: 0, visible: false, status: 'idle' });

  const [flyingClones, setFlyingClones] = useState<Array<{
    id: string;
    name: string;
    mimeType?: string;
    x: number;
    y: number;
  }>>([]);

  const [particleBursts, setParticleBursts] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [impactSpaceId, setImpactFolderId] = useState<string | null>(null);
  const [animatingFileIds, setAnimatingFileIds] = useState<string[]>([]);
  const [isOrganizingFiles, setIsOrganizingFiles] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<string>('app');
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>(() => {
    const saved = (localStorage.getItem('manual-theme') || localStorage.getItem('app-theme')) as 'light' | 'dark' | null;
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      return 'dark';
    }
    document.documentElement.classList.remove('dark');
    return 'light';
  });
  const toggleAppTheme = () => {
    const nextTheme = appTheme === 'light' ? 'dark' : 'light';
    setAppTheme(nextTheme);
    localStorage.setItem('manual-theme', nextTheme);
    localStorage.setItem('app-theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestedFiles, setIngestedFiles] = useState<any[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [indexFileSelected, setIndexFileSelected] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'file' | 'preview'>('preview');

  // LeftNav open/close state, Recent Tasks session list, and Pinned Projects
  const [isLeftNavExpanded, setIsLeftNavExpanded] = useState(false);
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
    localStorage.setItem('drive_recent_tasks', JSON.stringify(recentTasks));
  }, [recentTasks]);

  useEffect(() => {
    localStorage.setItem('drive_projects', JSON.stringify(projects));
  }, [projects]);

  const [userProfile, setUserProfile] = useState<any>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  // Cached suggested files / templates for HomeLanding to prevent redundant loadings
  const [suggestedListCache, setSuggestedListCache] = useState<any[]>(SUGGESTED_ITEMS);
  const [isDriveSuggestLoading, setIsDriveSuggestLoading] = useState(false);

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

  // Spaces Platform States
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<any[]>([]);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>('home_guest');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [spaceCreationSources, setSpaceCreationSources] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'failed'>('idle');
  const [members, setMembers] = useState<any[]>([]);
  const [isSourcesPanelOpen, setIsSourcesPanelOpen] = useState(true);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [bypassAuth, setBypassAuth] = useState(false);
  const [todoItems, setTodoItems] = useState<any[]>(() => DEFAULT_TODO_ITEMS);
  const [activeProactiveTask, setActiveProactiveTask] = useState<any | null>(null);
  const isLoggedIn = accessToken !== null || bypassAuth;

  const fetchGeminiTasks = async (token?: string | null, email?: string) => {
    try {
      let driveTasksMap = new Map<string, string>();
      if (token) {
        try {
          const foldersQ = "trashed = false and mimeType = 'application/vnd.google-apps.folder'";
          const foldersUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(foldersQ)}&pageSize=30&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,properties)`;
          const foldersRes = await fetch(foldersUrl, { headers: { Authorization: `Bearer ${token}` } });
          if (foldersRes.ok) {
            const foldersData = await foldersRes.json();
            const foldersList = foldersData.files || [];
            foldersList.forEach((f: any) => driveTasksMap.set(f.id, f.name));
          }
        } catch (e) {
          console.error("Error fetching drive folders for task mapping:", e);
        }
      }

      let firestoreTasks: any[] = [];
      const targetEmail = email || 'all';
      try {
        const fRes = await fetch(`/api/user-chats/${encodeURIComponent(targetEmail)}`);
        if (fRes.ok) {
          const list = await fRes.json();
          firestoreTasks = list.map((c: any) => {
            const isAiSummary = c.chatId && c.chatId.startsWith('ai-summary-');
            const time = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
            const folderId = c.activeSpaceId || c.chatId;
            const validProjectName = c.projectName && c.projectName !== 'Workspace' && c.projectName !== 'Workspace Project' && c.projectName !== 'New Workspace' && c.projectName !== 'Web App Project';
            const folderName = validProjectName ? c.projectName : (driveTasksMap.get(folderId) || c.projectName || "Workspace");
            return {
              id: c.chatId,
              name: folderName,
              chatName: c.chatName || '',
              type: isAiSummary ? 'ai_summary' : 'workspace',
              messages: c.messages || [],
              activeSpaceId: c.activeSpaceId || null,
              updatedAt: time
            };
          });
        }
      } catch (fErr) {
        console.error("Error fetching user chats from Firestore:", fErr);
      }

      // Filter to only items with active messages/LLM interactions or workspaces/spaces, and exclude home chats
      const mergedTasks = firestoreTasks.filter(ft => 
        !isHomeChatId(ft.id) && 
        (ft.type === 'workspace' || (ft.messages && ft.messages.length > 0))
      );
      
      // Sort reverse-chronologically by timestamp
      mergedTasks.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      setRecentTasks(mergedTasks);
    } catch (err) {
      console.error("Error loading Gemini tasks from Drive/DB:", err);
    }
  };

  useEffect(() => {
    fetchGeminiTasks(accessToken, userProfile?.email);
  }, [accessToken, userProfile?.email]);

  useEffect(() => {
    const homeId = getHomeChatId();
    const loadHomeChat = async () => {
      try {
        const chatRes = await fetch(`/api/chats/${homeId}`);
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (chatData && chatData.messages) {
            setMessages(chatData.messages);
            return;
          }
        }
        setMessages([]);
      } catch (err) {
        console.error("Failed to load home chat:", err);
        setMessages([]);
      }
    };

    if (isHomeChatId(activeSpaceId)) {
      setActiveSpaceId(homeId);
      setActiveChatId(homeId);
      setProjectName('Home Dashboard');
      loadHomeChat();
    }
  }, [userProfile?.email]);

  useEffect(() => {
    if (selectedFile) {
      setViewMode('preview');
      setIndexFileSelected(selectedFile.name.toLowerCase() === 'index.html');
    }
  }, [selectedFile?.name, selectedFile?.id]);

  // Ref to track the last saved content of each file to avoid redundant Google Drive uploads and prevent Rate Limit Exceeded
  const lastSavedContentsRef = useRef<Record<string, string>>({});

  // In-memory cache for loaded workspace states to prevent redundant fetches and make toggling instantaneous
  const workspaceCacheRef = useRef<Record<string, {
    ingestedFiles: any[];
    sandboxFiles: any[];
    envId: string | null;
    sandboxUrl: string;
    messages: any[];
    projectName: string;
    selectedFile: any;
    indexFileSelected: boolean;
    viewState?: 'home' | 'null' | 'app' | 'files' | 'file_viewer' | 'projector' | 'public_projector' | 'ai_summary';
  }>>({});

  const chatSessionsCacheRef = useRef<Record<string, {
    messages: any[];
  }>>({});

  const todoCacheRef = useRef<Record<string, any[]>>({});

  // Tracks the folder/workspace ID that is currently loaded in the React state.
  // Helps avoid race conditions when switching folders before all asynchronous updates resolve.
  const [loadedFolderId, setLoadedFolderId] = useState<string | null>(null);

  // Keep track of active folder ID to prevent race conditions during async fetches
  const activeSpaceIdRef = useRef<string | null>(null);

  // Timeout ref to debounce silent background updates when clicking between spaces in the LeftNav
  const syncTimeoutRef = useRef<any>(null);

  // Synchronize active workspace state changes back to the in-memory cache
  useEffect(() => {
    if (activeSpaceId && loadedFolderId === activeSpaceId) {
      workspaceCacheRef.current[activeSpaceId] = {
        ingestedFiles,
        sandboxFiles,
        envId,
        sandboxUrl,
        messages,
        projectName,
        selectedFile,
        indexFileSelected,
        viewState
      };
    }
  }, [activeSpaceId, loadedFolderId, messages, sandboxFiles, ingestedFiles, envId, sandboxUrl, projectName, selectedFile, indexFileSelected, viewState]);

  useEffect(() => {
    if (!activeChatId?.includes('-proactive-')) {
      setActiveProactiveTask(null);
    }
  }, [activeSpaceId]);

  // Synchronize active chat messages back to the in-memory cache
  useEffect(() => {
    if (activeChatId) {
      chatSessionsCacheRef.current[activeChatId] = {
        messages
      };
    }
  }, [activeChatId, messages]);


  // Ref to track file IDs created from the composer in order to format output of blank docs
  const createdFromComposerFileIdsRef = useRef<Set<string>>(new Set());

  // Initialize cursor tracking and co-presence
  const { peers, localUser, registerIframe } = usePresence(userProfile, envId);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Login Success:', tokenResponse);
      const token = tokenResponse.access_token;
      setAccessToken(token);

      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          setUserProfile(userInfo);
        }
      } catch (e) {
        console.error('Failed to fetch user info', e);
      }

      setIsDriveLoading(true);
      try {
        const driveRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,size,owners)&orderBy=modifiedTime desc', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (driveRes.ok) {
          const driveData = await driveRes.json();
          setDriveFiles(driveData.files || []);
        }
      } catch (e) {
        console.error('Failed to fetch drive files', e);
      } finally {
        setIsDriveLoading(false);
      }
    },
    onError: () => console.log('Login Failed'),
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/chat.messages.readonly profile email',
  });

  const logout = () => {
    setAccessToken(null);
    setUserProfile(null);
    setDriveFiles([]);
    setRecentTasks([]);
  };

  const handleRemoveTask = async (task: any) => {
    if (!task) return;
    const taskId = typeof task === 'string' ? task : (task.id || task.chatId);
    const taskName = typeof task === 'string' ? task : (task.name || '');
    const spaceId = typeof task === 'string' ? null : task.activeSpaceId;

    setRecentTasks((prev) => {
      const updated = prev.filter((t) => {
        const id = typeof t === 'string' ? t : (t.id || t.chatId);
        const name = typeof t === 'string' ? t : (t.name || '');
        if (taskId && id) return id !== taskId;
        if (taskName && name) return name.toLowerCase() !== taskName.toLowerCase();
        return t !== task;
      });

      if (spaceId && !isHomeChatId(spaceId)) {
        const hasToolsOrTracking = updated.some(t => {
          if (!t || typeof t === 'string') return false;
          return t.activeSpaceId === spaceId && (
            t.taskType === 'site' || t.taskType === 'tool' || 
            t.taskType === 'inferred' || t.taskType === 'tracking' ||
            t.type === 'site' || t.type === 'inferred'
          );
        });
        const hasToolOrTrackingFile = sandboxFiles.some(f => f && f.name && (
          f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('.html') ||
          f.name.toLowerCase() === 'inferred_tasks.json'
        ));
        if (!hasToolsOrTracking && !hasToolOrTrackingFile) {
          setSpaceModes(modes => {
            if (modes[spaceId] && modes[spaceId] !== 'choice') {
              return { ...modes, [spaceId]: 'choice' };
            }
            return modes;
          });
        }
      }

      return updated;
    });

    if (taskId) {
      try {
        await fetch(`/api/chats/${encodeURIComponent(taskId)}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete chat on server:', err);
      }
    }
  };

  const handleRemoveProject = async (project: any) => {
    if (!project) return;
    const projId = typeof project === 'string' ? project : (project.id || project.chatId);
    const projName = typeof project === 'string' ? project : (project.name || '');

    setProjects((prev) => prev.filter((p) => {
      const id = typeof p === 'string' ? p : (p.id || p.chatId);
      const name = typeof p === 'string' ? p : (p.name || '');
      if (projId && id) return id !== projId;
      if (projName && name) return name.toLowerCase() !== projName.toLowerCase();
      return p !== project;
    }));
  };

  const handleAddToProject = () => {
    if (!activeAiSummaryTaskId) return;

    let taskToPin = recentTasks.find(t => typeof t === 'object' && t !== null && t.id === activeAiSummaryTaskId);
    if (!taskToPin) {
      taskToPin = {
        id: activeAiSummaryTaskId,
        name: projectName || 'AI Search Project',
        type: 'ai_summary',
        messages: aiSummaryMessages,
        sources: aiSummarySources
      };
    } else {
      taskToPin = {
        ...taskToPin,
        messages: aiSummaryMessages.length > 0 ? aiSummaryMessages : taskToPin.messages,
        sources: aiSummarySources.length > 0 ? aiSummarySources : taskToPin.sources
      };
    }

    setProjects(prev => {
      const exists = prev.some(p => typeof p === 'object' && p !== null && p.id === taskToPin.id);
      return exists ? prev : [taskToPin, ...prev];
    });

    setRecentTasks(prev => prev.filter(t => {
      const id = typeof t === 'string' ? t : (t?.id || t?.chatId);
      return id !== taskToPin.id;
    }));
  };

  const handleShareProject = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("Project link copied to clipboard!");
    }
  };

  const handleAddSourceToSummary = (file: any) => {
    if (!file) return;
    const fileId = file.id || file.driveId || ('file-' + Date.now());
    const matchedFile = {
      name: file.name,
      content: file.content || '',
      driveId: fileId,
      mimeType: file.mimeType || file.type || '',
      id: fileId
    };

    setAiSummarySources(prev => {
      const exists = prev.some(s => (s.id || s.driveId) === fileId);
      const updated = exists ? prev : [...prev, matchedFile];
      if (activeAiSummaryTaskId) {
        setRecentTasks(tasks => tasks.map(t => typeof t === 'object' && t !== null && t.id === activeAiSummaryTaskId ? { ...t, sources: updated } : t));
        setProjects(projs => projs.map(p => typeof p === 'object' && p !== null && p.id === activeAiSummaryTaskId ? { ...p, sources: updated } : p));
      }
      return updated;
    });
  };

  const handleRemoveFile = async (file: any) => {
    if (!file) return;
    const fileId = file.id || file.driveId;
    const fileName = (file.name || '').toLowerCase();

    // Cascade delete any associated chats in recentTasks
    const associatedTasks = recentTasks.filter((t) => {
      if (!t) return false;
      if (typeof t === 'string') return t.toLowerCase() === fileName;
      const tId = t.id || t.chatId;
      const tFolderId = t.activeSpaceId;
      const tName = (t.name || '').toLowerCase();
      if (fileId && (tId === fileId || tFolderId === fileId)) return true;
      if (fileName && tName === fileName) return true;
      return false;
    });

    for (const task of associatedTasks) {
      await handleRemoveTask(task);
    }

    if (fileId && accessToken && !String(fileId).startsWith('suggested-') && !String(fileId).startsWith('sug-')) {
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trashed: true })
        });
      } catch (err) {
        console.error('Failed to trash file in Drive:', err);
      }
    }

    const updatedSandbox = (fileId ? sandboxFiles.filter((f) => (f.id || f.driveId) !== fileId) : sandboxFiles.filter((f) => f.name !== file.name));
    if (fileId) {
      setDriveFiles((prev) => prev.filter((f) => (f.id || f.driveId) !== fileId));
      setSelectedDriveFiles((prev) => prev.filter((f) => (f.id || f.driveId) !== fileId));
      setSuggestedListCache((prev) => prev.filter((f) => (f.id || f.driveId) !== fileId));
      setSandboxFiles(updatedSandbox);
    } else if (file.name) {
      setDriveFiles((prev) => prev.filter((f) => f.name !== file.name));
      setSelectedDriveFiles((prev) => prev.filter((f) => f.name !== file.name));
      setSuggestedListCache((prev) => prev.filter((f) => f.name !== file.name));
      setSandboxFiles(updatedSandbox);
    }

    if (activeSpaceId && !isHomeChatId(activeSpaceId)) {
      const hasToolOrTrackingFile = updatedSandbox.some(f => f && f.name && (
        f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('.html') ||
        f.name.toLowerCase() === 'inferred_tasks.json'
      ));
      const hasToolOrTrackingTask = recentTasks.some(t => {
        if (!t || typeof t === 'string') return false;
        return t.activeSpaceId === activeSpaceId && (
          t.taskType === 'site' || t.taskType === 'tool' || t.taskType === 'inferred' || t.taskType === 'tracking' ||
          t.type === 'site' || t.type === 'inferred'
        );
      });
      if (!hasToolOrTrackingFile && !hasToolOrTrackingTask) {
        setSpaceModes(modes => {
          if (modes[activeSpaceId] && modes[activeSpaceId] !== 'choice') {
            return { ...modes, [activeSpaceId]: 'choice' };
          }
          return modes;
        });
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareSlug = params.get('share');
    if (shareSlug) {
      setSharedLoading(true);
      fetch(`/api/share/${shareSlug}`)
        .then(res => {
          if (!res.ok) throw new Error("Workspace not found");
          return res.json();
        })
        .then(data => {
          if (data.envId) {
            setEnvId(data.envId);
          }
          if (data.workspaceName) {
            setProjectName(data.workspaceName);
          }
          if (data.files && Array.isArray(data.files)) {
            setSandboxFiles(data.files);
            if (data.files.length > 0) {
              setSelectedFile(data.files[0]);
            }
          }
          setViewState('public_projector');
        })
        .catch(err => {
          console.error("Failed to load shared workspace", err);
          alert("Could not load shared workspace. Redirecting to default...");
        })
        .finally(() => {
          setSharedLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    if (isOrganizingFiles) return;
    if (sandboxFiles.length > 0) {
      const indexFile = sandboxFiles.find(f => f.name && f.name.toLowerCase() === 'index.html');
      
      if (!selectedFile) {
        if (viewState === 'app') {
          if (indexFile) {
            setSelectedFile(indexFile);
            setIndexFileSelected(true);
          } else {
            setSelectedFile(sandboxFiles[0]);
            setIndexFileSelected(sandboxFiles[0].name.toLowerCase() === 'index.html');
          }
        }
      } else {
        const currentSelected = sandboxFiles.find(f => f.name === selectedFile.name);
        if (currentSelected) {
          setSelectedFile(currentSelected);
        } else {
          if (viewState === 'app') {
            if (indexFile) {
              setSelectedFile(indexFile);
              setIndexFileSelected(true);
            } else {
              setSelectedFile(sandboxFiles[0]);
              setIndexFileSelected(sandboxFiles[0].name.toLowerCase() === 'index.html');
            }
          } else {
            setSelectedFile(null);
            setIndexFileSelected(false);
          }
        }
      }
    } else {
      setSelectedFile(null);
      setIndexFileSelected(false);
    }
  }, [sandboxFiles, viewState]);

  const saveChatToDb = async (
    chatIdVal: string,
    messagesList: any[],
    activeEnv: string | null,
    activeSandboxUrl?: string,
    customProjectName?: string,
    customFiles?: any[],
    spaceIdVal?: string,
    customChatName?: string,
    customTaskType?: string,
    associatedFileId?: string,
    associatedFileName?: string
  ) => {
    if (!chatIdVal || chatIdVal.endsWith('-temp')) return;
    const isPlaceholder = (name?: string) => !name || name === 'New' || name === 'Building project...' || name === 'Workspace Project' || name === 'New Application' || name === 'app';
    
    const activeName = (!isPlaceholder(customProjectName) ? customProjectName : (!isPlaceholder(projectName) ? projectName : (!isPlaceholder(currentTask) ? currentTask : '')));
    const filesToSave = (customFiles && customFiles.length > 0) ? customFiles : sandboxFiles;
    const resolvedSpaceId = spaceIdVal || activeSpaceId || chatIdVal;
    if (isHomeChatId(chatIdVal) && !isHomeChatId(resolvedSpaceId)) {
      console.warn("Prevented saving workspace project chat into home chat ID:", { chatIdVal, resolvedSpaceId });
      return;
    }

    const existing = recentTasks.find(t => t && t.id === chatIdVal);
    const resolvedChatName = customChatName || existing?.chatName || (chatIdVal.includes('-chat-') ? (projectName !== 'Workspace Project' ? projectName : 'Chat') : '');
    const resolvedTaskType = customTaskType || existing?.taskType || existing?.type || null;
    const resolvedType = existing?.type || (resolvedTaskType === 'site' ? 'site' : 'workspace');
    const resolvedFileId = associatedFileId || existing?.associatedFileId || (customFiles?.length === 1 ? (customFiles[0].driveId || customFiles[0].id) : undefined);
    const resolvedFileName = associatedFileName || existing?.associatedFileName || (customFiles?.length === 1 ? customFiles[0].name : undefined);

    try {
      await fetch(`/api/chats/${chatIdVal}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectName: activeName || 'Workspace Project',
          chatName: resolvedChatName,
          type: resolvedType,
          taskType: resolvedTaskType,
          associatedFileId: resolvedFileId,
          associatedFileName: resolvedFileName,
          messages: messagesList,
          envId: activeEnv,
          activeSpaceId: resolvedSpaceId,
          sandboxUrl: activeSandboxUrl || sandboxUrl || '',
          sandboxFiles: filesToSave,
          userEmail: userProfile?.email || '',
          members: members
        })
      });

      // If saving a child chat inside a parent space, also persist the updated file manifest to the parent space
      if (resolvedSpaceId && resolvedSpaceId !== chatIdVal && !isHomeChatId(resolvedSpaceId)) {
        if (workspaceCacheRef.current[resolvedSpaceId]) {
          workspaceCacheRef.current[resolvedSpaceId].sandboxFiles = filesToSave;
        }
        fetch(`/api/chats/${resolvedSpaceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: activeName || 'Workspace Project',
            activeSpaceId: resolvedSpaceId,
            sandboxUrl: activeSandboxUrl || sandboxUrl || '',
            sandboxFiles: filesToSave,
            userEmail: userProfile?.email || '',
            members: members
          })
        }).catch(err => console.error("Failed to sync parent space manifest:", err));
      }

      // Only add to recent tasks in side panel if the app is built and we have a descriptive title
      if (activeName && !isHomeChatId(resolvedSpaceId)) {
        setRecentTasks(prev => {
          const now = Date.now();
          const existing = prev.find(t => t && t.id === chatIdVal);
          const parentSpace = prev.find(t => t && t.id === resolvedSpaceId) || projects.find(p => p && p.id === resolvedSpaceId);
          const parentName = parentSpace ? parentSpace.name : activeName;
          const newTask = {
            id: chatIdVal,
            name: (chatIdVal !== resolvedSpaceId && parentName) ? parentName : activeName,
            chatName: resolvedChatName,
            type: resolvedType,
            taskType: resolvedTaskType,
            associatedFileId: resolvedFileId,
            associatedFileName: resolvedFileName,
            messages: messagesList,
            activeSpaceId: resolvedSpaceId,
            updatedAt: now
          };
          const filtered = prev.filter(t => {
            const id = typeof t === 'string' ? '' : t?.id;
            return id !== chatIdVal && !isPlaceholder(t?.name || '');
          });
          return [newTask, ...filtered];
        });
      }
    } catch (err) {
      console.error("Failed to persist chat session:", err);
    }
  };

  const handleSelectSpaceMode = (spaceId: string, mode: 'tracking' | 'tool') => {
    setSpaceModes(prev => ({ ...prev, [spaceId]: mode }));
    const targetChatId = `${spaceId}-chat-${Date.now()}`;
    setActiveChatId(targetChatId);

    if (mode === 'tool') {
      const botMsg = {
        role: 'bot',
        text: `What custom tool would you like to build for this space? (e.g., Kanban board, project dashboard, asset tracker)`
      };
      const initialMsgs = [botMsg];
      setMessages(initialMsgs);
      setActiveSidebar('gemini');

      setSelectedFile(null);
      setIndexFileSelected(false);
      setViewState('home');

      setRecentTasks(prev => {
        const now = Date.now();
        const filtered = prev.filter(t => (t.id || '') !== targetChatId);
        return [{
          id: targetChatId,
          name: projectName || 'Workspace',
          chatName: 'Custom Tool',
          type: 'site',
          taskType: 'site',
          associatedFileName: 'index.html',
          activeSpaceId: spaceId,
          messages: initialMsgs,
          updatedAt: now
        }, ...filtered];
      });
      saveChatToDb(
        targetChatId,
        initialMsgs,
        envId,
        sandboxUrl,
        projectName || 'Workspace',
        [],
        spaceId,
        'Custom Tool',
        'site',
        undefined,
        'index.html'
      );
    } else if (mode === 'tracking') {
      const botMsg = {
        role: 'bot',
        text: `I'm now tracking work for this space and synthesizing inferred tasks from your workspace activity and documents.`
      };
      const initialMsgs = [botMsg];
      setMessages(initialMsgs);
      setActiveSidebar('gemini');

      const trackingArtifact = {
        name: 'inferred_tasks.json',
        type: 'code',
        content: JSON.stringify([], null, 2),
        mimeType: 'application/json',
        isInferredTask: true,
        id: `inferred-tasks-${Date.now()}`
      };

      setSandboxFiles(prev => {
        const exists = prev.some(f => f.name.toLowerCase() === 'inferred_tasks.json');
        const combined = exists ? prev : [trackingArtifact, ...prev];
        if (accessToken) {
          autoSaveToDrive(combined, spaceId);
        }
        return combined;
      });
      setDriveFiles(prev => {
        const exists = prev.some(f => f.name.toLowerCase() === 'inferred_tasks.json');
        return exists ? prev : [trackingArtifact, ...prev];
      });
      setSelectedFile(trackingArtifact);
      setViewState('files');

      setRecentTasks(prev => {
        const now = Date.now();
        const filtered = prev.filter(t => (t.id || '') !== targetChatId);
        return [{
          id: targetChatId,
          name: projectName || 'Workspace',
          chatName: 'Inferred Tasks',
          type: 'inferred',
          taskType: 'inferred',
          associatedFileId: trackingArtifact.id,
          associatedFileName: 'inferred_tasks.json',
          activeSpaceId: spaceId,
          messages: initialMsgs,
          updatedAt: now
        }, ...filtered];
      });
      saveChatToDb(
        targetChatId,
        initialMsgs,
        envId,
        sandboxUrl,
        projectName || 'Workspace',
        [trackingArtifact],
        spaceId,
        'Inferred Tasks',
        'inferred',
        trackingArtifact.id,
        'inferred_tasks.json'
      );
    }
  };

  const handleApplyOrganizeMoves = async (msgIndex: number) => {
    const msg = messages[msgIndex];
    if (!msg || !msg.proposedMoves || msg.proposedMoves.length === 0) return;

    setIsOrganizingFiles(true);
    setSelectedFile(null); // Keep directory column view open; do NOT open artifact viewer!

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const moves = msg.proposedMoves;
    const targetFolderNames = Array.from(new Set(moves.map((m: any) => m.targetFolderName).filter(Boolean)));

    // Pre-create all destination target folders upfront so they render as folder rows in CanvasSidebar
    const ensureFolders = (curr: any[]) => {
      let updated = curr && curr.length > 0 ? [...curr] : [];
      targetFolderNames.forEach(folderName => {
        const exists = updated.some(f => f && (f.name === folderName || f.folder === folderName || f.name?.startsWith(folderName + '/')));
        if (!exists) {
          updated.unshift({
            id: `folder_${folderName}`,
            name: folderName as string,
            type: 'folder',
            mimeType: 'application/vnd.google-apps.folder'
          });
        }
      });
      return updated;
    };

    setSandboxFiles(ensureFolders);
    setDriveFiles(ensureFolders);
    await delay(300); // Give React DOM time to render folder rows in column view

    // Position Agent Sparkle Cursor at bottom right
    setGeminiCursor({
      x: window.innerWidth - 120,
      y: window.innerHeight - 120,
      visible: true,
      status: 'idle'
    });
    await delay(400);

    for (let idx = 0; idx < moves.length; idx++) {
      const move = moves[idx];
      const fileId = move.fileId || move.fileName || move.name;
      const fileName = move.fileName || move.name;
      const rawBaseName = (fileName || '').split('/').filter(Boolean).pop() || fileName;
      const targetFolderName = move.targetFolderName;

      // Locate source file element in DOM
      const sourceEl = document.querySelector(`[data-id="${fileId}"]`) || 
                       document.querySelector(`[data-id="${fileName}"]`) ||
                       document.querySelector(`[data-id="${rawBaseName}"]`);
      
      let sourceX = window.innerWidth * 0.15;
      let sourceY = window.innerHeight * Math.min(0.8, 0.25 + idx * 0.09);

      if (sourceEl) {
        (sourceEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        await delay(180);
        const rect = sourceEl.getBoundingClientRect();
        sourceX = rect.left + 24;
        sourceY = rect.top + 16;
      }

      // 1. Glide cursor to source file
      setGeminiCursor({
        x: sourceX,
        y: sourceY,
        visible: true,
        status: 'idle'
      });
      await delay(600);

      // 2. Grab gesture & spawn flying clone (Hide original row in old folder!)
      setGeminiCursor(prev => ({ ...prev, status: 'grabbing' }));
      setAnimatingFileIds(prev => [...prev, fileId, rawBaseName, fileName]);
      setFlyingClones(prev => [...prev, {
        id: fileId,
        name: rawBaseName,
        mimeType: move.fileMime || move.mimeType,
        x: sourceX,
        y: sourceY
      }]);
      await delay(280);

      // 3. Target folder element lookup
      const targetEl = document.querySelector(`[data-id="${targetFolderName}"]`) ||
                       document.querySelector(`[data-id="folder_${targetFolderName}"]`);
      let targetX = window.innerWidth * 0.15;
      let targetY = window.innerHeight * 0.2;

      if (targetEl) {
        (targetEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        await delay(180);
        const rect = targetEl.getBoundingClientRect();
        targetX = rect.left + 24;
        targetY = rect.top + 16;
      }

      // 4. Glide cursor & flying clone card to target folder row
      setGeminiCursor({
        x: targetX,
        y: targetY,
        visible: true,
        status: 'grabbing'
      });

      setFlyingClones(prev => prev.map(c => c.id === fileId ? {
        ...c,
        x: targetX - 12,
        y: targetY - 12
      } : c));

      await delay(650);

      // 5. Drop & Impact
      setFlyingClones(prev => prev.filter(c => c.id !== fileId));
      setImpactFolderId(targetFolderName);
      setParticleBursts(prev => [...prev, {
        id: `burst_${fileId}_${idx}`,
        x: targetX,
        y: targetY
      }]);

      // Update workspace file state: move this file into its target folder across sandboxFiles, driveFiles, and directoryContentsMap
      const updateFileList = (curr: any[]) => {
        if (!curr || curr.length === 0) return [];
        const newName = `${targetFolderName}/${rawBaseName}`;
        let matched = false;

        const updated = curr.map(f => {
          if (!f) return f;
          const fId = f.id || f.driveId;
          const fName = f.name || f.filename || '';
          const fBaseName = fName.split('/').filter(Boolean).pop() || fName;

          const isMatch = (fId && (fId === fileId || fId === fileName)) ||
                          (fName && (fName === fileName || fName === rawBaseName)) ||
                          (fBaseName && (fBaseName === rawBaseName || fBaseName === fileName));

          if (isMatch) {
            matched = true;
            return {
              ...f,
              name: newName,
              folder: targetFolderName,
              path: newName
            };
          }
          return f;
        });

        if (!matched) {
          updated.push({
            id: fileId || `file_${Date.now()}`,
            name: newName,
            folder: targetFolderName,
            mimeType: move.fileMime || move.mimeType,
            type: 'file'
          });
        }

        return updated;
      };

      setSandboxFiles(updateFileList);
      setDriveFiles(updateFileList);

      setFolderContentsMap(prev => {
        const next = { ...prev };
        const newName = `${targetFolderName}/${rawBaseName}`;
        const newItem = {
          id: fileId,
          name: newName,
          filename: rawBaseName,
          folder: targetFolderName,
          mimeType: move.fileMime || move.mimeType
        };

        Object.keys(next).forEach(key => {
          if (Array.isArray(next[key])) {
            next[key] = next[key].filter(item => {
              if (!item) return false;
              const iId = item.id || item.driveId;
              const iName = item.name || item.filename || '';
              const iBaseName = iName.split('/').filter(Boolean).pop() || iName;

              const isMatch = (iId && (iId === fileId || iId === fileName)) ||
                              (iName && (iName === fileName || iName === rawBaseName)) ||
                              (iBaseName && (iBaseName === rawBaseName || iBaseName === fileName));
              return !isMatch;
            });
          }
        });

        const targetList = next[targetFolderName] || [];
        next[targetFolderName] = [...targetList, newItem];
        return next;
      });

      await delay(400);
      setImpactFolderId(null);
      setParticleBursts(prev => prev.filter(b => b.id !== `burst_${fileId}_${idx}`));
      setAnimatingFileIds(prev => prev.filter(id => id !== fileId && id !== rawBaseName && id !== fileName));
    }

    // Glide cursor back off-screen
    setGeminiCursor({
      x: window.innerWidth - 120,
      y: window.innerHeight - 120,
      visible: true,
      status: 'idle'
    });
    await delay(500);
    setGeminiCursor(prev => ({ ...prev, visible: false }));

    // Mark proposal message as applied and append confirmation message
    setMessages(prev => {
      const next = [...prev];
      if (next[msgIndex]) {
        next[msgIndex] = { ...next[msgIndex], isApplied: true };
        next.push({
          role: 'bot',
          text: `✦ Workspace successfully organized! Organized **${moves.length}** files into their designated sub-folders. Let me know if you would like help with anything else.`
        });
      }
      return next;
    });

    setIsOrganizingFiles(false);
  };

  const handleDoDifferentlyOrganize = (msgIndex: number) => {
    setMessages(prev => [
      ...prev,
      {
        role: 'bot',
        text: 'How would you like to organize these files differently? Please tell me your preferences (e.g. group by file type, project stage, or date).'
      }
    ]);
  };

  const handleSendMessage = async (text: string, aiMode?: boolean, contextFiles?: any[]) => {
    let resolvedFolderId = activeSpaceId;
    let targetChatId = activeChatId;
    if (isHomeChatId(resolvedFolderId)) {
      targetChatId = getHomeChatId();
    } else if (!targetChatId || isHomeChatId(targetChatId)) {
      targetChatId = resolvedFolderId;
    }
    const initialSpaceId = resolvedFolderId;

    if (activeSpaceId && activeSpaceId.startsWith('space-creation-')) {
      setMessages(prev => [...prev, { role: 'user', text }]);
      setIsLoading(true);

      let detectedName = '';
      const nameMatch = text.match(/(?:name\s+the\s+space\s+|project\s+|for\s+|^)(Project\s+[A-Za-z0-9]+|[A-Z][a-zA-Z0-9\s_]+)/i);
      if (nameMatch && nameMatch[1]) {
        detectedName = nameMatch[1].trim();
      } else {
        detectedName = text.trim();
      }
      if (detectedName.length > 40) {
        detectedName = detectedName.substring(0, 40) + '...';
      }
      setProjectName(detectedName);

      try {
        const response = await fetch('/api/space-creation-rag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            prompt: text,
            teamMembers: getTeamMembers()
          })
        });

        if (response.ok) {
          const data = await response.json();
          const matchedFiles = data.files || [];
          const suggestions = data.suggestedPeople || [];
          const explanation = data.explanation || "";

          setSpaceCreationSources(matchedFiles);

          const allPossibleMembers = getTeamMembers();
          const mergedMembers = [...allPossibleMembers];
          suggestions.forEach((s: any) => {
            if (!mergedMembers.some(m => m.email === s.email)) {
              mergedMembers.push(s);
            }
          });

          setMessages(prev => [
            ...prev,
            {
              role: 'bot',
              text: `I've named the space **${detectedName}**.\n\n${explanation}\n\nHere are some team members I suggest adding based on your workspace context:`,
              isSpacePeopleSelector: true,
              suggestedPeople: suggestions,
              teamMembers: mergedMembers,
              targetSpaceName: detectedName
            }
          ]);
        } else {
          throw new Error("RAG API returned error status");
        }
      } catch (err) {
        console.error("Space RAG error:", err);
        const allMembers = getTeamMembers();
        const suggestions = allMembers.slice(0, 2);
        setMessages(prev => [
          ...prev,
          {
            role: 'bot',
            text: `I've named the space **${detectedName}**. (Failed to query workspace files context). Here are some team members I suggest adding:`,
            isSpacePeopleSelector: true,
            suggestedPeople: suggestions,
            teamMembers: allMembers,
            targetSpaceName: detectedName
          }
        ]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const isOrganizeJourney = text.toLowerCase().includes('organize files') || text.toLowerCase().includes('organize the') || currentTask === 'organize';

    if (isOrganizeJourney) {
      setMessages(prev => [...prev, { role: 'user', text }, { role: 'bot', text: 'Analyzing workspace files to prepare an organization proposal plan...' }]);
      setIsLoading(true);
      setCurrentTask('organize');
      if (viewState === 'home') {
        setViewState('app');
      }
      setActiveSidebar('gemini');

      let activeFilesToOrganize: any[] = [];
      const baseFiles = sandboxFiles.length > 0 ? sandboxFiles : (selectedDriveFiles.length > 0 ? selectedDriveFiles : driveFiles);

      if (currentPath.length > 0) {
        const pathKey = currentPath.join('/');
        const currentFolderName = currentPath[currentPath.length - 1];
        const rawContents = directoryContentsMap[pathKey] || directoryContentsMap[currentFolderName] || [];
        
        if (rawContents.length > 0) {
          activeFilesToOrganize = rawContents.filter((f: any) => f && f.type !== 'folder' && (!f.mimeType || !f.mimeType.includes('folder')));
        } else {
          activeFilesToOrganize = baseFiles.filter((f: any) => {
            if (!f || !f.name) return false;
            const isFolder = f.type === 'folder' || (f.mimeType && f.mimeType.includes('folder'));
            if (isFolder) return false;
            const parts = f.name.split('/').filter(Boolean);
            if (parts.length > 1) {
              return parts[parts.length - 2] === currentFolderName || f.name.startsWith(pathKey + '/');
            }
            return f.folder === currentFolderName;
          });
        }
      }

      if (activeFilesToOrganize.length === 0) {
        activeFilesToOrganize = baseFiles.filter((f: any) => f && f.type !== 'folder' && (!f.mimeType || !f.mimeType.includes('folder')));
      }

      try {
        const res = await fetch('/api/organize-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: activeFilesToOrganize })
        });
        const data = await res.json();
        const moves = data.proposedMoves || [];

        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              role: 'bot',
              text: "I have analyzed your workspace files and matched them into logical destination folders based on their contents and naming patterns. Here is my proposed organization plan for your sign-off:",
              isOrganizationProposal: true,
              proposedMoves: moves,
              isApplied: false
            };
          }
          return updated;
        });
      } catch (err) {
        console.error("Error generating organization proposal:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const isDocJourneyMode = currentTask === 'doc' || currentTask === 'slide' || !!selectedFile?.isDocJourney || (sandboxFiles.length > 0 && sandboxFiles.some(f => f.isDocJourney || f.name === 'document.doc' || f.name === 'presentation.gslides'));

    if (isDocJourneyMode) {
      setMessages(prev => [...prev, { role: 'user', text }, { role: 'bot', text: '' }]);
      setIsLoading(true);
      setCurrentTask(currentTask === 'slide' ? 'slide' : 'doc');
      setViewState('files');
      setActiveSidebar('gemini');

      let activeFolderId = initialSpaceId;
      if (!activeFolderId) {
        activeFolderId = `local-workspace-${Date.now()}`;
        if (activeSpaceIdRef.current === initialSpaceId) {
          setActiveSpaceId(activeFolderId);
          setActiveChatId(activeFolderId);
        }
      }

      const activeDoc = selectedFile || sandboxFiles.find(f => f.isDocJourney || f.name === 'document.doc' || f.name === 'presentation.gslides') || { name: currentTask === 'slide' ? 'presentation.gslides' : 'document.doc', content: '' };

      try {
        console.log("[DocJourney Client] Sending POST /api/doc-journey with prompt:", text);
        const response = await fetch('/api/doc-journey', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ 
            prompt: text,
            activeFileName: activeDoc.name || 'document.doc',
            activeFileContent: activeDoc.content || '',
            contextFileIds: contextFiles ? contextFiles.map(c => c.id || c.driveId) : [],
            history: messages.filter(m => m.text)
          })
        });

        console.log("[DocJourney Client] Response status:", response.status, response.statusText);
        if (!response.ok) {
          const errText = await response.text();
          console.error("[DocJourney Client] HTTP error response body:", errText);
          throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body reader available");
        const decoder = new TextDecoder();
        let fullRawOutput = "";
        let buffer = "";

        setMessages(prev => [...prev, { role: 'bot', text: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("[DocJourney Client] Stream reader done");
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            const dataStr = line.replace('data: ', '');
            try {
              const event = JSON.parse(dataStr);
              if (event.error) {
                console.error("[DocJourney Client] SSE event contained error:", event.error);
                continue;
              }
              if (event.text) {
                setIsLoading(false);
                fullRawOutput += event.text;
                console.log(`[DocJourney Client] Received text event (${event.text.length} chars). Total raw len: ${fullRawOutput.length}`);

                let chatText = "";
                let docText = "";

                const chatMatch = fullRawOutput.match(/<chat>([\s\S]*?)(?:<\/chat>|$)/i);
                if (chatMatch) {
                  chatText = chatMatch[1].trim();
                } else if (!fullRawOutput.includes('<doc>')) {
                  chatText = fullRawOutput.replace(/<[^>]*>/g, '').trim();
                }

                const docMatch = fullRawOutput.match(/<doc>([\s\S]*?)(?:<\/doc>|$)/i);
                if (docMatch) {
                  docText = docMatch[1].trim();
                }

                if (chatText) {
                  console.log(`[DocJourney Client] Extracted chatText (${chatText.length} chars)`);
                  setMessages(prev => {
                    const updated = [...prev];
                    if (updated.length > 0) {
                      updated[updated.length - 1] = { role: 'bot', text: chatText };
                    }
                    return updated;
                  });
                }

                if (docText) {
                  console.log(`[DocJourney Client] Extracted docText (${docText.length} chars)`);
                  setSandboxFiles(prev => {
                    return prev.map(f => {
                      if (f.id === activeDoc.id || f.name === activeDoc.name || f.isDocJourney || f.name === 'document.doc' || f.name === 'presentation.gslides') {
                        return { ...f, content: docText };
                      }
                      return f;
                    });
                  });
                  setSelectedFile(prev => prev ? { ...prev, content: docText } : { ...activeDoc, content: docText });
                }
              }
            } catch (err) {
              console.error("[DocJourney Client] Error parsing doc journey SSE line:", err, line);
            }
          }
        }

        setSandboxFiles(latestFiles => {
          let updatedFiles = latestFiles;
          let smartTitle = "";
          const currentDoc = latestFiles.find(f => f.id === activeDoc.id || f.name === activeDoc.name || f.isDocJourney || f.name === 'document.doc' || f.name === 'presentation.gslides');
          let finalDocName = currentDoc?.name;
          if (currentDoc) {
            const h1Match = (currentDoc.content || "").match(/^#\s+(.+)$/m);
            if (h1Match) {
              smartTitle = h1Match[1].trim()
                .replace(/^Product Requirement Document \([^)]+\):\s*/i, '')
                .replace(/[^a-zA-Z0-9\s\-_()]/g, '')
                .trim();
              if (smartTitle && !smartTitle.toLowerCase().includes('prd') && h1Match[1].toLowerCase().includes('prd')) {
                smartTitle += ' PRD';
              }
            }
            if (!smartTitle && text) {
              const cleanPrompt = text.replace(/^(write|create|draft|generate|make|build|a|an|the|document|doc|prd|about|for|\s+)+/i, '').trim();
              if (cleanPrompt) {
                smartTitle = cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1);
              }
            }
            if (smartTitle) {
              if (smartTitle.length > 50) smartTitle = smartTitle.substring(0, 47) + "...";
              const isSlideFile = currentDoc.name.endsWith('.gslides') || currentDoc.mimeType === 'application/vnd.google-apps.presentation';
              const ext = isSlideFile ? '.gslides' : '.doc';
              finalDocName = smartTitle.toLowerCase().endsWith(ext) ? smartTitle : `${smartTitle}${ext}`;
              console.log(`[DocJourney Client] Updating doc title from generic to: ${finalDocName}`);
              updatedFiles = latestFiles.map(f => {
                if (f.id === currentDoc.id || f.name === currentDoc.name) {
                  return { ...f, name: finalDocName };
                }
                return f;
              });
              setSelectedFile(prev => prev ? { ...prev, name: finalDocName } : null);
              if (!initialSpaceId || isHomeChatId(initialSpaceId)) {
                setProjectName(smartTitle);
              }
            }
          }

          if (accessToken && activeFolderId) {
            console.log("[DocJourney Client] Triggering autoSaveToDrive");
            autoSaveToDrive(updatedFiles, activeFolderId);
          }

          if (targetChatId && !targetChatId.endsWith('-temp')) {
            setMessages(currentMessages => {
              setTimeout(() => {
                saveChatToDb(
                  targetChatId,
                  currentMessages,
                  envId || null,
                  sandboxUrl || '',
                  projectName,
                  updatedFiles,
                  activeFolderId || initialSpaceId,
                  smartTitle || undefined,
                  currentTask,
                  currentDoc?.driveId || currentDoc?.id,
                  finalDocName
                );
              }, 0);
              return currentMessages;
            });
          }

          return updatedFiles;
        });

      } catch (err) {
        console.error("[DocJourney Client] CRITICAL Error in doc journey call:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const activeAiMode = aiMode ?? (currentTask === 'AI Search Summary');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true);
    setCurrentTask(activeAiMode ? 'AI Search Summary' : 'app');

    let inferredChatNameVal: string | undefined = undefined;

    if (chatModel === 'B' && resolvedFolderId && (!targetChatId || targetChatId === resolvedFolderId || targetChatId.endsWith('-temp') || targetChatId.includes('-chat-temp'))) {
      targetChatId = `${resolvedFolderId}-chat-${Date.now()}`;
      inferredChatNameVal = inferChatName(text);
      setActiveChatId(targetChatId);
    } else if (targetChatId !== activeChatId) {
      setActiveChatId(targetChatId || null);
    }

    // Move current task/conversation to the top when a new turn starts (only for vibe coding)
    if (!activeAiMode) {
      const activeIdForTask = targetChatId || initialSpaceId;
      if (activeIdForTask && projectName) {
        setRecentTasks(prev => {
          const now = Date.now();
          const existing = prev.find(t => t && (t.id === activeIdForTask || t.chatId === activeIdForTask));
          const filtered = prev.filter(t => {
            const id = typeof t === 'string' ? '' : t.id;
            return id !== activeIdForTask;
          });
          return [{
            id: activeIdForTask,
            name: projectName,
            chatName: inferredChatNameVal || existing?.chatName || (activeIdForTask.includes('-chat-') ? 'Chat' : ''),
            type: existing?.type || 'workspace',
            taskType: existing?.taskType,
            activeSpaceId: resolvedFolderId || initialSpaceId,
            updatedAt: now,
            messages: existing?.messages
          }, ...filtered];
        });
      }
    }

    // If typing/submitting on the Home screen, transition immediately to the workspace
    if (viewState === 'home' && !activeAiMode) {
      setSandboxFiles([]);
      setSelectedFile(null);
      if (!isHomeChatId(initialSpaceId)) {
        setProjectName("Building project...");
      }
      setViewState('app');
      setActiveSidebar('gemini');
    }

    if (activeAiMode) {
      // AI Search RAG pipeline
      let taskId = activeAiSummaryTaskId;
      const isNewSearch = viewState === 'home' || !taskId;

      if (isNewSearch) {
        const parentSpaceId = initialSpaceId || 'home_guest';
        taskId = parentSpaceId + '-chat-' + Date.now();
        setActiveAiSummaryTaskId(taskId);
        setPreviousViewState(viewState);
        setViewState('files'); // Use existing canvas viewer and right library!
        setIsAiSummarySnapped(false);
        setActiveSidebar('gemini'); // Keep chat docked in side mode!
        const initialTotal = (sandboxFiles?.length || 0) + (driveFiles?.length || 0);
        setIsSourcesPanelOpen(initialTotal > 0);
        
        let autoSelectedSources: any[] = [];
        if (contextFiles && Array.isArray(contextFiles) && contextFiles.length > 0) {
          autoSelectedSources = contextFiles.map(c => ({
            id: c.id || c.driveId,
            driveId: c.id || c.driveId,
            name: c.name,
            mimeType: c.mimeType || c.type
          }));
        } else {
          // Auto-select relevant files from driveFiles / sandboxFiles based on search prompt
          const cleanPrompt = text.toLowerCase();
          const words = cleanPrompt.split(/\s+/).filter(w => w.length > 2);
          const allAvailable = [...driveFiles, ...sandboxFiles, ...suggestedListCache];
          
          const matched = allAvailable.filter(f => {
            if (!f || !f.name) return false;
            const fName = f.name.toLowerCase();
            return words.some(w => fName.includes(w));
          });

          if (matched.length > 0) {
            autoSelectedSources = matched.slice(0, 5).map(f => ({
              id: f.id || f.driveId,
              driveId: f.id || f.driveId,
              name: f.name,
              mimeType: f.mimeType || f.type
            }));
          } else if (allAvailable.length > 0) {
            // Fallback to top recent files
            autoSelectedSources = allAvailable.slice(0, 3).map(f => ({
              id: f.id || f.driveId,
              driveId: f.id || f.driveId,
              name: f.name,
              mimeType: f.mimeType || f.type
            }));
          }
        }

        setAiSummarySources(autoSelectedSources);
        
        const initialMsgs = [
          { role: 'user', text },
          { role: 'bot', text: '' }
        ];
        setAiSummaryMessages(initialMsgs);

        const parentProj = projects.find(p => p && (p.id === parentSpaceId || p.activeSpaceId === parentSpaceId));
        const parentName = parentProj ? parentProj.name : (isHomeChatId(parentSpaceId) ? 'Home Dashboard' : projectName);

        const newTask = {
          id: taskId,
          name: parentName || 'Home Dashboard',
          chatName: text.length > 30 ? text.substring(0, 30) + '...' : text,
          type: 'workspace',
          taskType: 'doc',
          activeSpaceId: parentSpaceId,
          messages: initialMsgs,
          sources: autoSelectedSources
        };
        setRecentTasks(prev => {
          const filtered = prev.filter(t => {
            const tId = typeof t === 'string' ? '' : t.id;
            return tId !== taskId;
          });
          return [newTask, ...filtered];
        });
      } else {
        setAiSummaryMessages(prev => {
          const updated = [
            ...prev,
            { role: 'user', text },
            { role: 'bot', text: '' }
          ];
          setRecentTasks(tasks => tasks.map(t => t.id === taskId ? { ...t, messages: updated } : t));
          setProjects(projs => projs.map(p => p.id === taskId ? { ...p, messages: updated } : p));
          return updated;
        });
      }

      const currentHistory = isNewSearch ? [] : aiSummaryMessages.filter(m => m.text);

      try {
        const response = await fetch('/api/ai-summary', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ 
            prompt: text,
            contextFileIds: contextFiles ? contextFiles.map(c => c.id || c.driveId) : [],
            history: currentHistory
          })
        });

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");
        const decoder = new TextDecoder();
        let accumulatedOutput = "";
        let buffer = "";
        let actionReceived = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;
            const dataStr = line.replace('data: ', '');
            try {
              const event = JSON.parse(dataStr);
              if (event.error) {
                console.error("AI summary stream error:", event.error);
                setAiSummaryMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = {
                      role: 'bot',
                      text: `Error: ${JSON.stringify(event.error)}`
                    };
                  }
                  setRecentTasks(tasks => tasks.map(t => t.id === taskId ? { ...t, messages: updated } : t));
                  setProjects(projs => projs.map(p => p.id === taskId ? { ...p, messages: updated } : p));
                  return updated;
                });
                continue;
              }

              if (event.action === 'sources') {
                const files = event.files || [];
                setAiSummarySources(prev => {
                  const merged = [...prev];
                  files.forEach(f => {
                    const fId = f.id || f.driveId;
                    if (fId && !merged.some(m => (m.id || m.driveId) === fId)) {
                      merged.push(f);
                    }
                  });
                  setRecentTasks(tasks => tasks.map(t => t.id === taskId ? { ...t, sources: merged } : t));
                  setProjects(projs => projs.map(p => p.id === taskId ? { ...p, sources: merged } : p));
                  return merged;
                });
                setDriveFiles(prev => {
                  const mergedDrive = [...prev];
                  files.forEach(f => {
                    const fId = f.id || f.driveId;
                    if (fId && !mergedDrive.some(m => (m.id || m.driveId) === fId)) {
                      mergedDrive.push(f);
                    }
                  });
                  return mergedDrive;
                });
                const totalFilesNow = files.length + (sandboxFiles?.length || 0) + (driveFiles?.length || 0);
                setIsSourcesPanelOpen(totalFilesNow > 0);
                continue;
              }

              if (event.action === 'show_file') {
                actionReceived = true;
                const fileId = event.fileId;
                const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`, {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (metaRes.ok) {
                  const meta = await metaRes.json();
                  let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
                  if (meta.mimeType.includes('google-apps.document')) {
                    downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
                  } else if (meta.mimeType.includes('google-apps.spreadsheet')) {
                    downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
                  }

                  const contentRes = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
                  let contentText = "";
                  if (contentRes.ok) {
                    contentText = await contentRes.text();
                  }

                  const matchedFile = {
                    name: meta.name,
                    content: contentText,
                    driveId: fileId,
                    mimeType: meta.mimeType,
                    id: fileId
                  };

                  setAiSummarySources(prev => {
                    const exists = prev.some(f => f.driveId === fileId);
                    const updatedSources = exists ? prev : [...prev, matchedFile];
                    setRecentTasks(tasks => tasks.map(t => t.id === taskId ? { ...t, sources: updatedSources } : t));
                    setProjects(projs => projs.map(p => p.id === taskId ? { ...p, sources: updatedSources } : p));
                    return updatedSources;
                  });
                }
                break;
              }

              if (event.text) {
                accumulatedOutput += event.text;
                setAiSummaryMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    updated[updated.length - 1] = {
                      role: 'bot',
                      text: accumulatedOutput
                    };
                  }
                  setRecentTasks(tasks => tasks.map(t => t.id === taskId ? { ...t, messages: updated } : t));
                  setProjects(projs => projs.map(p => p.id === taskId ? { ...p, messages: updated } : p));
                  return updated;
                });
              }
            } catch (pErr) {
              console.error("Failed to parse event line:", pErr);
            }
          }
          if (actionReceived) break;
        }

        // Stream completed successfully! Persist the final messages state to Firestore/Cloud
        const finalMessages = [
          ...currentHistory,
          { role: 'user', text },
          { role: 'bot', text: accumulatedOutput }
        ];

        try {
          // Save AI summary as a doc artifact in the library
          const summaryDocFile = {
            name: `Daily_Summary_${new Date().toISOString().slice(0, 10)}.md`,
            content: accumulatedOutput,
            mimeType: 'text/markdown',
            id: `summary-doc-${Date.now()}`,
            isDocJourney: true
          };
          const updatedFiles = [...sandboxFiles.filter(f => f && f.name !== summaryDocFile.name), summaryDocFile];
          setSandboxFiles(updatedFiles);
          setSelectedFile(summaryDocFile);
          
          const targetSpaceId = initialSpaceId || 'home_guest';
          if (workspaceCacheRef.current[targetSpaceId]) {
            workspaceCacheRef.current[targetSpaceId].sandboxFiles = updatedFiles;
          }
          if (workspaceCacheRef.current[taskId]) {
            workspaceCacheRef.current[taskId].sandboxFiles = updatedFiles;
          }
          
          const targetProjectName = isHomeChatId(targetSpaceId) ? 'Home Dashboard' : (projectName || 'Workspace Project');
          const childChatName = text.length > 30 ? text.substring(0, 30) + '...' : text;
          
          // Save child chat session with full files and activeSpaceId so it restores cleanly when clicked
          await saveChatToDb(taskId, finalMessages, envId, sandboxUrl, targetProjectName, updatedFiles, targetSpaceId, childChatName);
          console.log(`[Firebase] Saved AI Summary chat "${taskId}" to Cloud Firestore successfully.`);

          if (isHomeChatId(targetSpaceId)) {
            await saveChatToDb(getHomeChatId(), finalMessages, envId, sandboxUrl, 'Home Dashboard', updatedFiles, getHomeChatId());
          }
        } catch (dbErr) {
          console.error("Failed to save AI Summary chat to DB:", dbErr);
        }
      } catch (err) {
        console.error("Failed to run AI Summary query:", err);
        setAiSummaryMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              role: 'bot',
              text: `Failed to complete query. Error: ${String(err)}`
            };
          }
          setRecentTasks(tasks => tasks.map(t => t.id === taskId ? { ...t, messages: updated } : t));
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    let activeFolderId = initialSpaceId;
    let combinedFilesForSync: any[] = [];

    // Summarize the prompt
    fetch('/api/summarize-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text })
    })
      .then(res => res.json())
      .then(data => {
        if (data.summary && data.summary !== 'app') {
          setCurrentTask(data.summary);
          const formatted = data.summary.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          setProjectName(formatted);
        }
      })
      .catch(err => console.error("Failed to summarize:", err));

    let contextToUse = sandboxFiles;
    let activeEnvId = envId;
    let activeSandboxUrl = sandboxUrl;
    // "when i land on the landing page and oauth in, the files i select should be added to the folder i create and be used as context"
    if (accessToken && isHomeChatId(initialSpaceId) && selectedDriveFiles.length > 0) {
      const initMessage = 'Initializing space and setting up files...';
      setMessages(prev => [...prev, { role: 'bot', text: initMessage }]);
      const resVal = await createSpace(text);
      if (resVal) {
        activeFolderId = resVal.spaceId;
        resolvedFolderId = resVal.spaceId;
        contextToUse = resVal.files;
      }
    }

    try {
      const response = await fetch('/api/vibe-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: text, 
          env_id: activeEnvId,
          activeFileName: selectedFile?.name || undefined,
          activeFileMimeType: selectedFile?.mimeType || undefined,
          activeFileContent: selectedFile?.content || undefined,
          ingestedContext: contextToUse.length > 0 ? contextToUse.map(f => ({filename: f.name, content: f.content})) : undefined,
          members: members.length > 0 ? members : getTeamMembers()
        })
      });
      // Do not clear ingestedFiles so drive saving works later
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let accumulatedOutput = "";
      let buffer = "";

      // Add a placeholder bot message to update dynamically
      setMessages(prev => [...prev, { role: 'bot', text: '', steps: [] }]);

      let currentSteps: any[] = [];
      let currentText = '';
      let lastFlushTime = 0;
      let flushTimeout: any = null;
      let pendingMessageUpdate: { steps?: any[]; text?: string } | null = null;

      const flushMessagesUpdate = (final = false) => {
        if (!pendingMessageUpdate && !final) return;
        if (flushTimeout) {
          clearTimeout(flushTimeout);
          flushTimeout = null;
        }
        setMessages(prev => {
          if (prev.length === 0) return prev;
          const newMsgs = [...prev];
          const lastIdx = newMsgs.length - 1;
          const lastMsg = newMsgs[lastIdx];
          
          let updatedMsg = { ...lastMsg };
          if (pendingMessageUpdate) {
            if (pendingMessageUpdate.steps) {
              updatedMsg.steps = pendingMessageUpdate.steps;
            }
            if (pendingMessageUpdate.text !== undefined) {
              updatedMsg.text = pendingMessageUpdate.text;
            }
          }
          newMsgs[lastIdx] = updatedMsg;
          return newMsgs;
        });
        pendingMessageUpdate = null;
        lastFlushTime = Date.now();
      };

      const scheduleMessagesUpdate = () => {
        const now = Date.now();
        if (now - lastFlushTime >= 80) {
          flushMessagesUpdate();
        } else if (!flushTimeout) {
          flushTimeout = setTimeout(() => flushMessagesUpdate(), 80 - (now - lastFlushTime));
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          const dataStr = line.replace('data: ', '');
          try {
            const event = JSON.parse(dataStr);
            if (event.error) {
              console.error("Stream event error:", event.error);
              flushMessagesUpdate(true);
              setMessages(prev => [...prev, { role: 'bot', text: 'Error from server: ' + JSON.stringify(event.error) }]);
              continue;
            }
            
            if (event.event_type === 'step.start') {
               const stepIndex = event.step_index !== undefined ? event.step_index : currentSteps.length;
               currentSteps[stepIndex] = { ...event.step, _streamText: '' };
               pendingMessageUpdate = { steps: [...currentSteps], text: currentText };
               scheduleMessagesUpdate();
            } else if (event.event_type === 'step.stop') {
               if (event.step) {
                  const stepIndex = event.step_index !== undefined ? event.step_index : (currentSteps.length > 0 ? currentSteps.length - 1 : 0);
                  const prevStreamText = currentSteps[stepIndex]?._streamText || '';
                  currentSteps[stepIndex] = { ...event.step, _streamText: prevStreamText };
                  pendingMessageUpdate = { steps: [...currentSteps], text: currentText };
                  scheduleMessagesUpdate();
               }
            } else if (event.event_type === 'step.delta') {
               const deltaText = event.delta?.text || event.delta?.code || event.delta?.thought || event.delta?.query || event.delta?.content?.text || event.delta?.content?.code || "";
               
               if (event.step_index !== undefined) {
                 if (!currentSteps[event.step_index]) {
                   currentSteps[event.step_index] = { type: 'unknown', _streamText: '' };
                 }
                 
                 currentSteps[event.step_index] = { ...currentSteps[event.step_index], ...event.delta, type: currentSteps[event.step_index].type };
                 currentSteps[event.step_index]._streamText = (currentSteps[event.step_index]._streamText || '') + deltaText;

                 if (currentSteps[event.step_index].type === 'model_output') {
                    accumulatedOutput += deltaText;
                    const displayOutput = accumulatedOutput.replace(/```[A-Za-z]*\s*\n?[\s\S]*/i, '').trim();
                    currentText = displayOutput || "Generating assets...";
                 }
                 pendingMessageUpdate = { steps: [...currentSteps], text: currentText };
                 scheduleMessagesUpdate();
               } else if (deltaText) {
                 accumulatedOutput += deltaText;
                 const displayOutput = accumulatedOutput.replace(/```[A-Za-z]*\s*\n?[\s\S]*/i, '').trim();
                 currentText = displayOutput || "Generating assets...";
                 pendingMessageUpdate = { steps: [...currentSteps], text: currentText };
                 scheduleMessagesUpdate();
               }
            } else if (event.event_type === 'interaction.completed') {
              console.log("[VibeCode] Event interaction.completed received. Processing final outputs...");
              flushMessagesUpdate(true);
              const finalInteraction = event.interaction;
              if (finalInteraction.environment_id) {
                setEnvId(finalInteraction.environment_id);
                activeEnvId = finalInteraction.environment_id;
              }
              
              setMessages(prev => {
                if (prev.length === 0) return prev;
                const newMsgs = [...prev];
                const lastIdx = newMsgs.length - 1;
                const lastMsg = newMsgs[lastIdx];
                newMsgs[lastIdx] = { ...lastMsg, steps: finalInteraction.steps };
                return newMsgs;
              });
              
              // Safely extract final HTML
              let fullModelOutput = "";
              if (finalInteraction.steps && Array.isArray(finalInteraction.steps)) {
                for (const step of finalInteraction.steps) {
                  if (step.type === 'model_output') {
                    const txt = step.text || (step.content?.find((c: any) => c.type === 'text')?.text) || "";
                    fullModelOutput += txt;
                  }
                }
              }
              
              let finalHtmlText = fullModelOutput.trim().length > 0 ? fullModelOutput : accumulatedOutput;
              let parsedReport: any = null;
              const jsonMatch = finalHtmlText.match(/```json\s*([\s\S]*?)\s*```/);
              
              if (jsonMatch) {
                try {
                  parsedReport = JSON.parse(jsonMatch[1]);
                } catch (err) {
                  // Ignore parse error, we'll fall back to code block parsing
                }
              }

              // Check if parsedReport is just a string or missing files array
              if (parsedReport && !parsedReport.files) {
                  parsedReport = null;
              }

              let parsedFilesOuter: any[] = [];
              if (parsedReport) {
                if (parsedReport.title) { setProjectName(parsedReport.title); }
                const appUrl = parsedReport.app_url || parsedReport.url;
                if (appUrl) {
                  setSandboxUrl(appUrl);
                  activeSandboxUrl = appUrl;
                }
                
                const filesManifest = parsedReport.files || parsedReport.manifest;
                if (filesManifest && Array.isArray(filesManifest)) {
                  parsedFilesOuter = filesManifest;
                  const formattedFiles = filesManifest.map((f: any, i: number) => ({
                    ...f,
                    name: f.filename || f.name,
                    id: `sandbox-file-${i}`,
                  }));
                  setSandboxFiles(prev => {
                     const updated = [...prev];
                     formattedFiles.forEach((pf: any) => {
                        const existingIdx = updated.findIndex((f: any) => f.name === pf.name);
                        if (existingIdx !== -1) {
                           updated[existingIdx] = { ...updated[existingIdx], content: pf.content };
                        } else {
                           updated.push(pf);
                        }
                     });
                     return updated;
                  });
                }
              } else {
                let finalContent = "";
                const parsedFiles: any[] = [];
                // Allow missing closing ticks if it's at the end of the string
                const blockRegex = /(?:(?:<!--|\/\*|\/\/)\s*([a-zA-Z0-9_\-\.\/]+)\s*(?:-->|\*\/)?\s*)?```([a-z]*)\s*([\s\S]*?)(?:```|$)/gi;
                const matches = [...finalHtmlText.matchAll(blockRegex)];
                if (matches.length > 0) {
                   for (let i = 0; i < matches.length; i++) {
                      const match = matches[i];
                      const precedingName = match[1];
                      const lang = (match[2] || '').toLowerCase();
                      let content = match[3].trim();
                      
                      let inferredName = precedingName || '';
                      
                      const contentLines = content.split('\n');
                      if (!inferredName) {
                        for (let j = 0; j < Math.min(5, contentLines.length); j++) {
                          const line = contentLines[j].trim();
                          const commentMatch = line.match(/^(?:<!--|\/\*|\/\/)\s*([a-zA-Z0-9_\-\.\/]+)\s*(?:-->|\*\/)?/);
                          if (commentMatch && commentMatch[1] && commentMatch[1].includes('.')) {
                              inferredName = commentMatch[1];
                              break;
                          }
                        }
                      }
                      
                      if (inferredName) {
                          inferredName = inferredName.split('/').pop() || inferredName;
                      }

                      if (!inferredName) {
                          if (lang === 'html' || content.toLowerCase().includes('<!doctype html') || content.toLowerCase().includes('<html')) inferredName = 'index.html';
                          else if (lang === 'css' || content.includes(':root') || content.includes('@media')) inferredName = 'styles.css';
                          else if (lang === 'javascript' || lang === 'js') inferredName = 'app.js';
                      }

                      // strip the comment line from content if it matches to keep things tidy
                      let cleanContent = content;
                      if (inferredName) {
                         const firstLine = (contentLines[0] || '').trim();
                         if (firstLine.includes(inferredName) && firstLine.match(/^(?:<!--|\/\*|\/\/)/)) {
                             cleanContent = contentLines.slice(1).join('\n').trim();
                         }
                      }
                      
                      const finalFileContent = cleanContent || content;

                      if (lang === 'json') {
                         // Check if this looks like JSON configuration or a broken block
                         if (finalFileContent.includes('"index.html"') || finalFileContent.startsWith('{')) {
                            continue;
                         }
                      }

                      // Check if it is a Google Workspace native document naming convention
                      const isNativeWorkspace = inferredName && (
                        inferredName.toLowerCase().endsWith('.doc') ||
                        inferredName.toLowerCase().endsWith('.gdoc') ||
                        inferredName.toLowerCase().endsWith('.docx') ||
                        inferredName.toLowerCase().endsWith('.gslides') ||
                        inferredName.toLowerCase().endsWith('.ppt') ||
                        inferredName.toLowerCase().endsWith('.pptx') ||
                        inferredName.toLowerCase().endsWith('.gsheet') ||
                        inferredName.toLowerCase().endsWith('.xlsx')
                      );

                      // If no lang, but looks like HTML, treat as HTML
                      const isHtml = !isNativeWorkspace && (lang === 'html' || finalFileContent.toLowerCase().includes('<!doctype html') || finalFileContent.toLowerCase().includes('<html') || finalFileContent.toLowerCase().includes('<div'));
                      if (isHtml) {
                         finalContent = finalFileContent;
                         const titleMatch = finalFileContent.match(/<title>([^<]+)<\/title>/i);
                         if (titleMatch && titleMatch[1]) {
                             setProjectName(titleMatch[1].trim());
                         }
                         parsedFiles.push({ name: inferredName || 'index.html', type: 'code', content: finalContent, id: `sandbox-file-${parsedFiles.length}` });
                      } else if (lang === 'css' || inferredName === 'styles.css') {
                         parsedFiles.push({ name: inferredName || 'styles.css', type: 'code', content: finalFileContent, id: `sandbox-file-${parsedFiles.length}` });
                      } else if (lang === 'javascript' || lang === 'js' || lang === 'jsx' || lang === 'ts' || lang === 'tsx') {
                         parsedFiles.push({ name: inferredName || 'app.js', type: 'code', content: finalFileContent, id: `sandbox-file-${parsedFiles.length}` });
                      } else if (lang === 'csv') {
                         parsedFiles.push({ name: inferredName || 'database.csv', type: 'code', content: finalFileContent, id: `sandbox-file-${parsedFiles.length}` });
                      } else if (inferredName) {
                         parsedFiles.push({ name: inferredName, type: 'code', content: finalFileContent, id: `sandbox-file-${parsedFiles.length}` });
                      }
                   }
                }
                
                if (parsedFiles.length === 0) {
                   const fallbackMatch = finalHtmlText.match(/(<!(?:DOCTYPE )?html[\s\S]*?(?:<\/html>|$))/i);
                   if (fallbackMatch) {
                      finalContent = fallbackMatch[1].trim();
                      parsedFiles.push({ name: 'index.html', type: 'code', content: finalContent, id: 'sandbox-file-0' });
                   }
                }

                // Deduplicate parsedFiles by name (case-insensitive, keeping the last one)
                const deduplicatedParsedFiles: any[] = [];
                parsedFiles.forEach(pf => {
                  const existingIdx = deduplicatedParsedFiles.findIndex(df => df.name.toLowerCase() === pf.name.toLowerCase());
                  if (existingIdx !== -1) {
                    deduplicatedParsedFiles[existingIdx] = pf;
                  } else {
                    deduplicatedParsedFiles.push(pf);
                  }
                });

                console.log(`[VibeCode] Deduplicated files count: ${deduplicatedParsedFiles.length}. Names:`, deduplicatedParsedFiles.map(f => f.name));

                if (deduplicatedParsedFiles.length > 0) {
                  parsedFilesOuter = deduplicatedParsedFiles;

                  // Help user focus on the newly updated or generated Google Workspace file or web app index file
                  const gWorkspaceFile = deduplicatedParsedFiles.find(f => {
                    const m = getMimeTypeFromFileName(f.name, f.mimeType);
                    return m && (m.includes('google-apps.document') || m.includes('google-apps.presentation') || m.includes('google-apps.spreadsheet'));
                  });
                  const indexHtmlFile = deduplicatedParsedFiles.find(f => f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('/index.html'));

                  if (gWorkspaceFile) {
                    const mappedFile = {
                      ...gWorkspaceFile,
                      mimeType: getMimeTypeFromFileName(gWorkspaceFile.name, gWorkspaceFile.mimeType),
                    };
                    console.log("[VibeCode] Focus selected workspace file:", mappedFile.name);
                    setSelectedFile(mappedFile);
                    setIndexFileSelected(false);
                    setViewState('app');
                  } else if (indexHtmlFile) {
                    const mappedFile = {
                      ...indexHtmlFile,
                      mimeType: getMimeTypeFromFileName(indexHtmlFile.name, indexHtmlFile.mimeType),
                    };
                    console.log("[VibeCode] Focus selected index.html file:", mappedFile.name, `(length: ${mappedFile.content?.length})`);
                    setSelectedFile(mappedFile);
                    setIndexFileSelected(true);
                    setViewState('app');
                  } else {
                    const mappedFile = {
                      ...deduplicatedParsedFiles[0],
                      mimeType: getMimeTypeFromFileName(deduplicatedParsedFiles[0].name, deduplicatedParsedFiles[0].mimeType),
                    };
                    console.log("[VibeCode] Focus selected fallback file:", mappedFile.name);
                    setSelectedFile(mappedFile);
                    setIndexFileSelected(mappedFile.name.toLowerCase() === 'index.html');
                    setViewState('app');
                  }

                  const updatedSandbox = [...sandboxFiles];
                  deduplicatedParsedFiles.forEach(pf => {
                     const existingIdx = updatedSandbox.findIndex(f => f.name.toLowerCase() === pf.name.toLowerCase());
                     const pfWithMime = {
                       ...pf,
                       mimeType: getMimeTypeFromFileName(pf.name, pf.mimeType),
                     };
                     if (existingIdx !== -1) {
                        updatedSandbox[existingIdx] = { ...updatedSandbox[existingIdx], content: pf.content, mimeType: pfWithMime.mimeType };
                     } else {
                        updatedSandbox.push(pfWithMime);
                     }
                  });

                  setSandboxFiles(updatedSandbox);
                  combinedFilesForSync = updatedSandbox;
                  setSandboxUrl('');

                  if (combinedFilesForSync.length > 0) {
                    const activeFolder = (isHomeChatId(initialSpaceId) || !initialSpaceId)
                      ? (activeFolderId || `workspace-${Date.now()}`)
                      : initialSpaceId;
                    resolvedFolderId = activeFolder;
                    if ((isHomeChatId(initialSpaceId) || !initialSpaceId) && activeSpaceIdRef.current === initialSpaceId) {
                      setActiveSpaceId(activeFolder);
                      setActiveChatId(activeFolder);
                    }

                    let resolvedName = (projectName && projectName !== 'New' && projectName !== 'Building project...' && projectName !== 'Workspace Project') 
                      ? projectName 
                      : (currentTask !== 'app' ? currentTask : '');

                    if (!resolvedName && text) {
                      let cleaned = text.replace(/^(build|create|make|generate|design|vibe code|a|an|the|workspace|for)\s+/gi, '').trim();
                      if (cleaned) {
                        resolvedName = cleaned.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      }
                    }

                    if (!resolvedName && combinedFilesForSync.length > 0) {
                      const indexHTML = combinedFilesForSync.find((f: any) => f.name.toLowerCase() === 'index.html');
                      if (indexHTML && indexHTML.content) {
                        const titleMatch = indexHTML.content.match(/<title>(.*?)<\/title>/i);
                        if (titleMatch && titleMatch[1] && titleMatch[1].trim() !== 'App' && titleMatch[1].trim() !== 'My Web Workspace') {
                          resolvedName = titleMatch[1].trim();
                        }
                      }
                    }

                    const activeName = resolvedName || (currentTask !== 'app' ? currentTask : 'New Application');
                    if (!initialSpaceId || isHomeChatId(initialSpaceId)) {
                      setProjectName(activeName);
                    }
                    
                    const sessionItem = {
                      id: activeFolder,
                      name: activeName,
                      type: 'folder' as const,
                      isReal: true,
                      filesToLoad: combinedFilesForSync,
                      realChildren: combinedFilesForSync.map((f: any) => ({ id: f.id || f.driveId || f.name, name: f.name, mimeType: f.mimeType || 'text/html' })),
                      modifiedTime: new Date().toISOString()
                    };

                    setSuggestedListCache(prev => {
                      const filtered = prev.filter(item => item.id !== sessionItem.id && item.name !== 'Workspace Project' && item.name !== 'Building project...');
                      return [sessionItem, ...filtered];
                    });

                    setRecentTasks(prev => {
                      const now = Date.now();
                      const existing = prev.find(t => t && t.id === activeFolder);
                      const newTask = {
                        id: activeFolder,
                        name: activeName,
                        chatName: existing?.chatName,
                        type: existing?.type || 'workspace',
                        taskType: existing?.taskType,
                        activeSpaceId: activeFolder,
                        updatedAt: now
                      };
                      const filtered = prev.filter(t => {
                        const id = typeof t === 'string' ? '' : t.id;
                        const name = typeof t === 'string' ? t : t.name;
                        return id !== activeFolder && name !== 'New' && name !== 'Building project...' && name !== 'Workspace Project';
                      });
                      return [newTask, ...filtered];
                    });

                    if (activeFolderId) {
                      autoSaveToDrive(combinedFilesForSync, activeFolderId);
                    }
                  }
                }
              }

              if (parsedFilesOuter && parsedFilesOuter.length > 0 || parsedReport) {
                if (viewState !== 'app') {
                  setViewState('app');
                }
              } else if (viewState === 'null' || viewState === 'files') {
                setViewState('app');
              }
            }
          } catch (e) {
            // Ignore parse errors on incomplete stream chunks
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', text: 'Failed to connect to backend.' }]);
    } finally {
      setIsLoading(false);
      if (targetChatId && !targetChatId.endsWith('-temp')) {
        setMessages(currentMessages => {
          setTimeout(() => {
            saveChatToDb(
              targetChatId,
              currentMessages,
              activeEnvId || null,
              activeSandboxUrl || '',
              projectName,
              combinedFilesForSync,
              resolvedFolderId || initialSpaceId,
              inferredChatNameVal
            );
            if (inferredChatNameVal) {
              fetchGeminiTasks(accessToken, userProfile?.email);
            }
          }, 0);
          return currentMessages;
        });
      }
    }
  };

  const handleToggleDriveFile = (file: any) => {
    setSelectedDriveFiles(prev => {
      const exists = prev.some(f => f.name === file.name || (file.id && f.id === file.id));
      if (exists) {
        return prev.filter(f => f.name !== file.name && (!file.id || f.id !== file.id));
      } else {
        return [...prev, file];
      }
    });
  };

  const getTeamMembers = () => {
    const membersMap = new Map();
    driveFiles.forEach(file => {
      if (file.owners && Array.isArray(file.owners)) {
        file.owners.forEach((owner: any) => {
          if (owner.displayName) {
            membersMap.set(owner.emailAddress || owner.displayName, {
              name: owner.displayName,
              email: owner.emailAddress || '',
              avatar: owner.photoLink || ''
            });
          }
        });
      }
    });

    const fallbacks = [
      { name: "Sakura Okoro", email: "sakura@example.com", avatar: "" },
      { name: "Malik Harold", email: "malik@example.com", avatar: "" },
      { name: "Adam Lee", email: "adam@example.com", avatar: "" }
    ];
    fallbacks.forEach(f => {
      if (!membersMap.has(f.email)) {
        membersMap.set(f.email, f);
      }
    });

    return Array.from(membersMap.values());
  };

  const handleCreateSpace = () => {
    const tempSpaceId = `space-creation-${Date.now()}`;
    setActiveSpaceId(tempSpaceId);
    setActiveChatId(tempSpaceId);
    setProjectName('New Space');
    setCurrentTask('app');
    setMessages([]);
    setSandboxFiles([]);
    setSpaceCreationSources([]);
    setSelectedFile(null);
    setMembers([]);
    setIsSourcesPanelOpen(false);
    setViewState('app');
    setActiveSidebar('gemini');
    setIsAiSummarySnapped(false);
    setActiveAiSummaryTaskId(null);
  };

  const handleCreateNewChat = () => {
    if (!activeSpaceId) return;
    const isHome = isHomeChatId(activeSpaceId);
    const tempChatId = `${activeSpaceId}-chat-temp-${Date.now()}`;
    setActiveChatId(tempChatId);
    setMessages([]);
    if (isHome) {
      setViewState('home');
    } else {
      if (viewState === 'home') {
        setViewState(selectedFile ? 'app' : (sandboxFiles.length > 0 ? 'files' : 'null'));
      }
    }
    setActiveSidebar('gemini');
  };

  const handleProactiveTaskClick = (task: any) => {
    const spaceName = cleanWorkspaceName(task.workspace || task.sourceName || 'Workspace');
    setProjectName(spaceName);
    setViewState('files');
    setActiveProactiveTask(task);

    let resolvedSpaceId = 'home';
    let resolvedSpaceName = spaceName;
    const isHomeTask = spaceName.toLowerCase() === 'home' || spaceName.toLowerCase() === 'home dashboard' || isHomeChatId(spaceName);

    if (!isHomeTask) {
      let matchingSpace: any = null;
      if (activeSpaceId && !isHomeChatId(activeSpaceId)) {
        matchingSpace = projects.find(p => (p.id || p.activeSpaceId) === activeSpaceId) || recentTasks.find(s => (s.id || s.activeSpaceId) === activeSpaceId) || { id: activeSpaceId, name: spaceName };
      } else {
        matchingSpace = projects.find(p => p.name && p.name.toLowerCase() === spaceName.toLowerCase()) ||
                        recentTasks.find(s => s.name && s.name.toLowerCase() === spaceName.toLowerCase() && !isHomeChatId(s.activeSpaceId || s.id));
      }
      resolvedSpaceId = matchingSpace ? (matchingSpace.activeSpaceId || matchingSpace.id) : 'home';
      resolvedSpaceName = matchingSpace ? matchingSpace.name : spaceName;
    }
    setActiveSpaceId(resolvedSpaceId);
    setActiveChatId(resolvedSpaceId);

    const allKnownDriveFiles = [...driveFiles, ...suggestedListCache];
    const searchString = [
      spaceName,
      task.sourceName,
      task.source,
      task.title,
      task.description,
      task.workspace,
      task.filesToLoad?.[0]?.name
    ].filter(Boolean).join(' ').toLowerCase();

    const matchedInDrive = allKnownDriveFiles.find(f => {
      if (!f || !f.name) return false;
      const fNameLower = f.name.toLowerCase();
      const fNameClean = fNameLower.replace(/\.[^/.]+$/, "").trim();
      if (!fNameClean || fNameClean.length < 2) return false;
      return fNameLower === (task.filesToLoad?.[0]?.name || '').toLowerCase() ||
             fNameClean === spaceName.toLowerCase() ||
             searchString.includes(fNameClean);
    });
    const targetId = task.filesToLoad?.[0]?.driveId || task.fileId || task.driveId || matchedInDrive?.id;
    const targetMime = task.filesToLoad?.[0]?.mimeType || task.sourceMimeType || matchedInDrive?.mimeType || 'application/vnd.google-apps.document';
    const targetName = task.filesToLoad?.[0]?.name || task.sourceName || matchedInDrive?.name || `${spaceName}.gdoc`;

    if (task.draftData?.draftContent) {
      const draftFileObj = {
        name: targetName,
        type: 'code',
        content: task.draftData.draftContent,
        driveId: targetId,
        id: `draft-file-${task.id}`,
        mimeType: targetMime,
        isProactiveDraft: true,
        summaryOfChanges: task.draftData.summaryOfChanges
      };
      setSandboxFiles([draftFileObj]);
      setSelectedFile(draftFileObj);
    } else if (task.draftData?.emailDraft || task.draftData?.calDraft || task.type === 'email' || task.source?.toLowerCase().includes('email') || task.title?.toLowerCase().includes('email') || task.title?.toLowerCase().includes('cal')) {
      const commFileObj = {
        name: task.draftData?.calDraft ? 'Calendar Invite Update' : 'Email Reply Draft',
        type: 'code',
        content: JSON.stringify(task.draftData || { task }, null, 2),
        id: `comm-draft-${task.id}`,
        mimeType: 'application/json',
        isCommDraft: true,
        commData: task.draftData || { 
          draftType: task.title?.toLowerCase().includes('cal') ? 'calendar' : 'email', 
          emailDraft: { to: 'team@company.com', subject: `Re: ${task.source || task.title}`, body: `Hi Team,\n\nI have addressed the feedback regarding ${task.title}. Let me know if further adjustments are needed.\n\nBest,\nOllie` },
          calDraft: { eventId: `evt_${Date.now()}`, title: `${task.source || 'Project Check-in'} (Rescheduled)`, proposedTime: '2026-07-10T15:00:00Z', agenda: `Agenda:\n- Review updates on ${task.title}\n- Alignment on next steps` },
          summaryOfChanges: 'Prepared proactive draft communication based on workspace feedback.' 
        }
      };
      setSandboxFiles([commFileObj]);
      setSelectedFile(commFileObj);
    } else if (task.filesToLoad && task.filesToLoad.length > 0) {
      const updatedFiles = task.filesToLoad.map((f: any, idx: number) => {
        if (idx === 0 && targetId) {
          return {
            ...f,
            name: matchedInDrive?.name || f.name,
            driveId: targetId,
            id: `real-file-${targetId}`,
            mimeType: matchedInDrive?.mimeType || f.mimeType || targetMime,
            isProactiveDraft: true,
            summaryOfChanges: "Updated content layout and incorporated feedback from team comments."
          };
        }
        return f;
      });
      setSandboxFiles(updatedFiles);
      setSelectedFile(updatedFiles[0]);
    } else if (targetId) {
      const newFileObj = {
        name: targetName,
        type: 'code',
        content: '',
        driveId: targetId,
        id: `real-file-${targetId}`,
        mimeType: targetMime
      };
      setSandboxFiles([newFileObj]);
      setSelectedFile(newFileObj);
    } else {
      setSandboxFiles([]);
      setSelectedFile(null);
    }

    if (targetId && accessToken) {
      (async () => {
        try {
          const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${targetId}?fields=id,name,mimeType`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (metaRes.ok) {
            const meta = await metaRes.json();
            const mType = (meta.mimeType || '').toLowerCase();
            let expUrl = '';
            if (mType.includes('document')) {
              expUrl = `https://www.googleapis.com/drive/v3/files/${targetId}/export?mimeType=text/plain`;
            } else if (mType.includes('spreadsheet')) {
              expUrl = `https://www.googleapis.com/drive/v3/files/${targetId}/export?mimeType=text/csv`;
            } else if (mType.includes('presentation') || mType.includes('slide')) {
              expUrl = `https://www.googleapis.com/drive/v3/files/${targetId}/export?mimeType=text/plain`;
            } else {
              expUrl = `https://www.googleapis.com/drive/v3/files/${targetId}?alt=media`;
            }
            
            const contentRes = await fetch(expUrl, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (contentRes.ok) {
              const textOrDataUrl = await contentRes.text();
              const realFileObj: any = {
                name: meta.name || spaceName,
                type: 'code',
                content: task.draftData?.draftContent || textOrDataUrl,
                driveId: targetId,
                mimeType: meta.mimeType,
                id: `real-file-${targetId}`,
                isProactiveDraft: !!task.draftData?.draftContent,
                summaryOfChanges: task.draftData?.summaryOfChanges
              };
              setSandboxFiles([realFileObj]);
              setSelectedFile(realFileObj);

              if (!task.draftData?.draftContent) {
                fetch('/api/proactive-draft', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ task, originalContent: textOrDataUrl })
                }).then(r => r.json()).then(draft => {
                  if (draft.draftContent) {
                    const updatedDraftObj = {
                      ...realFileObj,
                      content: draft.draftContent,
                      isProactiveDraft: true,
                      summaryOfChanges: draft.summaryOfChanges
                    };
                    setSandboxFiles([updatedDraftObj]);
                    setSelectedFile(updatedDraftObj);
                    setActiveProactiveTask((prev: any) => prev ? { ...prev, draftData: draft } : null);
                  }
                }).catch(e => console.error("Error drafting against live drive:", e));
              }
            }
          }
        } catch (err) {
          console.error("Error fetching live Drive content in handleProactiveTaskClick:", err);
        }
      })();
    }

    const tempChatId = `${spaceName}-proactive-${task.id || Date.now()}`;
    
    const handleApproveProactive = () => {
      setTodoItems(prev => {
        const updated = prev.map(t => t.id === task.id ? { ...t, status: 'done', title: t.titleDone || t.title, description: t.descriptionDone || t.description } : t);
        const spaceKey = activeSpaceId || 'home';
        if (todoCacheRef.current) {
          todoCacheRef.current[spaceKey] = updated;
        }
        return updated;
      });
      setActiveProactiveTask((prev: any) => prev ? { ...prev, status: 'done', title: prev.titleDone || prev.title, description: prev.descriptionDone || prev.description } : null);
      setMessages(prev => prev.map(m => m.isProactiveReview ? {
        ...m,
        proactiveTask: { ...m.proactiveTask, status: 'done', title: m.proactiveTask.titleDone || m.proactiveTask.title, description: m.proactiveTask.descriptionDone || m.proactiveTask.description }
      } : m));
    };

    const handleFeedbackProactive = () => {
      const composerInput = document.querySelector('textarea[placeholder*="Ask Gemini"], textarea[placeholder*="Ask anything"], textarea') as HTMLTextAreaElement | null;
      if (composerInput) {
        composerInput.focus();
      }
    };

    const proactiveMsgs = [
      { role: 'user', text: `Review Proactive Action: ${task.titleDone || task.title}` },
      {
        role: 'bot',
        text: '',
        isProactiveReview: true,
        proactiveTask: task,
        onApproveProactive: handleApproveProactive,
        onFeedbackProactive: handleFeedbackProactive
      }
    ];

    chatSessionsCacheRef.current[tempChatId] = { messages: proactiveMsgs };
    workspaceCacheRef.current[tempChatId] = {
      ingestedFiles: [],
      sandboxFiles: task.filesToLoad || [],
      envId: null,
      sandboxUrl: '',
      messages: proactiveMsgs,
      projectName: spaceName,
      selectedFile: task.filesToLoad?.[0] || null,
      indexFileSelected: false,
      viewState: 'files'
    };

    setRecentTasks(prev => {
      const exists = prev.some(item => item && (item.id === tempChatId || item.chatId === tempChatId));
      if (!exists) {
        let cName = task.titleDone || task.title || task.description || 'Task';
        if (cName.length > 22) {
          cName = cName.substring(0, 20).trim() + '...';
        }
        return [{
          id: tempChatId,
          chatId: tempChatId,
          chatName: cName,
          activeSpaceId: resolvedSpaceId,
          name: resolvedSpaceName,
          messages: proactiveMsgs
        }, ...prev];
      }
      return prev;
    });

    setActiveChatId(tempChatId);
    setMessages(proactiveMsgs);
    setActiveSidebar('gemini');
  };

  const handleFinalizeSpace = async (name: string, selectedPeople: any[]) => {
    setCurrentTask('app');
    const cleanFolderName = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const spaceId = `space-${Date.now()}`;
    setNewlyCreatedSpaceIds(prev => new Set(prev).add(spaceId));

    setActiveSpaceId(spaceId);
    setActiveChatId(spaceId);
    setProjectName(cleanFolderName);
    setMembers(selectedPeople);
    
    setIsCreatingSpace(true);
    setSyncStatus('syncing');

    // Add to recentTasks immediately so the new space appears in the left navigation instantly
    setRecentTasks(prev => {
      const now = Date.now();
      const filtered = prev.filter(t => {
        const id = typeof t === 'string' ? '' : t.id;
        return id !== spaceId;
      });
      return [{ id: spaceId, name: cleanFolderName, type: 'space', activeSpaceId: spaceId, updatedAt: now }, ...filtered];
    });
    
    try {
      const fileTasks = spaceCreationSources.map(async (file, idx) => {
        let content = file.content || '';
        const mType = (file.mimeType || '').toLowerCase().trim();
        
        // Skip content download for binary/unknown formats at space creation
        const isTextOrCode = mType.startsWith('text/') || 
                             mType === 'application/json' || 
                             mType === 'application/javascript' || 
                             mType === 'application/x-javascript' ||
                             mType.includes('google-apps.document') || 
                             mType.includes('google-apps.spreadsheet');

        if (!content && accessToken) {
          const isPresentation = mType === 'application/vnd.google-apps.presentation';
          if (isTextOrCode || isPresentation) {
            let url = '';
            if (mType.includes('google-apps.document')) {
              url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
            } else if (mType.includes('google-apps.spreadsheet')) {
              url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
            } else if (isPresentation) {
              url = `https://www.googleapis.com/drive/v3/files/${file.id}?fields=description,name,mimeType`;
            } else {
              url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
            }
            
            try {
              const contentRes = await fetch(url, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              if (contentRes.ok) {
                if (isPresentation) {
                  const pMeta = await contentRes.json();
                  content = `# Presentation: ${pMeta.name}\n\nType: Google Slides\nFile ID: ${file.id}`;
                } else {
                  content = await contentRes.text();
                }
              }
            } catch (dlErr) {
              console.error("Failed to download file content during space finalize:", dlErr);
              content = `# ${file.name}\n\n[Drive File Content]`;
            }
          } else {
            content = ''; // Placeholder/empty for binary files
          }
        }
        
        return {
          sandboxFile: {
            name: file.name,
            type: 'code',
            content: content,
            driveId: file.id,
            mimeType: file.mimeType,
            id: `copied-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`
          },
          ingestedFile: {
            id: file.id,
            filename: file.name,
            content: content,
            mimeType: file.mimeType
          }
        };
      });

      const taskResults = await Promise.all(fileTasks);
      const newSandboxFiles: any[] = [];
      const newIngestedFiles: any[] = [];

      for (const res of taskResults) {
        if (res) {
          newSandboxFiles.push(res.sandboxFile);
          newIngestedFiles.push(res.ingestedFile);
        }
      }

      setSandboxFiles(newSandboxFiles);
      setIngestedFiles(newIngestedFiles);
      
      newSandboxFiles.forEach((f: any) => {
        lastSavedContentsRef.current[f.name.toLowerCase()] = f.content || '';
      });

      setSelectedFile(null);
      setIndexFileSelected(false);
      setViewState(newSandboxFiles.length > 0 ? 'files' : 'null');
      setSyncStatus('synced');
      setMessages([]);

      try {
        await fetch(`/api/chats/${spaceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [],
            envId: null,
            sandboxUrl: '',
            projectName: cleanFolderName,
            sandboxFiles: newSandboxFiles,
            members: selectedPeople,
            userEmail: userProfile?.email || '',
            activeSpaceId: spaceId
          })
        });
      } catch (saveChatErr) {
        console.warn("Failed to save welcome chat:", saveChatErr);
      }

    } catch (e) {
      console.error("Failed to copy RAG context files to space:", e);
      setSandboxFiles([]);
      setSelectedFile(null);
      setViewState('files');
      setSyncStatus('failed');
    } finally {
      setIsCreatingSpace(false);
      setSpaceCreationSources([]);
    }

  };

  const createSpace = async (promptText?: string) => {
    if (!accessToken) {
      alert("Please log in first!");
      return null;
    }
    setIsCreatingSpace(true);
    setSyncStatus('syncing');
    try {
      const spaceId = `space-${Date.now()}`;
      
      // Summarize task/prompt to get project name
      let folderName = "Web App Project";
      let sourcePrompt = promptText;
      if (!sourcePrompt && selectedDriveFiles.length > 0) {
        sourcePrompt = `workspace with files: ${selectedDriveFiles.map(f => f.name).join(', ')}`;
      }

      if (sourcePrompt) {
        try {
          const sumRes = await fetch('/api/summarize-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: sourcePrompt })
          });
          const sumData = await sumRes.json();
          if (sumData.summary && sumData.summary !== 'app') {
            folderName = sumData.summary;
          }
        } catch (err) {
          console.warn("Failed to summarize folder title:", err);
        }
      }
      
      const cleanFolderName = folderName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      setProjectName(cleanFolderName);
      setActiveSpaceId(spaceId);
      setActiveChatId(spaceId);
      setMembers([]);

      // Ingest/download contents of selected files in parallel directly from their source Drive location
      const fileTasks = selectedDriveFiles.map(async (file, idx) => {
        if (file.id) {
          // It's a Google Drive file, download its contents directly from its source location
          let url = '';
          const mType = (file.mimeType || '').toLowerCase().trim();
          if (mType.includes('google-apps.document')) {
            url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
          } else if (mType.includes('google-apps.spreadsheet')) {
            url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
          } else if (mType.includes('google-apps.presentation')) {
            url = `https://www.googleapis.com/drive/v3/files/${file.id}?fields=description,name,mimeType`;
          } else {
            url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
          }
          
          let content = '';
          try {
            const contentRes = await fetch(url, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (contentRes.ok) {
              if (mType === 'application/vnd.google-apps.presentation') {
                const pMeta = await contentRes.json();
                content = `# Presentation: ${pMeta.name}\n\nType: Google Slides\nFile ID: ${file.id}`;
              } else {
                content = await contentRes.text();
              }
            } else {
              console.warn(`Failed to download contents for file: ${file.name}, status: ${contentRes.status}`);
            }
          } catch (dlErr) {
            console.error("Failed to download file content:", dlErr);
            content = `# ${file.name}\n\n[Drive File Content]`;
          }
          
          return {
            sandboxFile: {
              name: file.name,
              type: 'code',
              content: content,
              driveId: file.id,
              mimeType: file.mimeType,
              id: `copied-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`
            },
            ingestedFile: {
              id: file.id,
              filename: file.name,
              content: content,
              mimeType: file.mimeType
            }
          };
        } else {
          // Local/uploaded file
          return {
            sandboxFile: {
              name: file.name,
              type: 'code',
              content: file.content,
              driveId: `local-${Date.now()}-${idx}`,
              mimeType: file.mimeType || 'text/plain',
              id: `copied-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`
            },
            ingestedFile: {
              id: `local-${Date.now()}-${idx}`,
              filename: file.name,
              content: file.content,
              mimeType: file.mimeType || 'text/plain'
            }
          };
        }
      });

      const taskResults = await Promise.all(fileTasks);
      const newSandboxFiles: any[] = [];
      const newIngestedFiles: any[] = [];

      for (const res of taskResults) {
        if (res) {
          newSandboxFiles.push(res.sandboxFile);
          newIngestedFiles.push(res.ingestedFile);
        }
      }

      setSandboxFiles(newSandboxFiles);
      setIngestedFiles(newIngestedFiles);
      
      // Store initial contents to prevent unnecessary autosaver triggers
      newSandboxFiles.forEach((f: any) => {
        lastSavedContentsRef.current[f.name.toLowerCase()] = f.content || '';
      });

      setSelectedDriveFiles([]); // Reset checkboxes
      
      setSelectedFile(null);
      setIndexFileSelected(false);
      setViewState(newSandboxFiles.length > 0 ? 'files' : 'null');
      setSyncStatus('synced');

      // Save the Space locally to backend
      let combinedMessages = messages;
      if (promptText) {
        combinedMessages = [...messages, { role: 'user', text: promptText }];
      }
      setMessages(combinedMessages);

      try {
        await fetch(`/api/chats/${spaceId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: combinedMessages,
            envId: null,
            sandboxUrl: '',
            projectName: cleanFolderName,
            sandboxFiles: newSandboxFiles,
            members: [],
            userEmail: userProfile?.email || '',
            activeSpaceId: spaceId
          })
        });
      } catch (saveChatErr) {
        console.warn("Failed to save space:", saveChatErr);
      }

      // Add to recentTasks list
      setRecentTasks(prev => {
        const now = Date.now();
        const filtered = prev.filter(t => {
          const id = typeof t === 'string' ? '' : t.id;
          return id !== spaceId;
        });
        return [{ id: spaceId, name: cleanFolderName, type: 'space', activeSpaceId: spaceId, updatedAt: now }, ...filtered];
      });

      return { spaceId, files: newSandboxFiles };
    } catch (e) {
      console.error("Failed to create space:", e);
      setSyncStatus('failed');
      alert("Error assembling space. Check console.");
      return null;
    } finally {
      setIsCreatingSpace(false);
    }
  };

  const updateGoogleDocNative = async (documentId: string, content: string, token: string, isCreatedFromComposer?: boolean) => {
    try {
      console.log(`[Google Docs API] Fetching Document ID ${documentId} before native write...`);
      const getRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!getRes.ok) {
        throw new Error(`Failed to fetch document structure: ${getRes.status}`);
      }
      const doc = await getRes.json();
      
      let maxEndIndex = 1;
      if (doc.body && doc.body.content) {
        doc.body.content.forEach((el: any) => {
          if (el.endIndex > maxEndIndex) {
            maxEndIndex = el.endIndex;
          }
        });
      }

      if (maxEndIndex > 2) {
        try {
          console.log(`[Google Docs API] Clearing existing document content (${maxEndIndex - 1} chars)...`);
          await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              requests: [{
                deleteContentRange: {
                  range: {
                    startIndex: 1,
                    endIndex: maxEndIndex - 1
                  }
                }
              }]
            })
          });
        } catch (delErr) {
          console.warn("[Google Docs API] Error clearing document before write:", delErr);
        }
      }

      const requests: any[] = [];

      if (!isCreatedFromComposer) {
        requests.push({
          insertText: {
            location: { index: 1 },
            text: content || " "
          }
        });

        const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        });

        if (updateRes.ok) {
          console.log(`[Google Docs API] Successfully wrote native Doc content!`);
        } else {
          console.error(`[Google Docs API] update failed:`, await updateRes.text());
        }
        return;
      }

      // Automatically format composer-created document with proper native styling
      console.log(`[Google Docs API] Compiling formatted Doc content from Markdown...`);

      const parseInlineStyles = (rawText: string, textStartOffset: number) => {
        let cleanText = "";
        const inlineStyles: { type: 'bold' | 'italic'; start: number; end: number }[] = [];
        let i = 0;
        while (i < rawText.length) {
          if (rawText.startsWith('**', i) || rawText.startsWith('__', i)) {
            const marker = rawText.startsWith('**', i) ? '**' : '__';
            const endIdx = rawText.indexOf(marker, i + 2);
            if (endIdx !== -1) {
              const inner = rawText.substring(i + 2, endIdx);
              const boldStart = textStartOffset + cleanText.length;
              cleanText += inner;
              const boldEnd = textStartOffset + cleanText.length;
              inlineStyles.push({ type: 'bold', start: boldStart, end: boldEnd });
              i = endIdx + 2;
              continue;
            }
          }
          if (rawText.startsWith('*', i) || rawText.startsWith('_', i)) {
            const marker = rawText.startsWith('*', i) ? '*' : '_';
            const endIdx = rawText.indexOf(marker, i + 1);
            if (endIdx !== -1) {
              const inner = rawText.substring(i + 1, endIdx);
              const italicStart = textStartOffset + cleanText.length;
              cleanText += inner;
              const italicEnd = textStartOffset + cleanText.length;
              inlineStyles.push({ type: 'italic', start: italicStart, end: italicEnd });
              i = endIdx + 1;
              continue;
            }
          }
          cleanText += rawText[i];
          i++;
        }
        return { cleanText, inlineStyles };
      };

      let currentOffset = 1;
      const paragraphs: {
        cleanText: string;
        type: 'h1' | 'h2' | 'h3' | 'bullet' | 'normal';
        start: number;
        end: number;
        inlineStyles: any[];
      }[] = [];

      const rawLines = content.split('\n');
      rawLines.forEach((line) => {
        const trimmed = line.trim();
        // Skip comment lines or envelope selectors like <!-- document.doc -->
        if (trimmed.startsWith('<!--') || trimmed.endsWith('-->')) {
          return;
        }

        if (!trimmed) {
          paragraphs.push({
            cleanText: "",
            type: 'normal',
            start: currentOffset,
            end: currentOffset + 1,
            inlineStyles: []
          });
          currentOffset += 1;
          return;
        }

        let type: 'h1' | 'h2' | 'h3' | 'bullet' | 'normal' = 'normal';
        let rawText = line;

        if (trimmed.startsWith('# ')) {
          type = 'h1';
          rawText = trimmed.substring(2);
        } else if (trimmed.startsWith('## ')) {
          type = 'h2';
          rawText = trimmed.substring(3);
        } else if (trimmed.startsWith('### ')) {
          type = 'h3';
          rawText = trimmed.substring(4);
        } else if (trimmed.match(/^[-*+]\s+/)) {
          type = 'bullet';
          rawText = trimmed.replace(/^[-*+]\s+/, '');
        } else if (trimmed.match(/^\d+\.\s+/)) {
          type = 'bullet';
          rawText = trimmed.replace(/^\d+\.\s+/, '');
        }

        const parsed = parseInlineStyles(rawText, currentOffset);
        paragraphs.push({
          cleanText: parsed.cleanText,
          type,
          start: currentOffset,
          end: currentOffset + parsed.cleanText.length + 1,
          inlineStyles: parsed.inlineStyles
        });

        currentOffset += parsed.cleanText.length + 1;
      });

      const fullPlainText = paragraphs.map(p => p.cleanText).join('\n') + '\n';

      // 1. Insert complete plain text first
      requests.push({
        insertText: {
          location: { index: 1 },
          text: fullPlainText || " "
        }
      });

      // 2. Set default font style (Arial, size 11, dark charcoal) across entire doc
      requests.push({
        updateTextStyle: {
          range: {
            startIndex: 1,
            endIndex: fullPlainText.length || 1
          },
          textStyle: {
            weightedFontFamily: {
              fontFamily: "Arial"
            },
            fontSize: {
              magnitude: 11,
              unit: "PT"
            },
            foregroundColor: {
              color: {
                rgbColor: { red: 0.15, green: 0.2, blue: 0.25 }
              }
            }
          },
          fields: "weightedFontFamily,fontSize,foregroundColor"
        }
      });

      // 3. Apply paragraph type styles & inline styles
      paragraphs.forEach((p) => {
        if (p.cleanText.length === 0) return;

        if (p.type === 'h1') {
          requests.push({
            updateParagraphStyle: {
              range: { startIndex: p.start, endIndex: p.end },
              paragraphStyle: { namedStyleType: "HEADING_1" },
              fields: "namedStyleType"
            }
          });
          requests.push({
            updateTextStyle: {
              range: { startIndex: p.start, endIndex: p.end - 1 },
              textStyle: {
                weightedFontFamily: { fontFamily: "Arial" },
                fontSize: { magnitude: 20, unit: "PT" },
                bold: true,
                foregroundColor: {
                  color: { rgbColor: { red: 0.06, green: 0.09, blue: 0.16 } }
                }
              },
              fields: "weightedFontFamily,fontSize,bold,foregroundColor"
            }
          });
        } else if (p.type === 'h2') {
          requests.push({
            updateParagraphStyle: {
              range: { startIndex: p.start, endIndex: p.end },
              paragraphStyle: { namedStyleType: "HEADING_2" },
              fields: "namedStyleType"
            }
          });
          requests.push({
            updateTextStyle: {
              range: { startIndex: p.start, endIndex: p.end - 1 },
              textStyle: {
                weightedFontFamily: { fontFamily: "Arial" },
                fontSize: { magnitude: 15, unit: "PT" },
                bold: true,
                foregroundColor: {
                  color: { rgbColor: { red: 0.12, green: 0.16, blue: 0.23 } }
                }
              },
              fields: "weightedFontFamily,fontSize,bold,foregroundColor"
            }
          });
        } else if (p.type === 'h3') {
          requests.push({
            updateParagraphStyle: {
              range: { startIndex: p.start, endIndex: p.end },
              paragraphStyle: { namedStyleType: "HEADING_3" },
              fields: "namedStyleType"
            }
          });
          requests.push({
            updateTextStyle: {
              range: { startIndex: p.start, endIndex: p.end - 1 },
              textStyle: {
                weightedFontFamily: { fontFamily: "Arial" },
                fontSize: { magnitude: 12.5, unit: "PT" },
                bold: true,
                foregroundColor: {
                  color: { rgbColor: { red: 0.2, green: 0.25, blue: 0.33 } }
                }
              },
              fields: "weightedFontFamily,fontSize,bold,foregroundColor"
            }
          });
        } else if (p.type === 'bullet') {
          requests.push({
            createParagraphBullets: {
              range: { startIndex: p.start, endIndex: p.end },
              bulletPreset: "BULLET_DISC_CIRCLE_SQUARE"
            }
          });
        }

        p.inlineStyles.forEach((style) => {
          requests.push({
            updateTextStyle: {
              range: { startIndex: style.start, endIndex: style.end },
              textStyle: {
                bold: style.type === 'bold',
                italic: style.type === 'italic'
              },
              fields: style.type === 'bold' ? "bold" : "italic"
            }
          });
        });
      });

      const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      if (updateRes.ok) {
        console.log(`[Google Docs API] Successfully wrote formatted native Doc content (${requests.length} operations) to ID: ${documentId}!`);
      } else {
        const errBody = await updateRes.text();
        console.error(`[Google Docs API] batchUpdate failed for ID ${documentId}:`, errBody);
        alert(`[Google Docs API Sync Error] Could not save content to Google Doc: ${errBody}`);
      }
    } catch (err: any) {
      console.error(`[Google Docs API] Error during save:`, err);
      alert(`[Google Docs API Exception] ${err?.message || err}`);
    }
  };

  const updateGoogleSlideNative = async (presentationId: string, content: string, token: string) => {
    try {
      console.log(`[Google Slides API] Fetching presentation ${presentationId}...`);
      const getRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!getRes.ok) {
        throw new Error(`Failed to fetch presentation slides: ${getRes.status}`);
      }
      const presentation = await getRes.json();
      const oldSlideIds = (presentation.slides || []).map((s: any) => s.objectId);

      // Parse text into slide chunks
      let blocks = content.split(/\n---\s*\n/);
      if (blocks.length <= 1) {
        const headings = content.split(/\n(?=#+\s+)/);
        if (headings.length > 1) {
          blocks = headings;
        } else {
          blocks = [content];
        }
      }

      const slidesData = blocks.map(block => {
        const lines = block.trim().split('\n');
        let title = "Slide Title";
        const bodyLines: string[] = [];
        let foundTitle = false;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          if (!foundTitle) {
            title = line.replace(/^#+\s*/, '');
            foundTitle = true;
          } else {
            bodyLines.push(line);
          }
        }
        return { title, body: bodyLines.join('\n') };
      });

      const requests: any[] = [];
      const timestamp = Date.now();

      slidesData.forEach((sd, idx) => {
        const slideId = `slide_${timestamp}_${idx}`;
        const titleId = `title_${timestamp}_${idx}`;
        const bodyId = `body_${timestamp}_${idx}`;

        requests.push({
          createSlide: {
            objectId: slideId,
            slideLayoutReference: { predefinedLayout: "BLANK" }
          }
        });

        requests.push({
          createShape: {
            objectId: titleId,
            shapeType: "TEXT_BOX",
            elementProperties: {
              pageObjectId: slideId,
              size: {
                width: { magnitude: 600, unit: "PT" },
                height: { magnitude: 60, unit: "PT" }
              },
              transform: {
                scaleX: 1, scaleY: 1, translateX: 50, translateY: 50, unit: "PT"
              }
            }
          }
        });

        requests.push({
          insertText: { objectId: titleId, text: sd.title }
        });

        requests.push({
          updateTextStyle: {
            objectId: titleId,
            style: {
              fontSize: { magnitude: 26, unit: "PT" },
              bold: true,
              foregroundColor: {
                opaqueColor: { rgbColor: { red: 0.1, green: 0.15, blue: 0.25 } }
              }
            },
            fields: "fontSize,bold,foregroundColor"
          }
        });

        if (sd.body.trim()) {
          requests.push({
            createShape: {
              objectId: bodyId,
              shapeType: "TEXT_BOX",
              elementProperties: {
                pageObjectId: slideId,
                size: {
                  width: { magnitude: 600, unit: "PT" },
                  height: { magnitude: 300, unit: "PT" }
                },
                transform: {
                  scaleX: 1, scaleY: 1, translateX: 50, translateY: 130, unit: "PT"
                }
              }
            }
          });

          requests.push({
            insertText: { objectId: bodyId, text: sd.body }
          });

          requests.push({
            updateTextStyle: {
              objectId: bodyId,
              style: {
                fontSize: { magnitude: 14, unit: "PT" },
                foregroundColor: {
                  opaqueColor: { rgbColor: { red: 0.25, green: 0.3, blue: 0.35 } }
                }
              },
              fields: "fontSize,foregroundColor"
            }
          });
        }
      });

      // Delete old slides
      oldSlideIds.forEach((oldId: string) => {
        requests.push({ deleteObject: { objectId: oldId } });
      });

      const updateRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      if (updateRes.ok) {
        console.log(`[Google Slides API] Successfully updated native Presentation layout content!`);
      } else {
        console.error(`[Google Slides API] batchUpdate failed:`, await updateRes.text());
      }
    } catch (err) {
      console.error(`[Google Slides API] Error during save:`, err);
    }
  };

  const getMimeTypeFromFileName = (name: string, existingMimeType?: string) => {
    const nameLower = name.toLowerCase();
    
    if (existingMimeType && (
      existingMimeType.includes('vnd.google-apps.document') ||
      existingMimeType.includes('vnd.google-apps.presentation') ||
      existingMimeType.includes('vnd.google-apps.spreadsheet')
    )) {
      return existingMimeType;
    }

    const isDoc = nameLower.endsWith('.gdoc') || nameLower.endsWith('.docx') || nameLower.endsWith('.doc') || nameLower.includes('document') || nameLower.includes('proposal') || nameLower.includes('report');
    const isSlide = nameLower.endsWith('.gslides') || nameLower.endsWith('.pptx') || nameLower.endsWith('.ppt') || nameLower.includes('presentation') || nameLower.includes('slides') || nameLower.includes('pitch') || nameLower.includes('deck');
    const isSheet = nameLower.endsWith('.gsheet') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls') || nameLower.endsWith('.csv') || nameLower.includes('spreadsheet') || nameLower.includes('sheet');

    if (isDoc) return 'application/vnd.google-apps.document';
    if (isSlide) return 'application/vnd.google-apps.presentation';
    if (isSheet) return 'application/vnd.google-apps.spreadsheet';
    
    if (nameLower.endsWith('.html') || nameLower.endsWith('.htm')) return 'text/html';
    if (nameLower.endsWith('.css')) return 'text/css';
    if (nameLower.endsWith('.js') || nameLower.endsWith('.jsx')) return 'application/javascript';
    if (nameLower.endsWith('.ts') || nameLower.endsWith('.tsx')) return 'text/typescript';
    if (nameLower.endsWith('.json')) return 'application/json';
    if (nameLower.endsWith('.md')) return 'text/markdown';
    
    return existingMimeType || 'text/plain';
  };

  const isValidDriveId = (id: any) => {
    if (!id || typeof id !== 'string') return false;
    const lower = id.toLowerCase();
    if (lower.includes('copied') || lower.includes('sandbox') || lower.includes('suggested') || lower.includes('uploaded') || lower.includes('created-') || lower.includes('ingested-') || lower.includes('local-workspace') || lower.includes('workspace-') || lower.includes('space-')) {
      return false;
    }
    return true;
  };

  const autoSaveToDrive = async (files: any[], folderId: string | null) => {
    if (!accessToken) return;
    const activeId = folderId || activeSpaceId;
    if (!isValidDriveId(activeId)) {
      console.log("[Drive Auto-Save] Active space is virtual/local. Skipping Google Drive write sync.");
      setSyncStatus('synced');
      return;
    }
    const targetFolder = activeId;

    // Filter to files that have actually been modified compared to the last successfully saved state
    const changedFiles = files.filter(f => lastSavedContentsRef.current[f.name.toLowerCase()] !== f.content);
    if (changedFiles.length === 0) {
      console.log("[Drive Auto-Save] No files changed. Skipping sync.");
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');
    try {
      const updatedFiles = [...files];
      let hasUpdates = false;

      for (let i = 0; i < changedFiles.length; i++) {
        const file = changedFiles[i];
        
        let fileId = file.driveId;
        if (!isValidDriveId(fileId)) {
          fileId = null;
        }

        if (!fileId) {
          // Robust check: query Google Drive to see if a file with this name already exists in this folder (case-insensitive query matching)
          try {
            const q = `'${targetFolder}' in parents and name = '${file.name.replace(/'/g, "\\'")}' and trashed = false`;
            const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,mimeType)`;
            const searchRes = await fetch(searchUrl, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.files && searchData.files.length > 0) {
                fileId = searchData.files[0].id;
                file.driveId = fileId;
                if (searchData.files[0].mimeType) {
                  file.mimeType = searchData.files[0].mimeType;
                }
                hasUpdates = true;
                console.log(`[Drive Auto-Save] Linked existing file ${file.name} to ID: ${fileId}`);
              }
            }
          } catch (err) {
            console.warn(`[Drive Auto-Save] Error searching for file ${file.name}:`, err);
          }
        }

        if (!fileId) {
          // File does not exist in folder yet, create it with transient rate-limiting retry
          let retries = 2;
          let success = false;
          while (retries > 0 && !success) {
            try {
              const bodyMeta: any = {
                name: file.name,
                parents: [targetFolder]
              };
              const inferredMime = getMimeTypeFromFileName(file.name, file.mimeType);
              if (inferredMime) {
                bodyMeta.mimeType = inferredMime;
                file.mimeType = inferredMime;
              }

              const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyMeta)
              });
              
              if (createRes.ok) {
                const meta = await createRes.json();
                fileId = meta.id;
                file.driveId = fileId;
                hasUpdates = true;
                success = true;
              } else if (createRes.status === 429) {
                console.warn(`[Drive Auto-Save] Rate limit hit (429) creating ${file.name}. Retrying in 1.5s...`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                retries--;
              } else {
                console.error(`Failed to create ${file.name}, status: ${createRes.status}`);
                break;
              }
            } catch (err) {
              await new Promise(resolve => setTimeout(resolve, 1500));
              retries--;
            }
          }
        }

        if (fileId) {
          const mType = getMimeTypeFromFileName(file.name, file.mimeType);
          const isNativeGoogleWorkspaceType = mType && (
            mType.includes('google-apps.document') ||
            mType.includes('google-apps.presentation') ||
            mType.includes('google-apps.spreadsheet')
          );

          if (isNativeGoogleWorkspaceType) {
            lastSavedContentsRef.current[file.name.toLowerCase()] = file.content;
            if (mType.includes('google-apps.document')) {
              const isCreatedDoc = !!(createdFromComposerFileIdsRef.current.has(fileId) ||
                                     file.createdFromComposer ||
                                     file.name.toLowerCase() === 'document.doc');
              await updateGoogleDocNative(fileId, file.content, accessToken, isCreatedDoc);
            } else if (mType.includes('google-apps.presentation')) {
              await updateGoogleSlideNative(fileId, file.content, accessToken);
            }
            continue;
          }

          // Overwrite content with transient rate-limiting retry
          let retries = 2;
          let success = false;
          while (retries > 0 && !success) {
            try {
              const saveRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': file.name.endsWith('.html') ? 'text/html' : 'text/plain'
                },
                body: file.content
              });
              
              if (saveRes.ok) {
                success = true;
                // Cache the saved content upon successful overwrite representation
                lastSavedContentsRef.current[file.name.toLowerCase()] = file.content;
                console.log(`[Drive Auto-Save] Successfully saved ${file.name} to ID ${fileId}`);
              } else if (saveRes.status === 429) {
                console.warn(`[Drive Auto-Save] Rate limit hit (429) for ${file.name}. Retrying in 1.5s...`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                retries--;
              } else {
                console.error(`Failed to save ${file.name} to Drive, status: ${saveRes.status}`);
                break;
              }
            } catch (err) {
              console.error(`Exception saving ${file.name}:`, err);
              await new Promise(resolve => setTimeout(resolve, 1500));
              retries--;
            }
          }
        }
      }

      if (hasUpdates) {
        setSandboxFiles(updatedFiles);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error("Auto-save to Drive failed:", err);
      setSyncStatus('failed');
    }
  };

  const resetChatForDirectoryItem = useCallback(() => {
    setMessages([]);
    setActiveAiSummaryTaskId(null);
    setIsAiSummarySnapped(false);
    setActiveSidebar('gemini');
  }, []);

  const handleDirectoryNavigate = useCallback(async (folderItem: any, targetPath?: string[]) => {
    if (!folderItem) return;
    const folderName = folderItem.name || (typeof folderItem === 'string' ? folderItem : '');
    const newPath = targetPath || (folderName ? [folderName] : currentPath);

    setCurrentPath(newPath);
    setSelectedFile(null); // Keep main viewport as null inspector placeholder when navigating folders
    setViewState('files');
    setIsSourcesPanelOpen(false); // Collapse context panel by default

    // Reset Gemini chat state to a blank chat for directory navigation
    resetChatForDirectoryItem();

    const folderId = folderItem.id || folderItem.driveId || folderItem.activeSpaceId;
    const pathKey = newPath.join('/');

    if (folderItem.realChildren || folderItem.children || folderItem.filesToLoad) {
      const existingChildren = folderItem.realChildren || folderItem.children || folderItem.filesToLoad;
      setFolderContentsMap(prev => ({
        ...prev,
        [pathKey]: existingChildren,
        [folderName]: existingChildren,
        ...(folderId ? { [folderId]: existingChildren } : {})
      }));
    }

    if (accessToken && folderId) {
      setLoadingFolders(prev => ({ ...prev, [pathKey]: true }));
      try {
        const q = `'${folderId}' in parents and trashed = false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=100&fields=files(id,name,mimeType,modifiedTime,size,owners)&orderBy=folder,name`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          const childItems = data.files || [];
          setFolderContentsMap(prev => ({
            ...prev,
            [folderId]: childItems,
            [pathKey]: childItems,
            [folderName]: childItems
          }));
        }
      } catch (err) {
        console.error("Failed to fetch folder children from Drive:", err);
      } finally {
        setLoadingFolders(prev => ({ ...prev, [pathKey]: false }));
      }
    }
  }, [accessToken, currentPath, resetChatForDirectoryItem]);

  const handleFileClick = async (file: any, skipSelect = false, options?: { isFromRecents?: boolean, targetChatId?: string }) => {
    setActiveProactiveTask(null);
    console.log("[DEBUG] handleFileClick called with:", {
      fileName: typeof file === 'string' ? file : file?.name || file?.filename || file?.id,
      skipSelect,
      options
    });
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    const isFromRecents = options?.isFromRecents ?? false;
    const folderId = typeof file === 'string' ? file : (file.activeSpaceId || file.id);
    if (!folderId) return;

    // Resolve targetChatId
    let targetChatId = options?.targetChatId || (typeof file === 'object' && file.chatId ? file.chatId : folderId);
    if (!targetChatId && chatModel === 'B') {
      targetChatId = `${folderId}-chat-temp`;
    } else if (!targetChatId) {
      targetChatId = folderId;
    }

    setActiveChatId(targetChatId);

    if (isHomeChatId(folderId) && targetChatId === folderId) {
      activeSpaceIdRef.current = folderId;
      setLoadedFolderId(folderId);
      setActiveSpaceId(folderId);
      setProjectName('Home Dashboard');
      setIsAiSummarySnapped(false);
      setActiveAiSummaryTaskId(null);
      setActiveSidebar('gemini');
      setSandboxFiles([]);
      setIngestedFiles([]);
      setSelectedFile(null);
      setMembers([]);
      
      const cachedChat = chatSessionsCacheRef.current[folderId];
      if (cachedChat && cachedChat.messages && !cachedChat.messages.some((m: any) => m.isProactiveReview)) {
        setMessages(cachedChat.messages);
      } else {
        try {
          const chatRes = await fetch(`/api/chats/${folderId}`);
          if (chatRes.ok) {
            const chatData = await chatRes.json();
            if (chatData && chatData.messages && !chatData.messages.some((m: any) => m.isProactiveReview)) {
              setMessages(chatData.messages);
              chatSessionsCacheRef.current[folderId] = { messages: chatData.messages };
            } else {
              setMessages([]);
              chatSessionsCacheRef.current[folderId] = { messages: [] };
            }
          } else {
            setMessages([]);
          }
        } catch (err) {
          console.error("Failed to load home chat:", err);
          setMessages([]);
        }
      }
      setViewState('home');
      return;
    }

    // Track active folder ID to prevent race conditions from delayed network responses
    activeSpaceIdRef.current = folderId;

    // Temporarily invalidate activeLoadedFolderIdRef to suspend cache writes during loading
    setLoadedFolderId(null);

    setActiveSpaceId(folderId);
    const fileName = typeof file === 'string' ? file : file.name;
    if (fileName) {
      setProjectName(fileName);
    }

    // Reset AI mode summary state whenever opening a file/folder/workspace
    setIsAiSummarySnapped(false);
    setActiveAiSummaryTaskId(null);
    setActiveSidebar('gemini');

    const cached = workspaceCacheRef.current[targetChatId] || workspaceCacheRef.current[folderId];
    const cachedChat = chatSessionsCacheRef.current[targetChatId];

    if (!isFromRecents || (!cached && !cachedChat)) {
      // Opening from directory/search navigation or cache miss starts a fresh blank chat with Gemini
      setMessages([]);
    }
    
    const matchingTask = recentTasks.find(t => t.id === targetChatId);

    if (cached) {
      // 1. Restore from cache immediately
      setIngestedFiles(cached.ingestedFiles || []);
      setSandboxFiles(cached.sandboxFiles || []);
      setEnvId(cached.envId || null);
      setSandboxUrl(cached.sandboxUrl || '');
      if (cached.projectName) {
        setProjectName(cached.projectName);
      }
      
      if (cachedChat) {
        setMessages(cachedChat.messages || []);
      } else if (isFromRecents && !targetChatId.endsWith('-temp')) {
        setMessages(cached.messages || []);
      } else {
        setMessages([]);
      }
      
      const shouldSkipSelect = skipSelect && targetChatId === folderId;
      const isParentSpaceClick = targetChatId === folderId || shouldSkipSelect;
      const taskType = matchingTask?.taskType || matchingTask?.type || '';

      if (isParentSpaceClick) {
        const canonicalTool = cached.sandboxFiles?.find((f: any) => f && f.name && (f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('/index.html')));
        const inferredTaskFile = cached.sandboxFiles?.find((f: any) => f && f.name && f.name.toLowerCase() === 'inferred_tasks.json');
        
        if (canonicalTool) {
          setSelectedFile(canonicalTool);
          setIndexFileSelected(true);
          setViewState('app');
        } else if (inferredTaskFile) {
          setSelectedFile(inferredTaskFile);
          setIndexFileSelected(false);
          setViewState('files');
        } else {
          setSelectedFile(null);
          setIndexFileSelected(false);
          setViewState(cached.sandboxFiles?.length > 0 ? 'files' : 'home');
        }
      } else if (taskType === 'site' || taskType === 'tool') {
        const toolFile = resolveArtifactForChat(cached.sandboxFiles || [], matchingTask, taskType);
        setSelectedFile(toolFile || null);
        setIndexFileSelected(!!toolFile && (toolFile.name.toLowerCase().includes('index.html') || toolFile.name.toLowerCase().endsWith('.html')));
        setViewState(toolFile ? 'app' : 'home');
      } else if (taskType === 'doc') {
        const docFile = resolveArtifactForChat(cached.sandboxFiles || [], matchingTask, taskType);
        setSelectedFile(docFile);
        setIndexFileSelected(false);
        setViewState('files');
      } else if (taskType === 'slide') {
        const slideFile = resolveArtifactForChat(cached.sandboxFiles || [], matchingTask, taskType);
        setSelectedFile(slideFile);
        setIndexFileSelected(false);
        setViewState('files');
      } else if (taskType === 'sheet') {
        const sheetFile = resolveArtifactForChat(cached.sandboxFiles || [], matchingTask, taskType);
        setSelectedFile(sheetFile);
        setIndexFileSelected(false);
        setViewState('files');
      } else if (taskType === 'inferred' || taskType === 'tracking') {
        const taskFile = resolveArtifactForChat(cached.sandboxFiles || [], matchingTask, taskType);
        setSelectedFile(taskFile || null);
        setIndexFileSelected(false);
        setViewState('files');
      } else {
        const autoSelectFile = cached.selectedFile || cached.sandboxFiles?.[0] || null;
        setSelectedFile(autoSelectFile);
        setIndexFileSelected(autoSelectFile?.name?.toLowerCase().includes('index.html') ?? false);
        setViewState(cached.viewState || (autoSelectFile?.name?.toLowerCase().includes('index.html') ? 'app' : 'files'));
      }
      cached.sandboxFiles.forEach((f: any) => {
        lastSavedContentsRef.current[f.name.toLowerCase()] = f.content || '';
      });
      const totalCount = (cached.sandboxFiles?.length || 0) + (driveFiles?.length || 0);
      setIsSourcesPanelOpen(totalCount > 0);
      
      // Allow cache updates for the newly active folder
      setLoadedFolderId(folderId);

      if (!accessToken) return;

      // 2. Fetch in background (silent sync) with debouncing to prevent multiple parallel fetches
      if (!targetChatId.endsWith('-temp')) {
        syncTimeoutRef.current = setTimeout(async () => {
          if (activeSpaceIdRef.current !== folderId) return;
          try {
            const currentCache = workspaceCacheRef.current[folderId] || cached || {
              ingestedFiles: [],
              sandboxFiles: [],
              envId: null,
              sandboxUrl: '',
              messages: [],
              projectName: '',
              selectedFile: null,
              indexFileSelected: false,
              viewState: 'app' as const
            };
            const currentCacheChat = chatSessionsCacheRef.current[targetChatId] || cachedChat || { messages: [] };

            const chatRes = await fetch(`/api/chats/${targetChatId}`);
            if (activeSpaceIdRef.current !== folderId) return;

            let latestMessages = currentCacheChat.messages || currentCache.messages || [];
            let latestEnvId = currentCache.envId;
            let latestSandboxUrl = currentCache.sandboxUrl;
            
            if (chatRes.ok) {
              const chatData = await chatRes.json();
              if (activeSpaceIdRef.current !== folderId) return;
              if (chatData) {
                setMembers(isHomeChatId(folderId) ? [] : (chatData.members || []));
                if (chatData.messages) {
                  const messagesChanged = JSON.stringify(chatData.messages) !== JSON.stringify(latestMessages);
                  if (messagesChanged) {
                    latestMessages = chatData.messages;
                    setMessages(chatData.messages);
                  }
                  if (chatData.envId) latestEnvId = chatData.envId;
                  if (chatData.sandboxUrl) latestSandboxUrl = chatData.sandboxUrl;
                }
              }
            }

            const res = await fetch('/api/ingest-context', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
              },
              body: JSON.stringify({ folderId })
            });
            if (activeSpaceIdRef.current !== folderId) return;
            
            let latestIngested = currentCache.ingestedFiles || [];
            let latestSandboxFiles = currentCache.sandboxFiles || [];

            if (res.ok) {
              const data = await res.json();
              if (activeSpaceIdRef.current !== folderId) return;
              if (data.files) {
                latestIngested = data.files;
                const filesChanged = data.files.length !== (currentCache.ingestedFiles || []).length ||
                  data.files.some((f: any, idx: number) => {
                    const cachedF = (currentCache.ingestedFiles || [])[idx];
                    return !cachedF || cachedF.id !== f.id || cachedF.content !== f.content;
                  });

                if (filesChanged) {
                  latestSandboxFiles = data.files.map((f: any, i: number) => ({
                     name: f.filename,
                     type: 'code',
                     content: f.content,
                     driveId: f.id,
                     mimeType: f.mimeType,
                     id: `ingested-file-${i}`
                  }));

                  setSandboxFiles(latestSandboxFiles);
                  latestSandboxFiles.forEach((f: any) => {
                    lastSavedContentsRef.current[f.name.toLowerCase()] = f.content || '';
                  });

                  const envIdFile = latestSandboxFiles.find((f: any) => f.name === '.env_id');
                  if (envIdFile && envIdFile.content) {
                    latestEnvId = envIdFile.content.trim();
                  }
                }
              }
            }

            if (latestEnvId !== currentCache.envId) {
              setEnvId(latestEnvId);
            }
            if (latestSandboxUrl !== currentCache.sandboxUrl) {
              setSandboxUrl(latestSandboxUrl);
            }

            // Update the cache item
            workspaceCacheRef.current[folderId] = {
              ingestedFiles: latestIngested,
              sandboxFiles: latestSandboxFiles,
              envId: latestEnvId,
              sandboxUrl: latestSandboxUrl,
              messages: latestMessages,
              projectName: currentCache.projectName || fileName,
              selectedFile: currentCache.selectedFile || null,
              indexFileSelected: currentCache.indexFileSelected || false,
              viewState: currentCache.viewState || 'app'
            };
            chatSessionsCacheRef.current[targetChatId] = {
              messages: latestMessages
            };
          } catch (err) {
            console.error("Failed background update for workspace:", err);
          }
        }, 1000);
      }
    } else if (file.filesToLoad && file.filesToLoad.length > 0 && !file.filesToLoad[0]?.content?.includes('Contents will load dynamically')) {
      setSandboxFiles(file.filesToLoad);
      const indexHTML = file.filesToLoad.find((f: any) => f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('/index.html')) || file.filesToLoad[0];
      if (!skipSelect) {
        setSelectedFile(indexHTML);
        setIndexFileSelected(indexHTML?.name?.toLowerCase().includes('index.html') ?? false);
        setViewState('app');
      } else {
        setSelectedFile(null);
        setIndexFileSelected(false);
        setViewState('files');
      }
      setLoadedFolderId(folderId);
      return;
    } else {
      // Try restoring from database chat state first
      if (!targetChatId.endsWith('-temp')) {
        try {
          const chatRes = await fetch(`/api/chats/${targetChatId}`);
          if (chatRes.ok) {
            const chatData = await chatRes.json();
            if (chatData) {
              setMembers(isHomeChatId(folderId) ? [] : (chatData.members || []));
              if (chatData.messages && isFromRecents) setMessages(chatData.messages);
              if (chatData.envId) setEnvId(chatData.envId);
              if (chatData.sandboxUrl) setSandboxUrl(chatData.sandboxUrl);
              if (chatData.projectName) setProjectName(chatData.projectName);
              
              if (chatData.sandboxFiles !== undefined) {
                setSandboxFiles(chatData.sandboxFiles);
                const chatTaskType = matchingTask?.taskType || matchingTask?.type || chatData.taskType || chatData.type || '';
                let fileToSelect: any = null;
                let nextViewState: any = 'files';

                if (chatTaskType === 'site' || chatTaskType === 'tool') {
                  fileToSelect = resolveArtifactForChat(chatData.sandboxFiles || [], { ...matchingTask, ...chatData }, chatTaskType);
                  nextViewState = fileToSelect ? 'app' : 'home';
                } else if (chatTaskType === 'doc') {
                  fileToSelect = resolveArtifactForChat(chatData.sandboxFiles || [], { ...matchingTask, ...chatData }, chatTaskType);
                  nextViewState = 'files';
                } else if (chatTaskType === 'slide') {
                  fileToSelect = resolveArtifactForChat(chatData.sandboxFiles || [], { ...matchingTask, ...chatData }, chatTaskType);
                  nextViewState = 'files';
                } else if (chatTaskType === 'sheet') {
                  fileToSelect = resolveArtifactForChat(chatData.sandboxFiles || [], { ...matchingTask, ...chatData }, chatTaskType);
                  nextViewState = 'files';
                } else if (chatTaskType === 'inferred' || chatTaskType === 'tracking') {
                  fileToSelect = resolveArtifactForChat(chatData.sandboxFiles || [], { ...matchingTask, ...chatData }, chatTaskType);
                  nextViewState = 'files';
                } else {
                  const canonicalTool = chatData.sandboxFiles.find((f: any) => f && f.name && (f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('.html')));
                  fileToSelect = canonicalTool || chatData.sandboxFiles[0] || null;
                  nextViewState = canonicalTool ? 'app' : (chatData.sandboxFiles.length > 0 ? 'files' : 'home');
                }

                if (!skipSelect && fileToSelect) {
                  setSelectedFile(fileToSelect);
                  setIndexFileSelected(fileToSelect?.name?.toLowerCase().includes('index.html') ?? false);
                  setViewState(nextViewState);
                } else {
                  setSelectedFile(null);
                  setIndexFileSelected(false);
                  setViewState(chatData.sandboxFiles.length > 0 ? 'files' : 'home');
                }
                
                workspaceCacheRef.current[folderId] = {
                  ingestedFiles: chatData.ingestedFiles || [],
                  sandboxFiles: chatData.sandboxFiles,
                  envId: chatData.envId || null,
                  sandboxUrl: chatData.sandboxUrl || '',
                  messages: chatData.messages || [],
                  projectName: chatData.projectName || fileName || projectName,
                  selectedFile: (!skipSelect && fileToSelect) ? fileToSelect : null,
                  indexFileSelected: (!skipSelect && fileToSelect) ? (fileToSelect?.name?.toLowerCase().includes('index.html') ?? false) : false,
                  viewState: (!skipSelect && fileToSelect) ? nextViewState : (chatData.sandboxFiles.length > 0 ? 'files' : 'home')
                };
                chatSessionsCacheRef.current[targetChatId] = {
                  messages: chatData.messages || []
                };
                setLoadedFolderId(folderId);
                return;
              }
            }
          }
        } catch (cErr) {
          console.warn("Failed to fetch chat data on cache miss:", cErr);
        }
      }

      if (!accessToken) return;
      // Cache miss - blocking load with ingestion spinner
      setIsIngesting(true);
      try {
        const res = await fetch('/api/ingest-context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ folderId })
        });
        if (activeSpaceIdRef.current !== folderId) return;

        const data = await res.json();
        if (activeSpaceIdRef.current !== folderId) return;

        if (data.files) {
          setIngestedFiles(data.files);
          const sandboxMapped = data.files.map((f: any, i: number) => ({
             name: f.filename,
             type: 'code',
             content: f.content,
             driveId: f.id,
             mimeType: f.mimeType,
             id: `ingested-file-${i}`
          }));
          
          sandboxMapped.forEach((f: any) => {
            lastSavedContentsRef.current[f.name.toLowerCase()] = f.content || '';
          });

          setSandboxFiles(sandboxMapped);

          let currentEnvId = null;
          const envIdFile = sandboxMapped.find((f: any) => f.name === '.env_id');
          if (envIdFile && envIdFile.content) {
            currentEnvId = envIdFile.content.trim();
          } else {
            const cachedEnv = localStorage.getItem(`folder_env_${folderId}`);
            currentEnvId = cachedEnv || null;
          }
          setEnvId(currentEnvId);

          let autoSelected = null;
          let isIdx = false;
          if (sandboxMapped.length > 0) {
            const indexHTML = sandboxMapped.find((f: any) => f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('/index.html'));
            const preferredDoc = sandboxMapped.find((f: any) => {
              const mType = (f.mimeType || '').toLowerCase();
              return mType.includes('document') || mType.includes('spreadsheet') || mType.includes('presentation') || 
                     f.name.toLowerCase().endsWith('.html') || f.name.toLowerCase().endsWith('.md');
            });
            const canonicalTool = sandboxMapped.find((f: any) => f && f.name && (f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('.html')));
            autoSelected = canonicalTool || indexHTML || preferredDoc || sandboxMapped[0];
            if (!skipSelect || canonicalTool) {
              setSelectedFile(autoSelected);
              isIdx = autoSelected.name.toLowerCase().includes('index.html');
              setIndexFileSelected(isIdx);
              setViewState('app');
            } else {
              setSelectedFile(null);
              setIndexFileSelected(false);
              setViewState('files');
            }
          } else {
            setSelectedFile(null);
            setIndexFileSelected(false);
            setViewState('files');
          }

          let currentMessages: any[] = [];
          let currentSandboxUrl = '';
          if (!targetChatId.endsWith('-temp')) {
            try {
              const chatRes = await fetch(`/api/chats/${targetChatId}`);
              if (activeSpaceIdRef.current !== folderId) return;

              if (chatRes.ok) {
                const chatData = await chatRes.json();
                if (activeSpaceIdRef.current !== folderId) return;

                if (chatData) {
                  setMembers(isHomeChatId(folderId) ? [] : (chatData.members || []));
                  if (chatData.messages) {
                    currentMessages = chatData.messages;
                    if (isFromRecents) {
                      setMessages(chatData.messages);
                    } else {
                      setMessages([]);
                    }
                  }
                  if (chatData.envId) {
                    currentEnvId = chatData.envId;
                    setEnvId(chatData.envId);
                  }
                  if (chatData.sandboxUrl) {
                    currentSandboxUrl = chatData.sandboxUrl;
                    setSandboxUrl(chatData.sandboxUrl);
                  }
                } else {
                  setMessages([]);
                }
              } else {
                setMessages([]);
              }
            } catch (chatErr) {
              console.error("Failed to fetch chat history for workspace:", chatErr);
              setMessages([]);
            }
          } else {
            setMessages([]);
          }

          const canonicalTool = sandboxMapped.find((f: any) => f && f.name && (f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('.html')));
          // Save to memory cache
          workspaceCacheRef.current[folderId] = {
            ingestedFiles: data.files,
            sandboxFiles: sandboxMapped,
            envId: currentEnvId,
            sandboxUrl: currentSandboxUrl,
            messages: currentMessages,
            projectName: file.name || projectName,
            selectedFile: (skipSelect && !canonicalTool) ? null : autoSelected,
            indexFileSelected: (skipSelect && !canonicalTool) ? false : isIdx,
            viewState: (skipSelect && !canonicalTool) ? 'files' : 'app'
          };
          chatSessionsCacheRef.current[targetChatId] = {
            messages: currentMessages
          };

          if (!skipSelect || canonicalTool) {
            setViewState('app');
          } else {
            setViewState('files');
          }
        }
      } catch (err) {
        console.error('Failed to ingest workspace:', err);
      } finally {
        if (activeSpaceIdRef.current === folderId) {
          setIsIngesting(false);
          // Enable cache writes for the active folder
          setLoadedFolderId(folderId);
        }
      }
    }
  };

  const handleSaveToDrive = async (file: any) => {
    if (!accessToken) {
      alert("No access token. Please log in.");
      return;
    }
    const matchingIngested = ingestedFiles.find(f => f.filename === file.name);
    const driveId = matchingIngested ? matchingIngested.id : file.driveId;

    if (!driveId) {
       alert("Cannot save to drive: this file is not associated with a Drive file ID.");
       return;
    }

    const mType = file.mimeType || (matchingIngested ? matchingIngested.mimeType : '');
    const isNativeGoogleWorkspaceType = mType && (
      mType.includes('google-apps.document') ||
      mType.includes('google-apps.presentation') ||
      mType.includes('google-apps.spreadsheet')
    );

    if (isNativeGoogleWorkspaceType) {
       alert(`Native Google Workspace formats (Docs/Slides) are managed in real-time on Google Drive backend.`);
       return;
    }
    
    try {
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${driveId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: file.content
      });

      if (!res.ok) {
         throw new Error("Failed to save to Drive (status " + res.status + ").");
      }
      
      // Update cache
      lastSavedContentsRef.current[file.name.toLowerCase()] = file.content;
      
      alert(`Successfully saved ${file.name} to Google Drive!`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving file.');
    }
  };

  const handleOpenInDrive = async (file: any) => {
    if (!file) return;
    const matchingIngested = ingestedFiles.find(f => f.filename === file.name);
    let driveId = file.driveId || (matchingIngested ? matchingIngested.id : (isValidDriveId(file.id) ? file.id : null));
    if (!isValidDriveId(driveId)) {
      driveId = null;
    }

    const nameLower = file.name?.toLowerCase() || '';
    const mimeLower = file.mimeType?.toLowerCase() || (matchingIngested ? matchingIngested.mimeType?.toLowerCase() : '') || '';
    let editorBaseUrl = 'https://docs.google.com/document';
    if (mimeLower.includes('spreadsheet') || nameLower.endsWith('.csv') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.gsheet')) {
      editorBaseUrl = 'https://docs.google.com/spreadsheets';
    } else if (mimeLower.includes('presentation') || nameLower.endsWith('.gslides') || nameLower.endsWith('.pptx')) {
      editorBaseUrl = 'https://docs.google.com/presentation';
    }

    if (accessToken) {
      try {
        const targetFolder = isValidDriveId(activeSpaceId) ? activeSpaceId : 'root';
        console.log(`[Open in Drive] Syncing latest content of ${file.name} to Drive (folder: ${targetFolder}) prior to opening...`);
        delete lastSavedContentsRef.current[file.name.toLowerCase()];
        await autoSaveToDrive([file], targetFolder);
        
        const updatedFile = sandboxFiles.find(f => f.name.toLowerCase() === file.name.toLowerCase()) || file;
        const newDriveId = isValidDriveId(updatedFile.driveId) ? updatedFile.driveId : (isValidDriveId(file.driveId) ? file.driveId : driveId);
        if (newDriveId) {
          window.open(`${editorBaseUrl}/d/${newDriveId}/edit`, '_blank');
        } else {
          window.open(editorBaseUrl, '_blank');
        }
      } catch (err) {
        console.error("Error creating/syncing file prior to opening in Drive:", err);
        if (driveId) {
          window.open(`${editorBaseUrl}/d/${driveId}/edit`, '_blank');
        } else {
          window.open(editorBaseUrl, '_blank');
        }
      }
    } else if (driveId) {
      window.open(`${editorBaseUrl}/d/${driveId}/edit`, '_blank');
    } else {
      window.open(editorBaseUrl, '_blank');
    }
  };

  const handleCreateArtifactApp = async (type: 'doc' | 'slide' | 'sheet' | 'pix' | 'site' | 'upload', fromPill?: boolean) => {
    if (type === 'upload') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const content = event.target?.result as string || '';
            let createdDriveId = undefined;
            if (accessToken && activeSpaceId) {
              try {
                const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    name: file.name,
                    parents: [activeSpaceId],
                    mimeType: file.type || 'text/plain'
                  })
                });
                if (createRes.ok) {
                  const meta = await createRes.json();
                  createdDriveId = meta.id;
                }
              } catch (err) {
                console.error("Failed to pre-create uploaded file on Drive:", err);
              }
            }
            const newFile = {
              name: file.name,
              type: 'code',
              content: content,
              mimeType: file.type || 'text/plain',
              driveId: createdDriveId,
              id: createdDriveId || `uploaded-${Date.now()}`
            };
            setSandboxFiles(prev => {
              const filter = prev.filter(f => f.name !== file.name);
              const combined = [...filter, newFile];
              if (accessToken && activeSpaceId) {
                autoSaveToDrive(combined, activeSpaceId);
              }
              return combined;
            });
            setSelectedFile(newFile);
            setIndexFileSelected(file.name.toLowerCase() === 'index.html');
            setViewState('files');
            setActiveSidebar('gemini');
          };
          reader.readAsText(file);
        }
      };
      fileInput.click();
      return;
    }

    let targetFolder = activeSpaceId || 'root';
    let currentSpaceName = projectName || 'New Space';
    if (activeSpaceId && activeSpaceId.startsWith('space-creation-')) {
      const newSpaceId = `space-${Date.now()}`;
      targetFolder = newSpaceId;
      setNewlyCreatedSpaceIds(prev => new Set(prev).add(newSpaceId));
      setActiveSpaceId(newSpaceId);
      setRecentTasks(prev => {
        const now = Date.now();
        const filtered = prev.filter(t => (t.id || '') !== activeSpaceId);
        return [{ id: newSpaceId, name: currentSpaceName, type: 'space', activeSpaceId: newSpaceId, updatedAt: now }, ...filtered];
      });
    }

    let name = '';
    let content = '';
    let mimeType = '';
    const isHomeContext = !activeSpaceId || activeSpaceId === 'root' || isHomeChatId(activeSpaceId);

    if (type === 'doc') {
      name = 'document.doc';
      content = `# New document\n\n## Tell me what you want to write`;
      mimeType = 'application/vnd.google-apps.document';
      if (isHomeContext) setProjectName('New Document');
      setCurrentTask('doc');
    } else if (type === 'slide') {
      name = 'presentation.gslides';
      content = '# Slide 1\n\n- ';
      mimeType = 'application/vnd.google-apps.presentation';
      if (isHomeContext) setProjectName('New Slide Deck');
      setCurrentTask('slide');
    } else if (type === 'sheet') {
      name = 'spreadsheet.gsheet';
      content = 'A,B,C,D,E';
      mimeType = 'application/vnd.google-apps.spreadsheet';
      if (isHomeContext) setProjectName('New Spreadsheet');
    } else if (type === 'pix') {
      name = 'image.png';
      content = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%233186FF;stop-opacity:1"/><stop offset="100%" style="stop-color:%23DFF1FD;stop-opacity:1"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><text x="50%" y="50%" font-family="sans-serif" font-size="32" font-weight="bold" fill="white" dominant-baseline="middle" text-anchor="middle">Ask Gemini to Generate Image</text></svg>`;
      mimeType = 'image/png';
      if (isHomeContext) setProjectName('New Image');
    } else if (type === 'site') {
      name = 'index.html';
      content = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Site Workspace</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 p-8 min-h-screen flex items-center justify-center">
  <div class="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-3xl border shadow-sm">
    <h1 class="text-3xl font-bold text-slate-950">My Web Workspace</h1>
    <p class="text-xs text-slate-500">Ask Gemini to design pages or integrate widgets.</p>
  </div>
</body>
</html>`;
      mimeType = 'text/html';
      if (isHomeContext) setProjectName('New Website');
    }

    let createdDriveId = undefined;
    if (accessToken) {
      try {
        const bodyMeta: any = {
          name: name,
          parents: [targetFolder]
        };
        if (mimeType) {
          bodyMeta.mimeType = mimeType;
        }

        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyMeta)
        });

        if (createRes.ok) {
          const meta = await createRes.json();
          createdDriveId = meta.id;
          createdFromComposerFileIdsRef.current.add(createdDriveId);
          console.log(`[Drive Backend] Created new file ${name} on Drive with ID: ${createdDriveId} in folder ${targetFolder}`);
        } else {
          console.error(`[Drive Backend] Failed to create new file ${name} on GDrive. Status: ${createRes.status}`);
        }
      } catch (err) {
        console.error(`[Drive Backend] Exception creating new file ${name} on GDrive:`, err);
      }
    }

    const newArtifact: any = {
      name,
      type: 'code',
      content,
      mimeType,
      createdFromComposer: true,
      fontFamily: type === 'doc' ? 'Google Sans' : undefined,
      isDocJourney: type === 'doc' || type === 'slide',
      id: createdDriveId || `created-artifact-${Date.now()}`
    };
    if (createdDriveId) {
      newArtifact.driveId = createdDriveId;
      createdFromComposerFileIdsRef.current.add(createdDriveId);
    }

    if (type === 'doc' || type === 'slide' || type === 'sheet') {
      lastSavedContentsRef.current[name.toLowerCase()] = content;
    }

    setSandboxFiles(prev => {
      const filter = prev.filter(f => f.name !== name);
      const combined = [...filter, newArtifact];
      if (accessToken) {
        autoSaveToDrive(combined, targetFolder);
      }
      return combined;
    });

    setDriveFiles(prev => {
      const filter = prev.filter(f => f.name !== name && (f.id || f.driveId) !== newArtifact.id);
      return [newArtifact, ...filter];
    });

    if (fromPill || type === 'doc' || type === 'slide' || type === 'site') {
      const initialMsg = [{ role: 'bot', text: type === 'doc' ? "How can I help with your doc?" : (type === 'site' ? "What custom tool would you like to build?" : "How can I help with your presentation?") }];
      setMessages(initialMsg);

      const targetChatId = `${targetFolder}-chat-${Date.now()}`;
      setActiveChatId(targetChatId);

      const chatTitle = type === 'doc' ? "New Document" : (type === 'slide' ? "New Slide Deck" : (type === 'site' ? "Custom Tool" : "New Artifact"));

      const fileIdVal = newArtifact.driveId || newArtifact.id;
      setRecentTasks(prev => {
        const now = Date.now();
        const filtered = prev.filter(t => {
          const id = typeof t === 'string' ? '' : t.id;
          return id !== targetChatId;
        });
        return [{
          id: targetChatId,
          name: currentSpaceName,
          chatName: chatTitle,
          type: type === 'site' ? 'site' : 'workspace',
          taskType: type,
          associatedFileId: fileIdVal,
          associatedFileName: name,
          activeSpaceId: targetFolder,
          messages: initialMsg,
          updatedAt: now
        }, ...filtered];
      });

      saveChatToDb(
        targetChatId,
        initialMsg,
        envId,
        sandboxUrl,
        currentSpaceName,
        [...sandboxFiles.filter(f => f.name !== name), newArtifact],
        targetFolder,
        chatTitle,
        type,
        fileIdVal,
        name
      );
    }

    setSelectedFile(newArtifact);
    setIndexFileSelected(name.toLowerCase() === 'index.html');
    setViewState('files');
    setActiveSidebar('gemini');
  };

  if (window.location.pathname === '/components') {
    return <ComponentsCatalog />;
  }

  console.log("[DEBUG] App render state:", {
    viewState,
    activeSpaceId,
    selectedFile: selectedFile?.name || null,
    isSourcesPanelOpen
  });

  return (
    <div className="w-full h-screen bg-white dark:bg-[#0B0B0C] text-slate-800 dark:text-[#E3E3E3] flex font-sans overflow-hidden relative">
      <LeftNav 
        theme={appTheme}
        isExpanded={isLeftNavExpanded}
        onToggleExpand={setIsLeftNavExpanded}
        activeView={viewState}
        onViewChange={(view) => {
          setSelectedFile(null);
          if (view === 'home') {
            setHomeJourney('search');
            setActiveAiSummaryTaskId(null);
            setActiveSidebar('gemini');
            setIsAiSummarySnapped(false);
            handleFileClick(getHomeChatId(), true); // Reset activeSpaceId to home chat ID
          } else {
            setViewState(view);
          }
        }}
        recentTasks={recentTasks}
        onRemoveTask={handleRemoveTask}
        projects={projects}
        onRemoveProject={handleRemoveProject}
        userProfile={userProfile}
        onLogout={logout}
        chatModel={chatModel}
        onChangeChatModel={(model) => {
          setChatModel(model);
          localStorage.setItem('chat-model', model);
        }}
        activeChatId={activeChatId}
        onSelectChat={async (space, chat) => {
          await handleFileClick(space, false, { isFromRecents: true, targetChatId: chat.id });
        }}
        onSelectProject={async (proj) => {
          if (typeof proj === 'object' && proj !== null) {
            if (proj.type === 'ai_summary') {
              setActiveAiSummaryTaskId(proj.id);
              setProjectName(proj.name);
              setAiSummaryMessages(proj.messages || []);
              setAiSummarySources(proj.sources || []);
              setSelectedFile(null);
              setPreviousViewState(viewState);
              setViewState('ai_summary');
              setIsAiSummarySnapped(false);
            } else {
              setIsAiSummarySnapped(false);
              setActiveSidebar('gemini');
              const hasFiles = (proj.sources?.length || proj.sandboxFiles?.length || 0) + (driveFiles?.length || 0) > 0;
              setIsSourcesPanelOpen(hasFiles);
              await handleFileClick(proj, true, { isFromRecents: true }); // skipSelect = true
            }
          }
        }}
        activeAiSummaryTaskId={activeAiSummaryTaskId}
        onSelectTask={async (task) => {
          if (typeof task === 'object' && task !== null) {
            if (task.type === 'ai_summary') {
              setActiveAiSummaryTaskId(task.id);
              setProjectName(task.name);
              setAiSummaryMessages(task.messages || []);
              setAiSummarySources(task.sources || []);
              setSelectedFile(null);
              setPreviousViewState(viewState);
              setViewState('ai_summary');
              setIsAiSummarySnapped(false);
            } else {
              setIsAiSummarySnapped(false);
              setActiveSidebar('gemini');
              const hasFiles = (task.sources?.length || task.sandboxFiles?.length || 0) + (driveFiles?.length || 0) > 0;
              setIsSourcesPanelOpen(hasFiles);
              await handleFileClick(task, true, { isFromRecents: true }); // skipSelect = true
            }
          } else {
            setIsAiSummarySnapped(false);
            setActiveSidebar('gemini');
            setProjectName(task);
            setIsSourcesPanelOpen(false);
            setViewState('files');
            setSelectedFile(null);
          }
        }}
        projectName={projectName}
        activeSpaceId={activeSpaceId}
        onCreateSpace={handleCreateSpace}
        isChatSide={viewState !== 'ai_summary' && chatDockPosition === 'side'}
      />
      {/* 2. Chat Sidebar (Docked to Side) */}
      {viewState !== 'ai_summary' && chatDockPosition === 'side' && (
        <ChatSidebar 
          messages={isAiSummarySnapped ? aiSummaryMessages : messages} 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          variant={activeSidebar || 'gemini'}
          onCreateArtifact={handleCreateArtifactApp}
          currentTask={currentTask}
          theme={appTheme}
          isAiSummarySnapped={isAiSummarySnapped}
          onUnsnapAiSummary={() => {
            setIsAiSummarySnapped(false);
            setViewState('ai_summary');
            setActiveSidebar(null);
          }}
          onSourceClick={(fileId) => {
            const matched = aiSummarySources.find(s => s.id === fileId || s.driveId === fileId);
            if (matched) {
              setSelectedFile(matched);
              setViewMode('preview');
              setViewState('files');
              resetChatForDirectoryItem();
            }
          }}
          sources={aiSummarySources}
          fileCount={sandboxFiles.length > 0 ? sandboxFiles.length : (selectedDriveFiles.length > 0 ? selectedDriveFiles.length : driveFiles.length)}
          onApplyMoves={handleApplyOrganizeMoves}
          onDoDifferently={handleDoDifferentlyOrganize}
          isOrganizingFiles={isOrganizingFiles}
          chatDockPosition={chatDockPosition}
          onChangeChatDockPosition={setChatDockPosition}
          onFinalizeSpace={handleFinalizeSpace}
          chatModel={chatModel}
          onNewChat={handleCreateNewChat}
          isLoggedIn={isLoggedIn}
          onLogin={login}
          onBypassAuth={() => setBypassAuth(true)}
          projectName={projectName}
          activeSpaceId={activeSpaceId}
          todoItems={todoItems}
          isNewSpaceCreation={activeSpaceId ? newlyCreatedSpaceIds.has(activeSpaceId) : false}
          spaceMode={activeSpaceId ? spaceModes[activeSpaceId] : undefined}
          onSelectSpaceMode={(mode) => activeSpaceId && handleSelectSpaceMode(activeSpaceId, mode)}
        />
      )}

      {/* 3. Canvas Container (Everything else) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-white dark:bg-[#1E1F22] border-t-0 border-r-0 border-b-0 border-l border-slate-200 dark:border-[#2B2D31] rounded-none p-0 z-20 shadow-[0_0_8px_4px_#F8FAFD] dark:shadow-[0_0_15px_5px_rgba(0,0,0,0.5)]">
        <CanvasHeader 
          projectName={projectName}
          viewState={viewState}
          onHomeClick={() => {
            setActiveProactiveTask(null);
            if (activeSpaceId && !isHomeChatId(activeSpaceId)) {
              setSelectedFile(null);
              setViewState('files');
              const projObj = projects.find(p => (p.id || p.activeSpaceId)?.toLowerCase() === activeSpaceId.toLowerCase()) || { id: activeSpaceId, name: projectName };
              handleFileClick(projObj, true, { isFromRecents: true, targetChatId: activeSpaceId });
            } else {
              handleFileClick(getHomeChatId(), true, { isFromRecents: true, targetChatId: getHomeChatId() });
              setHomeJourney('search');
            }
          }}
          onCloseWorkspace={() => {
            setActiveProactiveTask(null);
            if (activeSpaceId && !isHomeChatId(activeSpaceId)) {
              setSelectedFile(null);
              setViewState('files');
              const projObj = projects.find(p => (p.id || p.activeSpaceId)?.toLowerCase() === activeSpaceId.toLowerCase()) || { id: activeSpaceId, name: projectName };
              handleFileClick(projObj, true, { isFromRecents: true, targetChatId: activeSpaceId });
            } else {
              handleFileClick(getHomeChatId(), true, { isFromRecents: true, targetChatId: getHomeChatId() });
              setHomeJourney('search');
            }
          }}
          onCloseFile={() => {
            setActiveProactiveTask(null);
            setSelectedFile(null);
            if (activeSpaceId && !isHomeChatId(activeSpaceId)) {
              setViewState('files');
              const projObj = projects.find(p => (p.id || p.activeSpaceId)?.toLowerCase() === activeSpaceId.toLowerCase()) || { id: activeSpaceId, name: projectName };
              handleFileClick(projObj, true, { isFromRecents: true, targetChatId: activeSpaceId });
            } else {
              handleFileClick(getHomeChatId(), true, { isFromRecents: true, targetChatId: getHomeChatId() });
            }
          }}
          selectedFile={selectedFile}
          members={members}
          onOpenInDrive={handleOpenInDrive}
          onToggleSourcesPanel={() => setIsSourcesPanelOpen(!isSourcesPanelOpen)}
          isSourcesPanelOpen={isSourcesPanelOpen}
          peers={peers}
          theme={appTheme}
          activeProactiveTask={activeProactiveTask}
          activeSpaceId={activeSpaceId}
        />
        <div className={`flex-1 flex overflow-hidden relative ${isSourcesPanelOpen ? 'gap-0' : 'gap-4'}`}>
          
          {/* Main Viewport Content first (on the LEFT) */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative gap-4">
            <div className="flex-1 min-h-0 relative">
              {(viewState === 'home' || viewState === 'ai_summary' || viewState === 'projector' || viewState === 'app' || viewState === 'files' || selectedFile) && (
                <CanvasMain 
                  viewState={viewState} 
                  setViewState={setViewState} 
                  isLoading={isLoading} 
                  currentTask={currentTask} 
                  appTheme={appTheme} 
                  onExpand={() => setViewState('public_projector')}
                  peers={peers}
                  currentUserId={localUser?.id}
                  selectedFile={selectedFile}
                >
                  <div className={(!isIngesting && (viewState === 'home' || selectedFile?.isInferredTask || selectedFile?.name?.toLowerCase() === 'inferred_tasks.json' || ((viewState === 'files' || viewState === 'app') && !selectedFile))) ? "w-full h-full flex flex-col min-h-0" : "hidden"}>
                    <HomeLanding 
                      accessToken={accessToken} 
                      userProfile={userProfile} 
                      onLogin={() => login()} 
                      setViewState={setViewState} 
                      setSandboxFiles={setSandboxFiles} 
                      setSelectedFile={setSelectedFile} 
                      setProjectName={setProjectName}
                      handleSendMessage={handleSendMessage}
                      setActiveSpaceId={setActiveSpaceId}
                      handleSpaceIngest={handleDirectoryNavigate}
                      suggestedList={suggestedListCache}
                      setSuggestedList={setSuggestedListCache}
                      isLoadingDrive={isDriveSuggestLoading}
                      setIsLoadingDrive={setIsDriveSuggestLoading}
                      sandboxUrl={sandboxUrl}
                      setActiveSidebar={setActiveSidebar}
                      theme={appTheme}
                      journey={homeJourney}
                      onFileRemove={handleRemoveFile}
                      onCreateArtifact={handleCreateArtifactApp}
                      onResetChat={resetChatForDirectoryItem}
                      activeSpaceId={activeSpaceId}
                      projectName={projectName}
                      sandboxFiles={sandboxFiles}
                      todoItems={todoItems}
                      setTodoItems={setTodoItems}
                      isLoggedIn={isLoggedIn}
                      onBypassAuth={() => setBypassAuth(true)}
                      todoCacheRef={todoCacheRef}
                      onProactiveTaskClick={handleProactiveTaskClick}
                      spaceMode={activeSpaceId ? spaceModes[activeSpaceId] : undefined}
                      onSelectSpaceMode={(mode) => activeSpaceId && handleSelectSpaceMode(activeSpaceId, mode)}
                      selectedFile={selectedFile}
                    />
                  </div>
                  {isIngesting && (
                    <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-white dark:bg-[#1E1F22] rounded-[32px]">
                      <div className="relative z-10 flex items-center justify-center -translate-y-12">
                        <ShapeLoader size={324} />
                      </div>
                    </div>
                  )}
                  {viewState === 'ai_summary' && (
                    <AISummaryView 
                      sources={aiSummarySources}
                      messages={aiSummaryMessages}
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                      theme={appTheme}
                      onSnap={() => {
                        setIsAiSummarySnapped(true);
                        setViewState('home');
                        setActiveSidebar('gemini');
                      }}
                      onAddToProject={handleAddToProject}
                      isProject={projects.some(p => typeof p === 'object' && p !== null && p.id === activeAiSummaryTaskId)}
                      onShareProject={handleShareProject}
                      onAddSource={handleAddSourceToSummary}
                      recentFiles={driveFiles}
                      accessToken={accessToken}
                    />
                  )}
                  {(viewState === 'app' || viewState === 'files' || viewState === 'file_viewer') && selectedFile && !selectedFile?.isInferredTask && selectedFile?.name?.toLowerCase() !== 'inferred_tasks.json' && (
                    <div 
                      className="w-full h-full flex flex-col overflow-hidden min-w-0 transition-colors duration-300 bg-transparent animate-fade-in duration-200 p-4" 
                      id="canvas-unified-workspace"
                    >
                      {(((selectedFile?.name?.toLowerCase().endsWith('.html') || selectedFile?.name?.toLowerCase().endsWith('.htm')) && viewMode === 'preview') || (indexFileSelected && viewMode === 'preview')) ? (
                        <AppView 
                          sandboxUrl={sandboxUrl} 
                          files={sandboxFiles} 
                          envId={envId} 
                          projectName={projectName} 
                          onIframeRef={registerIframe}
                          selectedFile={selectedFile}
                        />
                      ) : (
                        <NativeViewer 
                          file={selectedFile} 
                          onSave={handleSaveToDrive} 
                          sandboxUrl={sandboxUrl}
                          hideHeader={true}
                          mode={viewMode}
                          onClose={() => {
                            setSelectedFile(null);
                          }}
                          theme={appTheme}
                        />
                      )}
                    </div>
                  )}
                  {viewState === 'projector' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-[#1E1F22] rounded-[32px] p-6 text-center">
                       <p className="text-gray-500 dark:text-neutral-400 mb-4">Workspace is in presentation view. Open projector overlay to interact.</p>
                       <button 
                         onClick={() => setViewState('app')}
                         className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold cursor-pointer transition-colors duration-250 border-none outline-none"
                       >
                         Open Edit Panel
                       </button>
                    </div>
                  )}
                </CanvasMain>
              )}
            </div>

            {viewState !== 'ai_summary' && chatDockPosition === 'bottom' && (
              <div 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-[600px] z-30 px-4 select-text"
                id="floating-bottom-chat"
              >
                <Composer 
                  onSend={handleSendMessage}
                  disabled={isLoading}
                  placeholder="Search, add files or tell me what you want to build..."
                  theme={appTheme}
                  onCreateArtifact={handleCreateArtifactApp}
                  layout="bottom"
                  onDockToSide={() => setChatDockPosition('side')}
                />
              </div>
            )}
          </div>

          {/* Sources panel sidebar rendered on the RIGHT */}
          <AnimatePresence>
            {isSourcesPanelOpen && (viewState === 'home' || viewState === 'app' || viewState === 'files' || viewState === 'file_viewer') && (
              <CanvasSidebar 
                files={activeSpaceId?.startsWith('space-creation-') ? spaceCreationSources : sandboxFiles}
                driveFiles={driveFiles}
                selectedFile={selectedFile}
                indexFileSelected={indexFileSelected}
                onFileSelect={async (file) => {
                  if (!file) {
                    setSelectedFile(null);
                    return;
                  }
                  if (file.type === 'folder' || (file.mimeType && file.mimeType.includes('folder'))) {
                    const folderName = file.name || file.filename || '';
                    const parts = folderName ? [folderName] : currentPath;
                    handleDirectoryNavigate(file, parts);
                  } else {
                    if (!file.content && accessToken) {
                      setIsLoading(true);
                      try {
                        const fileId = file.driveId || file.id;
                        let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
                        const mType = (file.mimeType || '').toLowerCase();
                        if (mType.includes('google-apps.document')) {
                          downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
                        } else if (mType.includes('google-apps.spreadsheet')) {
                          downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
                        }
                        
                        const isTextOrCode = mType.startsWith('text/') || 
                                             mType === 'application/json' || 
                                             mType === 'application/javascript' || 
                                             mType === 'application/x-javascript' ||
                                             mType.includes('google-apps.document') || 
                                             mType.includes('google-apps.spreadsheet');
                        
                        if (isTextOrCode) {
                          const res = await fetch(downloadUrl, {
                            headers: { Authorization: `Bearer ${accessToken}` }
                          });
                          if (res.ok) {
                            const text = await res.text();
                            file.content = text;
                            
                            if (activeSpaceId?.startsWith('space-creation-')) {
                              setSpaceCreationSources(prev => prev.map(f => f.id === file.id ? { ...f, content: text } : f));
                            } else {
                              setSandboxFiles(prev => prev.map(f => f.id === file.id ? { ...f, content: text } : f));
                              if (activeSpaceId) {
                                const cached = workspaceCacheRef.current[activeSpaceId];
                                if (cached && cached.sandboxFiles) {
                                  cached.sandboxFiles = cached.sandboxFiles.map((f: any) => f.id === file.id ? { ...f, content: text } : f);
                                }
                              }
                            }
                          }
                        } else {
                          file.content = `[Binary content / display not supported for mimeType: ${file.mimeType || 'unknown'}]`;
                        }
                      } catch (err) {
                        console.error("Failed to download file content for preview:", err);
                      } finally {
                        setIsLoading(false);
                      }
                    }
                    setSelectedFile(file);
                    setIndexFileSelected(file.name.toLowerCase() === 'index.html' || file.name.toLowerCase().endsWith('/index.html'));
                    setViewState('app');
                  }
                }}
                activeSidebar={activeSidebar}
                currentPath={currentPath}
                setCurrentPath={setCurrentPath}
                theme={appTheme}
                directoryContentsMap={directoryContentsMap}
                onDirectoryNavigate={handleDirectoryNavigate}
                loadingDirectories={loadingDirectories}
                impactSpaceId={impactSpaceId}
                animatingFileIds={animatingFileIds}
                onCloseSidebar={() => setIsSourcesPanelOpen(false)}
                forceSingleColumn={true}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Projector / Public Projector overlay mode */}
      {(viewState === 'projector' || viewState === 'public_projector') && (
        <div id="projector-overlay-viewport" className="fixed inset-0 z-40 bg-[#0B0B0C] flex flex-col font-sans overflow-hidden h-screen w-screen">
          <TopBar 
            projectName={projectName} 
            envId={envId}
            sandboxFiles={sandboxFiles}
            activeSidebar={activeSidebar}
            setActiveSidebar={setActiveSidebar}
            theme="dark"
            userProfile={userProfile}
            isPublic={viewState === 'public_projector'}
            onCloseProjector={() => setViewState(sandboxFiles.length > 0 ? 'app' : 'null')}
            syncStatus={syncStatus}
          />
          <div className="flex-1 flex overflow-hidden pb-4 pr-4 pt-4 z-10 relative">
            <LeftNav theme="dark" hideControls={true} />
            <div className="flex-1 flex min-w-0 pr-4 pl-2">
              <CanvasMain 
                viewState={viewState} 
                setViewState={setViewState} 
                isLoading={isLoading} 
                currentTask={currentTask} 
                appTheme={appTheme} 
                theme="dark"
                onExpand={viewState === 'projector' ? () => setViewState('public_projector') : undefined}
                peers={peers}
                currentUserId={localUser?.id}
                selectedFile={selectedFile}
              >
                <AppView 
                  sandboxUrl={sandboxUrl} 
                  files={sandboxFiles} 
                  envId={envId} 
                  projectName={projectName} 
                  theme="dark"
                  onIframeRef={registerIframe}
                />
              </CanvasMain>
            </div>
            {activeSidebar && (
              <ChatSidebar 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                variant={activeSidebar}
                onClose={() => setActiveSidebar(null)}
                theme="dark"
                onCreateArtifact={handleCreateArtifactApp}
                currentTask={currentTask}
                fileCount={sandboxFiles.length > 0 ? sandboxFiles.length : (selectedDriveFiles.length > 0 ? selectedDriveFiles.length : driveFiles.length)}
                onApplyMoves={handleApplyOrganizeMoves}
                onDoDifferently={handleDoDifferentlyOrganize}
                isOrganizingFiles={isOrganizingFiles}
                onFinalizeSpace={handleFinalizeSpace}
                isLoggedIn={isLoggedIn}
                onLogin={login}
                onBypassAuth={() => setBypassAuth(true)}
                projectName={projectName}
                todoItems={todoItems}
              />
            )}
          </div>
        </div>
      )}

      {/* Shared link hydration spinner */}
      {sharedLoading && (
        <div className="fixed inset-0 z-50 bg-f8fafd flex items-center justify-center overflow-hidden">
          <div className="relative z-10 flex items-center justify-center -translate-y-12">
            <ShapeLoader size={324} />
          </div>
        </div>
      )}

      {/* Gemini Agent Cursor Animation Overlay */}
      {geminiCursor.visible && (
        <div 
          className={`gemini-collab-cursor ${geminiCursor.status === 'grabbing' ? 'grabbing' : ''}`}
          style={{
            left: geminiCursor.x,
            top: geminiCursor.y
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            height="24px" 
            viewBox="0 -960 960 960" 
            width="24px" 
            style={{
              fill: appTheme === 'dark' ? '#ffffff' : '#000000',
              filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))',
              transform: geminiCursor.status === 'grabbing' ? 'scale(0.85) rotate(-12deg)' : 'none',
              transition: 'transform 150ms ease'
            }}
          >
            <path d="m147-290-57-57 132-131 57 56-132 132Zm29 170-56-56 250-250 57 56-251 250Zm384-80q-10-69-40.5-130T440-440q-49-49-110-79.5T200-560v-80l464-190q36-14 73.5-6.5T802-802q28 27 35 64.5t-7 73.5L640-200h-80ZM347-90l-57-57 132-131 57 56L347-90Zm259-237 150-367q5-14 3-27.5T746-746q-11-11-24.5-13.5T694-757L327-606q48 20 90.5 47t78.5 63q36 36 63 78.5t47 90.5ZM496-496Z"/>
          </svg>
        </div>
      )}

      {/* Flying Clone Cards Overlay */}
      {flyingClones.map(clone => (
        <div 
          key={clone.id} 
          className="gemini-flying-clone"
          style={{
            left: clone.x,
            top: clone.y
          }}
        >
          <FileIcon fileName={clone.name} mimeType={clone.mimeType} size={16} />
          <span className="text-xs font-medium truncate max-w-[120px] text-slate-800 dark:text-gray-200">
            {clone.name}
          </span>
        </div>
      ))}

      {/* Particle Burst Effects Overlay */}
      {particleBursts.map(burst => (
        <div 
          key={burst.id} 
          className="gemini-particle-burst"
          style={{
            left: burst.x - 30,
            top: burst.y - 30
          }}
        />
      ))}

    </div>
  );
}

