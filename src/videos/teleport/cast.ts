// Staging of "teleport": who and what is where, shot by shot, with reactions timed to the voice words
// (projects/teleport/voice/words.json). Drawing, pooling, light and shadows are the director's (library/director/stage.ts).
import { Expr, FrontOpts } from "../../../library/engine/toon";
import { COMMUTER, SCIENTIST, PHILOSOPHER, PHOTOG } from "../../../library/cast/outfits";
import { clock, redX, sparkle } from "../../../library/cast/science";
import { boothBack, boothFront, fax, shredder, satellite, dish, car, plane, door, atom, bomb, atomBin } from "../../../library/cast/travel";
import { Stage, CamInfo, FOLK, human, card, burst, puff, rain, after, q, hh } from "../../../library/director/stage";
import { glow, smoke, sweat, explode, textCard } from "../../../library/director/fx";
import { leanIn, foreground } from "../../../library/director/people";
import { uploadScreen, floorMug } from "./props";
import {
  FPS, V3, BOOTH_H, MON, FAX, SHRED, CLOCK, PHIL, DAVE2, EMIT, RECV, SCI1, SCI2, photonAt, photonK, DISH, satAt, BLAST,
  BOOTH_T, DAVE_T, BIN, DOOR, CARS, TX, BOOTH_Q, BOOTHS_Q, SHRED_Q, QX, DAVE_D, MUG, flood, smooth, clamp01, easeOut,
} from "./story";

const BS = 1.2; // booth card scale (2.6 m tall)
const stroll = (t: number, i = 0) => q((t * 1.6 + i * 0.37) % 1, 24);
/** the expression at time t: the last step whose word has started (reactions land 2 f early) */
const ex = (t: number, first: Expr, steps: [number, Expr][]) => { let e = first; for (const [ts, x] of steps) if (after(t, ts)) e = x; return e; };
/** pop-up 0 (hidden) .. 1 with a small overshoot, starting 2 f before `at` (frames) */
const pop = (f: number, at: number) => {
  const u = clamp01((f - at + 2) / 7);
  return u <= 0 ? 0 : u >= 1 ? 1 : easeOut(u) + 0.12 * Math.sin(Math.PI * u);
};
const dave = (cam: CamInfo, out: Stage, t: number, i: number, x: number, z: number, fo: FrontOpts, y = 0) =>
  human(cam, out, i, COMMUTER, "dave", x, y, z, { mode: "stand", ...fo }, t);

/** a booth: back card, optional Dave inside, glass front card with scan ring / glow */
const booth = (cam: CamInfo, out: Stage, key: string, b: V3, v: number, o: { scan?: number; glow?: number; inside?: (z: number) => void } = {}) => {
  card(cam, out, `bb${v}`, b[0], b[1], b[2] - 0.32, BS, (p) => boothBack(p, v));
  o.inside?.(b[2]);
  const sc = o.scan === undefined ? -1 : q(o.scan, 24), gl = q(o.glow ?? 0, 10);
  card(cam, out, `bf${v}|${sc}|${gl}`, b[0], b[1], b[2] + 0.34, BS, (p) => boothFront(p, v, sc, gl), { shadow: false });
  if (gl > 0) glow(out, 0, b[0], 1.3, b[2] + 0.4, { w: 2.2, h: 3, col: "#7dfff0", k: gl });
  void key;
};
const scanOf = (t: number) => { const u = (t * 0.9) % 2; return u < 1 ? u : 2 - u; };

/** a swarm of atoms circling a point (n of them, helix up the body) */
const swarm = (cam: CamInfo, out: Stage, t: number, c: V3, n: number, r = 0.7, sz = 0.11, hgt = 1.7) => {
  for (let i = 0; i < n; i++) {
    const a = t * (1.6 + 0.3 * hh(i, 2)) + i * 2.39, y = c[1] + 0.15 + (i / Math.max(1, n - 1)) * hgt + 0.08 * Math.sin(t * 3 + i);
    const ph = q((t * 4 + i) % 6.28, 6);
    card(cam, out, `atom${ph}|${i % 3}`, c[0] + r * Math.cos(a), y, c[2] + r * Math.sin(a), sz, (p) => atom(p, ph, ["#7bd389", "#ffd23f", "#ef5d8f"][i % 3]), { shadow: false });
  }
};

