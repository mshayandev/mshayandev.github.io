/**
 * Builds the three layouts the hero scene morphs between:
 *
 *   stage 0 — EDGE : a PCB, traces + pads + chips, data pulsing along copper
 *   stage 1 — LINK : devices lifted into 3D, wireless rings and mesh links
 *   stage 2 — WEB  : the mesh resolves into a dashboard UI
 *
 * Every layout fills the same particle and segment budget so the GPU can
 * simply lerp between them.
 */

type Vec3 = [number, number, number];
type Polyline = Vec3[];

const WORLD_W = 30;
const WORLD_H = 17;

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
const range = (r: Rng, min: number, max: number) => min + r() * (max - min);
const pick = <T>(r: Rng, arr: T[]) => arr[Math.floor(r() * arr.length) % arr.length];

interface Layout {
  positions: Float32Array; // count * 3
  flow: Float32Array; // count
  size: Float32Array; // count
  polylines: Polyline[];
}

/* ------------------------------------------------------------------ *
 * Polyline helpers
 * ------------------------------------------------------------------ */

function polyLength(poly: Polyline) {
  let total = 0;
  for (let i = 1; i < poly.length; i++) {
    const [ax, ay, az] = poly[i - 1];
    const [bx, by, bz] = poly[i];
    total += Math.hypot(bx - ax, by - ay, bz - az);
  }
  return total;
}

/** Point at normalised arc-length t along a polyline. */
function pointAt(poly: Polyline, t: number): Vec3 {
  const target = Math.max(0, Math.min(1, t)) * polyLength(poly);
  let travelled = 0;
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1];
    const b = poly[i];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (travelled + seg >= target || i === poly.length - 1) {
      const local = seg === 0 ? 0 : (target - travelled) / seg;
      return [
        a[0] + (b[0] - a[0]) * local,
        a[1] + (b[1] - a[1]) * local,
        a[2] + (b[2] - a[2]) * local,
      ];
    }
    travelled += seg;
  }
  return poly[poly.length - 1];
}

function rectPoly(x0: number, y0: number, x1: number, y1: number, z = 0): Polyline {
  return [
    [x0, y0, z],
    [x1, y0, z],
    [x1, y1, z],
    [x0, y1, z],
    [x0, y0, z],
  ];
}

/**
 * Redistributes an arbitrary set of polylines into exactly `segCount`
 * segments, keeping each segment's normalised position along its parent path
 * so shader pulses travel end to end.
 */
function resample(polys: Polyline[], segCount: number) {
  const usable = polys.filter((p) => p.length > 1 && polyLength(p) > 1e-4);
  const positions = new Float32Array(segCount * 2 * 3);
  const flow = new Float32Array(segCount * 2);
  if (!usable.length) return { positions, flow };

  const lengths = usable.map(polyLength);
  const total = lengths.reduce((a, b) => a + b, 0);
  const share = lengths.map((l) => Math.max(1, Math.round((segCount * l) / total)));

  let sum = share.reduce((a, b) => a + b, 0);
  while (sum !== segCount) {
    let idx = 0;
    for (let i = 1; i < share.length; i++) {
      if (sum > segCount ? share[i] > share[idx] : share[i] < share[idx]) idx = i;
    }
    if (sum > segCount && share[idx] <= 1) {
      // Nothing left to trim evenly — drop the difference onto the first path.
      share[0] = Math.max(1, share[0] - (sum - segCount));
      break;
    }
    share[idx] += sum > segCount ? -1 : 1;
    sum = share.reduce((a, b) => a + b, 0);
  }

  let slot = 0;
  for (let p = 0; p < usable.length && slot < segCount; p++) {
    const poly = usable[p];
    const n = share[p];
    for (let j = 0; j < n && slot < segCount; j++, slot++) {
      const t0 = j / n;
      const t1 = (j + 1) / n;
      const a = pointAt(poly, t0);
      const b = pointAt(poly, t1);
      const o = slot * 6;
      positions[o] = a[0];
      positions[o + 1] = a[1];
      positions[o + 2] = a[2];
      positions[o + 3] = b[0];
      positions[o + 4] = b[1];
      positions[o + 5] = b[2];
      flow[slot * 2] = t0;
      flow[slot * 2 + 1] = t1;
    }
  }

  // Any unfilled tail collapses onto the last written segment (invisible).
  for (; slot < segCount; slot++) {
    const src = (slot - 1) * 6;
    positions.copyWithin(slot * 6, src, src + 6);
  }

  return { positions, flow };
}

