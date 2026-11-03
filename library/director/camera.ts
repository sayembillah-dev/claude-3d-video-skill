// Director: camera grammar, shot timeline and lens table shared by every short (measured from the reference study):
// every hold creeps in (pushK), moves are symmetric smootherstep glides of 18-60 f, big reframes are cuts, impacts are
// 7-frame kicks that flip sign every frame (no hand-held float), DOF switches on cuts or ramps with a glide.
// A video only writes DATA: shots, camera keys, kick times, a DOF table. makeFilm() turns them into the functions
// the world and the composition need.
import type { LightName } from "../engine/lights";
export type V3 = [number, number, number];
export type Light = LightName;
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Framing = Partial<Cam> & { pos: V3; look: V3 };
/** a camera key: from frame f, glide (dur frames, default 24) or cut to framing s(f).
 *  ease replaces the glide curve; arc swings the view direction (slerp) instead of sliding the look point, which keeps
 *  big pans from swerving; shutter = motion-blur exposure in frames from this key on (default SHUTTER, 0 = off) */
export type Key = { f: number; dur?: number; cut?: boolean; ease?: (u: number) => number; arc?: boolean; shutter?: number; s: (f: number) => Framing };
/** a shot: frames a..b in place `set`, lit by `light`; sunAz/sunEl override the light preset (camera-relative degrees).
 *  lightTo: the light changes to `light` between absolute frames a..b (smoothstep), e.g. a storm rolling in */
export type ShotDef = { id: number; a: number; b: number; light: Light; set: string; sunAz?: number; sunEl?: number;
  lightTo?: { light: Light; a: number; b: number };
  /** god rays: n shafts (default 5) falling along this shot's sun around `at` (default: on the ground halfway from the first camera to its look point),
   *  k = brightness 0..1 (default .6), spread = metres across (default 10), len = shaft length in m (default 40) */
  rays?: { n?: number; k?: number; at?: V3; spread?: number; len?: number } };
/** lens per beat: cInf = blur-disc radius (px at 1080 wide) for infinity, 0 = sharp; focus = world point (else look) */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };

export const FPS = 30;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/** symmetric smootherstep camera ease */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
/** whip ease: slow out, very fast middle (peak speed 3x the mean, smootherstep 1.9x), slow settle */
export const whipEase = (u: number) => { const x = clamp01(u); return x < 0.5 ? 4 * x * x * x : 1 - 4 * (1 - x) ** 3; };
const lerp3 = (a: V3, b: V3, k: number) => a.map((v, i) => v + (b[i] - v) * k) as V3;
const sub3 = (a: V3, b: V3) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]] as V3;
const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const slerp3 = (a: V3, b: V3, k: number): V3 => {
  const la = len3(a) || 1, lb = len3(b) || 1, ua = a.map((v) => v / la) as V3, ub = b.map((v) => v / lb) as V3;
  const d = Math.max(-1, Math.min(1, ua[0] * ub[0] + ua[1] * ub[1] + ua[2] * ub[2])), th = Math.acos(d);
  if (th < 1e-4) return lerp3(ua, ub, k);
  const s0 = Math.sin((1 - k) * th) / Math.sin(th), s1 = Math.sin(k * th) / Math.sin(th);
  return [ua[0] * s0 + ub[0] * s1, ua[1] * s0 + ub[1] * s1, ua[2] * s0 + ub[2] * s1];
};
const mixCam = (a: Cam, b: Cam, k: number, arc = false): Cam => {
  const pos = lerp3(a.pos, b.pos, k);
  let look = lerp3(a.look, b.look, k);
  if (arc) {
    const da = sub3(a.look, a.pos), db = sub3(b.look, b.pos), L = len3(da) + (len3(db) - len3(da)) * k, u = slerp3(da, db, k);
    look = [pos[0] + u[0] * L, pos[1] + u[1] * L, pos[2] + u[2] * L];
  }
  return { pos, look, fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k };
};
const full = (c: Framing): Cam => ({ fov: 40, roll: 0, ...c });

// ---------------- framing helpers (use inside camera keys) ----------------
/** creep factor since f0: subject grows ~rate per frame; `punch` raises it for n frames (8 f soft edges) on punch words */
export const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly push: the camera slides toward the look point by factor k */
export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Framing =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** zoom push (camera stays put, e.g. right behind a wall): tan(fov/2) shrinks by k */
export const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Framing =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
/** roll-only variation of a framing */
export const rolled = (s: (f: number) => Framing, roll: number) => (f: number): Framing => ({ ...s(f), roll });
/** point offset */
export const at = (p: V3, dx: number, dy: number, dz: number): V3 => [p[0] + dx, p[1] + dy, p[2] + dz];
/** the most common key: a creeping dolly from `pos` toward `look`, starting at frame f */
export const push = (f: number, pos: V3, look: V3, o: { rate?: number; punch?: number; n?: number; fov?: number; roll?: number; cut?: boolean; dur?: number } = {}): Key =>
  ({ f, cut: o.cut, dur: o.dur, s: (g) => dolly(pos, look, pushK(g, f, o.rate ?? 0.0025, o.punch ?? 0, o.n ?? 35), { fov: o.fov ?? 40, roll: o.roll ?? 0 }) });

