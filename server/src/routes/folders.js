import express from 'express';
import Folder from '../models/Folder.js';
import Image from '../models/Image.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function hasAccess(folder, userId) {
  return String(folder.user) === String(userId) || (folder.sharedWith || []).some(u => String(u) === String(userId));
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    let path = [];
    let parent = null;
    if (parentId) {
      parent = await Folder.findOne({ _id: parentId, deletedAt: null });
      if (!parent) return res.status(404).json({ message: 'Parent not found' });
      if (String(parent.user) !== String(req.userId)) return res.status(403).json({ message: 'Owner only' });
      path = [...(parent.path || []), parent._id];
    }
    const folder = await Folder.create({ name, user: req.userId, parent: parent || null, path });
    res.json(folder);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ message: 'Folder with same name already exists here' });
    }
    res.status(500).json({ message: e.message });
  }
});

router.get('/root', requireAuth, async (req, res) => {
  try {
    const uid = req.userId;
    const folders = await Folder.find({
      deletedAt: null,
      parent: null,
      $or: [{ user: uid }, { sharedWith: uid }]
    }).sort({ name: 1 });
    const images = await Image.find({
      deletedAt: null,
      folder: null,
      $or: [{ user: uid }, { sharedWith: uid }]
    }).sort({ createdAt: -1 });
    res.json({ folders, images });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/breadcrumbs/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await Folder.findOne({ _id: id, deletedAt: null });
    if (!folder) return res.status(404).json({ message: 'Not found' });
    const owner = String(folder.user) === String(req.userId);
    if (!owner && !(folder.sharedWith || []).some(u => String(u) === String(req.userId))) {
      return res.status(403).json({ message: 'No access' });
    }
    if (!owner) {
      // For shared viewers, show only the current folder as breadcrumb start.
      return res.json([{ _id: folder._id, name: folder.name }]);
    }
    const crumbs = await Folder.find({ _id: { $in: folder.path }, deletedAt: null }).select('_id name').lean();
    const ordered = folder.path.map(fid => crumbs.find(c => String(c._id) == String(fid))).filter(Boolean);
    res.json([...ordered, { _id: folder._id, name: folder.name }]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const current = await Folder.findOne({ _id: id, deletedAt: null });
    if (!current) return res.status(404).json({ message: 'Not found' });
    if (!hasAccess(current, req.userId)) return res.status(403).json({ message: 'No access' });

    const folders = await Folder.find({ parent: id, deletedAt: null }).sort({ name: 1 });
    const images = await Image.find({ folder: id, deletedAt: null }).sort({ createdAt: -1 });
    res.json({ current, folders, images });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/share/:id', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Not found' });
    if (String(folder.user) !== String(req.userId)) return res.status(403).json({ message: 'Owner only' });
    const target = await User.findOne({ email });
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (!folder.sharedWith.includes(target._id)) folder.sharedWith.push(target._id);
    await folder.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/unshare/:id', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Not found' });
    if (String(folder.user) !== String(req.userId)) return res.status(403).json({ message: 'Owner only' });
    const target = await User.findOne({ email });
    if (!target) return res.status(404).json({ message: 'User not found' });
    folder.sharedWith = folder.sharedWith.filter(u => String(u) !== String(target._id));
    await folder.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/delete/:id', requireAuth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder || folder.deletedAt) return res.status(404).json({ message: 'Not found' });
    if (String(folder.user) !== String(req.userId)) return res.status(403).json({ message: 'Owner only' });
    folder.deletedAt = new Date();
    await folder.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/restore/:id', requireAuth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Not found' });
    if (String(folder.user) !== String(req.userId)) return res.status(403).json({ message: 'Owner only' });
    folder.deletedAt = null;
    await folder.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
