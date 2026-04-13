# Troubleshooting Guide

## Common Issues and Solutions

---

## Docker Issues

### Docker not installed

**Error**: `docker: command not found`

**Solution**:
1. Install Docker from https://docs.docker.com/get-docker/
2. Verify installation: `docker --version`
3. Start Docker daemon

### Docker Compose not installed

**Error**: `docker-compose: command not found`

**Solution**:
1. Install Docker Compose from https://docs.docker.com/compose/install/
2. Verify installation: `docker-compose --version`

### Docker daemon not running

**Error**: `Cannot connect to Docker daemon`

**Solution**:
- **Linux**: `sudo systemctl start docker`
- **Mac**: Open Docker Desktop application
- **Windows**: Open Docker Desktop application

---

## Port Issues

### Port already in use

**Error**: `bind: address already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3000
lsof -i :5173
lsof -i :5432

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
# Change "3000:3000" to "3001:3000"
```

### Multiple services on same port

**Error**: `Port 3000 is already allocated`

**Solution**:
1. Stop other services: `docker-compose down`
2. Check for other Docker containers: `docker ps -a`
3. Remove conflicting containers: `docker rm <container-id>`

---

## Database Issues

### Database connection refused

**Error**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Check if postgres is running
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Verify connection
docker-compose exec postgres psql -U postgres -d media_center
```

### Wrong database credentials

**Error**: `FATAL: password authentication failed`

**Solution**:
1. Check `.env` file for correct credentials
2. Verify `DB_USER`, `DB_PASSWORD`, `DB_NAME`
3. Ensure credentials match in all services
4. Restart services: `docker-compose restart`

### Database not initialized

**Error**: `database "media_center" does not exist`

**Solution**:
```bash
# Create database
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE media_center;"

# Or reset everything
docker-compose down -v
docker-compose up -d
```

### Slow database queries

**Solution**:
1. Check query performance: `EXPLAIN ANALYZE <query>`
2. Add indexes to frequently queried columns
3. Optimize queries
4. Increase database resources

---

## Backend Issues

### Backend won't start

**Error**: `Backend container exits immediately`

**Solution**:
```bash
# Check logs
docker-compose logs backend

# Common causes:
# 1. Database not running
# 2. Wrong environment variables
# 3. Port already in use
# 4. TypeScript compilation error

# Rebuild
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Backend can't connect to database

**Error**: `Error: connect ECONNREFUSED postgres:5432`

**Solution**:
1. Ensure postgres service is running: `docker-compose logs postgres`
2. Check `DB_HOST` is set to `postgres` (service name)
3. Verify credentials in `.env`
4. Restart services: `docker-compose restart`

### API endpoints not working

**Error**: `404 Not Found` or `Cannot GET /api/portal`

**Solution**:
```bash
# Check backend logs
docker-compose logs backend

# Verify routes are registered
# Check src/routes/portal-r/index.ts

# Restart backend
docker-compose restart backend
```

### TypeScript compilation error

**Error**: `error TS2307: Cannot find module`

**Solution**:
1. Check imports are correct
2. Verify file paths
3. Install missing dependencies: `npm install`
4. Rebuild: `docker-compose build --no-cache backend`

---

## Frontend Issues

### Frontend won't start

**Error**: `Frontend container exits immediately`

**Solution**:
```bash
# Check logs
docker-compose logs frontend

# Common causes:
# 1. Build error
# 2. Port already in use
# 3. Missing dependencies

# Rebuild
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Frontend can't connect to backend

**Error**: `Failed to fetch` or `Network error`

**Solution**:
1. Check `VITE_API_URL` environment variable
2. Verify backend is running: `docker-compose logs backend`
3. Check backend URL is correct
4. Verify CORS is enabled on backend
5. Check browser console for errors

### Blank page or 404

**Error**: `Cannot GET /` or blank page

**Solution**:
```bash
# Check frontend logs
docker-compose logs frontend

# Verify build was successful
docker-compose exec frontend ls -la dist/

# Rebuild
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Hot reload not working

**Error**: `Changes not reflected in browser`

**Solution**:
1. Ensure `docker-compose.override.yml` exists
2. Check volume mounts: `docker-compose config | grep volumes`
3. Restart frontend: `docker-compose restart frontend`
4. Clear browser cache: Ctrl+Shift+Delete

