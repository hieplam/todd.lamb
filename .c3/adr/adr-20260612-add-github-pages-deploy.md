---
id: adr-20260612-add-github-pages-deploy
c3-seal: e1d9918105c15f50e3a98bf42adbbf571e73112bcd99ed5ae889966a5f9294fc
title: add-github-pages-deploy
type: adr
goal: 'Add a second, standalone deployment target for the blog: GitHub Pages serving the static Astro build at `https://hieplam.github.io/todd.lamb`. This authorizes (1) configuring Astro for project-page hosting under the `/todd.lamb` base path, and (2) a new GitHub Actions workflow that builds the site with bun and publishes `dist/` to GitHub Pages. The existing Docker/nginx/Dokploy serving path (c3-107) is left intact as a separate target.'
status: implemented
date: "2026-06-12"
---

## Goal

Add a second, standalone deployment target for the blog: GitHub Pages serving the static Astro build at `https://hieplam.github.io/todd.lamb`. This authorizes (1) configuring Astro for project-page hosting under the `/todd.lamb` base path, and (2) a new GitHub Actions workflow that builds the site with bun and publishes `dist/` to GitHub Pages. The existing Docker/nginx/Dokploy serving path (c3-107) is left intact as a separate target.

## Context

Today the blog has exactly one deploy path: the two-stage Dockerfile + nginx image (c3-107) that Dokploy builds and serves at the custom domain `blog.hieplam.dev`. The Astro config currently sets `site: config.site.url` with no `base`, assuming root-domain hosting. The owner wants a zero-infra, free hosting option on GitHub Pages. GitHub Pages for a non-`*.github.io` repo serves under a repository sub-path (`/todd.lamb`), which requires Astro's `base` to be set so every emitted asset, link, RSS item, OG image and the Pagefind search bundle resolve under that prefix. The template (AstroPaper v6) is already base-path aware: `src/utils/withBase.ts` (`getAssetPath`/`stripBase`) and `getRelativeLocaleUrl` prepend `import.meta.env.BASE_URL`, and `src/pages/search.astro` loads the Pagefind bundle via `getAssetPath("pagefind/")`. Affected topology: c3-106 (ci-release, owns `.github/workflows/*`) and the uncharted Astro config files `astro.config.ts` / `astro-paper.config.ts`.

## Decision

Make `astro-paper.config.ts` `site.url` the single source of truth for the deployed public URL, set to `https://hieplam.github.io/todd.lamb/`. In `astro.config.ts`, derive `site` from its origin and `base` from its pathname via `new URL(config.site.url)`. This keeps one URL string authoritative, automatically feeds RSS (`config.site.url`) and the OG hostname, and lets `withBase`/i18n handle every link. Deployment is a dedicated workflow `.github/workflows/deploy.yml` that reuses the existing `bun run build` script (so `astro check` + `pagefind` index generation run unchanged), then uploads `dist/` via `actions/upload-pages-artifact` and publishes with `actions/deploy-pages`. A manual bun-based workflow is chosen over `withastro/action` because the project's build script does extra steps (astro check, pagefind, copy) that the canned action would skip. This belongs to c3-106 (it is a GitHub Actions delivery workflow), parallel to — not replacing — c3-107.

## Affected Topology

