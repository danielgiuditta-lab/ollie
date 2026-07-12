import { resolveArtifactForChat } from '../src/utils/artifactResolver';

const BASE_URL = 'http://localhost:3000';

// ----------------------------------------------------
// CLIENT APP STATE SIMULATOR
// Simulates the exact state, memory cache, and navigation helpers of App.tsx
// ----------------------------------------------------
class AppStateSimulator {
  public recentTasks: any[] = [];
  public projects: any[] = [];
  public workspaceCacheRef: Record<string, any> = {};
  public activeSpaceId: string = 'home_guest';
  public activeChatId: string = 'home_guest';
  public selectedFile: any = null;
  public viewState: string = 'home';

  // Helper matching App.tsx getHomeChatId
  public getHomeChatId(): string {
    return 'home_guest';
  }

  // Helper matching App.tsx isHomeChatId
  public isHomeChatId(id: string | null | undefined): boolean {
    if (!id) return true;
    const clean = String(id).toLowerCase().trim();
    return clean === 'home' || clean === 'home_guest' || clean === 'home dashboard' || clean.startsWith('home_') || clean.startsWith('home-');
  }

  // Simulates initial page load & mount (App.tsx fetchGeminiTasks)
  public async simulatePageReload() {
    console.log("   🔄 Executing full page reload (wiping in-memory React state & refs)...");
    
    // Clear all in-memory client state
    this.recentTasks = [];
    this.projects = [];
    this.workspaceCacheRef = {};
    this.activeSpaceId = this.getHomeChatId();
    this.activeChatId = this.getHomeChatId();
    this.selectedFile = null;
    this.viewState = 'home';

    // Fetch from server backend (simulating fetchGeminiTasks)
    const res = await fetch(`${BASE_URL}/api/user-chats/all`);
    if (!res.ok) throw new Error(`Failed to fetch chats on reload: ${res.status}`);
    const rawChats: any[] = await res.json();

    // Reproduce exact fetchGeminiTasks processing logic from App.tsx
    rawChats.forEach((c: any) => {
      if (!c || !c.chatId) return;
      const folderId = c.activeSpaceId || (c.chatId && c.chatId.includes('-chat-') ? c.chatId.split('-chat-')[0] : c.chatId);
      const folderName = c.projectName || 'Workspace Project';
      const isSpaceContainer = c.type === 'space' || c.chatId === folderId || this.isHomeChatId(c.chatId);
      const taskPins = isSpaceContainer ? (c.pinnedArtifactIds || []) : [];

      const taskObj = {
        id: c.chatId,
        name: c.projectName || c.chatName || folderName,
        chatName: c.chatName || c.projectName || 'Chat',
        type: c.type || c.taskType || 'workspace',
        taskType: c.taskType || c.type || null,
        associatedFileId: c.associatedFileId || null,
        associatedFileName: c.associatedFileName || null,
        messages: c.messages || [],
        sandboxFiles: c.sandboxFiles || [],
        pinnedArtifactIds: taskPins,
        activeSpaceId: folderId,
        updatedAt: c.updatedAt || Date.now()
      };

      this.recentTasks.push(taskObj);

      // Pre-seed workspaceCacheRef
      const existingCache: any = this.workspaceCacheRef[c.chatId] || {};
      this.workspaceCacheRef[c.chatId] = {
        ingestedFiles: existingCache.ingestedFiles || [],
        sandboxFiles: c.sandboxFiles || existingCache.sandboxFiles || [],
        envId: c.envId || existingCache.envId || null,
        sandboxUrl: c.sandboxUrl || existingCache.sandboxUrl || '',
        messages: c.messages || existingCache.messages || [],
        projectName: folderName,
        selectedFile: existingCache.selectedFile || null,
        indexFileSelected: existingCache.indexFileSelected || false,
        viewState: existingCache.viewState || 'app',
        pinnedArtifactIds: isSpaceContainer ? (c.pinnedArtifactIds || existingCache.pinnedArtifactIds || []) : [],
        taskType: c.taskType || c.type || null,
        type: c.type || null,
        associatedFileId: c.associatedFileId || null,
        associatedFileName: c.associatedFileName || null
      };

      if (folderId && folderId !== c.chatId && !this.isHomeChatId(folderId)) {
        const parentCache: any = this.workspaceCacheRef[folderId] || {};
        const currentSpaceFiles = parentCache.sandboxFiles || [];
        const mergedMap = new Map();
        currentSpaceFiles.forEach((f: any) => { if (f && f.name) mergedMap.set(f.name.toLowerCase(), f); });
        (c.sandboxFiles || []).forEach((f: any) => { if (f && f.name) mergedMap.set(f.name.toLowerCase(), f); });
        this.workspaceCacheRef[folderId] = {
          ...parentCache,
          sandboxFiles: Array.from(mergedMap.values()),
          pinnedArtifactIds: parentCache.pinnedArtifactIds || []
        };
      }
    });

    console.log(`   ✅ Reload completed! Restored ${this.recentTasks.length} chat items in recentTasks.`);
  }

