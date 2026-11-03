// Our cast as lit flat sprites in the 3D world (from the bridge short's cast.ts): each frame every character asks for a
// drawing (a key + a draw call); the pool keeps one canvas per distinct drawing, so a crowd of hens shares a handful of
// canvases. Characters are yaw-only billboards shaded by cardShade() with a soft multiply contact blob; effects are
// unlit cards. Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import { Pen, bodyFront, townsfolk, fxBurst, fxStars, fxShadow, fxContact, fxPuff, Outfit, Expr, FrontOpts, SideOpts, bodySide, SKINS, INK } from "../../../library/engine/toon";
import { monkey, hen, rat, cat, tripod, paperStack, dock, chair, CritterOpts } from "../../../library/cast/critters";
import { easelSelfie } from "./props";
import { PHOTOG, LAWYER, JUDGE, MJ, MLAW } from "../../../library/cast/outfits";
import {
  FPS, SHOTS, V3, clamp01, smooth, WITNESS, MAN_T, MONK_T, LAWYER_T, EASEL_C, JUDGES, CRATES, TRIPOD, MONK_J, MAN_J, MONK_STEP,
  MJUDGE, MLAWYER, DOCK, CATWALL, EX, climbZ, stepY, monkJX, stackK, pop,
} from "./story";
import { NOINK } from "../../../library/engine/ink";
import { cardShade, blobMaterial, CARD_K } from "../../../library/engine/cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};
// ---------------- our cast ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
const FRONT = { side: false, mirror: false };
const SIZE = { monkey: 0.45, hen: 0.25, rat: 0.14, cat: 0.23 };

