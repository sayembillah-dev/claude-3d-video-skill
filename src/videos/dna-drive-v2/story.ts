// Timeline of "dna-drive-v2" (the fresh remake of "What if you used your DNA as storage?"): shots timed to the voice
// words (projects/dna-drive-v2/voice/words.json). Five places in one world: the hero's home office (x 0), inside the body
// (x 200), a city street at lunch (x 400), a museum of storage (x 600) and a cold DNA vault (x 800). Every hold creeps,
// big reframes are cuts, punch words get a small punch or a kick.
import { FPS, V3, ShotDef, Key, Dof, makeFilm, pushK, dolly, zoom, at, smooth, easeOut, clamp01 } from "../../../library/director/camera";
export { FPS, clamp01, smooth, easeOut };
export type { V3 };
export const TOTAL = 2300; // voice 75.47 s + tail

// ---------------- places ----------------
export const HX = 0, BX = 200, SX = 400, MX = 600, VX = 800;
/** home office: the hero behind the desk (top .76, front z -3.5) */
export const HERO_H: V3 = [HX, 0, -4.65];
export const MON: V3 = [HX + 0.72, 0.76, -3.85];
export const DNA_H: V3 = [HX - 0.82, 0.76, -3.85];
/** inside the body */
export const CELL: V3 = [BX, 0, -3];
export const USB: V3 = [BX + 1.75, 0, -2.6];
export const PHOTO: V3 = [BX, 0.2, -2.2];
/** street: the hero walks to +x along the pavement */
export const WALK_Z = -5.2;
export const heroX = (f: number) => SX - 4 + 0.8 * Math.max(0, f - 454) / FPS;
/** museum: plinths (1.0 m tall) along the back, exhibits on top; the guide and the hero stand in front */
export const PL: V3[] = [[MX - 4, 0, -7], [MX - 1.4, 0, -7], [MX + 1.2, 0, -7], [MX + 3.8, 0, -7], [MX + 6.4, 0, -7]];
export const TOWER_M: V3 = [MX - 6.6, 0, -8.6];
/** which plinth the pair stands at in each museum shot */
export const PL_OF: Record<number, number> = { 8: 0, 9: 0, 10: 1, 11: 2, 12: 3, 13: 4 };
/** cold vault */
export const SCI: V3 = [VX + 0.3, 0, -3.6];
export const TUBES: V3[] = [[VX - 0.9, 0.92, -2.5], [VX - 0.45, 0.92, -2.45], [VX + 0.95, 0.92, -2.5]];
export const heroVX = (f: number) => VX + 3.6 - 1.5 * smooth((f - 2074) / 14);

// ---------------- shots ----------------
const IN = { sunEl: 62, sunAz: 120 };
const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 96, light: "day", set: "H", ...IN },          // what if you could save files in your body?
  { id: 2, a: 96, b: 196, light: "day", set: "H", ...IN },        // you already do. DNA.
  { id: 3, a: 196, b: 325, light: "day", set: "B", sunAz: 100 },  // every cell: 750 MB
  { id: 4, a: 325, b: 454, light: "day", set: "B", sunAz: 100 },  // one old USB stick, too small to see
  { id: 5, a: 454, b: 534, light: "day", set: "S", sunAz: 110 },  // 37 trillion cells (the crowd)
  { id: 6, a: 534, b: 662, light: "day", set: "S", sunAz: 110 },  // a different file each: 28 zettabytes
  { id: 7, a: 662, b: 781, light: "day", set: "S", sunAz: 110 },  // a warehouse of hard drives, eating lunch
  { id: 8, a: 781, b: 1034, light: "day", set: "M", sunEl: 64, sunAz: 125 },  // 2017: 215 PB in a gram
  { id: 9, a: 1034, b: 1108, light: "day", set: "M", sunEl: 64, sunAz: 125 }, // one gram, a paperclip
  { id: 10, a: 1108, b: 1262, light: "day", set: "M", sunEl: 64, sunAz: 125 }, // a movie and an OS, read back
  { id: 11, a: 1262, b: 1375, light: "day", set: "M", sunEl: 64, sunAz: 125 }, // Luckily: thousands of years
  { id: 12, a: 1375, b: 1562, light: "day", set: "M", sunEl: 64, sunAz: 125 }, // Unluckily: dollars, hours
  { id: 13, a: 1562, b: 1641, light: "day", set: "M", sunEl: 64, sunAz: 125 }, // selfie > phone
  { id: 14, a: 1641, b: 1799, light: "day", set: "B", sunAz: 100 }, // cells copy their DNA when they divide
  { id: 15, a: 1799, b: 1971, light: "day", set: "B", sunAz: 100 }, // typo: a different vacation
  { id: 16, a: 1971, b: 2109, light: "day", set: "V", sunEl: 60, sunAz: 115 }, // cold, dry tubes, not people
  { id: 17, a: 2109, b: TOTAL, light: "golden", set: "H", sunAz: 150, sunEl: 18 }, // it's storing you
];
const XFADE: Record<number, number> = { 3: 8, 5: 8, 8: 8, 14: 8, 16: 8, 17: 10 };

