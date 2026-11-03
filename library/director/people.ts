// Character staging (reference study 2026-11-03: faces fill half the frame, figures break into the frame, crowds of
// 3-5, foreground occluders for depth). Screen-placed helpers need the full CamInfo that world.ts passes to stage().
//   screenAt(cam, sx, sy, d): world point at frame fraction (sx, sy) (0..1, y down) and depth d metres.
//   foreground: a blurred near shape at the frame edge (over-the-shoulder, leaves, post); give the shot a focus far
//               behind it so the DOF softens it.
//   leanIn: a character breaking in from the left / right / top edge, tilted, sliding in with k.
//   crowd: 3-6 townsfolk in jittered rows with varied outfits, expressions and heights.
// Close-up framing is a camera key: closeUp() in camera.ts.
import * as THREE from "three";
import { Stage, CamInfo, person, FRONT, lidAt, blob, card, q } from "./stage";
import { Pen, Outfit, FrontOpts, Expr, SideOpts, townsfolk } from "../engine/toon";

const smooth = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
/** card centre height above its feet (BODY plane: 1000 units tall, soles at 975), per unit scale */
const CARD_MID = (975 - 500) * 0.00216, CARD_W = 600 * 0.00216, HEAD_Y = 1.5;

export const screenAt = (cam: CamInfo, sx: number, sy: number, d: number) => {
  if (!cam.up || !cam.fwd) throw new Error("screenAt needs the CamInfo from world.ts (up / fwd / fov / aspect)");
  const th = Math.tan(((cam.fov ?? 40) * Math.PI) / 360) * d, tw = th * (cam.aspect ?? 9 / 16);
  return cam.pos.clone().addScaledVector(cam.fwd, d).addScaledVector(cam.right, (sx * 2 - 1) * tw).addScaledVector(cam.up, (1 - sy * 2) * th);
};
/** frame width in metres at depth d */
const frameW = (cam: CamInfo, d: number) => 2 * Math.tan(((cam.fov ?? 40) * Math.PI) / 360) * d * (cam.aspect ?? 9 / 16);

type FgKind = "shoulder" | "leaves" | "post";
const drawFg = (kind: FgKind, col: string, hair: string) => (p: Pen) => {
  if (kind === "shoulder") {
    p.ell(300, 1000, 300, 250, col, 10);
    p.ell(300, 600, 160, 180, hair, 10);
  } else if (kind === "leaves") {
    for (let i = 0; i < 11; i++) {
      const a = -1.2 + i * 0.26, r = 260 + 160 * ((i * 0.618) % 1), cx = 300 + Math.cos(a) * r * 0.5, cy = 520 + Math.sin(a) * r;
      p.ell(cx, cy, 120, 52, ["#4f8f3f", "#5e9e48", "#3f7a35"][i % 3], 8, 0, 360, (a * 180) / Math.PI + 30);
    }
  } else {
    p.poly([[220, 0], [380, 0], [380, 1000], [220, 1000]], col, 10);
    for (let i = 0; i < 6; i++) p.stroke([[245 + i * 22, 40 + i * 90], [250 + i * 22, 320 + i * 90]], 5, "rgba(60,30,10,0.4)");
    p.poly([[205, 380], [395, 380], [395, 430], [205, 430]], "#7a5232", 8);
  }
};
/** a soft foreground shape at the frame edge: cover = fraction of the frame width it spans */
export const foreground = (cam: CamInfo, out: Stage, kind: FgKind, o: { side?: "left" | "right"; d?: number; cover?: number; col?: string; hair?: string; sy?: number } = {}) => {
  const side = o.side ?? "left", d = o.d ?? 1.1, cover = o.cover ?? (kind === "post" ? 0.5 : kind === "leaves" ? 1 : 0.65);
  const sx = side === "left" ? (kind === "post" ? 0.06 : 0.1) : kind === "post" ? 0.94 : 0.9, sy = o.sy ?? (kind === "shoulder" ? 0.72 : kind === "leaves" ? 0.3 : 0.5);
  const scale = (cover * frameW(cam, d)) / CARD_W, c = screenAt(cam, sx, sy, d);
  const col = o.col ?? (kind === "post" ? "#8a5a36" : "#3b3f52"), hair = o.hair ?? "#4a3426";
  card(cam, out, `fg|${kind}|${col}|${hair}`, c.x, c.y - CARD_MID * scale, c.z, scale, (p) => drawFg(kind, col, hair)(p), { shadow: false, mirror: side === "right" });
};

