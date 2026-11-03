// Staging of "dna-drive-v2": who and what is where, shot by shot, with reactions timed to the voice words
// (projects/dna-drive-v2/voice/words.json). Drawing, pooling, light and shadows are the director's (library/director/stage.ts).
import { Expr, FrontOpts } from "../../../library/engine/toon";
import { OFFICE, GUIDE, SCIENTIST } from "../../../library/cast/outfits";
import { dna, cell, usb, driveTower, tube, paperclip, clapper, monitor, pyramid, coins, clock, phone, priceTag, photo, sandwich, sparkle } from "../../../library/cast/science";
import { Stage, CamInfo, FOLK, human, card, burst, puff, after, q, hh } from "../../../library/director/stage";
import {
  FPS, HERO_H, MON, DNA_H, CELL, USB, PHOTO, WALK_Z, heroX, PL, TOWER_M, PL_OF, SCI, TUBES, heroVX, SX,
  pop, cellK, coinsN, splitK,
} from "./story";

const stroll = (t: number, i = 0) => q((t * 1.6 + i * 0.37) % 1, 24);
/** the expression at time t: the last step whose word has started (reactions land 2 f early) */
const ex = (t: number, first: Expr, steps: [number, Expr][]) => { let e = first; for (const [ts, x] of steps) if (after(t, ts)) e = x; return e; };

const hero = (cam: CamInfo, out: Stage, t: number, x: number, z: number, fo: FrontOpts) =>
  human(cam, out, 1, OFFICE, "hero", x, 0, z, { mode: "stand", ...fo }, t);

const home = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  const e: Expr = id === 1 ? ex(t, "neutral", [[0.68, "smile"], [2.48, "shock"]])
    : id === 2 ? ex(t, "nervous", [[3.24, "smile"], [5.66, "grin"]])
    : ex(t, "smile", [[73.4, "relief"], [74.4, "smile_closed"]]);
  hero(cam, out, t, HERO_H[0], HERO_H[2], { expr: e, facing: id === 2 && after(t, 5.66) ? -1 : 0 });
  card(cam, out, "mon0", MON[0], MON[1], MON[2], 0.3, (p) => monitor(p, false), { shadow: false });
  const k = id === 1 ? 0 : id === 2 ? pop(f, 170) : 1;
  if (k > 0) {
    const ph = q((t * 1.4) % (Math.PI * 2), 6);
    card(cam, out, `dnaH${ph}`, DNA_H[0], DNA_H[1], DNA_H[2], q(0.42 * k, 60), (p) => dna(p, ph), { shadow: false });
  }
  if (id === 2) burst(out, t, 5.66, DNA_H[0], 1.25, DNA_H[2] + 0.2, 0.8, 0.25);
  if (id === 17) burst(out, t, 73.4, DNA_H[0], 1.3, DNA_H[2] + 0.2, 0.7, 0.3);
};

/** a few small background cells drifting in the micro world */
const microCrowd = (cam: CamInfo, out: Stage, t: number) => {
  [[-3.6, -7.5], [3.4, -8], [-2.0, -10], [2.2, -11], [-5, -12]].forEach(([dx, dz], i) => {
    const y = q(0.15 + 0.12 * Math.sin(t * 1.1 + i * 2), 40);
    card(cam, out, `bgCell${i % 3}`, CELL[0] + dx, y, dz, 0.55 + 0.1 * (i % 3), (p) => cell(p, { file: i % 2 ? i % 3 : -1 }), { shadow: false });
  });
};

const body = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  microCrowd(cam, out, t);
  const by = q(0.08 * Math.sin(t * 1.3), 40);
  if (id === 3 || id === 4) {
    const file = !after(t, 8.74) ? -1 : after(t, 9.44) ? Math.floor((t - 9.44) / 0.35) % 3 : 1;
    const glow = after(t, 9.44) && t < 10.4;
    card(cam, out, `cell${file}${glow ? "g" : ""}`, CELL[0], by, CELL[2], q(1.25 * cellK(f), 60), (p) => cell(p, { file, glow }), { shadow: false });
    burst(out, t, 8.74, CELL[0], 2.6, CELL[2] + 0.4, 1.0, 0.25);
    if (id === 4) {
      const k = pop(f, 358) * cellK(f);
      if (k > 0) card(cam, out, "usb", USB[0], by, USB[2], q(0.75 * k, 60), (p) => usb(p, 0), { shadow: false });
      burst(out, t, 11.94, USB[0], 1.1, USB[2] + 0.3, 0.8, 0.25);
    }
  } else if (id === 14) {
    const s = q(splitK(f), 40);
    card(cam, out, `splitF${s}`, CELL[0], by, CELL[2], q(1.25 * (1 + 0.3 * s), 60), (p) => cell(p, { split: s, fit: true }), { shadow: false });
    puff(out, t, 58.88, CELL[0], 1.2, CELL[2] + 0.5, 1.4);
  } else {
    // the vacation photo mutates with each copy
    const v = after(t, 64.52) ? 2 : after(t, 61.32) ? 1 : 0;
    card(cam, out, "cellBackF", CELL[0] - 1.5, by, CELL[2] - 2.5, 1.0, (p) => cell(p, { split: 1, fit: true }), { shadow: false });
    card(cam, out, `photo${v}`, PHOTO[0], PHOTO[1] + by, PHOTO[2], 0.8, (p) => photo(p, v), { shadow: false });
    for (const t0 of [61.32, 64.52]) burst(out, t, t0, PHOTO[0] + 0.3, PHOTO[1] + 1.2, PHOTO[2] + 0.3, 1.0, 0.25);
  }
};

