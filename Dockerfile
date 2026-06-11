# Base stage for building the static files
FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Runtime stage for serving the application behind basic auth
FROM nginx:mainline-alpine-slim AS runtime

# openssl is needed by 30-htpasswd.sh to hash AUTH_PASSWORD at startup
RUN apk add --no-cache openssl

COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY docker/30-htpasswd.sh /docker-entrypoint.d/30-htpasswd.sh
RUN chmod +x /docker-entrypoint.d/30-htpasswd.sh

COPY --from=base /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1