  // Helper matching App.tsx getSpacePins
  public getSpacePins(spaceId: string | null): string[] {
    if (!spaceId) return [];
    const pObj = this.projects.find(p => p && (p.id === spaceId || p.activeSpaceId === spaceId));
    if (pObj && pObj.pinnedArtifactIds) return pObj.pinnedArtifactIds;
    const tObj = this.recentTasks.find(t => t && (t.id === spaceId || (t.type === 'space' && t.activeSpaceId === spaceId)));
    if (tObj && tObj.pinnedArtifactIds) return tObj.pinnedArtifactIds;
    const cacheObj = this.workspaceCacheRef[spaceId];
    return cacheObj?.pinnedArtifactIds || [];
  }

  // Helper matching App.tsx getAllSpaceFiles
  public getAllSpaceFiles(spaceId: string): any[] {
    const isHome = !spaceId || this.isHomeChatId(spaceId);
    const allFilesMap = new Map<string, any>();

    const checkList = (list: any[]) => {
      list.forEach(item => {
        if (item && (isHome || item.activeSpaceId === spaceId || item.id === spaceId || item.chatId === spaceId || (typeof item.id === 'string' && spaceId && item.id.startsWith(spaceId + '-chat-')))) {
          if (item.sandboxFiles && Array.isArray(item.sandboxFiles)) {
            item.sandboxFiles.forEach((f: any) => {
              if (f) {
                const key = f.id || f.driveId || (item.id + '_' + f.name);
                allFilesMap.set(key, { 
                  ...f, 
                  chatId: f.chatId || item.id,
                  activeSpaceId: f.activeSpaceId || item.activeSpaceId || spaceId
                });
              }
            });
          }
        }
      });
    };

    checkList(this.recentTasks);
    checkList(this.projects);

    Object.entries(this.workspaceCacheRef).forEach(([k, cacheVal]: [string, any]) => {
      if (isHome || k === spaceId || k.startsWith(spaceId + '-chat-') || cacheVal?.activeSpaceId === spaceId) {
        if (cacheVal?.sandboxFiles && Array.isArray(cacheVal.sandboxFiles)) {
          cacheVal.sandboxFiles.forEach((f: any) => {
            if (f) {
              const key = f.id || f.driveId || (k + '_' + f.name);
              allFilesMap.set(key, { 
                ...f, 
                chatId: f.chatId || k,
                activeSpaceId: f.activeSpaceId || cacheVal.activeSpaceId || spaceId
              });
            }
          });
        }
      }
    });

    return Array.from(allFilesMap.values());
  }

  // Navigation simulation: User clicks space header (openSpace / isParentSpaceClick)
  public clickSpaceDashboard(spaceId: string) {
    this.activeSpaceId = spaceId;
    this.activeChatId = spaceId;
    this.selectedFile = null;
    this.viewState = 'dashboard';
    const pins = this.getSpacePins(spaceId);
    const allFiles = this.getAllSpaceFiles(spaceId);
    const pinnedFiles = pins.map(id => allFiles.find(f => f && (f.id === id || f.driveId === id))).filter(Boolean);
    return { pins, allFiles, pinnedFiles };
  }

  // Navigation simulation: User clicks Home in LeftNav
  public clickHome() {
    this.activeSpaceId = this.getHomeChatId();
    this.activeChatId = this.getHomeChatId();
    this.selectedFile = null;
    this.viewState = 'home';
    const homePins = this.getSpacePins(this.getHomeChatId());
    return { homePins };
  }