/** HEAD_H: a human card's head height in metres (scale 1), for close-up framing */
export const HEAD_H = 0.42;
/** close-up / extreme close-up on a head (centre ≈ feet + 1.5 m): the head fills `fill` of the frame height
 *  (.35 close-up, .5-.6 extreme). dir = from the face toward the camera (default slightly high, frontal). Pair with a
 *  shallow DOF beat. Holds still unless rate is set; push in with punch for a shock. */
export const closeUp = (f: number, head: V3, o: { fill?: number; dir?: V3; fov?: number; rate?: number; punch?: number; roll?: number; cut?: boolean; dur?: number } = {}): Key => {
  const fov = o.fov ?? 32, fill = o.fill ?? 0.45, [dx, dy, dz] = o.dir ?? [0, 0.12, 1], l = Math.hypot(dx, dy, dz) || 1;
  const dist = HEAD_H / (fill * 2 * Math.tan((fov * Math.PI) / 360));
  return push(f, [head[0] + (dx / l) * dist, head[1] + (dy / l) * dist, head[2] + (dz / l) * dist], [head[0], head[1], head[2]], { rate: 0, ...o, fov });
};

// ---------------- moving-camera keys (fly-throughs, follows, whips, orbits) ----------------
/** default motion-blur exposure in frames (0.5 = 180-degree shutter); slow creeps stay sharp (blur.ts dead zone) */
export const SHUTTER = 0.5;
type Mov = { fov?: number; roll?: number; cut?: boolean; blend?: number; ease?: (u: number) => number; shutter?: number };
const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
/** constant-speed Catmull-Rom through pts: returns u (0..1 of the length) -> point */
export const spline = (pts: V3[]) => {
  const P = [pts[0], ...pts, pts[pts.length - 1]], n = pts.length - 1, N = 64 * n;
  const raw = (t: number): V3 => {
    const x = Math.min(n - 1e-9, Math.max(0, t * n)), i = Math.floor(x), u = x - i;
    return [0, 1, 2].map((c) => cr(P[i][c], P[i + 1][c], P[i + 2][c], P[i + 3][c], u)) as V3;
  };
  const acc = [0]; let prev = raw(0);
  for (let j = 1; j <= N; j++) { const q = raw(j / N); acc.push(acc[j - 1] + len3(sub3(q, prev))); prev = q; }
  const T = acc[N] || 1;
  return (u: number): V3 => {
    if (n < 1) return pts[0];
    const want = clamp01(u) * T; let lo = 0, hi = N;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (acc[m] < want) lo = m; else hi = m; }
    const k = (want - acc[lo]) / Math.max(1e-9, acc[hi] - acc[lo]);
    return raw((lo + k) / N);
  };
};
/** drone fly-through: from frame f the camera travels the smooth path `pts` in `dur` frames (eased, constant speed).
 *  look: a fixed point, a second path travelled in step, or omitted = look `ahead` metres down the path (+lift).
 *  bank (rad per rad of turn) rolls into curves like a drone. blend = frames to glide in from the previous key (cut: 0). */
export const flyPath = (f: number, pts: V3[], o: Mov & { dur: number; look?: V3 | V3[]; ahead?: number; lift?: number; bank?: number }): Key => {
  const P = spline(pts), Lk = Array.isArray(o.look) && Array.isArray(o.look[0]) ? spline(o.look as V3[]) : null;
  const ease = o.ease ?? glide, ah = o.ahead ?? 6, du = 1 / Math.max(1, o.dur);
  const yaw = (u: number) => { const a = P(Math.max(0, u - du)), b = P(Math.min(1, u + du)); return Math.atan2(b[0] - a[0], -(b[2] - a[2])); };
  return { f, cut: o.cut, dur: o.cut ? 1 : o.blend ?? 10, shutter: o.shutter, s: (g) => {
    const u = ease((g - f) / o.dur), pos = P(u);
    let look: V3;
    if (Lk) look = Lk(u);
    else if (o.look) look = o.look as V3;
    else { const T = sub3(P(Math.min(1, u + 0.02)), P(Math.max(0, u - 0.02))), l = len3(T) || 1; look = [pos[0] + (T[0] / l) * ah, pos[1] + (T[1] / l) * ah + (o.lift ?? 0), pos[2] + (T[2] / l) * ah]; }
    let roll = o.roll ?? 0;
    if (o.bank) { let dy = yaw(Math.min(1, u + 0.03)) - yaw(Math.max(0, u - 0.03)); dy = Math.atan2(Math.sin(dy), Math.cos(dy)); roll += o.bank * dy; }
    return { pos, look, fov: o.fov ?? 40, roll };
  } };
};
/** follow a moving object (oil drip, thrown hook, walking hero): the camera sits at offset `off` from where the target
 *  was `lag` frames ago on average (a soft trailing operator), looking at the target now (+lookOff).
 *  No motion blur by default: the blur only knows the camera's motion, so a followed card would ghost. */
