import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload, saveFile } from '../utils/storage.js';
import Image from '../models/Image.js';
import Folder from '../models/Folder.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, folderId } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    if (!req.file) return res.status(400).json({ message: 'Image file required' });

    let folder = null;
    if (folderId) {
      folder = await Folder.findOne({ _id: folderId, deletedAt: null });
      if (!folder) return res.status(404).json({ message: 'Folder not found' });
      // must own the folder to upload
      if (String(folder.user) !== String(req.userId)) return res.status(403).json({ message: 'Not allowed' });
    }

    const stored = await saveFile(req.file);
    const img = await Image.create({
      name,
      user: req.userId,
      folder: folder ? folder._id : null,
      filename: stored.filename,
      url: stored.url
    });
    res.json(img);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    const img = await Image.findById(req.params.id);
    if (!img || img.deletedAt) return res.status(404).json({ message: 'Not found' });
    if (String(img.user) !== String(req.userId)) return res.status(403).json({ message: 'Owner only' });
    img.deletedAt = new Date();
    await img.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/restore/:id', requireAuth, async (req, res) => {
  try {
    const img = await Image.findById(req.params.id);
    if (!img) return res.status(404).json({ message: 'Not found' });
    if (String(img.user) !== String(req.userId)) return res.status(403).json({ message: 'Owner only' });
    img.deletedAt = null;
    await img.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/share/:id', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const img = await Image.findById(req.params.id);
    if (!img) return res.status(404).json({ message: 'Not found' });
    if (String(img.user) !== String(req.userId)) return res.status(403).json({ message: 'Owner only' });
    const target = await User.findOne({ email });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (!img.sharedWith.includes(target._id)) img.sharedWith.push(target._id);
    await img.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/unshare/:id', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const img = await Image.findById(req.params.id);
    if (!img) return res.status(404).json({ message: 'Not found' });
    if (String(img.user) !== String(req.userId)) return res.status(403).json({ message: 'Owner only' });
    const target = await User.findOne({ email });
    if (!target) return res.status(404).json({ message: 'User not found' });
    img.sharedWith = img.sharedWith.filter(u => String(u) !== String(target._id));
    await img.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
