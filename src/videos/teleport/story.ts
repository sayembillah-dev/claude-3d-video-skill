// Timeline of "teleport" (What if humans could teleport?): shots timed to the voice words
// (projects/teleport/voice/words.json, 84 s) plus a 3.6 s payoff tail. Five places in one world: Dave's flat with the
// booth (x 0), a 1997 optics lab (x 200), a mountain ground station (x 400), a Tokyo street at dusk (x 600) and a town
// square full of booths (x 800). Cameras only push, slide, crane and cut (no orbits: the booth is a back card plus a front
// card, and circling camera-facing cards slides them apart). The framing changes every 1.5-3 s on the word it shows.
import { FPS, V3, ShotDef, Key, Dof, Framing, makeFilm, whip, follow, clamp01, smooth, easeOut } from "../../../library/director/camera";
export { FPS, clamp01, smooth, easeOut };
export type { V3 };
export const TOTAL = 2640; // voice 84.0 s + payoff tail

// ---------------- places ----------------
export const HX = 0, LX = 200, MX = 400, TX = 600, QX = 800;
/** Dave's flat (homeOffice): the booth on the right, desk with monitor / fax, shredder by the desk */
export const BOOTH_H: V3 = [HX + 3.0, 0, -4.0];
export const MON: V3 = [HX + 0.55, 0.76, -3.85];
export const FAX: V3 = [HX - 0.6, 0.76, -3.85];
export const SHRED: V3 = [HX + 1.65, 0, -3.3];
export const CLOCK: V3 = [HX + 1.6, 0.76, -3.9];
export const PHIL: V3 = [HX - 1.7, 0, -3.0];
export const DAVE2: V3 = [HX + 1.55, 0, -3.1];
/** lab: photon from the left island to the right island */
export const EMIT: V3 = [LX - 4.4, 1.15, 0.7];
export const RECV: V3 = [LX + 4.4, 1.15, 0.7];
export const SCI1: V3 = [LX - 5.5, 0, 0.9]; // beside the islands, not behind them (the benches hide everything below the chest)
export const SCI2: V3 = [LX + 5.5, 0, 0.9];
/** photon flight (shot 3) 0..1 */
export const photonK = (f: number) => smooth((f - 300) / 55);
export const photonAt = (f: number): V3 => {
  const k = photonK(f);
  return [EMIT[0] + (RECV[0] - EMIT[0]) * k, EMIT[1] + 0.5 * Math.sin(Math.PI * k), EMIT[2]];
};
/** mountain ground station */
export const DISH: V3 = [MX, 0, 7.0];
export const satAt = (f: number): V3 => [MX + 16 - 0.12 * (f - 370), 30, 48];
export const BLAST: V3 = [MX, 0, 20];
/** Tokyo street */
export const BOOTH_T: V3 = [TX, 0, -6.2];
export const DAVE_T: V3 = [TX + 0.9, 0, -4.9];
export const BIN: V3 = [TX - 1.5, 0, -5.6];
export const DOOR: V3 = [TX + 6.5, 0, -5.4];
export const CARS: [number, number, string][] = [[TX - 6, 1.2, "#e2574c"], [TX - 1.5, 3.6, "#3b6fd1"], [TX + 3, 1.2, "#f2c230"], [TX + 8, 3.6, "#6cc2a4"], [TX + 12.5, 1.2, "#9b73d6"]];
/** town square of booths */
export const BOOTH_Q: V3 = [QX, 0, -6.5];
export const BOOTHS_Q: V3[] = [[QX - 5, 0, -7.5], [QX + 5, 0, -7.5], [QX - 9.5, 0, -9], [QX + 9.5, 0, -9]];
export const SHRED_Q: V3 = [QX + 1.5, 0, -6.0];
/** Daves printed by the jammed booth (shot 18): how many are out at frame f */
export const flood = (f: number) => (f < 2468 ? 0 : Math.min(60, Math.floor(1 + (f - 2468) / 3.2)));

