// Timeline of "What If You Could Store Files in Your DNA?": shots timed to projects/dna-drive/voice/words.json.
// Three places in one world: the science lab at the origin (L), the pink micro world at x 200 (M), the 1519-style
// town square re-dressed at x 400 (S, used as "the real world"). Camera grammar as in the other shorts: creeping
// push-ins on every hold, big reframes are cuts. Reactions land 0-3 f before their word.
import { FPS, V3, ShotDef, Key, Dof, makeFilm, smooth, easeOut, clamp01, pushK, dolly, zoom, at } from "../../../library/director/camera";
export { FPS, clamp01, smooth, easeOut };
export type { V3 };
export const TOTAL = 2300; // voice 75.26 s + tail

export const MX = 200, SX = 400;
/** lab */
export const ME: V3 = [0, 0, -2];            // our everyday person
export const SCI1: V3 = [-1.7, 0, -2.2], SCI2: V3 = [1.7, 0, -2.2];
export const TUBE: V3 = [1.0, 0, -2.2];
/** square */
export const WALK0: V3 = [SX, 0, -2];

const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 97, light: "day", set: "L", sunAz: 110 },            // hook: save your files in your body
  { id: 2, a: 97, b: 197, light: "day", set: "L", sunAz: 110 },          // good news, DNA
  { id: 3, a: 197, b: 326, light: "day", set: "M", sunAz: 110 },         // a cell carries 750 MB
  { id: 4, a: 326, b: 455, light: "day", set: "M", sunAz: 110 },         // one old USB stick, too small to see
  { id: 5, a: 455, b: 535, light: "day", set: "M", sunAz: 110 },         // thirty-seven trillion cells
  { id: 6, a: 535, b: 664, light: "day", set: "M", sunAz: 110 },         // a different file in each one
  { id: 7, a: 664, b: 783, light: "day", set: "S", sunAz: 100 },         // a warehouse of drives, walking, eating lunch
  { id: 8, a: 783, b: 1036, light: "day", set: "L", sunAz: 110 },        // 2017: 215 PB in a gram
  { id: 9, a: 1036, b: 1110, light: "day", set: "L", sunAz: 110 },       // about a paperclip
  { id: 10, a: 1110, b: 1264, light: "day", set: "L", sunAz: 110 },      // a movie and an OS, read back
  { id: 11, a: 1264, b: 1377, light: "day", set: "S", sunAz: 100 },      // Luckily: thousands of years
  { id: 12, a: 1377, b: 1564, light: "day", set: "L", sunAz: 110 },      // Unluckily: coins and hours
  { id: 13, a: 1564, b: 1643, light: "day", set: "L", sunAz: 110 },      // the selfie costs more than the phone
  { id: 14, a: 1643, b: 1801, light: "day", set: "M", sunAz: 110 },      // cells copy themselves
  { id: 15, a: 1801, b: 1973, light: "day", set: "M", sunAz: 110 },      // typos: the vacation changes
  { id: 16, a: 1973, b: 2111, light: "day", set: "L", sunAz: 110 },      // labs keep it in the fridge
  { id: 17, a: 2111, b: TOTAL, light: "golden", set: "S", sunAz: 145, sunEl: 17 }, // it's storing you
];
const XFADE: Record<number, number> = { 3: 8, 7: 8, 8: 8, 11: 8, 12: 8, 14: 8, 16: 8, 17: 10 };

// ---------------- story motion ----------------
/** cell-field grid (shots 5, 6, 14 reuse it): [x, z, i] receding from the camera */
export const FIELD: [number, number, number][] = (() => {
  const o: [number, number, number][] = [];
  let i = 0;
  for (let z = -3; z > -34; z -= 2.6 + (-z) * 0.07) {
    const sp = 2.1 + (-z) * 0.12, half = 5 + (-z) * 0.7;
    for (let x = -half; x <= half; x += sp) { o.push([x + ((i * 7) % 5 - 2) * 0.12, z, i]); i++; }
  }
  return o;
})();
/** how many field cells are visible at frame f (they pop in from the front on "trillion") */
export const fieldN = (f: number) => Math.round(FIELD.length * clamp01((f - 484) / 40));
/** hard-drive towers pour into the tube (shot 8): 1 = full size, 0 = gone into the tube */
export const pourK = (f: number) => 1 - smooth((f - 930) / 56);
/** coin stack height n (shot 12) and clock angle */
export const coinsN = (f: number) => 2 + Math.round(12 * smooth((f - 1442) / 70));
/** walking person z-less x offset in the square (shot 7) */
export const walkX = (f: number) => SX - 1.6 + 2.2 * smooth((f - 664) / 119);
/** cell split pulse (shot 14): 0..1..0 repeating, the copies keep coming */
export const splitK = (f: number) => { const u = ((f - 1650) / 36) % 1; return f < 1650 ? 0 : u < 0.5 ? smooth(u * 2) : 1 - smooth((u - 0.5) * 2); };