/** Weighted random polyline pick, biased by length so density stays even. */
function makePolyPicker(polys: Polyline[], rng: Rng) {
  const lengths = polys.map(polyLength);
  const total = lengths.reduce((a, b) => a + b, 0);
  return () => {
    let target = rng() * total;
    for (let i = 0; i < polys.length; i++) {
      target -= lengths[i];
      if (target <= 0) return polys[i];
    }
    return polys[polys.length - 1];
  };
}

/* ------------------------------------------------------------------ *
 * Stage 0 — the board
 * ------------------------------------------------------------------ */

function pcbLayout(count: number, rng: Rng): Layout {
  const GRID = 1.0;
  const halfW = WORLD_W / 2;
  const halfH = WORLD_H / 2;
  const snap = (v: number) => Math.round(v / GRID) * GRID;
  const clampX = (v: number) => Math.max(-halfW, Math.min(halfW, v));
  const clampY = (v: number) => Math.max(-halfH, Math.min(halfH, v));

  const traces: Polyline[] = [];
  const pads: Vec3[] = [];

  for (let i = 0; i < 44; i++) {
    const layer = Math.floor(range(rng, 0, 3)) - 1;
    const z = layer * 0.14;
    let x = snap(range(rng, -halfW, halfW));
    let y = snap(range(rng, -halfH, halfH));
    const poly: Polyline = [[x, y, z]];
    let horizontal = rng() < 0.5;

    const bends = 3 + Math.floor(rng() * 4);
    for (let b = 0; b < bends; b++) {
      const len = (1 + Math.floor(rng() * 5)) * GRID;
      const dir = rng() < 0.5 ? 1 : -1;
      if (rng() < 0.3) {
        // 45° dogleg — the detail that makes it read as a real board.
        const diag = len * 0.7071;
        x = clampX(x + diag * dir);
        y = clampY(y + diag * (rng() < 0.5 ? 1 : -1));
      } else if (horizontal) {
        x = clampX(x + len * dir);
      } else {
        y = clampY(y + len * dir);
      }
      poly.push([x, y, z]);
      horizontal = !horizontal;
    }

    if (polyLength(poly) > 1.5) {
      traces.push(poly);
      pads.push(poly[0], poly[poly.length - 1]);
    }
  }

  // Chips: a border plus two pin rows each.
  const chips: Polyline[] = [];
  for (let i = 0; i < 7; i++) {
    const w = range(rng, 2.0, 3.6);
    const h = range(rng, 1.3, 2.4);
    const cx = range(rng, -halfW + w, halfW - w);
    const cy = range(rng, -halfH + h, halfH - h);
    const z = 0.2;
    chips.push(rectPoly(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, z));
    const pins = 4 + Math.floor(rng() * 4);
    for (let p = 0; p < pins; p++) {
      const py = cy - h / 2 + ((p + 0.5) / pins) * h;
      chips.push([
        [cx - w / 2 - 0.45, py, z],
        [cx - w / 2, py, z],
      ]);
      chips.push([
        [cx + w / 2, py, z],
        [cx + w / 2 + 0.45, py, z],
      ]);
    }
  }

  const positions = new Float32Array(count * 3);
  const flow = new Float32Array(count);
  const size = new Float32Array(count);
  const pickTrace = makePolyPicker(traces, rng);
  const pickChip = makePolyPicker(chips, rng);

  for (let i = 0; i < count; i++) {
    const roll = rng();
    let p: Vec3;
    let f = rng();
    let s: number;

    if (roll < 0.6) {
      const poly = pickTrace();
      f = rng();
      p = pointAt(poly, f);
      p[0] += range(rng, -0.03, 0.03);
      p[1] += range(rng, -0.03, 0.03);
      s = range(rng, 1.0, 1.7);
    } else if (roll < 0.78) {
      const poly = pickChip();
      p = pointAt(poly, rng());
      s = range(rng, 1.1, 1.8);
    } else if (roll < 0.9 && pads.length) {
      const pad = pick(rng, pads);
      const a = rng() * Math.PI * 2;
      const r = 0.12 + Math.sqrt(rng()) * 0.24;
      p = [pad[0] + Math.cos(a) * r, pad[1] + Math.sin(a) * r, pad[2] + 0.02];
      s = range(rng, 1.6, 2.6);
    } else {
      p = [
        range(rng, -halfW, halfW),
        range(rng, -halfH, halfH),
        range(rng, -0.6, 0.6),
      ];
      s = range(rng, 0.5, 1.0);
    }

    positions[i * 3] = p[0];
    positions[i * 3 + 1] = p[1];
    positions[i * 3 + 2] = p[2];
    flow[i] = f;
    size[i] = s;
  }

  return { positions, flow, size, polylines: [...traces, ...chips] };
}

