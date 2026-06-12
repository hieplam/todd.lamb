---
id: c3-1
c3-seal: 731d8e5b5fd444f89ff769bd9fdd9cfadd33ffd7daa6f868092979541c8fcc30
title: Hiep Lam Blog
type: container
boundary: service
parent: c3-0
goal: Serve as the single Astro 6 static site that builds all blog content, routes, and assets into a fully-static output, packaged as a Docker image (nginx + HTTP Basic Auth) and deployed via Dokploy. Provides a Vietnamese-language adventure-motorcycle travel blog named "Hiệp Lâm Riders" with type-safe content collections, Pagefind search, generated SVG scenery illustrations, and dynamic per-post OG images.
---

## Goal

Serve as the single Astro 6 static site that builds all blog content, routes, and assets into a fully-static output, packaged as a Docker image (nginx + HTTP Basic Auth) and deployed via Dokploy. Provides a Vietnamese-language adventure-motorcycle travel blog named "Hiệp Lâm Riders" with type-safe content collections, Pagefind search, generated SVG scenery illustrations, and dynamic per-post OG images.

## Components

| ID | Name | Category | Status | Goal Contribution |
| --- | --- | --- | --- | --- |
| c3-101 | Content Collections | Foundation | active | Defines Zod-validated post/page schemas, loads markdown via Astro content loaders, and owns the trips spec + SVG scenery generator under scripts/ |
| c3-102 | Layouts | Foundation | active | Provides base HTML shell and post-level wrappers that all pages compose from, loading Archivo (Vietnamese subset) and Google Sans Code fonts |
| c3-103 | UI Components | Foundation | active | Shared presentational Astro components (Header, Footer, Card with hero thumbnails, Pagination, etc.) |
| c3-104 | Styles | Foundation | active | Global CSS, typography, and adventure-palette theme tokens consumed by layouts and components |
| c3-105 | Utils | Foundation | active | Pure TypeScript helpers for post filtering, sorting, tags, slugs, hero-image resolution, and font source lookup |
| c3-106 | CI & Release Automation | Foundation | active | GitHub Actions CI (lint/format/build), release-please for conventional-commit-driven versioning/CHANGELOG/tags/Releases, plus deploy.yml publishing the static build to GitHub Pages |
| c3-107 | Deployment | Foundation | active | Two-stage Docker image (bun build, nginx runtime) gating the whole site behind HTTP Basic Auth, deployed via Dokploy |
| c3-110 | Pages & Routing | Feature | active | File-based routes for index, post list/detail, tags, archives, search, about, RSS, robots, and OG endpoints |
| c3-111 | Internationalization | Feature | active | Locale-keyed UI strings loaded at build time; Vietnamese default with English fallback |
| c3-112 | OG Image Generation | Feature | active | Generates static 1200x630 PNG OG images using Satori + Sharp at build time with Archivo multi-subset fonts for Vietnamese titles |

## Components

| ID | Name | Category | Status | Goal Contribution |
| --- | --- | --- | --- | --- |
| c3-101 | Content Collections | Foundation | active | Defines Zod-validated post/page schemas and loads markdown/MDX via Astro content loaders |
| c3-102 | Layouts | Foundation | active | Provides base HTML shell and post-level wrappers that all pages compose from |
| c3-103 | UI Components | Foundation | active | Shared presentational Astro components (Header, Footer, Card, Pagination, etc.) |
| c3-104 | Styles | Foundation | active | Global CSS, typography, and theme tokens consumed by layouts and components |
| c3-105 | Utils | Foundation | active | Pure TypeScript helper functions for post filtering, sorting, tag extraction, slug generation, and font resolution |
| c3-110 | Pages & Routing | Feature | active | File-based routes for index, post list/detail, tags, archives, search, about, RSS, robots, and OG endpoints |
| c3-111 | Internationalization | Feature | active | Locale-keyed UI strings loaded at build time; currently English-only with fallback pattern |
| c3-112 | OG Image Generation | Feature | active | Generates static 1200x630 PNG OG images using Satori + Sharp at build time for the site default and per-post |

## Responsibilities

- Build all pages to static HTML via `astro build` using bun as the package manager and task runner.
- Validate content frontmatter at build time via Zod schemas defined in `src/content.config.ts`.
- Serve a Pagefind search index generated as a post-build step.
- Package `dist/` into an nginx Docker image gated by HTTP Basic Auth (AUTH_USER/AUTH_PASSWORD) and deploy it via Dokploy; `/healthz` stays unauthenticated for probes.
- Generate deterministic SVG scenery illustrations for every post from `scripts/trips.json` via `scripts/generate-post-images.ts`.
- Maintain SEO correctness: canonical URLs, sitemap, RSS feed, robots.txt, and OG images.
- Enforce accessibility and responsive layout via TailwindCSS 4 utility classes and semantic HTML.
- Run CI (lint, format check, build) on every push and pull request, and automate releases via release-please on merges to `main`.

## Complexity Assessment

Moderate. Single deployment boundary with no server-side runtime; all complexity lives in the build pipeline (Astro + Zod + Pagefind + Satori/Sharp) and in the content authoring conventions (frontmatter schema, draft/scheduled post logic, tag taxonomy).
