// Timeline of "sleep-experiment" (The Russian Sleep Experiment, a creepypasta retold): 17 shots timed to the voice words
// (projects/sleep-experiment/voice/words.json, 74.0 s) plus a 1.5 s hold after "tight". Three places in one world: the
// sealed test chamber (x 0), the observation room (x 100) and a child's bedroom at night (x 200). Cameras push, glide,
// crane and cut; no orbits, no whips. One flash (the gunshot). Gore is never on screen (see SHOTPLAN.md).
import { FPS, V3, ShotDef, Key, Dof, Framing, makeFilm, closeUp, clamp01, smooth, easeOut } from "../../../library/director/camera";
import { CHAMBER, CONTROL, BEDROOM } from "../../../library/sets/interiors";
export { FPS, clamp01, smooth, easeOut };
export type { V3 };
export const TOTAL = 2280;

// ---------------- places ----------------
export const CX = 0, RX = 100, BX = 200;
const w = (p: V3, x: number): V3 => [p[0] + x, p[1], p[2]];
export const VENT = CHAMBER.vents[1], VENT_L = CHAMBER.vents[0], PORT_L = CHAMBER.ports[0], DOOR = CHAMBER.door;
export const CLOCK = CHAMBER.clock, CAL = CHAMBER.calendar, MIC_R = CHAMBER.mics[1], TINS = CHAMBER.tins, DRAIN = CHAMBER.drain;
/** the five prisoners (standing spots in the middle of the chamber; the vertical frame is narrow) */
export const P: V3[] = [[-1.3, 0, -2.6], [-0.65, 0, -2.0], [0, 0, -2.8], [0.65, 0, -2.1], [1.3, 0, -2.7]];
/** shot 4: the whisperer at the right-wall grille, an informer behind him */
export const WHISPER: V3 = [4.3, 0, -1.75], INFORMER: V3 = [3.3, 0, -3.7];
/** v3 restaging: the whisperer's close-up, the two informers, the rope insert, the heads-down three, the page tearers */
export const W4: V3 = [0.6, 0, -5.2], BETRAY: V3[] = [[-0.68, 0, -4.7], [0.68, 0, -4.7]], ROPE: V3 = [3.4, 0, -5.55];
export const BOWED: V3[] = [[-0.95, 0, -4.6], [0.05, 0, -4.95], [1.0, 0, -4.6]], HOARSE: V3 = [0.55, 0, -5.55];
export const TEAR: V3[] = [[-0.45, 0, -4.45], [0.45, 0, -4.45]];
/** shots 5-6: the screamer's laps (x along the room) and the two calm readers by the left porthole */
export const screamerAt = (f: number): V3 => { const u = (f - 491) / 60; return [1.6 * Math.sin(u * 1.4), 0, -2.6 + 0.5 * Math.cos(u * 0.9)]; };
export const READ: V3[] = [[-2.85, 0, -4.7], [-1.75, 0, -4.9]];
export const READ5: V3[] = [[-1.25, 0, -4.4], [-0.4, 0, -4.9]]; // shot 5: in the locked-off frame
export const PASTE: V3[] = [[-2.75, 0, -5.35], [-1.85, 0, -5.4]];
/** control room: the listener at the porthole, the mic spot, the commander and two soldiers */
export const LISTEN: V3 = w([0.15, 0, -2.75], RX), ATMIC: V3 = w([-0.85, 0, -2.6], RX);
export const CMDR_R: V3 = w([0.55, 0, -2.25], RX), SOLD_R: V3[] = [w([1.35, 0, -2.05], RX), w([-1.75, 0, -2.2], RX)];
export const DIAL: V3 = w(CONTROL.dial, RX), RPORT: V3 = w(CONTROL.port, RX), RMIC: V3 = w(CONTROL.mic, RX);
/** chamber after the door opens: soldiers in the corridor, the gaunt four by the tins, the last one */
export const CORR: V3[] = [[0.05, 0, -6.9], [0.3, 0, -7.9]];
export const GAUNT: V3[] = [[-2.85, 0, -4.3], [-2.25, 0, -3.8], [-1.15, 0, -3.95], [-0.55, 0, -4.45]];
export const SHEET: V3 = [-0.15, 0.05, -2.7];
export const CMDR_C: V3 = [0.95, 0, -3.3], SCI_C: V3 = [-0.35, 0, -3.5], LAST: V3 = [0.8, 0, -4.7];
export const GUARD_C: V3[] = [[-1.2, 0, -3.9], [1.9, 0, -3.9]];
export const CAP_AT = (f: number): V3 => { const u = clamp01((f - 1915) / 45); return [1.0 - 0.5 * easeOut(u), 0.06, -2.95 + 0.1 * u]; };
/** bedroom */
export const KIDP: V3 = w([BEDROOM.bed[0], 0.38, BEDROOM.bed[2] - 0.75], BX), UNDER: V3 = w([BEDROOM.under[0] + 0.2, 0.14, BEDROOM.bed[2] + 1.0], BX), LAMP: V3 = w(BEDROOM.lamp, BX);