const street = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  const hx = heroX(f);
  const e: Expr = id === 5 ? "smile" : id === 6 ? ex(t, "smile", [[18.56, "grin"], [20.94, "shock"]]) : ex(t, "grin", [[24.26, "whistle"], [25.18, "lick"]]);
  human(cam, out, 1, OFFICE, "hero", hx, 0, WALK_Z, { mode: "stroll", phase: stroll(t), expr: e, facing: 1 }, t);
  // the lunch-time crowd on the pavement, wrapped into a 24 m window around the hero
  for (let i = 0; i < 14; i++) {
    const dz = [-1.4, -0.8, -2.2, 0.9, -1.8, -0.5][i % 6], v = (i % 2 ? 1 : -1) * (0.55 + 0.12 * (i % 3));
    const x0 = SX - 14 + i * 1.9 + hh(i, 3) * 0.8 + v * (t - 15);
    const x = ((((x0 - (hx - 12)) % 24) + 24) % 24) + hx - 12;
    if (Math.abs(x - hx) < (dz > 0 ? 1.6 : 0.9)) continue;
    human(cam, out, 20 + i, FOLK[i % 6], `f${i % 6}`, x, 0, WALK_Z + dz, { mode: "stroll", phase: stroll(t, i), expr: (["smile", "neutral", "smile_closed"] as Expr[])[i % 3], facing: v > 0 ? 1 : -1 }, t);
  }
  if (id === 6) {
    // each cell gets its own file, then the hero is carrying a skyline of drives
    [[-0.75, 2.35, 0, 540], [0, 2.6, 1, 548], [0.75, 2.35, 2, 556]].forEach(([dx, y, fl, a]) => {
      const k = pop(f, a) * (1 - pop(f, 628));
      if (k > 0) card(cam, out, `fc${fl}`, hx + dx, y, WALK_Z + 0.1, q(0.28 * k, 60), (p) => cell(p, { file: fl }), { shadow: false });
      if (f < 600) burst(out, t, a / FPS, hx + dx, y + 0.4, WALK_Z + 0.2, 0.45, 0.2);
    });
  }
  if (id >= 6) {
    const k = id === 6 ? pop(f, 628) : 1;
    if (k > 0) for (const s of [-1, 1]) {
      const bob = id === 7 ? q(0.06 * Math.abs(Math.sin(t * Math.PI * 1.6 + (s > 0 ? 1.6 : 0))), 40) : 0;
      card(cam, out, "tower8", hx + s * 1.35, bob, WALK_Z - 1.3, q(2.2 * k, 60), (p) => driveTower(p, 8));
    }
    if (id === 6) burst(out, t, 20.94, hx, 3.4, WALK_Z - 0.8, 2.0, 0.3);
  }
  if (id === 7 && after(t, 25.18)) card(cam, out, "sandwich", hx + 0.22, 0.62, WALK_Z + 0.15, 0.22, (p) => sandwich(p), { shadow: false });
};

