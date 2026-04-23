# Media Center Management System - Docker & Deployment Guide

## 📦 What's Included

This project includes complete Docker setup for:
- **Backend API** (Node.js + Express + TypeScript)
- **Frontend** (React + Vite + TypeScript)
- **Database** (PostgreSQL)
- **Docker Compose** for local development
- **Render.yaml** for one-click deployment to Render

---

## 🚀 Quick Start

### Local Development (Docker)

```bash
# 1. Clone repository
git clone <your-repo>
cd media-center-management

# 2. Create environment file
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000/api/portal
# Database: localhost:5432
```

### Using Makefile (Recommended)

```bash
# View all available commands
make help

# Start development environment
make dev

# View logs
make logs

# Stop services
make down

# Clean up (remove volumes)
make clean
```

---

## 📋 Files Overview

### Docker Files
- **`Dockerfile`** - Backend Docker image
- **`portal-frontend/Dockerfile`** - Frontend Docker image (multi-stage build)
- **`docker-compose.yml`** - Development environment
- **`docker-compose.prod.yml`** - Production environment
- **`.dockerignore`** - Files to exclude from Docker build

### Configuration Files
- **`.env.example`** - Environment variables template
- **`.env.production`** - Production environment template
- **`render.yaml`** - Render deployment configuration
- **`Makefile`** - Docker command shortcuts

### Documentation
- **`QUICK_DEPLOY.md`** - 5-minute deployment guide
- **`DEPLOYMENT.md`** - Detailed deployment instructions
- **`DOCKER_DEPLOYMENT.md`** - Complete Docker guide

---

## 🐳 Docker Commands

### Development

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose stop

# Remove services
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

### Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production services
docker-compose -f docker-compose.prod.yml down
```

---

## 🎯 Deployment Options

### Option 1: Render (Recommended - Free)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "Blueprint"
   - Select your repository
   - Click "Create"

3. **Done!** Render will automatically:
   - Build Docker images
   - Create PostgreSQL database
   - Deploy backend and frontend
   - Set up SSL/HTTPS

**Estimated time**: 15-20 minutes

### Option 2: Docker Compose (Local/VPS)

```bash
# On your server
git clone <your-repo>
cd media-center-management
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Manual Docker Build

```bash
# Build backend
docker build -t media-center-backend .

# Build frontend
docker build -t media-center-frontend ./portal-frontend

# Run containers
docker run -d -p 3000:3000 media-center-backend
docker run -d -p 5173:5173 media-center-frontend
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=media_center
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/portal
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Render.com                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Frontend    │  │   Backend    │  │Database  │ │
│  │  (React)     │  │  (Node.js)   │  │(Postgres)│ │
│  │  Port 5173   │  │  Port 3000   │  │Port 5432 │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Monitoring & Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Access Database
```bash
docker-compose exec postgres psql -U postgres -d media_center
```

### Check Service Status
```bash
docker-compose ps
```

---

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Frontend can't connect to backend
```bash
# Check VITE_API_URL
docker-compose logs frontend

# Verify backend is running
docker-compose logs backend
```

### Database connection error
```bash
# Check database is running
docker-compose logs postgres

# Verify credentials in .env
# Restart database
docker-compose restart postgres
```

### Port already in use
```bash
# Find process
lsof -i :3000
lsof -i :5173
lsof -i :5432

# Kill process
kill -9 <PID>
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Render Documentation](https://render.com/docs)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Image](https://hub.docker.com/_/node)

---

## 🎓 Learning Resources

### Docker Basics
- [Docker Tutorial](https://docs.docker.com/get-started/)
- [Docker Compose Tutorial](https://docs.docker.com/compose/gettingstarted/)

### Deployment
- [Render Getting Started](https://render.com/docs/getting-started)
- [Docker Deployment Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 💡 Best Practices

1. **Use `.env.example` as template**
   - Never commit `.env` file
   - Keep sensitive data secure

2. **Use specific image versions**
   - Avoid `latest` tag in production
   - Pin versions for reproducibility

3. **Monitor logs regularly**
   - Check for errors and warnings
   - Set up log aggregation

4. **Backup database regularly**
   - Use PostgreSQL backup tools
   - Store backups securely

5. **Keep images small**
   - Use Alpine Linux images
   - Multi-stage builds for frontend

---

## 🚀 Performance Tips

1. **Use Docker volumes for development**
   - Faster file sync
   - Better performance

2. **Enable BuildKit**
   ```bash
   export DOCKER_BUILDKIT=1
   ```

3. **Use `.dockerignore`**
   - Exclude unnecessary files
   - Smaller image size

4. **Cache dependencies**
   - Install dependencies first
   - Leverage Docker layer caching

---

## 🔐 Security Considerations

1. **Use strong passwords**
   - Generate secure passwords
   - Store in secure vault

2. **Enable HTTPS**
   - Render provides free SSL
   - Use HTTPS in production

3. **Limit exposed ports**
   - Only expose necessary ports
   - Use firewall rules

4. **Keep images updated**
   - Regular security updates
   - Monitor vulnerabilities

---

## 📞 Support

For issues or questions:

1. **Check logs**
   ```bash
   docker-compose logs -f
   ```

2. **Review documentation**
   - `QUICK_DEPLOY.md` - Quick start
   - `DEPLOYMENT.md` - Detailed guide
   - `DOCKER_DEPLOYMENT.md` - Docker guide

3. **Common issues**
   - See Troubleshooting section above

---

## 📝 License

This project is licensed under ISC License.

---

## 🎉 You're Ready!

Your application is now ready for deployment. Choose your deployment option and get started!

- **Quick Deploy**: See `QUICK_DEPLOY.md`
- **Detailed Guide**: See `DEPLOYMENT.md`
- **Docker Guide**: See `DOCKER_DEPLOYMENT.md`
