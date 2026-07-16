import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";

dotenv.config();

// Helper for fetching with a timeout to prevent slow dependencies from stalling the server node process
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 1500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Helper to convert simple JavaScript object/value to Firestore REST API value representation
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (typeof val === "boolean") {
    return { booleanValue: val };
  }
  if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(v => toFirestoreValue(v))
      }
    };
  }
  if (typeof val === "object") {
    const fields: any = {};
    for (const k of Object.keys(val)) {
      fields[k] = toFirestoreValue(val[k]);
    }
    return {
      mapValue: {
        fields
      }
    };
  }
  return { stringValue: String(val) };
}

// Helper to convert Firestore REST API value representation back to standard JavaScript object/value
function fromFirestoreValue(fval: any): any {
  if (!fval) return null;
  if ("nullValue" in fval) return null;
  if ("stringValue" in fval) return fval.stringValue;
  if ("booleanValue" in fval) return fval.booleanValue;
  if ("integerValue" in fval) return parseInt(fval.integerValue, 10);
  if ("doubleValue" in fval) return parseFloat(fval.doubleValue);
  if ("arrayValue" in fval) {
    const vals = fval.arrayValue?.values || [];
    return vals.map((v: any) => fromFirestoreValue(v));
  }
  if ("mapValue" in fval) {
    const fields = fval.mapValue?.fields || {};
    const res: any = {};
    for (const k of Object.keys(fields)) {
      res[k] = fromFirestoreValue(fields[k]);
    }
    return res;
  }
  return null;
}

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception prevented server crash:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process] Unhandled promise rejection prevented server crash:', reason);
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (process.env.ANTIGRAVITY_SIDECAR_WEB_PORT ? parseInt(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT, 10) : 3000);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  let aiClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI | null {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("[Gemini] Warning: GEMINI_API_KEY is not defined. AI interactions will be unavailable.");
        return null;
      }
      try {
        aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error("[Gemini] Failed to initialize GoogleGenAI client:", err);
        return null;
      }
    }
    return aiClient;
  }

  async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 4, delay = 2000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const status = error.status || error.statusCode || (error.response && error.response.status);
      const isRateLimitOrTransient = 
        status === 429 || 
        status === 503 || 
        status === 500 || 
        (error.message && (
          error.message.includes("503") || 
          error.message.includes("429") || 
          error.message.includes("high demand") || 
          error.message.includes("overloaded") ||
          error.message.includes("ResourceExhausted") ||
          error.message.includes("Unavailable") ||
          error.message.includes("quota")
        ));
      
      if (retries > 0 && isRateLimitOrTransient) {
        const jitter = Math.floor(Math.random() * 800);
        const actualDelay = delay + jitter;
        console.warn(`[Gemini API] Rate limit / transient error encountered (status: ${status}). Retrying in ${actualDelay}ms... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, actualDelay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  // Configure Google Cloud Firestore Client via public REST API with apiKey
  // This bypasses container IAM service account restrictions, working seamlessly for guests and anonymous users
  interface FirebaseRestConfig {
    projectId: string;
    apiKey: string;
    firestoreDatabaseId: string;
  }

  let firebaseConfig: FirebaseRestConfig | null = null;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (config.projectId && config.apiKey && config.firestoreDatabaseId) {
        firebaseConfig = {
          projectId: config.projectId,
          apiKey: config.apiKey,
          firestoreDatabaseId: config.firestoreDatabaseId,
        };
        console.log(`[Firebase] Initialized Firestore REST Client with Project ID: ${config.projectId}, Database ID: ${config.firestoreDatabaseId}`);
      }
    } else {
      console.warn("[Firebase] Warning: firebase-applet-config.json not found. Falling back to local flat-file storage.");
    }
  } catch (err) {
    console.error("[Firebase] Error loading Firebase REST Client configuration:", err);
  }

  // Helper to check file existence asynchronously
  async function fileExistsAsync(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  // JSON File-Based Database for Persisting Shared Environment Shards (for local fallback)
  const LEGACY_SHARDS_FILE = path.join(process.cwd(), "data", "shards.json");

  async function getShardAsync(slug: string): Promise<any | null> {
    const filePath = path.join(process.cwd(), "data", "shards", `${slug}.json`);
    try {
      if (await fileExistsAsync(filePath)) {
        const raw = await fs.promises.readFile(filePath, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(`Failed to read shard file for ${slug}`, e);
    }
    
    // Fallback: read legacy single-file shards database
    try {
      if (await fileExistsAsync(LEGACY_SHARDS_FILE)) {
        const rawLegacy = await fs.promises.readFile(LEGACY_SHARDS_FILE, "utf-8");
        const shards = JSON.parse(rawLegacy);
        return shards[slug] || null;
      }
    } catch (legacyErr) {
      console.error("Failed to read legacy shards database:", legacyErr);
    }
    return null;
  }

  async function saveShardAsync(slug: string, payload: any): Promise<void> {
    const filePath = path.join(process.cwd(), "data", "shards", `${slug}.json`);
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
    } catch (e) {
      console.error(`Failed to write shard file for ${slug}`, e);
    }
  }

  app.post("/api/share", async (req, res) => {
    try {
      const { envId, workspaceName, owner, ownerId, files } = req.body;
      if (!envId) {
        return res.status(400).json({ error: "envId is required to share" });
      }

      // Generate a unique short string ID (slug)
      const slug = Math.random().toString(36).substring(2, 10);
      const payload = {
        id: slug,
        envId,
        workspaceName: workspaceName || "Spaces Prototype",
        owner: owner || "Anonymous",
        ownerId: ownerId || "",
        files: files || [],
        createdAt: new Date().toISOString()
      };

      let firestoreWorked = false;
      if (firebaseConfig) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/shards/${slug}?key=${firebaseConfig.apiKey}`;
          const fields: any = {};
          for (const k of Object.keys(payload)) {
            fields[k] = toFirestoreValue((payload as any)[k]);
          }
          
          const response = await fetchWithTimeout(url, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fields }),
          });

          if (!response.ok) {
            const errMsg = await response.text();
            throw new Error(`Firestore REST API returned ${response.status}: ${errMsg}`);
          }
          console.log(`[Firebase] Saved shard "${slug}" to Cloud Firestore via REST API successfully.`);
          firestoreWorked = true;
        } catch (fErr) {
          console.error(`[Firebase] Failed to write shard to Firestore, falling back to local file storage:`, fErr);
        }
      }

      // Always write locally as a high-availability fallback
      await saveShardAsync(slug, payload);
      console.log(`[Local] Saved shard "${slug}" locally to JSON database (as master fallback).`);

      res.json({ success: true, slug });
    } catch (error) {
      console.error("Database share write error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/share/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      
      if (firebaseConfig) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/shards/${slug}?key=${firebaseConfig.apiKey}`;
          const response = await fetchWithTimeout(url);
          
          if (response.ok) {
            const docJson = await response.json();
            const fields = docJson.fields || {};
            const document: any = {};
            for (const key of Object.keys(fields)) {
              document[key] = fromFirestoreValue(fields[key]);
            }
            console.log(`[Firebase] Successfully retrieved shard "${slug}" from Firestore.`);
            return res.json(document);
          } else {
            console.warn(`[Firebase] Shard "${slug}" REST fetch returned status ${response.status}. Falling back to local.`);
          }
        } catch (fErr) {
          console.error(`[Firebase] Error reading shard "${slug}" from Firestore REST API. Falling back to local:`, fErr);
        }
      }

      // Local Fallback Retrieval
      const entry = await getShardAsync(slug);
      if (entry) {
        console.log(`[Local] Successfully retrieved shard "${slug}" from local JSON fallback database.`);
        return res.json(entry);
      }

      console.warn(`[Local/Firestore] Shard "${slug}" not found in either database.`);
      return res.status(404).json({ error: "Share workspace link expired or not found" });
    } catch (error) {
      console.error("Database share read error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Flat-File Real-time Sync State Database (File-per-record async)
  const LEGACY_SYNC_FILE = path.join(process.cwd(), "data", "sync_state.json");

  async function getSyncStateAsync(envId: string, key: string): Promise<any | null> {
    const docId = `${envId}_${key}`.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 128);
    const filePath = path.join(process.cwd(), "data", "sync", `${docId}.json`);
    try {
      if (await fileExistsAsync(filePath)) {
        const raw = await fs.promises.readFile(filePath, "utf-8");
        const entry = JSON.parse(raw);
        return entry.data !== undefined ? entry.data : null;
      }
    } catch (e) {
      console.error(`Failed to read sync state file for ${docId}`, e);
    }

    // Fallback: read legacy single-file sync states database
    try {
      if (await fileExistsAsync(LEGACY_SYNC_FILE)) {
        const rawLegacy = await fs.promises.readFile(LEGACY_SYNC_FILE, "utf-8");
        const states = JSON.parse(rawLegacy);
        const envState = states[envId] || {};
        return envState[key] !== undefined ? envState[key] : null;
      }
    } catch (legacyErr) {
      console.error("Failed to read legacy sync states database:", legacyErr);
    }
    return null;
  }

  async function saveSyncStateAsync(envId: string, key: string, data: any): Promise<void> {
    const docId = `${envId}_${key}`.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 128);
    const filePath = path.join(process.cwd(), "data", "sync", `${docId}.json`);
    const payload = {
      envId,
      key,
      data: data || {},
      updatedAt: new Date().toISOString()
    };
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
    } catch (e) {
      console.error(`Failed to write sync state file for ${docId}`, e);
    }
  }

  app.post("/api/sync/:envId/:key", async (req, res) => {
    try {
      const { envId, key } = req.params;
      const { data } = req.body;
      
      // Sanitized document ID for Firestore (only alphanumeric and underscores, max 128 characters)
      const docId = `${envId}_${key}`.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 128);
      const payload = {
        envId,
        key,
        data: data || {},
        updatedAt: new Date().toISOString()
      };

      let firestoreWorked = false;
      if (firebaseConfig) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/sync/${docId}?key=${firebaseConfig.apiKey}`;
          const fields: any = {};
          for (const k of Object.keys(payload)) {
            fields[k] = toFirestoreValue((payload as any)[k]);
          }
          
          const response = await fetchWithTimeout(url, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fields }),
          });

          if (response.ok) {
            firestoreWorked = true;
            console.log(`[Firebase] Saved sync state "${docId}" to Cloud Firestore successfully.`);
          } else {
            const text = await response.text();
            console.warn(`[Firebase] Sync post to Firestore failed with status ${response.status}: ${text}`);
          }
        } catch (fErr) {
          console.error(`[Firebase] Sync Firestore write error:`, fErr);
        }
      }

      // Always save locally as a high-availability fallback
      await saveSyncStateAsync(envId, key, data);

      res.json({ success: true, cloudSynced: firestoreWorked });
    } catch (error) {
      console.error("Sync write error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/sync/:envId/:key", async (req, res) => {
    try {
      const { envId, key } = req.params;
      const docId = `${envId}_${key}`.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 128);

      if (firebaseConfig) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/sync/${docId}?key=${firebaseConfig.apiKey}`;
          const response = await fetchWithTimeout(url);
          
          if (response.ok) {
            const docJson = await response.json();
            const fields = docJson.fields || {};
            const val = fromFirestoreValue(fields.data);
            return res.json({ data: val });
          } else if (response.status === 404) {
            console.log(`[Firebase] Sync doc "${docId}" not found in Firestore (which is expected for brand new states).`);
          } else {
            const text = await response.text();
            console.warn(`[Firebase] Sync fetch returned status ${response.status}: ${text}`);
          }
        } catch (fErr) {
          console.error(`[Firebase] Sync Firestore read error:`, fErr);
        }
      }

      // Local Fallback
      const value = await getSyncStateAsync(envId, key);
      res.json({ data: value });
    } catch (error) {
      console.error("Sync read error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Flat-File Saved Chat Persistence (File-per-record async)
  const LEGACY_CHATS_FILE = path.join(process.cwd(), "data", "chats.json");

  async function getChatAsync(chatId: string): Promise<any | null> {
    const sanitizedId = chatId.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const filePath = path.join(process.cwd(), "data", "chats", `${sanitizedId}.json`);
    try {
      if (await fileExistsAsync(filePath)) {
        const raw = await fs.promises.readFile(filePath, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(`Failed to read chat file for ${sanitizedId}`, e);
    }

    // Fallback: read legacy single-file chats database
    try {
      if (await fileExistsAsync(LEGACY_CHATS_FILE)) {
        const rawLegacy = await fs.promises.readFile(LEGACY_CHATS_FILE, "utf-8");
        const chats = JSON.parse(rawLegacy);
        return chats[sanitizedId] || null;
      }
    } catch (legacyErr) {
      console.error("Failed to read legacy chats database:", legacyErr);
    }
    return null;
  }

  async function saveChatAsync(chatId: string, payload: any): Promise<void> {
    const sanitizedId = chatId.replace(/[^a-zA-Z0-9_\-]/g, "_");
    const filePath = path.join(process.cwd(), "data", "chats", `${sanitizedId}.json`);
    try {
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
    } catch (e) {
      console.error(`Failed to write chat file for ${sanitizedId}`, e);
    }
  }

  app.get("/api/chats/:chatId", async (req, res) => {
    try {
      const { chatId } = req.params;
      const sanitizedId = chatId.replace(/[^a-zA-Z0-9_\-]/g, "_");

      if (firebaseConfig) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/chats/${sanitizedId}?key=${firebaseConfig.apiKey}`;
          const response = await fetchWithTimeout(url);
          
           if (response.ok) {
            const docJson = await response.json();
            const fields = docJson.fields || {};
            const chat: any = {};
            for (const key of Object.keys(fields)) {
              chat[key] = fromFirestoreValue(fields[key]);
            }
            chat.activeSpaceId = chat.activeSpaceId || chat.driveFolderId;
            console.log(`[Firebase] Successfully retrieved chat "${sanitizedId}" from Firestore.`);
            return res.json(chat);
          } else if (response.status === 404) {
            console.log(`[Firebase] Chat "${sanitizedId}" not found in Firestore.`);
          } else {
            const text = await response.text();
            console.warn(`[Firebase] Chat fetch returned status ${response.status}: ${text}`);
          }
        } catch (fErr) {
          console.error(`[Firebase] Chat Firestore read error:`, fErr);
        }
      }

      // Local fallback
      const chat = await getChatAsync(sanitizedId);
      if (chat) {
        chat.activeSpaceId = chat.activeSpaceId || chat.driveFolderId;
        console.log(`[Local] Successfully retrieved chat "${sanitizedId}" from local JSON fallback.`);
        return res.json(chat);
      }

      res.status(404).json({ error: "Chat not found" });
    } catch (error) {
      console.error("Chat read error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/chats/:chatId", async (req, res) => {
    try {
      const { chatId } = req.params;
      const sanitizedId = chatId.replace(/[^a-zA-Z0-9_\-]/g, "_");
      const { projectName, chatName, type, taskType, viewState, associatedFileId, associatedFileName, messages, envId, activeSpaceId, sandboxUrl, userEmail, sandboxFiles, members, pinnedArtifactIds } = req.body;

      const existingChat = await getChatAsync(sanitizedId);
      const resolvedPins = pinnedArtifactIds !== undefined 
        ? (Array.isArray(pinnedArtifactIds) ? pinnedArtifactIds : []) 
        : (existingChat?.pinnedArtifactIds !== undefined ? existingChat.pinnedArtifactIds : ['todo-card']);

      const payload = {
        chatId: sanitizedId,
        projectName: projectName || existingChat?.projectName || "New Workspace",
        chatName: chatName !== undefined ? chatName : (existingChat?.chatName || null),
        type: type !== undefined ? type : (existingChat?.type || null),
        taskType: taskType !== undefined ? taskType : (existingChat?.taskType || null),
        viewState: viewState !== undefined ? viewState : (existingChat?.viewState || null),
        associatedFileId: associatedFileId !== undefined ? associatedFileId : (existingChat?.associatedFileId || null),
        associatedFileName: associatedFileName !== undefined ? associatedFileName : (existingChat?.associatedFileName || null),
        messages: messages || existingChat?.messages || [],
        envId: envId !== undefined ? envId : (existingChat?.envId || null),
        activeSpaceId: activeSpaceId || existingChat?.activeSpaceId || null,
        sandboxUrl: sandboxUrl !== undefined ? sandboxUrl : (existingChat?.sandboxUrl || ""),
        sandboxFiles: sandboxFiles || existingChat?.sandboxFiles || [],
        userEmail: userEmail || existingChat?.userEmail || "",
        members: members || existingChat?.members || [],
        pinnedArtifactIds: resolvedPins,
        updatedAt: new Date().toISOString()
      };

      let firestoreWorked = false;
      if (firebaseConfig) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/chats/${sanitizedId}?key=${firebaseConfig.apiKey}`;
          const fields: any = {};
          for (const k of Object.keys(payload)) {
            fields[k] = toFirestoreValue((payload as any)[k]);
          }
          
          const response = await fetchWithTimeout(url, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fields }),
          });

          if (response.ok) {
            firestoreWorked = true;
            console.log(`[Firebase] Saved chat "${sanitizedId}" to Cloud Firestore successfully.`);
          } else {
            const text = await response.text();
            console.warn(`[Firebase] Chat post to Firestore failed with status ${response.status}: ${text}`);
          }
        } catch (fErr) {
          console.error(`[Firebase] Chat Firestore write error:`, fErr);
        }
      }

      // Local fallback
      await saveChatAsync(sanitizedId, payload);

      if (activeSpaceId && activeSpaceId !== sanitizedId && !String(activeSpaceId).startsWith("home")) {
        try {
          const parentPayload = (await getChatAsync(activeSpaceId)) || {
            chatId: activeSpaceId,
            projectName: projectName || "New Workspace",
            messages: [],
            sandboxFiles: []
          };
          const existingFiles = Array.isArray(parentPayload.sandboxFiles) ? parentPayload.sandboxFiles : [];
          const newFiles = Array.isArray(sandboxFiles) ? sandboxFiles : [];
          const mergedMap = new Map();
          for (const f of existingFiles) {
            if (f && f.name) mergedMap.set(f.name.toLowerCase(), f);
          }
          for (const f of newFiles) {
            if (f && f.name) mergedMap.set(f.name.toLowerCase(), f);
          }
          parentPayload.sandboxFiles = Array.from(mergedMap.values());
          parentPayload.updatedAt = new Date().toISOString();
          await saveChatAsync(activeSpaceId, parentPayload);
          console.log(`[Server Sync] Automatically synced ${newFiles.length} files from child chat ${sanitizedId} to parent space ${activeSpaceId}`);
        } catch (syncErr) {
          console.error(`[Server Sync] Failed to sync child files to parent space:`, syncErr);
        }
      }

      res.json({ success: true, cloudSynced: firestoreWorked });
    } catch (error) {
      console.error("Chat write error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/chats/:chatId", async (req, res) => {
    try {
      const { chatId } = req.params;
      const sanitizedId = chatId.replace(/[^a-zA-Z0-9_\-]/g, "_");

      let firestoreWorked = false;
      if (firebaseConfig) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/chats/${sanitizedId}?key=${firebaseConfig.apiKey}`;
          const response = await fetchWithTimeout(url, { method: "DELETE" });
          if (response.ok) {
            firestoreWorked = true;
            console.log(`[Firebase] Deleted chat "${sanitizedId}" from Cloud Firestore.`);
          }
        } catch (fErr) {
          console.error(`[Firebase] Chat Firestore delete error:`, fErr);
        }
      }

      // Delete local file fallback if present
      const chatsDir = path.join(process.cwd(), "data", "chats");
      const filePath = path.join(chatsDir, `${sanitizedId}.json`);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`[Local] Unlinked chat file "${sanitizedId}.json".`);
      }

      res.json({ success: true, cloudSynced: firestoreWorked });
    } catch (error) {
      console.error("Chat delete error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/user-chats/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      
      const getLocalChats = async () => {
        const chatsDir = path.join(process.cwd(), "data", "chats");
        if (!fs.existsSync(chatsDir)) return [];
        const files = await fs.promises.readdir(chatsDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        const readPromises = jsonFiles.map(async (f) => {
          try {
            const raw = await fs.promises.readFile(path.join(chatsDir, f), "utf-8");
            const parsed = JSON.parse(raw);
            const chatEmail = (parsed.userEmail || '').trim().toLowerCase();
            if (chatEmail === cleanEmail) {
              return parsed;
            }
          } catch (e) {
            // ignore
          }
          return null;
        });
        const results = await Promise.all(readPromises);
        return results.filter(Boolean);
      };

      if (firebaseConfig) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:runQuery?key=${firebaseConfig.apiKey}`;
          const queryBody = {
            structuredQuery: {
              from: [{ collectionId: "chats" }],
              where: {
                fieldFilter: {
                  field: { fieldPath: "userEmail" },
                  op: "EQUAL",
                  value: { stringValue: cleanEmail }
                }
              }
            }
          };

          const response = await fetchWithTimeout(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(queryBody)
          });

          if (response.ok) {
            const rawResults = await response.json();
            const chats: any[] = [];

            if (Array.isArray(rawResults)) {
              for (const item of rawResults) {
                if (item.document) {
                  const doc = item.document;
                  const fields = doc.fields || {};
                  const chat: any = {};
                  for (const key of Object.keys(fields)) {
                    chat[key] = fromFirestoreValue(fields[key]);
                  }
                  chats.push(chat);
                }
              }
            }
            console.log(`[Firebase] Retrieved ${chats.length} chats for "${email}" from Firestore.`);
            return res.json(chats);
          } else {
            const text = await response.text();
            console.warn(`[Firebase] Firestore runQuery returned status ${response.status}: ${text}. Falling back to local storage.`);
          }
        } catch (fErr) {
          console.error(`[Firebase] Firestore runQuery error, falling back to local storage:`, fErr);
        }
      }

      const localChats = await getLocalChats();
      console.log(`[Local] Retrieved ${localChats.length} chats for "${email}" from local storage fallback.`);
      res.json(localChats);
    } catch (error) {
      console.error("Error retrieving user chats:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/ingest-context", async (req, res) => {
    try {
      const folderId = req.body.activeSpaceId || req.body.spaceId || req.body.folderId;
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No authorization header" });
      }

      if (!folderId || typeof folderId !== 'string' || folderId.startsWith('space-') || folderId.startsWith('local-') || folderId === 'root') {
        return res.json({ files: [] });
      }

      const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType,size`, {
        headers: { Authorization: authHeader }
      });
      const meta = await metaRes.json();
      
      if (meta.error) {
        return res.status(400).json({ error: meta.error.message });
      }

      let filesToIngest = [];

      if (meta.mimeType === 'application/vnd.google-apps.folder') {
         const childrenRes = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,size)`, {
           headers: { Authorization: authHeader }
         });
         const children = await childrenRes.json();
         if (children.files) {
           filesToIngest = children.files.filter((f: any) => f.mimeType !== 'application/vnd.google-apps.folder');
         }
      } else {
         filesToIngest = [meta];
      }

      const ingestPromises = filesToIngest.map(async (file) => {
        const mType = (file.mimeType || '').toLowerCase();
        
        // Identify if it's text/code/doc/sheet/slide
        const isGoogleDoc = mType === 'application/vnd.google-apps.document';
        const isGoogleSheet = mType === 'application/vnd.google-apps.spreadsheet';
        const isGoogleSlide = mType === 'application/vnd.google-apps.presentation';
        const isTextOrCode = mType.startsWith('text/') || 
                             mType === 'application/json' || 
                             mType === 'application/javascript' || 
                             mType === 'application/x-javascript' ||
                             isGoogleDoc || 
                             isGoogleSheet ||
                             isGoogleSlide;
        
        const sizeNum = file.size ? parseInt(file.size, 10) : 0;
        const isTooLarge = sizeNum > 1000000; // 1MB limit
        
        if (!isTextOrCode || isTooLarge) {
          // Do not fetch content. Return metadata placeholder.
          return { 
            id: file.id, 
            filename: file.name, 
            content: isTooLarge ? `[File is too large to display: ${(sizeNum / 1024 / 1024).toFixed(2)} MB]` : '', 
            mimeType: file.mimeType 
          };
        }

        let downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        if (isGoogleDoc || isGoogleSlide) {
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
        } else if (isGoogleSheet) {
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
        }

        try {
          const contentRes = await fetch(downloadUrl, {
            headers: { Authorization: authHeader }
          });
          if (contentRes.ok) {
            const text = await contentRes.text();
            return { id: file.id, filename: file.name, content: text, mimeType: file.mimeType };
          } else {
            console.warn(`Failed to download content for ${file.name}, status: ${contentRes.status}`);
            return { id: file.id, filename: file.name, content: '', mimeType: file.mimeType };
          }
        } catch (dlErr) {
          console.warn(`Error fetching content for ${file.name}:`, dlErr);
          return { id: file.id, filename: file.name, content: '', mimeType: file.mimeType };
        }
      });
      const ingestedResults = await Promise.all(ingestPromises);
      const ingested = ingestedResults.filter(Boolean);

      res.json({ files: ingested });
    } catch (error) {
      console.error("Ingest error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/mock-inferred-tasks", async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "data", "mock_inferred_tasks.json");
      if (await fileExistsAsync(filePath)) {
        const raw = await fs.promises.readFile(filePath, "utf-8");
        return res.json(JSON.parse(raw));
      }
      return res.json([]);
    } catch (err) {
      console.error("Error reading mock inferred tasks file:", err);
      return res.status(500).json({ error: String(err) });
    }
  });

  const digestCacheMap = new Map<string, { data: any; timestamp: number }>();
  const DIGEST_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

  app.get("/api/workspace-digest", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No authorization header" });
      }

      const cacheKey = authHeader.trim();
      const now = Date.now();
      const forceRefresh = req.query.refresh === 'true';
      const cachedEntry = digestCacheMap.get(cacheKey);

      if (!forceRefresh && cachedEntry && (now - cachedEntry.timestamp < DIGEST_CACHE_TTL_MS)) {
        console.log(`[Digest] Serving cached workspace digest for user token (age: ${Math.round((now - cachedEntry.timestamp)/1000)}s)`);
        return res.json(cachedEntry.data);
      }

      const headers = { Authorization: authHeader };
      const twoDaysAgoStr = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      let emails: any[] = [];
      let chats: any[] = [];
      let comments: any[] = [];

      const fetchEmails = async () => {
        try {
          const gmailListUrl = `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=5`;
          const gmailListRes = await fetchWithTimeout(gmailListUrl, { headers }, 2500);
          if (gmailListRes.ok) {
            const listData = await gmailListRes.json();
            const threads = listData.threads || [];
            const detailPromises = threads.map(async (t: any) => {
              try {
                const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}`;
                const detailRes = await fetchWithTimeout(detailUrl, { headers }, 2500);
                if (detailRes.ok) {
                  const detail = await detailRes.json();
                  const lastMsg = detail.messages?.[detail.messages.length - 1];
                  const headersList = lastMsg?.payload?.headers || [];
                  const subject = headersList.find((h: any) => h.name === 'Subject' || h.name === 'subject')?.value || 'No Subject';
                  const from = headersList.find((h: any) => h.name === 'From' || h.name === 'from')?.value || 'Unknown Sender';
                  const date = headersList.find((h: any) => h.name === 'Date' || h.name === 'date')?.value || '';
                  return {
                    id: t.id,
                    subject,
                    from,
                    date,
                    snippet: lastMsg?.snippet || t.snippet || ''
                  };
                }
              } catch (err) {
                console.warn(`Failed to fetch gmail thread detail for ${t.id}:`, err);
              }
              return null;
            });
            const detailsResolved = await Promise.all(detailPromises);
            return detailsResolved.filter(Boolean);
          } else {
            console.warn(`Gmail API returned status ${gmailListRes.status} during list`);
          }
        } catch (err) {
          console.warn("Gmail integration fetch failed:", err);
        }
        return [];
      };

      const fetchChats = async () => {
        try {
          const chatUrl = `https://chat.googleapis.com/v1/spaces/-/messages:search`;
          const chatRes = await fetchWithTimeout(chatUrl, {
            method: "POST",
            headers: {
              ...headers,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              filter: `createTime >= "${twoDaysAgoStr}"`
            })
          }, 2500);
          if (chatRes.ok) {
            const chatData = await chatRes.json();
            const messages = chatData.messages || [];
            return messages.slice(0, 15).map((m: any) => ({
              text: m.text,
              createTime: m.createTime,
              sender: m.sender?.displayName || 'Unknown',
              space: m.space?.displayName || m.space?.name || 'Direct Message'
            }));
          } else {
            console.warn(`Google Chat API returned status ${chatRes.status} during search`);
          }
        } catch (err) {
          console.warn("Google Chat integration fetch failed:", err);
        }
        return [];
      };

      const fetchComments = async () => {
        try {
          const driveQuery = `modifiedTime > '${sevenDaysAgoStr}' and trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.presentation')`;
          const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&pageSize=8&fields=files(id,name,mimeType,modifiedTime)`;
          const driveRes = await fetchWithTimeout(driveUrl, { headers }, 2500);
          if (driveRes.ok) {
            const driveData = await driveRes.json();
            const files = driveData.files || [];
            const commentPromises = files.map(async (file: any) => {
              try {
                const commentsUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/comments?fields=comments(id,content,author(displayName,emailAddress),createdTime,resolved,replies)`;
                const commentsRes = await fetchWithTimeout(commentsUrl, { headers }, 2500);
                if (commentsRes.ok) {
                  const commentData = await commentsRes.json();
                  const unresolved = (commentData.comments || []).filter((c: any) => !c.resolved);
                  if (unresolved.length > 0) {
                    return {
                      fileId: file.id,
                      fileName: file.name,
                      mimeType: file.mimeType,
                      comments: unresolved.map((c: any) => ({
                        content: c.content,
                        author: c.author?.displayName || 'Unknown',
                        createdTime: c.createdTime,
                        replies: (c.replies || []).map((r: any) => ({
                          content: r.content,
                          author: r.author?.displayName || 'Unknown'
                        }))
                      }))
                    };
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch comments for file ${file.name}:`, err);
              }
              return null;
            });
            const commentsResolved = await Promise.all(commentPromises);
            return commentsResolved.filter(Boolean);
          } else {
            console.warn(`Drive API returned status ${driveRes.status} during list`);
          }
        } catch (err) {
          console.warn("Drive Comments integration fetch failed:", err);
        }
        return [];
      };

      [emails, chats, comments] = await Promise.all([fetchEmails(), fetchChats(), fetchComments()]);

      let recentFiles: any[] = [];
      const hasData = emails.length > 0 || chats.length > 0 || comments.length > 0;
      if (!hasData) {
        try {
          const driveQuery = `trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.presentation')`;
          const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&pageSize=8&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,owners)`;
          const driveRes = await fetchWithTimeout(driveUrl, { headers }, 2500);
          if (driveRes.ok) {
            const driveData = await driveRes.json();
            recentFiles = driveData.files || [];
          }
        } catch (e) {
          console.warn("Failed to fetch recent files fallback for digest:", e);
        }
      }

      if (!hasData && recentFiles.length === 0) {
        return res.json({
          summary: "No recent updates or actionable items found in your Google Workspace.",
          immediateActions: [],
          followUps: [],
          updates: []
        });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(550).json({ error: "Gemini API key is not configured on the server." });
      }

      const emailsBlock = emails.length > 0
        ? `--- RECENT EMAILS ---\n` + emails.map(e => `ID: ${e.id}\nFrom: ${e.from}\nSubject: ${e.subject}\nSnippet: ${e.snippet}\nDate: ${e.date}`).join('\n\n')
        : '';
      const chatsBlock = chats.length > 0
        ? `\n--- RECENT CHAT MESSAGES ---\n` + chats.map(c => `Space: ${c.space}\nSender: ${c.sender}\nMessage: ${c.text}\nTime: ${c.createTime}`).join('\n\n')
        : '';
      const commentsBlock = comments.length > 0
        ? `\n--- ACTIVE COMMENTS IN DOCS/SLIDES/SHEETS ---\n` + comments.map(doc => `File: "${doc.fileName}"\n` + doc.comments.map((c: any) => `- Comment by ${c.author}: "${c.content}"\n  Replies:\n` + (c.replies.map((r: any) => `    * Reply by ${r.author}: "${r.content}"`).join('\n') || '    (None)')).join('\n')).join('\n\n')
        : '';

      const filesBlock = recentFiles.length > 0
        ? `\n--- RECENT USER GOOGLE DRIVE FILES (Synthesize proactive tasks for these files) ---\n` + recentFiles.map(f => `File Title: "${f.name}" (Drive ID: ${f.id}, MimeType: ${f.mimeType})`).join('\n\n')
        : '';

      const promptText = `You are a helpful proactive AI coding assistant. Synthesize a structured 'Today's Agenda & Action Plan' based on the following Google Workspace activity log and recent Drive files:
${emailsBlock}
${chatsBlock}
${commentsBlock}
${filesBlock}

Provide the response as a JSON object matching the following structure:
{
  "summary": "1-sentence overview of today's work.",
  "immediateActions": [
    {
      "id": "string",
      "title": "Task title in first-person ('I...') as if the agent completed the action (e.g., I addressed Miriam's comment on your post)",
      "titleDone": "Completed task title in first-person ('I...') (e.g., I addressed Miriam's comment on your post)",
      "description": "Task description in first-person ('I...') as if the agent completed the action (e.g., I replied to Miriam's comment and updated branding.doc for your review)",
      "descriptionDone": "Completed description in first-person ('I...') (e.g., I replied to Miriam's comment and updated branding.doc for your review)",
      "source": "Details about source (e.g., Email from Sarah / Comment in branding.doc)",
      "action": "Exact action completed in first-person ('I...') (e.g., I replied to Miriam's comment and updated branding.doc for your review)",
      "type": "email" | "chat" | "comment"
    }
  ],
  "followUps": [
    {
      "id": "string",
      "title": "Task title in first-person ('I...')...",
      "titleDone": "Completed task title in first-person ('I...')...",
      "description": "Task description in first-person ('I...')...",
      "descriptionDone": "Completed description in first-person ('I...')...",
      "source": "Details about source...",
      "action": "Exact action completed in first-person ('I...')...",
      "type": "email" | "chat" | "comment"
    }
  ],
  "updates": [
    {
      "id": "string",
      "description": "General update info written in first-person ('I...')...",
      "source": "Details about source...",
      "type": "email" | "chat" | "comment"
    }
  ]
}

Ensure all IDs are unique. CRITICAL: All task titles, descriptions, and actions MUST be phrased from the agent's first-person perspective ('I...') as if the agent has already completed or addressed the action on behalf of the user (e.g., instead of 'Miriam comments on a post', output 'I addressed Miriam's comment on your post'). Keep tasks concise and actionable. Return ONLY the raw JSON object.`;

      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: { responseMimeType: "application/json" }
      }));

      const text = response.text || "{}";
      const parsedData = JSON.parse(text);
      digestCacheMap.set(cacheKey, { data: parsedData, timestamp: Date.now() });
      res.json(parsedData);
    } catch (error) {
      console.error("Workspace digest synthesis error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/proactive-draft", async (req, res) => {
    try {
      const { task, originalContent } = req.body;
      if (!task) {
        return res.status(400).json({ error: "Task object is required" });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(550).json({ error: "Gemini API key is not configured on the server." });
      }

      const isEmailOrCal = task.type === 'email' || 
                           (task.source && task.source.toLowerCase().includes('email')) || 
                           (task.title && (task.title.toLowerCase().includes('email') || task.title.toLowerCase().includes('cal') || task.title.toLowerCase().includes('invite')));

      let promptText = "";
      if (isEmailOrCal) {
        promptText = `You are an AI assistant proactively drafting communication updates based on a workspace task.
Task title: ${task.title || ''}
Description: ${task.description || ''}
Source: ${task.source || ''}
Action: ${task.action || ''}

Synthesize a structured draft for this communication. Output ONLY a raw JSON object matching this schema:
{
  "draftType": "${task.title?.toLowerCase().includes('cal') ? 'calendar' : 'email'}",
  "emailDraft": { "to": "recipient@example.com", "subject": "Subject line", "body": "Body text written in professional tone" },
  "calDraft": { "eventId": "evt_${Date.now()}", "title": "Meeting Title", "proposedTime": "2026-07-10T15:00:00Z", "agenda": "Updated discussion points and agenda items" },
  "summaryOfChanges": "Brief explanation of what was prepared"
}`;
      } else {
        promptText = `You are an AI assistant proactively drafting edits to a Google Workspace file based on user feedback or comments.
Task title: ${task.title || ''}
Feedback/Comment: ${task.description || task.action || ''}
File name: ${task.sourceName || task.workspace || 'document'}
Original file content:
${originalContent || '(No initial content provided - synthesize an appropriate high-fidelity document, spreadsheet CSV, or slide markdown structure with the requested changes already applied)'}

Please generate an updated version of the file content incorporating the requested feedback/changes, and provide a short summary of what you changed. Output ONLY a raw JSON object matching this schema:
{
  "draftType": "file_edit",
  "draftContent": "The entire updated content of the file (markdown for doc/slides, CSV for sheet)",
  "summaryOfChanges": "Brief 1-2 sentence summary of diffs/edits made (e.g., Removed legacy pricing tier B per Miriam's comment)"
}`;
      }

      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: { responseMimeType: "application/json" }
      }));

      const rawText = (response.text || "{}").trim();
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
      try {
        res.json(JSON.parse(cleanJson));
      } catch (pErr) {
        console.warn("JSON parse fallback in proactive-draft:", pErr);
        res.json({
          draftType: isEmailOrCal ? "email" : "file_edit",
          draftContent: cleanJson,
          summaryOfChanges: task.descriptionDone || task.description || "Synthesized proactive draft updates."
        });
      }
    } catch (error) {
      console.error("Proactive draft synthesis error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/space-creation-rag", async (req, res) => {
    try {
      const { prompt, teamMembers } = req.body;
      const authHeader = req.headers.authorization;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(550).json({ error: "Gemini API key is not configured on the server." });
      }

      const isValidAuth = !!(authHeader && !authHeader.includes("null") && !authHeader.includes("undefined"));

      let files: any[] = [];
      let driveQuery = "trashed = false";

      if (isValidAuth) {
        try {
          const cleanPrompt = prompt.toLowerCase().trim();
          const stopWords = new Set(["tell", "me", "about", "show", "open", "give", "find", "search", "a", "the", "in", "my", "of", "and", "to", "for", "with", "on", "at", "by", "from", "please", "can", "you"]);
          const words = cleanPrompt.split(/\s+/).map((w: string) => w.replace(/[^a-zA-Z0-9_\-]/g, '')).filter((w: string) => w && w.length > 2 && !stopWords.has(w));
          
          if (words.length > 0) {
            const keywordFilters = words.map((w: string) => `(name contains '${w.replace(/'/g, "\\'")}' or fullText contains '${w.replace(/'/g, "\\'")}')`).join(" and ");
            driveQuery = `${keywordFilters} and trashed = false`;
          } else {
            driveQuery = `name contains '${cleanPrompt.replace(/'/g, "\\'")}' and trashed = false`;
          }

          const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&pageSize=10&fields=files(id,name,mimeType,modifiedTime,size,description,owners)`;
          const listRes = await fetch(listUrl, { headers: { Authorization: authHeader } });
          if (listRes.ok) {
            const listData = await listRes.json();
            files = listData.files || [];
          } else {
            const errText = await listRes.text();
            console.warn(`[Space RAG] Drive list API returned status ${listRes.status}: ${errText}`);
          }
        } catch (driveErr) {
          console.error("[Space RAG] Error querying Google Drive API:", driveErr);
        }
      }

      if (!isValidAuth || files.length === 0) {
        const mockTrustSafetyFiles = [
          {
            id: "client_policy_issues_tracker.doc",
            name: "client_policy_issues_tracker.doc",
            mimeType: "application/vnd.google-apps.document",
            content: "# Client Trust & Safety Policy Issues Log\n\n**Author:** Elena Vance (Trust & Safety Lead Consultant) & David Ross (Head of T&S)\n\n### Executive Summary\nCentralized intake log tracking active Trust & Safety issues, jailbreak escapes, content moderation escalations, and fraud vulnerabilities reported across advisory clients.\n\n### Key Intake Benchmarks\n1. **Policy Issue Categorization**: Tag issues by risk domain (AI Safety, Content Moderation, Fraud Ops, Regulatory Compliance).\n2. **Triage SLA Target**: Severity 1 safety issues evaluated within < 15 minutes.\n3. **Remediation SLAs**: Mitigate high-risk policy escapes within 48 hours of intake."
          },
          {
            id: "policy_issue_triage_framework.gdoc",
            name: "policy_issue_triage_framework.gdoc",
            mimeType: "application/vnd.google-apps.document",
            content: "# Policy Issue Triage & Escalation SOP\n\n**Author:** Priya Patel (Policy & Moderation PM) & Dr. Marcus Thorne (Staff AI Safety Engineer)\n\n### Core Objective\nEstablish standard triage procedures for assessing client safety policy breaches, prompt injection vectors, and moderation classifier bypasses.\n\n### Strategic Directives\n1. **Severity 1 (Critical)**: Active CSAM hash errors, zero-day LLM jailbreak escapes, or major ATO credential attacks.\n2. **Severity 2 (High)**: Harassment classifier bypasses or unhandled toxicity vectors.\n3. **Severity 3 (Medium)**: DSA transparency reporting gaps or user appeal queue backlogs."
          },
          {
            id: "cross_client_policy_issues_matrix.csv",
            name: "cross_client_policy_issues_matrix.csv",
            mimeType: "text/csv",
            content: "Issue ID,Client Platform,Policy Category,Reported Date,Severity,Assigned Lead,Status\nISSUE-101,Aegis AI,LLM Jailbreak Escape,2026-07-14,High,Elena Vance,Mitigation Testing\nISSUE-102,Veritas Social,Harassment Classifier Bypass,2026-07-15,Medium,Priya Patel,Model Retrained\nISSUE-103,Nexus Pay,Credential Stuffing ATO Spike,2026-07-12,High,Rachel Chang,Step-Up Auth Enforced\nISSUE-104,Veritas Social,CSAM PhotoDNA Hash Sync Discrepancy,2026-07-13,Critical,David Ross,Resolved\nISSUE-105,Aegis AI,EU DSA Transparency Audit,2026-07-10,Medium,Sarah Lin,Drafting Report"
          },
          {
            id: "client_policy_issues_deck.gslides",
            name: "client_policy_issues_deck.gslides",
            mimeType: "application/vnd.google-apps.presentation",
            content: "# Client Trust & Safety Policy Issues — Executive Synthesis\n\n> **Cross-Client Safety Telemetry**: Tracking policy issues, AI red teaming escapes, and moderation SLAs across startup platforms.\n\n- **Client Satisfaction Target**: Maintain 100% policy resolution SLA compliance across all advisory startups.\n- **Risk Mitigations**: 100% of high-severity prompt injection escapes and moderation bypasses resolved.\n\n---\n\n# Key Milestones & Advisory Roadmap\n\n## Client Policy Issues Resolution\n\n- **AI Red Teaming Escapes**: Rapid patch deployment and neural classifier fine-tuning.\n- **Moderation SLA Backlog**: Automated escalation queue routing and PhotoDNA hash synchronization.\n- **Regulatory Audits**: Biannual DSA transparency reports and out-of-court dispute integration."
          }
        ];

        const mockTrustSafetyPeople = [
          { name: "Elena Vance", email: "elena_vance@example.com", avatar: "/people/sarah_lin.jpg" },
          { name: "David Ross", email: "david_ross@example.com", avatar: "/people/david.jpg" },
          { name: "Priya Patel", email: "priya_patel@example.com", avatar: "/people/rachel_chang.jpg" },
          { name: "Dr. Marcus Thorne", email: "dr_marcus_thorne@example.com", avatar: "/people/dr_marcus_thorne.jpg" },
          { name: "Rachel Chang", email: "rachel_chang@example.com", avatar: "/people/david.jpg" }
        ];

        return res.json({
          files: mockTrustSafetyFiles,
          suggestedPeople: mockTrustSafetyPeople,
          explanation: `Found 4 relevant Trust & Safety policy specs and client issue governance documents matching the policy issues tracking domain.`
        });
      }

      // Extract all owners from fetched files metadata directly
      const allExtractedOwners: any[] = [];
      files.forEach(f => {
        if (f.owners) {
          f.owners.forEach((o: any) => {
            if (o.emailAddress && !allExtractedOwners.some(x => x.email === o.emailAddress)) {
              allExtractedOwners.push({
                name: o.displayName || o.emailAddress.split('@')[0],
                email: o.emailAddress,
                avatar: o.photoLink || ""
              });
            }
          });
        }
      });

      // Combine potential team members and extracted owners
      const allPossibleMembers = [...(teamMembers || [])];
      allExtractedOwners.forEach(o => {
        if (!allPossibleMembers.some(m => m.email === o.email)) {
          allPossibleMembers.push(o);
        }
      });

      // Format context for Gemini using file metadata (avoiding slow content downloads)
      const filesContextBlock = files.length > 0
        ? files.map(f => `--- FILE: ${f.name} (ID: ${f.id})\nDescription: ${f.description || 'No description'}\nOwners: ${JSON.stringify(f.owners || [])}\n--- END ---`).join('\n\n')
        : `No relevant Google Drive files were found.`;

      // Select members based on retrieved context files
      const finalPrompt = `You are an expert AI project assistant. We are setting up a new shared Space/folder for a project/topic: "${prompt}".
We searched Google Drive for relevant files and got the following files and metadata:

${filesContextBlock}

Here is the list of all potential team members:
${JSON.stringify(allPossibleMembers)}

Your task:
1. Identify which team members from the potential list are relevant to this project/topic or the retrieved files (e.g. they are mentioned in the files, are owners of the files, or their role/name aligns with the project domain).
2. Select up to 4 most relevant suggested people.
3. Output your response STRICTLY as a JSON object with this exact format:
{
  "suggestedEmails": ["email1@example.com", "email2@example.com"],
  "explanation": "Short summary of why these files and people are recommended for the space."
}
Do not include any markdown formatting, code block wrappers (like \`\`\`json), or extra text outside the JSON object.`;

      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: finalPrompt,
        config: { responseMimeType: "application/json" }
      }));

      const responseText = response.text || "{}";
      let result = { suggestedEmails: [] as string[], explanation: "" };
      try {
        result = JSON.parse(responseText);
      } catch (jsonErr) {
        console.warn("[Space RAG] Failed to parse Gemini JSON output:", responseText);
      }

      const suggestedPeople = (result.suggestedEmails || [])
        .map((email: string) => allPossibleMembers.find(m => m.email.toLowerCase() === email.toLowerCase()))
        .filter(Boolean);

      const filesToDownload = files.slice(0, 5);
      res.json({
        files: filesToDownload.map(f => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          modifiedTime: f.modifiedTime,
          size: f.size
        })),
        suggestedPeople,
        explanation: result.explanation || `Suggested based on search query matching files for "${prompt}".`
      });

    } catch (error) {
      console.error("Space RAG error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/ai-summary", async (req, res) => {
    try {
      const { prompt, contextFileIds, history } = req.body;
      const authHeader = req.headers.authorization;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getGenAI();
      if (!ai) {
        return res.status(550).json({ error: "Gemini API key is not configured on the server." });
      }

      // Set SSE stream headers immediately to ensure clean event streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const isValidAuth = !!(authHeader && !authHeader.includes("null") && !authHeader.includes("undefined"));

      let files: any[] = [];
      let driveQuery = "";
      const hasExplicitContext = contextFileIds && Array.isArray(contextFileIds) && contextFileIds.length > 0;

      if (hasExplicitContext && isValidAuth) {
        // Step 1b: Fetch metadata for each explicitly specified file ID directly
        const fetchedFiles = await Promise.all(
          contextFileIds.map(async (id: string) => {
            try {
              if (id.startsWith('person-')) return null;
              const fileUrl = `https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,modifiedTime,size,description`;
              const fileRes = await fetch(fileUrl, { headers: { Authorization: authHeader } });
              if (fileRes.ok) {
                return await fileRes.json();
              }
            } catch (err) {
              console.error(`Error fetching metadata for context file ${id}:`, err);
            }
            return null;
          })
        );
        files = fetchedFiles.filter(Boolean);
      } else if (isValidAuth) {
        try {
          // Step 1: Local javascript search query builder
          const cleanPrompt = prompt.toLowerCase().trim();
          const stopWords = new Set(["tell", "me", "about", "show", "open", "give", "find", "search", "a", "the", "in", "my", "of", "and", "to", "for", "with", "on", "at", "by", "from", "please", "can", "you"]);
          const words = cleanPrompt.split(/\s+/).map((w: string) => w.replace(/[^a-zA-Z0-9_\-]/g, '')).filter((w: string) => w && w.length > 2 && !stopWords.has(w));
          
          driveQuery = "trashed = false";
          let searchType = "recent";
          let targetName = "";

          if (cleanPrompt.includes("folder") || cleanPrompt.includes("everything in")) {
            searchType = "folder_contents";
            targetName = words.join(" ");
            driveQuery = `mimeType = 'application/vnd.google-apps.folder' and name contains '${targetName.replace(/'/g, "\\'")}' and trashed = false`;
          } else {
            let timeLimitDays = 30; // default 30 days
            if (cleanPrompt.includes("today")) {
              timeLimitDays = 1;
            } else if (cleanPrompt.includes("yesterday") || cleanPrompt.includes("last 2 days")) {
              timeLimitDays = 2;
            } else if (cleanPrompt.includes("week") || cleanPrompt.includes("recent") || cleanPrompt.includes("latest")) {
              timeLimitDays = 7;
            }
            const dateLimit = new Date(Date.now() - timeLimitDays * 24 * 60 * 60 * 1000).toISOString();

            if (words.length > 0) {
              searchType = "keyword";
              const keywordFilters = words.map((w: string) => `(name contains '${w.replace(/'/g, "\\'")}' or fullText contains '${w.replace(/'/g, "\\'")}')`).join(" and ");
              driveQuery = `${keywordFilters} and trashed = false`;
            } else {
              driveQuery = `modifiedTime > '${dateLimit}' and trashed = false`;
            }
          }

          console.log(`[AI Search Local Query Parser]: searchType=${searchType}, query="${driveQuery}"`);

          // Step 2: Fetch files metadata from Google Drive
          if (searchType === 'folder_contents' && targetName) {
            const folderUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&pageSize=5&fields=files(id,name)`;
            const folderRes = await fetch(folderUrl, { headers: { Authorization: authHeader } });
            if (folderRes.ok) {
              const folderData = await folderRes.json();
              const folder = folderData.files?.[0];
              if (folder) {
                driveQuery = `'${folder.id}' in parents and trashed = false`;
              }
            }
          }

          let listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&pageSize=40&fields=files(id,name,mimeType,modifiedTime,size,description)`;
          if (searchType === 'recent') {
            listUrl += "&orderBy=modifiedTime desc";
          }
          const listRes = await fetch(listUrl, { headers: { Authorization: authHeader } });
          if (listRes.ok) {
            const listData = await listRes.json();
            files = listData.files || [];
          } else {
            const errText = await listRes.text();
            console.warn(`[AI Search] Drive list API returned status ${listRes.status}: ${errText}`);
          }
        } catch (driveErr) {
          console.error("[AI Search] Error querying Google Drive API:", driveErr);
        }
      }

      // Intent Classification & File Selection
      let selection: { intent: string; selectedFileIds: string[]; primaryFileId: string } = {
        intent: "full_report",
        selectedFileIds: [],
        primaryFileId: ""
      };

      if (hasExplicitContext && files.length > 0) {
        selection = {
          intent: "full_report",
          selectedFileIds: contextFileIds,
          primaryFileId: ""
        };
      } else if (files.length === 1) {
        const cleanPrompt = prompt.toLowerCase().trim();
        const isOpenRequest = cleanPrompt.includes("open") || cleanPrompt.includes("show") || cleanPrompt.includes("view") || cleanPrompt.length < 25;
        selection = {
          intent: isOpenRequest ? "show_file" : "full_report",
          selectedFileIds: [files[0].id],
          primaryFileId: files[0].id
        };
      } else if (files.length > 1) {
        selection = {
          intent: "full_report",
          selectedFileIds: files.slice(0, 5).map(f => f.id),
          primaryFileId: files[0]?.id || ""
        };
      }

      // Branch for show_file intent
      if (selection.intent === 'show_file' && selection.primaryFileId) {
        const matchedFile = files.find(f => f.id === selection.primaryFileId);
        res.write(`data: ${JSON.stringify({ 
          action: "show_file", 
          fileId: selection.primaryFileId,
          fileName: matchedFile ? matchedFile.name : "" 
        })}\n\n`);
        res.end();
        return;
      }

      // Download content for selected files concurrently
      const filesToDownload = files.filter(f => selection.selectedFileIds.includes(f.id)).slice(0, 5);

      // Stream the sources event to the client unconditionally so sources panel populates
      res.write(`data: ${JSON.stringify({ 
        action: "sources", 
        files: filesToDownload.map(f => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          modifiedTime: f.modifiedTime,
          size: f.size
        }))
      })}\n\n`);

      let downloadedContents: { name: string, id: string, content: string }[] = [];

      if (filesToDownload.length > 0 && isValidAuth) {
        const downloadedContentsRaw = await Promise.all(
          filesToDownload.map(async (file) => {
            let downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
            const mType = (file.mimeType || '').toLowerCase();
            
            if (mType.includes('google-apps.document')) {
              downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
            } else if (mType.includes('google-apps.spreadsheet')) {
              downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
            } else if (mType.includes('google-apps.presentation')) {
              return {
                name: file.name,
                id: file.id,
                content: `Presentation: ${file.name}\nFile ID: ${file.id}\n(Google Slides metadata only)`
              };
            }

            try {
              const contentRes = await fetch(downloadUrl, { headers: { Authorization: authHeader } });
              if (contentRes.ok) {
                let text = await contentRes.text();
                const limit = 15000;
                if (text.length > limit) {
                  text = text.substring(0, limit) + "\n\n... [TRUNCATED FOR SUMMARY BREVITY] ...";
                }
                return { name: file.name, id: file.id, content: text };
              } else {
                console.warn(`Failed to download content for ${file.name}, status: ${contentRes.status}`);
                return null;
              }
            } catch (dlErr) {
              console.error(`Error downloading file ${file.name}:`, dlErr);
              return null;
            }
          })
        );
        downloadedContents = downloadedContentsRaw.filter(Boolean) as { name: string, id: string, content: string }[];
      }

      let customInstructions = "";
      try {
        customInstructions = fs.readFileSync(path.join(process.cwd(), "src", "aisummary.md"), "utf-8");
      } catch (err) {
        console.warn("Could not read custom aisummary.md instructions.");
      }

      let historyText = "";
      if (history && Array.isArray(history) && history.length > 0) {
        historyText = "Here is the conversation history so far:\n" + 
          history.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n') + 
          "\n\n";
      }

      const filesContextBlock = downloadedContents.length > 0
        ? `We found and downloaded the contents of the most relevant files from Google Drive:\n` + downloadedContents.map(d => `--- FILE: ${d.name} (ID: ${d.id}) ---\n${d.content}\n--- END ---`).join('\n\n')
        : `No external Google Drive file contents were retrieved for this request.`;

      // Synthesize and stream the final report
      const finalPrompt = `${historyText}The user asked: "${prompt}"

${filesContextBlock}

${customInstructions || `Synthesize a comprehensive, beautifully styled Markdown summary report or answer based on this content.
Guidelines:
- Start with a clear header title (e.g. "# Focus Areas & Activity Report")
- Use bullet points, bold text, lists, and tables where appropriate to present findings.
- Keep the writing tone professional and clean.
- Include a section listing any source files referenced if available.
- DO NOT wrap the output in markdown code blocks (like \`\`\`markdown ... \`\`\`). Output the raw Markdown directly.`}`;

      const resultStream = await retryWithBackoff(() => ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        contents: finalPrompt
      }));

      for await (const chunk of resultStream) {
        if (res.writableEnded || res.destroyed) break;
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      
      if (!res.writableEnded && !res.destroyed) {
        res.end();
      }
    } catch (error) {
      console.error("AI summary error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: String(error) });
      } else if (!res.writableEnded && !res.destroyed) {
        try {
          res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
          res.end();
        } catch (e) {
          console.error("Failed writing error to stream:", e);
        }
      }
    }
  });

  app.post("/api/doc-journey", async (req, res) => {
    console.log("[DocJourney Server] Received request at /api/doc-journey");
    try {
      const { prompt, activeFileContent, activeFileName, contextFileIds, history } = req.body;
      const authHeader = req.headers.authorization;
      console.log(`[DocJourney Server] Prompt: "${prompt}", activeFileName: "${activeFileName}", contextFileIds count: ${contextFileIds?.length || 0}`);
      
      if (!prompt) {
        console.warn("[DocJourney Server] Missing prompt!");
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getGenAI();
      if (!ai) {
        console.error("[DocJourney Server] Gemini API client missing!");
        return res.status(550).json({ error: "Gemini API key is not configured on the server." });
      }

      let contextText = "";
      let sources: any[] = [];

      if (authHeader) {
        console.log("[DocJourney Server] Performing Drive RAG search for prompt...");
        let files: any[] = [];
        const hasExplicitContext = contextFileIds && Array.isArray(contextFileIds) && contextFileIds.length > 0;

        if (hasExplicitContext) {
          const fetchedFiles = await Promise.all(
            contextFileIds.map(async (id: string) => {
              try {
                if (id.startsWith('person-')) return null;
                const fileUrl = `https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType,modifiedTime,size,description`;
                const fileRes = await fetch(fileUrl, { headers: { Authorization: authHeader } });
                if (fileRes.ok) return await fileRes.json();
              } catch (err) {
                console.error(`[DocJourney Server] Error fetching metadata for context file ${id}:`, err);
              }
              return null;
            })
          );
          files = fetchedFiles.filter(Boolean);
        } else {
          const cleanPrompt = prompt.toLowerCase().trim();
          const stopWords = new Set(["tell", "me", "about", "show", "open", "give", "find", "search", "a", "the", "in", "my", "of", "and", "to", "for", "with", "on", "at", "by", "from", "please", "can", "you", "write", "doc", "document", "prd", "outline", "create"]);
          const words = cleanPrompt.split(/\s+/).map((w: string) => w.replace(/[^a-zA-Z0-9_\-]/g, '')).filter((w: string) => w && w.length > 2 && !stopWords.has(w));
          
          let driveQuery = "trashed = false";
          if (words.length > 0) {
            const keywordFilters = words.map((w: string) => `(name contains '${w.replace(/'/g, "\\'")}' or fullText contains '${w.replace(/'/g, "\\'")}')`).join(" and ");
            driveQuery = `${keywordFilters} and trashed = false`;
          } else {
            const dateLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            driveQuery = `modifiedTime > '${dateLimit}' and trashed = false`;
          }

          try {
            console.log(`[DocJourney Server RAG Query]: "${driveQuery}"`);
            const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&pageSize=10&fields=files(id,name,mimeType,modifiedTime,size,description)&orderBy=modifiedTime desc`;
            const listRes = await fetch(listUrl, { headers: { Authorization: authHeader } });
            if (listRes.ok) {
              const listData = await listRes.json();
              files = listData.files || [];
              console.log(`[DocJourney Server RAG Matched Files]: ${files.length} files found`);
            }
          } catch (err) {
            console.error("[DocJourney Server RAG Error]:", err);
          }
        }

        if (files.length > 0) {
          const filesToDownload = files.slice(0, 5);
          sources = filesToDownload.map(f => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            modifiedTime: f.modifiedTime,
            size: f.size
          }));

          const downloadedContentsRaw = await Promise.all(
            filesToDownload.map(async (file) => {
              let downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
              const mType = (file.mimeType || '').toLowerCase();
              
              if (mType.includes('google-apps.document')) {
                downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
              } else if (mType.includes('google-apps.spreadsheet')) {
                downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`;
              } else if (mType.includes('google-apps.presentation')) {
                return { name: file.name, id: file.id, content: `Presentation: ${file.name}\nFile ID: ${file.id}` };
              }

              try {
                const contentRes = await fetch(downloadUrl, { headers: { Authorization: authHeader } });
                if (contentRes.ok) {
                  let text = await contentRes.text();
                  const limit = 15000;
                  if (text.length > limit) {
                    text = text.substring(0, limit) + "\n... [TRUNCATED] ...";
                  }
                  console.log(`[DocJourney Server RAG] Downloaded content for: ${file.name} (${text.length} chars)`);
                  return { name: file.name, id: file.id, content: text };
                }
              } catch (dlErr) {
                console.error(`[DocJourney Server RAG] Error downloading file ${file.name}:`, dlErr);
              }
              return null;
            })
          );

          const downloadedContents = downloadedContentsRaw.filter(Boolean) as { name: string, id: string, content: string }[];
          contextText = downloadedContents.map(d => `--- CONTEXT FILE: ${d.name} (ID: ${d.id}) ---\n${d.content}\n--- END CONTEXT FILE ---`).join('\n\n');
        }
      }

      let historyText = "";
      if (history && Array.isArray(history) && history.length > 0) {
        historyText = "Past conversation history:\n" + history.map((h: any) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join("\n") + "\n\n";
      }

      const isSlide = (activeFileName || '').toLowerCase().includes('slide') || (activeFileName || '').toLowerCase().endsWith('.ppt') || (activeFileName || '').toLowerCase().endsWith('.pptx');
      const docTypeLabel = isSlide ? "slideshow presentation" : "document";
      const docFormatInstruction = isSlide
        ? "2. <doc>...</doc>: The COMPLETE updated Markdown content for the presentation slides. Each slide MUST begin with a level 1 markdown heading ('# Slide Title'), followed by bullet points ('- Point 1', '- Point 2') for the content of that slide. Do NOT write standard paragraphs; organize all content into distinct slide pages with titles and bullets. DO NOT use horizontal rules or dividers (---, ***, <hr>)."
        : "2. <doc>...</doc>: The COMPLETE updated Markdown content for the document. This section will be rendered live inside their document canvas editor. Ensure it is formatted cleanly with clear Markdown headings (#, ##), bullet points, and paragraphs. DO NOT use horizontal rules or dividers (---, ***, <hr>) in the document content.";

      const systemPrompt = `You are an expert AI authoring assistant working in a collaborative workspace.
The user is writing a ${docTypeLabel} titled "${activeFileName || 'document.doc'}".
Current content:
---
${activeFileContent || ''}
---
${contextText ? `\nReference files from Google Drive provided by user:\n${contextText}\n` : ''}

CRITICAL RULES FOR AUTHORING NEW DOCUMENTS:
- The Reference files from Google Drive provided below are strictly for background context (e.g. project details, terminology).
- Do NOT merge into, adopt the title of, or copy the structure of reference documents.
- You MUST create a BRAND NEW, distinct Level 1 heading ('# ...') specifically matching what the user requested to create in their prompt. For example, if the user asks to create a 'Roadmap', your output MUST begin with '# [Project Name] Roadmap', NOT a PRD or other reference document title.

CRITICAL INSTRUCTIONS FOR RESPONSE FORMATTING:
You MUST structure your response into two distinct sections using XML tags <chat> and <doc>:

1. <chat>...</chat>: Conversational text directed to the user in their chat sidebar. Explain what you are doing, summarize the changes or content added, and ask any clarifying questions to help guide the creation. DO NOT put the body text inside <chat>.
${docFormatInstruction}

Example output format:
<chat>I have drafted a section based on your drive files. What specific goals would you like to add next?</chat>
<doc># Overview
- Key goal 1
- Key goal 2
</doc>`;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof (res as any).flushHeaders === 'function') {
        (res as any).flushHeaders();
      }

      if (sources && sources.length > 0) {
        res.write(`data: ${JSON.stringify({ action: "sources", files: sources })}\n\n`);
      }

      console.log("[DocJourney Server] Initiating generateContentStream to Gemini...");
      const resultStream = await retryWithBackoff(() => ai.models.generateContentStream({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: systemPrompt
        },
        contents: `${historyText}User request: ${prompt}`
      }));

      let chunkCount = 0;
      for await (const chunk of resultStream) {
        if (res.writableEnded || res.destroyed) {
          console.warn("[DocJourney Server] Response connection closed/destroyed mid-stream");
          break;
        }
        const chunkText = chunk.text || chunk.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
        if (chunkText) {
          chunkCount++;
          console.log(`[DocJourney Server] Sending chunk #${chunkCount} (${chunkText.length} chars)`);
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          if (typeof (res as any).flush === 'function') {
            (res as any).flush();
          }
        }
      }

      console.log(`[DocJourney Server] Stream finished. Total chunks sent: ${chunkCount}`);
      if (!res.writableEnded && !res.destroyed) {
        res.end();
      }
    } catch (error: any) {
      console.error("[DocJourney Server] CRITICAL ERROR in doc-journey handler:", error);
      const isQuotaError = String(error?.message || error).includes('429') || String(error?.message || error).includes('Quota') || String(error?.message || error).includes('ResourceExhausted');
      const friendlyMsg = isQuotaError 
        ? "The Gemini API rate limit or quota has been temporarily reached. Please wait a moment and try again."
        : `An error occurred: ${error?.message || String(error)}`;

      if (!res.headersSent) {
        res.status(isQuotaError ? 429 : 500).json({ error: friendlyMsg });
      } else if (!res.writableEnded && !res.destroyed) {
        try {
          res.write(`data: ${JSON.stringify({ text: `<chat>${friendlyMsg}</chat>` })}\n\n`);
          res.end();
        } catch (e) {
          console.error("[DocJourney Server] Failed writing error to stream:", e);
        }
      }
    }
  });

  app.post("/api/vibe-code", async (req, res) => {
    try {
      const { prompt, env_id, ingestedContext, activeFileName, activeFileMimeType, activeFileContent, members } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      
      let systemInstruction = "";
      try {
        systemInstruction = fs.readFileSync(path.join(process.cwd(), "src", "agent-system-prompt.md"), "utf-8");
      } catch (err) {
        console.warn("Could not read custom agent system prompt, using default.");
        systemInstruction = 
            "You are an expert developer. The user wants you to build a frontend web app and show it in their preview canvas. " +
            "CRITICAL RULES: \n" +
            "1. DO NOT try to start a real Node.js server. DO NOT run bash commands to spin up environments or search for cloudworkstations.dev URLs. \n" +
            "2. Generate all application code as a SINGLE self-contained 'index.html' file. If you need CSS or JS, put it inside <style> and <script> tags. Use CDNs for all libraries (like Tailwind, Leaflet, Chart.js, etc.). \n" +
            "3. At the very end of your task, you MUST output the complete HTML code wrapped in an HTML code block (i.e. ```html ... ```). " +
            "Do not output JSON. Do not print unnecessary terminal output or chain of thought.";
      }

      if (activeFileName) {
        systemInstruction += `\n\nCRITICAL FOCUS FILE CONTEXT:
The user is currently active on and focusing on the file "${activeFileName}" (mimeType: "${activeFileMimeType}").
If the user's prompt asks you to write into, edit, update, or modify this document, presentation, or slide, you MUST write directly into this native format!
Do NOT overwrite the user's workspace with a new "index.html" or unrelated HTML applications.
To modify "${activeFileName}", you must output a markdown code block with the exact filename as a comment on the first line (e.g., <!-- ${activeFileName} --> or /* ${activeFileName} */) containing the FULL, updated contents of that document/slide in its native text/format style.
- For Google Docs/text files: Provide the fully revised or appended text content.
- For Google Slides: Provide the slide text content, separating individual slides clearly using a line with "---" (the standard slide separator).

- **CRITICAL CHAT DISCIPLINE FOR WORKSPACE ARTICLES & REPORTS:**
  - YOU ARE STRICTLY FORBIDDEN from outputting research findings, report bodies, slide bullet items, or paragraphs directly in the chat dialogue as standard text.
  - Keep your chat message response extremely short and concise (1-2 sentences maximum, e.g. "I have finished doing full research and have added a comprehensive state of AI report directly to your focused Doc.").
  - The ENTIRE written/designed work MUST be enclosed inside the markdown code block targeting standard filenames (e.g., <!-- ${activeFileName} -->), which dynamically synchronizes the text and saves it directly to Google Drive.`;
      }

      if (activeFileName && (activeFileName.toLowerCase().includes('inferred') || activeFileName.toLowerCase().includes('todo') || activeFileName.toLowerCase().includes('to-do'))) {
        systemInstruction += `\n\nINFERRED TASKS & TO-DOS TOOL CUSTOMIZATION CONTEXT:
The user is modifying their Out-of-the-Box "To-dos" (Inferred Tasks) tool with natural language.
- DEFAULT PARAMETRIC JSON MODIFICATION: For standard edits (e.g. adjust title, change header size/height, filter by source like emails/docs, sort items, or filter workspace tasks), you MUST output an updated \`inferred_tasks.json\` code block (\`<!-- inferred_tasks.json -->\` or \`\`\`json ... \`\`\`) updating the JSON schema directly!
- Schema structure for \`inferred_tasks.json\`:
  \`\`\`json
  <!-- inferred_tasks.json -->
  {
    "title": "Email-Sourced To-dos",
    "headerHeight": 40,
    "headerTitleSize": "text-2xl",
    "sourceScope": "Emails Only",
    "summary": "1-sentence summary...",
    "immediateActions": [...]
  }
  \`\`\`
- ESCAPE HATCH FOR CUSTOM WEB APPS: ONLY output a standalone \`index.html\` web application (\`\`\`html ... \`\`\`) if the user EXPLICITLY asks to build a custom interactive web app, standalone tool, or Kanban board by name (e.g. "build a custom web app for this" or "convert to a Kanban board").
- CRITICAL RULE - NO UNSOLICITED KANBAN BOARDS: Never convert To-dos into a multi-column Kanban board unless the user explicitly uses the word "kanban" or asks for columns!`;
      }

      if (ingestedContext && Array.isArray(ingestedContext) && ingestedContext.length > 0) {
        systemInstruction += `\n\nThe user has provided the following files from their workspace (Google Drive) as context for this task:\n`;
        ingestedContext.forEach((f: any) => {
            systemInstruction += `\n--- START OF ${f.filename} ---\n${f.content}\n--- END OF ${f.filename} ---\n`;
        });
        systemInstruction += `\nUse these files as context, inspiration, or starting points. Enhance them based on the user prompt. You MUST output the modified files (such as index.html, styles.css, app.js etc.) using markdown code blocks so they can be rendered in the canvas. If you output multiple files, you MUST include the exact filename as the very first line inside the code block as a comment (e.g. <!-- index.html --> or /* app.js */). Never output generic file names like file-3.txt. IMPORTANT: If you use Tailwind classes, ensure the Tailwind CSS CDN script tag is included in the existing or new index.html file.`;
      }

      if (members && Array.isArray(members) && members.length > 0) {
        const membersList = members.map((m: any) => `- Name: "${m.name}", Email: "${m.email}", Avatar URL: "${m.avatar || ''}"`).join("\n");
        systemInstruction += `\n\nREAL WORKSPACE TEAM MEMBERS (MANDATORY ASSIGNEES FOR TASKS):
The following actual team members exist in the user's workspace:
${membersList}
When creating tasks, trackers, boards, or collaborative tools (such as a Kanban board with tasks), you MUST use these REAL team members as assignees.
- ALWAYS populate boards with realistic sample tasks assigned to these actual people!
- Display their REAL names and inline photo avatars using standard <img> tags with their Avatar URL (styled cleanly and simply, e.g. <img src="..." class="w-5 h-5 rounded-full inline-block mr-1"> or inline CSS width: 20px, height: 20px, border-radius: 50%). If Avatar URL is empty, render a simple initials circle.`;
      }

      systemInstruction += `\n\nCRITICAL DESIGN MANDATE (POLARIS / M3 & RADICAL SIMPLICITY):
You MUST strictly follow Robert Murdock's Polaris (Workspace Design System) and Material Design 3 (M3) specifications defined in the system rules.
- RADICAL SIMPLICITY & STRICT SCOPE CEILING: Build ONLY what the user asked for. Avoid adding unrequested features, sidebars, analytics boxes, stat counters, charts, export buttons, or floating action menus. Outputs MUST be ultra-minimal, clean, functional, and free of AI slop.
- ZERO REDUNDANT IN-APP HEADERS OR LOGOS: DO NOT generate top title bars, hero title banners, site titles, or branding headers/logos inside the HTML canvas body (e.g. "⚡ Ollie Decision & Risk Tracker" or top header divs). System breadcrumb headers outside the iframe ALREADY render the tool's title. Start your HTML body directly with the core functional interface (e.g., search/filter controls, list/table elements, or input form).
- TOOL NAMING MANDATE: Always give your application a clear, concise descriptive name inside the <title> tag of index.html (e.g. <title>Decision & Risk Log</title> or <title>Sales Tracker</title>). Do NOT use generic titles like <title>App</title>, <title>My Web Workspace</title>, or <title>index.html</title>.
- ZERO EMBELLISHMENTS & ZERO AI SLOP: NO gradient backgrounds, NO glowing box-shadows, NO decorative badges/chips, NO priority tag chips (e.g. High/Med/Low tags), NO promotional banners.
- PLAIN WHITE BACKGROUND MANDATE: ALWAYS use a plain white background (#ffffff / bg-white) for the root application body and canvas view unless the user specifically requests a colored background. Use only standard M3 tokens (surface #ffffff, surface-container #f0f4f9, primary #0b57d0, outline #747775).`;

      console.log(`[Server /api/vibe-code] Received prompt (${prompt.length} chars). Env ID: ${env_id || 'remote'}. Context files: ${ingestedContext?.length || 0}`);
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const ai = getGenAI();
      if (!ai) {
        console.error("[Server /api/vibe-code] ERROR: GEMINI_API_KEY is missing!");
        res.write(`data: ${JSON.stringify({ error: { message: "GEMINI_API_KEY is missing on this server instance." } })}\n\n`);
        res.end();
        return;
      }

      const lowerPrompt = prompt.toLowerCase();
      const isH2Request = (lowerPrompt.includes('h2') || lowerPrompt.includes('patient')) && 
                          (lowerPrompt.includes('track') || lowerPrompt.includes('plan') || lowerPrompt.includes('kanban') || lowerPrompt.includes('work') || lowerPrompt.includes('project') || lowerPrompt.includes('build'));

      if (isH2Request) {
        const cachedPath = path.join(process.cwd(), "data", "cached_h2_kanban.html");
        if (fs.existsSync(cachedPath)) {
          console.log("[Server /api/vibe-code] Intercepted H2 tracker prompt. Fast streaming pre-cached Kanban HTML tool!");
          const htmlContent = fs.readFileSync(cachedPath, "utf-8");
          const streamText = `I'll create an interactive H2 Patient Journey Kanban Board tailored to your space to track milestone progress across triage, diagnostics, surgery, and discharge stages.\n\n\`\`\`html\n<!-- index.html -->\n${htmlContent}\n\`\`\`\n\nYour H2 Patient Experience Kanban Board is ready! You can drag and drop milestones across care stages, add new tasks, and filter by assigned team leads.`;

          const chunkSize = 600;
          for (let i = 0; i < streamText.length; i += chunkSize) {
            if (res.writableEnded || res.destroyed) break;
            const chunk = streamText.substring(i, i + chunkSize);
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            await new Promise(r => setTimeout(r, 25));
          }

          const completionEvent = {
            event_type: "interaction.completed",
            interaction: {
              environment_id: "remote",
              steps: [
                {
                  text: streamText
                }
              ]
            }
          };
          res.write(`data: ${JSON.stringify(completionEvent)}\n\n`);

          if (!res.writableEnded && !res.destroyed) {
            res.end();
          }
          return;
        }
      }

      const resolvedEnv = (env_id && env_id !== 'remote' && env_id !== 'null' && env_id !== 'undefined') ? env_id : "remote";
      console.log(`[Server /api/vibe-code] Invoking ai.interactions.create with environment: ${resolvedEnv}...`);
      
      const interaction = await retryWithBackoff(() => ai.interactions.create(
        {
          agent: "antigravity-preview-05-2026",
          input: prompt,
          system_instruction: systemInstruction,
          environment: resolvedEnv,
          stream: true,
        },
        { timeout: 300000 }
      ));

      let eventCount = 0;
      let totalBytesEmitted = 0;
      try {
        for await (const event of interaction) {
          if (res.writableEnded || res.destroyed) {
            console.warn("[Server /api/vibe-code] Response stream closed by client mid-stream.");
            break;
          }
          eventCount++;
          const eventJson = JSON.stringify(event);
          totalBytesEmitted += eventJson.length;
          console.log(`[Server /api/vibe-code] Emitting event #${eventCount}: type=${(event as any).event_type || (event as any).type || 'unknown'}, length=${eventJson.length} bytes`);
          res.write(`data: ${eventJson}\n\n`);
        }
      } catch (streamErr: any) {
        console.error("[Server /api/vibe-code] Error iterating stream:", streamErr);
        res.write(`data: ${JSON.stringify({ error: { message: streamErr?.message || String(streamErr) } })}\n\n`);
      }
      
      console.log(`[Server /api/vibe-code] Streaming completed. Emitted ${eventCount} events, total ${totalBytesEmitted} bytes.`);
      if (!res.writableEnded && !res.destroyed) {
        res.end();
      }
    } catch (error: any) {
      console.error("Error calling Gemini API in vibe-code:", error);
      const isQuotaError = String(error?.message || error).includes('429') || String(error?.message || error).includes('Quota') || String(error?.message || error).includes('ResourceExhausted');
      const friendlyMsg = isQuotaError 
        ? "The Gemini API rate limit or quota has been temporarily reached. Please wait a moment and try again."
        : `An error occurred: ${error?.message || String(error)}`;

      if (!res.headersSent) {
        res.status(isQuotaError ? 429 : 500).json({ error: friendlyMsg });
      } else if (!res.writableEnded && !res.destroyed) {
        try {
          res.write(`data: ${JSON.stringify({ text: `<chat>${friendlyMsg}</chat>` })}\n\n`);
          res.end();
        } catch (e) {
          console.error("Failed writing error to stream:", e);
        }
      }
    }
  });

  app.post("/api/organize-files", async (req, res) => {
    try {
      const { files = [] } = req.body;
      if (!Array.isArray(files) || files.length === 0) {
        return res.json({ proposedMoves: [] });
      }

      const ai = getGenAI();
      if (!ai) {
        // Fallback move generator if Gemini client is unavailable
        const fallbackMoves = files.map((f: any) => ({
          fileId: f.id || f.driveId || f.name,
          fileName: f.name,
          actionType: "CREATE_AND_MOVE",
          targetFolderId: `folder_${f.type || 'docs'}`,
          targetFolderName: f.name.endsWith('.csv') || f.name.endsWith('.json') ? "Data & Assets" : "Documents & Notes",
          reasoning: "Grouped by extension pattern"
        }));
        return res.json({ proposedMoves: fallbackMoves });
      }

      const filesListStr = files.map((f: any) => `- Name: "${f.name}", ID: "${f.id || f.driveId || f.name}", Type: "${f.mimeType || f.type || 'unknown'}"`).join("\n");

      const prompt = `You are an expert file organization assistant. Analyze the following workspace files and determine logical sub-folders to group them into based on their names and types.

Files in active workspace:
${filesListStr}

Propose logical sub-folders to organize these files into. Respond ONLY with a valid JSON object containing a "proposedMoves" array.
Each object in "proposedMoves" must have:
- "fileId": the ID of the file being moved
- "fileName": the name of the file
- "actionType": "CREATE_AND_MOVE"
- "targetFolderId": temporary string ID starting with "folder_"
- "targetFolderName": name of the target folder (e.g., "Documentation", "Data & Reports", "Source Code", "Design Assets")
- "reasoning": brief explanation (max 5 words) why the file belongs there

JSON output:`;

      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      }));

      const responseText = response.text || "{}";
      try {
        const parsed = JSON.parse(responseText);
        if (parsed && Array.isArray(parsed.proposedMoves)) {
          return res.json({ proposedMoves: parsed.proposedMoves });
        }
      } catch (e) {
        console.warn("Failed parsing Gemini JSON output for organize-files, fallback...", e);
      }

      const fallbackMoves = files.map((f: any) => ({
        fileId: f.id || f.driveId || f.name,
        fileName: f.name,
        actionType: "CREATE_AND_MOVE",
        targetFolderId: `folder_${f.type || 'docs'}`,
        targetFolderName: f.name.endsWith('.csv') || f.name.endsWith('.json') ? "Data & Assets" : "Documents & Notes",
        reasoning: "Grouped by extension pattern"
      }));
      res.json({ proposedMoves: fallbackMoves });
    } catch (error) {
      console.error("Organize files endpoint error:", error);
      res.json({ proposedMoves: [] });
    }
  });

  app.post("/api/classify-intent", async (req, res) => {
    const { prompt } = req.body;

    const fallbackClassification = (userPrompt: string) => {
      const lower = (userPrompt || "").toLowerCase();
      if (lower.includes("doc") || lower.includes("prd") || lower.includes("roadmap") || lower.includes("proposal") || lower.includes("specification")) {
        return {
          domain: "doc",
          toolArchetype: null,
          proposalText: `Would you like me to draft a document for this request?`,
          pillLabel: `Draft Document`,
          archetypePrompt: userPrompt
        };
      }
      if (lower.includes("slide") || lower.includes("presentation") || lower.includes("deck")) {
        return {
          domain: "slide",
          toolArchetype: null,
          proposalText: `Would you like me to create a slide deck for this request?`,
          pillLabel: `Create Presentation`,
          archetypePrompt: userPrompt
        };
      }
      if (lower.includes("decision") || lower.includes("risk") || lower.includes("mitigation")) {
        return {
          domain: "tool",
          toolArchetype: "decision_risk_log",
          proposalText: `Would you like me to build a **Decision & Risk Log** to track your team's decisions?`,
          pillLabel: `Build Decision & Risk Log`,
          archetypePrompt: `Build a comprehensive decision and risk tracking system to document team decisions, outcomes, ownership, and mitigations.`
        };
      }
      if (lower.includes("bug") || lower.includes("defect") || lower.includes("issue")) {
        return {
          domain: "tool",
          toolArchetype: "bug_tracker",
          proposalText: `Would you like me to build a **Bug Tracker** to manage software defects and feedback?`,
          pillLabel: `Build Bug Tracker`,
          archetypePrompt: `Build a Bug Tracker application to track software bugs, severity, status, and assignees.`
        };
      }
      if (lower.includes("approval") || lower.includes("sign-off") || lower.includes("signoff")) {
        return {
          domain: "tool",
          toolArchetype: "approval_queue",
          proposalText: `Would you like me to build an **Approval Queue** to manage design approvals?`,
          pillLabel: `Build Approval Queue`,
          archetypePrompt: `Build an Approval Queue application to track design assets, reviewers, pending sign-offs, and approval status.`
        };
      }
      if (lower.includes("track") || lower.includes("kanban") || lower.includes("task") || lower.includes("work")) {
        return {
          domain: "tool",
          toolArchetype: "kanban",
          proposalText: `Would you like me to build a **Kanban Board** to track the team's work?`,
          pillLabel: `Build Kanban Board`,
          archetypePrompt: `Build an interactive Kanban Board with columns for To Do, In Progress, and Done to track team tasks.`
        };
      }

      const cleanPrompt = userPrompt.length > 60 ? `${userPrompt.slice(0, 57)}...` : userPrompt;
      return {
        domain: "tool",
        toolArchetype: "custom",
        proposalText: `Would you like me to build a custom tool for "${cleanPrompt}"?`,
        pillLabel: `Build Custom Tool`,
        archetypePrompt: userPrompt
      };
    };

    try {
      if (!prompt || typeof prompt !== "string") {
        return res.json(fallbackClassification(""));
      }

      const ai = getGenAI();
      if (!ai) {
        return res.json(fallbackClassification(prompt));
      }

      const systemPrompt = `You are an expert intent router for an AI workspace.
Analyze the user's natural language request and classify it into JSON format.

CRITICAL CLASSIFICATION RULES:

1. DOMAIN = "doc":
   - IF the user asks to write, draft, create, edit, summarize, or produce a document, PRD, specification, design spec, report, text article, written proposal, or roadmap (e.g., "write a doc", "write a PRD for this space", "write a roadmap document based on this project", "draft a proposal", "create a roadmap doc"):
   - You MUST set "domain": "doc" and "toolArchetype": null.
   - Set "proposalText": "Would you like me to draft a document for this request?"
   - Set "pillLabel": "Draft Document"
   - YOU ARE STRICTLY FORBIDDEN from classifying document, PRD, or roadmap requests as "tool"!

2. DOMAIN = "slide":
   - IF the user explicitly requests a presentation, slide deck, or slides (e.g., "make a slide deck"), set "domain": "slide" and "toolArchetype": null.

3. DOMAIN = "organize":
   - IF the user asks to organize, sort, move, or clean up workspace files (e.g., "organize my files"), set "domain": "organize" and "toolArchetype": null.

4. DOMAIN = "tool":
   - IF the user describes a workflow problem, task tracking, bug tracking, risk management, approval queue, or requests an interactive software application or web app (e.g., "help me track the team's work", "help me manage software bugs", "track our project decisions and risk mitigations", "manage design approvals and sign-offs", "help me track unreplied emails"):
   - Set "domain": "tool"
   - Select the optimal "toolArchetype":
     * "kanban": MANDATORY for any prompt mentioning "track work", "track team work", "track tasks", "kanban board" (e.g. "help me track the team's work", "help me track my team's tasks")
     * "bug_tracker": for software defects, bug reports, issues, feedback ("help me manage software bugs", "bug tracker")
     * "decision_risk_log": for decisions, risk registers, mitigations ("track project decisions and risk mitigations", "risk log")
     * "approval_queue": for review queues, sign-offs, pending approvals ("manage design approvals", "approval queue")
     * "action_agenda": for task lists, meeting action items, unreplied emails ("track unreplied emails", "action item list")
     * "custom": for any other interactive tool.

EXAMPLES:
Input: "write a PRD for this space" -> {"domain": "doc", "toolArchetype": null, "proposalText": "Would you like me to draft a Product Requirement Document (PRD) for this space?", "pillLabel": "Draft PRD"}
Input: "write a roadmap document based on this project" -> {"domain": "doc", "toolArchetype": null, "proposalText": "Would you like me to draft a Roadmap document for this project?", "pillLabel": "Draft Roadmap"}
Input: "help me track the team's work" -> {"domain": "tool", "toolArchetype": "kanban", "proposalText": "Would you like me to build a **Kanban Board** to track the team's work?", "pillLabel": "Build Kanban Board"}
Input: "help me manage software bugs and feedback" -> {"domain": "tool", "toolArchetype": "bug_tracker", "proposalText": "Would you like me to build a **Bug Tracker** to manage software defects and feedback?", "pillLabel": "Build Bug Tracker"}
Input: "track our project decisions and risk mitigations" -> {"domain": "tool", "toolArchetype": "decision_risk_log", "proposalText": "Would you like me to build a **Decision & Risk Log** to track decisions and risks?", "pillLabel": "Build Decision & Risk Log"}
Input: "manage design approvals and sign-offs" -> {"domain": "tool", "toolArchetype": "approval_queue", "proposalText": "Would you like me to build an **Approval Queue** to manage design approvals?", "pillLabel": "Build Approval Queue"}

OUTPUT ONLY VALID JSON:
{
  "domain": "doc" | "slide" | "organize" | "tool",
  "toolArchetype": "kanban" | "bug_tracker" | "decision_risk_log" | "approval_queue" | "action_agenda" | "custom" | null,
  "proposalText": string,
  "pillLabel": string,
  "archetypePrompt": string
}`;

      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `${systemPrompt}\n\nUser request: "${prompt}"`,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 1024
        }
      }));

      const rawText = response.text || "{}";
      try {
        const parsed = JSON.parse(rawText);
        res.json({
          domain: parsed.domain || "tool",
          toolArchetype: parsed.toolArchetype || (parsed.domain === "tool" ? "custom" : null),
          proposalText: parsed.proposalText || `Would you like me to build a custom tool for this?`,
          pillLabel: parsed.pillLabel || `Build Custom Tool`,
          archetypePrompt: parsed.archetypePrompt || prompt
        });
      } catch (e) {
        console.warn("Failed to parse intent classification JSON from Gemini, using smart fallback.", e);
        res.json(fallbackClassification(prompt));
      }
    } catch (error) {
      console.error("Classify intent failed, using smart fallback:", error);
      res.json(fallbackClassification(prompt));
    }
  });



  app.post("/api/summarize-task", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.json({ summary: "app" });
      }
      
      const ai = getGenAI();
      if (!ai) {
        return res.json({ summary: "app" });
      }
      
      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Summarize the following user request into a short 1-4 word noun phrase that completes the sentence 'Building your...'. DO NOT include 'Building your' in the output. Just output the noun phrase. Keep it mostly lowercase unless there are proper nouns. Examples: 'portfolio website', 'todo list app', 'calculator', 'snake game'.\n\nUser request: ${prompt}`
      }));
      
      const summary = response.text || "app";
      res.json({ summary: summary.replace(/^building your\s+/i, '').replace(/\.$/, '') });
    } catch (error) {
       console.warn("Summarize task failed (likely 503 from Gemini), continuing with default summary.", error);
       res.json({ summary: "app" });
    }
  });

  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  server.setTimeout(0);

  // WebSocket Real-time Multi-user Presence Tracking
  const wss = new WebSocketServer({ server });
  
  // roomId -> Map<clientId, ClientPresence>
  const rooms = new Map<string, Map<string, {
    ws: any;
    id: string;
    name: string;
    color: string;
    x: number;
    y: number;
  }>>();

  wss.on("connection", (ws) => {
    let currentRoomId: string | null = null;
    let currentClientId: string | null = null;

    ws.on("message", (messageStr) => {
      try {
        const data = JSON.parse(messageStr.toString());
        if (data.type === "join") {
          const { roomId, userId, name, color } = data;
          if (!roomId || !userId) return;

          currentRoomId = roomId;
          currentClientId = userId;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
          }
          const room = rooms.get(roomId)!;
          
          room.set(userId, {
            ws,
            id: userId,
            name: name || "Anonymous",
            color: color || "#3B82F6",
            x: undefined,
            y: undefined
          });

          // Send current presence list to the joining user, excluding themselves
          const activeUsers = Array.from(room.values())
            .filter(u => u.id !== userId)
            .map(u => ({
              id: u.id,
              name: u.name,
              color: u.color,
              x: u.x,
              y: u.y
            }));

          ws.send(JSON.stringify({
            type: "init_presence",
            users: activeUsers
          }));

          // Broadcast join to others in the room
          room.forEach((client, id) => {
            if (id !== userId && client.ws.readyState === 1) { // 1 is OPEN
              client.ws.send(JSON.stringify({
                type: "user_joined",
                user: { id: userId, name: name || "Anonymous", color: color || "#3B82F6" }
              }));
            }
          });
        } 
        else if (data.type === "cursor") {
          if (!currentRoomId || !currentClientId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const client = room.get(currentClientId);
          if (client) {
            client.x = data.x;
            client.y = data.y;
          }

          // Broadcast update to others in the room
          room.forEach((cl, id) => {
            if (id !== currentClientId && cl.ws.readyState === 1) {
              cl.ws.send(JSON.stringify({
                type: "cursor_update",
                userId: currentClientId,
                name: client ? client.name : "Anonymous",
                color: client ? client.color : "#3B82F6",
                x: data.x,
                y: data.y
              }));
            }
          });
        }
      } catch (err) {
        console.error("Error handling WebSocket message:", err);
      }
    });

    ws.on("close", () => {
      if (currentRoomId && currentClientId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          const currentClient = room.get(currentClientId);
          // Only perform cleanup if this closing socket is the active one registered for the client!
          if (currentClient && currentClient.ws === ws) {
            room.delete(currentClientId);
            if (room.size === 0) {
              rooms.delete(currentRoomId);
            } else {
              // Tell everyone else this user left
              room.forEach((client) => {
                if (client.ws.readyState === 1) {
                  client.ws.send(JSON.stringify({
                    type: "user_left",
                    userId: currentClientId!
                  }));
                }
              });
            }
          }
        }
      }
    });
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
