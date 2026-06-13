# Design: Multilingual support for posts

**Date:** 2026-06-13
**Status:** Design approved, pending implementation plan

## Goal

Allow the blog to hold posts in mixed languages (sometimes Vietnamese, sometimes English, occasionally a single post with both translations). Readers only ever see a simple experience — filter by language on the list pages, and switch language inside a post when that post has a translation — without needing to know about the machinery underneath.

## Guiding principles

- **Each post is an independent post.** Language is just an attribute of a post, not a separate "site".
- **No i18n routing for posts.** URLs stay flat as they are today (`/posts/<slug>`). No `/en/` prefix, no per-locale folder split.
- **The complexity stays hidden.** The concept of a "translation pair" is an internal detail; readers only see the language filter and (when present) the language switch button.
- **Do not break the 46 existing posts.** Old posts default to Vietnamese and need no edits.

## Data model

Add two optional fields to the post schema in `src/content.config.ts`:

```yaml
lang: vi                  # language of the post. Defaults to "vi" if omitted.
multiLangKey: xuyen-viet  # optional. Posts sharing this value are translations of each other.
```

| Field | Type | Required | Default | Meaning |
| --- | --- | --- | --- | --- |
| `lang` | string (`"vi"` \| `"en"`) | No | `"vi"` | Language of the post. Because it defaults to `vi`, all 46 existing posts are Vietnamese automatically with no edits. |
| `multiLangKey` | string | No | (none) | Key that links the multi-language versions. Two posts with the **same `multiLangKey`** but **different `lang`** are treated as a translation pair. A standalone post leaves this empty. |

Constraint: within one `multiLangKey`, each `lang` should appear only once (no two English versions for the same key). This is an authoring convention, not hard-enforced in the first version.

## Components & flow

### 1. Language filter on the list pages (mirrors the tag system)

Mirrors the existing mechanism in `src/pages/tags/[tag]/[...page].astro`.

- `/posts` → all posts, **pagination kept** as it is today.
- `/posts/lang/vi`, `/posts/lang/en` → posts filtered by each language, **also paginated**.
- A filter bar shows the options `All · Tiếng Việt · English`, each a link to its corresponding page. Only render languages that actually have posts (derived from the post set at build time).
- The currently-viewed option is highlighted (active state).

Reason for the "separate pages" approach over client-side filtering: the post count grows over time and pagination must be kept; JavaScript filtering of already-rendered cards would break pagination (it can only filter the current page). Separate pages reuse the same `paginate()` Astro already uses for tags.

### 2. Language switch button inside a post (only when a pair exists)

On the post detail page (`src/pages/posts/[...slug]/index.astro`):

- At build time, for each post that has a `multiLangKey`, find other posts with the same key but a different `lang`.
- If found → render a small button/link "🇺🇸 English" or "🇻🇳 Tiếng Việt" pointing to the URL of the other version.
- If no pair → **render nothing** (standalone posts — the majority — show no button).

### 3. Language badge on the post card

In `src/components/Card.astro`, each post card shows a small language badge (e.g. `🇻🇳 VI` or `🇺🇸 EN`) so that, when scanning the list — especially the mixed `All` view — readers can tell at a glance which language a post is in. The badge reuses the theme's existing styling (similar to how tags render) and does not disrupt the card layout.

### 4. Correct `<html lang>` per post

The post detail page sets the `<html>` element's `lang` attribute from the post's `lang` (good for SEO and screen readers). List/chrome pages keep the site's default language.

### 5. Shared utilities

- A helper that derives the list of languages that have posts (to build the filter bar) — similar to `getUniqueTags`.
- A helper that finds the sibling translation by `multiLangKey` (used by the switch button).

## Out of scope (YAGNI)

- **No** change to i18n routing in `astro.config.ts`. The existing `locales`/`defaultLocale` config stays; it serves the UI-string language, not the post language.
- **No** translation of the UI chrome based on post language. When reading an English post, chrome strings (menu, buttons...) stay in the site default language. Can be added later, out of this version's scope.
- **No** merging/deduplication of translation pairs in the `All` list. In `All`, both the Vietnamese and English versions appear as two cards — readers use the filter to narrow down.
- **No** migration of the 46 existing posts.

## Error handling & edge cases

| Situation | Behavior |
| --- | --- |
| Post does not declare `lang` | Defaults to `vi`. |
| Post has `multiLangKey` but no sibling found | No switch button shown (treated as standalone). |
| `multiLangKey` has more than one post with the same `lang` | First version: take the first matching post; no build error. Note for a possible future warning. |
| Only one language exists across the whole blog | The filter bar still renders but only with `All` + that language; the bar may be hidden when only one language exists. |

## Testing

- **Schema:** a post missing `lang` builds as `lang: vi`; a post with `lang: en` is preserved correctly.
- **Filter:** `/posts/lang/en` contains only `en` posts; pagination works when exceeding `perPage`.
- **Filter bar:** lists only languages that actually have posts; the active state matches the current page.
- **Switch button:** shown exactly when a pair exists, points to the correct other-language URL; hidden when no pair.
- **Badge:** each card renders the correct language badge.
- **No regression:** the 46 existing posts still build and display normally; `/posts` and `/tags` behavior is unchanged.
- **`astro build`** completes with no errors.

## Definition of done

1. Schema has `lang` (default `vi`) and `multiLangKey` (optional).
2. There are language-filtered list pages, paginated, with an `All · Tiếng Việt · English` filter bar.
3. The language switch button appears in a post if and only if the post has a translation pair.
4. Each post card shows a language badge.
5. The 46 existing posts need no edits and build cleanly.
6. There is one sample bilingual post (vi + en sharing one `multiLangKey`) to validate the whole flow.
