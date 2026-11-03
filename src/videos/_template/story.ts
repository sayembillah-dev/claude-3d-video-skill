// TEMPLATE: copy this folder to src/videos/<name>/ and fill it from YOUR script. It holds only the contract (see
// library/API.md): no scenes, characters or beats of any finished video. Choose places, staging and camera from the
// script's own visual ideas first; open a finished video only to see how one specific technique was done.
// Timeline = data: shots timed to projects/<name>/voice/words.json (frames = seconds x 30), camera keys, kicks, lens.
import { FPS, V3, ShotDef, Key, Dof, makeFilm, pushK, dolly, zoom, at, smooth, easeOut, clamp01 } from "../../../library/director/camera";
export { FPS, clamp01, smooth, easeOut };
export type { V3 };
export const TOTAL = 90; // voice length in frames + a short tail (align_words.py prints it)

/** one x offset per place keeps their ground planes apart (place key -> x in index.tsx) */
export const AX = 0;
export const HERO: V3 = [AX, 0, -3];

// light: "day" | "golden"; set = a key of PRODUCTION.places; sunAz/sunEl are camera-relative degrees
const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 90, light: "day", set: "A", sunAz: 110 }, // hook
];
const XFADE: Record<number, number> = {}; // crossfade frames into a shot at place changes: { 2: 8 }

// camera: big reframes are cuts, glides 18-60 f, every hold creeps (pushK), punch words get a small punch
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (f) => dolly([0, 1.6, 4.5], at(HERO, 0, 1.2, 0), pushK(f, 0, 0.0025, 0.006, 30), { fov: 42 }) }],
};
const KICKS: [number, number][] = []; // [timeSeconds, strength] impact shakes
const DOF: Dof[] = [{ f: 0, cInf: 10 }]; // blur px at 1080 wide: close-ups 12-16, medium 9-12, wide 0
export const SHOTS_OF = (id: number) => SHOTS[id - 1];
export const FILM = makeFilm({ total: TOTAL, shots: SHOTS, xfade: XFADE, cams: CAMS, kicks: KICKS, dof: DOF });
void zoom;
