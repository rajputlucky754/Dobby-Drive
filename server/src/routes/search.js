import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Image from '../models/Image.js';

const router = express.Router();

router.get('/search', requireAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const uid = req.userId;
    const results = await Image.find({
      deletedAt: null,
      name: { $regex: q, $options: 'i' },
      $or: [{ user: uid }, { sharedWith: uid }]
    }).sort({ createdAt: -1 }).limit(50);
    res.json(results);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
