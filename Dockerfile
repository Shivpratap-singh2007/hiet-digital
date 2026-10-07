# =============================================================================
# HIET Digital Campus — Multi-stage Production Dockerfile
# =============================================================================

# Stage 1: Build the React + TypeScript bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies with cached layers
COPY package.json package-lock.json* ./
RUN npm ci

# Copy full source and compile
COPY . .
RUN npm run build

# Stage 2: Serve via Nginx Alpine with SPA fallback
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built dist files
COPY --from=builder /app/dist /usr/share/nginx/html

# Provide SPA routing configuration
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        return 200 "healthy\n"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
