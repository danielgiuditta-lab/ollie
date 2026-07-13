import fs from 'fs';
import path from 'path';

interface FirebaseRestConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId: string;
}

async function wipe() {
  console.log("Starting DB wipe...");

  // 1. Wipe local flat-file storage
  const dataDir = path.join(process.cwd(), "data");
  if (fs.existsSync(dataDir)) {
    const subdirs = ["chats", "sync", "shards"];
    for (const sub of subdirs) {
      const dirPath = path.join(dataDir, sub);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          fs.unlinkSync(path.join(dirPath, file));
          console.log(`[Local] Deleted local file: data/${sub}/${file}`);
        }
      }
    }
    const legacyFiles = ["chats.json", "shards.json"];
    for (const leg of legacyFiles) {
      const legPath = path.join(dataDir, leg);
      if (fs.existsSync(legPath)) {
        fs.unlinkSync(legPath);
        console.log(`[Local] Deleted legacy file: data/${leg}`);
      }
    }
  }

  // 2. Wipe Firestore collection entries if config exists
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const config: FirebaseRestConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const collections = ["chats", "sync", "shards"];
      for (const coll of collections) {
        const listUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/${coll}?key=${config.apiKey}`;
        const resp = await fetch(listUrl);
        if (resp.ok) {
          const body = await resp.json();
          const docs = body.documents || [];
          for (const doc of docs) {
            const docName = doc.name; // full doc path name
            const delUrl = `https://firestore.googleapis.com/v1/${docName}?key=${config.apiKey}`;
            const delResp = await fetch(delUrl, { method: "DELETE" });
            if (delResp.ok) {
              console.log(`[Firestore] Deleted ${docName}`);
            } else {
              console.error(`[Firestore] Failed to delete ${docName}: status ${delResp.status}`);
            }
          }
        }
      }
    } catch (err) {
      console.error("[Firestore Wipe Error]", err);
    }
  }

  console.log("DB wipe completed successfully.");
}

wipe().catch(console.error);
