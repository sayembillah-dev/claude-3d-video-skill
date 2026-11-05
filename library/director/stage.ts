// Director: staging runtime shared by every short. Characters, animals and props are camera-facing lit cards drawn
// on canvases (one canvas per distinct drawing, pooled, so crowds share a handful); effects are unlit cards; contact
// shadows are multiply blobs. A video's cast.ts only decides WHO is WHERE doing WHAT when, using the helpers below:
//   human(...)    bean-head person (engine/toon Outfit + FrontOpts)     critter(...)  monkey / hen / rat / cat
//   card(...)     any drawing in the 600 x 1000 design space at a size    burst / puff  impact star / dust puff fx
//   lidAt(t, i)   blink schedule; after(t, ts) = reaction lands 2 f before the word at ts; strikeK = hammer/gavel pose
// Call beginStage(light, cam) first in the video's stage(); it sets the light used for card shading and shadows.
import * as THREE from "three";
import { Pen, bodyFront, townsfolk, fxBurst, fxShadow, fxContact, fxPuff, Outfit, FrontOpts, SideOpts, bodySide } from "../engine/toon";
import { monkey, hen, rat, cat, CritterOpts } from "../cast/critters";
import { NOINK } from "../engine/ink";
import type { LightName } from "../engine/lights";
import { cardShade, blobMaterial, CARD_K } from "../engine/cardshade";

export const FPS = 30;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };

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
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3;
  /** set by world.ts: camera up / forward (unit), vertical fov (deg) and aspect, for screen-placed helpers (people.ts) */
  up?: THREE.Vector3; fwd?: THREE.Vector3; fov?: number; aspect?: number };

export const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export const q = (v: number, n = 120) => Math.round(v * n) / n;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
export const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: LightName = "day";
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
export const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
export const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
export const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
export const lidAt = (t: number, i: number, swaps: number[] = []) => {
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
export const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

export type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
export const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
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
const CONTACT: Record<LightName, [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33], storm: [0.22, 0.22, 0.4], dusk: [0.24, 0.2, 0.36], dread: [0.1, 0.11, 0.11], night: [0.08, 0.08, 0.14] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
export const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
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
// ---------------- staging helpers (used by every video's cast.ts) ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
export const FOLK = [0, 1, 2, 3, 4, 5].map((v) => townsfolk(v));
export const FRONT = { side: false, mirror: false };
export const SIZE = { monkey: 0.45, hen: 0.25, rat: 0.14, cat: 0.23 };

export const human = (cam: CamInfo, out: Stage, i: number, o: Outfit, okey: string, x: number, y: number, z: number, fo: FrontOpts, t: number, shadow = true) => {
  out.places.push(person(cam, { i, o, okey }, x, y, z, FRONT, { blink: lidAt(t, i), ...fo }, {} as SideOpts));
  if (shadow) blob(out, x, y, z);
};
/** an animal / prop card in the 600 x 1000 design space at real size `scale` (1 = 2.16 m card) */
export const card = (cam: CamInfo, out: Stage, key: string, x: number, y: number, z: number, scale: number, draw: (p: Pen, light: number) => void,
  o: { mirror?: boolean; shadow?: boolean } = {}) => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.1 * scale, z)) / scale;
  const [w, h, k] = tier(Math.max(0.5, d));
  const light = light2D(cam, !!o.mirror);
  out.places.push({ key: `${key}|${q(light)}`, x, y, z, scale, mirror: o.mirror, size: [w, h, k], draw: (p) => draw(p, light) });
  if (o.shadow !== false) blob(out, x, y, z, scale * 1.6);
};
export const critter = (cam: CamInfo, out: Stage, kind: "monkey" | "hen" | "rat" | "cat", i: number, x: number, y: number, z: number, t: number,
  o: CritterOpts & { v?: number; mirror?: boolean; shadow?: boolean; scale?: number } = {}) => {
  const opts = { blink: lidAt(t, i), ...o };
  const draw = { monkey, hen, rat, cat }[kind] as (p: Pen, o: CritterOpts & { v?: number }) => void;
  const key = `${kind}|${fkey({ ...opts, mirror: undefined, shadow: undefined, scale: undefined })}`;
  card(cam, out, key, x, y, z, o.scale ?? SIZE[kind], (p, light) => draw(p, { ...opts, light }), o);
};
export const burst = (out: Stage, t: number, t0: number, x: number, y: number, z: number, w: number, dur = 0.3) => {
  if (t < t0 || t >= t0 + dur) return;
  const u = q((t - t0) / dur, 30);
  out.fx.push({ key: `burst${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u), x, y, z, w, h: w });
};
export const puff = (out: Stage, t: number, t0: number, x: number, y: number, z: number, w = 0.9) => {
  if (t < t0 || t >= t0 + 0.4) return;
  const u = q((t - t0) / 0.4, 30);
  out.fx.push({ key: `puff${u}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, u), x, y, z, w, h: w, soft: true });
};
/** rain: world-anchored streak cards wrapped in a box in front of the camera (so camera moves give parallax).
 *  n ~ 120-220; area = box half-width (m); slant = screen tilt (rad); falls `speed` m/s. Use with storm light. */
