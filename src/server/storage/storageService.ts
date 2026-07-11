import fs from 'fs';
import path from 'path';

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
      console.log(`[Firebase Storage] Initialized REST Client with Project ID: ${config.projectId}`);
    }
  }
} catch (err) {
  console.error("[Firebase Storage] Error loading configuration:", err);
}

async function fetchWithTimeout(resource: string, options: any = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
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

export function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(v => toFirestoreValue(v)) } };
  }
  if (typeof val === "object") {
    const fields: any = {};
    for (const k of Object.keys(val)) {
      fields[k] = toFirestoreValue(val[k]);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

export function fromFirestoreValue(fval: any): any {
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

async function fileExistsAsync(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

const LEGACY_CHATS_FILE = path.join(process.cwd(), "data", "chats.json");
const LEGACY_SHARDS_FILE = path.join(process.cwd(), "data", "shards.json");

// --- CHAT PERSISTENCE ---

export async function getChatAsync(chatId: string): Promise<any | null> {
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
        return chat;
      }
    } catch (fErr) {
      console.error(`[Firebase Storage] Chat Firestore read error for ${sanitizedId}:`, fErr);
    }
  }

  // Local flat-file fallback
  const filePath = path.join(process.cwd(), "data", "chats", `${sanitizedId}.json`);
  try {
    if (await fileExistsAsync(filePath)) {
      const raw = await fs.promises.readFile(filePath, "utf-8");
      const chat = JSON.parse(raw);
      chat.activeSpaceId = chat.activeSpaceId || chat.driveFolderId;
      return chat;
    }
  } catch (e) {
    console.error(`Failed to read local chat file for ${sanitizedId}`, e);
  }

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

export async function saveChatAsync(chatId: string, payload: any): Promise<{ success: boolean; cloudSynced: boolean }> {
  const sanitizedId = chatId.replace(/[^a-zA-Z0-9_\-]/g, "_");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      if (response.ok) {
        firestoreWorked = true;
      }
    } catch (fErr) {
      console.error(`[Firebase Storage] Chat Firestore write error for ${sanitizedId}:`, fErr);
    }
  }

  // Local flat-file write
  const filePath = path.join(process.cwd(), "data", "chats", `${sanitizedId}.json`);
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (e) {
    console.error(`Failed to write local chat file for ${sanitizedId}`, e);
  }

  // Synchronize files to parent space if child chat
  const activeSpaceId = payload.activeSpaceId;
  if (activeSpaceId && activeSpaceId !== sanitizedId && !String(activeSpaceId).startsWith("home")) {
    try {
      const parentPayload = (await getChatAsync(activeSpaceId)) || {
        chatId: activeSpaceId,
        projectName: payload.projectName || "New Workspace",
        messages: [],
        sandboxFiles: []
      };
      const existingFiles = Array.isArray(parentPayload.sandboxFiles) ? parentPayload.sandboxFiles : [];
      const newFiles = Array.isArray(payload.sandboxFiles) ? payload.sandboxFiles : [];
      const mergedMap = new Map();
      for (const f of existingFiles) {
        if (f && f.name) mergedMap.set(f.name.toLowerCase(), f);
      }
      for (const f of newFiles) {
        if (f && f.name) mergedMap.set(f.name.toLowerCase(), f);
      }
      parentPayload.sandboxFiles = Array.from(mergedMap.values());
      parentPayload.updatedAt = new Date().toISOString();

      // Write parent space locally & to cloud
      const parentPath = path.join(process.cwd(), "data", "chats", `${activeSpaceId.replace(/[^a-zA-Z0-9_\-]/g, "_")}.json`);
      await fs.promises.mkdir(path.dirname(parentPath), { recursive: true });
      await fs.promises.writeFile(parentPath, JSON.stringify(parentPayload, null, 2), "utf-8");

      if (firebaseConfig) {
        const parentSanitized = activeSpaceId.replace(/[^a-zA-Z0-9_\-]/g, "_");
        const parentUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/chats/${parentSanitized}?key=${firebaseConfig.apiKey}`;
        const parentFields: any = {};
        for (const k of Object.keys(parentPayload)) {
          parentFields[k] = toFirestoreValue((parentPayload as any)[k]);
        }
        await fetchWithTimeout(parentUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: parentFields }),
        }).catch(() => {});
      }
    } catch (syncErr) {
      console.error(`[Server Sync] Failed to sync child files to parent space:`, syncErr);
    }
  }

  return { success: true, cloudSynced: firestoreWorked };
}

export async function deleteChatAsync(chatId: string): Promise<boolean> {
  const sanitizedId = chatId.replace(/[^a-zA-Z0-9_\-]/g, "_");
  if (firebaseConfig) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/chats/${sanitizedId}?key=${firebaseConfig.apiKey}`;
      await fetchWithTimeout(url, { method: "DELETE" });
    } catch (fErr) {
      console.error(`[Firebase Storage] Chat Firestore delete error:`, fErr);
    }
  }
  const filePath = path.join(process.cwd(), "data", "chats", `${sanitizedId}.json`);
  try {
    if (await fileExistsAsync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (e) {
    console.error(`Failed to delete local chat file for ${sanitizedId}`, e);
  }
  return true;
}

// --- SYNC STATE PERSISTENCE ---

export async function getSyncStateAsync(envId: string, key: string): Promise<any> {
  const docId = `${envId}_${key}`.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 128);
  if (firebaseConfig) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/sync/${docId}?key=${firebaseConfig.apiKey}`;
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        const docJson = await response.json();
        const fields = docJson.fields || {};
        return fromFirestoreValue(fields.data);
      }
    } catch (fErr) {
      console.error(`[Firebase Storage] Sync Firestore read error:`, fErr);
    }
  }

  const filePath = path.join(process.cwd(), "data", "sync", `${docId}.json`);
  try {
    if (await fileExistsAsync(filePath)) {
      const raw = await fs.promises.readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return parsed.data || {};
    }
  } catch (e) {
    console.error(`Failed to read sync file for ${docId}`, e);
  }
  return {};
}

export async function saveSyncStateAsync(envId: string, key: string, data: any): Promise<boolean> {
  const docId = `${envId}_${key}`.replace(/[^a-zA-Z0-9_]/g, "_").substring(0, 128);
  const payload = { envId, key, data: data || {}, updatedAt: new Date().toISOString() };
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (response.ok) firestoreWorked = true;
    } catch (fErr) {
      console.error(`[Firebase Storage] Sync Firestore write error:`, fErr);
    }
  }

  const filePath = path.join(process.cwd(), "data", "sync", `${docId}.json`);
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (e) {
    console.error(`Failed to write sync file for ${docId}`, e);
  }

  return firestoreWorked;
}

// --- SHARD PERSISTENCE ---

export async function getShardAsync(slug: string): Promise<any | null> {
  if (firebaseConfig) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/shards/${slug}?key=${firebaseConfig.apiKey}`;
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        const docJson = await response.json();
        const fields = docJson.fields || {};
        const shard: any = {};
        for (const k of Object.keys(fields)) {
          shard[k] = fromFirestoreValue(fields[k]);
        }
        return shard;
      }
    } catch (e) {
      console.error(`[Firebase Storage] Shard Firestore read error:`, e);
    }
  }

  const filePath = path.join(process.cwd(), "data", "shards", `${slug}.json`);
  try {
    if (await fileExistsAsync(filePath)) {
      const raw = await fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`Failed to read shard file for ${slug}`, e);
  }

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

export async function saveShardAsync(slug: string, payload: any): Promise<boolean> {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (response.ok) firestoreWorked = true;
    } catch (e) {
      console.error(`[Firebase Storage] Shard Firestore write error:`, e);
    }
  }

  const filePath = path.join(process.cwd(), "data", "shards", `${slug}.json`);
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
  } catch (e) {
    console.error(`Failed to write shard file for ${slug}`, e);
  }

  return firestoreWorked;
}