// ---------------- shots ----------------
const ROOM = { sunAz: 165, sunEl: 62 }, OBS = { sunAz: 160, sunEl: 55 };
// v3: one action per shot, each with a visual that does what the line says (whispering at the mic, pointing at each
// other, a rope snapping for the torn voice, heads bowed, pages torn and pasted, the warning spoken into the mic)
const SH: [number, number, "C" | "R" | "B"][] = [
  [0, 91, "R"],      // 1  HOOK: the face in the gas presses its hands on the glass
  [91, 200, "C"],    // 2  gas pours on five prisoners; eyes snap wide
  [200, 360, "C"],   // 3  30 DAYS at the glass, calendar flips 1-4
  [360, 430, "C"],   // 4  CU: a mouth whispering into the grille
  [430, 491, "C"],   // 5  two informers point at each other from their grilles
  [491, 612, "C"],   // 6  day 9: clutching his head, screaming, staggering
  [612, 658, "C"],   // 7  insert: a rope frays and snaps (his voice tears)
  [658, 718, "C"],   // 8  the others sit, heads bowed, hugging their knees
  [718, 790, "C"],   // 9  two of them tear pages out of their books
  [790, 875, "R"],   // 10 through the glass: smearing and pasting the pages until it is covered
  [875, 1141, "R"],  // 11 silence -> BANG; the O2 needle pins
  [1141, 1194, "R"], // 12 day 14: the scientist steps to the mic, soldiers behind
  [1194, 1248, "R"], // 13 CU: "we're coming in" spoken into the mic
  [1248, 1294, "R"], // 14 CU: the speaker crackles
  [1294, 1352, "R"], // 15 the calm voice; the scientist freezes, a cigarette drops
  [1352, 1436, "C"], // 16 the door opens, soldiers recoil
  [1436, 1550, "C"], // 17 flooded floor, the drain, the sheet
  [1550, 1711, "C"], // 18 they reach for the vent, begging
  [1711, 1854, "C"], // 19 sealed in again
  [1854, 1982, "C"], // 20 the pistol, the cap
  [1982, 2058, "C"], // 21 "what are you?" it smiles (snap-in)
  [2058, 2180, "C"], // 22 the grin, lights die
  [2180, TOTAL, "B"], // 23 sleep tight; the eyes lunge
];
const SHOTS: ShotDef[] = SH.map(([a, b, set], i) => ({ id: i + 1, a, b, set, light: set === "B" ? "night" : "dread", ...(set === "B" ? { sunAz: 150, sunEl: 35 } : set === "R" ? OBS : ROOM) }));
export const SHOT_STARTS = SH.map(([a]) => a);
const XFADE: Record<number, number | { n: number; kind: "dissolve" | "ripple" | "double" }> = { 23: { n: 26, kind: "double" } };

// ---------------- camera ----------------
const L3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
/** a slow eased move: pos and look travel p0 -> p1 / l0 -> l1 over dur frames, then keep creeping */
/** motion-gate pass: every move travels AMP x its written distance, plus a sideways truck of TRUCK m (alternating
 *  sides) for parallax, near-linear so the frame never settles into a still */
