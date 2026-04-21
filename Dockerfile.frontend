# ============================================================
# Frontend Dockerfile
# React + Vite — Build & Serve via Nginx
# ============================================================

FROM node:20-alpine AS builder

WORKDIR /app

# تثبيت الـ dependencies
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit

# نسخ الكود وبناء Vite
COPY frontend/ ./
RUN npm run build && \
    npm cache clean --force

# ============================================================
# Production image — Nginx
# ============================================================
FROM nginx:alpine AS production

# نسخ الـ build للـ nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# إعداد nginx لدعم React Router والـ base path /dashboard/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# إنشاء user غير root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# التبديل للـ user غير root
USER nginx

EXPOSE 80

# إضافة health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/dashboard/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