/* ------------------------------------------------------------------ *
 * Stage 1 — the wireless mesh
 * ------------------------------------------------------------------ */

function meshLayout(count: number, rng: Rng): Layout {
  const NODES = 32;
  const nodes: Vec3[] = [];
  let guard = 0;
  while (nodes.length < NODES && guard++ < 4000) {
    const candidate: Vec3 = [
      range(rng, -12, 12),
      range(rng, -6.6, 6.6),
      range(rng, -4.5, 4.5),
    ];
    const ok = nodes.every(
      (n) =>
        Math.hypot(n[0] - candidate[0], n[1] - candidate[1], n[2] - candidate[2]) > 3.2
    );
    if (ok) nodes.push(candidate);
  }

  const links: Polyline[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const neighbours = nodes
      .map((n, j) => ({ j, d: Math.hypot(n[0] - nodes[i][0], n[1] - nodes[i][1], n[2] - nodes[i][2]) }))
      .filter((n) => n.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    for (const n of neighbours) {
      if (n.j < i) continue;
      links.push([nodes[i], nodes[n.j]]);
    }
  }

  const positions = new Float32Array(count * 3);
  const flow = new Float32Array(count);
  const size = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const node = nodes[i % nodes.length];
    const roll = rng();
    let p: Vec3;
    let s: number;

    if (roll < 0.5) {
      // Device shell.
      const a = rng() * Math.PI * 2;
      const b = Math.acos(2 * rng() - 1);
      const r = 0.12 + Math.pow(rng(), 0.6) * 0.5;
      p = [
        node[0] + r * Math.sin(b) * Math.cos(a),
        node[1] + r * Math.sin(b) * Math.sin(a),
        node[2] + r * Math.cos(b),
      ];
      s = range(rng, 1.2, 2.2);
    } else if (roll < 0.82) {
      // Wireless ring radiating outward from the device.
      const a = rng() * Math.PI * 2;
      const r = range(rng, 0.9, 2.8);
      const tilt = range(rng, -0.35, 0.35);
      p = [
        node[0] + Math.cos(a) * r,
        node[1] + Math.sin(a) * r * 0.62,
        node[2] + Math.sin(a) * tilt,
      ];
      s = range(rng, 0.7, 1.3);
    } else {
      p = [range(rng, -15, 15), range(rng, -8, 8), range(rng, -6, 6)];
      s = range(rng, 0.5, 1.0);
    }

    positions[i * 3] = p[0];
    positions[i * 3 + 1] = p[1];
    positions[i * 3 + 2] = p[2];
    flow[i] = rng();
    size[i] = s;
  }

  return { positions, flow, size, polylines: links };
}