// ---------------- camera ----------------
const E1 = at(ME, 0, 1.3, 0);
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => dolly([0.5, 1.6, 3.8], E1, pushK(f, 0, 0.003, 0.006, 30), { fov: 40 }) },
      { f: 66, cut: true, s: (f) => dolly([0.3, 1.5, 1.9], at(ME, 0.2, 1.3, 0), pushK(f, 66, 0.003, 0.006, 20), { fov: 38, roll: -0.03 }) }], // "body?"
  2: [{ f: 97, s: (f) => dolly([0, 1.7, 5.4], [0, 1.3, -2.3], pushK(f, 97, 0.0022), { fov: 46 }) },
      { f: 160, cut: true, s: (f) => dolly([0.4, 1.5, 2.6], [0, 1.2, -2.3], pushK(f, 160, 0.003, 0.006, 20), { fov: 40, roll: 0.03 }) }], // "DNA."
  3: [{ f: 197, s: (f) => dolly([MX + 0.3, 1.5, 5.4], [MX, 1.2, -3], pushK(f, 197, 0.0025), { fov: 44 }) },
      { f: 278, cut: true, s: (f) => dolly([MX + 1.4, 1.3, 2.6], [MX + 0.9, 1.1, -3], pushK(f, 278, 0.003, 0.006, 20), { fov: 40, roll: -0.03 }) }], // "megabytes"
  4: [{ f: 326, s: (f) => dolly([MX - 0.3, 1.1, 2.0], [MX, 0.9, -3], pushK(f, 326, 0.0025), { fov: 38 }) },
      { f: 384, dur: 50, s: () => ({ pos: [MX + 0.2, 2.6, 8.5], look: [MX + 0.4, 0.7, -3], fov: 46 }) }], // "inside something too small to see": pull out
  5: [{ f: 455, s: (f) => dolly([MX, 3.2, 6], [MX, 1.0, -12], pushK(f, 455, 0.002), { fov: 52 }) }],
  6: [{ f: 535, s: (f) => dolly([MX, 4.5, 7], [MX, 0.8, -14], pushK(f, 535, 0.002), { fov: 54, roll: 0.03 }) },
      { f: 610, dur: 50, s: () => ({ pos: [MX, 15, 14], look: [MX, 0, -14], fov: 56 }) }], // "zettabytes": crane up
  7: [{ f: 664, s: (f) => dolly([SX + 0.2, 1.3, 4.2], [walkX(f) + 0.6, 1.2, -2], pushK(f, 664, 0.0018), { fov: 42, roll: -0.025 }) },
      { f: 745, cut: true, s: (f) => dolly([SX - 0.5, 1.2, 2.6], [walkX(f), 1.1, -2], pushK(f, 745, 0.003, 0.006, 20), { fov: 38, roll: 0.03 }) }], // "lunch."
  8: [{ f: 783, s: (f) => dolly([0, 1.8, 6.6], [0.1, 1.3, -2.2], pushK(f, 783, 0.002), { fov: 54 }) },
      { f: 930, cut: true, s: (f) => dolly([1.0, 1.4, 3.6], [0.7, 1.1, -2.2], pushK(f, 930, 0.0025), { fov: 42, roll: -0.03 }) }, // "petabytes"
      { f: 982, dur: 14, s: (f) => dolly([1.0, 0.9, 2.2], at(TUBE, 0, 0.7, 0), pushK(f, 982, 0.003, 0.007, 20), { fov: 36, roll: 0.04 }) }], // "gram"
  9: [{ f: 1036, s: (f) => dolly([1.2, 0.9, 1.9], [1.2, 0.8, -2.2], pushK(f, 1036, 0.0025), { fov: 38 }) }],
  10: [{ f: 1110, s: (f) => dolly([0.8, 1.4, 4.4], [0.4, 1.0, -2.2], pushK(f, 1110, 0.0022), { fov: 44 }) },
       { f: 1205, cut: true, s: (f) => dolly([0.3, 1.5, 3.4], [-0.3, 1.1, -2.2], pushK(f, 1205, 0.003, 0.006, 20), { fov: 40, roll: 0.03 }) }], // "read both back"
  11: [{ f: 1264, s: (f) => dolly([SX - 0.6, 1.0, 4.2], [SX, 0.9, -3], pushK(f, 1264, 0.002), { fov: 44 }) },
       { f: 1320, dur: 50, s: (f) => dolly([SX + 0.5, 2.0, 8], [SX, 3.2, -14], pushK(f, 1320, 0.002), { fov: 52 }) }], // "thousands of years": show the pyramid
  12: [{ f: 1377, s: (f) => dolly([-0.4, 1.4, 4.6], [-0.4, 1.0, -2.2], pushK(f, 1377, 0.002), { fov: 44, roll: -0.03 }) },
       { f: 1438, cut: true, s: (f) => dolly([-1.2, 1.4, 3.6], [-1.6, 1.1, -2.2], pushK(f, 1438, 0.003, 0.006, 20), { fov: 40, roll: 0.03 }) },
       { f: 1500, cut: true, s: (f) => dolly([-1.0, 1.4, 3.4], [-0.6, 1.2, -2.2], pushK(f, 1500, 0.003), { fov: 40, roll: -0.03 }) }], // "reading takes hours"
  13: [{ f: 1564, s: (f) => dolly([0.4, 1.3, 4.0], [0.3, 1.0, -2.2], pushK(f, 1564, 0.003), { fov: 44 }) }],
  14: [{ f: 1643, s: (f) => dolly([MX, 1.4, 6], [MX, 1.1, -3], pushK(f, 1643, 0.0025), { fov: 46 }) },
       { f: 1712, dur: 30, s: (f) => dolly([MX + 0.4, 1.4, 3.8], [MX, 1.1, -3], pushK(f, 1712, 0.003, 0.006, 20), { fov: 40, roll: 0.03 }) }], // "copy"
  15: [{ f: 1801, s: (f) => dolly([MX + 0.2, 1.3, 4.6], [MX + 0.2, 1.2, -3], pushK(f, 1801, 0.002), { fov: 42 }) },
       { f: 1866, cut: true, s: (f) => dolly([MX + 0.9, 1.2, 2.8], [MX + 0.3, 1.2, -3], pushK(f, 1866, 0.003, 0.006, 20), { fov: 38, roll: -0.03 }) }], // "vacation"
  16: [{ f: 1973, s: (f) => dolly([0.2, 1.6, 5.2], [0.2, 1.2, -2.2], pushK(f, 1973, 0.0022), { fov: 46 }) },
       { f: 2072, cut: true, s: (f) => dolly([-0.4, 1.5, 3.4], [-0.6, 1.3, -2.2], pushK(f, 2072, 0.003, 0.006, 20), { fov: 40, roll: 0.03 }) }], // "not in people"
  17: [{ f: 2111, s: (f) => dolly([SX - 0.2, 1.5, 4.6], [SX, 1.2, -2], pushK(f, 2111, 0.002), { fov: 42 }) },
       { f: 2190, dur: 30, s: (f) => dolly([SX + 0.3, 1.3, 2.4], [SX, 1.3, -2], pushK(f, 2190, 0.003, 0.006, 20), { fov: 36, roll: -0.03 }) }, // "full"
       { f: 2250, dur: 40, s: () => ({ pos: [SX + 3, 4.5, 11], look: [SX, 1.1, -2], fov: 44 }) }],
};

