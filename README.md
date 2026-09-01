# Service Provider Onboarding Portal

A full-stack MERN application for onboarding service providers — similar to Urban Company / ExtraHand. Providers register, complete profiles, upload documents, and submit applications. Admins review, approve, or reject applications with a polished dashboard.

## Features

- Provider registration and JWT authentication
- Google OAuth login
- Multi-step provider onboarding (profile, services, location, documents)
- Profile completion percentage tracking
- Local filesystem file uploads (profile photos + verification documents)
- Application status workflow (draft → submitted → under review → approved/rejected)
- Admin dashboard with statistics and Recharts visualizations
- Searchable, filterable, paginated provider list
- In-app notifications + Brevo email notifications
- Application status history timeline + admin audit logs
- Dark mode with persisted theme preference
- Swagger API docs at `/api/docs`
- Docker Compose setup with persistent volumes
- Backend Jest tests for critical flows

## Architecture

```
Browser → Frontend (React/Vite/nginx) → Backend (Express/Node) → MongoDB
                                              ↓
                                    Local uploads volume
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Recharts, Sonner, Lucide |
| Backend | Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, bcrypt, Passport Google OAuth, Multer, Brevo, Swagger |
| Infrastructure | Docker, Docker Compose, nginx, MongoDB |

## Project Structure

```
service-provider-portal/
├── frontend/          # React SPA
├── backend/           # Express API
├── docs/              # API documentation
├── postman/           # Postman collection
├── screenshots/       # Place screenshots here
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 20+
- npm
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)

## Environment Variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`:

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token expiry (e.g. 7d) |
| `CLIENT_URL` | Frontend URL for CORS/OAuth redirects |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL |
| `BREVO_API_KEY` | Brevo email API key |
| `BREVO_SENDER_EMAIL` | Sender email address |
| `BREVO_SENDER_NAME` | Sender display name |
| `ADMIN_NAME` | Seed admin name |
| `ADMIN_EMAIL` | Seed admin email |
| `ADMIN_PASSWORD` | Seed admin password |
| `UPLOAD_DIR` | Upload directory (default: uploads) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_GOOGLE_CLIENT_ID` | Google client ID (public) |

> **Never commit `.env` files or Google client secret JSON files.**

## Local Installation

### 1. Start MongoDB

Ensure MongoDB is running locally or set `MONGODB_URI` to Atlas.

### 2. Backend

```bash
cd backend
cp .env.example .env   # configure variables
npm install
npm run seed:categories
npm run seed:admin
npm run dev
```

API: http://localhost:5000  
Swagger: http://localhost:5000/api/docs

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:5173

## Docker Installation

### Step-by-step (local Docker)

1. **Install Docker Desktop** and make sure it is running.

2. **Go to the project root:**
   ```bash
   cd service-provider-portal
   ```

3. **Create a root `.env` file** (used by Compose for secrets):
   ```bash
   cat > .env << 'EOF'
   JWT_SECRET=change-this-to-a-long-random-secret
   ADMIN_NAME=Admin User
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=Admin@123456
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   BREVO_API_KEY=
   BREVO_SENDER_EMAIL=noreply@example.com
   BREVO_SENDER_NAME=Service Provider Portal
   EOF
   ```

4. **Build and start all services:**
   ```bash
   docker compose up --build
   ```

5. **Wait until healthy**, then seed categories + admin (new terminal):
   ```bash
   docker compose exec backend npm run seed
   ```

6. **Open the app:**
   | Service | URL |
   |---------|-----|
   | Frontend | http://localhost:3000 |
   | Backend API | http://localhost:5000 |
   | Swagger | http://localhost:5000/api/docs |
   | Admin login | http://localhost:3000/admin/login |

7. **Useful commands:**
   ```bash
   docker compose up --build -d   # run in background
   docker compose logs -f         # follow logs
   docker compose down            # stop (keeps DB + uploads)
   docker compose down -v         # stop AND delete DB + uploads
   ```

### Persistent volumes

- `mongodb_data` → database
- `backend_uploads` → `/app/uploads` (profile photos + documents)

**Warning:** `docker compose down -v` permanently deletes data and files.

---

## Deployment

Frontend, backend, and MongoDB can be deployed separately.

### Recommended production layout

| Piece | Where to host | Notes |
|-------|----------------|-------|
| Frontend | Vercel / Netlify / nginx VPS | Build with `VITE_API_URL` pointing to your public API |
| Backend | Railway / Render / Fly.io / VPS | Set all env vars; expose HTTPS |
| MongoDB | MongoDB Atlas | Use Atlas URI as `MONGODB_URI` |
| Uploads | Local disk / volume on the backend host | This assignment uses **local filesystem** storage |

### Deploy backend

1. Push the `backend/` app to your host.
2. Set environment variables (same as `backend/.env.example`), including:
   - `MONGODB_URI` → Atlas connection string
   - `JWT_SECRET` → strong secret
   - `CLIENT_URL` → your frontend URL (e.g. `https://your-app.vercel.app`)
   - `GOOGLE_CALLBACK_URL` → `https://api.yourdomain.com/api/auth/google/callback`
   - Brevo + Admin vars as needed
