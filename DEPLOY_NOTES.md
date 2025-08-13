# Dobby Drive – Deploy Notes (Cloudflare R2)

## What’s done
- Node.js + Express API with JWT auth (no Firebase)
- MongoDB for users/folders/images
- Nested folders (Google Drive–style)
- Image uploads to **Cloudflare R2** (S3-compatible) using `@aws-sdk/client-s3`
- User-specific access control and search by image name
- React front-end with login/signup/drive UI
- Ready-to-deploy config for:
  - **Render** (API) – `render.yaml`
  - **Vercel** (Web) – `web/vercel.json`

## Quick Start (Local)
```bash
# 1) API
cd server
cp .env.r2.sample .env              # uses your Cloudflare R2 creds
npm install
npm run seed                         # creates: test@dobbyads.com / Passw0rd!
npm run start                        # starts on http://localhost:4000

# 2) Web
cd ../web
npm install
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev                          # starts on http://localhost:5173
```

Login: **test@dobbyads.com** / **Passw0rd!**

## Cloudflare R2 Variables
- `AWS_ACCESS_KEY_ID` – your R2 access key id  
- `AWS_SECRET_ACCESS_KEY` – your R2 secret  
- `AWS_REGION=auto`  
- `S3_BUCKET` – e.g. `my-app-files`  
- `S3_ENDPOINT` – e.g. `https://<account-id>.r2.cloudflarestorage.com`  
- `S3_PUBLIC_URL` – e.g. `https://<account-id>.r2.cloudflarestorage.com/<bucket>` (or a custom CDN domain)

> **Note:** The server constructs public URLs as `${S3_PUBLIC_URL}/${key}` if provided,
> otherwise `${S3_ENDPOINT}/${S3_BUCKET}/${key}`.

## Deploy – API on Render
1. Push this repo to GitHub.
2. From Render, “New Web Service” → connect repo.
3. Root directory: `server`
4. Build: `npm install`
5. Start: `node src/index.js`
6. Set Environment Variables (all required):
   - `PORT=4000`
   - `MONGODB_URI=<your MongoDB connection string>`
   - `JWT_SECRET=<a strong secret>`
   - `CLIENT_ORIGIN=<your web URL>` (e.g., https://dobby-drive.vercel.app)
   - `USE_S3=true`
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION=auto`
   - `S3_BUCKET=my-app-files`
   - `S3_ENDPOINT=https://6e92df323be63936461a327ccad52857.r2.cloudflarestorage.com`
   - `S3_PUBLIC_URL=https://6e92df323be63936461a327ccad52857.r2.cloudflarestorage.com/my-app-files`

> After the API is live, copy its base URL for the web app.

## Deploy – Web on Vercel
1. Push this repo to GitHub.
2. Import `web` as a Vercel project.
3. Environment Variable:
   - `VITE_API_URL=<your Render API URL>`
4. Build Command: `npm run build`
5. Output Directory: `dist`

## Security
- Do **not** commit `.env` files.
- Rotate your R2 keys after testing (they’re included in `.env.r2.sample` for convenience).
