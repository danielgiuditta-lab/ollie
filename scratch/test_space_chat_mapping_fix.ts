import React from 'react';

// Verification script for space chat artifact mapping fix
console.log("==========================================");
console.log("🧪 VERIFYING SPACE CHAT MAPPING FIX");
console.log("==========================================\n");

// Re-simulate processChatSession logic from LeftNav.tsx
function testProcessChatSession() {
  const mockProjects: any[] = [];
  const mockRecentTasks: any[] = [
    // 1. Root space session with messages (e.g. welcome message)
    {
      id: "space-1783969728791",
      chatId: "space-1783969728791",
      activeSpaceId: "space-1783969728791",
      name: "Ollie",
      chatName: "Ollie",
      type: "space",
      messages: [{ role: "bot", text: "Welcome to Ollie" }]
    },
    // 2. Child chat session 1 under Ollie
    {
      id: "space-1783969728791-chat-1",
      chatId: "space-1783969728791-chat-1",
      activeSpaceId: "space-1783969728791",
      chatName: "New Document",
      type: "doc",
      messages: [{ role: "user", text: "Create document" }]
    },
    // 3. Child chat session 2 under Ollie
    {
      id: "space-1783969728791-chat-2",
      chatId: "space-1783969728791-chat-2",
      activeSpaceId: "space-1783969728791",
      chatName: "Custom Tool",
      type: "site",
      messages: [{ role: "user", text: "Build tool" }]
    }
  ];

  const spacesMap: Record<string, {
    id: string;
    name: string;
    type: string;
    isProject: boolean;
    raw: any;
    chats: Array<{ id: string; name: string; raw: any }>;
  }> = {};

  const processChatSession = (c: any, isProject: boolean) => {
    if (!c) return;
    const chatIdVal = c.id || c.chatId;
    const spaceId = c.activeSpaceId || chatIdVal;
    if (!spaceId) return;
    const lowerId = String(spaceId).toLowerCase().trim();
    const isHomeSpace = lowerId === 'home' || lowerId === 'home_guest' || lowerId.startsWith('home_') || lowerId.startsWith('home-') || (c.name && String(c.name).trim().toLowerCase() === 'home');
    if (isHomeSpace) return;

    if (!spacesMap[spaceId]) {
      spacesMap[spaceId] = {
        id: spaceId,
        name: c.name || 'Workspace',
        type: c.type || 'workspace',
        isProject,
        raw: c,
        chats: []
      };
    } else {
      if (c.id === spaceId || c.type === 'space') {
        spacesMap[spaceId].raw = c;
        spacesMap[spaceId].name = c.name || spacesMap[spaceId].name;
        spacesMap[spaceId].type = c.type || spacesMap[spaceId].type;
      }
      if (isProject) {
        spacesMap[spaceId].isProject = true;
      }
    }

    if (c.messages && c.messages.length > 0 && chatIdVal !== spaceId) {
      const exists = spacesMap[spaceId].chats.some((item: any) => item.id === chatIdVal);
      if (!exists) {
        spacesMap[spaceId].chats.push({
          id: chatIdVal,
          name: c.chatName || `Chat ${spacesMap[spaceId].chats.length + 1}`,
          raw: c
        });
      }
    }
  };

  mockProjects.forEach(p => processChatSession(p, true));
  mockRecentTasks.forEach(t => processChatSession(t, false));

  const space = spacesMap["space-1783969728791"];
  console.log("Root Space Name:", space.name);
  console.log("Space Raw ID:", space.raw.id);
  console.log("Child Chats Count:", space.chats.length);
  console.log("Child Chats List:", space.chats.map((ch: any) => ({ id: ch.id, name: ch.name })));

  // Verifications
  const containsRootAsChild = space.chats.some((ch: any) => ch.id === "space-1783969728791");
  if (containsRootAsChild) {
    console.error("❌ ERROR: Child chats array contains root space session!");
    process.exit(1);
  } else {
    console.log("✅ SUCCESS: Root space session is NOT present in child chats array.");
  }

  if (space.chats.length !== 2) {
    console.error(`❌ ERROR: Expected 2 child chats, got ${space.chats.length}`);
    process.exit(1);
  } else {
    console.log("✅ SUCCESS: Exactly 2 child authoring chats present in space.chats.");
  }

  console.log("\n🎉 ALL CHECKS PASSED!");
}

testProcessChatSession();
