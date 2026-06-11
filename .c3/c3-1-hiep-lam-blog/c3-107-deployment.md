---
id: c3-107
c3-seal: 82237d3a3e96ea3e27964b6b137afafcb249df706665b662bafb92c62482a69c
title: deployment
type: component
category: foundation
parent: c3-1
goal: Package the built static site into a self-contained Docker image that serves the blog through nginx behind HTTP Basic Auth, so the Dokploy deployment exposes content only to logged-in readers while keeping an unauthenticated healthcheck endpoint.
---

## Goal

Package the built static site into a self-contained Docker image that serves the blog through nginx behind HTTP Basic Auth, so the Dokploy deployment exposes content only to logged-in readers while keeping an unauthenticated healthcheck endpoint.

## Parent Fit

| Field | Value |
| --- | --- |
| Container | Hiep Lam Blog (c3-1) |
| Category | Foundation |
| Owned files | Dockerfile, docker/default.conf, docker/30-htpasswd.sh, compose.yaml |
| Depended on by | Dokploy builds this image from the repo; readers reach the blog only through this serving layer |

## Purpose

Owns the two-stage Dockerfile (bun build stage producing dist/, nginx:mainline-alpine-slim runtime stage), the nginx server config (docker/default.conf) that applies auth_basic site-wide with an auth-exempt /healthz location plus gzip and cache headers, and the entrypoint hook (docker/30-htpasswd.sh) that hashes AUTH_USER/AUTH_PASSWORD env vars into /etc/nginx/.htpasswd at container start (random password with a stderr warning when unset). Also owns compose.yaml for the local bun dev container. Does NOT own the Astro build pipeline itself (package.json scripts), CI workflows (c3-106), or Dokploy server-side configuration.

## Foundational Flow

| Aspect | Detail | Reference |
| --- | --- | --- |
| Preconditions | bun run build must succeed inside the build stage; openssl present in runtime image (apk add) | c3-1 |
| Inputs | Repo source for the build stage; AUTH_USER/AUTH_PASSWORD env vars at container start | c3-1 |
| State | /etc/nginx/.htpasswd generated fresh on every container start by the entrypoint hook | c3-1 |
| Shared deps | nginx image /docker-entrypoint.d hook mechanism; oven/bun:1 base image | c3-1 |

## Business Flow

| Aspect | Detail | Reference |
| --- | --- | --- |
| Primary path | Request hits nginx, basic auth challenges, valid credentials serve static files from /usr/share/nginx/html | c3-1 |
| Healthcheck | GET /healthz returns 200 without credentials so Docker HEALTHCHECK and Dokploy probes pass | c3-1 |
| Unauthenticated | Any other path without credentials returns 401 with WWW-Authenticate header | c3-1 |
| Failure | Missing AUTH_PASSWORD generates a random one-off password and logs it to stderr instead of failing open | c3-1 |

## Governance

| Reference | Type | Governs | Precedence | Notes |
| --- | --- | --- | --- | --- |
| adr-20260611-redesign-moto-adventure-blog | adr | Decision to gate the static site with nginx basic auth and deploy via Dokploy | Primary | Auth lives in the serving layer because the site has no server runtime |

## Contract

| Surface | Direction | Contract | Boundary | Evidence |
| --- | --- | --- | --- | --- |
| Port 80 | OUT | Serves dist/ over HTTP; 401 without credentials, 200 with valid AUTH_USER/AUTH_PASSWORD | Dokploy reverse proxy terminates TLS in front | docker/default.conf |
| /healthz | OUT | Always 200 text/plain without auth for container orchestration probes | Docker HEALTHCHECK and Dokploy health monitoring | docker/default.conf |
| AUTH_USER / AUTH_PASSWORD | IN | Env vars consumed once at container start to build htpasswd | Set in Dokploy application environment tab | docker/30-htpasswd.sh |

## Change Safety

| Risk | Trigger | Detection | Required Verification |
| --- | --- | --- | --- |
| Auth accidentally disabled or bypassed | Editing docker/default.conf locations or auth_basic directives | curl -I / returns 200 without credentials | Run curl -I http://localhost:8080/ expecting 401 and curl -u rider:secret http://localhost:8080/ expecting 200 against docker/default.conf |
| Healthcheck breaks and Dokploy kills the container | Renaming or protecting /healthz | Container marked unhealthy after deploy | curl /healthz expects 200 unauthenticated |
| Build stage drifts from local build | package.json build script changes without Dockerfile review | Docker build failure on deploy | Run docker build -t hieplam-rides . with ./Dockerfile and docker/default.conf in context; build must exit 0 |

## Derived Materials

| Material | Must derive from | Allowed variance | Evidence |
| --- | --- | --- | --- |
| /etc/nginx/.htpasswd | Purpose section: generated at start from AUTH_USER/AUTH_PASSWORD | Hash salt differs per start; never committed | docker/30-htpasswd.sh |
