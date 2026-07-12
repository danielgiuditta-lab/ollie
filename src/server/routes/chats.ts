import { Router } from 'express';
import { getChatAsync, saveChatAsync, deleteChatAsync } from '../storage/storageService';
import fs from 'fs';
import path from 'path';

export const chatsRouter = Router();

// GET /api/chats/:chatId
chatsRouter.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const sanitizedId = chatId.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const chat = await getChatAsync(sanitizedId);
    if (chat) {
      return res.json(chat);
    }
    res.status(404).json({ error: "Chat not found" });
  } catch (error) {
    console.error("Chat read error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// POST /api/chats/:chatId
chatsRouter.post('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const sanitizedId = chatId.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const { projectName, chatName, type, taskType, associatedFileId, associatedFileName, messages, envId, activeSpaceId, sandboxUrl, userEmail, sandboxFiles, members, pinnedArtifactIds } = req.body;

    const existing = await getChatAsync(sanitizedId);

    const payload = {
      chatId: sanitizedId,
      projectName: projectName || existing?.projectName || "New Workspace",
      chatName: chatName || existing?.chatName || null,
      type: type || existing?.type || null,
      taskType: taskType || existing?.taskType || null,
      associatedFileId: associatedFileId || existing?.associatedFileId || null,
      associatedFileName: associatedFileName || existing?.associatedFileName || null,
      messages: messages !== undefined ? messages : (existing?.messages || []),
      envId: envId || existing?.envId || null,
      activeSpaceId: activeSpaceId || existing?.activeSpaceId || null,
      sandboxUrl: sandboxUrl !== undefined ? sandboxUrl : (existing?.sandboxUrl || ""),
      sandboxFiles: sandboxFiles !== undefined ? sandboxFiles : (existing?.sandboxFiles || []),
      userEmail: userEmail || existing?.userEmail || "",
      members: members !== undefined ? members : (existing?.members || []),
      pinnedArtifactIds: pinnedArtifactIds !== undefined ? pinnedArtifactIds : (existing?.pinnedArtifactIds || []),
      updatedAt: new Date().toISOString()
    };

    const result = await saveChatAsync(sanitizedId, payload);
    res.json(result);
  } catch (error) {
    console.error("Chat write error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// DELETE /api/chats/:chatId
chatsRouter.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const sanitizedId = chatId.replace(/[^a-zA-Z0-9_\-]/g, "_");
    await deleteChatAsync(sanitizedId);
    res.json({ success: true });
  } catch (error) {
    console.error("Chat delete error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/user-chats/:email
chatsRouter.get('/user-chats/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const cleanEmail = email.trim().toLowerCase();
    const chatsDir = path.join(process.cwd(), "data", "chats");
    const chats: any[] = [];

    if (fs.existsSync(chatsDir)) {
      const files = await fs.promises.readdir(chatsDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const raw = await fs.promises.readFile(path.join(chatsDir, file), "utf-8");
            const chat = JSON.parse(raw);
            if (chat.userEmail && chat.userEmail.trim().toLowerCase() === cleanEmail) {
              chats.push(chat);
            }
          } catch (e) {
            // skip invalid files
          }
        }
      }
    }
    res.json({ chats });
  } catch (error) {
    console.error("User chats fetch error:", error);
    res.status(500).json({ error: String(error) });
  }
});
