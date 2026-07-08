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

  async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 1500): Promise<T> {
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
          error.message.includes("Unavailable")
        ));
      
      if (retries > 0 && isRateLimitOrTransient) {
        console.warn(`[Gemini API] Transient error encountered (status: ${status}). Retrying in ${delay}ms... Error: ${error.message || error}`);
        await new Promise(resolve => setTimeout(resolve, delay));
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
      const { projectName, messages, envId, activeSpaceId, sandboxUrl, userEmail, sandboxFiles, members } = req.body;

      const payload = {
        chatId: sanitizedId,
        projectName: projectName || "New Workspace",
        messages: messages || [],
        envId: envId || null,
        activeSpaceId: activeSpaceId || null,
        sandboxUrl: sandboxUrl || "",
        sandboxFiles: sandboxFiles || [],
        userEmail: userEmail || "",
        members: members || [],
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
      const isFiltered = email && email !== 'all' && email !== 'guest' && email !== 'undefined';
      
      const getLocalChats = async () => {
        const chatsDir = path.join(process.cwd(), "data", "chats");
        let localChats: any[] = [];
        if (fs.existsSync(chatsDir)) {
          const files = await fs.promises.readdir(chatsDir);
          for (const f of files) {
            if (f.endsWith('.json')) {
              try {
                const raw = await fs.promises.readFile(path.join(chatsDir, f), "utf-8");
                const parsed = JSON.parse(raw);
                if (!isFiltered || parsed.userEmail === email) {
                  localChats.push(parsed);
                }
              } catch (e) {
                // ignore
              }
            }
          }
        }
        return localChats;
      };

      if (firebaseConfig) {
        try {
          const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents:runQuery?key=${firebaseConfig.apiKey}`;
          const queryBody = isFiltered ? {
            structuredQuery: {
              from: [{ collectionId: "chats" }],
              where: {
                fieldFilter: {
                  field: { fieldPath: "userEmail" },
                  op: "EQUAL",
                  value: { stringValue: email }
                }
              }
            }
          } : {
            structuredQuery: {
              from: [{ collectionId: "chats" }]
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
        
        // Identify if it's text/code/doc/sheet
        const isGoogleDoc = mType === 'application/vnd.google-apps.document';
        const isGoogleSheet = mType === 'application/vnd.google-apps.spreadsheet';
        const isTextOrCode = mType.startsWith('text/') || 
                             mType === 'application/json' || 
                             mType === 'application/javascript' || 
                             mType === 'application/x-javascript' ||
                             isGoogleDoc || 
                             isGoogleSheet;
        
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
        if (isGoogleDoc) {
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

  app.get("/api/workspace-digest", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No authorization header" });
      }

      const headers = { Authorization: authHeader };
      const twoDaysAgoStr = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      let emails: any[] = [];
      let chats: any[] = [];
      let comments: any[] = [];

      // 1. Fetch Gmail threads
      try {
        const gmailListUrl = `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=5`;
        const gmailListRes = await fetch(gmailListUrl, { headers });
        if (gmailListRes.ok) {
          const listData = await gmailListRes.json();
          const threads = listData.threads || [];
          const detailPromises = threads.map(async (t: any) => {
            try {
              const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}`;
              const detailRes = await fetch(detailUrl, { headers });
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
          emails = detailsResolved.filter(Boolean);
        } else {
          console.warn(`Gmail API returned status ${gmailListRes.status} during list`);
        }
      } catch (err) {
        console.warn("Gmail integration fetch failed:", err);
      }

      // 2. Fetch Google Chat messages
      try {
        const chatUrl = `https://chat.googleapis.com/v1/spaces/-/messages:search`;
        const chatRes = await fetch(chatUrl, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            filter: `createTime >= "${twoDaysAgoStr}"`
          })
        });
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          const messages = chatData.messages || [];
          chats = messages.slice(0, 15).map((m: any) => ({
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

      // 3. Fetch Drive Comments
      try {
        const driveQuery = `modifiedTime > '${sevenDaysAgoStr}' and trashed = false and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.google-apps.presentation')`;
        const driveUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(driveQuery)}&pageSize=8&fields=files(id,name,mimeType,modifiedTime)`;
        const driveRes = await fetch(driveUrl, { headers });
        if (driveRes.ok) {
          const driveData = await driveRes.json();
          const files = driveData.files || [];
          const commentPromises = files.map(async (file: any) => {
            try {
              const commentsUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/comments?fields=comments(id,content,author(displayName,emailAddress),createdTime,resolved,replies)`;
              const commentsRes = await fetch(commentsUrl, { headers });
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
          comments = commentsResolved.filter(Boolean);
        } else {
          console.warn(`Drive API returned status ${driveRes.status} during list`);
        }
      } catch (err) {
        console.warn("Drive Comments integration fetch failed:", err);
      }

      const hasData = emails.length > 0 || chats.length > 0 || comments.length > 0;
      if (!hasData) {
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

      const promptText = `You are a helpful assistant. Synthesize a structured 'Today's Agenda & Action Plan' based on the following Google Workspace activity log:
${emailsBlock}
${chatsBlock}
${commentsBlock}

Provide the response as a JSON object matching the following structure:
{
  "summary": "1-sentence overview of today's work.",
  "immediateActions": [
    {
      "id": "string",
      "title": "Short task title (e.g., Change slide color based on feedback)",
      "titleDone": "Completed task title (e.g., I changed the color based on feedback)",
      "description": "Short task description (e.g., Reply to comment on 'branding.doc')",
      "descriptionDone": "Completed description (e.g., I replied and updated branding.doc, please review.)",
      "source": "Details about source (e.g., Email from Sarah / Comment in branding.doc)",
      "action": "Exact recommended action...",
      "type": "email" | "chat" | "comment"
    }
  ],
  "followUps": [
    {
      "id": "string",
      "title": "Short task title...",
      "titleDone": "Completed task title...",
      "description": "Short task description...",
      "descriptionDone": "Completed description...",
      "source": "Details about source...",
      "action": "Exact recommended action...",
      "type": "email" | "chat" | "comment"
    }
  ],
  "updates": [
    {
      "id": "string",
      "description": "General update info...",
      "source": "Details about source...",
      "type": "email" | "chat" | "comment"
    }
  ]
}

Ensure all IDs are unique. Keep tasks concise and actionable. Return ONLY the raw JSON object.`;

      const response = await retryWithBackoff(() => ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: { responseMimeType: "application/json" }
      }));

      const text = response.text || "{}";
      res.json(JSON.parse(text));
    } catch (error) {
      console.error("Workspace digest synthesis error:", error);
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

      const systemPrompt = `You are an expert AI document authoring assistant working in a collaborative workspace.
The user is writing a document titled "${activeFileName || 'document.doc'}".
Current document content:
---
${activeFileContent || ''}
---
${contextText ? `\nReference files from Google Drive provided by user:\n${contextText}\n` : ''}

CRITICAL INSTRUCTIONS FOR RESPONSE FORMATTING:
You MUST structure your response into two distinct sections using XML tags <chat> and <doc>:

1. <chat>...</chat>: Conversational text directed to the user in their chat sidebar. Explain what you are doing, summarize the changes or content added, and ask any clarifying questions to help guide the document creation. DO NOT put the document body/article text inside <chat>.
2. <doc>...</doc>: The COMPLETE updated Markdown content for the document. This section will be rendered live inside their document canvas editor. Ensure it is formatted cleanly with clear Markdown headings (#, ##), bullet points, and paragraphs. DO NOT use horizontal rules or dividers (---, ***, <hr>) in the document content.

Example output format:
<chat>I have drafted a marketing section based on your Q3 drive files. What specific goals would you like to add next?</chat>
<doc># New document
## Marketing Overview
Here is the detailed marketing strategy...
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
    } catch (error) {
      console.error("[DocJourney Server] CRITICAL ERROR in doc-journey handler:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: String(error) });
      } else if (!res.writableEnded && !res.destroyed) {
        try {
          res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
          res.end();
        } catch (e) {
          console.error("[DocJourney Server] Failed writing error to stream:", e);
        }
      }
    }
  });

  app.post("/api/vibe-code", async (req, res) => {
    try {
      const { prompt, env_id, ingestedContext, activeFileName, activeFileMimeType, activeFileContent } = req.body;
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

      if (ingestedContext && Array.isArray(ingestedContext) && ingestedContext.length > 0) {
        systemInstruction += `\n\nThe user has provided the following files from their workspace (Google Drive) as context for this task:\n`;
        ingestedContext.forEach((f: any) => {
            systemInstruction += `\n--- START OF ${f.filename} ---\n${f.content}\n--- END OF ${f.filename} ---\n`;
        });
        systemInstruction += `\nUse these files as context, inspiration, or starting points. Enhance them based on the user prompt. You MUST output the modified files (such as index.html, styles.css, app.js etc.) using markdown code blocks so they can be rendered in the canvas. If you output multiple files, you MUST include the exact filename as the very first line inside the code block as a comment (e.g. <!-- index.html --> or /* app.js */). Never output generic file names like file-3.txt. IMPORTANT: If you use Tailwind classes, ensure the Tailwind CSS CDN script tag is included in the existing or new index.html file.`;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      const ai = getGenAI();
      if (!ai) {
        res.write(`data: ${JSON.stringify({ error: { message: "GEMINI_API_KEY is missing on this server instance." } })}\n\n`);
        res.end();
        return;
      }

      const interaction = await retryWithBackoff(() => ai.interactions.create(
        {
          agent: "antigravity-preview-05-2026",
          input: prompt,
          system_instruction: systemInstruction,
          environment: env_id || "remote",
          stream: true,
        },
        { timeout: 300000 }
      ));

      for await (const event of interaction) {
        if (res.writableEnded || res.destroyed) break;
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
      
      if (!res.writableEnded && !res.destroyed) {
        res.end();
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal Server Error", details: String(error) });
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
