# Setup Guide - Media Center Management System

## Prerequisites

- Docker & Docker Compose installed
- Git installed
- 4GB RAM minimum
- 2GB disk space

## Installation Steps

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd media-center-management
```

### 2. Create Environment File

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` file:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=media_center

# Server
NODE_ENV=development
PORT=3000

# Frontend
VITE_API_URL=http://localhost:3000/api/portal
```

### 4. Build Docker Images

```bash
docker-compose build
```

### 5. Start Services

```bash
docker-compose up -d
```

### 6. Verify Installation

Check if all services are running:

```bash
docker-compose ps
```

You should see:
- `media_center_db` - PostgreSQL (running)
- `media_center_backend` - Backend API (running)
- `media_center_frontend` - Frontend (running)

### 7. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/portal
- **Database**: localhost:5432

---

## Verification Checklist

- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] `.env` file created and configured
- [ ] Docker images built successfully
- [ ] All services running (`docker-compose ps`)
- [ ] Frontend accessible at http://localhost:5173
- [ ] Backend API accessible at http://localhost:3000/api/portal
- [ ] Database connected

---

## Common Issues

### Docker not installed

**Solution**: Install Docker from https://docs.docker.com/get-docker/

### Port already in use

```bash
# Find process using port
lsof -i :3000
lsof -i :5173
lsof -i :5432

# Kill process
kill -9 <PID>
```

### Services won't start

```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Database connection error

```bash
# Check database logs
docker-compose logs postgres

# Verify credentials in .env
# Restart database
docker-compose restart postgres
```

---

## Next Steps

1. **Read Documentation**
   - `QUICK_DEPLOY.md` - Quick deployment guide
   - `DEPLOYMENT.md` - Detailed deployment
   - `DOCKER_DEPLOYMENT.md` - Docker guide

2. **Explore Application**
   - Open http://localhost:5173
   - Test features
   - Check backend API

3. **Development**
   - Make code changes
   - Changes auto-reload (hot reload enabled)
   - Check logs: `docker-compose logs -f`

4. **Deployment**
   - When ready, follow `QUICK_DEPLOY.md`
   - Deploy to Render or your server

---

## Useful Commands

### View Logs
```bash
docker-compose logs -f              # All services
docker-compose logs -f backend      # Backend only
docker-compose logs -f frontend     # Frontend only
docker-compose logs -f postgres     # Database only
```

### Stop Services
```bash
docker-compose stop                 # Stop all
docker-compose stop backend         # Stop backend
```

### Restart Services
```bash
docker-compose restart              # Restart all
docker-compose restart backend      # Restart backend
```

### Remove Services
```bash
docker-compose down                 # Remove containers
docker-compose down -v              # Remove containers and volumes
```

### Access Database
```bash
docker-compose exec postgres psql -U postgres -d media_center
```

### Execute Commands
```bash
docker-compose exec backend npm run build
docker-compose exec frontend npm run build
```

---

## Development Workflow

1. **Make code changes**
   - Edit files in `src/` or `portal-frontend/src/`
   - Changes auto-reload (hot reload enabled)

2. **Check logs**
   ```bash
   docker-compose logs -f
   ```

3. **Test changes**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000/api/portal

4. **Commit changes**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

---

## Production Deployment

When ready to deploy:

1. **Read QUICK_DEPLOY.md**
   - 5-minute deployment guide
   - Step-by-step instructions

2. **Choose deployment option**
   - Render (recommended)
   - Docker Compose on VPS
   - Manual Docker build

3. **Follow deployment guide**
   - Configure environment
   - Deploy services
   - Verify deployment

---

## Support

For issues:

1. Check logs: `docker-compose logs -f`
2. Review documentation
3. Check troubleshooting section above
4. Verify environment variables

---

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)

---

**Ready to start?** Run `docker-compose up -d` and access http://localhost:5173!