// ---------------- places ----------------
const flat = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  // desk furniture seen in most flat shots
  const pct = id === 7 ? 0.004 + 0.004 * smooth((t - 31.9) / 2) : id >= 8 ? 0.008 : 0;
  if (id === 7 || id === 8) {
    const sp = q((t * 5) % 6.28, 8);
    card(cam, out, `up${pct}|${sp}`, MON[0], MON[1], MON[2], 0.42, (p) => uploadScreen(p, pct, sp), { shadow: false });
  }
  if (id === 7 && after(t, 27.4)) textCard(out, "label", { text: "UPLOADING DAVE", color: "#fff6d6" }, MON[0], MON[1] + 1.05 + 0.03 * Math.sin(t * 3), MON[2] + 0.1, 0.62 * pop(f, 822));
  if (id === 12) {
    const pg = q(smooth((t - 53.5) / 1.3), 20), sk = q(smooth((t - 55.6) / 1.0), 20);
    card(cam, out, `fax${pg}`, FAX[0], FAX[1], FAX[2], 0.32, (p) => fax(p, pg), { shadow: false });
    card(cam, out, `shred${sk}`, SHRED[0], 0, SHRED[2], 0.42, (p) => shredder(p, sk, false));
    if (after(t, 56.3)) puff(out, t, 56.4, SHRED[0], 0.9, SHRED[2] + 0.3, 0.6);
    leanIn(cam, out, 1, COMMUTER, "dave", t, { edge: "left", k: smooth((t - 53.0) / 0.7), d: 2.6, scale: 0.8, fo: { expr: ex(t, "nervous", [[55.64, "shock"]]) } });
  }
  if (id === 8) {
    const ang = q((t - 32.7) * 9, 40);
    card(cam, out, `clk${ang}`, CLOCK[0], 1.45, -5.8, 0.4, (p) => clock(p, ang), { shadow: false });
    textCard(out, "label", { text: "0.0001 %", color: "#fff6d6" }, MON[0], MON[1] + 0.12, MON[2] + 0.12, 0.38);
    const yr = Math.round(2026 + Math.pow(10, Math.min(12, (t - 33) * 2.2)));
    textCard(out, "calendar", { top: "YEAR", text: yr > 1e9 ? "FOREVER" : yr.toLocaleString("en-US") }, HX(-1.2), 1.95, -5.85, 0.62);
  }
  // the booth with or without Dave
  const inBooth = id === 1 ? after(t, 1.6) && !after(t, 3.18) : id === 6 || (id === 7 && !after(t, 27.6)) || (id === 14 && !after(t, 65.1));
  const scan = id === 1 || id === 6 ? scanOf(t) : undefined;
  const g = id === 1 ? smooth((t - 1.5) / 1.6) * (after(t, 3.4) ? 0.4 : 1) : id === 6 ? 0.6 : id === 7 ? smooth((t - 26.9) / 0.5) * (after(t, 27.6) ? 0.3 : 1) : 0;
  const e: Expr = id === 1 ? ex(t, "smile_closed", [[2.42, "nervous"], [2.96, "shock"]])
    : id === 6 ? ex(t, "nervous", [[24.04, "shock"]])
    : id === 7 ? "nervous"
    : id === 14 ? ex(t, "neutral", [[62.7, "shock"], [64.22, "pained"]]) : "neutral";
  booth(cam, out, "H", BOOTH_H, 0, { scan, glow: g, inside: inBooth ? (z) => dave(cam, out, t, 1, BOOTH_H[0], z, { expr: e, prop: id === 1 ? "mug" : null }) : undefined });
  // shot 1: Dave strolls in with his coffee; the mug drops when he is wiped out and is still on the floor in shot 14
  if (id === 1 && !after(t, 1.6)) dave(cam, out, t, 1, HX(1.3) + 1.45 * smooth(t / 1.6), -3.25, { mode: "stroll", phase: stroll(t), expr: ex(t, "smile_closed", [[0.5, "relief_open"], [1.1, "smile_closed"]]), facing: 1, prop: "mug" });
  if (id === 1 && after(t, 3.18)) {
    const u = clamp01((t - 3.18) / 0.22), sp = q(clamp01((t - 3.42) / 0.4), 8);
    card(cam, out, `mug${sp}`, MUG[0], 1.0 * (1 - u * u), MUG[2], 0.11, (p) => floorMug(p, sp), { shadow: false });
  }
  if (id === 14) card(cam, out, "mug1", MUG[0], 0, MUG[2], 0.11, (p) => floorMug(p, 1), { shadow: false });
  // shots 7-8: while the upload crawls, Dave waits by the desk, then falls asleep standing
  if (id === 7 && after(t, 27.6)) dave(cam, out, t, 3, DAVE_D[0], DAVE_D[2], { expr: ex(t, "smile", [[29.32, "neutral"], [31.86, "shock"]]), facing: -1 });
  if (id === 7) burst(out, t, 27.6, BOOTH_H[0], 1.3, BOOTH_H[2] + 0.5, 1.2, 0.25);
  if (id === 8) { const zz = after(t, 36.0); dave(cam, out, t, 3, DAVE_D[0], DAVE_D[2], { expr: zz ? "smile_closed" : "dazed", headTilt: zz ? 0.25 : 0, facing: -1 }); }
  if (id === 1) { burst(out, t, 3.18, BOOTH_H[0], 1.3, BOOTH_H[2] + 0.5, 1.6, 0.3); puff(out, t, 3.25, BOOTH_H[0], 0.8, BOOTH_H[2] + 0.5, 1.4); }
  if (id === 6) {
    const n = Math.round(4 + 26 * smooth((t - 23.6) / 2.2));
    swarm(cam, out, t, BOOTH_H, n);
    sweat(out, cam, t, 24.1, BOOTH_H[0], 1.5, BOOTH_H[2], { dur: 1.6 });
  }
  if (id === 13) {
    const pe = ex(t, "stern", [[60.14, "smile"]]);
    human(cam, out, 5, PHILOSOPHER, "phil", PHIL[0], 0, PHIL[2], { mode: "stand", expr: pe, facing: 1, wave: after(t, 60.4) ? 1 : 0 }, t);
    textCard(out, "calendar", { top: "PARFIT", text: "1984" }, PHIL[0] - 0.5, 1.95, -5.65, 0.62 * pop(f, 1775));
  }
  if (id === 14) {
    dave(cam, out, t, 2, DAVE2[0], DAVE2[2], { expr: ex(t, "dazed", [[62.38, "grin"], [64.22, "smile"]]), facing: 1 });
    puff(out, t, 65.1, BOOTH_H[0], 1.0, BOOTH_H[2] + 0.5, 1.4);
    if (!after(t, 65.1)) smoke(out, t, 64.4, BOOTH_H[0], 2.6, BOOTH_H[2], { dur: 1.0, w: 0.5, col: "#cfd6e0" });
  }
};
const HX = (dx: number) => dx; // the flat sits at x 0
const LXc = 200;                   // the lab's x

