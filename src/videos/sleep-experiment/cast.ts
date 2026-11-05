// Staging of "sleep-experiment" (v3): who and what is where, shot by shot, with reactions timed to the voice words
// (projects/sleep-experiment/voice/words.json). Every line gets an action that shows it (whispering at the grille,
// pointing at each other, clutching the head while screaming, tearing pages, pasting them, speaking into the mic).
// Shaking is meaningful only: people tremble in the beats where they are afraid, never all the time. Faces show fear;
// nobody smiles except the last prisoner, when the line says it smiled. Gore stays off screen.
import { Expr, FrontOpts, Outfit, Pen } from "../../../library/engine/toon";
import { PRISONER, PRISONER_GAUNT, SOVIET_SOLDIER, COMMANDER, SOV_SCIENTIST } from "../../../library/cast/outfits";
import { clock } from "../../../library/cast/science";
import {
  o2Dial, pistol, eyesDark, peakedCap, cigarette, speakerBox, headphones, openBook, sheetBody, foodTin, wallMic, handprint, shadowFigure,
  rope, tearBook, pagesOnGlass, standMic, paperedGlass,
} from "../../../library/cast/sinister";
import { Stage, CamInfo, human, card, after, q, hh } from "../../../library/director/stage";
import { glow, smoke, sweat, textCard } from "../../../library/director/fx";
import { foreground, screenAt } from "../../../library/director/people";
import {
  FPS, V3, P, VENT, VENT_L, PORT_L, DOOR, CLOCK, CAL, screamerAt, LISTEN, ATMIC, CMDR_R, SOLD_R, DIAL, RPORT, RMIC, CORR, GAUNT, SHEET,
  CMDR_C, SCI_C, LAST, GUARD_C, CAP_AT, KIDP, UNDER, LAMP, TINS, W4, BETRAY, ROPE, BOWED, HOARSE, TEAR, smooth, clamp01, easeOut,
} from "./story";

const GAS = "#c4e0a8";
const W = (f: number) => f / FPS; // word frame -> seconds
/** the expression at time t: the last step whose word (frame) has started */
const ex = (t: number, first: Expr, steps: [number, Expr][]) => { let e = first; for (const [fr, x] of steps) if (after(t, W(fr))) e = x; return e; };
/** a talking mouth inside [a, b) frames: cycles shut / small / open about every 3 frames; outside the span, no override */
const talk = (f: number, a: number, b: number, i = 0) => (f >= a && f < b ? ["dash", "o", "O", "o"][Math.floor(hh(Math.floor(f / 3), i) * 4)] : undefined);
type Act = { tremble?: number; twitch?: boolean };
/** a person with a slow natural sway; `act.tremble` (0..1) shakes them only in the beats where they are afraid, and
 *  `act.twitch` gives the sleepless an occasional head snap (about once every 2 s, 4 frames long) */
