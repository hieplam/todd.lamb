import { existsSync } from "node:fs";
import { join } from "node:path";
import { getAssetPath } from "./withBase";

/**
 * Convention: a post's hero illustration lives at
 * `public/images/posts/<post-id>/hero.<ext>`. A real photo (`hero.jpg`,
 * `.jpeg`, `.png` or `.webp`) takes precedence over the generated `hero.svg`
 * placeholder (from `bun scripts/generate-post-images.ts`), so posts can ship
 * a real cover photo simply by dropping it in alongside the post.
 *
 * Returns the base-prefixed URL when a file exists, otherwise undefined so
 * templates can skip the hero block. The existsSync call runs at build time
 * only (Astro frontmatter), never in the browser.
 */
const HERO_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "svg"] as const;

export function getPostHeroImage(id: string): string | undefined {
  const slug = id.split("/").pop() ?? id;
  for (const ext of HERO_EXTENSIONS) {
    const file = join(
      process.cwd(),
      "public/images/posts",
      slug,
      `hero.${ext}`
    );
    if (existsSync(file)) {
      return getAssetPath(`images/posts/${slug}/hero.${ext}`);
    }
  }
  return undefined;
}
