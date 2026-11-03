// Set dressing (reference study 2026-11-03: the reference sets are dense, with ballast stones, tufts, poles, distant mesas).
// Call these inside a place's build(G) so they hide with the set. All local coordinates, ground y = 0, deterministic.
//   scatter(G, o): pebbles / rocks / grass tufts / flowers over a rectangle, kept off `avoid` circles (stand and walk
//                  spots: cards' feet must not sink into stones). Pebbles skip the ink (tiny ink outlines shimmer).
//   backdrop(G, o): a ring of distant hills / mesas / peaks for a far depth layer; keep r inside the light's fogFar
//                  (storm 170 m) or it fogs out completely.
import * as THREE from "three";
import { Batch, lam } from "../engine/build";
import { NOINK } from "../engine/ink";

const rng = (seed: number) => { let s = (seed * 2654435761) >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
type Kind = "pebble" | "rock" | "tuft" | "flower";
export type ScatterOpts = {
  x: [number, number]; z: [number, number]; n: number; kinds?: Kind[]; seed?: number;
  /** circles [x, z, r] to keep clear */
  avoid?: [number, number, number][];
  /** ground height under (x, z), default 0 */
  y?: (x: number, z: number) => number;
  stones?: string[]; greens?: string[]; flowers?: string[];
};
const STONES = ["#9a8f86", "#b5aa9c", "#7f7670", "#c4b6a2", "#a8968a"];
const GREENS = ["#5e9e48", "#6aab4f", "#4f8f3f", "#7dbb5a"];
const FLOWERS = ["#f2d64b", "#ef6f6c", "#f4f1ea", "#b48be0"];

export const scatter = (G: THREE.Group, o: ScatterOpts) => {
  const r = rng(o.seed ?? 7), kinds = o.kinds ?? ["pebble", "rock", "tuft"];
  const inked = new Batch(), plain = new Batch();
  const stones = o.stones ?? STONES, greens = o.greens ?? GREENS, flowers = o.flowers ?? FLOWERS;
  const ico = new THREE.IcosahedronGeometry(1, 0), cone = new THREE.ConeGeometry(1, 1, 4), ball = new THREE.IcosahedronGeometry(1, 0);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const mat = (pal: string[], tag: string) => { const c = pal[Math.floor(r() * pal.length)]; return lam(`dress_${tag}_${c}`, () => ({ color: c })); };
  let placed = 0, tries = 0;
  while (placed < o.n && tries++ < o.n * 6) {
    const x = o.x[0] + r() * (o.x[1] - o.x[0]), z = o.z[0] + r() * (o.z[1] - o.z[0]);
    if (o.avoid?.some(([ax, az, ar]) => (x - ax) ** 2 + (z - az) ** 2 < ar * ar)) continue;
    const y = o.y ? o.y(x, z) : 0, k = kinds[Math.floor(r() * kinds.length)];
    placed++;
    if (k === "pebble" || k === "rock") {
      const s = k === "pebble" ? 0.03 + r() * 0.05 : 0.1 + r() * 0.16;
      e.set(r() * 6.28, r() * 6.28, r() * 6.28); q.setFromEuler(e);
      m4.compose(new THREE.Vector3(x, y + s * 0.25, z), q, new THREE.Vector3(s * (0.8 + r() * 0.5), s * (0.45 + r() * 0.2), s * (0.8 + r() * 0.5)));
      (k === "pebble" ? plain : inked).add(ico, mat(stones, "stone"), m4);
    } else {
      const blades = 3 + Math.floor(r() * 3), green = mat(greens, "green");
      for (let i = 0; i < blades; i++) {
        const h = 0.18 + r() * 0.28, a = r() * 6.28, lean = 0.15 + r() * 0.35;
        e.set(Math.cos(a) * lean, 0, Math.sin(a) * lean); q.setFromEuler(e);
        const bx = x + Math.cos(a) * 0.04, bz = z + Math.sin(a) * 0.04;
        m4.compose(new THREE.Vector3(bx, y + h / 2, bz), q, new THREE.Vector3(0.035, h, 0.035));
        inked.add(cone, green, m4);
        if (k === "flower" && i === 0) {
          m4.compose(new THREE.Vector3(bx + Math.sin(lean) * Math.cos(a) * h, y + h, bz + Math.sin(lean) * Math.sin(a) * h), q.identity(), new THREE.Vector3(0.05, 0.04, 0.05));
          inked.add(ball, mat(flowers, "flower"), m4);
        }
      }
    }
  }
  const gi = new THREE.Group(), gp = new THREE.Group();
  inked.build(gi, false); plain.build(gp, false);
  gp.traverse((c) => c.layers.set(NOINK));
  G.add(gi, gp);
  return { inked: gi, plain: gp };
};

export type BackdropOpts = { kind?: "hills" | "mesas" | "peaks"; r?: number; n?: number; h?: number; color?: string; band?: string; seed?: number;
  /** leave a gap (degrees, 0 = toward -z) e.g. where a sea or a street runs to the horizon */
  gap?: [number, number] };
export const backdrop = (G: THREE.Group, o: BackdropOpts = {}) => {
  const r = rng(o.seed ?? 3), R = o.r ?? 130, n = o.n ?? 16, H = o.h ?? 22, kind = o.kind ?? "hills";
  const b = new Batch(), col = o.color ?? (kind === "mesas" ? "#c8673e" : kind === "peaks" ? "#7d86a8" : "#6f9a5a");
  const main = lam(`backdrop_${kind}_${col}`, () => ({ color: col })), band = o.band ? lam(`backdrop_band_${o.band}`, () => ({ color: o.band })) : main;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  const half = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), cyl = new THREE.CylinderGeometry(1, 1.12, 1, 9), cone = new THREE.ConeGeometry(1, 1, 7);
  for (let i = 0; i < n; i++) {
    const deg = (i / n) * 360 + (r() - 0.5) * (300 / n);
    if (o.gap && ((deg - o.gap[0] + 360) % 360) < ((o.gap[1] - o.gap[0] + 360) % 360)) continue;
    const a = (deg * Math.PI) / 180, d = R * (0.9 + r() * 0.25), x = Math.sin(a) * d, z = -Math.cos(a) * d;
    const h = H * (0.6 + r() * 0.7), w = H * (1.4 + r() * 1.6);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28);
    if (kind === "hills") { m4.compose(new THREE.Vector3(x, -h * 0.15, z), q, new THREE.Vector3(w, h, w * 0.8)); b.add(half, main, m4); }
    else if (kind === "peaks") { m4.compose(new THREE.Vector3(x, h * 0.5, z), q, new THREE.Vector3(w * 0.6, h * 1.4, w * 0.6)); b.add(cone, main, m4); }
    else {
      const mw = w * 0.3, mh = h * 0.75; // mesas read as separate buttes, not a wall
      m4.compose(new THREE.Vector3(x, mh * 0.5, z), q, new THREE.Vector3(mw, mh, mw * 0.75)); b.add(cyl, main, m4);
      m4.compose(new THREE.Vector3(x, mh * 0.32, z), q, new THREE.Vector3(mw * 1.03, mh * 0.1, mw * 0.78)); b.add(cyl, band, m4);
    }
  }
  const g = new THREE.Group();
  b.build(g, false);
  G.add(g);
  return g;
};
