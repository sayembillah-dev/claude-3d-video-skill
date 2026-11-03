// Effects kit (reference study 2026-11-03: emotion and physics shown as cartoon 2D effects inside the 3D world).
// Stage helpers in the style of puff / burst: push FxPlace cards into out.fx, pure functions of t (seconds), with
// progress quantised into the cache key so the textures are reused. Head-anchored helpers take the head centre in
// world metres (a standing human card of scale 1: head centre ≈ y + 1.55).
//   steam, sweat, flush (face colour), glow, smoke, foam, explode; buildUp for time-lapse assembly in pose().
// Speed lines are a screen overlay, not a card: FilmData.speedLines (transitions.tsx).
import * as THREE from "three";
import { Stage, CamInfo, hh, q } from "./stage";
import { Pen, Outfit, SKIN, INK, fxBurst } from "../engine/toon";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smoothU = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
/** horizontal unit vector toward screen right */
const sideOf = (cam: CamInfo) => { const l = Math.hypot(cam.right.x, cam.right.z) || 1; return [cam.right.x / l, cam.right.z / l]; };
/** offset .15 m toward the camera so head effects draw in front of the head card, not inside it */
const nearer = (cam: CamInfo, x: number, z: number, m = 0.15) => { const dx = cam.pos.x - x, dz = cam.pos.z - z, l = Math.hypot(dx, dz) || 1; return [x + (dx / l) * m, z + (dz / l) * m]; };
/** fade in over the first .15 s and out over the last .25 s of [t0, t0 + dur] */
const life = (t: number, t0: number, dur: number) => clamp01(Math.min((t - t0) / 0.15, (t0 + dur - t) / 0.25));
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); };

/** cartoon cloud: ink silhouette, then the fill on top (no inner seams); a = opacity */
const cloud = (p: Pen, cx: number, cy: number, r: number, fill: string, a: number, seed: number, ol = 6) => {
  const lobes: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) { const ang = (i / 5) * Math.PI * 2 + seed; lobes.push([cx + Math.cos(ang) * r * 0.45, cy + Math.sin(ang) * r * 0.32, r * (0.5 + 0.18 * hh(i, seed))]); }
  lobes.push([cx, cy, r * 0.62]);
  p.g.globalAlpha = a;
  for (const [x, y, rr] of lobes) p.ell(x, y, rr + ol, rr + ol, INK, 0);
  for (const [x, y, rr] of lobes) p.ell(x, y, rr, rr, fill, 0);
  p.g.globalAlpha = 1;
};

/** steam puffs out of both ears (anger, embarrassment): ~1.4 s */
export const steam = (out: Stage, cam: CamInfo, t: number, t0: number, x: number, y: number, z: number, o: { dur?: number; w?: number; col?: string } = {}) => {
  const dur = o.dur ?? 1.4, w = o.w ?? 0.32, col = o.col ?? "#ffffff";
  if (t < t0 || t >= t0 + dur) return;
  const [rx, rz] = sideOf(cam), L = life(t, t0, dur);
  [x, z] = nearer(cam, x, z);
  for (const side of [-1, 1]) for (let j = 0; j < 3; j++) {
    const u = q(((t - t0) * 1.7 + j / 3 + (side > 0 ? 0.17 : 0)) % 1, 12), d = 0.2 + 0.22 * u;
    const a = q((1 - u) * L, 6);
    if (a <= 0) continue;
    out.fx.push({ key: `steam|${col}|${a}`, cw: 200, ch: 200, draw: (p) => cloud(p, 100, 100, 70, col, a, 1.3), soft: true,
      x: x + rx * side * d, y: y + 0.05 + 0.4 * u, z: z + rz * side * d, w: w * (0.5 + 0.8 * u), h: w * (0.5 + 0.8 * u) });
  }
};