| Entity | Type | Why affected | Governance review |
| --- | --- | --- | --- |
| c3-106 | component | Owns all .github/workflows/*; gains deploy.yml as a new delivery workflow, so Purpose + Owned files + Contract must record the Pages publish path | Review rule-prettier-format compliance for the new YAML; update Purpose/Owned files/Contract |
| c3-107 | component | Conceptually adjacent (it is the other deploy target) but unchanged: still owns Docker/nginx/Dokploy; no files altered | Confirm no-delta: Dockerfile/compose/docker untouched |
| astro.config.ts | N.A - uncharted | Build config file with no C3 component owner (coverage gap); receives the site/base derivation | Flag coverage gap; ownership undecided, no component contract to satisfy |
| astro-paper.config.ts | N.A - uncharted | Build config file with no C3 component owner (coverage gap); site.url value changes | Flag coverage gap; ownership undecided |

## Compliance Refs

| Ref | Why required | Action |
| --- | --- | --- |
| N.A - no ref governs CI/CD workflow YAML or Astro build configuration | The four C3 refs cover content-schema, i18n-strategy, og-image-generation, and tailwind-design-system — none touch GitHub Actions or astro.config.ts | N.A |

## Compliance Rules

| Rule | Why required | Action |
| --- | --- | --- |
| rule-prettier-format | The new .github/workflows/deploy.yml and edited astro.config.ts/astro-paper.config.ts are TS/YAML files in scope for Prettier; CI runs format:check | Comply: run bun run format and bun run format:check before commit |
| rule-no-console | Touched files (config + YAML) must not introduce console.*; trivially satisfied but listed because edited TS is in scope | Comply: no console statements added |

## Work Breakdown

| Area | Detail | Evidence |
| --- | --- | --- |
| Astro paper config | Set site.url to https://hieplam.github.io/todd.lamb/; update the stale "Dokploy deployment" comment to note GitHub Pages is the canonical URL | astro-paper.config.ts |
| Astro config | Derive const deployUrl = new URL(config.site.url); site: deployUrl.origin; base: deployUrl.pathname | astro.config.ts |
| Pages workflow | New .github/workflows/deploy.yml: on push to main + workflow_dispatch; jobs build (checkout, setup-bun, bun install --frozen-lockfile, bun run build, upload-pages-artifact path dist/) and deploy (deploy-pages) with pages: write/id-token: write permissions and a github-pages concurrency group | .github/workflows/deploy.yml |
| Docs | README: add a short "Deploy to GitHub Pages" note pointing to the workflow and the Settings → Pages → Source = GitHub Actions step | README.md |
| C3 docs | Update c3-106 Purpose, Owned files, and Contract to include the Pages publish path | c3 write c3-106 |

## Underlay C3 Changes

| Underlay area | Exact C3 change | Verification evidence |
| --- | --- | --- |
| N.A - no C3 CLI/validator/schema/template/test change | This ADR adds a product deploy path and edits a component doc body; it does not modify the c3x binary, validators, schemas, hints, or tests | c3 check passes after c3 write c3-106 edits |

## Enforcement Surfaces

| Surface | Behavior | Evidence |
| --- | --- | --- |
| .github/workflows/deploy.yml Actions run | Publishes only when bun run build exits 0; a broken build (incl. astro check) fails the deploy, catching base-path/link regressions | deploy.yml build job |
| .github/workflows/ci.yml format:check + lint + build | Catches Prettier drift and build breakage on PR before merge | ci.yml |
| c3 check | Confirms c3-106 doc body matches the new owned deploy.yml and stays drift-free | c3 check output |

## Alternatives Considered

| Alternative | Rejected because |
| --- | --- |
| withastro/action canned Pages action | It runs only astro build and would skip this project's pagefind index build and astro check, breaking on-site search and dropping the type/content gate |
| Keep site.url = blog.hieplam.dev, hard-code base/site literals in astro.config.ts | Splits the deployed-URL truth across two files; RSS (config.site.url) and OG hostname would point at the wrong host on the Pages build |
| User-site repo hieplam.github.io (root, no base) | Requires renaming/creating a separate repo; owner explicitly chose the project-page hieplam.github.io/todd.lamb URL |
| Deploy via the existing Docker image to Pages | GitHub Pages serves static files only; it cannot run the nginx/Docker image, so c3-107's serving layer is irrelevant here |

## Risks

| Risk | Mitigation | Verification |
| --- | --- | --- |
| Base path breaks assets/links/search (relative URLs 404 under /todd.lamb) | Template is base-aware via getAssetPath/getRelativeLocaleUrl; Pagefind loads via getAssetPath("pagefind/") | bun run build then bun run preview and load /todd.lamb/, click a post, and run a search; assert no 404s |
| Canonical/RSS/OG now point at github.io instead of blog.hieplam.dev, diverging from the Dokploy target | Documented tradeoff: github.io is made the canonical URL per owner's choice of option 2; Dokploy path remains buildable but secondary | Inspect built dist/rss.xml and a page's <link rel=canonical> for hieplam.github.io/todd.lamb |
| Pages not enabled / wrong source in repo settings causes deploy job to fail | README documents Settings → Pages → Source = GitHub Actions one-time step | First workflow run goes green and the URL serves |

## Verification

| Check | Result |
| --- | --- |
| bun run build | Exits 0; dist/ produced with /todd.lamb/ asset prefixes and dist/pagefind/ present |
| grep -r "hieplam.github.io/todd.lamb" dist/rss.xml dist/index.html | Canonical/RSS URLs carry the base path |
| bun run format:check and bun run lint | Pass (rule-prettier-format, rule-no-console) |
| c3 check | No issues after c3-106 body update |
