import { Router } from 'express';
import { getShardAsync, saveShardAsync } from '../storage/storageService';

export const shareRouter = Router();

// POST /api/share
shareRouter.post('/', async (req, res) => {
  try {
    const { envId, workspaceName, owner, ownerId, files } = req.body;
    if (!envId) {
      return res.status(400).json({ error: "envId is required to share" });
    }

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

    const cloudSynced = await saveShardAsync(slug, payload);
    res.json({ success: true, slug, cloudSynced });
  } catch (error) {
    console.error("Share endpoint error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/share/:slug
shareRouter.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const shard = await getShardAsync(slug);
    if (shard) {
      return res.json(shard);
    }
    res.status(404).json({ error: "Share link not found or expired" });
  } catch (error) {
    console.error("Share lookup error:", error);
    res.status(500).json({ error: String(error) });
  }
});