const drop = (p: Pen) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2, s = Math.sin(a / 2); pts.push([60 + 44 * Math.sin(a) * s, 150 - 60 - 60 * Math.cos(a) * (0.6 + 0.4 * s)]); }
  p.poly(pts, "#8fd6ff", 7);
  p.ell(46, 100, 9, 14, "#ffffff", 0);
};
/** sweat drops sliding off the temple (nerves, effort); side = 1 screen right, -1 left */
export const sweat = (out: Stage, cam: CamInfo, t: number, t0: number, x: number, y: number, z: number, o: { dur?: number; side?: 1 | -1; n?: number; w?: number } = {}) => {
  const dur = o.dur ?? 1.5, side = o.side ?? 1, n = o.n ?? 2, w = o.w ?? 0.13;
  if (t < t0 || t >= t0 + dur) return;
  const [rx, rz] = sideOf(cam);
  [x, z] = nearer(cam, x, z);
  for (let j = 0; j < n; j++) {
    const u = ((t - t0) * 1.1 + j / n) % 1, d = 0.3 + 0.05 * u + 0.03 * j;
    out.fx.push({ key: "sweat", cw: 120, ch: 150, draw: drop, x: x + rx * side * d, y: y + 0.12 - 0.3 * u * u - 0.05 * j, z: z + rz * side * d, w, h: w * 1.25 });
  }
};

/** face colour shift (fury purple, embarrassed red, sick green): skin toward `col` by k in 8 steps.
 *  Pass the result to human() with its key: human(cam, out, i, f.o, f.key, ...). */
export const flush = (o: Outfit, okey: string, k: number, col = "#b05ad6") => {
  const s = q(clamp01(k), 8);
  return s <= 0 ? { o, key: okey } : { o: { ...o, skin: mix(o.skin ?? SKIN, col, s * 0.85) }, key: `${okey}|fl${col}${s}` };
};

/** soft heat glow (hot rail, forge, lantern); pulse = 0..1 flicker amount */
export const glow = (out: Stage, t: number, x: number, y: number, z: number, o: { w?: number; h?: number; col?: string; k?: number; pulse?: number } = {}) => {
  const col = o.col ?? "#ffb347", w = o.w ?? 1, k = clamp01((o.k ?? 1) * (1 - (o.pulse ?? 0) * 0.3 * (0.5 + 0.5 * Math.sin(t * 9))));
  const a = q(k, 10);
  if (a <= 0) return;
  out.fx.push({ key: `glow|${col}|${a}`, cw: 256, ch: 256, soft: true, x, y, z, w, h: o.h ?? w, draw: (p) => {
    const g = p.g, [r, gg, b] = hex(col), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, `rgba(${r},${gg},${b},${0.85 * a})`); gr.addColorStop(0.45, `rgba(${r},${gg},${b},${0.35 * a})`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  } });
};

/** rising cartoon smoke column from t0 for dur s (fire, chimney, aftermath); puffs live 1.8 s each */
export const smoke = (out: Stage, t: number, t0: number, x: number, y: number, z: number, o: { dur?: number; w?: number; col?: string; rate?: number; rise?: number; drift?: [number, number] } = {}) => {
  const dur = o.dur ?? 3, w = o.w ?? 1, col = o.col ?? "#5b5560", rate = o.rate ?? 4, rise = o.rise ?? 1.2, [dx, dz] = o.drift ?? [0.3, 0], LIFE = 1.8;
  const i0 = Math.max(0, Math.floor((t - t0 - LIFE) * rate)), i1 = Math.min(Math.floor(dur * rate), Math.floor((t - t0) * rate));
  for (let i = i0; i <= i1; i++) {
    const age = t - (t0 + i / rate);
    if (age < 0 || age >= LIFE) continue;
    const u = age / LIFE, a = q(1 - u * u, 8), s = w * (0.45 + 0.9 * u), sd = Math.floor(hh(i, 9) * 4);
    out.fx.push({ key: `smoke|${col}|${a}|${sd}`, cw: 220, ch: 220, soft: true, draw: (p) => cloud(p, 110, 110, 78, col, a, sd * 1.7, 5),
      x: x + (hh(i, 1) - 0.5) * 0.3 * w + dx * age, y: y + rise * age * (1 - 0.25 * u), z: z + (hh(i, 2) - 0.5) * 0.3 * w + dz * age, w: s, h: s });
  }
};

