// Timeline of "What If Animals Could Sue Humans": shots timed to the voice words (projects/animal-court/voice/words.json),
// four sets in one world (courtroom at the origin, jungle at x -200, courthouse steps at x +200, 1519 town square at
// x +400) and the camera grammar of the bridge short: slow push-ins on every hold, smootherstep glides 18-60 f, big
// reframes are cuts, impacts are 7-frame flip kicks. Visual reactions land 0-3 f before their word.
export const FPS = 30;
export const TOTAL = 2082; // voice 68.91 s + tail
export const D0 = 0; // ground height (build.ts reads it)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- places ----------------
export const JX = -200, EX = 200, MX = 400;
/** courtroom */
export const WITNESS: V3 = [-5, 0.7, -7.6]; // monkey on a stool behind the 0.85 m rail
export const MAN_T: V3 = [-2.6, 0, -4.5];       // photographer behind the left table
export const MONK_T: V3 = [2.2, 0.48, -4.5];    // monkey on a chair behind the right table
export const LAWYER_T: V3 = [3.4, 0, -4.5];
export const EASEL_C: V3 = [0, 0, -2.2];
export const JUDGES: V3[] = [[-1.25, 0.55, -10.1], [0, 0.55, -10.1], [1.25, 0.55, -10.1]];
export const CRATES: V3[] = [[-1.05, 0, -4], [1.05, 0, -4]];
/** jungle */
export const TRIPOD: V3 = [JX + 0.85, 0, 0];
export const MONK_J: V3 = [JX + 1.2, 0.2, 0.25]; // standing on a rock
export const MAN_J: V3 = [JX - 1.3, 0, 0.4];
/** courthouse: 10 steps of 0.25 m x 0.5 m from z = -12 (bottom) up to the portico at z = -17, y = 2.5 */
export const stepY = (z: number) => (z > -12 ? 0 : z < -17 ? 2.5 : Math.min(2.5, Math.ceil((-12 - z) / 0.5) * 0.25));
export const MONK_STEP: V3 = [EX + 0.6, 0.75, -13.25];
/** 1519 square */
export const MJUDGE: V3 = [MX, 0.45, -6.9];
export const MLAWYER: V3 = [MX + 1.8, 0, -3.6];
export const DOCK: V3 = [MX - 1.4, 0, -3.3];
export const CATWALL: V3 = [MX + 3.7, 0.9, -2.0];

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Set = "C" | "J" | "E" | "M";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: Set; sunAz?: number; sunEl?: number };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 127, light: "day", set: "C", sunEl: 64, sunAz: 120 },     // hook: the monkey in the witness box
  { id: 2, a: 127, b: 335, light: "day", set: "J", sunAz: 110 },              // Indonesia 2011: tripod, Naruto presses it
  { id: 3, a: 335, b: 511, light: "day", set: "C", sunEl: 64, sunAz: 120 },   // the photo, the man or the monkey?
  { id: 4, a: 511, b: 685, light: "day", set: "E", sunAz: 120 },              // up the courthouse steps
  { id: 5, a: 685, b: 812, light: "day", set: "C", sunEl: 64, sunAz: 120 },   // the judges say no
  { id: 6, a: 812, b: 926, light: "day", set: "E", sunAz: 120 },              // Luckily
  { id: 7, a: 926, b: 1021, light: "day", set: "E", sunAz: 120 },             // Unluckily
  { id: 8, a: 1021, b: 1279, light: "day", set: "C", sunEl: 64, sunAz: 120 }, // two boxes: people and things
  { id: 9, a: 1279, b: 1550, light: "day", set: "M", sunAz: 100 },            // 1519: rats on trial, the cats
  { id: 10, a: 1550, b: 1762, light: "day", set: "E", sunAz: 120 },           // seventy billion hens
  { id: 11, a: 1762, b: 1848, light: "day", set: "C", sunEl: 64, sunAz: 120 },// the judge reads every one
  { id: 12, a: 1848, b: TOTAL, light: "golden", set: "J", sunAz: 145, sunEl: 17 }, // the selfie belongs to nobody
];
/** crossfades (frames) at place changes; a white 4-frame flash after the hook */
export const XFADE: Record<number, number> = { 3: 6, 4: 8, 5: 6, 6: 8, 8: 8, 9: 8, 10: 8, 11: 6, 12: 8 };
export const FLASH_AT = 127;

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- story motion ----------------
/** monkey + lawyer walking to and up the courthouse steps (shot 4): z of the pair at frame f */
export const climbZ = (f: number) => {
  const t = (f - 511) / FPS;
  return t < 2.9 ? -8 - 1.4 * t : -12.06 - 1.0 * (t - 2.9);
};
/** monkey walking in to the tripod (shot 2) */
export const monkJX = (f: number) => MONK_J[0] + 1.6 * (1 - smooth((f - 232) / 36));
/** paper stack scale (shot 11): grows on "every", "single", "one" */
export const stackK = (f: number) => 0.55 + [1800, 1813, 1825].reduce((a, h) => a + 0.33 * easeOut((f - h + 2) / 5), 0);
/** pop-up height 0 (hidden, below the crate rim) .. 1 (up), with a small overshoot */
export const pop = (f: number, at: number) => {
  const u = clamp01((f - at + 2) / 7);
  return u <= 0 ? 0 : u >= 1 ? 1 : easeOut(u) + 0.12 * Math.sin(Math.PI * u);
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (f: number) => f / FPS;
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });
const at = (p: V3, dx: number, dy: number, dz: number): V3 => [p[0] + dx, p[1] + dy, p[2] + dz];

