// Staging of "What If Animals Could Sue Humans": who is where doing what, shot by shot, with expressions timed to the
// voice words. Drawing, pooling, lighting and shadows are the director's (library/director/stage.ts).
import * as THREE from "three";
import { Expr, FrontOpts } from "../../../library/engine/toon";
import { smooth } from "../../../library/director/camera";
import { tripod, paperStack, dock, chair } from "../../../library/cast/critters";
import { PHOTOG, LAWYER, JUDGE, MJ, MLAW } from "../../../library/cast/outfits";
import { Stage, CamInfo, FOLK, human, card, critter, burst, puff, after, lidAt, hh, q, strikeK, LEAD } from "../../../library/director/stage";
import { easelSelfie } from "./props";
import {
  FPS, SHOTS_OF, WITNESS, MAN_T, MONK_T, LAWYER_T, EASEL_C, JUDGES, CRATES, TRIPOD, MONK_J, MAN_J, MONK_STEP,
  MJUDGE, MLAWYER, DOCK, CATWALL, EX, climbZ, stepY, monkJX, stackK, pop,
} from "./story";

const GAVEL = [24.1];
const tmp = new THREE.Vector3();

const judges = (cam: CamInfo, out: Stage, t: number, id: number, only?: number) => {
  JUDGES.forEach((p, v) => {
    if (only !== undefined && v !== only) return;
    let expr: Expr = "stern";
    if (id === 11) expr = after(t, 60.0) ? "dazed" : "nervous";
    const fo: FrontOpts = { mode: "stand", expr, facing: 0 };
    if (id === 5 && v === 1) fo.prop = ["hammer", q(strikeK(t, GAVEL), 30)];
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
  const manExpr: Expr = id === 3 && after(t, 15.38) && t < 16.04 - LEAD ? "grin" : id === 5 && after(t, 24.74) ? "smile_closed" : "smile";
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
  const talk = t > 48.3 - LEAD && t < 51.2;
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
  const s = SHOTS_OF(id), f = Math.round(t * FPS);
  if (s.set === "C") courtroom(cam, out, id, t, f);
  else if (s.set === "J") jungle(cam, out, id, t, f);
  else if (s.set === "E") exterior(cam, out, id, t, f);
  else square1519(cam, out, t);
  return out;
};