/** a character breaking into the frame from an edge, head at ~18 % in from it, body tilted out of frame.
 *  k = 0..1 slides in from fully outside; d = depth of the head (m). */
export const leanIn = (cam: CamInfo, out: Stage, i: number, o: Outfit, okey: string, t: number, opts: { edge?: "left" | "right" | "top"; k?: number; d?: number; fo?: FrontOpts; scale?: number } = {}) => {
  const edge = opts.edge ?? "left", k = smooth(opts.k ?? 1), d = opts.d ?? 1.8, sc = opts.scale ?? 1;
  const [tx, ty, ox, oy, roll] = edge === "left" ? [0.2, 0.42, -0.25, 0.42, -0.95] : edge === "right" ? [0.8, 0.42, 1.25, 0.42, 0.95] : [0.5, 0.2, 0.5, -0.25, Math.PI * 0.86];
  const h = screenAt(cam, ox + (tx - ox) * k, oy + (ty - oy) * k, d);
  const yaw = Math.atan2(cam.pos.x - h.x, cam.pos.z - h.z), R = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const up = R.multiplyScalar(-Math.sin(roll)).add(new THREE.Vector3(0, Math.cos(roll), 0));
  const feet = h.addScaledVector(up, -HEAD_Y * sc);
  const pl = person(cam, { i, o, okey }, feet.x, feet.y, feet.z, FRONT, { blink: lidAt(t, i), mode: "stand", expr: "shock" as Expr, ...opts.fo }, {} as SideOpts, sc);
  out.places.push({ ...pl, yaw, roll });
};

/** a small crowd: n townsfolk around (x, z) in `rows` jittered rows, facing the camera */
export const crowd = (cam: CamInfo, out: Stage, t: number, o: { x: number; z: number; y?: number; n?: number; rows?: number; spacing?: number; seed?: number; i0?: number;
  outfits?: Outfit[]; expr?: Expr[]; fo?: FrontOpts; shadow?: boolean } ) => {
  const n = o.n ?? 5, rows = o.rows ?? (n > 4 ? 2 : 1), sp = o.spacing ?? 0.75, seed = o.seed ?? 0, i0 = o.i0 ?? 20, y = o.y ?? 0;
  const per = Math.ceil(n / rows), ex = o.expr ?? ["neutral", "grin", "nervous", "smile", "stern"];
  for (let j = 0; j < n; j++) {
    const r = Math.floor(j / per), c = j % per, cnt = Math.min(per, n - r * per);
    const hx = (Math.sin((j + seed) * 12.9898) * 43758.5453) % 1, hz = (Math.sin((j + seed) * 78.233) * 43758.5453) % 1;
    const px = o.x + (c - (cnt - 1) / 2) * sp + (r % 2 ? sp / 2 : 0) + hx * 0.12, pz = o.z - r * 0.85 + hz * 0.15;
    const sc = q(0.93 + 0.12 * Math.abs(hx), 20), outfit = o.outfits?.[j % o.outfits.length] ?? townsfolk(seed * 7 + j);
    out.places.push(person(cam, { i: i0 + j, o: outfit, okey: `crowd${seed}_${j}` }, px, y, pz, FRONT,
      { blink: lidAt(t, i0 + j), mode: "stand", expr: ex[(j + seed) % ex.length], seed: i0 + j, ...o.fo }, {} as SideOpts, sc));
    if (o.shadow !== false) blob(out, px, y, pz, sc);
  }
};