const museum = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  const P = PL[PL_OF[id]];
  const he: Expr = id === 8 ? ex(t, "smile", [[31.06, "shock"], [33.48, "dazed"]]) : id === 9 ? ex(t, "neutral", [[36.0, "grin"]])
    : id === 10 ? ex(t, "neutral", [[40.88, "grin"]]) : id === 11 ? "smile" : id === 12 ? ex(t, "smile", [[48.86, "nervous"], [51.12, "dazed"]])
    : ex(t, "nervous", [[54.0, "shock"]]);
  const ge: Expr = id === 11 ? "grin" : id === 12 ? ex(t, "smile_closed", [[45.9, "nervous"]]) : id === 13 ? "laugh" : "smile";
  human(cam, out, 1, OFFICE, "hero", P[0] - 0.8, 0, -6.9, { mode: "stand", expr: he, facing: 1 }, t);
  human(cam, out, 2, GUIDE, "guide", P[0] + 0.8, 0, -7.0, { mode: "stand", expr: ge, facing: -1, wave: id === 11 && t < 44.0 ? q(Math.sin(t * 7), 20) : undefined }, t);
  // the exhibits (all of them, so the wide shots read as a museum)
  const top = 1.0;
  card(cam, out, "towerM", TOWER_M[0], 0, TOWER_M[2], 2.6, (p) => driveTower(p, 8));
  card(cam, out, "tubeM", PL[0][0] - 0.15, top, PL[0][2], 0.32, (p) => tube(p, 0.35), { shadow: false });
  const kc = id < 9 ? 0 : id === 9 ? pop(f, 1080) : 1;
  if (kc > 0) card(cam, out, "clipM", PL[0][0] + 0.25, top, PL[0][2] + 0.05, q(0.16 * kc, 60), (p) => paperclip(p), { shadow: false });
  if (id === 9) burst(out, t, 36.0, PL[0][0] + 0.25, 1.35, PL[0][2] + 0.2, 0.4, 0.25);
  const ok = id > 10 || (id === 10 && after(t, 40.88));
  card(cam, out, "clapM", PL[1][0] - 0.22, top, PL[1][2], 0.28, (p) => clapper(p), { shadow: false });
  card(cam, out, `monM${ok ? 1 : 0}`, PL[1][0] + 0.22, top, PL[1][2], 0.3, (p) => monitor(p, ok), { shadow: false });
  if (id === 10 && after(t, 40.88) && t < 41.9) card(cam, out, "spark", PL[1][0] + 0.22, top + 0.1, PL[1][2] + 0.15, q(0.3 * pop(f, 1226), 60), (p) => sparkle(p), { shadow: false });
  card(cam, out, "pyrM", PL[2][0], top, PL[2][2], 0.38, (p) => pyramid(p), { shadow: false });
  const n = id < 12 ? 2 : coinsN(f);
  card(cam, out, `coins${n}`, PL[3][0] - 0.22, top, PL[3][2], 0.3, (p) => coins(p, n), { shadow: false });
  const ang = id === 12 && after(t, 50.2) ? q(Math.min(t - 50.2, 1.9) * 14, 6) : 1.0;
  card(cam, out, `clock${ang}`, PL[3][0] + 0.25, top, PL[3][2], 0.26, (p) => clock(p, ang), { shadow: false });
  card(cam, out, "phoneM", PL[4][0] - 0.2, top, PL[4][2], 0.28, (p) => phone(p, 1), { shadow: false });
  const kt = id === 13 ? 1 + 0.7 * pop(f, 1599) : 1;
  card(cam, out, "tagM", PL[4][0] + 0.27, top, PL[4][2] + 0.05, q(0.3 * kt, 60), (p) => priceTag(p), { shadow: false });
  if (id === 13) burst(out, t, 53.3, PL[4][0] + 0.3, 1.5, PL[4][2] + 0.3, 0.6, 0.25);
  if (id === 12) burst(out, t, 48.86, PL[3][0] - 0.22, 1.5, PL[3][2] + 0.3, 0.6, 0.25);
  if (id === 8) burst(out, t, 32.88, PL[0][0] - 0.15, 1.35, PL[0][2] + 0.25, 0.5, 0.25);
};

const vault = (cam: CamInfo, out: Stage, t: number, f: number) => {
  human(cam, out, 3, SCIENTIST, "sci", SCI[0], 0, SCI[2], { mode: "stand", expr: ex(t, "smile", [[69.26, "stern"]]), facing: after(t, 69.26) ? 1 : 0 }, t);
  TUBES.forEach((p, i) => card(cam, out, `tubeV${i}`, p[0], p[1], p[2], 0.2, (pn) => tube(pn, 0.3 + 0.15 * i), { shadow: false }));
  puff(out, t, 67.78, TUBES[0][0] + 0.2, 1.2, TUBES[0][2] + 0.2, 0.8);
  if (f >= 2070) human(cam, out, 1, OFFICE, "hero", heroVX(f), 0, -1.7, { mode: "stand", expr: "nervous", facing: -1 }, t);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const f = Math.round(t * FPS);
  if (id <= 2 || id === 17) home(cam, out, id, t, f);
  else if (id <= 4 || id === 14 || id === 15) body(cam, out, id, t, f);
  else if (id <= 7) street(cam, out, id, t, f);
  else if (id <= 13) museum(cam, out, id, t, f);
  else vault(cam, out, t, f);
  return out;
};