const person = (cam: CamInfo, out: Stage, i: number, o: Outfit, key: string, p: V3, fo: FrontOpts, t: number, act: Act = {}) => {
  const f = Math.round(t * FPS), slot = Math.floor(f / 4), jerk = act.twitch && hh(slot, i + 7) > 0.93 ? (hh(slot, i + 9) > 0.5 ? 0.32 : -0.32) : 0;
  const tr = 0.016 * (act.tremble ?? 0), jx = tr * Math.sin(f * 2.3 + i * 3), jz = tr * 0.5 * Math.cos(f * 1.7 + i);
  human(cam, out, i, o, key, p[0] + jx, p[1], p[2] + jz, {
    mode: "stand", ...fo,
    headTilt: q((fo.headTilt ?? 0) + 0.04 * Math.sin(t * 1.3 + i * 1.3) + jerk, 40), look: q(fo.look ?? 0.25 * Math.sin(t * 0.7 + i), 10),
  }, t);  // prisoners wear a numbered patch on the chest (subject 1-5)
  const n = Math.max(PRISONER.indexOf(o), PRISONER_GAUNT.indexOf(o));
  if (n >= 0 && fo.arms !== "hold" && fo.arms !== "knees") textCard(out, "label", { text: String(n + 1), color: "#e8e2cc", ink: "#2a1a10" }, p[0] + jx + 0.06, p[1] + (fo.mode === "sit" ? 0.62 : 0.98), p[2] + jz + 0.06, 0.1);
};
/** fear that comes in a beat: full tremble from `from`, easing out over `dur` frames */
const beat = (f: number, from: number, dur = 45) => (f >= from ? Math.max(0, 1 - (f - from) / dur) : 0);
const pris = (i: number) => PRISONER[i % 5], gaunt = (i: number) => PRISONER_GAUNT[i % 5];
const SCI = SOV_SCIENTIST[0];
const gas = (out: Stage, t: number, v: V3, k = 1, t0 = -2) =>
  smoke(out, t, t0, v[0], v[1] - 0.15, v[2] + 0.3, { dur: 120, w: 0.75 * k, col: GAS, rate: 6, rise: -0.35, drift: [-0.25 * Math.sign(v[0] || 1), 0.35] });
const haze = (out: Stage, t: number, n = 8, y = 2.6) => {
  for (let i = 0; i < n; i++) glow(out, t, -3.5 + (i / (n - 1)) * 7 + 0.3 * Math.sin(t * 0.4 + i), y + 0.25 * Math.sin(i * 1.7), -5.2 + 3.6 * hh(i, 3), { w: 2.2, h: 1.0, col: GAS, k: 0.2 });
};
const wallClock = (cam: CamInfo, out: Stage, ang: number) =>
  card(cam, out, `clk${q(ang, 4)}`, CLOCK[0], CLOCK[1] - 0.72, CLOCK[2] + 0.03, 0.33, (p) => clock(p, ang), { shadow: false });
const calendar = (out: Stage, day: string, x = CAL[0], y = CAL[1], z = CAL[2]) => textCard(out, "calendar", { top: "DAY", text: day }, x, y, z + 0.02, 0.56);
/** a card whose design point (300, cy) sits at world point p (scale s) */
const at = (cam: CamInfo, out: Stage, key: string, p: V3, s: number, cy: number, draw: (pp: Pen) => void) =>
  card(cam, out, key, p[0], p[1] - ((975 - cy) / 1000) * 2.16 * s, p[2], s, (pp) => draw(pp), { shadow: false });
const wallShadow = (out: Stage, key: string, x: number, z: number, h = 3.2, reach = 0, sway = 0) =>
  out.fx.push({ key: `shadow|${key}|${q(reach, 8)}`, cw: 300, ch: 500, soft: true, x: x + sway, y: h / 2 + 0.05, z, w: h * 0.6, h, draw: (pp) => { pp.g.scale(0.5, 0.5); shadowFigure(pp, reach); } });