const W1 = at(WITNESS, 0, 0.52, 0); // monkey's face in the witness box
const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: (f) => dolly(at(W1, 1.0, 0.25, 2.5), W1, pushK(f, 0, 0.003, 0.006, 30), { fov: 38, roll: -0.03 }) },
    { f: 78, cut: true, s: (f) => dolly([2.2, 2.7, 4.8], [-2.4, 1.3, -7.5], pushK(f, 78, 0.0025), { fov: 50 }) }, // "American courtroom"
  ],
  2: [
    { f: 123, s: (f) => zoom([JX + 17, 15, 22], [JX, 1, 0], 44, pushK(f, 123, 0.002)) },
    { f: 185, cut: true, s: (f) => dolly([JX - 0.4, 1.7, 7.6], [JX - 0.2, 1.0, 0.2], pushK(f, 185, 0.0025), { fov: 40 }) }, // "A photographer"
    { f: 238, cut: true, s: (f) => dolly([JX + 1.25, 1.0, 2.9], [JX + 1.05, 0.72, 0.1], pushK(f, 238, 0.0022), { fov: 40, roll: 0.03 }) }, // "a macaque"
    { f: 286, dur: 20, s: (f) => dolly([JX + 1.15, 0.95, 2.3], [JX + 1.0, 0.72, 0.1], pushK(f, 286, 0.002), { fov: 38, roll: -0.04 }) }, // "button"
  ],
  3: [
    { f: 331, s: (f) => dolly(at(EASEL_C, 0.25, 1.55, 2.9), at(EASEL_C, 0, 1.3, 0), pushK(f, 331, 0.003), { fov: 38 }) },
    { f: 389, cut: true, s: (f) => dolly([0.4, 3.0, 5.0], [0, 1.0, -4.5], pushK(f, 389, 0.0025), { fov: 46 }) }, // "and so does the argument"
    { f: 458, cut: true, s: (f) => dolly(at(MAN_T, 1.0, 1.65, 3.6), at(MAN_T, 0, 1.55, 0), pushK(f, 458, 0.003), { fov: 38, roll: -0.03 }) }, // "The man?"
    { f: 479, cut: true, s: (f) => dolly(at(MONK_T, -0.4, 1.05, 3.4), at(MONK_T, 0.1, 0.8, 0), pushK(f, 479, 0.003, 0.006, 25), { fov: 38, roll: 0.04 }) }, // "or the monkey?"
  ],
  4: [
    { f: 507, s: (f) => dolly([EX + 7, 2.2, 6], [EX, 3.2, -12], pushK(f, 507, 0.002), { fov: 46 }) },
    { f: 596, dur: 60, s: (f) => ({ pos: [EX + 2.6, 1.0, climbZ(f) + 6.5], look: [EX - 0.3, 6.5, -20], fov: 54, roll: 0.03 }) }, // "climbs": low and up at the columns
  ],
  5: [
    { f: 682, s: (f) => dolly([0.3, 2.1, -3.6], [0, 1.95, -10.1], pushK(f, 682, 0.0025, 0.006, 30), { fov: 46 }) },
    { f: 740, cut: true, s: (f) => dolly(at(MONK_T, -0.3, 1.0, 2.4), at(MONK_T, 0.05, 0.8, 0), pushK(f, 740, 0.003), { fov: 36, roll: -0.04 }) }, // "an animal can't"
  ],
  6: [
    { f: 808, s: (f) => dolly(at(MONK_STEP, 1.2, 0.75, 3.6), at(MONK_STEP, 0, 0.5, 0), pushK(f, 808, 0.0018), { fov: 40, roll: -0.03 }) },
    { f: 924, dur: 18, s: (f) => dolly(at(MONK_STEP, 0.55, 0.6, 2.2), at(MONK_STEP, 0, 0.5, 0), pushK(f, 924, 0.0018), { fov: 38, roll: 0.04 }) }, // "Unluckily"
  ],
  8: [
    { f: 1017, s: (f) => dolly([0, 2.6, 5.6], [0, 1.0, -4], pushK(f, 1017, 0.0022), { fov: 48 }) },
    { f: 1169, cut: true, s: (f) => dolly(at(CRATES[1], 0.2, 1.75, 3.2), at(CRATES[1], 0, 1.15, 0), pushK(f, 1169, 0.0022), { fov: 38 }) }, // "Animals sit"
    { f: 1230, dur: 22, s: (f) => dolly(at(CRATES[1], 0.45, 1.6, 2.4), at(CRATES[1], 0.3, 1.15, 0), pushK(f, 1230, 0.002, 0.006, 30), { fov: 36, roll: 0.04 }) }, // "next to the chair"
  ],
  9: [
    { f: 1275, s: (f) => dolly([MX + 6, 3.0, 6.5], [MX, 1.2, -5], pushK(f, 1275, 0.002), { fov: 46 }) },
    { f: 1350, dur: 30, s: (f) => dolly([MX + 1.6, 1.7, 1.8], [MX, 1.3, -5.6], pushK(f, 1350, 0.002), { fov: 42, roll: -0.03 }) }, // "In 1519"
    { f: 1394, cut: true, s: (f) => dolly(at(DOCK, 0.15, 0.5, 1.8), at(DOCK, 0, 0.3, -0.1), pushK(f, 1394, 0.003), { fov: 38 }) }, // "French town sued some rats"
    { f: 1448, cut: true, s: (f) => dolly(at(MLAWYER, -0.8, 1.65, 2.9), at(MLAWYER, 0, 1.5, 0), pushK(f, 1448, 0.0025), { fov: 38, roll: 0.03 }) }, // "their lawyer"
    { f: 1503, cut: true, s: (f) => dolly(at(CATWALL, -1.0, 0.55, 2.8), at(CATWALL, 0, 0.3, 0), pushK(f, 1503, 0.003, 0.006, 25), { fov: 40, roll: -0.04 }) }, // "because of the cats"
  ],
  10: [
    { f: 1546, s: (f) => dolly([EX + 1.0, 0.6, -6.4], [EX + 0.1, 0.35, -10.2], pushK(f, 1546, 0.0025), { fov: 40 }) },
    { f: 1595, cut: true, s: (f) => dolly([EX + 1.5, 3.6, 10], [EX, 1.2, -10], pushK(f, 1595, 0.002), { fov: 46 }) }, // "Chickens alone"
    { f: 1678, dur: 66, s: () => ({ pos: [EX + 6, 42, 52], look: [EX, 0, -2], fov: 52 }) }, // "seventy billion": crane up and out
  ],
  11: [
    { f: 1759, s: (f) => dolly([0.7, 2.05, -5.6], [0.45, 2.15, -10.1], pushK(f, 1759, 0.0025), { fov: 42 }) },
    { f: 1798, dur: 30, s: (f) => dolly([0.9, 2.6, -4.6], [0.6, 3.0, -10.1], pushK(f, 1798, 0.002), { fov: 46, roll: 0.035 }) }, // tilt up the stack
  ],
  12: [
    { f: 1844, s: (f) => dolly([JX - 0.1, 1.65, 7.6], [JX - 0.15, 1.2, 0], pushK(f, 1844, 0.002), { fov: 44 }) },
    { f: 1912, dur: 26, s: (f) => dolly([JX + 0.1, 1.5, 4.2], [JX, 1.3, 0], pushK(f, 1912, 0.002, 0.005, 30), { fov: 40, roll: -0.03 }) }, // "nobody"
    { f: 1986, cut: true, s: (f) => dolly(at(MONK_J, -0.25, 0.95, 2.5), at(MONK_J, 0, 0.75, 0), pushK(f, 1986, 0.003), { fov: 38, roll: 0.03 }) }, // "a monkey can't own it"
    { f: 2025, cut: true, s: (f) => dolly(at(MAN_J, 0.5, 1.6, 2.8), at(MAN_J, 0, 1.5, 0), pushK(f, 2025, 0.003), { fov: 38 }) }, // "neither can anyone else"
    { f: 2052, dur: 30, s: () => ({ pos: [JX + 4, 6.5, 14], look: [JX, 1.0, 0], fov: 44 }) }, // pull out to the end
  ],
};
CAMS[7] = CAMS[6];