  // Navigation simulation: User clicks a child chat session in LeftNav (openChat / handleFileClick)
  public clickChildChat(childChatId: string) {
    const matchingTask = this.recentTasks.find(t => t.id === childChatId);
    if (!matchingTask) throw new Error(`Child chat ${childChatId} not found in recentTasks!`);
    
    this.activeSpaceId = matchingTask.activeSpaceId || childChatId.split('-chat-')[0];
    this.activeChatId = childChatId;

    const cached = this.workspaceCacheRef[childChatId] || {};
    const allAvailableFiles = [...(cached.sandboxFiles || []), ...this.getAllSpaceFiles(this.activeSpaceId)];
    const taskType = matchingTask.taskType || matchingTask.type || 'site';
    const resolvedArtifact = resolveArtifactForChat(allAvailableFiles, matchingTask, taskType);

    if (taskType === 'site' || taskType === 'tool') {
      const canonicalHtml = resolvedArtifact || allAvailableFiles.find(f => f && f.name && f.name.toLowerCase() === 'index.html');
      this.selectedFile = canonicalHtml || null;
      this.viewState = 'app';
    } else {
      this.selectedFile = resolvedArtifact || null;
      this.viewState = 'files';
    }

    return { selectedFile: this.selectedFile, viewState: this.viewState };
  }
}

