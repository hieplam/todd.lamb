---
id: ref-og-image-generation
c3-seal: 4d3f3a8147157eafb543177ddd05f0417160473311534fb176859318ff55ab03
title: og-image-generation
type: ref
goal: Standardize how Open Graph images are generated at build time so that both the site-level default and per-post OG images are produced by the same pipeline with consistent dimensions and font rendering.
---

## Goal

Standardize how Open Graph images are generated at build time so that both the site-level default and per-post OG images are produced by the same pipeline with consistent dimensions and font rendering.

## Choice

Satori (JSX object tree to SVG) plus Sharp (SVG buffer to PNG) pipeline in Astro API route endpoints, with every Archivo font subset (latin + vietnamese) loaded from Astro fontData via experimental_getFontFileURL and passed to satori as separate font entries, producing 1200x630 PNG images with embedFont enabled.

## Why

Satori runs in Node.js (and serverless edge) without a browser dependency, making it suitable for Astro's static build pipeline. Sharp converts Satori's SVG output to a real PNG at high quality without requiring a canvas or Puppeteer. Using Astro's built-in font API (astro:assets fontData) ensures the same font family that is loaded for the page CSS is also used for OG images, keeping visual consistency; all unicode-range subsets must be passed to satori because a single subset file lacks Vietnamese glyphs. The alternative — pre-generating OG images as static assets — was rejected because it would not support dynamic per-post title rendering without a separate script outside the Astro build. The alternative — using a cloud service like Vercel OG — was rejected because the site builds inside its own Docker image with bun and must not depend on external rendering services.

## How

The OG generation pattern used in src/pages/og.png.ts:

```ts
// REQUIRED pattern for all OG image endpoints
import satori from "satori";
import sharp from "sharp";
import { fontData, experimental_getFontFileURL } from "astro:assets";
import { getFontSourcesByWeight } from "@/utils/getFontPathByWeight";

// 1. Resolve ALL subset font files (latin + vietnamese) from Astro fontData.
//    Satori cannot parse woff2, so the util prefers woff/ttf/otf sources.
const fonts = fontData["--font-archivo"];
const regularFontPaths = getFontSourcesByWeight(fonts, 400);
const boldFontPaths = getFontSourcesByWeight(fonts, 700);

// 2. Fetch every subset as an ArrayBuffer
const [regularData, boldData] = await Promise.all([
  Promise.all(regularFontPaths.map(fetchFont)),
  Promise.all(boldFontPaths.map(fetchFont)),
]);

// 3. Render SVG via Satori — dimensions MUST be 1200x630; one satori font
//    entry per subset buffer so Vietnamese diacritics resolve per glyph
const svg = await satori(jsxObjectTree, {
  width: 1200,
  height: 630,
  embedFont: true, // REQUIRED
  fonts: [
    ...regularData.map(data => ({ name: "Archivo", data, weight: 400, style: "normal" })),
    ...boldData.map(data => ({ name: "Archivo", data, weight: 700, style: "normal" })),
  ],
});

// 4. Convert to PNG via Sharp
const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
return new Response(new Uint8Array(pngBuffer), { headers: { "Content-Type": "image/png" } });
```
