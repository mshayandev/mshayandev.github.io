/**
 * Build-time generative artwork for projects with no screenshot.
 *
 * Deterministic from the project slug, so a given project always renders the
 * same image, and rendered as inline SVG at build time — no WebGL contexts,
 * no runtime cost, crisp at any size.
 *
 * The motifs deliberately echo the hero scene: hardware projects get a board,
 * web projects get a dashboard. Same visual language, different scale.
 */

export type ThumbCategory = "iot" | "web" | "design";

interface Palette {
  a: string;
  b: string;
}

const PALETTES: Record<ThumbCategory, Palette> = {
  iot: { a: "#2dd4bf", b: "#5b8cff" },
  web: { a: "#5b8cff", b: "#2dd4bf" },
  design: { a: "#8b7cf6", b: "#2dd4bf" },
};

const W = 640;
const H = 400;

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const between = (r: Rng, min: number, max: number) => min + r() * (max - min);
const int = (r: Rng, min: number, max: number) => Math.floor(between(r, min, max + 1));
const round = (n: number) => Math.round(n * 10) / 10;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function defs(uid: string, p: Palette) {
  return `<defs>
<linearGradient id="${uid}s" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/>
</linearGradient>
<linearGradient id="${uid}f" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${p.a}" stop-opacity=".45"/><stop offset="1" stop-color="${p.a}" stop-opacity="0"/>
</linearGradient>
<radialGradient id="${uid}r" cx=".78" cy=".12" r=".85">
<stop offset="0" stop-color="${p.a}" stop-opacity=".22"/><stop offset="1" stop-color="${p.a}" stop-opacity="0"/>
</radialGradient>
<radialGradient id="${uid}r2" cx=".1" cy=".92" r=".8">
<stop offset="0" stop-color="${p.b}" stop-opacity=".18"/><stop offset="1" stop-color="${p.b}" stop-opacity="0"/>
</radialGradient>
<pattern id="${uid}g" width="32" height="32" patternUnits="userSpaceOnUse">
<path d="M32 0H0v32" fill="none" stroke="#fff" stroke-opacity=".05" stroke-width="1"/>
</pattern>
</defs>
<rect width="${W}" height="${H}" fill="#101728"/>
<rect width="${W}" height="${H}" fill="url(#${uid}g)"/>
<rect width="${W}" height="${H}" fill="url(#${uid}r)"/>
<rect width="${W}" height="${H}" fill="url(#${uid}r2)"/>`;
}

/* ------------------------------------------------------------------ *
 * Hardware — a routed board
 * ------------------------------------------------------------------ */