const AMP = 2.2, TRUCK = 0.45;
let side = 1;
const move = (f: number, dur: number, p0: V3, p1: V3, l0: V3, l1: V3, o: { fov?: number; roll?: number; cut?: boolean; blend?: number; truck?: number; amp?: number } = {}): Key => {
  const P1 = L3(p0, p1, o.amp ?? AMP), Lk1 = L3(l0, l1, o.amp ?? AMP), dx = l0[0] - p0[0], dz = l0[2] - p0[2], dl = Math.hypot(dx, dz) || 1;
  const tr = (o.truck ?? TRUCK) * (side = -side), rx = (-dz / dl) * tr, rz = (dx / dl) * tr;
  return { f, cut: o.cut, dur: o.cut ? 1 : o.blend ?? 12, s: (g): Framing => {
    const u = clamp01((g - f) / dur), k = smooth(u) * 0.35 + 0.65 * u, m = k - 0.5;
    const pos = L3(p0, P1, k), look = L3(l0, Lk1, k);
    return { pos: [pos[0] + rx * m, pos[1], pos[2] + rz * m], look: [look[0] + rx * m * 0.4, look[1], look[2] + rz * m * 0.4], fov: o.fov ?? 42, roll: o.roll ?? 0 };
  } };
};
const cut = (f: number, dur: number, p0: V3, p1: V3, l0: V3, l1: V3 = l0, fov = 42, roll = 0, amp?: number): Key => move(f, dur, p0, p1, l0, l1, { fov, roll, cut: true, amp });
const at = (p: V3, dx: number, dy: number, dz: number): V3 => [p[0] + dx, p[1] + dy, p[2] + dz];

