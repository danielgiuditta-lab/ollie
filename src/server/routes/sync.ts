import { Router } from 'express';
import { getSyncStateAsync, saveSyncStateAsync } from '../storage/storageService';

export const syncRouter = Router();

// POST /api/sync/:envId/:key
syncRouter.post('/:envId/:key', async (req, res) => {
  try {
    const { envId, key } = req.params;
    const { data } = req.body;
    const cloudSynced = await saveSyncStateAsync(envId, key, data);
    res.json({ success: true, cloudSynced });
  } catch (error) {
    console.error("Sync write error:", error);
    res.status(500).json({ error: String(error) });
  }
});

// GET /api/sync/:envId/:key
syncRouter.get('/:envId/:key', async (req, res) => {
  try {
    const { envId, key } = req.params;
    const value = await getSyncStateAsync(envId, key);
    res.json({ data: value });
  } catch (error) {
    console.error("Sync read error:", error);
    res.status(500).json({ error: String(error) });
  }
});