const KICKS: [number, number][] = [[3.24, 0.4], [5.66, 0.5], [9.43, 0.4], [33.0, 0.8], [45.6, 0.5], [60.9, 0.5], [63.0, 0.4]];
const DOF: Dof[] = [
  { f: 0, cInf: 11 }, { f: 97, cInf: 0 }, { f: 160, cInf: 9 }, { f: 197, cInf: 0 }, { f: 278, cInf: 11 }, { f: 326, cInf: 12 },
  { f: 384, cInf: 0 }, { f: 455, cInf: 0 }, { f: 664, cInf: 7 }, { f: 745, cInf: 11 }, { f: 783, cInf: 0 }, { f: 930, cInf: 9 },
  { f: 1036, cInf: 12 }, { f: 1110, cInf: 0 }, { f: 1205, cInf: 10 }, { f: 1264, cInf: 6 }, { f: 1320, cInf: 0 }, { f: 1377, cInf: 8 },
  { f: 1438, cInf: 12 }, { f: 1564, cInf: 10 }, { f: 1643, cInf: 0 }, { f: 1712, cInf: 11 }, { f: 1801, cInf: 8 }, { f: 1866, cInf: 12 },
  { f: 1973, cInf: 6 }, { f: 2072, cInf: 12 }, { f: 2111, cInf: 8 }, { f: 2190, cInf: 12 }, { f: 2250, dur: 40, cInf: 0 },
];
export const SHOTS_OF = (id: number) => SHOTS[id - 1];
export const FILM = makeFilm({ total: TOTAL, shots: SHOTS, xfade: XFADE, cams: CAMS, kicks: KICKS, dof: DOF, flashAt: 97 });
void zoom;