const onRay = (cam: CamInfo, p: V3, d: number): [V3, number] => {
  const dx = p[0] - cam.pos.x, dy = p[1] - cam.pos.y, dz = p[2] - cam.pos.z, L = Math.hypot(dx, dy, dz), k = d / L;
  return [[cam.pos.x + dx * k, cam.pos.y + dy * k, cam.pos.z + dz * k], k];
};
const screenV = (cam: CamInfo, sx: number, sy: number, d: number): V3 => { const v = screenAt(cam, sx, sy, d); return [v.x, v.y, v.z]; };
const near = (cam: CamInfo, out: Stage, key: string, p: V3, d: number, s: number, cy: number, draw: (pp: Pen) => void) => {
  const [r, k] = onRay(cam, p, d), sc = s * k;
  card(cam, out, key, r[0], r[1] - ((975 - cy) / 1000) * 2.16 * sc, r[2], sc, (pp) => draw(pp), { shadow: false });
};
const dim = (cam: CamInfo, out: Stage, k: number) => {
  const c = screenAt(cam, 0.5, 0.5, 0.6), a = q(k, 10);
  out.fx.push({ key: `dim|${a}`, cw: 16, ch: 16, soft: true, x: c.x, y: c.y, z: c.z, w: 2, h: 3, draw: (p) => { p.g.fillStyle = `rgba(5,4,10,${a})`; p.g.fillRect(0, 0, 16, 16); } });
};
/** head height of a standing adult card */
const HY = 1.42;

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const f = Math.round(t * FPS);
  const bulbs = (k = 1) => { glow(out, t, -1.6, 2.75, -2.6, { w: 0.9, col: "#ffd27a", k: 0.8 * k, pulse: 0.2 }); glow(out, t, 1.6, 2.75, 0.6, { w: 0.9, col: "#ffd27a", k: 0.8 * k, pulse: 0.2 }); };
  switch (id) {
    case 1: { // HOOK: through the observation porthole, gas swirls; a hollow-eyed face rises out of it, stares, and on
      // "locked" its palms slam the glass
      for (let k = 0; k < 6; k++) glow(out, t, RPORT[0] + 0.5 * Math.sin(t * 1.3 + k * 2), RPORT[1] + 0.4 * Math.cos(t * 0.9 + k), -4.47, { w: 0.9, col: GAS, k: 0.55 });
      const rise = easeOut(clamp01(f / 55)), slam = f >= 62;
      person(cam, out, 12, gaunt(1), "g1", [RPORT[0] + 0.05, -0.55 + 0.85 * rise, -4.42], { expr: slam ? "hollowPlead" : "hollow", facing: 0, blink: 0, arms: slam ? "press" : undefined, armK: slam ? 1 : 0 }, t);
      if (f >= 64) card(cam, out, `hand|${q(clamp01((f - 70) / 25), 6)}`, RPORT[0] + 0.12, RPORT[1] - 0.95, -4.33, 0.55, (pp) => handprint(pp, clamp01((f - 70) / 25)), { shadow: false });
      foreground(cam, out, "shoulder", { side: "right", d: 0.9, col: "#e4e0d0", hair: "#2e2620" });
      glow(out, t, RPORT[0], RPORT[1], -4.2, { w: 2.0, col: "#5f9a46", k: 0.35, pulse: 0.5 });
      break;
    }
    case 2: { // gas pours on them; they look up, two cover their mouths with their sleeves; the snap-in: eyes wide
      gas(out, t, VENT, 1.2, -4); gas(out, t, VENT_L, 1.2, -4); haze(out, t, 8, 2.6); bulbs();
      P.forEach((p, i) => person(cam, out, i + 1, pris(i), "p" + i, p, {
        expr: ex(t, i % 2 ? "fear" : "weary", [[150, "fear"]]), facing: 0, headTilt: -0.1, look: (2 - i) * 0.2,
        arms: i === 1 || i === 3 ? "cover" : undefined,
      }, t, { tremble: f >= 150 ? 0.5 : 0 }));
      break;
    }
    case 3: { // the deal: 30 DAYS held to the glass; the calendar flips DAY 1 -> 4; a prisoner looks at it, hoping
      bulbs(); haze(out, t, 5, 2.9);
      if (f < 300) textCard(out, "label", { text: "30 DAYS", color: "#f4efe0", ink: "#a8282c" }, PORT_L[0], PORT_L[1] + 0.02, PORT_L[2] + 0.12, 0.5);
      calendar(out, String(f < 300 ? 1 : Math.min(4, 1 + Math.floor((f - 300) / 15))));
      person(cam, out, 2, pris(1), "p1", [-1.55, 0, -4.95], { expr: ex(t, "weary", [[247, "hope"]]), facing: -1, look: -0.6 }, t);
      if (f > 300) person(cam, out, 3, pris(3), "p3", [-0.6, 0, -5.4], { mode: "sit", expr: "neutral", facing: -1, arms: "hold" }, t);
      if (f > 300) at(cam, out, "book3", [-0.6, 0.62, -5.3], 0.2, 860, (pp) => openBook(pp, "#3e5a6a"));
      break;
    }
    case 4: { // day five, close: a mouth at the grille, whispering, eyes darting to the side
      calendar(out, "5", W4[0] - 0.9, 2.35, -5.9);
      at(cam, out, "grille4", [W4[0] + 0.21, HY - 0.04, W4[2] + 0.16], 0.13, 510, (pp) => wallMic(pp));
      person(cam, out, 1, pris(0), "p0", W4, { expr: "whisper", facing: 1, look: Math.floor(f / 18) % 2 ? 0.9 : -0.6, mouth: talk(f, 402, 430, 1) ?? "o", headTilt: 0.12 }, t);
      break;
    }
    case 5: { // betraying each other: two informers at their grilles, each pointing at the other while whispering
      BETRAY.forEach((p, k) => {
        const s = k ? 1 : -1;
        at(cam, out, "grille5" + k, [p[0] + s * 0.36, HY + 0.02, p[2] + 0.05], 0.13, 510, (pp) => wallMic(pp));
        person(cam, out, 1 + k, pris(k + 2), "pb" + k, p, {
          expr: ex(t, "grim", [[460 + 6 * k, "whisper"]]), facing: s as -1 | 1, look: -s * 0.8,
          arms: after(t, W(460 + 6 * k)) ? "point" : undefined, armK: -s, mouth: talk(f, 462 + 6 * k, 491, k),
        }, t);
      });
      break;
    }
    case 6: { // day nine: clutching his head, screaming from the throat, staggering; the clock spins three hours
      bulbs(); calendar(out, "9"); haze(out, t, 4, 3.0);
      wallClock(cam, out, q(Math.max(0, Math.min(1, (f - 535) / 70)) * Math.PI * 6, 60));
      const sp = screamerAt(f);
      person(cam, out, 1, pris(4), "p4", sp, {
        mode: "stroll", phase: q((t * 1.4) % 1, 24), expr: "terror", facing: Math.cos((f - 491) / 60 * 1.4) > 0 ? 1 : -1,
        arms: "head", armK: Math.sin(f / 3), headTilt: -0.2 + 0.12 * Math.sin(f / 7), tilt: 6 * Math.sin(f / 11),
      }, t, { tremble: 0.7 });
      [[-1.25, -4.6], [0.9, -5.0]].forEach(([x, z], k) => person(cam, out, 2 + k, pris(k), "p" + k, [x, 0, z], { mode: "sit", expr: "weary", facing: 0, headDrop: 1, arms: "knees" }, t));
      break;
    }
    case 7: { // his voice tears: a rope frays and snaps on "tore"
      const fray = clamp01((f - 612) / 17), snap = clamp01((f - 629) / 25);
      at(cam, out, `rope|${q(fray, 10)}|${q(snap, 12)}`, [ROPE[0], 1.15, ROPE[2]], 0.55, 500, (pp) => rope(pp, fray, snap));
      glow(out, t, ROPE[0], 1.15, ROPE[2] - 0.2, { w: 1.6, col: "#ffd27a", k: 0.35 });
      break;
    }
    case 8: { // the others didn't even look up: three sit hugging their knees, heads bowed; behind them the screamer,
      // voiceless, holds his throat
      BOWED.forEach((p, k) => person(cam, out, 2 + k, pris(k), "pw" + k, p, { mode: "sit", expr: "weary", facing: 0, headDrop: 1, arms: "knees" }, t));
      person(cam, out, 1, pris(4), "p4", HOARSE, { expr: "plead", facing: 0, arms: "throat", headTilt: 0.1 }, t, { tremble: 0.4 });
      bulbs(0.8);
      break;
    }
    case 9: { // two of them tear pages out of their books, one rip after another
      TEAR.forEach((p, k) => {
        const rips = k ? [741, 772] : [728, 757, 783], last = rips.filter((r) => f >= r - 14).pop() ?? rips[0];
        const kk = clamp01((f - (last - 14)) / 18);
        person(cam, out, 1 + k, pris(k + 1), "pt" + k, p, { expr: "grim", facing: k ? -1 : 1, look: 0, arms: "hold", armK: kk, headTilt: 0.15 }, t);
        at(cam, out, `tear${k}|${q(kk, 12)}`, [p[0], 0.98, p[2] + 0.14], 0.2, 830, (pp) => tearBook(pp, kk));
      });
      bulbs(0.9);
      break;
    }
    case 10: { // from the observation room: behind the glass a prisoner smears each page and presses it on; the view
      // disappears page by page until the glass is covered
      const n = Math.max(0, Math.min(9, Math.floor((f - 788) / 9))), smear = Math.sin(f / 2.5);
      for (let k = 0; k < 3; k++) glow(out, t, RPORT[0] + 0.4 * Math.sin(t + k * 2), RPORT[1] + 0.3 * Math.cos(t * 0.7 + k), -4.47, { w: 0.9, col: "#ffcf7a", k: 0.4 * (1 - n / 10) });
      person(cam, out, 12, pris(1), "pp1", [RPORT[0] + 0.05, 0.3, -4.42], { expr: "grim", facing: 0, look: 0, arms: "press", armK: 0.5 + 0.5 * smear }, t);
      card(cam, out, `pages|${n}`, RPORT[0], RPORT[1] - 0.95, -4.33, 0.6, (pp) => pagesOnGlass(pp, n), { shadow: false });
      if (n >= 9) dim(cam, out, 0.35);
      foreground(cam, out, "shoulder", { side: "left", d: 0.9, col: "#e4e0d0", hair: "#8f8a86" });
      break;
    }
    case 11: { // silence; the scientist listens at the covered glass, a hand on his headphones; BANG: he recoils
      card(cam, out, "papered", RPORT[0], RPORT[1] - 0.9, RPORT[2] + 0.06, 0.78, (p) => paperedGlass(p), { shadow: false });
      if (f >= 935) { const sl = clamp01((f - 940) / 40); card(cam, out, `bang|${q(sl, 8)}`, RPORT[0] - 0.1, RPORT[1] - 0.95, RPORT[2] + 0.09, 0.55, (pp) => handprint(pp, sl), { shadow: false }); }
      const back = f >= 936 ? easeOut(clamp01((f - 936) / 8)) : 0;
      person(cam, out, 1, SCI, "sci", [LISTEN[0] + 0.35 * back, 0, LISTEN[2] + 0.25 * back], {
        expr: ex(t, "grim", [[936, "terror"], [975, "fear"]]), facing: -1, arms: f < 936 ? "ear" : undefined, headTilt: f < 936 ? 0.12 : f < 960 ? -0.2 : 0,
      }, t, { tremble: beat(f, 936, 60) });
      if (f < 936) card(cam, out, "phones", LISTEN[0], 0.98, LISTEN[2] + 0.06, 0.5, (p) => headphones(p), { shadow: false });
      person(cam, out, 2, SOV_SCIENTIST[1], "sci2", [RPORT[0] - 1.4, 0, -2.4], { expr: ex(t, "grim", [[936, "fear"]]), facing: 1 }, t, { tremble: beat(f, 936, 40) * 0.6 });
      const needle = 0.45 + 0.6 * smooth((f - 1040) / 80) + 0.02 * Math.sin(t * 30) * (f > 1100 ? 1 : 0);
      card(cam, out, `o2|${q(needle, 40)}`, DIAL[0], DIAL[1] - 0.295, DIAL[2] + 0.04, 0.3, (p) => o2Dial(p, needle), { shadow: false });
      if (f > 1100) glow(out, t, DIAL[0], DIAL[1] + 0.06, DIAL[2] + 0.08, { w: 0.35, col: "#ff5a4a", k: 0.6, pulse: 1 });
      break;
    }
    case 12: { // day fourteen: the scientist steps up to the mic; the commander points him to it, soldiers behind
      card(cam, out, "papered", RPORT[0], RPORT[1] - 0.9, RPORT[2] + 0.06, 0.78, (p) => paperedGlass(p), { shadow: false });
      calendar(out, "14", RPORT[0] - 1.75, 2.15, RPORT[2] + 0.03);
      const step = smooth((f - 1150) / 30);
      person(cam, out, 1, SCI, "sci", [ATMIC[0] + 0.5 * (1 - step), 0, ATMIC[2] + 0.4 * (1 - step)], { expr: "grim", facing: -1, mode: f > 1150 && f < 1180 ? "stroll" : "stand", phase: q((t * 1.6) % 1, 24) }, t);
      at(cam, out, "mic12", [RMIC[0], 1.28, RMIC[2] + 0.2], 0.2, 500, (pp) => standMic(pp));
      person(cam, out, 5, COMMANDER, "cmd", CMDR_R, { expr: "grim", facing: -1, arms: after(t, W(1185)) ? "point" : undefined, armK: -1 }, t);
      SOLD_R.forEach((p, k) => person(cam, out, 6 + k, SOVIET_SOLDIER[k], "so" + k, p, { expr: "grim", facing: k ? 1 : -1 }, t));
      break;
    }
    case 13: { // "we're coming in" spoken into the mic, the mouth moving with the words
      at(cam, out, "mic13", [ATMIC[0] + 0.08, 1.22, ATMIC[2] + 0.32], 0.2, 500, (pp) => standMic(pp));
      person(cam, out, 1, SCI, "sci", ATMIC, { expr: "grim", facing: -1, look: -0.2, mouth: talk(f, 1211, 1240, 3) ?? "dash" }, t);
      break;
    }
    case 14: { // a calm voice answers: the speaker grille crackles and throbs
      const k = f >= 1262 ? 0.5 + 0.5 * Math.sin(f * 1.3) : 0;
      at(cam, out, `spk14|${q(k, 6)}`, [RMIC[0] - 0.55, 1.37, RMIC[2] + 0.5], 0.16, 530, (pp) => speakerBox(pp, k));
      glow(out, t, RMIC[0] - 0.55, 1.37, RMIC[2] + 0.45, { w: 0.6, col: "#ffcf7a", k: 0.25 * k });
      break;
    }
    case 15: { // "we don't want to come out anymore": the scientist freezes, the soldier's cigarette falls from his lips
      const k = f < 1330 ? 0.5 + 0.5 * Math.sin(f * 1.3) : 0;
      at(cam, out, `spk15|${q(k, 6)}`, [ATMIC[0] - 0.45, 1.15, ATMIC[2] + 0.55], 0.12, 530, (pp) => speakerBox(pp, k));
      person(cam, out, 1, SCI, "sci", ATMIC, { expr: ex(t, "fear", [[1322, "terror"]]), facing: -1 }, t, { tremble: beat(f, 1322, 40) });
      if (after(t, W(1305))) sweat(out, cam, t, W(1307), ATMIC[0], 1.5, ATMIC[2], { side: -1 });
      person(cam, out, 6, SOVIET_SOLDIER[0], "so0", [ATMIC[0] + 0.5, 0, ATMIC[2] - 0.35], { expr: ex(t, "grim", [[1305, "fear"]]), facing: -1 }, t);
      const fall = clamp01((f - 1317) / 14);
      card(cam, out, `cig|${fall > 0 ? 0 : 1}`, ATMIC[0] + 0.47, 1.33 - 1.3 * fall * fall, ATMIC[2] - 0.12, 0.05, (p) => cigarette(p, fall > 0.6 ? 0 : 1), { shadow: false });
      break;
    }
    case 16: { // the door opens: one soldier throws an arm over his face, the other screams
      const open = smooth((f - 1366) / 18);
      if (open > 0.15) CORR.forEach((p, k) => person(cam, out, 6 + k, SOVIET_SOLDIER[k + 1], "so" + (k + 1), p, {
        expr: ex(t, "grim", [[1400, k ? "terror" : "fear"]]), facing: 0, arms: k === 0 && after(t, W(1402)) ? "cover" : undefined, headTilt: after(t, W(1405)) ? -0.15 : 0,
      }, t, { tremble: beat(f, 1402, 34) }));
      glow(out, t, DOOR[0], 1.1, DOOR[2] - 1.6, { w: 1.4 * open + 0.01, h: 2.4, col: "#ffcf7a", k: 0.45 * open });
      break;
    }
    case 17: { // the flooded floor, the drain, a sheet over one of them
      card(cam, out, "sheet", SHEET[0], SHEET[1], SHEET[2], 0.7, (p) => sheetBody(p));
      glow(out, t, 0.9, 0.08, -3.6, { w: 1.6, h: 0.3, col: "#ffcf7a", k: 0.55 });
      glow(out, t, 0.4, 0.07, -1.2, { w: 0.9, h: 0.25, col: "#14201e", k: 0.8, pulse: 0.6 });
      glow(out, t, DOOR[0], 1.1, DOOR[2] + 0.2, { w: 1.4, h: 2.4, col: "#ffcf7a", k: 0.6 });
      break;
    }
    case 18: { // ten days of food untouched; they shuffle toward the vent and reach up, begging for the gas
      gas(out, t, VENT_L, 0.5, W(1680)); haze(out, t, 4, 3.1);
      const crawl = smooth((f - 1550) / 160);
      wallShadow(out, "g18", -2.2, -5.92, 3.4, smooth((f - 1627) / 25), 0.1 * Math.sin(t * 2));
      GAUNT.forEach((p, k) => person(cam, out, 11 + k, gaunt(k), "g" + k, [p[0], 0, p[2] + 0.5 * crawl], {
        expr: ex(t, "hollow", [[1627, "hollowPlead"]]), facing: k < 2 ? 1 : -1, headTilt: after(t, W(1680)) ? -0.22 : 0,
        arms: after(t, W(1627 + 5 * k)) ? "reach" : undefined, armK: 0.5 + 0.5 * Math.sin(f / 6 + k), look: k < 2 ? 0.4 : -0.4,
      }, t, { twitch: true }));
      [0, 1, 2].forEach((v) => card(cam, out, "tin" + v, TINS[0] + 0.7 + v * 0.22, 0, TINS[2] + 0.9 + 0.1 * v, 0.09, (p) => foodTin(p, v)));
      break;
    }
    case 19: { // sealed in again: the commander points at the door, the guards shove the scientist in, the door clangs
      person(cam, out, 5, COMMANDER, "cmd", CMDR_C, { expr: "grim", facing: -1, arms: after(t, W(1736)) ? "point" : undefined, armK: -1 }, t);
      const shove = smooth((f - 1797) / 20);
      person(cam, out, 1, SCI, "sci", [SCI_C[0] - 0.25 * shove, 0, SCI_C[2] - 0.6 * shove], {
        expr: ex(t, "fear", [[1807, "terror"]]), facing: 1, headTilt: after(t, W(1820)) ? 0.2 : 0,
      }, t, { tremble: beat(f, 1807, 50) });
      GUARD_C.forEach((p, k) => person(cam, out, 6 + k, SOVIET_SOLDIER[k], "so" + k, p, { expr: "grim", facing: k ? -1 : 1 }, t));
      person(cam, out, 12, gaunt(1), "g1", LAST, { expr: "hollow", facing: 0 }, t, { twitch: true });
      wallShadow(out, "last19", LAST[0] + 0.3, -5.92, 3.0, 0, 0.05 * Math.sin(t * 3));
      break;
    }
    case 20: { // the pistol comes up shaking and fires; the commander's cap rolls across the wet floor
      if (f < 1912) {
        const up = easeOut(clamp01((f - 1866) / 16)), fl = f >= 1903 && f < 1907 ? 1 - (f - 1903) / 4 : 0, sh = f < 1903 ? 0.012 * Math.sin(f * 2.1) : 0;
        person(cam, out, 1, SCI, "sci", SCI_C, { expr: ex(t, "fear", [[1869, "grim"]]), facing: 1 }, t, { tremble: f < 1903 ? 0.4 : 0 });
        card(cam, out, `pistol|${q(fl, 4)}`, SCI_C[0] + 0.35 + sh, 0.35 + 0.55 * up, SCI_C[2] + 0.35, 0.3, (p) => pistol(p, fl), { shadow: false });
        if (fl > 0) glow(out, t, SCI_C[0] + 0.6, 1.0, SCI_C[2] + 0.3, { w: 1.5, col: "#fff3b0", k: fl });
      } else {
        const c = CAP_AT(f);
        card(cam, out, "cap", c[0], c[1], c[2], 0.16, (p) => peakedCap(p), { shadow: false });
        glow(out, t, 0.9, 0.08, -3.6, { w: 1.6, h: 0.3, col: "#ffcf7a", k: 0.5 });
      }
      break;
    }
    case 21: { // over the shaking pistol: "what are you?" and it smiles
      foreground(cam, out, "shoulder", { side: "left", d: 0.9, col: "#e4e0d0", hair: "#2e2620" });
      near(cam, out, "pistolAim", screenV(cam, 0.2 + 0.006 * Math.sin(f * 2.3), 0.7, 1.6), 0.55, 0.16, 560, (p) => pistol(p, 0));
      person(cam, out, 12, gaunt(1), "g1", LAST, { expr: ex(t, "hollow", [[2040, "hollowGrin"]]), facing: 0 }, t);
      wallShadow(out, "last21", LAST[0] + 0.4, -5.92, 3.4, smooth((f - 2040) / 12) * 0.6, 0.06 * Math.sin(t * 3));
      bulbs(0.6);
      break;
    }
    case 22: { // the grin fills the frame; the bulb dies; the eyes last
      const fl = f > 2090 && (Math.floor(f / 3) * 7) % 11 < 3 ? 0.2 : 1;
      person(cam, out, 12, gaunt(1), "g1", LAST, { expr: "hollowGrin", facing: 0, blink: 0 }, t);
      glow(out, t, LAST[0] + 0.6, 2.2, LAST[2] + 0.4, { w: 1.2, col: "#ffd27a", k: 0.7 * fl });
      const dark = clamp01((f - 2140) / 12);
      if (dark > 0) { dim(cam, out, 0.93 * dark); near(cam, out, "lastEyes", [LAST[0], 1.445, LAST[2] + 0.2], 0.4, 0.2, 510, (p) => eyesDark(p, 1, false)); }
      break;
    }
    case 23: { // sleep tight: the lamp clicks off, two eyes open under the bed, then lunge
      person(cam, out, 30, { jacket: "#6a8ac9", pants: "#6a8ac9", boots: "#f4f1ea", hat: "hair", hair: "#5a3b2a", build: "kid" }, "kid", KIDP,
        { mode: "sit", expr: "neutral", facing: 0, blink: 1, headTilt: 0.12 }, t);
      if (!after(t, W(2189))) glow(out, t, LAMP[0], LAMP[1] + 0.36, LAMP[2] + 0.1, { w: 1.6, col: "#ffd890", k: 0.8 });
      const off = clamp01((f - 2189) / 5), eyes = clamp01((f - 2204) / 8), lunge = clamp01((f - 2246) / 10) ** 2;
      if (off > 0) dim(cam, out, 0.5 * off);
      if (eyes > 0) near(cam, out, `eyes|${q(eyes, 8)}`, UNDER, 0.4 - 0.3 * lunge, 0.42 * (1 + 4 * lunge), 510, (p) => eyesDark(p, eyes, false));
      break;
    }
  }
  return out;
};