export const follow = (f: number, target: (g: number) => V3, off: V3, o: Mov & { lag?: number; lookOff?: V3 } = {}): Key => {
  const lag = o.lag ?? 6, lo = o.lookOff ?? [0, 0, 0];
  return { f, cut: o.cut, dur: o.cut ? 1 : o.blend ?? 12, shutter: o.shutter ?? 0, s: (g) => {
    const p: V3 = [0, 0, 0], n = 7;
    for (let i = 0; i < n; i++) { const q = target(g - (lag * i) / (n - 1)); p[0] += q[0] / n; p[1] += q[1] / n; p[2] += q[2] / n; }
    const t = target(g);
    return { pos: at(p, ...off), look: at(t, ...lo), fov: o.fov ?? 40, roll: o.roll ?? 0 };
  } };
};
/** whip pan: swing the view to framing `to` in n frames (6-10) with the whip ease, turning the direction (arc) not the
 *  look point. Motion blur carries it; pair with a whoosh SFX. Lands on `to`, so add a push key after it for the hold. */
export const whip = (f: number, to: Framing | ((g: number) => Framing), n = 8, shutter = 0.75): Key =>
  ({ f, dur: n, ease: whipEase, arc: true, shutter, s: typeof to === "function" ? to : () => to });
/** orbit around `center` at radius r, height h (above center.y), from angle a0 to a1 degrees (0 = camera on +z) */
export const orbit = (f: number, center: V3, o: Mov & { r: number; h: number; a0: number; a1: number; dur: number; lookUp?: number }): Key => {
  const ease = o.ease ?? glide;
  return { f, cut: o.cut, dur: o.cut ? 1 : o.blend ?? 12, shutter: o.shutter, s: (g) => {
    const a = ((o.a0 + (o.a1 - o.a0) * ease((g - f) / o.dur)) * Math.PI) / 180;
    return { pos: [center[0] + Math.sin(a) * o.r, center[1] + o.h, center[2] + Math.cos(a) * o.r], look: at(center, 0, o.lookUp ?? 0, 0), fov: o.fov ?? 40, roll: o.roll ?? 0 };
  } };
};
/** crane: the camera rises (and pulls back) from `from` to `to` in dur frames while holding `look` (reveal / crane-down) */
export const crane = (f: number, from: V3, to: V3, look: V3, o: Mov & { dur: number }): Key =>
  flyPath(f, [from, to], { ...o, look });

// ---------------- the film ----------------
export type FilmData = {
  total: number;
  shots: ShotDef[];
  /** transition into shot id: frames (a plain dissolve) or { n, kind } (reference study 2026-11-03: link shots with
   *  dissolves, keep hard cuts for punches). "dissolve" 4-6 f; "ripple" ~18 f, water / memory / soup-to-sea; "double"
   *  ~24 f, both shots held at half (a face ghosted over the place it remembers). */
  xfade?: Record<number, number | Xfade>;
  /** anime speed lines over the frame: frames a..b, k = strength 0..1 (default 1), centre in frame fractions */
  speedLines?: { a: number; b: number; k?: number; cx?: number; cy?: number }[];
  /** camera keys per shot id (shots may share a key list) */
  cams: Record<number, Key[]>;
  /** impact kicks [time s, strength] */
  kicks?: [number, number][];
  dof: Dof[];
  /** white flash (4 f) at this frame, e.g. right after the hook */
  flashAt?: number;
};
export type Film = FilmData & {
  shotAt(f: number): ShotDef;
  layersAt(f: number): { id: number; alpha: number }[];
  /** the transition running at f (kind and progress 0..1), or null */
  transAt(f: number): { kind: XfadeKind; k: number } | null;
  /** speed-line strength at f (0 = none) and centre */
  speedAt(f: number): { k: number; cx: number; cy: number };
  camAt(id: number, f: number): Cam;
  /** motion-blur exposure (frames) at f and the camera that long before; null = no blur (a cut inside the exposure) */
  shutterAt(id: number, f: number): { dt: number; prev: Cam } | null;
  dofAt(f: number): { cInf: number; focus?: (f: number) => V3 };
  /** the shot's light at f: from A toward B by k (k = 0 without a lightTo) */
  lightAt(id: number, f: number): { A: Light; B: Light; k: number };
};

