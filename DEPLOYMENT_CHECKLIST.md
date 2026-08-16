# Pre-Deployment Checklist

Complete this checklist before deploying to production.

## Environment Configuration

- [ ] Backend `.env` file created and configured:
  - [ ] `MONGO_URI` set to production MongoDB
  - [ ] `CLERK_WEBHOOK_SIGNING_SECRET` from Clerk dashboard
  - [ ] `FRONTEND_URL` set to production domain
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3001`

- [ ] Frontend `.env` file created and configured:
  - [ ] `VITE_CLERK_PUBLISHABLE_KEY` from Clerk dashboard
  - [ ] `VITE_API_URL` empty (for same-host serving)

## Code Review

- [ ] ✅ Backend routing error fixed (index.js line 38)
- [ ] ✅ Frontend dependencies cleaned (removed @clerk/express)
- [ ] ✅ Dockerfile multi-stage build verified
- [ ] Package lock files present (package-lock.json)

## Services Setup

- [ ] MongoDB accessible from deployment environment
- [ ] Clerk API keys generated and verified
- [ ] Clerk webhook configured:
  - [ ] Endpoint: `https://yourdomain.com/api/webhooks/clerk`
  - [ ] Events: `user.created`, `user.updated`, `user.deleted`
  - [ ] Signing secret matches `CLERK_WEBHOOK_SIGNING_SECRET`
- [ ] ImageKit configured (optional, for media uploads):
  - [ ] Public key
  - [ ] Private key
  - [ ] URL endpoint

## Build Verification

- [ ] Backend builds without errors: `npm run build`
- [ ] Frontend builds without errors: `npm run build`
- [ ] Frontend build output is in `dist/` directory
- [ ] No build warnings or errors in CI/CD logs

## Local Testing

- [ ] Frontend dev server runs: `npm run dev` in Frontend/
- [ ] Backend dev server runs: `npm run dev` in Backend/
- [ ] Can sign up via Clerk
- [ ] Can send messages
- [ ] Receive real-time messages via Socket.io
- [ ] Online user list updates correctly
- [ ] Media upload works (if ImageKit configured)

## Docker Build

- [ ] Docker image builds successfully
- [ ] Build includes `VITE_CLERK_PUBLISHABLE_KEY` arg
- [ ] Image runs without errors
- [ ] Health endpoint responds: `GET /health` → `{"ok":true}`

## Production Deployment

Choose your platform and complete relevant steps:

### Render.com / Railway.app / Similar Platforms
- [ ] Repository connected
- [ ] Environment variables configured
- [ ] Build command ready
- [ ] Start command: `npm start`
- [ ] Port exposed: 3001

### VPS / Self-Hosted
- [ ] Docker installed
- [ ] Image built and tagged
- [ ] Docker run command prepared
- [ ] Reverse proxy configured (nginx/Apache)
- [ ] SSL certificate installed
- [ ] Firewall rules set

### AWS / GCP / Azure
- [ ] Container registry set up
- [ ] Image pushed to registry
- [ ] Container service configured
- [ ] Load balancer configured
- [ ] Environment variables in service config

## Post-Deployment Testing

- [ ] Application loads on production domain
- [ ] Login flow works
- [ ] Can send and receive messages
- [ ] WebSocket connection established
- [ ] Online status updates in real-time
- [ ] Message history loads correctly
- [ ] Wallpaper/theme settings persist
- [ ] No console errors in browser DevTools
- [ ] API endpoints respond correctly
- [ ] Health check endpoint works

## Monitoring

- [ ] Application logs accessible
- [ ] Error tracking configured (Sentry/similar)
- [ ] Database monitoring active
- [ ] Uptime monitoring enabled
- [ ] Alerts configured for failures

## Performance

- [ ] Page load time acceptable
- [ ] Message delivery < 1 second
- [ ] No memory leaks in browser DevTools
- [ ] Server CPU/memory usage reasonable
- [ ] Database query performance acceptable

## Security

- [ ] HTTPS enforced
- [ ] CORS origins limited to production domain
- [ ] Clerk webhook signature verified
- [ ] No hardcoded secrets in code
- [ ] Environment variables secure
- [ ] Rate limiting considered (optional)
- [ ] File uploads validated and scanned (if enabled)

## Backup & Recovery

- [ ] MongoDB database backups configured
- [ ] Backup frequency: daily/weekly
- [ ] Recovery plan tested
- [ ] Disaster recovery procedure documented

---

**Note**: This checklist is based on the fixed codebase. All critical errors have been resolved and the app is ready for deployment with proper environment configuration.

**Next Steps**: 
1. Copy this checklist to your deployment provider's wiki/documentation
2. Follow each step systematically
3. Test thoroughly before going live
4. Monitor closely after deployment
