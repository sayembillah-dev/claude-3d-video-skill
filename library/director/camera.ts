// Director: camera grammar, shot timeline and lens table shared by every short (measured from the reference study):
// every hold creeps in (pushK), moves are symmetric smootherstep glides of 18-60 f, big reframes are cuts, impacts are
// 7-frame kicks that flip sign every frame (no hand-held float), DOF switches on cuts or ramps with a glide.
// A video only writes DATA: shots, camera keys, kick times, a DOF table. makeFilm() turns them into the functions
// the world and the composition need.
export type V3 = [number, number, number];
export type Light = "day" | "golden";
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Framing = Partial<Cam> & { pos: V3; look: V3 };
/** a camera key: from frame f, glide (dur frames, default 24) or cut to framing s(f) */
export type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Framing };
/** a shot: frames a..b in place `set`, lit by `light`; sunAz/sunEl override the light preset (camera-relative degrees) */
export type ShotDef = { id: number; a: number; b: number; light: Light; set: string; sunAz?: number; sunEl?: number };
/** lens per beat: cInf = blur-disc radius (px at 1080 wide) for infinity, 0 = sharp; focus = world point (else look) */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };

export const FPS = 30;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
/** symmetric smootherstep camera ease */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixCam = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
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

// ---------------- the film ----------------
export type FilmData = {
  total: number;
  shots: ShotDef[];
  /** crossfade frames at a shot's start (place / time changes) */
  xfade?: Record<number, number>;
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
  camAt(id: number, f: number): Cam;
  dofAt(f: number): { cInf: number; focus?: (f: number) => V3 };
};

export const makeFilm = (d: FilmData): Film => {
  const xf = d.xfade ?? {}, kicks = d.kicks ?? [];
  const shotAt = (f: number) => d.shots.find((s) => f >= s.a && f < s.b) ?? d.shots[d.shots.length - 1];
  const layersAt = (f: number) => {
    for (const s of d.shots) {
      const x = xf[s.id];
      if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
    }
    return [{ id: shotAt(f).id, alpha: 1 }];
  };
  const run = (keys: Key[], f: number) => {
    let cur = full(keys[0].s(f));
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (f < k.f) break;
      cur = k.cut ? full(k.s(f)) : mixCam(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
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
  const camAt = (id: number, f: number): Cam => {
    const c = run(d.cams[id], f), a = kickAt(f / FPS);
    if (!a) return c;
    const v: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
    const L = Math.hypot(...v), h = Math.hypot(v[0], v[2]) || 1;
    const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
    return { ...c, look: [c.look[0] - (v[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (v[0] / h) * m], roll: c.roll + a * 0.004 };
  };
  const dofAt = (f: number) => {
    let i = 0; while (i + 1 < d.dof.length && f >= d.dof[i + 1].f) i++;
    const cur = d.dof[i], p = d.dof[Math.max(0, i - 1)];
    const k = cur.dur ? Math.min(1, (f - cur.f) / cur.dur) : 1;
    return { cInf: p.cInf + (cur.cInf - p.cInf) * k, focus: cur.focus };
  };
  return { ...d, shotAt, layersAt, camAt, dofAt };
};