export type XfadeKind = "dissolve" | "ripple" | "double";
export type Xfade = { n: number; kind?: XfadeKind };
/** incoming layer opacity over a transition's progress k: "double" rises to half, holds, then resolves */
const xAlpha = (kind: XfadeKind, k: number) => kind === "double" ? (k < 0.3 ? 0.5 * smooth(k / 0.3) : k < 0.7 ? 0.5 : 0.5 + 0.5 * smooth((k - 0.7) / 0.3))
  : kind === "ripple" ? smooth(Math.min(1, Math.max(0, (k - 0.25) / 0.5))) : k;

export const makeFilm = (d: FilmData): Film => {
  const xf = d.xfade ?? {}, kicks = d.kicks ?? [], sl = d.speedLines ?? [];
  const shotAt = (f: number) => d.shots.find((s) => f >= s.a && f < s.b) ?? d.shots[d.shots.length - 1];
  const transAt = (f: number) => {
    for (const s of d.shots) {
      const v = xf[s.id];
      if (!v) continue;
      const x = typeof v === "number" ? v : v.n, kind = typeof v === "number" ? "dissolve" : v.kind ?? "dissolve";
      if (f >= s.a - x / 2 && f < s.a + x / 2) return { id: s.id, kind, k: (f - (s.a - x / 2) + 1) / (x + 1) };
    }
    return null;
  };
  const layersAt = (f: number) => {
    const t = transAt(f);
    if (t) return [{ id: t.id - 1, alpha: 1 }, { id: t.id, alpha: xAlpha(t.kind, t.k) }];
    return [{ id: shotAt(f).id, alpha: 1 }];
  };
  const speedAt = (f: number) => {
    for (const l of sl) if (f >= l.a && f < l.b) {
      const e = Math.min(1, (f - l.a + 1) / 4, (l.b - f) / 4); // 4-frame ramp in and out
      return { k: (l.k ?? 1) * e, cx: l.cx ?? 0.5, cy: l.cy ?? 0.45 };
    }
    return { k: 0, cx: 0.5, cy: 0.45 };
  };
  const run = (keys: Key[], f: number) => {
    let cur = full(keys[0].s(f));
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (f < k.f) break;
      cur = k.cut ? full(k.s(f)) : mixCam(cur, full(k.s(f)), (k.ease ?? glide)((f - k.f) / (k.dur ?? 24)), k.arc);
    }
    return cur;
  };
  const kickAt = (t: number) => {
    let a = 0;
    for (const [t0, g] of kicks) {
      const n = Math.floor((t - t0) * FPS + 1e-6);
      if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
    }
    return a;
  };
  // kt = the frame whose kick shake applies (the blur's earlier camera keeps this frame's kick: shakes stay crisp)
  const camKick = (id: number, f: number, kt: number): Cam => {
    const c = run(d.cams[id], f), a = kickAt(kt / FPS);
    if (!a) return c;
    const v: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
    const L = Math.hypot(...v), h = Math.hypot(v[0], v[2]) || 1;
    const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
    return { ...c, look: [c.look[0] - (v[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (v[0] / h) * m], roll: c.roll + a * 0.004 };
  };
  const camAt = (id: number, f: number) => camKick(id, f, f);
  const shutterAt = (id: number, f: number) => {
    const keys = d.cams[id];
    let k = keys[0];
    for (const q of keys) if (f >= q.f) k = q;
    const dt = k.shutter ?? SHUTTER;
    if (dt <= 0) return null;
    for (const q of keys) if (q !== keys[0] && q.cut && q.f > f - dt && q.f <= f) return null;
    const s = d.shots[id - 1];
    if (s && f - dt < s.a) return null;
    return { dt, prev: camKick(id, f - dt, f) };
  };
  const dofAt = (f: number) => {
    let i = 0; while (i + 1 < d.dof.length && f >= d.dof[i + 1].f) i++;
    const cur = d.dof[i], p = d.dof[Math.max(0, i - 1)];
    const k = cur.dur ? Math.min(1, (f - cur.f) / cur.dur) : 1;
    return { cInf: p.cInf + (cur.cInf - p.cInf) * k, focus: cur.focus };
  };
  const lightAt = (id: number, f: number) => {
    const s = d.shots[id - 1], to = s.lightTo;
    if (!to) return { A: s.light, B: s.light, k: 0 };
    return { A: s.light, B: to.light, k: smooth((f - to.a) / Math.max(1, to.b - to.a)) };
  };
  return { ...d, shotAt, layersAt, transAt: (f: number) => { const t = transAt(f); return t && { kind: t.kind as XfadeKind, k: t.k }; }, speedAt, camAt, shutterAt, dofAt, lightAt };
};
