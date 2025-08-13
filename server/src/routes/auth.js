import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

function setTokenCookie(res, id) {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,      // important for HTTPS
    sameSite: 'none'   // required for cross-domain
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password });
    setTokenCookie(res, user._id);
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    setTokenCookie(res, user._id);
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(200).json(null);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('_id name email');
    res.json(user || null);
  } catch {
    res.json(null);
  }
});

export default router;
