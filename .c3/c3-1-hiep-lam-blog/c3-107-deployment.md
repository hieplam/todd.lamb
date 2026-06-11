---
id: c3-107
c3-seal: f47c72c665bf579230798eac6a8a8abcc9f3842dba7aeaa5f2000f6235ad30ea
title: deployment
type: component
category: foundation
parent: c3-1
goal: Package the built static site into a self-contained Docker image served by nginx, public by default, with an HTTP Basic Auth gate that stays off until the AUTH_PASSWORD env var is set, plus an always-open /healthz endpoint for Dokploy probes.
---

## Goal

Package the built static site into a self-contained Docker image served by nginx, public by default, with an HTTP Basic Auth gate that stays off until the AUTH_PASSWORD env var is set, plus an always-open /healthz endpoint for Dokploy probes.

## Parent Fit

| Field | Value |
| --- | --- |
| Container | Hiep Lam Blog (c3-1) |
| Category | Foundation |
| Owned files | Dockerfile, docker/default.conf, docker/30-htpasswd.sh, compose.yaml |
| Depended on by | Dokploy builds this image from the repo; readers reach the blog only through this serving layer |

## Purpose

Owns the two-stage Dockerfile (bun build stage producing dist/, nginx:mainline-alpine-slim runtime stage), the nginx server config (docker/default.conf) that includes /etc/nginx/auth-gate.conf site-wide with an auth-exempt /healthz location plus gzip and cache headers, and the entrypoint hook (docker/30-htpasswd.sh) that decides the gate at container start: AUTH_PASSWORD unset writes an empty auth-gate.conf (public site, the default per owner decision); AUTH_PASSWORD set hashes AUTH_USER (default rider)/AUTH_PASSWORD into /etc/nginx/.htpasswd and writes the auth_basic directives. Also owns compose.yaml for the local bun dev container. Does NOT own the Astro build pipeline itself (package.json scripts), CI workflows (c3-106), or Dokploy server-side configuration.

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
| Primary path | Request hits nginx and is served publicly from /usr/share/nginx/html (auth-gate.conf empty by default) | c3-1 |
| Gated mode | With AUTH_PASSWORD set, auth-gate.conf enables auth_basic: unauthenticated requests get 401 with WWW-Authenticate, valid credentials get 200 | c3-1 |
| Healthcheck | GET /healthz returns 200 without credentials in both modes so Docker HEALTHCHECK and Dokploy probes pass | c3-1 |
| Failure | Entrypoint runs with set -eu; a malformed env never half-enables the gate because auth-gate.conf is written atomically per start | c3-1 |

## Governance

| Reference | Type | Governs | Precedence | Notes |
| --- | --- | --- | --- | --- |
| adr-20260611-redesign-moto-adventure-blog | adr | Decision to gate the static site with nginx basic auth and deploy via Dokploy | Primary | Auth lives in the serving layer because the site has no server runtime |

## Contract

| Surface | Direction | Contract | Boundary | Evidence |
| --- | --- | --- | --- | --- |
| Port 80 | OUT | Serves dist/ over HTTP; 200 publicly by default, 401-without/200-with credentials when AUTH_PASSWORD is set | Dokploy reverse proxy terminates TLS in front | docker/default.conf |
| /healthz | OUT | Always 200 text/plain without auth for container orchestration probes | Docker HEALTHCHECK and Dokploy health monitoring | docker/default.conf |
| AUTH_PASSWORD / AUTH_USER | IN | Env vars read once at container start; the gate turns on only when AUTH_PASSWORD is present, otherwise the site serves publicly | Set in Dokploy application environment tab | docker/30-htpasswd.sh |

## Change Safety

| Risk | Trigger | Detection | Required Verification |
| --- | --- | --- | --- |
| Gate silently open when owner intended it closed | Setting AUTH_PASSWORD but editing docker/30-htpasswd.sh or docker/default.conf include | curl -I / returns 200 despite AUTH_PASSWORD being set | With AUTH_PASSWORD set, run curl -I http://localhost:8080/ expecting 401 and curl -u rider:secret http://localhost:8080/ expecting 200 per docker/default.conf |
| Healthcheck breaks and Dokploy kills the container | Renaming or protecting /healthz | Container marked unhealthy after deploy | curl /healthz expects 200 unauthenticated |
| Build stage drifts from local build | package.json build script changes without Dockerfile review | Docker build failure on deploy | Run docker build -t hieplam-rides . with ./Dockerfile and docker/default.conf in context; build must exit 0 |

## Derived Materials

| Material | Must derive from | Allowed variance | Evidence |
| --- | --- | --- | --- |
| /etc/nginx/.htpasswd | Purpose section: generated at start from AUTH_USER/AUTH_PASSWORD | Hash salt differs per start; never committed | docker/30-htpasswd.sh |
