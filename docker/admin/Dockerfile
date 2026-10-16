# Painel admin Fazbrike (SvelteKit adapter-static → SPA)
# Build context: raiz do repo (ver docker/docker-compose.yml)

FROM node:22-alpine AS build
WORKDIR /app

COPY admin/package.json admin/package-lock.json ./
RUN npm ci

COPY admin/ ./
ARG PUBLIC_API_URL=https://api.fazbrike.com.br/api
ENV PUBLIC_API_URL=$PUBLIC_API_URL
RUN npm run build

FROM nginx:1.27-alpine
LABEL description="Fazbrike admin" version="1.0.0"

COPY --from=build /app/build /usr/share/nginx/html
COPY docker/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1
