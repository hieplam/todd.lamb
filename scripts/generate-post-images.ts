/**
 * Deterministic SVG scenery generator for blog posts.
 *
 * Reads scripts/trips.json and renders, per trip:
 *   public/images/posts/<slug>/hero.svg     (1600x900, card/post hero)
 *   public/images/posts/<slug>/scene-1.svg  (1600x900, inline)
 *   public/images/posts/<slug>/scene-2.svg  (1600x900, inline)
 * Plus site-wide assets:
 *   public/images/site/hero.svg             (2400x1000, homepage panorama)
 *   public/default-og.jpg                   (1200x630, via sharp)
 *
 * Everything is seeded from the slug, so re-running the script is a no-op
 * diff-wise. No network, no stock photos, no licensing risk.
 *
 * Run: bun scripts/generate-post-images.ts
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import sharp from "sharp";

const ROOT = dirname(import.meta.dirname ?? ".");
const TRIPS = JSON.parse(
  readFileSync(join(ROOT, "scripts/trips.json"), "utf8")
) as Array<{ slug: string; scene: string }>;

const W = 1600;
const H = 900;

/* ---------------------------------- rng ---------------------------------- */

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --------------------------------- color --------------------------------- */

type Hsl = { h: number; s: number; l: number };

const hsl = (h: number, s: number, l: number): Hsl => ({ h, s, l });
const css = ({ h, s, l }: Hsl, a = 1) =>
  a >= 1
    ? `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`
    : `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}% / ${a.toFixed(3)})`;

function mix(a: Hsl, b: Hsl, t: number): Hsl {
  // shortest-path hue interpolation
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return hsl(
    (a.h + dh * t + 360) % 360,
    a.s + (b.s - a.s) * t,
    a.l + (b.l - a.l) * t
  );
}

/* --------------------------------- scenes -------------------------------- */

type SceneSpec = {
  /** sky gradient stops, top to horizon */
  sky: Hsl[];
  /** celestial body */
  sun?: { y: number; color: Hsl; r: number; glow: number };
  /** near-ridge base color (far ridges blend toward horizon sky) */
  ridge: Hsl;
  ridges: [number, number];
  /** ridge jaggedness 0 smooth .. 1 sharp */
  jag: number;
  horizon: number;
  stars?: boolean;
  fog?: number;
  water?: boolean;
  terraces?: boolean;
  road?: boolean;
  blossoms?: boolean;
  waterfall?: boolean;
  towers?: boolean;
  cone?: boolean;
  dunes?: boolean;
  islets?: boolean;
  canyon?: boolean;
};

