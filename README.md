# Chatting App - Full Stack Real-Time Chat Application

A modern real-time chat application built with React, Express.js, Socket.io, and MongoDB. Features authentication via Clerk, real-time messaging with WebSocket support, and media sharing capabilities.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery using Socket.io
- **User Authentication**: Secure authentication via Clerk
- **Online Status**: See which users are currently online
- **Media Sharing**: Upload and share images and videos
- **Conversation History**: Browse and load message history
- **Responsive Design**: Beautiful UI with HeroUI components and Tailwind CSS
- **Dark/Light Theme**: Customizable theme with wallpaper backgrounds
- **Production Ready**: Docker support for easy deployment

## 📋 Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **HeroUI** - Component library
- **Socket.io Client** - Real-time communication
- **Zustand** - State management
- **Clerk** - Authentication
- **React Router** - Routing
- **Axios** - HTTP client

### Backend
- **Express.js 5** - Node.js framework
- **Socket.io** - WebSocket server
- **MongoDB** - Database
- **Mongoose** - ODM
- **Multer** - File upload handling
- **Clerk** - Authentication
- **ImageKit** - Media storage (optional)
- **Node Cron** - Scheduled tasks

## 📦 Installation

### Prerequisites
- Node.js 20+
- MongoDB (local or cloud)
- Clerk account (https://clerk.com)

### Environment Setup

1. **Backend Environment** 
   ```bash
   cd Backend
   cp .env.example .env
   ```
   Configure with your values:
   - `MONGO_URI`: MongoDB connection string
   - `CLERK_WEBHOOK_SIGNING_SECRET`: From Clerk dashboard
   - Optional: ImageKit keys for media uploads

2. **Frontend Environment**
   ```bash
   cd Frontend
   cp .env.example .env
   ```
   Configure:
   - `VITE_CLERK_PUBLISHABLE_KEY`: From Clerk dashboard

### Installation

```bash
# Backend
cd Backend
npm install

# Frontend (in another terminal)
cd Frontend
npm install
```

## 🏃 Running Locally

### Development Mode

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
```
Runs on http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```
Runs on http://localhost:5173

### Production Build

```bash
# Backend
cd Backend
npm run build
npm start

# Frontend
cd Frontend
npm run build
npm run preview
```

## 🐳 Docker Deployment

Build and run with Docker:

```bash
# Build image
docker build -t chatting-app:latest \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=your_key_here \
  .

# Run container
docker run -d \
  -p 3001:3001 \
  -e MONGO_URI=your_mongodb_uri \
  -e CLERK_WEBHOOK_SIGNING_SECRET=your_secret \
  -e NODE_ENV=production \
  -e FRONTEND_URL=https://yourdomain.com \
  chatting-app:latest
```

## 📁 Project Structure

```
chatting-app/
├── Backend/
│   ├── src/
│   │   ├── index.js              # Main server entry
│   │   ├── controllers/          # Route handlers
│   │   ├── routes/               # API routes
│   │   ├── middleware/           # Custom middleware
│   │   ├── models/               # Mongoose schemas
│   │   ├── lib/                  # Utilities (socket, db, etc)
│   │   └── webhooks/             # Clerk webhook handler
│   ├── scripts/build.js          # Build script
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   ├── App.jsx               # Root component
│   │   ├── pages/                # Page components
│   │   ├── components/           # Reusable components
│   │   ├── store/                # Zustand stores
│   │   ├── context/              # React context
│   │   ├── lib/                  # Utilities
│   │   ├── hooks/                # Custom hooks
│   │   └── data/                 # Static data
│   ├── public/                   # Static files
│   ├── vite.config.js
│   └── package.json
│
├── Dockerfile                    # Multi-stage Docker build
├── .dockerignore
├── DEPLOYMENT.md                 # Deployment guide
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/check` - Check authentication status

### Messages
- `GET /api/messages/users` - Get all users
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:id` - Get messages with user
- `POST /api/messages/send/:id` - Send message

### Health
- `GET /health` - Health check endpoint

## 🎯 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017/chatting-app
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CLERK_WEBHOOK_SIGNING_SECRET=your_secret
IMAGEKIT_PUBLIC_KEY=optional
IMAGEKIT_PRIVATE_KEY=optional
IMAGEKIT_URL_ENDPOINT=optional
```

### Frontend (.env)
```
VITE_CLERK_PUBLISHABLE_KEY=your_key
VITE_API_URL=           # Empty for same-host in production
```

## 🔐 Security Features

- JWT authentication via Clerk
- CORS protection
- Secure WebSocket connections
- File upload validation
- Rate limiting ready
- Environment variable management
- Webhook signature verification

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | Change `PORT` env variable |
| MongoDB connection error | Verify `MONGO_URI` and MongoDB is running |
| Clerk auth not working | Check `CLERK_WEBHOOK_SIGNING_SECRET` matches |
| WebSocket connection fails | Verify `FRONTEND_URL` matches deployment domain |
| Image upload not working | Set `IMAGEKIT_*` environment variables |

## 📊 Performance Notes

- Frontend: Vite with code splitting and optimization
- Backend: Express with static file caching
- Database: MongoDB with indexed queries
- WebSocket: Socket.io with connection pooling
- Cron Job: Health check every 14 minutes

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📜 License

ISC

## 📞 Support

For deployment help, see [DEPLOYMENT.md](DEPLOYMENT.md)

For development questions, check the code comments and structure.

---

**Ready to Deploy?** Check out [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.