// ---------------- story motion ----------------
/** pop-up 0 (hidden) .. 1 with a small overshoot, starting 2 f before `at` */
export const pop = (f: number, at: number) => {
  const u = clamp01((f - at + 2) / 7);
  return u <= 0 ? 0 : u >= 1 ? 1 : easeOut(u) + 0.12 * Math.sin(Math.PI * u);
};
/** the cell shrinks to a speck on "too small to see" */
export const cellK = (f: number) => (f < 400 ? 1 : 1 - 0.9 * smooth((f - 400) / 32));
/** coins stack height on "thousands of dollars" */
export const coinsN = (f: number) => Math.round(2 + 12 * smooth((f - 1440) / 36));
/** cell division progress on "divide" */
export const splitK = (f: number) => smooth((f - 1712) / 55);

// ---------------- camera ----------------
const HF = at(HERO_H, 0, 1.45, 0); // the hero's face at the desk
const pl = (i: number, dx: number, dy: number, dz: number) => at(PL[i], dx, dy, dz);
const CAMS: Record<number, Key[]> = {
  1: [
    { f: 0, s: (f) => dolly([HX + 1.3, 1.75, 0.9], at(HERO_H, 0.1, 1.15, 0.3), pushK(f, 0, 0.0028), { fov: 46 }) },
    { f: 66, dur: 26, s: (f) => dolly(at(HF, 0.5, 0.1, 3.0), HF, pushK(f, 66, 0.003, 0.006, 25), { fov: 40, roll: -0.03 }) }, // "your own body?"
  ],
  2: [
    { f: 96, cut: true, s: (f) => dolly(at(HF, -0.2, 0.05, 2.6), at(HF, -0.1, -0.05, 0), pushK(f, 96, 0.0025), { fov: 40 }) },
    { f: 160, dur: 22, s: (f) => dolly([HX - 0.9, 1.5, -1.5], [HX - 0.55, 1.15, -4.1], pushK(f, 160, 0.003, 0.006, 25), { fov: 42, roll: 0.03 }) }, // "DNA"
  ],
  3: [
    { f: 192, s: (f) => dolly([BX + 0.6, 1.5, 3.4], [BX, 1.2, -3], pushK(f, 192, 0.0025), { fov: 46 }) },
    { f: 258, dur: 22, s: (f) => dolly([BX + 0.3, 1.45, 1.6], [BX, 1.25, -3], pushK(f, 258, 0.0025, 0.006), { fov: 44 }) }, // "seven hundred..."
  ],
  4: [
    { f: 325, cut: true, s: (f) => dolly([BX + 1.0, 1.25, 2.4], [BX + 0.9, 1.0, -2.8], pushK(f, 325, 0.0025), { fov: 46 }) },
    { f: 386, dur: 50, s: (f) => dolly([BX + 0.4, 7.5, 19], [BX + 0.4, 0.6, -3], pushK(f, 386, 0.0015), { fov: 40 }) }, // "too small to see"
  ],
  5: [
    { f: 450, s: (f) => ({ pos: [heroX(f) + 0.6, 1.6, -1.4], look: [heroX(f), 1.35, WALK_Z], fov: 44 }) },
    { f: 490, dur: 40, s: (f) => ({ pos: [heroX(f) + 0.5, 7.5, 7.5], look: [heroX(f) + 0.3, 0.8, WALK_Z], fov: 48 }) }, // "trillion"
  ],
  6: [
    { f: 534, cut: true, s: (f) => ({ pos: [heroX(f) - 1.0, 1.5, -1.0], look: [heroX(f), 1.75, WALK_Z], fov: 46 }) },
    { f: 624, dur: 26, s: (f) => ({ pos: [heroX(f), 2.2, 4.2], look: [heroX(f), 2.7, WALK_Z - 1.5], fov: 52, roll: -0.03 }) }, // "zettabytes"
  ],
  7: [
    { f: 662, cut: true, s: (f) => ({ pos: [heroX(f) + 3.4, 1.9, 0.6], look: [heroX(f), 2.1, WALK_Z - 0.6], fov: 50 }) },
    { f: 742, cut: true, s: (f) => ({ pos: [heroX(f) + 0.7, 1.55, -2.4], look: [heroX(f) + 0.05, 1.35, WALK_Z], fov: 40, roll: 0.03 }) }, // "Eating lunch"
  ],
  8: [
    { f: 777, s: (f) => dolly([MX - 1.5, 3.4, 6], [MX - 1.8, 1.4, -7], pushK(f, 777, 0.0022), { fov: 52 }) },
    { f: 836, cut: true, s: (f) => dolly(pl(0, 0.2, 1.55, 4.6), pl(0, 0.1, 1.2, 0.8), pushK(f, 836, 0.0025), { fov: 42 }) }, // "2017"
    { f: 930, cut: true, s: (f) => dolly(pl(0, -0.5, 0.9, 3.8), at(TOWER_M, 0.3, 3.0, 0), pushK(f, 930, 0.0025), { fov: 54, roll: 0.03 }) }, // "petabytes"
    { f: 985, cut: true, s: (f) => dolly(pl(0, -0.15, 1.3, 1.5), pl(0, -0.1, 1.2, 0), pushK(f, 985, 0.003, 0.006, 25), { fov: 38 }) }, // "gram"
  ],
  9: [{ f: 1034, cut: true, s: (f) => dolly(pl(0, 0.3, 1.32, 1.7), pl(0, 0.1, 1.18, 0), pushK(f, 1034, 0.0028, 0.005, 30), { fov: 40, roll: -0.02 }) }],
  10: [
    { f: 1108, cut: true, s: (f) => dolly(pl(1, 0.1, 1.55, 4.6), pl(1, 0, 1.2, 0.8), pushK(f, 1108, 0.0025), { fov: 42 }) },
    { f: 1220, dur: 24, s: (f) => dolly(pl(1, 0.3, 1.3, 1.6), pl(1, 0.25, 1.2, 0), pushK(f, 1220, 0.0025, 0.006), { fov: 40 }) }, // "perfectly"
  ],
  11: [{ f: 1262, cut: true, s: (f) => dolly(pl(2, 0.4, 1.5, 4.5), pl(2, 0, 1.25, 0.8), pushK(f, 1262, 0.0028), { fov: 44, roll: 0.02 }) }],
  12: [
    { f: 1375, cut: true, s: (f) => dolly(pl(3, -0.1, 1.55, 4.6), pl(3, 0, 1.2, 0.8), pushK(f, 1375, 0.0025), { fov: 44 }) },
    { f: 1430, dur: 24, s: (f) => dolly(pl(3, -0.3, 1.3, 1.7), pl(3, -0.2, 1.25, 0), pushK(f, 1430, 0.0025, 0.006), { fov: 40 }) }, // "costs"
    { f: 1530, cut: true, s: (f) => dolly(pl(3, 0.3, 1.32, 1.4), pl(3, 0.25, 1.28, 0), pushK(f, 1530, 0.003), { fov: 38, roll: -0.03 }) }, // "hours"
  ],
  13: [
    { f: 1562, cut: true, s: (f) => dolly(pl(4, 0, 1.55, 4.4), pl(4, 0, 1.2, 0.8), pushK(f, 1562, 0.0028), { fov: 44 }) },
    { f: 1596, dur: 20, s: (f) => dolly(pl(4, 0.1, 1.35, 1.9), pl(4, 0.1, 1.3, 0), pushK(f, 1596, 0.003, 0.006, 25), { fov: 42, roll: 0.03 }) }, // "more"
  ],
  14: [
    { f: 1637, s: (f) => dolly([BX - 0.5, 1.6, 3.8], [BX, 1.2, -3], pushK(f, 1637, 0.0025), { fov: 48 }) },
    { f: 1706, dur: 30, s: (f) => dolly([BX, 1.4, 3.0], [BX, 1.15, -3], pushK(f, 1706, 0.002), { fov: 52 }) }, // "copy their DNA"
  ],
  15: [
    { f: 1799, cut: true, s: (f) => dolly(at(PHOTO, 0.2, 1.0, 3.8), at(PHOTO, 0, 0.72, 0), pushK(f, 1799, 0.0025), { fov: 44 }) },
    { f: 1838, dur: 18, s: (f) => dolly(at(PHOTO, -0.1, 0.95, 3.1), at(PHOTO, 0, 0.72, 0), pushK(f, 1838, 0.0025, 0.006), { fov: 42, roll: -0.03 }) }, // "typo"
    { f: 1932, dur: 18, s: (f) => dolly(at(PHOTO, 0.1, 0.9, 2.8), at(PHOTO, 0, 0.72, 0), pushK(f, 1932, 0.0025, 0.006), { fov: 40, roll: 0.03 }) }, // "different"
  ],
  16: [
    { f: 1967, s: (f) => dolly([VX + 0.3, 1.7, 2.2], [VX + 0.1, 1.25, -3], pushK(f, 1967, 0.0025), { fov: 46 }) },
    { f: 2072, dur: 26, s: (f) => dolly([VX + 1.4, 1.7, 2.6], [VX + 1.3, 1.3, -2.6], pushK(f, 2072, 0.0025), { fov: 50 }) }, // "not in people"
  ],
  17: [
    { f: 2104, s: (f) => dolly([HX + 1.0, 1.65, 0.6], at(HERO_H, 0, 1.2, 0.4), pushK(f, 2104, 0.0028), { fov: 46 }) },
    { f: 2200, cut: true, s: (f) => dolly(at(HF, 0.25, 0.05, 2.4), HF, pushK(f, 2200, 0.003, 0.006, 25), { fov: 38 }) }, // "full"
    { f: 2236, dur: 60, s: (f) => dolly([HX + 1.2, 1.9, 1.4], at(HERO_H, -0.2, 1.2, 0.4), pushK(f, 2236, 0.0015), { fov: 46 }) }, // "storing you"
  ],
};
const KICKS: [number, number][] = [[11.94, 0.5], [20.94, 1.0], [31.06, 0.8], [48.86, 0.6], [69.26, 0.5]];
const DOF: Dof[] = [
  { f: 0, cInf: 9 }, { f: 66, dur: 20, cInf: 13 }, { f: 160, dur: 20, cInf: 11 },
  { f: 196, cInf: 8 }, { f: 386, dur: 40, cInf: 0 },
  { f: 454, cInf: 9 }, { f: 490, dur: 30, cInf: 2 }, { f: 534, cInf: 10 }, { f: 624, dur: 20, cInf: 4 }, { f: 662, cInf: 6 }, { f: 742, cInf: 13 },
  { f: 781, cInf: 0 }, { f: 836, cInf: 11 }, { f: 930, cInf: 4 }, { f: 985, cInf: 14 }, { f: 1034, cInf: 14 }, { f: 1108, cInf: 10 }, { f: 1220, dur: 20, cInf: 13 },
  { f: 1262, cInf: 10 }, { f: 1375, cInf: 10 }, { f: 1430, dur: 20, cInf: 13 }, { f: 1562, cInf: 11 },
  { f: 1641, cInf: 8 }, { f: 1799, cInf: 12 }, { f: 1971, cInf: 10 }, { f: 2072, dur: 20, cInf: 8 },
  { f: 2109, cInf: 9 }, { f: 2200, cInf: 14 }, { f: 2236, dur: 40, cInf: 9 },
];
export const SHOTS_OF = (id: number) => SHOTS[id - 1];
export const FILM = makeFilm({ total: TOTAL, shots: SHOTS, xfade: XFADE, cams: CAMS, kicks: KICKS, dof: DOF, flashAt: 96 });
void zoom;