function sceneSpec(name: string, rnd: () => number): SceneSpec {
  const v = (a: number, b: number) => a + (b - a) * rnd();
  switch (name) {
    case "sunrise":
      return {
        sky: [hsl(248, 42, 22), hsl(330, 45, 48), hsl(28, 85, 62)],
        sun: { y: 0.92, color: hsl(35, 95, 72), r: 64, glow: 200 },
        ridge: hsl(262, 25, 16),
        ridges: [5, 7],
        jag: v(0.35, 0.55),
        horizon: v(0.6, 0.68),
        road: rnd() > 0.4,
        fog: 0.25,
      };
    case "sunset":
      return {
        sky: [hsl(265, 38, 26), hsl(348, 55, 46), hsl(22, 90, 58)],
        sun: { y: 0.88, color: hsl(24, 95, 66), r: 78, glow: 230 },
        ridge: hsl(280, 28, 14),
        ridges: [5, 7],
        jag: v(0.35, 0.6),
        horizon: v(0.58, 0.66),
        road: rnd() > 0.5,
      };
    case "night":
      return {
        sky: [hsl(232, 45, 8), hsl(228, 40, 14), hsl(222, 35, 22)],
        sun: { y: 0.28, color: hsl(48, 35, 88), r: 36, glow: 110 },
        ridge: hsl(228, 30, 9),
        ridges: [4, 6],
        jag: v(0.3, 0.5),
        horizon: v(0.6, 0.68),
        stars: true,
        road: true,
      };
    case "fog":
      return {
        sky: [hsl(210, 14, 74), hsl(210, 12, 82), hsl(36, 18, 86)],
        sun: { y: 0.45, color: hsl(40, 30, 92), r: 46, glow: 90 },
        ridge: hsl(212, 16, 30),
        ridges: [6, 8],
        jag: v(0.3, 0.5),
        horizon: v(0.62, 0.7),
        fog: 0.8,
      };
    case "karst":
      return {
        sky: [hsl(200, 45, 58), hsl(180, 30, 72), hsl(46, 55, 80)],
        sun: { y: 0.7, color: hsl(44, 80, 84), r: 52, glow: 130 },
        ridge: hsl(195, 32, 18),
        ridges: [6, 8],
        jag: v(0.75, 0.95),
        horizon: v(0.62, 0.72),
        fog: 0.35,
      };
    case "rice":
      return {
        sky: [hsl(202, 50, 60), hsl(190, 35, 74), hsl(48, 60, 78)],
        sun: { y: 0.6, color: hsl(46, 85, 82), r: 48, glow: 110 },
        ridge: hsl(150, 28, 22),
        ridges: [3, 4],
        jag: v(0.25, 0.4),
        horizon: v(0.42, 0.5),
        terraces: true,
      };
    case "coast":
      return {
        sky: [hsl(208, 60, 52), hsl(196, 50, 66), hsl(40, 60, 76)],
        sun: { y: 0.75, color: hsl(42, 90, 78), r: 56, glow: 150 },
        ridge: hsl(210, 35, 20),
        ridges: [3, 4],
        jag: v(0.4, 0.6),
        horizon: v(0.5, 0.56),
        water: true,
      };
    case "canyon":
      return {
        sky: [hsl(212, 45, 38), hsl(200, 40, 56), hsl(38, 55, 70)],
        sun: { y: 0.55, color: hsl(42, 80, 80), r: 44, glow: 110 },
        ridge: hsl(215, 30, 13),
        ridges: [3, 4],
        jag: v(0.6, 0.8),
        horizon: v(0.55, 0.62),
        canyon: true,
        water: true,
      };
    case "waterfall":
      return {
        sky: [hsl(195, 40, 56), hsl(185, 32, 70), hsl(80, 25, 76)],
        sun: { y: 0.5, color: hsl(50, 60, 86), r: 40, glow: 90 },
        ridge: hsl(160, 25, 16),
        ridges: [4, 5],
        jag: v(0.45, 0.65),
        horizon: v(0.58, 0.66),
        waterfall: true,
        fog: 0.3,
      };
    case "lake":
      return {
        sky: [hsl(215, 48, 46), hsl(200, 42, 62), hsl(36, 50, 72)],
        sun: { y: 0.7, color: hsl(40, 85, 78), r: 50, glow: 130 },
        ridge: hsl(218, 32, 18),
        ridges: [4, 5],
        jag: v(0.35, 0.55),
        horizon: v(0.5, 0.56),
        water: true,
      };
    case "forest":
      return {
        sky: [hsl(170, 30, 52), hsl(150, 25, 68), hsl(60, 35, 78)],
        sun: { y: 0.55, color: hsl(52, 70, 84), r: 42, glow: 100 },
        ridge: hsl(158, 35, 12),
        ridges: [6, 8],
        jag: v(0.55, 0.75),
        horizon: v(0.6, 0.7),
        fog: 0.45,
      };
    case "dunes":
      return {
        sky: [hsl(205, 55, 58), hsl(28, 55, 72), hsl(38, 80, 70)],
        sun: { y: 0.65, color: hsl(40, 95, 74), r: 60, glow: 150 },
        ridge: hsl(30, 60, 42),
        ridges: [4, 5],
        jag: 0.08,
        horizon: v(0.5, 0.58),
        dunes: true,
      };
    case "grassland":
      return {
        sky: [hsl(210, 45, 62), hsl(195, 35, 74), hsl(50, 55, 78)],
        sun: { y: 0.62, color: hsl(48, 80, 80), r: 50, glow: 120 },
        ridge: hsl(95, 30, 30),
        ridges: [4, 5],
        jag: 0.15,
        horizon: v(0.52, 0.6),
      };
    case "river":
      return {
        sky: [hsl(206, 48, 56), hsl(192, 40, 70), hsl(42, 55, 76)],
        sun: { y: 0.68, color: hsl(44, 85, 78), r: 52, glow: 130 },
        ridge: hsl(200, 28, 22),
        ridges: [3, 4],
        jag: v(0.25, 0.4),
        horizon: v(0.48, 0.55),
        water: true,
      };
    case "mangrove":
      return {
        sky: [hsl(190, 40, 58), hsl(170, 30, 72), hsl(48, 50, 76)],
        sun: { y: 0.7, color: hsl(46, 80, 80), r: 50, glow: 120 },
        ridge: hsl(165, 35, 14),
        ridges: [2, 3],
        jag: 0.2,
        horizon: v(0.5, 0.55),
        water: true,
        islets: true,
      };
    case "blossom":
      return {
        sky: [hsl(210, 35, 70), hsl(330, 25, 82), hsl(40, 40, 84)],
        sun: { y: 0.5, color: hsl(45, 55, 88), r: 44, glow: 90 },
        ridge: hsl(255, 18, 30),
        ridges: [4, 5],
        jag: v(0.3, 0.45),
        horizon: v(0.6, 0.68),
        blossoms: true,
        fog: 0.3,
      };
    case "volcanic":
      return {
        sky: [hsl(220, 45, 44), hsl(345, 40, 58), hsl(28, 75, 64)],
        sun: { y: 0.8, color: hsl(30, 90, 70), r: 60, glow: 160 },
        ridge: hsl(250, 25, 14),
        ridges: [2, 3],
        jag: 0.3,
        horizon: v(0.52, 0.58),
        water: true,
        cone: true,
      };
    case "temple":
      return {
        sky: [hsl(262, 40, 30), hsl(20, 60, 52), hsl(38, 85, 62)],
        sun: { y: 0.85, color: hsl(34, 95, 70), r: 70, glow: 190 },
        ridge: hsl(268, 28, 12),
        ridges: [3, 4],
        jag: 0.25,
        horizon: v(0.6, 0.66),
        towers: true,
      };
    case "garage":
    default:
      return {
        sky: [hsl(232, 45, 8), hsl(228, 40, 14), hsl(222, 35, 22)],
        sun: { y: 0.25, color: hsl(48, 35, 88), r: 34, glow: 100 },
        ridge: hsl(228, 30, 9),
        ridges: [4, 5],
        jag: 0.4,
        horizon: 0.64,
        stars: true,
        road: true,
      };
  }
}

