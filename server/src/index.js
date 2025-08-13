import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import './config/db.js';
import authRoutes from './routes/auth.js';
import folderRoutes from './routes/folders.js';
import imageRoutes from './routes/images.js';
import searchRoutes from './routes/search.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// CORS (allow credentials)
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true
}));

// Static: serve uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/images', searchRoutes); // /search

app.get('/', (req, res) => res.json({ status: 'ok', service: 'Dobby Drive API' }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