/** floating foam patch lying on water (wake, oil slick edge, surf); flat card */
export const foam = (out: Stage, t: number, x: number, y: number, z: number, o: { w?: number; seed?: number; col?: string } = {}) => {
  const w = o.w ?? 1.2, sd = o.seed ?? 0, ph = q(((t * 0.5 + hh(sd, 4)) % 1), 8), col = o.col ?? "#ffffff";
  out.fx.push({ key: `foam|${sd}|${col}|${ph}`, cw: 300, ch: 300, flat: true, rot: hh(sd, 5) * 6.28 + Math.sin(t * 0.6 + sd) * 0.1, x, y: y + 0.02, z, w, h: w, draw: (p) => {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + ph * 0.6, d = 60 + 55 * hh(i, sd), r = 22 + 18 * hh(i, sd + 1) * (0.8 + 0.2 * Math.sin(ph * 6.28 + i));
      p.ell(150 + Math.cos(a) * d, 150 + Math.sin(a) * d, r, r, col, 5);
    }
  } });
};

/** cartoon explosion: flash star, fireball, debris and a smoke plume; pair with a camera kick, a white flash and SFX */
export const explode = (out: Stage, t: number, t0: number, x: number, y: number, z: number, o: { w?: number } = {}) => {
  const w = o.w ?? 3, dt = t - t0;
  if (dt < 0 || dt > 4) return;
  if (dt < 0.25) { const u = q(dt / 0.25, 16); out.fx.push({ key: `xburst${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#fff2a8", 12), x, y: y + w * 0.4, z, w: w * 1.6, h: w * 1.6 }); }
  if (dt < 0.6) {
    // swells fast, then collapses into the smoke (the smoke starts as it shrinks, never in front of the full ball)
    const u = q(dt / 0.6, 18), sz = w * (u < 0.35 ? 0.5 + 0.7 * smoothU(u / 0.35) : 1.2 - 0.9 * smoothU((u - 0.35) / 0.65));
    out.fx.push({ key: `fireball${u}`, cw: 400, ch: 400, x, y: y + w * 0.45, z, w: sz, h: sz, draw: (p) => {
      const s = 1 - u * 0.35;
      for (const [r, c] of [[180, "#e8452c"], [140, "#ff8a2a"], [95, "#ffd23f"], [45, "#fff6c8"]] as [number, string][])
        for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + r, rr = r * s * (0.55 + 0.2 * hh(i, r)); p.ell(200 + Math.cos(a) * r * 0.35 * s, 200 + Math.sin(a) * r * 0.3 * s, rr, rr, c, r === 180 ? 7 : 0); }
    } });
  }
  if (dt < 1.2) for (let i = 0; i < 10; i++) {
    const a = hh(i, 11) * 6.28, v = (3 + 4 * hh(i, 12)) * w / 3, vy = (4 + 5 * hh(i, 13)) * w / 3, py = y + w * 0.4 + vy * dt - 4.9 * dt * dt;
    if (py < y) continue;
    out.fx.push({ key: "debris", cw: 64, ch: 64, draw: (p) => p.poly([[10, 20], [44, 8], [56, 40], [22, 56]], "#5a4636", 5), rot: dt * 9 + i,
      x: x + Math.cos(a) * v * dt, y: py, z: z + Math.sin(a) * v * dt, w: 0.18 * w / 3, h: 0.18 * w / 3 });
  }
  smoke(out, t, t0 + 0.4, x, y + w * 0.7, z, { dur: 0.6, w: w * 0.7, rate: 8, rise: 1.6, col: "#4a4450" });
};

/** time-lapse assembly (a bridge going up, rails being laid): pieces pop in one after another as k goes 0..1.
 *  Build each piece as its own object in the place builder, return them as a handle, call this from pose(). */
export const buildUp = (pieces: THREE.Object3D[], k: number, o: { overlap?: number; from?: "scale" | "drop" } = {}) => {
  const n = pieces.length, L = o.overlap ?? 2;
  pieces.forEach((m, i) => {
    if (!m.userData.base) m.userData.base = { s: m.scale.clone(), y: m.position.y };
    const b = m.userData.base as { s: THREE.Vector3; y: number };
    const e = clamp01((k * (n + L) - i) / L), back = 1 + 2.2 * (e - 1) ** 3 + 1.2 * (e - 1) ** 2; // ease-out-back
    m.visible = e > 0;
    if (o.from === "drop") { m.scale.copy(b.s); m.position.y = b.y + (1 - Math.min(1, back)) * 3; }
    else { m.scale.copy(b.s).multiplyScalar(Math.max(1e-3, back)); m.position.y = b.y; }
  });
};
