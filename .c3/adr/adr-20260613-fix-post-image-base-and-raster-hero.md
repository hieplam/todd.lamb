---
id: adr-20260613-fix-post-image-base-and-raster-hero
c3-seal: 056494067aacf885b5e4852fb9be5ce02dcf788b255e70899f745dca08d49b34
title: fix-post-image-base-and-raster-hero
type: adr
goal: 'Make post body images and in-content links, plus real (raster) post cover photos, resolve correctly when the site is served from a sub-path (GitHub Pages `/todd.lamb`). Concretely: (1) markdown `<img src>` and `<a href>` that are root-relative (e.g. `/images/posts/...`, `/posts/slug`) must be prefixed with the configured Astro `base`; (2) a post''s hero/card thumbnail must be allowed to be a real photo (`hero.jpg/.jpeg/.png/.webp`), taking precedence over the generated `hero.svg` placeholder.'
status: implemented
date: "2026-06-13"
---

## Goal

Make post body images and in-content links, plus real (raster) post cover photos, resolve correctly when the site is served from a sub-path (GitHub Pages `/todd.lamb`). Concretely: (1) markdown `<img src>` and `<a href>` that are root-relative (e.g. `/images/posts/...`, `/posts/slug`) must be prefixed with the configured Astro `base`; (2) a post's hero/card thumbnail must be allowed to be a real photo (`hero.jpg/.jpeg/.png/.webp`), taking precedence over the generated `hero.svg` placeholder.

## Context

The blog deploys to GitHub Pages under `base: /todd.lamb` (derived from `site.url` in `astro.config.ts`). Astro applies `base` only to framework-generated URLs (via `getRelativeLocaleUrl`/`getAssetPath`), NOT to raw `<img>`/`<a>` produced from markdown. Every post body image uses an absolute path like `/images/posts/<slug>/scene-1.svg`, so in production these resolve to `https://hieplam.github.io/images/...` (missing `/todd.lamb`) → 404. Built evidence confirmed: card hero `src="/todd.lamb/images/.../hero.svg"` (correct, via getAssetPath) vs body `src="/images/.../scene-1.svg"` (broken). Separately, `getPostHeroImage` only probes `hero.svg`, so a post cannot ship a real cover photo. This blocks the current task of publishing a 7-day trip series illustrated with real photographs of the route and the bike. Affected topology: utils (image URL helpers), ui-components (Card hero block), pages-routing (rendered post HTML).

## Decision

Add a small local rehype plugin `rehypeBaseUrls` to `astro.config.ts` markdown pipeline that walks the hast tree and prefixes root-relative `img.src` and `a.href` with `basePath` (derived from the same `deployUrl.pathname`), skipping anchors (`#`), protocol-relative (`//`), already-prefixed and absolute URLs. Extend `getPostHeroImage` to probe an ordered list of extensions `[jpg, jpeg, png, webp, svg]`, returning the first match so a real photo overrides the placeholder. This keeps the existing `public/images/posts/<slug>/` convention intact (no per-post imports, no content-collection image refactor) and fixes all 45 existing posts at once, while letting new posts drop in real `hero.jpg` + body photos. Chosen over editing every markdown file (does not scale, breaks on the next post) and over migrating images into `src/` content assets (large refactor, abandons the established public/ convention).

## Affected Topology

| Entity | Type | Why affected | Governance review |
| --- | --- | --- | --- |
| c3-105 | component | utils: getPostHeroImage extended to accept raster heroes; uses existing getAssetPath. Card consumes it unchanged | Confirm helper stays a pure build-time function; no console (rule-no-console) |
| c3-110 | component | pages-routing: new rehype plugin changes the rendered HTML of every markdown post route (img/href base prefix) | Confirm static output still valid; verify built post HTML hrefs/srcs |

## Compliance Refs

| Ref | Why required | Action |
| --- | --- | --- |
| ref-content-schema | Governs how routes query/render post entries; body image rendering is part of post output | review — no schema field change; image path convention unchanged |
| ref-i18n-strategy | getRelativeLocaleUrl already base-aware; ensure rehype does not double-prefix locale/nav links | review — plugin guards against already-prefixed paths |

## Compliance Rules

| Rule | Why required | Action |
| --- | --- | --- |
| rule-prettier-format | New/edited TS + md must match Prettier style | comply — npm run format:check passes |
| rule-no-console | Touch utils + build config | comply — no console statements added |

## Work Breakdown

| Area | Detail | Evidence |
| --- | --- | --- |
| Build config | Add rehypeBaseUrls plugin + basePath const; register in markdown.rehypePlugins | astro.config.ts |
| Utils | Extend getPostHeroImage with HERO_EXTENSIONS probe loop | src/utils/getPostHeroImage.ts |
| Content | New trip series posts reference /images/posts/<slug>/... and real hero.jpg | src/content/posts/dong-bac-ha-giang-vong-cung-7-ngay.md |

## Underlay C3 Changes

| Underlay area | Exact C3 change | Verification evidence |
| --- | --- | --- |
| N.A - no C3 CLI/validator/schema change | This ADR changes application build config + a util only; no c3x command, validator, template or help is modified | c3 check → 0 issues |

## Enforcement Surfaces

| Surface | Behavior | Evidence |
| --- | --- | --- |
| npx astro build | Renders post HTML; rehype runs at build time | exit 0, 130 pages |
| grep on dist HTML | Body img/href carry /todd.lamb prefix | dist/.../ban-do-lo-trinh.jpg → src="/todd.lamb/images/..." |
| getPostHeroImage existsSync probe | Returns raster hero when present, else svg, else undefined | Card hero src .../hero.jpg on posts list |

## Alternatives Considered

| Alternative | Rejected because |
| --- | --- |
| Hardcode /todd.lamb/... in markdown paths | Breaks local dev where base differs; not portable if repo/base renamed |
| Migrate images to src/ content assets with relative refs | Large refactor of 45 posts; abandons established public/ convention for marginal gain |
| Edit each markdown file to prefix base | Does not scale; every new post would reintroduce the bug |

## Risks

| Risk | Mitigation | Verification |
| --- | --- | --- |
| Double-prefixing already-based URLs | Plugin skips paths starting with ${basePath}/, //, non-/ | Inspect built nav links unchanged (single /todd.lamb) |
| Over-rewriting external/anchor links | Only root-relative (/) values rewritten; #, http(s), // left as-is | grep built HTML: external href="https://" untouched |
| Raster hero missing → broken card | Helper returns undefined when no file; Card conditionally renders | Card omits <img> for posts without any hero file |

## Verification

| Check | Result |
| --- | --- |
| npx astro build | exit 0, 130 page(s) built |
| grep ban-do dist/.../dong-bac-ha-giang-vong-cung-7-ngay/index.html | src="/todd.lamb/images/posts/.../ban-do-lo-trinh.jpg" |
| day-link grep on overview HTML | href="/todd.lamb/posts/cat-ba-binh-lieu-ngay-1/" |
| npm run format:check | All matched files use Prettier code style |
| c3 check | 0 issues |
