# ðŸ³ Ø¯Ù„ÙŠÙ„ Ù†Ø´Ø± Docker Ù„Ù„Ù€ Frontend

## ðŸ“‹ Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø©

ØªÙ… Ø¥ØµÙ„Ø§Ø­ ÙˆØªØ­Ø³ÙŠÙ† Ø¥Ø¹Ø¯Ø§Ø¯ Docker Ù„Ù„Ù€ frontend Ù„ÙŠØ¯Ø¹Ù…:
- âœ… Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦ÙŠØ© ÙÙŠ ÙˆÙ‚Øª Ø§Ù„ØªØ´ØºÙŠÙ„ (Runtime Environment Variables)
- âœ… Multi-stage build Ù„ØªÙ‚Ù„ÙŠÙ„ Ø­Ø¬Ù… Ø§Ù„ØµÙˆØ±Ø©
- âœ… Nginx Ù…Ø¹ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ù…Ø­Ø³Ù‘Ù†Ø©
- âœ… Health checks
- âœ… Ø¯Ø¹Ù… SPA routing

---

## ðŸ”§ Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦ÙŠØ© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©

### Build Time (Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø¨Ù†Ø§Ø¡)
```bash
VITE_API_URL=https://your-backend-url.onrender.com
VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com
```

### Runtime (Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªØ´ØºÙŠÙ„)
Ù†ÙØ³ Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª ÙŠÙ…ÙƒÙ† ØªØºÙŠÙŠØ±Ù‡Ø§ ÙÙŠ ÙˆÙ‚Øª Ø§Ù„ØªØ´ØºÙŠÙ„ Ø¯ÙˆÙ† Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¨Ù†Ø§Ø¡:
```bash
VITE_API_URL=https://your-backend-url.onrender.com
VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com
```

---

## ðŸš€ Ø·Ø±Ù‚ Ø§Ù„Ù†Ø´Ø±

### 1ï¸âƒ£ Ø§Ù„Ø¨Ù†Ø§Ø¡ Ø§Ù„Ù…Ø­Ù„ÙŠ (Local Build)

```bash
# Ø¨Ù†Ø§Ø¡ Ø§Ù„ØµÙˆØ±Ø©
docker build \
  --build-arg VITE_API_URL=https://your-backend-url.onrender.com \
  --build-arg VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com \
  -f Dockerfile.frontend \
  -t media-center-frontend \
  .

# ØªØ´ØºÙŠÙ„ Ø§Ù„Ø­Ø§ÙˆÙŠØ©
docker run -d \
  -p 80:80 \
  -e VITE_API_URL=https://your-backend-url.onrender.com \
  -e VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com \
  --name frontend \
  media-center-frontend
```

### 2ï¸âƒ£ Ø§Ø³ØªØ®Ø¯Ø§Ù… Docker Compose

```bash
# ØªØ­Ø¯ÙŠØ« Ù…Ù„Ù .env ÙÙŠ Ø§Ù„Ø¬Ø°Ø±
echo "VITE_API_URL=https://your-backend-url.onrender.com" >> .env
echo "VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com" >> .env

# Ø¨Ù†Ø§Ø¡ ÙˆØªØ´ØºÙŠÙ„
docker-compose -f docker-compose.render.yml up --build frontend
```

### 3ï¸âƒ£ Ø§Ù„Ù†Ø´Ø± Ø¹Ù„Ù‰ Render.com

