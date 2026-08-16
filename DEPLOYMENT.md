# Deployment Guide

## Overview
This is a monolithic application with:
- **Frontend**: React + Vite (builds to static files)
- **Backend**: Express.js + Socket.io (API + WebSocket server)
- **Database**: MongoDB
- **Auth**: Clerk
- **Storage**: ImageKit (optional, for media uploads)

The Docker configuration builds both and serves them as a single application.

## Local Development Setup

### Prerequisites
- Node.js 20+
- MongoDB running locally or accessible MongoDB URI
- Clerk account with API keys

### Environment Setup

1. **Backend (.env)**
   ```bash
   cp Backend/.env.example Backend/.env
   ```
   Fill in:
   - `MONGO_URI`: Your MongoDB connection string
   - `CLERK_WEBHOOK_SIGNING_SECRET`: From Clerk dashboard
   - `IMAGEKIT_*`: Optional, for image/video uploads

2. **Frontend (.env)**
   ```bash
   cp Frontend/.env.example Frontend/.env
   ```
   Fill in:
   - `VITE_CLERK_PUBLISHABLE_KEY`: From Clerk dashboard

### Installation & Running

```bash
# Backend
cd Backend
npm install
npm run dev          # Development mode
npm run build        # Build for production
npm start            # Production mode

# Frontend (separate terminal)
cd Frontend
npm install
npm run dev          # Development mode
npm run build        # Build for production
npm run preview      # Preview production build
```

## Production Deployment

### Using Docker (Recommended)

The Docker configuration automatically:
1. Builds the React frontend to static files
2. Builds the Node.js backend
3. Serves both from a single Node.js container

**Build the image:**
```bash
docker build -t chatting-app:latest \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=your_key_here \
  .
```

**Run the container:**
```bash
docker run -d \
  -p 3001:3001 \
  -e MONGO_URI=your_mongodb_uri \
  -e CLERK_WEBHOOK_SIGNING_SECRET=your_secret \
  -e NODE_ENV=production \
  -e FRONTEND_URL=https://yourdomain.com \
  chatting-app:latest
```

### Required Environment Variables for Production

```
MONGO_URI                        # MongoDB connection string
CLERK_WEBHOOK_SIGNING_SECRET     # Clerk webhook secret
NODE_ENV=production              # Set to production
PORT=3001                        # Container port
FRONTEND_URL=https://yourdomain.com  # Your deployed domain
```

### Optional Environment Variables

```
IMAGEKIT_PUBLIC_KEY              # For image/video uploads
IMAGEKIT_PRIVATE_KEY
IMAGEKIT_URL_ENDPOINT
```

## Pre-Deployment Checklist

- [ ] All `.env` files configured with production values
- [ ] MongoDB database set up and accessible
- [ ] Clerk API keys obtained
- [ ] Backend routes tested (`/api/auth/check`, `/api/messages/*`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] WebSocket connection works (Socket.io)
- [ ] Image/video uploads tested (if using ImageKit)
- [ ] CORS configured correctly for production domain

## Deployment Platforms

### Render.com
1. Connect GitHub repo
2. Create new Web Service
3. Set environment variables
4. Build command: `npm run build` (Backend)
5. Start command: `npm start`

### Railway.app
1. Connect GitHub repo
2. Configure environment variables
3. Deploy with Railway CLI or dashboard

### Heroku / Other Platforms
1. Set all environment variables
2. Use the `npm start` script
3. Ensure MongoDB is externally hosted

## Monitoring & Maintenance

### Health Check
The app provides a health endpoint:
```
GET /health
```
Returns: `{ "ok": true }`

### Logs
- Check container logs for errors
- Monitor database connection status
- Verify WebSocket connections are active

### Common Issues

**1. "Port 3000 is already in use"**
- Change `PORT` environment variable
- Kill existing process on that port

**2. "MongoDB connection error"**
- Verify `MONGO_URI` is correct
- Ensure MongoDB server is running
- Check network connectivity to MongoDB

**3. "Clerk webhook not working"**
- Verify `CLERK_WEBHOOK_SIGNING_SECRET` matches Clerk dashboard
- Check that webhook URL is configured in Clerk dashboard
- Verify Clerk middleware is applied before webhook route

**4. "Socket.io connection issues"**
- Ensure WebSocket protocol is not blocked by firewall
- Verify `FRONTEND_URL` matches actual deployment domain
- Check CORS origins in Socket.io config

**5. "Images/videos not uploading"**
- If using ImageKit: verify all `IMAGEKIT_*` keys are set
- Check file size limits (default: 10MB)
- Ensure multer middleware is properly configured

## Performance Optimization

- Frontend: Vite builds with code splitting enabled
- Backend: Express serves static files efficiently
- Database: Use MongoDB indexes for message queries
- WebSocket: Connection pooling handled by Socket.io
- Cron job: Runs every 14 minutes to keep server alive

## Security Notes

- Always use HTTPS in production
- Set `NODE_ENV=production` for optimizations
- Use strong MongoDB credentials
- Rotate Clerk secrets regularly
- Validate all file uploads
- Implement rate limiting for API endpoints

## Support & Debugging

For deployment issues:
1. Check container/application logs
2. Verify all environment variables are set
3. Test connectivity to MongoDB
4. Test Clerk authentication flow
5. Verify WebSocket connectivity
