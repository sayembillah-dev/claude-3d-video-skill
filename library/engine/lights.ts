// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
/** every light a shot can use: day / golden (bridge study), storm (saturated ultramarine, from the 2026-11-03 reference
 *  study: sky #1d2991 -> #4444c1 at the horizon, water ~#3a5ad8, heavy blue fog), dusk (blue hour after sunset) */
export type LightName = "day" | "golden" | "storm" | "dusk";
export const LIGHT_NAMES: LightName[] = ["day", "golden", "storm", "dusk"];
/** lights whose sun is low: real card shadows, a wider shadow camera, the sun disc + halo on screen */
export const LOW_SUN: Record<LightName, boolean> = { day: false, golden: true, storm: false, dusk: true };
export const LIGHTS: Record<LightName, LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.68, 0.24], shade: [0.15, 0.15, 0.3], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
  storm: {
    az: 60, el: 40,
    lit: [0.46, 0.56, 1.38], shade: [0.26, 0.31, 0.88], lift: [0.03, 0.04, 0.2], lambert: 0.25, sideK: 0.9, term: 0.3,
    charTint: [0.74, 0.8, 1.08], charShade: 0.88, charGrad: 0.08, bodyGrad: 0.2, sideTint: [0.86, 0.88, 1.0],
    blob: [0.6, 0.6, 0.82], actorShadow: false,
    top: "#18217d", hor: "#5a5ec8", skyCurve: [0.0, 0.5, 0.6], fog: "#5a5ec8", fogNear: 10, fogFar: 170, sunDisc: "#000000",
    sunCol: "#c8d0ff", sunI: 1.6, sky: "#8a90e0", ground: "#3a3f80", hemiI: 0.8,
    bias: -0.00025, normalBias: 0.015,
  },
  dusk: {
    az: 10, el: 4,
    lit: [0.82, 0.46, 0.52], shade: [0.1, 0.11, 0.3], lift: [0.04, 0.05, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [0.92, 0.75, 0.8], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.82, 0.8, 0.96],
    blob: [0.72, 0.7, 0.9], actorShadow: true,
    top: "#1f2a66", hor: "#f0a37c", skyCurve: [0.05, 0.6, 1.0], fog: "#b58aa6", fogNear: 40, fogFar: 320, sunDisc: "#ff9f8a",
    sunCol: "#ff9a7a", sunI: 3.2, sky: "#9a8ac8", ground: "#4a3f6a", hemiI: 0.55,
    bias: -0.0006, normalBias: 0.03,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<LightName, WorldLook> = {
  day: {
    // depth.md 2.2: horizon #9fb6e6 just above the skyline, upper sky #5e93d9 at ~20 deg (grade: frame top #5997e2)
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
  golden: {
    // sunset, not dusk: #ffd08a horizon, peach/orange through ~10 deg, warm rose at 20, muted warm mauve only near the top
    // (the golden grade adds ~+11/255 blue to shadows/mids, so these lean warm)
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.1,
  },
  storm: {
    sky: { c: ["#5a5ec8", "#4a4fbf", "#3a40ae", "#283296", "#18217d"], e: [0, 3, 8, 16, 40] },
    water: { near: "#3a5ad8", mid: "#2f47c0", far: "#5a5ec8", crest: "#bcd0ff", trough: "#1c2a8a", glint: "#e8f0ff", shade: [0.5, 0.55, 0.85] },
    cloud: { lit: "#8f93d8", mid: "#5f63b8", shade: "#3b3f8f" },
    bounce: [0, 0, 0.03],
    sat: 1.12,
  },
  dusk: {
    sky: { c: ["#f0a37c", "#d98f90", "#9a7cb0", "#4f5aa0", "#1f2a66"], e: [0, 3, 9, 18, 40] },
    water: { near: "#26386e", mid: "#3d4f8e", far: "#d49a9a", crest: "#e0a8a0", trough: "#18224f", glint: "#ffd8c0", shade: [0.42, 0.44, 0.72] },
    cloud: { lit: "#ffc2a0", mid: "#c88ab0", shade: "#5d5a9e" },
    bounce: [0.03, 0.01, 0.02],
    sat: 1.1,
  },
};

// ---------------- in-shot light change (storm rolling in, sun going down) ----------------
// Only colours and intensities blend. The sun direction stays frozen per shot (world.ts uses the start preset's az/el),
// and the fields that cannot blend come from the start light: actorShadow (card shadows would pop), bias / normalBias.
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, k: number) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, "0")).join("");
const KEEP = new Set(["az", "el", "actorShadow", "bias", "normalBias"]);
const mixAny = (a: any, b: any, k: number, key = ""): any => {
  if (KEEP.has(key)) return a;
  if (typeof a === "number") return a + (b - a) * k;
  if (typeof a === "string") return a.startsWith("#") && a.length === 7 ? mixHex(a, b, k) : a;
  if (Array.isArray(a)) return a.map((v, i) => mixAny(v, b[i], k));
  if (a && typeof a === "object") { const o: any = {}; for (const kk of Object.keys(a)) o[kk] = mixAny(a[kk], b[kk], k, kk); return o; }
  return a;
};
export const mixLight = (a: LightName, b: LightName, k: number): LightPreset => (k <= 0 ? LIGHTS[a] : mixAny(LIGHTS[a], LIGHTS[b], k));
export const mixLook = (a: LightName, b: LightName, k: number): WorldLook => (k <= 0 ? LOOK[a] : mixAny(LOOK[a], LOOK[b], k));