const lab = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  const sci = (i: number, p: V3, e: Expr, fc: -1 | 0 | 1) => human(cam, out, 10 + i, SCIENTIST, `sci${i}`, p[0], 0, p[2], { mode: "stand", expr: e, facing: fc }, t);
  if (id === 3) {
    sci(0, SCI1, ex(t, "whistle", [[11.16, "grin"]]), 1);
    human(cam, out, 11, SCIENTIST, "sci1", SCI2[0], 0, SCI2[2], { mode: "stand", expr: ex(t, "neutral", [[11.74, "laugh"]]), facing: -1, wave: after(t, 11.74) ? 1 : undefined }, t);
    textCard(out, "calendar", { top: "AUSTRIA", text: "1997" }, LXc - 4.8, 2.3, -8.6, 0.9 * pop(f, 213));
    glow(out, t, EMIT[0], EMIT[1], EMIT[2], { w: 0.5, col: "#ffd23f", pulse: 1 });
    if (photonK(f) > 0 && photonK(f) < 1) { const p = photonAt(f); card(cam, out, "photon", p[0], p[1] - 0.3, p[2], 0.32, (pp) => sparkle(pp), { shadow: false }); glow(out, t, p[0], p[1], p[2], { w: 0.6, col: "#fff3a0" }); }
    if (photonK(f) >= 1) glow(out, t, RECV[0], RECV[1], RECV[2], { w: 0.7, col: "#fff3a0", pulse: 1 });
    burst(out, t, 11.8, RECV[0], RECV[1], RECV[2] + 0.2, 0.7, 0.25);
  } else {
    sci(0, SCI1, ex(t, "smile", [[19.84, "shock"], [20.5, "pained"]]), 1);
    sci(1, SCI2, ex(t, "smile", [[18.06, "grin"]]), -1);
    // the original photon pops on "destroyed"; only a stream of information sparkles crosses to the copy
    if (!after(t, 19.84)) { card(cam, out, "photon", EMIT[0], EMIT[1] - 0.18, EMIT[2], 0.2, (pp) => sparkle(pp), { shadow: false }); glow(out, t, EMIT[0], EMIT[1], EMIT[2], { w: 0.6, col: "#fff3a0", pulse: 1 }); }
    burst(out, t, 19.84, EMIT[0], EMIT[1], EMIT[2] + 0.2, 1.0, 0.3);
    if (after(t, 19.84) && t < 21.2) card(cam, out, "redX", EMIT[0], EMIT[1] - 0.3, EMIT[2] + 0.3, 0.3, (p) => redX(p), { shadow: false });
    if (t > 17.3 && t < 20.4) for (let i = 0; i < 6; i++) {
      const u = ((t - 17.3) * 0.9 + i / 6) % 1, x = EMIT[0] + (RECV[0] - EMIT[0]) * u;
      card(cam, out, `bit${i % 2}`, x, EMIT[1] + 0.3 * Math.sin(u * Math.PI) - 0.08, EMIT[2], 0.08, (p) => sparkle(p), { shadow: false });
    }
    if (after(t, 18.3)) { card(cam, out, "photon", RECV[0], RECV[1] - 0.18, RECV[2], 0.2 * pop(f, 549), (pp) => sparkle(pp), { shadow: false }); glow(out, t, RECV[0], RECV[1], RECV[2], { w: 0.6, col: "#fff3a0", pulse: 1 }); }
  }
};