/* ------------------------------- primitives ------------------------------ */

function ridgePath(
  rnd: () => number,
  baseY: number,
  amp: number,
  jag: number,
  width = W,
  height = H
): string {
  const n = 14 + Math.floor(rnd() * 8);
  const phase = [rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2];
  const freq = [1.1 + rnd() * 0.8, 2.3 + rnd() * 1.4, 5 + rnd() * 3];
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * width;
    const t = (i / n) * Math.PI * 2;
    let y =
      Math.sin(t * freq[0] + phase[0]) * 0.55 +
      Math.sin(t * freq[1] + phase[1]) * 0.3 +
      Math.sin(t * freq[2] + phase[2]) * 0.15;
    if (jag > 0.6) y = Math.sign(y) * Math.pow(Math.abs(y), 0.72);
    y = baseY - (y * 0.5 + 0.5) * amp - (rnd() - 0.5) * amp * jag * 0.35;
    pts.push([x, y]);
  }
  let d = `M0 ${height} L0 ${pts[0][1].toFixed(1)}`;
  if (jag > 0.6) {
    // pointed limestone profile: straight segments
    for (const [x, y] of pts) d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  } else {
    // smooth profile: quadratic through midpoints
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1];
      const [x, y] = pts[i];
      const mx = (px + x) / 2;
      const my = (py + y) / 2;
      d += ` Q${px.toFixed(1)} ${py.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    d += ` L${width} ${pts[pts.length - 1][1].toFixed(1)}`;
  }
  d += ` L${width} ${height} Z`;
  return d;
}

function roadPath(rnd: () => number, horizonY: number): string {
  const vx = W * (0.35 + rnd() * 0.3);
  const bx = W * (0.3 + rnd() * 0.4);
  const halfBottom = W * 0.16;
  const bend = (rnd() - 0.5) * W * 0.35;
  const left = `M${(bx - halfBottom).toFixed(1)} ${H} C${(bx - halfBottom + bend).toFixed(1)} ${(H + horizonY) / 2} ${(vx - 6).toFixed(1)} ${(horizonY + 70).toFixed(1)} ${vx.toFixed(1)} ${horizonY.toFixed(1)}`;
  const right = `L${(vx + 2).toFixed(1)} ${horizonY.toFixed(1)} C${(vx + 10).toFixed(1)} ${(horizonY + 70).toFixed(1)} ${(bx + halfBottom + bend).toFixed(1)} ${(H + horizonY) / 2} ${(bx + halfBottom).toFixed(1)} ${H} Z`;
  return `${left} ${right}`;
}

function centerlinePath(rnd: () => number, horizonY: number): string {
  const vx = W * (0.35 + rnd() * 0.3);
  const bx = W * (0.3 + rnd() * 0.4);
  const bend = (rnd() - 0.5) * W * 0.35;
  return `M${bx.toFixed(1)} ${H} C${(bx + bend).toFixed(1)} ${(H + horizonY) / 2} ${vx.toFixed(1)} ${(horizonY + 60).toFixed(1)} ${(vx + 1).toFixed(1)} ${horizonY.toFixed(1)}`;
}

/* -------------------------------- renderer ------------------------------- */

function renderScene(slug: string, variant: string, sceneName: string): string {
  const rnd = mulberry32(hashSeed(`${slug}:${variant}`));
  const s = sceneSpec(sceneName, rnd);
  const horizonY = H * s.horizon;
  const skyHorizon = s.sky[s.sky.length - 1];
  const uid = `g${hashSeed(`${slug}:${variant}:ids`).toString(36)}`;

  const defs: string[] = [];
  const body: string[] = [];

  // sky
  const stops = s.sky
    .map(
      (c, i) =>
        `<stop offset="${((i / (s.sky.length - 1)) * 100).toFixed(0)}%" stop-color="${css(c)}"/>`
    )
    .join("");
  defs.push(
    `<linearGradient id="${uid}-sky" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>`
  );
  body.push(
    `<rect width="${W}" height="${horizonY.toFixed(1)}" fill="url(#${uid}-sky)"/>`
  );
  // ground base under horizon (ridges cover it)
  body.push(
    `<rect y="${(horizonY - 1).toFixed(1)}" width="${W}" height="${(H - horizonY + 1).toFixed(1)}" fill="${css(mix(s.ridge, skyHorizon, 0.25))}"/>`
  );

  // stars
  if (s.stars) {
    const n = 90 + Math.floor(rnd() * 70);
    const dots: string[] = [];
    for (let i = 0; i < n; i++) {
      const x = rnd() * W;
      const y = rnd() * horizonY * 0.92;
      const r = rnd() < 0.12 ? 1.6 + rnd() : 0.6 + rnd() * 0.7;
      const o = 0.35 + rnd() * 0.6;
      dots.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="hsl(50 30% 92% / ${o.toFixed(2)})"/>`
      );
    }
    body.push(`<g>${dots.join("")}</g>`);
  }

  // sun / moon with glow
  if (s.sun) {
    const sx = W * (0.25 + rnd() * 0.5);
    const sy = horizonY * s.sun.y;
    defs.push(
      `<radialGradient id="${uid}-glow"><stop offset="0%" stop-color="${css(s.sun.color, 0.85)}"/><stop offset="45%" stop-color="${css(s.sun.color, 0.25)}"/><stop offset="100%" stop-color="${css(s.sun.color, 0)}"/></radialGradient>`
    );
    body.push(
      `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${s.sun.glow}" fill="url(#${uid}-glow)"/>`,
      `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${s.sun.r}" fill="${css(s.sun.color)}"/>`
    );
  }

  // volcanic cone behind ridges
  if (s.cone) {
    const cx = W * (0.3 + rnd() * 0.4);
    const cw = W * 0.5;
    const top = horizonY * 0.45;
    const crater = cw * 0.07;
    const c = mix(s.ridge, skyHorizon, 0.45);
    body.push(
      `<path d="M${(cx - cw / 2).toFixed(1)} ${horizonY} Q${(cx - crater * 1.6).toFixed(1)} ${(top + 30).toFixed(1)} ${(cx - crater).toFixed(1)} ${top.toFixed(1)} L${(cx + crater).toFixed(1)} ${top.toFixed(1)} Q${(cx + crater * 1.6).toFixed(1)} ${(top + 30).toFixed(1)} ${(cx + cw / 2).toFixed(1)} ${horizonY} Z" fill="${css(c)}"/>`
    );
  }

  // ridge layers, far -> near, blending from sky toward ridge color
  const nRidges =
    s.ridges[0] + Math.floor(rnd() * (s.ridges[1] - s.ridges[0] + 1));
  for (let i = 0; i < nRidges; i++) {
    const t = nRidges === 1 ? 1 : i / (nRidges - 1);
    const color = mix(mix(skyHorizon, s.ridge, 0.22), s.ridge, t * t);
    const baseY = horizonY + (H - horizonY) * (0.06 + t * 0.5);
    const amp =
      (horizonY * (0.5 - t * 0.32) + 24) * (s.dunes ? 0.55 : 1) * (0.8 + rnd() * 0.4);
    body.push(
      `<path d="${ridgePath(rnd, baseY, amp, s.dunes ? 0.05 : s.jag)}" fill="${css(color)}"/>`
    );
    // fog band between layers
    if (s.fog && i < nRidges - 1 && rnd() < s.fog) {
      defs.push(
        `<linearGradient id="${uid}-fog${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="hsl(40 20% 96% / 0)"/><stop offset="55%" stop-color="hsl(40 20% 96% / ${(0.16 + rnd() * 0.22).toFixed(2)})"/><stop offset="100%" stop-color="hsl(40 20% 96% / 0)"/></linearGradient>`
      );
      const fy = baseY - amp * 0.4;
      body.push(
        `<rect x="0" y="${fy.toFixed(1)}" width="${W}" height="${(amp * 0.9).toFixed(1)}" fill="url(#${uid}-fog${i})"/>`
      );
    }
  }

  // canyon walls
  if (s.canyon) {
    const wall = css(mix(s.ridge, hsl(s.ridge.h, s.ridge.s, 6), 0.5));
    body.push(
      `<path d="M0 ${H} L0 ${(horizonY * 0.2).toFixed(1)} Q${(W * 0.18).toFixed(1)} ${(horizonY * 0.6).toFixed(1)} ${(W * 0.32).toFixed(1)} ${H} Z" fill="${wall}"/>`,
      `<path d="M${W} ${H} L${W} ${(horizonY * 0.12).toFixed(1)} Q${(W * 0.84).toFixed(1)} ${(horizonY * 0.55).toFixed(1)} ${(W * 0.66).toFixed(1)} ${H} Z" fill="${wall}"/>`
    );
  }

  // temple towers silhouette on the nearest far ridge
  if (s.towers) {
    const c = css(mix(s.ridge, skyHorizon, 0.18));
    const n = 3 + Math.floor(rnd() * 2);
    const towers: string[] = [];
    for (let i = 0; i < n; i++) {
      const tx = W * (0.2 + (0.6 * i) / Math.max(1, n - 1) + (rnd() - 0.5) * 0.06);
      const th = horizonY * (0.28 + rnd() * 0.16) * (i === Math.floor(n / 2) ? 1.25 : 1);
      const tw = th * 0.42;
      const by = horizonY + 8;
      towers.push(
        `<path d="M${(tx - tw / 2).toFixed(1)} ${by.toFixed(1)} C${(tx - tw * 0.32).toFixed(1)} ${(by - th * 0.45).toFixed(1)} ${(tx - tw * 0.16).toFixed(1)} ${(by - th * 0.8).toFixed(1)} ${tx.toFixed(1)} ${(by - th).toFixed(1)} C${(tx + tw * 0.16).toFixed(1)} ${(by - th * 0.8).toFixed(1)} ${(tx + tw * 0.32).toFixed(1)} ${(by - th * 0.45).toFixed(1)} ${(tx + tw / 2).toFixed(1)} ${by.toFixed(1)} Z" fill="${c}"/>`
      );
    }
    body.push(`<g>${towers.join("")}</g>`);
  }

  // water with reflection glitter
  if (s.water) {
    const wTop = horizonY;
    defs.push(
      `<linearGradient id="${uid}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${css(mix(skyHorizon, hsl(210, 40, 24), 0.45))}"/><stop offset="100%" stop-color="${css(mix(s.ridge, hsl(215, 45, 12), 0.6))}"/></linearGradient>`
    );
    body.push(
      `<rect y="${wTop.toFixed(1)}" width="${W}" height="${(H - wTop).toFixed(1)}" fill="url(#${uid}-water)"/>`
    );
    if (s.sun) {
      const sx = W * 0.5; // glitter column roughly central
      const streaks: string[] = [];
      const n = 16 + Math.floor(rnd() * 10);
      for (let i = 0; i < n; i++) {
        const gy = wTop + 14 + ((H - wTop - 30) * i) / n + rnd() * 8;
        const gw = (20 + rnd() * 90) * (0.4 + (gy - wTop) / (H - wTop));
        const gx = sx + (rnd() - 0.5) * 140 * ((gy - wTop) / (H - wTop) + 0.3);
        const o = 0.5 * (1 - (gy - wTop) / (H - wTop)) + 0.08;
        streaks.push(
          `<rect x="${(gx - gw / 2).toFixed(1)}" y="${gy.toFixed(1)}" width="${gw.toFixed(1)}" height="3.2" rx="1.6" fill="${css(s.sun.color, o)}"/>`
        );
      }
      body.push(`<g>${streaks.join("")}</g>`);
    }
    // islets (mangrove)
    if (s.islets) {
      const blobs: string[] = [];
      const n = 6 + Math.floor(rnd() * 5);
      for (let i = 0; i < n; i++) {
        const bx = rnd() * W;
        const by = wTop + (H - wTop) * (0.15 + rnd() * 0.55);
        const bw = 60 + rnd() * 180;
        const bh = 10 + rnd() * 16 + (by - wTop) * 0.06;
        blobs.push(
          `<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${bw.toFixed(1)}" ry="${bh.toFixed(1)}" fill="${css(mix(s.ridge, hsl(160, 30, 8), (by - wTop) / (H - wTop)))}"/>`
        );
      }
      body.push(`<g>${blobs.join("")}</g>`);
    }
  }

  // rice terraces in the foreground
  if (s.terraces) {
    const bands = 11 + Math.floor(rnd() * 5);
    const greens = [hsl(95, 45, 42), hsl(75, 50, 48), hsl(55, 55, 52), hsl(105, 40, 36)];
    const paths: string[] = [];
    for (let i = 0; i < bands; i++) {
      const t = i / bands;
      const y0 = horizonY + (H - horizonY) * t;
      const amp = 26 + t * 60;
      const ph = rnd() * Math.PI * 2;
      const c = mix(greens[i % greens.length], hsl(40, 20, 18), t * 0.55);
      let d = `M0 ${H} L0 ${y0.toFixed(1)}`;
      const n = 16;
      for (let k = 1; k <= n; k++) {
        const x = (k / n) * W;
        const y = y0 + Math.sin((k / n) * Math.PI * 2 * (1.2 + t) + ph) * amp * 0.4;
        d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      d += ` L${W} ${H} Z`;
      paths.push(`<path d="${d}" fill="${css(c)}"/>`);
    }
    body.push(`<g>${paths.join("")}</g>`);
  }

  // waterfall
  if (s.waterfall) {
    const fx = W * (0.55 + rnd() * 0.2);
    const fw = 46 + rnd() * 30;
    const top = horizonY * (0.35 + rnd() * 0.15);
    defs.push(
      `<linearGradient id="${uid}-fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="hsl(190 30% 96% / 0.95)"/><stop offset="100%" stop-color="hsl(190 35% 88% / 0.55)"/></linearGradient>`
    );
    body.push(
      `<rect x="${(fx - fw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${fw.toFixed(1)}" height="${(H * 0.78 - top).toFixed(1)}" rx="${(fw / 2.4).toFixed(1)}" fill="url(#${uid}-fall)"/>`,
      `<ellipse cx="${fx.toFixed(1)}" cy="${(H * 0.8).toFixed(1)}" rx="${(fw * 2.4).toFixed(1)}" ry="26" fill="hsl(190 30% 94% / 0.5)"/>`
    );
  }

  // road ribbon
  if (s.road) {
    const roadRnd = mulberry32(hashSeed(`${slug}:${variant}:road`));
    const asphalt = s.stars ? hsl(228, 22, 13) : mix(s.ridge, hsl(s.ridge.h, 10, 24), 0.7);
    body.push(`<path d="${roadPath(roadRnd, horizonY + 4)}" fill="${css(asphalt)}"/>`);
    const lineRnd = mulberry32(hashSeed(`${slug}:${variant}:road`));
    const lineColor = s.stars ? "hsl(45 90% 70% / 0.85)" : "hsl(45 30% 92% / 0.8)";
    body.push(
      `<path d="${centerlinePath(lineRnd, horizonY + 4)}" fill="none" stroke="${lineColor}" stroke-width="7" stroke-dasharray="46 38" stroke-linecap="round"/>`
    );
  }

  // blossoms
  if (s.blossoms) {
    const dots: string[] = [];
    const n = 130 + Math.floor(rnd() * 80);
    for (let i = 0; i < n; i++) {
      const x = rnd() * W;
      const y = horizonY + (H - horizonY) * Math.pow(rnd(), 0.7);
      const r = 2 + rnd() * 5 * ((y - horizonY) / (H - horizonY) + 0.3);
      const pink = rnd() < 0.4;
      dots.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="hsl(${pink ? 335 : 40} ${pink ? 55 : 25}% ${88 + rnd() * 8}% / ${(0.5 + rnd() * 0.45).toFixed(2)})"/>`
      );
    }
    body.push(`<g>${dots.join("")}</g>`);
  }

  // subtle vignette
  defs.push(
    `<radialGradient id="${uid}-vig" cx="50%" cy="42%" r="75%"><stop offset="70%" stop-color="hsl(0 0% 0% / 0)"/><stop offset="100%" stop-color="hsl(0 0% 0% / 0.18)"/></radialGradient>`
  );
  body.push(`<rect width="${W}" height="${H}" fill="url(#${uid}-vig)"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="xMidYMid slice"><title>${slug} ${variant}</title><defs>${defs.join("")}</defs>${body.join("")}</svg>`;
}

/* ------------------------------ site assets ------------------------------ */

const COMPANION: Record<string, string> = {
  sunrise: "fog",
  sunset: "night",
  night: "sunset",
  fog: "forest",
  karst: "sunset",
  rice: "fog",
  coast: "sunset",
  canyon: "karst",
  waterfall: "forest",
  lake: "sunrise",
  forest: "fog",
  dunes: "sunset",
  grassland: "sunrise",
  river: "sunset",
  mangrove: "sunrise",
  blossom: "fog",
  volcanic: "coast",
  temple: "sunset",
  garage: "night",
};

let count = 0;
for (const trip of TRIPS) {
  const dir = join(ROOT, "public/images/posts", trip.slug);
  mkdirSync(dir, { recursive: true });
  const scene = trip.scene;
  const alt = COMPANION[scene] ?? "sunset";
  writeFileSync(join(dir, "hero.svg"), renderScene(trip.slug, "hero", scene));
  writeFileSync(join(dir, "scene-1.svg"), renderScene(trip.slug, "s1", scene));
  writeFileSync(join(dir, "scene-2.svg"), renderScene(trip.slug, "s2", alt));
  count += 3;
}

// homepage panorama + default OG image
const siteDir = join(ROOT, "public/images/site");
mkdirSync(siteDir, { recursive: true });
const panorama = renderScene("hieplam-rides-panorama", "hero", "sunset");
writeFileSync(join(siteDir, "hero.svg"), panorama);
count += 1;

const ogSvg = renderScene("hieplam-rides-og", "hero", "karst");
const ogPng = await sharp(Buffer.from(ogSvg), { density: 96 })
  .resize(1200, 630, { fit: "cover" })
  .jpeg({ quality: 88 })
  .toBuffer();
writeFileSync(join(ROOT, "public/default-og.jpg"), ogPng);
count += 1;

process.stdout.write(`generated ${count} images\n`);
