# Deployment Guide - Media Center Management System

## Quick Start with Docker

### Prerequisites
- Docker & Docker Compose installed
- Git installed

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd media-center-management
cp .env.example .env
```

### 2. Update Environment Variables
Edit `.env` with your database credentials:
```env
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=media_center
```

### 3. Run with Docker Compose
```bash
docker-compose up -d
```

### 4. Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/portal
- **Database**: localhost:5432

---

## Deployment on Render.com

### Step 1: Prepare Repository

1. Push your code to GitHub
2. Ensure `.env.example` is in the root directory
3. Make sure `Dockerfile` and `docker-compose.yml` are in root

### Step 2: Deploy Backend

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: media-center-backend
   - **Environment**: Docker
   - **Region**: Choose closest to you
   - **Branch**: main

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=<postgres-host-from-render>
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=<your-password>
   DB_NAME=media_center
   ```

6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy the backend URL (e.g., `https://media-center-backend.onrender.com`)

### Step 3: Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: media-center-frontend
   - **Build Command**: `cd portal-frontend && npm install && npm run build`
   - **Publish Directory**: `portal-frontend/dist`

4. Add Environment Variables:
   ```
   VITE_API_URL=https://media-center-backend.onrender.com/api/portal
   ```

5. Click "Create Static Site"
6. Wait for deployment (3-5 minutes)

### Step 4: Setup Database on Render

1. Click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: media-center-db
   - **Region**: Same as backend
   - **PostgreSQL Version**: 15

3. Click "Create Database"
4. Copy connection details
5. Update backend environment variables with database credentials

---

## Docker Commands

### Build and Run
```bash
# Build all images
docker-compose build

# Run in background
docker-compose up -d

# Run in foreground (see logs)
docker-compose up
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop and Clean
```bash
# Stop services
docker-compose stop

# Remove services
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

### Execute Commands
```bash
# Run command in backend
docker-compose exec backend npm run build

# Access database
docker-compose exec postgres psql -U postgres -d media_center
```

---

## Troubleshooting

### Backend won't start
```bash
docker-compose logs backend
# Check for database connection errors
# Verify DB_HOST, DB_USER, DB_PASSWORD in .env
```

### Frontend can't connect to backend
```bash
# Check VITE_API_URL environment variable
# Ensure backend is running and accessible
docker-compose logs frontend
```

### Database connection refused
```bash
# Ensure postgres service is running
docker-compose logs postgres

# Check if port 5432 is available
lsof -i :5432
```

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

## Production Checklist

- [ ] Environment variables configured
- [ ] Database credentials secured
- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Database migrations completed
- [ ] API endpoints tested
- [ ] Frontend can connect to backend
- [ ] SSL/HTTPS enabled (Render does this automatically)
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place

---

## File Structure

```
media-center-management/
├── Dockerfile                 # Backend Docker image
├── docker-compose.yml         # Docker Compose configuration
├── .dockerignore              # Docker build ignore
├── .env.example               # Environment template
├── DEPLOYMENT.md              # This file
├── DOCKER_DEPLOYMENT.md       # Detailed Docker guide
├── package.json               # Backend dependencies
├── tsconfig.json              # TypeScript config
├── src/                       # Backend source
│   ├── index.ts
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── routes/
├── dist/                      # Compiled backend
└── portal-frontend/
    ├── Dockerfile             # Frontend Docker image
    ├── .dockerignore
    ├── package.json           # Frontend dependencies
    ├── vite.config.ts         # Vite config
    ├── tsconfig.json
    ├── src/                   # Frontend source
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── pages/
    │   ├── components/
    │   └── api/
    └── dist/                  # Built frontend
```

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review environment variables
3. Verify database connection
4. Check Render dashboard for deployment errors