function board(rng: Rng, uid: string, p: Palette) {
  const G = 20;
  const snap = (v: number) => Math.round(v / G) * G;
  const traces: string[] = [];
  const ends: Array<[number, number]> = [];

  const count = int(rng, 8, 11);
  for (let i = 0; i < count; i++) {
    let x = snap(between(rng, 40, W - 60));
    let y = snap(between(rng, 30, H - 40));
    const pts: Array<[number, number]> = [[x, y]];
    let horizontal = rng() < 0.5;

    for (let s = 0, n = int(rng, 3, 5); s < n; s++) {
      const len = int(rng, 2, 6) * G;
      const dir = rng() < 0.5 ? 1 : -1;
      if (rng() < 0.28) {
        const d = len * 0.7071;
        x = clamp(x + d * dir, 24, W - 24);
        y = clamp(y + d * (rng() < 0.5 ? 1 : -1), 24, H - 24);
      } else if (horizontal) {
        x = clamp(x + len * dir, 24, W - 24);
      } else {
        y = clamp(y + len * dir, 24, H - 24);
      }
      pts.push([x, y]);
      horizontal = !horizontal;
    }

    ends.push(pts[0], pts[pts.length - 1]);
    const d = pts.map(([px, py], j) => `${j ? "L" : "M"}${round(px)} ${round(py)}`).join("");
    // Two traces run "hot" — they carry the animated pulse on hover.
    const hot = i < 2;
    traces.push(
      hot
        ? `<path class="thumb-flow" d="${d}" fill="none" stroke="url(#${uid}s)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="${d}" fill="none" stroke="${p.b}" stroke-opacity=".3" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  const pads = ends
    .map(
      ([x, y]) =>
        `<circle cx="${round(x)}" cy="${round(y)}" r="3.6" fill="#101728" stroke="${p.a}" stroke-opacity=".55" stroke-width="1.4"/>`
    )
    .join("");

  const chips: string[] = [];
  for (let i = 0, n = int(rng, 2, 3); i < n; i++) {
    const cw = int(rng, 70, 118);
    const ch = int(rng, 46, 74);
    const x = between(rng, 40, W - cw - 40);
    const y = between(rng, 40, H - ch - 40);
    const pins = int(rng, 4, 6);
    let ticks = "";
    for (let k = 0; k < pins; k++) {
      const py = round(y + ((k + 0.5) / pins) * ch);
      ticks +=
        `<path d="M${round(x - 9)} ${py}h9" stroke="${p.a}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M${round(x + cw)} ${py}h9" stroke="${p.a}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`;
    }
    chips.push(
      `<g>${ticks}<rect x="${round(x)}" y="${round(y)}" width="${cw}" height="${ch}" rx="6" fill="#161d2e" stroke="${p.b}" stroke-opacity=".45"/>` +
        `<rect x="${round(x + 10)}" y="${round(y + 10)}" width="${cw - 20}" height="${ch - 20}" rx="3" fill="none" stroke="${p.a}" stroke-opacity=".25"/>` +
        `<circle cx="${round(x + 17)}" cy="${round(y + 17)}" r="2.4" fill="${p.a}" fill-opacity=".7"/></g>`
    );
  }

  return traces.join("") + pads + chips.join("");
}

/* ------------------------------------------------------------------ *
 * Web — a dashboard wireframe
 * ------------------------------------------------------------------ */