export const rain = (out: Stage, t: number, cam: CamInfo, o: { n?: number; area?: number; depth?: number; h?: number; speed?: number; slant?: number; len?: number } = {}) => {
  const n = o.n ?? 220, A = o.area ?? 9, D = o.depth ?? 16, H = o.h ?? 10, sp = o.speed ?? 14, len = o.len ?? 0.9, rot = o.slant ?? 0.18;
  const fx = cam.right.z, fz = -cam.right.x; // forward = up x right
  const cx = cam.pos.x + fx * (D / 2 + 1), cz = cam.pos.z + fz * (D / 2 + 1), R = Math.max(A, D / 2);
  const wrap = (v: number, c: number, w: number) => c + ((((v - c + w) % (2 * w)) + 2 * w) % (2 * w)) - w;
  for (let i = 0; i < n; i++) {
    const x = wrap(hh(i, 1) * 400, cx, R), z = wrap(hh(i, 2) * 400, cz, R);
    if ((x - cam.pos.x) * fx + (z - cam.pos.z) * fz < 2.5) continue; // near streaks fill the frame
    const y = cam.pos.y + H / 2 - ((((hh(i, 3) * H + t * sp * (0.85 + 0.3 * hh(i, 4))) % H) + H) % H);
    out.fx.push({ key: "rain", cw: 16, ch: 256, draw: fxRain, x, y, z, w: 0.05, h: len, rot, soft: true });
  }
};
const fxRain = (p: Pen) => { const g = p.g, gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "rgba(225,235,255,0)"); gr.addColorStop(1, "rgba(235,242,255,0.85)"); g.fillStyle = gr; g.fillRect(2, 0, 12, 256); };
/** birds: a loose flock of ink V's circling (cx, cy, cz) at radius r; flaps are quantised so cards cache. */
export const birds = (out: Stage, t: number, cx: number, cy: number, cz: number, o: { n?: number; r?: number; size?: number; speed?: number } = {}) => {
  const n = o.n ?? 5, r = o.r ?? 6, w = o.size ?? 0.5, sp = o.speed ?? 0.35;
  for (let i = 0; i < n; i++) {
    const a = t * sp + (i / n) * 1.3 + hh(i, 5) * 0.4, rr = r * (0.8 + 0.4 * hh(i, 6));
    const u = q(0.5 + 0.5 * Math.sin(t * 9 + i * 2.1), 6);
    out.fx.push({ key: `bird${u}`, cw: 200, ch: 120, draw: (p) => fxBird(p, u), x: cx + Math.cos(a) * rr, y: cy + Math.sin(t * 0.9 + i) * 0.6 + hh(i, 7) * 1.5, z: cz + Math.sin(a) * rr, w, h: w * 0.6 });
  }
};
const fxBird = (p: Pen, u: number) => { const dy = (u - 0.5) * 70;
  p.stroke([[12, 60 + dy], [55, 50 + dy * 0.3], [100, 72]], 13); p.stroke([[100, 72], [145, 50 + dy * 0.3], [188, 60 + dy]], 13); };
export const after = (t: number, ts: number) => t >= ts - LEAD;

/** start a frame's staging: the shot's light preset and the sun as seen from this camera */
export const beginStage = (light: LightName, cam: CamInfo) => { LNAME = light; findSun(cam, SUN); };
/** hammer / gavel pose for strikes at times `hits` (s): 0 = raised, 1 = struck (4 f wind-up, 7 f hold, 1 f strike) */
export const strikeK = (t: number, hits: number[]) => {
  let k = 1;
  for (const th of hits) {
    const n = (t - th) * FPS;
    if (n >= -11 && n < -7) k = Math.min(k, 1 - smooth((n + 11) / 4));
    else if (n >= -7 && n < 0) k = 0;
  }
  return k;
};