const mountain = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  if (id === 4) {
    card(cam, out, "dish", DISH[0], 0, DISH[2], 1.3, (p) => dish(p));
    human(cam, out, 30, PHOTOG, "eng", DISH[0] - 0.9, 0, DISH[2] + 0.9, { mode: "stand", expr: ex(t, "neutral", [[15.12, "grin"]]), facing: 1, wave: after(t, 15.5) ? 1 : 0 }, t);
    const s = satAt(f);
    card(cam, out, "sat", s[0], s[1], s[2], 3.2, (p) => satellite(p), { shadow: false });
    // the beam: pulses running from the dish up to the satellite
    if (after(t, 13.6)) for (let i = 0; i < 9; i++) {
      const u = ((t - 13.6) * 0.8 + i / 9) % 1, a: V3 = [DISH[0] + 0.4, 2.4, DISH[2]];
      glow(out, t, a[0] + (s[0] - a[0]) * u, a[1] + (s[1] + 2 - a[1]) * u, a[2] + (s[2] - a[2]) * u, { w: 0.6 + 2.2 * u, col: "#7dfff0", k: 0.9 });
    }
    textCard(out, "sign", { text: "2017", color: "#c9a46a" }, DISH[0] + 1.3, 0.9, DISH[2] - 0.4, 1.3);
  } else {
    // energy gathers into a Dave-shaped glow, blows up on "megatons", then a field of 30 bombs
    rain(out, t, cam, { n: 320, speed: 16 }); // storm rain: also keeps the sky-heavy frames moving for the motion gate
    const k = smooth((t - 38.8) / 3.2);
    if (!after(t, 42.18)) { glow(out, t, BLAST[0], 1.5 + 2 * k, BLAST[2], { w: 2 + 6 * k, h: 3 + 8 * k, col: "#ffd23f", k: 0.7 + 0.3 * k, pulse: 1 }); swarm(cam, out, t, BLAST, Math.round(8 + 22 * k), 1.2 + 1.6 * k, 0.35, 5); }
    explode(out, t, 42.18, BLAST[0], 0, BLAST[2], { w: 9 });
    for (let i = 0; i < 30; i++) {
      const col = i % 10, row = Math.floor(i / 10), x = BLAST[0] - 9 + col * 2 + (row % 2) * 1, z = BLAST[2] + 3 + row * 2.6;
      const t0 = 43.2 + i * 0.03, tb = 44.3 + (i % 10) * 0.09 + row * 0.12;
      if (after(t, t0) && !after(t, tb)) card(cam, out, `bomb${q((t * 2 + i * 0.1) % 1, 6)}`, x, 0, z, 0.55 * pop(f, t0 * FPS), (p) => bomb(p, (t * 2 + i * 0.1) % 1));
      explode(out, t, tb, x, 0, z, { w: 3 });
    }
  }
};