#### Ø§Ù„Ø®Ø·ÙˆØ© 1: Ø¥Ù†Ø´Ø§Ø¡ Web Service Ø¬Ø¯ÙŠØ¯
1. Ø§Ø°Ù‡Ø¨ Ø¥Ù„Ù‰ [Render Dashboard](https://dashboard.render.com/)
2. Ø§Ø¶ØºØ· Ø¹Ù„Ù‰ **New +** â†’ **Web Service**
3. Ø§Ø±Ø¨Ø· Ù…Ø³ØªÙˆØ¯Ø¹ GitHub Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ

#### Ø§Ù„Ø®Ø·ÙˆØ© 2: Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø¯Ù…Ø©
```yaml
Name: media-center-frontend
Environment: Docker
Region: Frankfurt (EU Central)
Branch: main
Dockerfile Path: Dockerfile.frontend
```

#### Ø§Ù„Ø®Ø·ÙˆØ© 3: Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦ÙŠØ©
Ø£Ø¶Ù ÙÙŠ Ù‚Ø³Ù… **Environment Variables**:
```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_MANAGEMENT_API_URL=https://mcms-backend-iw71.onrender.com
```

#### Ø§Ù„Ø®Ø·ÙˆØ© 4: Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ©
```yaml
Instance Type: Free (Ø£Ùˆ Ø­Ø³Ø¨ Ø§Ù„Ø­Ø§Ø¬Ø©)
Auto-Deploy: Yes
Health Check Path: /health
```

---

## ðŸ” Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù†Ø´Ø±

### 1. ÙØ­Øµ Ø§Ù„ØµØ­Ø© (Health Check)
```bash
curl http://localhost/health
# ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ±Ø¬Ø¹: healthy
```

### 2. ÙØ­Øµ Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦ÙŠØ©
Ø§ÙØªØ­ Ø§Ù„Ù…ØªØµÙØ­ ÙˆØ§ÙØ­Øµ Console:
```javascript
// ÙŠØ¬Ø¨ Ø£Ù† ØªØ±Ù‰:
ðŸ”— Management API Base URL: https://mcms-backend-iw71.onrender.com/api
ðŸ”— News API Base URL: https://your-backend-url.onrender.com/api
```

### 3. ÙØ­Øµ Ù…Ù„Ù env-config.js
```bash
curl http://localhost/env-config.js
# ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ±Ø¬Ø¹:
# window.ENV = {
#   VITE_API_URL: "https://your-backend-url.onrender.com",
#   VITE_MANAGEMENT_API_URL: "https://mcms-backend-iw71.onrender.com"
# };
```

---

## ðŸ› Ø§Ø³ØªÙƒØ´Ø§Ù Ø§Ù„Ø£Ø®Ø·Ø§Ø¡

### Ø§Ù„Ù…Ø´ÙƒÙ„Ø©: API calls ØªÙØ´Ù„
**Ø§Ù„Ø­Ù„:**
```bash
# ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦ÙŠØ© Ø¯Ø§Ø®Ù„ Ø§Ù„Ø­Ø§ÙˆÙŠØ©
docker exec -it frontend sh
cat /usr/share/nginx/html/env-config.js
```

### Ø§Ù„Ù…Ø´ÙƒÙ„Ø©: 404 Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³Ø§Ø±Ø§Øª
**Ø§Ù„Ø­Ù„:** ØªØ£ÙƒØ¯ Ù…Ù† Ø£Ù† nginx.frontend.conf ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Ø§Ù„Ù…Ø´ÙƒÙ„Ø©: CORS errors
**Ø§Ù„Ø­Ù„:** ØªØ£ÙƒØ¯ Ù…Ù† Ø£Ù† Ø§Ù„Ù€ backend ÙŠØ³Ù…Ø­ Ø¨Ù€ origin Ø§Ù„Ø®Ø§Øµ Ø¨Ø§Ù„Ù€ frontend:
```javascript
// ÙÙŠ Ø§Ù„Ù€ backend
app.use(cors({
  origin: 'https://your-frontend-url.onrender.com'
}));
```

---

## ðŸ“Š Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ©

### Ø­Ø¬Ù… Ø§Ù„ØµÙˆØ±Ø©
- **Builder stage:** ~500MB (Node.js + dependencies)
- **Final image:** ~25MB (Nginx Alpine + static files)

### Ø§Ù„Ø£Ø¯Ø§Ø¡
- âœ… Gzip compression Ù…ÙØ¹Ù‘Ù„
- âœ… Static assets caching (1 year)
- âœ… Security headers
- âœ… Health check endpoint

### Ø§Ù„Ø£Ù…Ø§Ù†
- âœ… X-Frame-Options: SAMEORIGIN
- âœ… X-Content-Type-Options: nosniff
- âœ… X-XSS-Protection: 1; mode=block
- âœ… Non-root user ÙÙŠ Nginx

---

## ðŸ“ Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ù…Ù‡Ù…Ø©

1. **Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦ÙŠØ© ÙÙŠ Runtime:**
   - ÙŠØªÙ… Ø­Ù‚Ù† Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª ÙÙŠ Ù…Ù„Ù `/usr/share/nginx/html/env-config.js`
   - ÙŠØªÙ… ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù„Ù Ù‚Ø¨Ù„ `main.tsx` ÙÙŠ `index.html`
   - ÙŠÙ…ÙƒÙ† ØªØºÙŠÙŠØ± Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø¯ÙˆÙ† Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¨Ù†Ø§Ø¡

2. **Ø§Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ TypeScript:**
   - ØªÙ… Ø¥Ø¶Ø§ÙØ© `env.d.ts` Ù„ØªØ¹Ø±ÙŠÙ `window.ENV`
   - ØªÙ… ØªØ­Ø¯ÙŠØ« `api.ts` Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… `window.ENV` Ø£ÙˆÙ„Ø§Ù‹ Ø«Ù… `import.meta.env`

3. **Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù…Ø­Ù„ÙŠ:**
   - Ø§Ø³ØªØ®Ø¯Ù… `docker-compose.render.yml` Ù„Ù„Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù…Ø­Ù„ÙŠ
   - ØªØ£ÙƒØ¯ Ù…Ù† ØªØ­Ø¯ÙŠØ« Ù…Ù„Ù `.env` Ø¨Ø§Ù„Ù‚ÙŠÙ… Ø§Ù„ØµØ­ÙŠØ­Ø©

---

## ðŸŽ¯ Ø§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªØ§Ù„ÙŠØ©

1. âœ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦ÙŠØ© ÙÙŠ Render
2. âœ… Ø¥Ø¹Ø§Ø¯Ø© Ù†Ø´Ø± Ø§Ù„Ø®Ø¯Ù…Ø©
3. âœ… Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† `/health` endpoint
4. âœ… Ø§Ø®ØªØ¨Ø§Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ ÙˆØ§Ù„Ù€ API calls
5. âœ… Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ù€ logs ÙÙŠ Render Dashboard

---

## ðŸ“ž Ø§Ù„Ø¯Ø¹Ù…

Ø¥Ø°Ø§ ÙˆØ§Ø¬Ù‡Øª Ø£ÙŠ Ù…Ø´Ø§ÙƒÙ„:
1. ØªØ­Ù‚Ù‚ Ù…Ù† logs ÙÙŠ Render Dashboard
2. Ø§ÙØ­Øµ Console ÙÙŠ Ø§Ù„Ù…ØªØµÙØ­
3. ØªØ£ÙƒØ¯ Ù…Ù† ØµØ­Ø© Ø§Ù„Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦ÙŠØ©
4. ØªØ­Ù‚Ù‚ Ù…Ù† Ø£Ù† Ø§Ù„Ù€ backend ÙŠØ¹Ù…Ù„ Ø¨Ø´ÙƒÙ„ ØµØ­ÙŠØ­

---

**ØªÙ… Ø§Ù„ØªØ­Ø¯ÙŠØ«:** 2 Ù…Ø§ÙŠÙˆ 2026
**Ø§Ù„Ø¥ØµØ¯Ø§Ø±:** 2.0