// ---------------- shots ----------------
const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 120, light: "day", set: "H", sunAz: 120, sunEl: 55 },            // Dave scanned, wiped out
  { id: 2, a: 120, b: 209, light: "dusk", set: "T", sunAz: 30, sunEl: 14, rays: { n: 5, k: 0.55 } }, // a copy walks out in Tokyo
  { id: 3, a: 209, b: 370, light: "day", set: "L", sunAz: 110, sunEl: 60 },           // 1997 Austria, a photon
  { id: 4, a: 370, b: 506, light: "dusk", set: "M", sunAz: 150, sunEl: 10 },          // 2017 satellite, 1,400 km
  { id: 5, a: 506, b: 649, light: "day", set: "L", sunAz: 110, sunEl: 60 },           // only information; original destroyed
  { id: 6, a: 649, b: 795, light: "day", set: "H", sunAz: 120, sunEl: 55 },           // step one: scan the atoms
  { id: 7, a: 795, b: 982, light: "day", set: "H", sunAz: 120, sunEl: 55 },           // step two: send him (upload bar)
  { id: 8, a: 982, b: 1144, light: "day", set: "H", sunAz: 120, sunEl: 55, lightTo: { light: "dusk", a: 990, b: 1130 } }, // age of the universe
  { id: 9, a: 1144, b: 1383, light: "dusk", set: "M", sunAz: 120, sunEl: 30, lightTo: { light: "storm", a: 1150, b: 1230 } }, // pure energy, megatons
  { id: 10, a: 1383, b: 1459, light: "dusk", set: "T", sunAz: 40, sunEl: 14 },        // luckily: spare atoms
  { id: 11, a: 1459, b: 1577, light: "dusk", set: "T", sunAz: 40, sunEl: 14 },        // unluckily: zero old atoms
  { id: 12, a: 1577, b: 1706, light: "day", set: "H", sunAz: 120, sunEl: 55 },        // it's a fax / shredder
  { id: 13, a: 1706, b: 1867, light: "day", set: "H", sunAz: 150, sunEl: 25, lightTo: { light: "dusk", a: 1710, b: 1780 } }, // Parfit 1984
  { id: 14, a: 1867, b: 1979, light: "dusk", set: "H", sunAz: 150, sunEl: 20 },       // the copy remembers; the original stops
  { id: 15, a: 1979, b: 2183, light: "day", set: "Q", sunAz: 100, sunEl: 45 },        // say it works: an hour a day, cities stretch
  { id: 16, a: 2183, b: 2287, light: "day", set: "Q", sunAz: 100, sunEl: 45 },        // the whole planet
  { id: 17, a: 2287, b: 2399, light: "dusk", set: "T", sunAz: 40, sunEl: 14 },        // traffic, airports, border door
  { id: 18, a: 2399, b: TOTAL, light: "day", set: "Q", sunAz: 100, sunEl: 45 },       // shredder jams: a flood of Daves
];
const XFADE: Record<number, number | { n: number; kind: "dissolve" | "ripple" | "double" }> = {
  3: 6, 4: { n: 18, kind: "ripple" }, 5: 6, 6: 6, 9: 6, 10: 6, 12: 6, 14: { n: 24, kind: "double" }, 15: 8, 17: 6, 18: 6,
};

// ---------------- camera ----------------
const lin = (u: number) => u;
const L3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
/** a steady straight drift: pos and look slide linearly over dur frames (keeps going a little past the end) */
const drift = (f: number, dur: number, p0: V3, p1: V3, l0: V3, l1: V3, o: { fov?: number; roll?: number; cut?: boolean; blend?: number } = {}): Key =>
  ({ f, cut: o.cut, dur: o.cut ? 1 : o.blend ?? 12, s: (g): Framing => {
    const u = Math.min(1.2, Math.max(0, (g - f) / dur));
    return { pos: L3(p0, p1, u), look: L3(l0, l1, u), fov: o.fov ?? 42, roll: o.roll ?? 0 };
  } });
/** a hard cut into a straight move (push / slide / crane) */
const cut = (f: number, dur: number, p0: V3, p1: V3, l0: V3, l1: V3 = l0, fov = 42, roll = 0): Key => drift(f, dur, p0, p1, l0, l1, { fov, roll, cut: true });
const at = (p: V3, dx: number, dy: number, dz: number): V3 => [p[0] + dx, p[1] + dy, p[2] + dz];
const BH = at(BOOTH_H, 0, 1.3, 0), BT = at(BOOTH_T, 0, 1.3, 0), BQ = at(BOOTH_Q, 0, 1.3, 0);

