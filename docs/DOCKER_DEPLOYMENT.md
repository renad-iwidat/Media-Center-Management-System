# Docker Deployment Guide

## Prerequisites
- Docker installed
- Docker Compose installed
- Git installed

## Local Development with Docker

### 1. Clone the repository
```bash
git clone <repository-url>
cd media-center-management
```

### 2. Create environment file
```bash
cp .env.example .env
```

### 3. Update .env with your configuration
```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=media_center
NODE_ENV=production
PORT=3000
VITE_API_URL=http://localhost:3000/api/portal
```

### 4. Build and run with Docker Compose
```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database on port 5432
- Build and start Backend API on port 3000
- Build and start Frontend on port 5173

### 5. Access the application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/portal

### 6. View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 7. Stop services
```bash
docker-compose down
```

### 8. Remove volumes (reset database)
```bash
docker-compose down -v
```

---

## Production Deployment on Render

### Backend Deployment

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the repository

2. **Configure the service:**
   - **Name**: media-center-backend
   - **Environment**: Docker
   - **Build Command**: (leave empty - uses Dockerfile)
   - **Start Command**: (leave empty - uses Dockerfile CMD)

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=<your-postgres-host>
   DB_PORT=5432
   DB_USER=<your-db-user>
   DB_PASSWORD=<your-secure-password>
   DB_NAME=media_center
   ```

4. **Add PostgreSQL Database:**
   - Create a PostgreSQL database on Render
   - Copy the connection details
   - Update the environment variables above

5. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy

### Frontend Deployment

1. **Create a new Static Site on Render**
   - Connect your GitHub repository
   - Select the repository

2. **Configure the site:**
   - **Name**: media-center-frontend
   - **Build Command**: `cd portal-frontend && npm install && npm run build`
   - **Publish Directory**: `portal-frontend/dist`

3. **Set Environment Variables:**
   ```
   VITE_API_URL=https://<your-backend-url>/api/portal
   ```

4. **Deploy:**
   - Click "Create Static Site"
   - Render will automatically build and deploy

---

## Docker Commands Reference

### Build images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Run services
```bash
# Run in foreground
docker-compose up

# Run in background
docker-compose up -d

# Run specific service
docker-compose up -d backend
```

### View logs
```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Execute commands in container
```bash
# Backend
docker-compose exec backend npm run build
docker-compose exec backend npm run dev

# Frontend
docker-compose exec frontend npm run build

# Database
docker-compose exec postgres psql -U postgres -d media_center
```

### Stop and remove
```bash
# Stop services
docker-compose stop

# Remove services
docker-compose down

# Remove services and volumes
docker-compose down -v
```

---

## Troubleshooting

### Database connection error
- Ensure PostgreSQL is running: `docker-compose logs postgres`
- Check environment variables in `.env`
- Verify DB_HOST is set to `postgres` (service name)

### Frontend can't connect to backend
- Check VITE_API_URL in environment
- Ensure backend is running: `docker-compose logs backend`
- Check backend logs for errors

### Port already in use
```bash
# Find process using port
lsof -i :3000
lsof -i :5173
lsof -i :5432

# Kill process
kill -9 <PID>
```

### Rebuild without cache
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## File Structure

```
media-center-management/
├── Dockerfile                 # Backend Dockerfile
├── docker-compose.yml         # Docker Compose configuration
├── .dockerignore              # Docker ignore file
├── .env.example               # Environment variables template
├── DOCKER_DEPLOYMENT.md       # This file
├── package.json               # Backend dependencies
├── src/                       # Backend source code
├── dist/                      # Backend compiled code
└── portal-frontend/
    ├── Dockerfile             # Frontend Dockerfile
    ├── .dockerignore           # Frontend Docker ignore
    ├── package.json            # Frontend dependencies
    ├── src/                    # Frontend source code
    └── dist/                   # Frontend compiled code
```

---

## Notes

- The backend uses Node.js 18 Alpine image for smaller size
- The frontend uses multi-stage build to optimize image size
- PostgreSQL data is persisted in a Docker volume
- All services are configured to restart automatically
- Environment variables can be overridden in `.env` file
