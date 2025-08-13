# Dobby Drive — Nested Folders + Image Upload (Node.js + React + MongoDB)

A production-ready assignment solution for Dobby Ads.

## Features
- User auth in **Node.js** (Express + JWT in httpOnly cookie). No Firebase.
- **Signup / Login / Logout**.
- **Create nested folders** (like Google Drive).
- **Upload images** into folders (name + file via `multer`). Files stored on server.
- **User isolation**: users see only their data.
- **Search images** by name (user-scoped).
- **Deployed-ready**: clean CORS, envs, static file serving.
- **MongoDB** with Mongoose models.
- **React** front-end (Vite + React Router + React Query + Axios).

## Monorepo Layout
```
dobby-drive/
  server/               # Node/Express API
  web/                  # React front-end (Vite)
```

---

## Quick Start (Local)

### 1) Back-end
```bash
cd server
cp .env.example .env
# Update MONGODB_URI and JWT_SECRET
npm install
npm run dev
```
The API will run at `http://localhost:4000` and serve images at `/uploads/...`.

### 2) Front-end
```bash
cd web
cp .env.example .env
# Set VITE_API_URL=http://localhost:4000
npm install
npm run dev
```
Open the shown local URL (usually `http://localhost:5173`).

### Sample Test Flow
1. **Signup** a new account.
2. **Login**; you'll get an httpOnly cookie.
3. Create a **root or nested folder**.
4. **Upload** an image (name + file).
5. **Search** for it by typing its name.

---

## Deployment Notes

- **MongoDB**: Use MongoDB Atlas, copy connection string into `server/.env` as `MONGODB_URI`.
- **Back-end (Render/Railway/VPS)**:
  - Set env: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`.
  - Ensure persistent `/uploads` directory (or wire S3 in `storage.js` later if needed).
- **Front-end (Vercel/Netlify)**:
  - Set `VITE_API_URL` to your API URL (e.g., `https://api.yourdomain.com`).

> Provide two demo users in your submission (you can create from the UI):  
> - Email: `demo@dobby.test` / Password: `Demo@1234`  
> - Email: `demo2@dobby.test` / Password: `Demo@1234`

---

## API Overview

### Auth
- `POST /api/auth/signup`  `{name, email, password}`
- `POST /api/auth/login`   `{email, password}`
- `POST /api/auth/logout`
- `GET  /api/auth/me`      -> current user

### Folders
- `POST /api/folders`      `{name, parentId?}`
- `GET  /api/folders/root` -> root nodes (folders + images in root)
- `GET  /api/folders/:id`  -> children of folder + images inside
- `GET  /api/folders/breadcrumbs/:id` -> breadcrumb array

### Images
- `POST /api/images` (multipart) `fields: name, folderId?`, file field: `image`
- `GET  /api/images/search?q=...`

All endpoints are **user-scoped** via JWT cookie.

---

## Credentials to share with HR
After deploy, share:
- App URL: (your Netlify/Vercel link)
- API base: (your Render/Railway link)
- Demo creds:
  - `demo@dobby.test` / `Demo@1234`
  - `demo2@dobby.test` / `Demo@1234`


---

## Extra Features Added
- **S3 storage option** (toggle with `USE_S3=true`). Env vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `S3_PUBLIC_URL` (optional).
- **Soft delete & restore** for folders and images.
- **Drag & drop upload** on the front-end.
- **Folder sharing** by email (read-only) — a share gives the recipient visibility to that folder + its descendants and images within.
- **Deploy Manifests**:
  - `render.yaml` (Root) — API on Render, Web on Render Static.
  - `server/Dockerfile` — containerize API.
  - `web/vercel.json` — easy deploy to Vercel.

### New API Endpoints
- `POST /api/folders/share/:id`  `{ email }` (owner only)
- `POST /api/folders/unshare/:id`  `{ email }` (owner only)
- `POST /api/folders/delete/:id`  (owner only, soft delete)
- `POST /api/folders/restore/:id` (owner only)
- `POST /api/images/delete/:id`   (owner only)
- `POST /api/images/restore/:id`  (owner only)

### Environment (server)
Add these to `server/.env` if using S3:
```
USE_S3=true
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET=your-bucket
# If your bucket is private but serves via CDN / website endpoint:
S3_PUBLIC_URL=https://your-bucket.s3.amazonaws.com
```


## Cloudflare R2 Switch

The project is configured to store uploads in **Cloudflare R2** instead of AWS S3.
See `server/src/utils/storage.js`, `server/.env.example`, and `DEPLOY_NOTES.md`
for the exact environment variables and deployment steps.

Default demo credentials (after running `npm run seed`):

- Email: `test@dobbyads.com`
- Password: `Passw0rd!`