export const DAVE_D: V3 = [HX + 1.35, 0, -3.35]; // Dave waiting beside the desk while he uploads
export const MUG: V3 = [HX + 3.15, 0, -3.3];      // where the mug lands when Dave is wiped out
const CAMS: Record<number, Key[]> = {
  1: [
    cut(0, 52, [HX + 1.3, 1.35, 0.4], [HX + 2.5, 1.35, -0.2], [HX + 1.2, 1.05, -4], at(BH, 0, -0.2, 0), 44), // slide with Dave into the booth
    cut(52, 43, at(BH, 0, 0.05, 3.4), at(BH, 0, 0.05, 2.5), BH, BH, 42),                                    // straight on: scanned
    cut(95, 25, [MUG[0] - 0.1, 0.7, -1.7], [MUG[0] - 0.1, 0.65, -2.0], [MUG[0], 0.0, -3.9], [MUG[0], -0.05, -3.9], 44), // poof, the mug drops
  ],
  2: [
    cut(120, 60, [TX - 0.8, 1.5, 1.5], [TX - 0.3, 1.45, -0.6], at(BT, 0, -0.1, 0), at(BT, 0.3, -0.1, 0), 46),
    cut(180, 29, [TX + 1.1, 1.45, -2.2], [TX + 1.9, 1.45, -2.4], [TX + 1.0, 1.25, -5.0], [TX + 1.8, 1.25, -5.0], 42), // slide with Dave
  ],
  3: [
    cut(209, 76, [LX - 4.9, 1.6, 5.6], [LX - 4.9, 1.5, 4.6], [LX - 4.6, 1.5, -2.0], [LX - 4.9, 1.4, -2.0], 46), // Austria 1997
    cut(285, 15, at(EMIT, -0.5, 0.3, 3.0), at(EMIT, -0.5, 0.3, 2.7), at(EMIT, -0.5, 0, 0), at(EMIT, -0.5, 0, 0), 44),
    follow(300, (g) => photonAt(g), [0, 0.45, 3.4], { lag: 5, lookOff: [0, 0, -1.0], fov: 46, blend: 6 }),
    cut(352, 22, at(RECV, 0.55, 0.35, 4.2), at(RECV, 0.55, 0.3, 3.7), at(RECV, 0.55, -0.1, -0.5), at(RECV, 0.55, -0.1, -0.5), 46), // celebrate
  ],
  4: [
    cut(370, 66, [MX + 0.9, 1.4, 1.0], [MX + 0.6, 1.6, 2.2], [MX + 0.6, 1.4, 7], [MX + 0.4, 1.6, 7], 48), // dish + 2017
    cut(436, 70, [MX - 1.0, 2.0, 3.0], [MX - 2.5, 9, 6], at(DISH, 0, 2.2, 0), [MX + 4, 30, 48], 50),      // crane up the beam
  ],
  5: [
    cut(506, 42, at(EMIT, -0.4, 0.35, 3.4), at(EMIT, 1.2, 0.35, 3.2), at(EMIT, -0.4, 0, 0), at(EMIT, 1.4, -0.1, 0), 46), // bits leave
    cut(548, 46, at(RECV, 0.55, 0.35, 4.2), at(RECV, 0.55, 0.3, 3.6), at(RECV, 0.55, -0.1, -0.5), at(RECV, 0.55, -0.1, -0.5), 46),          // a copy appears
    cut(594, 55, at(EMIT, -0.55, 0.35, 4.2), at(EMIT, -0.55, 0.3, 3.6), at(EMIT, -0.55, -0.1, -0.5), at(EMIT, -0.55, -0.1, -0.5), 46),                // the original pops
  ],
  6: [
    cut(649, 71, at(BH, 0, 0.05, 4.4), at(BH, 0, 0.05, 2.9), BH, BH, 42),
    cut(720, 75, at(BH, 0, -0.3, 2.6), at(BH, 0, 0.1, 2.1), at(BH, 0, 0.1, 0), at(BH, 0, 0.3, 0), 44), // atoms multiply
  ],
  7: [
    cut(795, 32, at(BH, 0, 0.05, 2.8), at(BH, 0, 0.05, 2.4), BH, BH, 42),                               // send him: glow
    whip(827, { pos: [HX + 0.95, 1.35, -0.6], look: [HX + 0.95, 1.05, -3.8], fov: 42 }, 8),
    drift(835, 70, [HX + 1.0, 1.35, -0.2], [HX + 0.8, 1.3, -1.0], [HX + 1.0, 1.1, -3.8], [HX + 0.85, 1.1, -3.8], { fov: 42, blend: 2 }),
    cut(905, 77, [DAVE_D[0] - 0.2, 1.45, -0.9], [DAVE_D[0] - 0.25, 1.4, -1.5], [DAVE_D[0] - 0.3, 1.2, -3.7], [DAVE_D[0] - 0.25, 1.2, -3.7], 42), // Dave and the bar, closer
  ],
  8: [
    cut(982, 58, [HX - 1.2, 1.9, -3.7], [HX - 1.2, 1.9, -4.3], [HX - 1.2, 1.95, -5.85], [HX - 1.2, 1.95, -5.85], 42), // YEAR rolling
    cut(1040, 50, at(MON, 0, 0.3, 1.5), at(MON, 0, 0.3, 1.1), at(MON, 0, 0.2, 0), at(MON, 0, 0.2, 0), 40),            // the bar
    cut(1090, 54, [HX + 1.35, 1.35, -0.9], [HX + 1.3, 1.35, -1.4], [HX + 1.45, 1.0, -3.8], [HX + 1.4, 1.0, -3.8], 42), // asleep + clock
  ],
  9: [
    cut(1144, 118, [MX, 1.2, 9.0], [MX, 1.6, 12.0], [MX, 3.0, 20], [MX, 3.6, 20], 50), // energy gathers
    whip(1262, { pos: [MX + 1, 3, 4], look: at(BLAST, 0, 4, 0), fov: 54, roll: 0.06 }, 6),
    drift(1268, 115, [MX + 1, 3, 4], [MX - 1, 7, -2], at(BLAST, 0, 4, 0), at(BLAST, 0, 2, 4), { fov: 54, blend: 2 }),
  ],
  10: [
    cut(1383, 76, [TX - 0.75, 1.4, -0.6], [TX - 0.75, 1.4, -1.5], [TX - 0.75, 1.0, -6.0], [TX - 0.75, 1.05, -6.0], 46),
  ],
  11: [
    cut(1459, 118, at(DAVE_T, 0, 1.5, 2.9), at(DAVE_T, 0, 1.5, 2.4), at(DAVE_T, 0, 1.4, 0), at(DAVE_T, 0, 1.45, 0), 40),
  ],
  12: [
    cut(1577, 73, at(FAX, 0, 0.45, 1.5), at(FAX, 0, 0.4, 1.1), at(FAX, 0, 0.25, 0), at(FAX, 0, 0.25, 0), 40),
    whip(1650, { pos: at(SHRED, 0, 0.95, 1.8), look: at(SHRED, 0, 0.55, 0), fov: 42 }, 7),
    drift(1657, 49, at(SHRED, 0, 0.95, 1.8), at(SHRED, 0, 0.85, 1.4), at(SHRED, 0, 0.55, 0), at(SHRED, 0, 0.5, 0), { fov: 42, blend: 2 }),
  ],
  13: [
    cut(1706, 70, [PHIL[0] - 0.9, 1.4, 0.4], [PHIL[0] + 0.1, 1.4, -0.3], [PHIL[0] - 0.4, 1.4, -4], [PHIL[0] - 0.2, 1.35, -4], 42),
    cut(1776, 44, [PHIL[0] - 0.5, 1.95, -3.9], [PHIL[0] - 0.5, 1.95, -4.5], [PHIL[0] - 0.5, 1.95, -5.85], [PHIL[0] - 0.5, 1.95, -5.85], 42), // 1984
    cut(1820, 47, at(PHIL, 0.1, 1.5, 2.6), at(PHIL, 0.1, 1.5, 1.9), at(PHIL, 0, 1.45, 0), at(PHIL, 0, 1.45, 0), 40),                 // is it really you?
  ],
  14: [
    cut(1867, 51, at(DAVE2, -0.3, 1.4, 3.0), at(DAVE2, 0.1, 1.4, 2.0), at(DAVE2, -0.2, 1.3, 0), at(DAVE2, 0, 1.3, 0), 40), // the copy grins
    cut(1918, 61, [BOOTH_H[0] + 0.1, 0.9, -0.5], [BOOTH_H[0] + 0.1, 0.85, -0.9], [BOOTH_H[0], 0.25, -4], [BOOTH_H[0], 0.2, -4], 46), // the original stops; the mug
  ],
  15: [
    drift(1975, 110, [QX + 3, 1.6, 9], [QX - 1, 2.6, 4], at(BQ, 0, -0.2, 0), at(BQ, 0, 0, 0), { fov: 46 }),
    drift(2085, 100, [QX - 1, 2.6, 4], [QX + 2, 13, 13], at(BQ, 0, 0, 0), [QX, 0, -9], { fov: 50, blend: 18 }),
  ],
  16: [
    drift(2183, 104, [QX + 2, 13, 13], [QX - 6, 30, 30], [QX, 0, -9], [QX, 0, -12], { fov: 52, blend: 6 }),
  ],
  17: [
    cut(2287, 27, [TX + 0.3, 2.6, 10.5], [TX + 1.3, 2.6, 10.5], [TX + 0.3, 0.6, 2.4], [TX + 1.3, 0.6, 2.4], 50),     // traffic vanishes
    cut(2314, 37, [TX - 2, 1.5, 9], [TX - 1.4, 1.6, 9], [TX - 2, 5.0, 0], [TX - 1.4, 5.4, 0], 50),       // airports: the empty plane
    cut(2351, 48, at(DOOR, 0, 1.5, 3.6), at(DOOR, 0, 1.5, 3.0), at(DOOR, 0, 1.3, 0), at(DOOR, 0, 1.3, 0), 44), // border door
  ],
  18: [
    drift(2395, 75, at(SHRED_Q, 1.5, 1.2, 3.0), at(SHRED_Q, -0.5, 1.3, 3.6), at(SHRED_Q, 0, 0.7, 0), at(BQ, 0.3, -0.2, 0), { fov: 42 }),
    drift(2470, 170, [QX + 1.5, 1.6, -1.5], [QX - 2, 9, 16], at(BQ, 0, 0, 0), [QX, 0.8, -3], { fov: 50, blend: 8 }),
  ],
};
const KICKS: [number, number][] = [[3.18, 0.7], [5.68, 0.4], [19.84, 0.6], [42.18, 1.2], [44.28, 0.8], [50.58, 0.5], [65.1, 0.5], [79.3, 0.5], [81.42, 0.8], [83.36, 0.7], [85.2, 0.6]];
const DOF: Dof[] = [
  { f: 0, cInf: 9 }, { f: 120, cInf: 6 }, { f: 209, cInf: 4 }, { f: 285, cInf: 8 }, { f: 370, cInf: 0 }, { f: 506, cInf: 6 },
  { f: 649, cInf: 9 }, { f: 795, cInf: 11 }, { f: 982, cInf: 7 }, { f: 1144, cInf: 0 }, { f: 1383, cInf: 7 }, { f: 1459, cInf: 13 },
  { f: 1577, cInf: 10 }, { f: 1706, cInf: 10 }, { f: 1867, cInf: 12 }, { f: 1918, cInf: 7 }, { f: 1979, cInf: 4 }, { f: 2085, dur: 40, cInf: 0 },
  { f: 2287, cInf: 3 }, { f: 2399, cInf: 10 }, { f: 2470, dur: 40, cInf: 2 },
];
const SPEED = [{ a: 95, b: 104, k: 0.6 }, { a: 827, b: 835, k: 0.6 }, { a: 1258, b: 1290 }, { a: 1650, b: 1657, k: 0.5 }, { a: 2462, b: 2500 }];
export const SHOTS_OF = (id: number) => SHOTS[id - 1];
export const FILM = makeFilm({ total: TOTAL, shots: SHOTS, xfade: XFADE, cams: CAMS, kicks: KICKS, dof: DOF, flashAt: 1265, speedLines: SPEED });