const HEAD = (p: V3, dy = 1.45): V3 => [p[0], p[1] + dy, p[2]];
const CAMS: Record<number, Key[]> = {
  1: [cut(0, 91, at(RPORT, 0.08, -0.02, 3.3), at(RPORT, 0, 0, 2.0), RPORT, at(RPORT, 0, 0.02, 0), 40, 0.04, 1)],
  2: [
    cut(91, 66, [0.2, 3.25, 0.6], [0.1, 3.0, -0.2], [0, 0.6, -2.6], [0, 0.7, -2.6], 52, -0.06, 1),
    closeUp(157, HEAD(P[2]), { fill: 0.48, fov: 34, rate: 0.008, cut: true, roll: 0.05 }),
  ],
  3: [cut(200, 160, [-1.35, 1.7, -1.9], [-1.45, 1.72, -2.4], [-1.95, 1.65, -5.9], [-1.85, 1.8, -5.9], 46, 0, 1)],
  4: [closeUp(360, HEAD(W4, 1.42), { fill: 0.4, dir: [0.35, 0.02, 1], fov: 34, rate: 0.006, cut: true, roll: 0.04 })],
  5: [cut(430, 61, [0, 1.45, -0.2], [0, 1.43, -0.7], [0, 1.2, -4.7], [0, 1.22, -4.7], 50, 0, 1)],
  6: [{ f: 491, cut: true, dur: 1, s: (g): Framing => { const p = screamerAt(g); return { pos: [p[0] * 0.75, 1.5, 1.4 - 0.004 * (g - 491)], look: [p[0] * 0.9, 1.25, p[2]], fov: 44, roll: 0.05 * Math.sin(g / 9) }; } }],
  7: [cut(612, 46, at(ROPE, 0, 1.15, 1.3), at(ROPE, 0, 1.15, 0.95), at(ROPE, 0, 1.15, 0), at(ROPE, 0, 1.15, 0), 40, 0, 1)],
  8: [cut(658, 60, [0, 1.25, -1.5], [0, 1.2, -2.0], [0, 0.75, -4.8], [0, 0.75, -4.8], 46, 0, 1)],
  9: [cut(718, 72, [0, 1.25, -1.9], [0, 1.22, -2.3], [0, 1.0, -4.45], [0, 1.0, -4.45], 44, 0, 1)],
  10: [cut(790, 85, at(RPORT, -0.05, -0.02, 2.6), at(RPORT, 0, 0, 1.9), RPORT, RPORT, 40, -0.03, 1)],
  11: [
    cut(875, 150, at(LISTEN, 1.5, 1.55, 2.6), at(LISTEN, 1.0, 1.55, 1.9), at(LISTEN, -0.2, 1.55, -1.0), at(LISTEN, -0.2, 1.6, -1.0), 42),
    move(1028, 113, at(DIAL, 0.02, 0.08, 1.15), at(DIAL, 0.02, 0.04, 0.85), at(DIAL, 0, 0, 0), at(DIAL, 0, 0, 0), { fov: 40, blend: 24, amp: 1.2 }),
  ],
  12: [cut(1141, 53, at(ATMIC, 0.75, 1.6, 4.4), at(ATMIC, 0.7, 1.6, 3.9), at(ATMIC, 0.75, 1.3, -0.4), at(ATMIC, 0.7, 1.35, -0.4), 54)],
  13: [closeUp(1194, HEAD(ATMIC, 1.38), { fill: 0.5, dir: [0.3, 0.02, 1], fov: 34, rate: 0.006, cut: true })],
  14: [cut(1248, 46, at(RMIC, -0.55, 0.55, 1.35), at(RMIC, -0.55, 0.55, 1.0), at(RMIC, -0.55, 0.55, 0.5), at(RMIC, -0.55, 0.55, 0.5), 38, 0, 1)],
  15: [closeUp(1294, HEAD(ATMIC, 1.45), { fill: 0.34, dir: [0.25, 0.08, 1], fov: 34, rate: 0.006, cut: true })],
  16: [cut(1352, 84, [0.2, 1.45, -2.0], [0.15, 1.4, -2.7], [0, 1.3, -6.5], [0, 1.35, -6.5], 44)],
  17: [cut(1436, 114, [0.5, 0.5, 1.4], [0.25, 0.42, 0.0], [0.1, 0.12, -2.4], [0.0, 0.1, -2.6], 46, 0, 1.3)],
  18: [cut(1550, 161, [-1.55, 0.75, -1.3], [-1.4, 1.95, -1.1], [-1.8, 0.85, -5.0], [-2.0, 2.1, -5.6], 46, 0, 1)],
  19: [cut(1711, 143, [0.35, 1.5, 0.6], [0.05, 1.5, -0.4], [0.3, 1.3, -3.6], [-0.1, 1.35, -3.6], 44, -0.08)],
  20: [
    cut(1854, 58, at(SCI_C, 0.3, 1.2, 1.25), at(SCI_C, 0.25, 1.2, 1.0), at(SCI_C, 0.25, 1.05, 0.2), at(SCI_C, 0.25, 1.1, 0.2), 40),
    { f: 1912, cut: true, dur: 1, s: (g): Framing => { const c = CAP_AT(g), u = clamp01((g - 1912) / 70); return { pos: [c[0] + 0.1, 0.42 - 0.04 * u, c[2] + 1.25 - 0.2 * u], look: [c[0], 0.1, c[2]], fov: 42, roll: 0 }; } },
  ],
  21: [
    cut(1982, 58, [-0.75, 1.55, -1.7], [-0.6, 1.55, -2.2], at(LAST, -0.05, 1.45, 0), at(LAST, 0, 1.5, 0), 42, 0.06),
    closeUp(2040, at(LAST, 0, 1.45, 0), { fill: 0.4, fov: 36, rate: 0.01, cut: true, roll: -0.05 }),
  ],
  22: [closeUp(2058, at(LAST, 0, 1.5, 0), { fill: 0.5, fov: 32, rate: 0.011, cut: true })],
  23: [cut(2180, 100, at(KIDP, 0.25, 0.75, 3.7), at(KIDP, 0.15, 0.7, 3.1), at(KIDP, 0, 0.05, 0.9), at(KIDP, 0, 0.05, 1.0), 44)],
};
const KICKS: [number, number][] = [[66 / FPS, 1.0], [157 / FPS, 0.5], [936 / FPS, 1.0], [1223 / FPS, 0.3], [1409 / FPS, 0.9], [1822 / FPS, 0.6], [1903 / FPS, 1.1], [2040 / FPS, 0.5], [2189 / FPS, 0.2], [2250 / FPS, 0.9]];
const DOF: Dof[] = [
  { f: 0, cInf: 6 }, { f: 91, cInf: 3 }, { f: 157, cInf: 14 }, { f: 200, cInf: 8 }, { f: 360, cInf: 15 }, { f: 430, cInf: 8 }, { f: 491, cInf: 5 }, { f: 612, cInf: 14 }, { f: 658, cInf: 8 }, { f: 718, cInf: 9 }, { f: 790, cInf: 6 },
  { f: 875, cInf: 9 }, { f: 1028, dur: 24, cInf: 12 }, { f: 1141, cInf: 7 }, { f: 1194, cInf: 14 }, { f: 1248, cInf: 12 }, { f: 1294, cInf: 14 }, { f: 1352, cInf: 6 },
  { f: 1436, cInf: 9 }, { f: 1550, cInf: 6 }, { f: 1711, cInf: 7 }, { f: 1854, cInf: 12 }, { f: 1912, cInf: 10 },
  { f: 1982, cInf: 10 }, { f: 2040, cInf: 14 }, { f: 2058, cInf: 15 }, { f: 2180, cInf: 7 },
];
export const SHOTS_OF = (id: number) => SHOTS[id - 1];
export const FILM = makeFilm({ total: TOTAL, shots: SHOTS, xfade: XFADE, cams: CAMS, kicks: KICKS, dof: DOF, flashAt: 1903 });