function dashboard(rng: Rng, uid: string, p: Palette) {
  const panel = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#161d2e" fill-opacity=".85" stroke="${p.b}" stroke-opacity=".28"/>`;
  const row = (x: number, y: number, w: number, o = 0.16) =>
    `<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="6" rx="3" fill="#fff" fill-opacity="${o}"/>`;

  const out: string[] = [];

  // Top bar
  out.push(panel(20, 18, W - 40, 36));
  out.push(
    `<circle cx="40" cy="36" r="5" fill="${p.a}" fill-opacity=".8"/>`,
    row(56, 33, 62, 0.22),
    row(W - 150, 33, 46),
    row(W - 92, 33, 32)
  );

  // Sidebar
  out.push(panel(20, 66, 108, H - 88));
  for (let i = 0; i < 6; i++) {
    const y = 92 + i * 30;
    const active = i === int(rng, 0, 2);
    out.push(
      `<rect x="34" y="${y - 8}" width="8" height="8" rx="2" fill="${active ? p.a : "#fff"}" fill-opacity="${active ? 0.85 : 0.2}"/>`,
      row(50, y - 7, between(rng, 30, 58), active ? 0.34 : 0.14)
    );
  }

  // Card grid
  const left = 142;
  const gap = 14;
  const cw = (W - left - 20 - gap) / 2;
  const chh = (H - 66 - 22 - gap) / 2;
  const cells = [
    [left, 66],
    [left + cw + gap, 66],
    [left, 66 + chh + gap],
    [left + cw + gap, 66 + chh + gap],
  ] as Array<[number, number]>;

  const chartCell = int(rng, 0, 1);
  const barCell = chartCell === 0 ? int(rng, 1, 3) : 0;

  cells.forEach(([x, y], i) => {
    out.push(panel(round(x), round(y), round(cw), round(chh)));
    out.push(row(x + 16, y + 18, between(rng, 40, 78), 0.26));

    if (i === chartCell) {
      const pts: Array<[number, number]> = [];
      const n = 9;
      let level = 0.5;
      for (let k = 0; k < n; k++) {
        level = clamp(level + between(rng, -0.26, 0.3), 0.12, 0.92);
        pts.push([
          x + 16 + (k / (n - 1)) * (cw - 32),
          y + chh - 18 - level * (chh - 62),
        ]);
      }
      const line = pts.map(([px, py], k) => `${k ? "L" : "M"}${round(px)} ${round(py)}`).join("");
      out.push(
        `<path d="${line}L${round(x + cw - 16)} ${round(y + chh - 14)}L${round(x + 16)} ${round(y + chh - 14)}Z" fill="url(#${uid}f)"/>`,
        `<path class="thumb-flow" d="${line}" fill="none" stroke="url(#${uid}s)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
        `<circle cx="${round(pts[n - 1][0])}" cy="${round(pts[n - 1][1])}" r="3.6" fill="${p.a}"/>`
      );
    } else if (i === barCell) {
      const bars = 6;
      for (let k = 0; k < bars; k++) {
        const bw = (cw - 40) / bars - 6;
        const bh = between(rng, 0.22, 0.86) * (chh - 62);
        out.push(
          `<rect x="${round(x + 20 + k * ((cw - 40) / bars))}" y="${round(y + chh - 16 - bh)}" width="${round(bw)}" height="${round(bh)}" rx="3" fill="url(#${uid}s)" fill-opacity="${round(0.35 + (k / bars) * 0.5)}"/>`
        );
      }
    } else {
      for (let k = 0; k < 4; k++) {
        out.push(row(x + 16, y + 42 + k * 16, between(rng, 0.4, 0.92) * (cw - 32)));
      }
    }
  });

  return out.join("");
}

/* ------------------------------------------------------------------ *
 * Design — a geometric composition
 * ------------------------------------------------------------------ */

function composition(rng: Rng, uid: string, p: Palette) {
  const out: string[] = [];
  const cx = between(rng, 240, 400);
  const cy = between(rng, 170, 230);

  for (let i = 0; i < 5; i++) {
    const r = 46 + i * between(rng, 22, 34);
    out.push(
      `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(r)}" fill="none" stroke="${i % 2 ? p.b : p.a}" stroke-opacity="${round(0.32 - i * 0.045)}" stroke-width="${i === 1 ? 2.2 : 1.2}"/>`
    );
  }

  const rot = int(rng, 0, 360);
  out.push(
    `<path class="thumb-flow" d="M${round(cx)} ${round(cy - 96)}A96 96 0 0 1 ${round(cx + 96)} ${round(cy)}" fill="none" stroke="url(#${uid}s)" stroke-width="2.6" stroke-linecap="round" transform="rotate(${rot} ${round(cx)} ${round(cy)})"/>`
  );

  // Halftone field
  let dots = "";
  for (let gx = 0; gx < 16; gx++) {
    for (let gy = 0; gy < 10; gy++) {
      const px = 40 + gx * 38;
      const py = 34 + gy * 37;
      const d = Math.hypot(px - cx, py - cy);
      const r = clamp(4.2 - d / 90, 0.4, 4.2);
      if (r < 0.6) continue;
      dots += `<circle cx="${px}" cy="${py}" r="${round(r)}" fill="${p.a}" fill-opacity="${round(clamp(0.5 - d / 900, 0.06, 0.5))}"/>`;
    }
  }
  out.push(dots);

  const sides = int(rng, 3, 6);
  const poly: string[] = [];
  for (let i = 0; i < sides; i++) {
    const ang = (i / sides) * Math.PI * 2 + rng();
    const rr = between(rng, 60, 130);
    poly.push(`${round(cx + Math.cos(ang) * rr)} ${round(cy + Math.sin(ang) * rr)}`);
  }
  out.push(
    `<polygon points="${poly.join(" ")}" fill="url(#${uid}s)" fill-opacity=".12" stroke="${p.b}" stroke-opacity=".35" stroke-width="1.4"/>`
  );

  return out.join("");
}

/* ------------------------------------------------------------------ */

export function generateThumbnail(seed: string, category: ThumbCategory) {
  const h = hash(seed);
  const rng = mulberry32(h);
  const uid = `t${h.toString(36)}`;
  const palette = PALETTES[category];

  const art =
    category === "iot"
      ? board(rng, uid, palette)
      : category === "web"
        ? dashboard(rng, uid, palette)
        : composition(rng, uid, palette);

  return { uid, viewBox: `0 0 ${W} ${H}`, markup: defs(uid, palette) + art };
}
