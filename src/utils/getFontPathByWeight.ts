import type { FontData } from "astro:assets";

/**
 * Returns one font file URL per FontData entry matching the weight/style —
 * i.e. every unicode-range subset (latin, vietnamese, ...). Satori needs all
 * of them to render Vietnamese diacritics, and it cannot parse woff2, so
 * woff/ttf/otf sources are preferred.
 */
export function getFontSourcesByWeight(
  fonts: FontData[],
  weight: number,
  options?: { style?: "normal" | "italic" }
): string[] {
  const style = options?.style ?? "normal";
  const satoriFormats = new Set(["truetype", "opentype", "woff"]);
  const urls: string[] = [];

  for (const font of fonts) {
    if (font.weight === String(weight) && font.style === style) {
      const src =
        font.src.find(
          file => file.format !== undefined && satoriFormats.has(file.format)
        ) ?? font.src.find(file => file.format !== "woff2");
      if (src) urls.push(src.url);
    }
  }

  return urls;
}