3. Build & start:
   ```bash
   npm ci
   npm run build
   npm run seed
   npm start
   ```
4. Ensure a persistent disk/volume is mounted at `uploads/` so files survive restarts.
5. Add Google OAuth redirect URI for your production callback URL.

### Deploy frontend

1. Set build-time env:
   ```bash
   VITE_API_URL=https://api.yourdomain.com/api
   ```
2. Build:
   ```bash
   cd frontend
   npm ci
   npm run build
   ```
3. Deploy the `dist/` folder (Vercel/Netlify) or serve with nginx.

### Deploy with Docker on a VPS

```bash
# On the server
git clone <your-repo>
cd service-provider-portal

# Create .env with production secrets + public URLs
# Update docker-compose.yml CLIENT_URL and VITE_API_URL to your domains

docker compose up --build -d
docker compose exec backend npm run seed
```

Point DNS:
- `yourdomain.com` → frontend (port 80/443 via reverse proxy)
- `api.yourdomain.com` → backend (port 5000 via reverse proxy)

Use **Caddy** or **nginx** for HTTPS reverse proxy in front of the containers.

### Production note on file storage

Uploads are stored on the backend filesystem (`uploads/`). That is required for this assignment. For multi-instance horizontal scaling later, you would need shared storage (NFS/EFS) — do **not** switch to S3/Cloudinary for this project.

## Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API / OAuth credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URIs:
   - Local: `http://localhost:5000/api/auth/google/callback`
   - Docker: same (backend exposed on port 5000)
5. Copy Client ID and Client Secret to `backend/.env`
6. Optionally set `VITE_GOOGLE_CLIENT_ID` in frontend (public ID only)

If you have a `client_secret_*.json` file, extract `client_id` and `client_secret` into environment variables. **Do not commit the JSON file.**

## Brevo Email Setup

1. Create account at [Brevo](https://www.brevo.com/)
2. Generate an API key
3. Verify sender email/domain
4. Set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` in backend `.env`

Emails are sent for: registration, submission, review, approval, rejection, resubmission. Failures are logged but do not crash the app.

## Admin Setup

```bash
cd backend
npm run seed:admin
```

Default credentials (from `.env.example`):
- Email: `admin@example.com`
- Password: `Admin@123456`

Admin login: http://localhost:5173/admin/login

## API Documentation

- **Swagger UI:** http://localhost:5000/api/docs
- **OpenAPI JSON:** http://localhost:5000/api/docs.json
- **Markdown docs:** `docs/API_DOCUMENTATION.md`

## Postman

Import `postman/Service-Provider-Onboarding.postman_collection.json`

Variables: `baseUrl`, `token`, `adminToken`, `providerToken`

## File Storage

Files are stored locally on the backend filesystem:

```
backend/uploads/
├── profiles/     # Profile photos (JPG/PNG/WEBP, max 5MB)
└── documents/    # Verification docs (PDF/JPG/PNG, max 10MB)
```

Files are served through authenticated API endpoints — the uploads directory is not publicly exposed.

## Security

- Helmet, CORS, rate limiting
- bcrypt password hashing
- JWT with expiry + auto logout
- RBAC (provider/admin)
- Input validation (Zod) on frontend and backend
- File type/size validation, path traversal prevention
- Protected document access
- Secrets via environment variables only

## Screenshots

Place screenshots in the `screenshots/` directory. See `screenshots/README.md` for the recommended list.

## Demo Video (Suggested Flow)

| Time | Content |
|------|---------|
| 0:00 | Introduction |
| 0:20 | Provider registration |
| 0:45 | Google login |
| 1:00 | Complete profile |
| 1:30 | Upload documents |
| 1:50 | Submit application |
| 2:10 | Admin dashboard |
| 2:30 | Search/filter providers |
| 2:50 | Review documents |
| 3:10 | Reject application |
| 3:30 | Provider sees rejection |
| 3:50 | Resubmit |
| 4:10 | Approve |
| 4:30 | Statistics, dark mode, Swagger |

## Future Improvements

- Shared/cloud storage adapter for production scaling
- Real-time notifications via WebSockets
- Provider availability scheduling
- Payment integration
- Mobile app (React Native)
- E2E tests with Playwright

## License

MIT