/* ------------------------------------------------------------------ *
 * Stage 2 — the dashboard
 * ------------------------------------------------------------------ */

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function uiLayout(count: number, rng: Rng): Layout {
  const W = 26;
  const H = 15;
  const ux = (u: number) => (u - 0.5) * W;
  const uy = (v: number) => (v - 0.5) * H;

  const topBar: Rect = { x0: 0.02, y0: 0.88, x1: 0.98, y1: 0.99 };
  const sidebar: Rect = { x0: 0.02, y0: 0.03, x1: 0.19, y1: 0.85 };

  const cards: Rect[] = [];
  const cols = 3;
  const rows = 2;
  const left = 0.22;
  const right = 0.98;
  const bottom = 0.03;
  const top = 0.85;
  const gap = 0.018;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const w = (right - left) / cols;
      const h = (top - bottom) / rows;
      cards.push({
        x0: left + c * w + gap,
        y0: bottom + r * h + gap,
        x1: left + (c + 1) * w - gap,
        y1: bottom + (r + 1) * h - gap,
      });
    }
  }

  const toPoly = (r: Rect, z = 0) => rectPoly(ux(r.x0), uy(r.y0), ux(r.x1), uy(r.y1), z);
  const polylines: Polyline[] = [toPoly(topBar, 0.1), toPoly(sidebar, 0.05)];
  cards.forEach((c) => polylines.push(toPoly(c)));

  // Card 0 gets a line chart, card 1 a bar chart.
  const chartCard = cards[3] ?? cards[0];
  const chart: Polyline = [];
  const chartPoints = 12;
  let level = 0.4;
  for (let i = 0; i < chartPoints; i++) {
    level = Math.max(0.14, Math.min(0.82, level + range(rng, -0.16, 0.2)));
    const u = chartCard.x0 + 0.06 * (chartCard.x1 - chartCard.x0) + (i / (chartPoints - 1)) * 0.88 * (chartCard.x1 - chartCard.x0);
    const v = chartCard.y0 + 0.12 * (chartCard.y1 - chartCard.y0) + level * 0.7 * (chartCard.y1 - chartCard.y0);
    chart.push([ux(u), uy(v), 0.12]);
  }
  polylines.push(chart);

  const barCard = cards[4] ?? cards[1];
  const bars: Polyline[] = [];
  const barCount = 7;
  for (let i = 0; i < barCount; i++) {
    const u = barCard.x0 + 0.1 * (barCard.x1 - barCard.x0) + (i / barCount) * 0.82 * (barCard.x1 - barCard.x0);
    const hh = range(rng, 0.18, 0.72);
    const v0 = barCard.y0 + 0.12 * (barCard.y1 - barCard.y0);
    const v1 = v0 + hh * 0.66 * (barCard.y1 - barCard.y0);
    bars.push([
      [ux(u), uy(v0), 0.12],
      [ux(u), uy(v1), 0.12],
    ]);
  }
  polylines.push(...bars);

  // Text rows inside the remaining cards, plus sidebar nav items.
  const textRows: Polyline[] = [];
  cards.forEach((c) => {
    if (c === chartCard || c === barCard) return;
    const lines = 4;
    for (let i = 0; i < lines; i++) {
      const v = c.y1 - 0.16 * (c.y1 - c.y0) - (i / lines) * 0.62 * (c.y1 - c.y0);
      const w = range(rng, 0.45, 0.86);
      textRows.push([
        [ux(c.x0 + 0.07 * (c.x1 - c.x0)), uy(v), 0.1],
        [ux(c.x0 + (0.07 + w * 0.86) * (c.x1 - c.x0)), uy(v), 0.1],
      ]);
    }
  });
  const navItems: Polyline[] = [];
  for (let i = 0; i < 6; i++) {
    const v = sidebar.y1 - 0.08 - i * 0.11;
    navItems.push([
      [ux(sidebar.x0 + 0.03), uy(v), 0.08],
      [ux(sidebar.x0 + 0.03 + range(rng, 0.06, 0.12)), uy(v), 0.08],
    ]);
  }
  polylines.push(...textRows, ...navItems);

  const positions = new Float32Array(count * 3);
  const flow = new Float32Array(count);
  const size = new Float32Array(count);

  const borders = [toPoly(topBar, 0.1), toPoly(sidebar, 0.05), ...cards.map((c) => toPoly(c))];
  const pickBorder = makePolyPicker(borders, rng);
  const pickText = makePolyPicker(textRows.length ? textRows : borders, rng);
  const pickBar = makePolyPicker(bars, rng);
  const pickNav = makePolyPicker(navItems, rng);

  for (let i = 0; i < count; i++) {
    const roll = rng();
    let p: Vec3;
    let s: number;

    if (roll < 0.32) {
      p = pointAt(pickText(), rng());
      s = range(rng, 0.7, 1.2);
    } else if (roll < 0.56) {
      p = pointAt(pickBorder(), rng());
      s = range(rng, 1.0, 1.7);
    } else if (roll < 0.68) {
      p = pointAt(chart, rng());
      s = range(rng, 1.3, 2.2);
    } else if (roll < 0.78) {
      p = pointAt(pickBar(), rng());
      s = range(rng, 1.1, 1.9);
    } else if (roll < 0.86) {
      p = pointAt(pickNav(), rng());
      s = range(rng, 1.0, 1.6);
    } else if (roll < 0.94) {
      // Soft fill inside a card so panels read as surfaces, not outlines.
      const c = pick(rng, cards);
      p = [ux(range(rng, c.x0, c.x1)), uy(range(rng, c.y0, c.y1)), -0.05];
      s = range(rng, 0.4, 0.8);
    } else {
      p = [range(rng, -W, W) * 0.6, range(rng, -H, H) * 0.6, range(rng, -1, 1)];
      s = range(rng, 0.4, 0.9);
    }

    positions[i * 3] = p[0];
    positions[i * 3 + 1] = p[1];
    positions[i * 3 + 2] = p[2];
    flow[i] = rng();
    size[i] = s;
  }

  return { positions, flow, size, polylines };
}

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

