<div align="center">
  <img src="Frontend/public/logo.png" alt="Shadowtalk Logo" width="100" />
  <h1>Shadowtalk</h1>
  <p><strong>Private · Anonymous · Real-Time Full-Stack Messaging</strong></p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#%EF%B8%8F-architecture">Architecture</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-quick-start-local-development">Quick Start</a> •
    <a href="#-docker-deployment">Docker</a> •
    <a href="#-api-reference">API</a>
  </p>

  ![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
  ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
  ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
  ![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white)
  ![Docker](https://img.shields.io/badge/Docker-Multistage-2496ED?logo=docker&logoColor=white)
  ![License](https://img.shields.io/badge/License-ISC-blue)
</div>

---

**Shadowtalk** is a privacy-first, real-time anonymous chat application built as a **monolithic Docker image** — Vite React SPA served by the same Express server powering the API, WebSocket layer, and temporary conversation matchmaking.

> *"Talk freely. Stay anonymous. No judgment, no permanent history."*

---

## Features

| Category | Details |
|---|---|
| 🥷 **Anonymous Identity** | Auto-generated disposable usernames & private sessions |
| 💬 **Real-time Messaging** | Instant delivery & live typing indicators via Socket.io WebSockets |
| 🤝 **Lobby & Requests** | Discover available users, send chat requests, accept/decline in real time |
| 🔐 **Authentication** | Passwordless auth powered by [Clerk](https://clerk.com) |
| 🟢 **Online Presence** | Live online/offline status in the anonymous lobby |
| 🖼️ **Media Sharing** | Upload and share images & attachments securely |
| 🎨 **Customization** | Glassmorphic UI with dynamic wallpapers, theme presets & dark/light toggle |
| 🐳 **Docker Ready** | 3-stage optimized build, single lean container deployment |
| ⏰ **Health Cron** | Self-ping every 14 min — keeps free-tier hosts awake |

---

## 🏗️ Architecture

```
Browser
  │
  │  HTTP (static SPA + /api/*)
  ▼
Express (port 3001)
  ├── /api/auth/*      → Clerk JWT validation
  ├── /api/messages/*  → Message & user controllers
  ├── /health          → Health check
  ├── /webhooks/clerk  → Clerk user sync webhook
  ├── Socket.io        → Real-time events (message, online users)
  └── /public          → Vite-built static files
        │
        └── React SPA (React 19, HeroUI, Zustand, React Router)

MongoDB Atlas  ←→  Mongoose ODM
ImageKit CDN   ←→  Multer upload middleware
```

---

## 📦 Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool (Rolldown bundler) |
| Tailwind CSS | 4 | Utility-first styling |
| HeroUI | 3 | Component library |
| Socket.io-client | 4 | Real-time communication |
| Zustand | 5 | Global state management |
| Clerk React | 6 | Authentication UI |
| React Router | 8 | Client-side routing |
| Axios | 1 | HTTP client |
| Lucide React | — | Icon set |

### Backend
| Package | Version | Purpose |
|---|---|---|
| Express | 5 | HTTP server & API |
| Socket.io | 4 | WebSocket server |
| Mongoose | 9 | MongoDB ODM |
| @clerk/express | 2 | Server-side JWT auth |
| Multer | 2 | File upload middleware |
| @imagekit/nodejs | 7 | Media CDN uploads |
| cron | 4 | Scheduled health pings |
| dotenv | 17 | Environment config |

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** ≥ 20
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Clerk** account — [clerk.com](https://clerk.com) (free tier works)

### 1 — Clone & install

```bash
git clone <your-repo-url>
cd shadowtalk

# Backend
cd Backend && npm install

# Frontend (new terminal)
cd ../Frontend && npm install
```

### 2 — Configure environment variables

**Backend** — create `Backend/.env`:

```env
# Required
MONGO_URI=mongodb://localhost:27017/shadowtalk
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxxxxxxxxxx

# Optional (defaults shown)
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional — ImageKit media CDN
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

**Frontend** — create `Frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Leave empty in production (API is on the same host)
VITE_API_URL=http://localhost:3000
```

### 3 — Run in development

```bash
# Terminal 1 — API server (http://localhost:3000)
cd Backend
npm run dev

# Terminal 2 — Vite dev server (http://localhost:5173)
cd Frontend
npm run dev
```

> The frontend proxies `/api` and socket traffic to the backend automatically.

---

## 🐳 Docker Deployment

The included `Dockerfile` uses a **3-stage build**:

| Stage | Base image | What it does |
|---|---|---|
| `frontend-build` | `node:22-bookworm-slim` | Installs deps, runs `vite build` |
| `backend-build` | `node:22-bookworm-slim` | Installs deps, copies `src/` → `dist/` |
| `runner` | `node:22-bookworm-slim` | Prod-only deps + built assets, exposes **3001** |

### Build the image

```bash
docker build \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxx \
  -t shadowtalk:latest \
  .
```

### Run the container

```bash
docker run -d \
  -p 3001:3001 \
  -e MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/shadowtalk" \
  -e CLERK_WEBHOOK_SIGNING_SECRET="whsec_xxxxxxxxx" \
  -e NODE_ENV=production \
  -e FRONTEND_URL="https://yourdomain.com" \
  --name shadowtalk \
  shadowtalk:latest
```

The app will be available at **http://localhost:3001**.

---

## ☁️ Deploy to Render

1. Push your code to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set **Environment** → `Docker`.
4. Add the following **Build-time** argument:
   - `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk publishable key
5. Add the following **Environment Variables** (runtime):

   | Key | Value |
   |---|---|
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `CLERK_WEBHOOK_SIGNING_SECRET` | From Clerk dashboard → Webhooks |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | Your Render service URL |

6. Set the **Health Check Path** to `/health`.

> See [DEPLOYMENT.md](DEPLOYMENT.md) for the full step-by-step checklist.

---

## 🔌 API Reference

### Auth & Users
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/auth/check` | Returns authenticated user & anonymous identity |
| `GET` | `/api/users` | List available users in lobby |

### Requests & Messages
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/chat-requests/send` | Send a chat connection request |
| `POST` | `/api/chat-requests/respond` | Accept / reject an incoming request |
| `GET` | `/api/messages/:userId` | Fetch session conversation history |
| `POST` | `/api/messages/send/:userId` | Send anonymous message (text / media) |

### System
| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Health check — returns `200 OK` |
| `POST` | `/webhooks/clerk` | Clerk user-sync webhook (Svix signed) |

### Socket.io Events
| Event | Direction | Payload |
|---|---|---|
| `incomingChatRequest` | Server → Client | Chat request object |
| `chatRequestResponse` | Server → Client | Accepted / declined status |
| `newMessage` | Server → Client | Real-time message object |
| `getOnlineUsers` | Server → Client | `string[]` of online user IDs |

---

## 📁 Project Structure

```
shadowtalk/
├── Backend/
│   ├── src/
│   │   ├── index.js              # Server entry — Express + Socket.io setup
│   │   ├── controllers/          # Business logic (auth, messages)
│   │   ├── routes/               # Route definitions
│   │   ├── middleware/           # Auth guards, upload handling
│   │   ├── models/               # Mongoose schemas (User, Message)
│   │   ├── lib/                  # DB connection, Socket.io singleton
│   │   └── webhooks/             # Clerk webhook handler
│   ├── scripts/build.js          # Custom build script (copies src → dist)
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   ├── App.jsx               # Root component + route tree
│   │   ├── pages/                # Route-level page components
│   │   ├── components/           # Reusable UI components
│   │   ├── store/                # Zustand state stores
│   │   ├── context/              # React context providers
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Axios instance, utilities
│   │   ├── data/                 # Static data / constants
│   │   └── styles/               # Global CSS / theme tokens
│   ├── public/                   # Static assets (favicon, etc.)
│   ├── vite.config.js            # Vite + Rolldown build config
│   └── package.json
│
├── Dockerfile                    # Multi-stage production build
├── .dockerignore
├── DEPLOYMENT.md                 # Render / Docker deployment guide
└── README.md
```

---

## 🔐 Security

- **Clerk JWT** validation on every protected API route
- **Webhook signature verification** via Svix (prevents spoofed user events)
- **CORS** locked to `FRONTEND_URL` in production
- **File upload validation** through Multer (type & size limits)
- **Non-root Docker user** — container runs as `node` user
- Environment secrets never baked into the image at runtime

---

## 🐛 Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `EADDRINUSE: port 3000` | Another process on the port | Set a different `PORT` in `.env` |
| `MongoServerSelectionError` | Bad connection string or IP not whitelisted | Check `MONGO_URI`; whitelist your IP in Atlas |
| Clerk redirects loop | Wrong publishable key | Verify `VITE_CLERK_PUBLISHABLE_KEY` |
| Webhook 400 errors | Wrong signing secret | Copy secret from Clerk → Webhooks tab |
| WebSocket disconnects | `FRONTEND_URL` mismatch | Set `FRONTEND_URL` to exact deployed domain |
| Images not uploading | ImageKit keys missing | Add `IMAGEKIT_*` env vars |
| Docker build fails (`@react-aria/utils`) | Missing peer dependency | Ensure `@react-aria/utils` is in `package.json`, then re-run `npm install` |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📜 License

Distributed under the **ISC License**.

---

<div align="center">
  <strong>Ready to deploy?</strong> Follow the step-by-step guide in <a href="DEPLOYMENT.md">DEPLOYMENT.md</a>
</div>
