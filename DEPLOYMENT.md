# Quick Deployment Guide

## 🚀 Deploy to Render (Recommended)

### Prerequisites
- PostgreSQL database
- AWS S3 bucket
- GitHub repository

### Backend Deployment

1. Create new Web Service on Render
2. Connect your GitHub repo
3. Configure:
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Branch**: `manual-reporter-input`

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=your-db-host
   DB_PORT=5432
   DB_NAME=your-db-name
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_SSL=true
   AWS_REGION=eu-north-1
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_S3_BUCKET=your-bucket
   ```

5. Deploy!

### Frontend Deployment

1. Create new Web Service on Render
2. Same repo, same branch
3. Configure:
   - **Environment**: Docker
   - **Dockerfile Path**: `./manual-input-frontend/Dockerfile`
   - **Root Directory**: `manual-input-frontend`

4. **IMPORTANT**: Update `manual-input-frontend/nginx.conf`:
   - Change `proxy_pass http://backend:3000;`
   - To: `proxy_pass https://your-backend-url.onrender.com;`

5. Deploy!

---

## 🐳 Local Docker Deployment

### Quick Start
```bash
# 1. Copy environment file
cp .env.production.example .env

# 2. Edit .env with your values
nano .env

# 3. Build and run
docker-compose up -d

# 4. Check logs
docker-compose logs -f

# 5. Access
# Frontend: http://localhost
# Backend: http://localhost:3000
```

### Stop Services
```bash
docker-compose down
```

---

## ✅ Health Checks

### Backend
```bash
curl http://localhost:3000/api/health
```

### Frontend
```bash
curl http://localhost/
```

---

## 📊 Ports

- **Frontend**: 80 (HTTP)
- **Backend**: 3000 (API)
- **Database**: 5432 (PostgreSQL)

---

## 🔒 Security Checklist

- [ ] Use strong database passwords
- [ ] Enable SSL for database connection
- [ ] Use IAM user with limited S3 permissions
- [ ] Enable S3 bucket encryption
- [ ] Configure CORS properly
- [ ] Use HTTPS in production (Render provides this)
- [ ] Keep environment variables secret

---

## 📝 Post-Deployment

1. Run database migrations
2. Setup manual input sources
3. Test all endpoints
4. Test file uploads
5. Monitor logs

---

## 🆘 Troubleshooting

### Backend won't start
- Check database connection
- Verify environment variables
- Check logs: `docker-compose logs backend`

### Frontend can't reach backend
- Update nginx.conf with correct backend URL
- Check CORS settings
- Verify backend is running

### File uploads fail
- Check AWS credentials
- Verify S3 bucket permissions
- Check bucket policy

---

## 📚 Full Documentation

See `docs/DEPLOYMENT_GUIDE.md` for detailed instructions.

---

## 🎯 Architecture

```
┌─────────────┐
│   Frontend  │ (Port 80)
│   (Nginx)   │
└──────┬──────┘
       │
       │ /api requests
       ↓
┌─────────────┐
│   Backend   │ (Port 3000)
│  (Node.js)  │
└──────┬──────┘
       │
       ├─────→ PostgreSQL Database
       │
       └─────→ AWS S3 Bucket
```

---

**Ready to deploy!** 🚀