export interface SceneGeometry {
  count: number;
  segCount: number;
  pos0: Float32Array;
  pos1: Float32Array;
  pos2: Float32Array;
  rand: Float32Array; // count * 3
  meta: Float32Array; // count * 2 → (flow, size)
  linePos0: Float32Array;
  linePos1: Float32Array;
  linePos2: Float32Array;
  lineFlow: Float32Array; // segCount * 2 * 3 → flow per stage
}

export function buildSceneGeometry(count: number, segCount: number): SceneGeometry {
  const rng = mulberry32(20040930);
  const pcb = pcbLayout(count, mulberry32(1337));
  const mesh = meshLayout(count, mulberry32(9001));
  const ui = uiLayout(count, mulberry32(4242));

  const lines0 = resample(pcb.polylines, segCount);
  const lines1 = resample(mesh.polylines, segCount);
  const lines2 = resample(ui.polylines, segCount);

  const rand = new Float32Array(count * 3);
  const meta = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    rand[i * 3] = rng();
    rand[i * 3 + 1] = rng();
    rand[i * 3 + 2] = rng();
    meta[i * 2] = pcb.flow[i];
    meta[i * 2 + 1] = pcb.size[i] * 0.55 + mesh.size[i] * 0.25 + ui.size[i] * 0.2;
  }

  const lineFlow = new Float32Array(segCount * 2 * 3);
  for (let v = 0; v < segCount * 2; v++) {
    lineFlow[v * 3] = lines0.flow[v];
    lineFlow[v * 3 + 1] = lines1.flow[v];
    lineFlow[v * 3 + 2] = lines2.flow[v];
  }

  return {
    count,
    segCount,
    pos0: pcb.positions,
    pos1: mesh.positions,
    pos2: ui.positions,
    rand,
    meta,
    linePos0: lines0.positions,
    linePos1: lines1.positions,
    linePos2: lines2.positions,
    lineFlow,
  };
}
