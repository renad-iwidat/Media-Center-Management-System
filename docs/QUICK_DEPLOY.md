# Quick Deployment Guide

## 🚀 Deploy with Docker

### Prerequisites
- Docker & Docker Compose installed
- Git installed

---

## Local Deployment (Docker)

### 1. Clone Repository
```bash
git clone <your-repo>
cd media-center-management
```

### 2. Create Environment File
```bash
cp .env.example .env
```

### 3. Configure Environment (Optional)
Edit `.env` if you want to change defaults:
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=media_center
VITE_API_URL=http://localhost:3000/api/portal
```

### 4. Start Services
```bash
docker-compose up -d
```

### 5. Access Application
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000/api/portal
- **Database**: localhost:5432

---

## Using Makefile (Easier)

```bash
# View all commands
make help

# Start services
make dev

# View logs
make logs

# Stop services
make down

# Clean up
make clean
```

---

## Docker Commands

### Start
```bash
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f
```

### Stop
```bash
docker-compose down
```

### Reset (Remove volumes)
```bash
docker-compose down -v
```

---

## Troubleshooting

### Port already in use
```bash
lsof -i :3000
lsof -i :5173
lsof -i :5432
kill -9 <PID>
```

### Services won't start
```bash
docker-compose logs
```

### Database connection error
```bash
docker-compose restart postgres
```

---

## Next Steps

1. **Test locally** - Ensure everything works
2. **Deploy to server** - Use Docker Compose on your VPS
3. **Monitor** - Check logs regularly
4. **Backup** - Set up database backups

---

**Ready?** Run `docker-compose up -d` and access http://localhost:5173!