const tokyo = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  // street life: a small crowd and walkers on the far pavement
  for (let i = 0; i < 5; i++) {
    const v = i % 2 ? 1 : -1, x = TXw(t, i, v);
    human(cam, out, 40 + i, FOLK[i % 6], `f${i % 6}`, x, 0, -7.6 + (i % 2) * 0.5, { mode: "stroll", phase: stroll(t, i), expr: (["smile", "neutral", "grin"] as Expr[])[i % 3], facing: v as -1 | 1 }, t);
  }
  if (id === 2) {
    const g = smooth((t - 4.2) / 0.8) * (after(t, 5.9) ? 0.35 : 1);
    const k = smooth((t - 5.7) / 1.3);
    booth(cam, out, "T", BOOTH_T, 1, { glow: g, scan: t < 5.5 ? scanOf(t) : undefined, inside: after(t, 5.08) && k < 0.35 ? (z) => dave(cam, out, t, 1, BOOTH_T[0], z, { expr: "dazed" }) : undefined });
    // he walks out and sips his coffee... from an empty hand (the mug stayed at home)
    if (k >= 0.35) dave(cam, out, t, 1, BOOTH_T[0] + 2.0 * k, BOOTH_T[2] + 1.2 * k, { mode: k < 1 ? "stroll" : "stand", phase: stroll(t), expr: ex(t, "grin", [[6.4, "nervous"]]), facing: 1, prop: after(t, 6.2) ? "hand" : null });
    burst(out, t, 5.08, BOOTH_T[0], 1.3, BOOTH_T[2] + 0.5, 1.6, 0.3);
    foreground(cam, out, "post", { side: "left" });
  } else if (id === 10) {
    card(cam, out, "bin", BIN[0], 0, BIN[2], 0.5, (p) => atomBin(p));
    textCard(out, "label", { text: "SPARE ATOMS", color: "#fff6d6" }, BIN[0], 0.62, BIN[2] + 0.35, 0.75);
    const k = smooth((t - 46.7) / 0.9);
    // atoms hop from the bin into the booth, Dave builds up inside
    for (let i = 0; i < 10; i++) {
      const u = clamp01((t - 46.4 - i * 0.09) / 0.7);
      if (u <= 0 || u >= 1) continue;
      const ph = q((t * 4 + i) % 6.28, 6);
      card(cam, out, `atom${ph}|${i % 3}`, BIN[0] + (BOOTH_T[0] - BIN[0]) * u, 0.9 + 1.3 * Math.sin(Math.PI * u), BIN[2] + (BOOTH_T[2] - BIN[2]) * u + 0.3, 0.12, (p) => atom(p, ph, ["#7bd389", "#ffd23f", "#ef5d8f"][i % 3]), { shadow: false });
    }
    booth(cam, out, "T", BOOTH_T, 1, { glow: 0.3 + 0.7 * k, inside: after(t, 47.6) ? (z) => dave(cam, out, t, 1, BOOTH_T[0], z, { expr: "smile" }) : undefined });
    burst(out, t, 47.6, BOOTH_T[0], 1.3, BOOTH_T[2] + 0.5, 1.4, 0.3);
  } else if (id === 11) {
    booth(cam, out, "T", BOOTH_T, 1);
    dave(cam, out, t, 1, DAVE_T[0], DAVE_T[2], { expr: ex(t, "grin", [[50.58, "shock"], [51.94, "nervous"]]) });
    if (after(t, 50.58)) card(cam, out, "redX", DAVE_T[0] + 0.32, 0.9, DAVE_T[2] + 0.3, 0.25 * pop(f, 1517), (p) => redX(p), { shadow: false });
    textCard(out, "label", { text: "OLD DAVE ATOMS: 0", color: "#fff6d6" }, DAVE_T[0], 2.12, DAVE_T[2] - 0.1, 0.62 * pop(f, 1517));
    sweat(out, cam, t, 51.0, DAVE_T[0], 1.5, DAVE_T[2], { dur: 1.5 });
  } else {
    booth(cam, out, "T", BOOTH_T, 1);
    // cars blink out one after another on "traffic vanishes", a plane on "airports", the border door opens
    CARS.forEach(([x, z, col], i) => {
      const tv = 76.75 + i * 0.1, dx = 4 * (t - 76.75);
      if (!after(t, tv)) card(cam, out, `car${col}`, x + dx * (i % 2 ? -1 : 1), 0, z, 0.55, (p) => car(p, col), { mirror: i % 2 === 1 });
      puff(out, t, tv, x + 4 * (tv - 76.75) * (i % 2 ? -1 : 1), 0.4, z, 1.2);
    });
    card(cam, out, "plane", TX - 6 + 5 * (t - 76.6), 4.2 + 1.2 * Math.max(0, t - 77), 0.5, 1.6, (p) => plane(p), { shadow: false }); // takes off empty, low over the street
    const op = q(smooth((t - 79.1) / 0.5), 10);
    card(cam, out, `door${op}`, DOOR[0], 0, DOOR[2], 1.05, (p) => door(p, op));
    textCard(out, "sign", { text: "BORDER", color: "#c9a46a" }, DOOR[0], 2.55, DOOR[2] + 0.05, 1.5);
    burst(out, t, 79.3, DOOR[0], 1.2, DOOR[2] + 0.4, 1.2, 0.3);
    dave(cam, out, t, 50, DOOR[0] - 0.9 + 0.6 * clamp01((t - 79.3) / 1.2), DOOR[2] + 0.55, { mode: after(t, 79.3) ? "stroll" : "stand", phase: stroll(t), expr: after(t, 79.3) ? "grin" : "smile", facing: 1 });
  }
};
const TXw = (t: number, i: number, v: number) => {
  const span = 26, x0 = -13 + ((i * 5.3 + v * t * 0.9) % span + span) % span;
  return 600 + x0;
};

