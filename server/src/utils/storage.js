import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// We still read USE_S3 to decide between local disk and object storage.
// When true, we will use Cloudflare R2 (S3-compatible) per env vars.
const useS3 = String(process.env.USE_S3 || '').toLowerCase() === 'true';

let s3 = null;
if (useS3) {
  // Cloudflare R2 is S3-compatible. Use endpoint + 'auto' region.
  // Required env:
  // - AWS_ACCESS_KEY_ID
  // - AWS_SECRET_ACCESS_KEY
  // - S3_BUCKET
  // - S3_ENDPOINT (e.g., https://<accountid>.r2.cloudflarestorage.com)
  // Optional:
  // - S3_PUBLIC_URL (e.g., https://<accountid>.r2.cloudflarestorage.com/<bucket> OR a custom/public domain)
  s3 = new S3Client({
    region: process.env.AWS_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true, // required for R2 path-style URLs
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

const memoryStorage = multer.memoryStorage();
export const upload = multer({ storage: memoryStorage });

// Save to local uploads/ (for dev) or to R2 if USE_S3=true
export async function saveFile(file) {
  if (!file) throw new Error('No file provided');
  if (!useS3) {
    // Local dev save
    const ext = path.extname(file.originalname || '');
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const finalPath = path.join(uploadDir, name);
    fs.writeFileSync(finalPath, file.buffer);
    return { filename: name, url: `/uploads/${name}` };
  }

  // R2 upload
  const ext = path.extname(file.originalname || '');
  const key = `uploads/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const bucket = process.env.S3_BUCKET;
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));
  // If S3_PUBLIC_URL is provided, prefer it; else construct from endpoint + bucket
  const base = (process.env.S3_PUBLIC_URL && process.env.S3_PUBLIC_URL.trim().length > 0)
    ? process.env.S3_PUBLIC_URL.replace(/\/$/, '')
    : `${process.env.S3_ENDPOINT.replace(/\/$/, '')}/${bucket}`;
  return { filename: key, url: `${base}/${key}` };
}