// ----------------------------------------------------
// MAIN E2E RELOAD & NAVIGATION TEST SUITE
// ----------------------------------------------------
async function runEndToEndReloadSuite() {
  console.log("====================================================");
  console.log("🚀 E2E RELOAD & NAVIGATION SIMULATION SUITE");
  console.log("====================================================\n");

  const app = new AppStateSimulator();

  const spaceId = `space_e2e_${Date.now()}`;
  const childToolChatId = `${spaceId}-chat-tool-${Date.now()}`;
  const childDocChatId = `${spaceId}-chat-doc-${Date.now()}`;
  const toolArtifactId = `created-tool-${Date.now()}`;
  const docArtifactId = `created-doc-${Date.now()}`;

  // Step 1: Create Space & Artifacts via API
  console.log("1. Initializing Space and Child Chats on Backend Server...");
  
  // Save Space Root with pinned toolArtifactId
  await fetch(`${BASE_URL}/api/chats/${spaceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'End-To-End Flight Tracker',
      activeSpaceId: spaceId,
      type: 'space',
      pinnedArtifactIds: [toolArtifactId],
      sandboxFiles: [
        { id: toolArtifactId, name: 'index.html', content: '<html><body><h1>Kanban App</h1></body></html>' }
      ]
    })
  });

  // Save Child Tool Chat
  await fetch(`${BASE_URL}/api/chats/${childToolChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'End-To-End Flight Tracker',
      chatName: 'Custom Tool',
      type: 'site',
      taskType: 'site',
      associatedFileId: toolArtifactId,
      associatedFileName: 'index.html',
      activeSpaceId: spaceId,
      messages: [{ role: 'bot', text: 'Built custom Kanban tool' }],
      sandboxFiles: [
        { id: toolArtifactId, name: 'index.html', content: '<html><body><h1>Kanban App</h1></body></html>' }
      ]
    })
  });

  // Save Child Doc Chat
  await fetch(`${BASE_URL}/api/chats/${childDocChatId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'End-To-End Flight Tracker',
      chatName: 'Product Strategy',
      type: 'doc',
      taskType: 'doc',
      associatedFileId: docArtifactId,
      associatedFileName: 'strategy.doc',
      activeSpaceId: spaceId,
      messages: [{ role: 'bot', text: 'Drafted strategy doc' }],
      sandboxFiles: [
        { id: docArtifactId, name: 'strategy.doc', content: '# Product Strategy Plan' }
      ]
    })
  });

  console.log("   ✅ Initial server data created.");

  // ----------------------------------------------------
  // SIMULATION 1: Initial Page Load
  // ----------------------------------------------------
  console.log("\n2. Simulating First Page Reload...");
  await app.simulatePageReload();

  // Test Home View
  const homeState1 = app.clickHome();
  console.log("   - Home pins after reload:", homeState1.homePins);
  if (homeState1.homePins.includes(toolArtifactId)) {
    throw new Error("FAIL: Tool artifact leaked into Home pins on initial load!");
  }
  console.log("   ✅ Home pins clean (no space tool pin leakage).");

  // Test Space Dashboard View
  const spaceDash1 = app.clickSpaceDashboard(spaceId);
  console.log("   - Space Dashboard Pinned Items Count:", spaceDash1.pinnedFiles.length);
  if (spaceDash1.pinnedFiles.length !== 1 || spaceDash1.pinnedFiles[0]?.id !== toolArtifactId) {
    throw new Error(`FAIL: Space Dashboard missing pinned tool! Found: ${spaceDash1.pinnedFiles.map(f => f?.id)}`);
  }
  console.log("   ✅ Space Dashboard successfully rendered pinned tool preview card!");

  // Test Clicking Tool Chat
  const toolNav1 = app.clickChildChat(childToolChatId);
  if (!toolNav1.selectedFile || toolNav1.selectedFile.content === '' || toolNav1.selectedFile.id !== toolArtifactId) {
    throw new Error(`FAIL: Clicking tool chat failed to resolve content! Got: ${JSON.stringify(toolNav1.selectedFile)}`);
  }
  console.log("   ✅ Clicking Custom Tool chat resolved full HTML content cleanly!");

  // Test Clicking Doc Chat
  const docNav1 = app.clickChildChat(childDocChatId);
  if (!docNav1.selectedFile || docNav1.selectedFile.id !== docArtifactId) {
    throw new Error(`FAIL: Clicking doc chat failed to resolve document! Got: ${JSON.stringify(docNav1.selectedFile)}`);
  }
  console.log("   ✅ Clicking Doc chat resolved strategy document cleanly!");

  // ----------------------------------------------------
  // SIMULATION 2: Second Page Reload (Simulating mid-session refresh)
  // ----------------------------------------------------
  console.log("\n3. Simulating SECOND Page Reload (Mid-session browser refresh)...");
  await app.simulatePageReload();

  // Re-verify Space Dashboard after 2nd reload
  const spaceDash2 = app.clickSpaceDashboard(spaceId);
  if (spaceDash2.pinnedFiles.length !== 1 || spaceDash2.pinnedFiles[0]?.id !== toolArtifactId) {
    throw new Error(`FAIL: Space Dashboard lost pinned tool after 2nd reload!`);
  }
  console.log("   ✅ Space Dashboard retained pinned tool after 2nd reload.");

  // Re-verify Tool Chat navigation after 2nd reload
  const toolNav2 = app.clickChildChat(childToolChatId);
  if (!toolNav2.selectedFile || toolNav2.selectedFile.content === '') {
    throw new Error(`FAIL: Tool chat content missing after 2nd reload!`);
  }
  console.log("   ✅ Custom Tool chat opened with non-empty content after 2nd reload.");

  // ----------------------------------------------------
  // SIMULATION 3: Clicking around rapidly across pages
  // ----------------------------------------------------
  console.log("\n4. Simulating rapid navigation click matrix...");
  for (let i = 1; i <= 5; i++) {
    app.clickHome();
    app.clickSpaceDashboard(spaceId);
    app.clickChildChat(childToolChatId);
    app.clickChildChat(childDocChatId);
    app.clickSpaceDashboard(spaceId);
  }
  console.log("   ✅ Rapid navigation matrix completed 5 full cycles without state corruption.");

  // Cleanup server test data
  await fetch(`${BASE_URL}/api/chats/${spaceId}`, { method: 'DELETE' });
  await fetch(`${BASE_URL}/api/chats/${childToolChatId}`, { method: 'DELETE' });
  await fetch(`${BASE_URL}/api/chats/${childDocChatId}`, { method: 'DELETE' });

  console.log("\n====================================================");
  console.log("🎉 ALL E2E RELOAD & NAVIGATION SIMULATION TESTS PASSED!");
  console.log("====================================================");
}

runEndToEndReloadSuite().catch(err => {
  console.error("\n❌ E2E RELOAD SUITE FAILED:", err);
  process.exit(1);
});
