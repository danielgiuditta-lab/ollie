import { useState } from 'react';

export type ViewState = 'home' | 'null' | 'app' | 'files' | 'file_viewer' | 'projector' | 'public_projector' | 'ai_summary' | 'dashboard';

export function useCanvasState() {
  const [activeSidebar, setActiveSidebar] = useState<'gemini' | 'comments' | 'history' | null>('gemini');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewState, setViewState] = useState<ViewState>('home');
  const [previousViewState, setPreviousViewState] = useState<ViewState | null>(null);
  const [homeJourney, setHomeJourney] = useState<'search' | 'create'>('search');
  const [projectName, setProjectName] = useState('New');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const [indexFileSelected, setIndexFileSelected] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'file' | 'preview'>('preview');
  const [isLeftNavExpanded, setIsLeftNavExpanded] = useState(false);

  const [directoryContentsMap, setFolderContentsMap] = useState<Record<string, any[]>>({});
  const [loadingDirectories, setLoadingFolders] = useState<Record<string, boolean>>({});

  const [appTheme, setAppTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app-theme') || localStorage.getItem('manual-theme');
    if (saved === 'dark' || saved === 'light') {
      if (saved === 'dark') document.documentElement.classList.add('dark');
      return saved;
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

  return {
    activeSidebar,
    setActiveSidebar,
    currentPath,
    setCurrentPath,
    viewState,
    setViewState,
    previousViewState,
    setPreviousViewState,
    homeJourney,
    setHomeJourney,
    projectName,
    setProjectName,
    selectedFile,
    setSelectedFile,
    indexFileSelected,
    setIndexFileSelected,
    viewMode,
    setViewMode,
    isLeftNavExpanded,
    setIsLeftNavExpanded,
    directoryContentsMap,
    setFolderContentsMap,
    loadingDirectories,
    setLoadingFolders,
    appTheme,
    toggleAppTheme
  };
}