const human = (cam: CamInfo, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, fo: FrontOpts, t: number, shadow = true) => {
  out.places.push(person(cam, { i, o, okey }, x, y, z, FRONT, { blink: lidAt(t, i), ...fo }, {} as SideOpts));
  if (shadow) blob(out, x, y, z);
};
/** an animal / prop card in the 600 x 1000 design space at real size `scale` (1 = 2.16 m card) */
const card = (cam: CamInfo, out: Stage, key: string, x: number, y: number, z: number, scale: number, draw: (p: Pen, light: number) => void,
  o: { mirror?: boolean; shadow?: boolean } = {}) => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.1 * scale, z)) / scale;
  const [w, h, k] = tier(Math.max(0.5, d));
  const light = light2D(cam, !!o.mirror);
  out.places.push({ key: `${key}|${q(light)}`, x, y, z, scale, mirror: o.mirror, size: [w, h, k], draw: (p) => draw(p, light) });
  if (o.shadow !== false) blob(out, x, y, z, scale * 1.6);
};
const critter = (cam: CamInfo, out: Stage, kind: "monkey" | "hen" | "rat" | "cat", i: number, x: number, y: number, z: number, t: number,
  o: CritterOpts & { v?: number; mirror?: boolean; shadow?: boolean; scale?: number } = {}) => {
  const opts = { blink: lidAt(t, i), ...o };
  const draw = { monkey, hen, rat, cat }[kind] as (p: Pen, o: CritterOpts & { v?: number }) => void;
  const key = `${kind}|${fkey({ ...opts, mirror: undefined, shadow: undefined, scale: undefined })}`;
  card(cam, out, key, x, y, z, o.scale ?? SIZE[kind], (p, light) => draw(p, { ...opts, light }), o);
};
const burst = (out: Stage, t: number, t0: number, x: number, y: number, z: number, w: number, dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `burst${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u), x, y, z, w, h: w });
};
const puff = (out: Stage, t: number, t0: number, x: number, y: number, z: number, w = 0.9) => {
  if (t < t0 || t >= t0 + 0.4) return;
  const u = q((t - t0) / 0.4, 30);
  out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x, y, z, w, h: w, soft: true });
};
const L = LEAD;
const after = (t: number, ts: number) => t >= ts - L;

/** 0 = gavel up, 1 = struck (4 f wind-up, 7 f hold at the top, 1-frame strike on the word) */
const GAVEL = [24.1];
const hammerK = (t: number) => {
  let k = 1;
  for (const th of GAVEL) {
    const n = (t - th) * FPS;
    if (n >= -11 && n < -7) k = Math.min(k, 1 - smooth((n + 11) / 4));
    else if (n >= -7 && n < 0) k = 0;
  }
  return k;
};

const judges = (cam: CamInfo, out: Stage, t: number, id: number, only?: number) => {
  JUDGES.forEach((p, v) => {
    if (only !== undefined && v !== only) return;
    let expr: Expr = "stern";
    if (id === 11) expr = after(t, 60.0) ? "dazed" : "nervous";
    const fo: FrontOpts = { mode: "stand", expr, facing: 0 };
    if (id === 5 && v === 1) fo.prop = ["hammer", q(hammerK(t), 30)];
    human(cam, out, 60 + v, JUDGE[v], `j${v}`, p[0], p[1], p[2], fo, t, false);
  });
  if (id === 5) burst(out, t, 24.1, JUDGES[1][0] + 0.45, 1.62, JUDGES[1][2] + 0.6, 0.8, 0.2);
};

const courtroom = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  if (id === 8) {
    // the two boxes: people pop up in the left one, the chair and then the animals in the right one
    const [Lb, Rb] = CRATES, hide = (k: number) => -1.8 * (1 - k);
    [-0.45, 0, 0.45].forEach((dx, i) => {
      const k = pop(f, 1116 + i * 4);
      if (k > 0) human(cam, out, 120 + i, FOLK[(i * 2 + 1) % 6], `f${(i * 2 + 1) % 6}`, Lb[0] + dx, 0.15 + hide(k), Lb[2] - 0.15 + i * 0.05,
        { mode: "stand", expr: (["grin", "smile", "smile_closed"] as Expr[])[i], wave: i === 1 ? q(Math.sin(t * 8), 20) : undefined }, t, false);
    });
    const kc = pop(f, 1141);
    if (kc > 0) card(cam, out, "chair", Rb[0] + 0.45, 0.55 + hide(kc), Rb[2] - 0.1, 0.5, (p) => chair(p), { shadow: false });
    const km = pop(f, 1169), kh = pop(f, 1176), kr = pop(f, 1183);
    if (km > 0) critter(cam, out, "monkey", 2, Rb[0] - 0.42, 0.72 + hide(km), Rb[2], t, { expr: "stern", shadow: false });
    if (kh > 0) critter(cam, out, "hen", 3, Rb[0] + 0.02, 0.98 + hide(kh), Rb[2] + 0.12, t, { expr: "nervous", v: 1, shadow: false });
    if (kr > 0) critter(cam, out, "rat", 4, Rb[0] + 0.45, 0.82 + hide(kr) + 0.26, Rb[2] + 0.05, t, { expr: "neutral", shadow: false }); // on the seat
    for (const [k, x, z, t0] of [[1, Lb[0], Lb[2], 1116], [1, Rb[0] + 0.45, Rb[2], 1141], [1, Rb[0] - 0.45, Rb[2], 1169], [1, Rb[0], Rb[2], 1176]] as const)
      if (k) puff(out, t, t0 / FPS, x, 1.2, z + 0.65, 1.0);
    return;
  }
  if (id === 11) {
    judges(cam, out, t, id, 1);
    card(cam, out, "stack", JUDGES[1][0] + 0.75, 1.5, JUDGES[1][2] + 0.45, q(stackK(f), 60), (p) => paperStack(p), { shadow: false });
    return;
  }
  judges(cam, out, t, id);
  // the photographer and the monkey's lawyer at their tables
  const manExpr: Expr = id === 3 && after(t, 15.38) && t < 16.04 - L ? "grin" : id === 5 && after(t, 24.74) ? "smile_closed" : "smile";
  human(cam, out, 10, PHOTOG, "ph", MAN_T[0], MAN_T[1], MAN_T[2], { mode: "stand", expr: manExpr, facing: 1 }, t, false);
  human(cam, out, 11, LAWYER, "law", LAWYER_T[0], LAWYER_T[1], LAWYER_T[2], { mode: "stand", expr: id === 5 && after(t, 24.1) ? "nervous" : "neutral", facing: -1 }, t, false);
  if (id === 1) {
    // hook: Naruto in the witness box with the camera; the flash on "selfie"
    const fl = t >= 1.17 && t < 1.4 ? 1 : 0;
    const expr: Expr = t < 1.15 ? "neutral" : t < 2.6 ? "grin" : "smile";
    critter(cam, out, "monkey", 1, WITNESS[0], WITNESS[1], WITNESS[2], t, { expr, arms: "camera", flash: fl, shadow: false });
    burst(out, t, 1.17, WITNESS[0] + 0.02, WITNESS[1] + 0.12, WITNESS[2] + 0.25, 0.7, 0.25);
  } else {
    const expr: Expr = id === 3 ? (after(t, 16.04) ? "grin" : "neutral") : after(t, 24.74) ? "shock" : "neutral";
    critter(cam, out, "monkey", 1, MONK_T[0], MONK_T[1], MONK_T[2], t, { expr, shadow: false });
  }
  if (id === 3) card(cam, out, "easel", EASEL_C[0], 0, EASEL_C[2], 0.8, (p) => easelSelfie(p));
};

const jungle = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  if (id === 2) {
    const fl = t >= 9.75 && t < 9.95 ? 1 : 0;
    card(cam, out, `tripod${fl}`, TRIPOD[0], 0, TRIPOD[2], 0.5, (p) => tripod(p, fl));
    burst(out, t, 9.75, TRIPOD[0], 0.73, TRIPOD[2] + 0.2, 0.55, 0.25);
    const x = monkJX(f), walking = f < 268;
    const arms = after(t, 9.45) && t < 10.4 ? "reach" : "down";
    const expr: Expr = t < 9.75 ? (walking ? "neutral" : "smile") : t < 10.6 ? "shock" : "laugh";
    critter(cam, out, "monkey", 1, x, MONK_J[1], MONK_J[2], t, { expr, arms, phase: walking ? q((t * 1.6) % 1, 24) : 0, mirror: true });
    const pe: Expr = t < 8.0 ? "smile" : t < 9.75 ? "neutral" : "shock";
    human(cam, out, 10, PHOTOG, "ph", MAN_J[0], 0, MAN_J[2], { mode: "stand", expr: pe, facing: 1 }, t);
    return;
  }
  // shot 12, golden: the selfie on the easel, the monkey and the man on either side
  card(cam, out, "easel", TRIPOD[0] - 0.85, 0, -0.1, 0.8, (p) => easelSelfie(p));
  const shrug = after(t, 66.28);
  critter(cam, out, "monkey", 1, MONK_J[0], MONK_J[1], MONK_J[2], t, { expr: shrug ? "smile_closed" : "neutral", arms: shrug ? "shrug" : "down", mirror: true });
  human(cam, out, 10, PHOTOG, "ph", MAN_J[0], 0, MAN_J[2], { mode: "stand", expr: after(t, 67.58) ? "nervous" : "smile", facing: 1 }, t);
};

/** the crowd of hens in front of the courthouse (shot 10): dense near the steps, sparser out to the horizon */
const HENS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let i = 0;
  for (let z = -11.2; z < 95; z += z < 12 ? 0.75 : z < 35 ? 1.4 : 2.6) {
    const sp = z < 12 ? 0.8 : z < 35 ? 1.5 : 2.8, half = Math.min(60, 9 + Math.max(0, z) * 0.75);
    for (let x = -half; x <= half; x += sp) { out.push([EX + x + (hh(i, 1) - 0.5) * sp * 0.6, z + (hh(i, 2) - 0.5) * 0.4, i]); i++; }
  }
  return out;
})();
const exterior = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  if (id === 4) {
    const z = climbZ(f), y = stepY(z), ph = q((t * 1.4) % 1, 24);
    critter(cam, out, "monkey", 1, EX - 0.45, y, z, t, { expr: "stern", phase: ph });
    human(cam, out, 11, LAWYER, "law", EX + 0.45, y, z + 0.2, { mode: "stroll", phase: ph, expr: "stern" }, t);
    return;
  }
  if (id === 6 || id === 7) {
    const expr: Expr = id === 6 ? "relief" : "nervous";
    critter(cam, out, "monkey", 1, MONK_STEP[0], MONK_STEP[1], MONK_STEP[2], t, { expr, sit: true });
    return;
  }
  // shot 10: one hen walks up, then the whole class action
  const hz = -7.6 - 2.6 * smooth((f - 1550) / 47);
  critter(cam, out, "hen", 900, EX + 0.1, stepY(hz), hz, t, { expr: f < 1597 ? "stern" : "smile", phase: f < 1597 ? q((t * 2) % 1, 24) : 0, v: 0 });
  if (f < 1595) return; // the crowd arrives on the cut, not before it
  for (const [x, z, i] of HENS) {
    if (Math.abs(x - (EX + 0.1)) < 0.5 && Math.abs(z - hz) < 0.6) continue;
    const near = cam.pos.distanceTo(tmp.set(x, 0.3, z)) < 14;
    const expr = (["stern", "neutral", "nervous", "smile", "stern"] as Expr[])[i % 5];
    critter(cam, out, "hen", 1000 + i, x, stepY(z), z, t, { expr, v: i % 5, phase: near ? q(((t * 1.7 + hh(i, 4)) % 1), 12) : 0, blink: near ? lidAt(t, i) : 0, shadow: near });
  }
};

const square1519 = (cam: CamInfo, out: Stage, t: number) => {
  human(cam, out, 70, MJ, "mj", MJUDGE[0], MJUDGE[1], MJUDGE[2], { mode: "stand", expr: "stern" }, t, false);
  const talk = t > 48.3 - L && t < 51.2;
  human(cam, out, 71, MLAW, "ml", MLAWYER[0], 0, MLAWYER[2], { mode: "stand", expr: talk ? (t < 50.8 ? "grin" : "smile_closed") : "smile", facing: -1,
    wave: talk ? q(Math.sin(t * 6), 20) : undefined }, t);
  const scared = after(t, 50.86);
  [-0.21, -0.07, 0.07, 0.21].forEach((dx, i) =>
    critter(cam, out, "rat", 80 + i, DOCK[0] + dx, 0, DOCK[2] - 0.12 - (i % 2) * 0.06, t, { expr: scared ? "shock" : i % 2 ? "nervous" : "neutral", shadow: false }));
  card(cam, out, "dock", DOCK[0], 0, DOCK[2], 0.32, (p) => dock(p));
  [-0.55, 0, 0.55].forEach((dx, i) =>
    critter(cam, out, "cat", 90 + i, CATWALL[0] + dx, CATWALL[1], CATWALL[2], t, { expr: after(t, 50.86) ? (i === 1 ? "grin" : "smile_closed") : "smile", v: i, shadow: false }));
  // townsfolk watching from the sides of the square
  [[-4.2, -1.5], [-3.4, 0.6], [-5.0, 1.8], [3.6, 2.2], [4.6, 0.8], [-2.6, 2.6]].forEach(([dx, dz], i) =>
    human(cam, out, 130 + i, FOLK[i % 6], `f${i % 6}`, MJUDGE[0] + dx, 0, dz, { mode: "stand", expr: (["smile", "neutral", "grin", "smile_closed"] as Expr[])[i % 4] }, t));
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], f = Math.round(t * FPS);
  LNAME = s.light;
  findSun(cam, SUN);
  if (s.set === "C") courtroom(cam, out, id, t, f);
  else if (s.set === "J") jungle(cam, out, id, t, f);
  else if (s.set === "E") exterior(cam, out, id, t, f);
  else square1519(cam, out, t);
  return out;
};
export { FPS, fxStars, bodyFront, bodySide, clamp01 };
export type { V3 };