### Vite build error

**Error**: `error during build`

**Solution**:
```bash
# Check build logs
docker-compose logs frontend

# Common causes:
# 1. TypeScript error
# 2. Missing import
# 3. Syntax error

# Fix errors and rebuild
docker-compose build --no-cache frontend
```

---

## Network Issues

### Services can't communicate

**Error**: `Cannot reach service from another container`

**Solution**:
1. Verify services are on same network: `docker network ls`
2. Check service names in connection strings
3. Ensure services are running: `docker-compose ps`
4. Restart services: `docker-compose restart`

### DNS resolution failed

**Error**: `getaddrinfo ENOTFOUND postgres`

**Solution**:
1. Verify service name is correct
2. Check docker-compose.yml for service names
3. Ensure services are running
4. Restart Docker daemon

---

## Performance Issues

### Slow application

**Solution**:
1. Check resource usage: `docker stats`
2. Increase container resources in docker-compose.yml
3. Optimize database queries
4. Enable caching
5. Check logs for errors

### High memory usage

**Solution**:
1. Check memory limits: `docker inspect <container>`
2. Increase memory in docker-compose.yml
3. Check for memory leaks in code
4. Optimize data structures

### High CPU usage

**Solution**:
1. Check CPU usage: `docker stats`
2. Profile application
3. Optimize algorithms
4. Check for infinite loops

---

## Deployment Issues

### Render deployment fails

**Error**: `Build failed` or `Deployment error`

**Solution**:
1. Check Render logs in dashboard
2. Verify `Dockerfile` is correct
3. Check environment variables
4. Ensure all dependencies are in `package.json`
5. Test locally first: `docker build .`

### Frontend can't connect to backend on Render

**Error**: `Failed to fetch from backend`

**Solution**:
1. Verify `VITE_API_URL` points to correct backend URL
2. Check backend is deployed and running
3. Verify CORS is enabled
4. Check firewall rules

### Database not accessible on Render

**Error**: `Cannot connect to database`

**Solution**:
1. Verify database is created
2. Check connection string
3. Verify credentials
4. Check firewall rules
5. Ensure database is in same region

---

## Debugging Tips

### Enable verbose logging

```bash
# Docker Compose
docker-compose --verbose up

# Docker
docker run --log-driver json-file --log-opt max-size=10m <image>
```

### Access container shell

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec postgres bash
```

### View container logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Follow logs
docker-compose logs -f backend
```

### Inspect container

```bash
# View container details
docker inspect <container-id>

# View container processes
docker top <container-id>

# View container stats
docker stats <container-id>
```

### Check network

```bash
# List networks
docker network ls

# Inspect network
docker network inspect <network-id>

# Test connectivity
docker-compose exec backend ping postgres
```

---

## Getting Help

1. **Check logs first**
   ```bash
   docker-compose logs -f
   ```

2. **Review documentation**
   - `SETUP.md` - Setup guide
   - `DEPLOYMENT.md` - Deployment guide
   - `DOCKER_DEPLOYMENT.md` - Docker guide

3. **Search for similar issues**
   - GitHub issues
   - Stack Overflow
   - Docker documentation

4. **Provide detailed information**
   - Error message
   - Logs output
   - Environment details
   - Steps to reproduce

---

## Quick Fixes

### Restart everything
```bash
docker-compose restart
```

### Rebuild everything
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d
```

### Clean up unused resources
```bash
docker system prune -a
```

---

## Prevention Tips

1. **Keep logs**
   - Save logs for debugging
   - Monitor logs regularly

2. **Use version control**
   - Commit working versions
   - Tag releases

3. **Test locally**
   - Test before deployment
   - Use same environment

4. **Monitor production**
   - Set up alerts
   - Check logs regularly
   - Monitor performance

5. **Backup data**
   - Regular backups
   - Test restore process
   - Store securely

---

## Resources

- [Docker Troubleshooting](https://docs.docker.com/config/containers/troubleshoot/)
- [Docker Compose Troubleshooting](https://docs.docker.com/compose/faq/)
- [PostgreSQL Troubleshooting](https://www.postgresql.org/docs/current/runtime.html)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [React Debugging](https://react.dev/learn/react-developer-tools)

---

**Still stuck?** Check the logs and review the relevant documentation section above.