// impact kicks: the flash, the shutter, the gavel, the three paper thumps
const KICKS: [number, number][] = [[1.17, 0.4], [9.75, 0.5], [24.1, 1.2], [60.0, 0.45], [60.44, 0.45], [60.82, 0.6]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(T(f));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 14 },                 // monkey CU in the witness box
  { f: 78, cInf: 0 },                 // courtroom wide
  { f: 127, cInf: 0 },                // jungle aerial
  { f: 185, cInf: 10 },               // photographer MS
  { f: 238, cInf: 13 },               // monkey CU at the tripod
  { f: 335, cInf: 12 },               // the selfie on the easel
  { f: 389, cInf: 0 },                // courtroom wide
  { f: 458, cInf: 12 },               // the man / the monkey
  { f: 511, cInf: 0 },                // courthouse steps
  { f: 685, cInf: 8 },                // judges MS
  { f: 740, cInf: 13 },               // monkey shock
  { f: 812, cInf: 11 },               // Luckily / Unluckily
  { f: 1021, cInf: 0 },               // the two boxes wide
  { f: 1169, cInf: 10 },              // things box
  { f: 1279, cInf: 0 },               // 1519 square wide
  { f: 1394, cInf: 14 },              // rats CU
  { f: 1448, cInf: 11 },              // lawyer
  { f: 1503, cInf: 12 },              // cats
  { f: 1550, cInf: 13 },              // first hen
  { f: 1595, cInf: 0 },               // the crowd + crane
  { f: 1762, cInf: 9 },               // judge + stack
  { f: 1848, cInf: 6 },               // golden jungle
  { f: 1986, cInf: 12 },              // monkey / man
  { f: 2052, dur: 30, cInf: 0 },      // pull out
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => {
  const d = dofAt(f);
  return d.focus ? d.focus(f) : camAt(id, f).look;
};
export { T as secOf };