const square = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  BOOTHS_Q.forEach((b, i) => booth(cam, out, "Q", b, 2 + (i % 2), { glow: 0.2 + 0.2 * Math.sin(t * 3 + i) }));
  if (id === 15) {
    booth(cam, out, "Q", BOOTH_Q, 0, { glow: 0.3 });
    // commuters stroll to the booths and blink away
    for (let i = 0; i < 6; i++) {
      const t0 = 66.0 + i * 0.9, u = clamp01((t - t0) / 2.2), sx = QX - 6 + (i % 3) * 6, sz = 5 + (i % 2) * 2;
      const tx = BOOTH_Q[0] + (i % 3 - 1) * 0.3, tz = BOOTH_Q[2] + 0.8;
      if (u < 1) human(cam, out, 60 + i, FOLK[i % 6], `f${i % 6}`, sx + (tx - sx) * u, 0, sz + (tz - sz) * u, { mode: "stroll", phase: stroll(t, i), expr: "smile", facing: tx > sx ? 1 : -1 }, t);
      burst(out, t, t0 + 2.2, tx, 1.2, tz, 0.9, 0.25);
    }
    if (after(t, 69.0)) { const ang = q((t - 69) * 1.2, 30); card(cam, out, `clk${ang}`, QX - 2.4, 0.2, -4.6, 0.6 * pop(f, 2071), (p) => clock(p, ang), { shadow: false }); }
    if (after(t, 69.0)) textCard(out, "sign", { text: "1 HOUR A DAY", color: "#c9a46a" }, QX - 2.4, 2.0, -4.5, 1.4 * pop(f, 2071));
  } else if (id === 16) {
    booth(cam, out, "Q", BOOTH_Q, 0, { glow: 0.3 });
    // booths sprout all over the square
    for (let i = 0; i < 16; i++) {
      const t0 = 73.9 + i * 0.12, x = QX - 22 + hh(i, 3) * 44, z = -2 + hh(i, 4) * 18;
      if (after(t, t0)) booth(cam, out, "Q", [x, 0, z], i % 4, { glow: 0.3 });
      burst(out, t, t0, x, 1.3, z + 0.4, 1.4, 0.25);
    }
  } else {
    // the jam: the shredder smokes, the booth keeps printing Daves
    const jam = after(t, 81.42);
    card(cam, out, `shredQ${jam ? 1 : 0}`, SHRED_Q[0], 0, SHRED_Q[2], 0.42, (p) => shredder(p, jam ? 0.35 : q(clamp01((t - 80.2) / 1.4), 10), jam));
    if (jam) smoke(out, t, 81.42, SHRED_Q[0], 0.9, SHRED_Q[2], { dur: 6, w: 0.6, rate: 5, col: "#4a4450" });
    burst(out, t, 81.42, SHRED_Q[0], 0.8, SHRED_Q[2] + 0.3, 0.9, 0.25);
    const n = flood(f);
    booth(cam, out, "Q", BOOTH_Q, 0, { glow: n > 0 ? 0.6 + 0.4 * Math.sin(t * 12) : 0.3, scan: n > 0 ? scanOf(t * 3) : undefined });
    for (let j = 0; j < n; j++) {
      const born = 2468 + j * 3.2, u = smooth((f - born) / 12);
      const ring = Math.floor(Math.sqrt(j)), a = (hh(j, 7) - 0.5) * Math.PI * (0.5 + 0.12 * ring);
      const tx = BOOTH_Q[0] + Math.sin(a) * (1.4 + ring * 1.0), tz = BOOTH_Q[2] + 0.9 + Math.cos(a) * (0.9 + ring * 1.0);
      const x = BOOTH_Q[0] + (tx - BOOTH_Q[0]) * u, z = BOOTH_Q[2] + 0.6 + (tz - BOOTH_Q[2] - 0.6) * u;
      const bye = f >= 2588 + (j % 7) * 2; // the payoff: every Dave waves at the camera
      dave(cam, out, t, 100 + j, x, z, { mode: u < 1 ? "stroll" : "stand", phase: stroll(t, j), expr: bye ? "grin" : (["grin", "dazed", "shock", "smile", "nervous"] as Expr[])[j % 5], facing: u < 1 ? (tx > BOOTH_Q[0] ? 1 : -1) : 0, wave: bye && u >= 1 ? 1 : undefined });
      if (j % 3 === 0) burst(out, t, born / FPS, BOOTH_Q[0], 1.3, BOOTH_Q[2] + 0.5, 1.2, 0.2);
    }
  }
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const f = Math.round(t * FPS);
  if ([1, 6, 7, 8, 12, 13, 14].includes(id)) flat(cam, out, id, t, f);
  else if (id === 3 || id === 5) lab(cam, out, id, t, f);
  else if (id === 4 || id === 9) mountain(cam, out, id, t, f);
  else if ([2, 10, 11, 17].includes(id)) tokyo(cam, out, id, t, f);
  else square(cam, out, id, t, f);
  void QX;
  return out;
};
