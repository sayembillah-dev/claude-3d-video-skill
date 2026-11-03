// Staging of "What If You Could Store Files in Your DNA?": who and what is where, shot by shot, with reactions timed to
// the voice words (projects/dna-drive/voice/words.json frames). Drawing, pooling and lighting are the director's.
import { Expr } from "../../../library/engine/toon";
import { SKINS, INK, Outfit } from "../../../library/engine/toon";
import { Stage, CamInfo, FOLK, human, card, burst, puff, after, q } from "../../../library/director/stage";
import { dna, cell, usb, hardDrive, driveTower, tube, paperclip, clapper, monitor, pyramid, coins, clock, phone, priceTag, photo, fridge, sandwich, sparkle, redX } from "../../../library/cast/science";
import { FPS, SHOTS_OF, MX, SX, ME, FIELD, fieldN, pourK, coinsN, walkX, splitK, smooth, easeOut, clamp01 } from "./story";

const ME_O: Outfit = { jacket: "#e0675a", pants: "#3a4a6a", boots: INK, hat: "cap", cap: "#f2c14e", skin: SKINS[3] };
const COAT = (hair: string, skin: string): Outfit => ({ jacket: "#f4f6f8", pants: "#3b4a63", boots: INK, hat: "hair", hair, skin, buttons: "#9aa6b4" });
const SCI1 = COAT("#4a3020", SKINS[1]), SCI2 = COAT("#c9c4bc", SKINS[0]);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** pop-in scale 0 -> 1 with overshoot, starting at frame `at` */
const pop = (f: number, at: number) => { const u = clamp01((f - at + 2) / 7); return u <= 0 ? 0 : u >= 1 ? 1 : easeOut(u) + 0.12 * Math.sin(Math.PI * u); };
const bob = (t: number, a = 0.04, s = 3) => q(a * Math.sin(t * s), 40);

const me = (cam: CamInfo, out: Stage, t: number, x: number, z: number, expr: Expr, extra: object = {}, y = 0, shadow = true) =>
  human(cam, out, 10, ME_O, "me", x, y, z, { mode: "stand", expr, ...extra }, t, shadow);
const sci = (cam: CamInfo, out: Stage, t: number, n: 1 | 2, x: number, z: number, expr: Expr, facing: -1 | 0 | 1 = 0) =>
  human(cam, out, 20 + n, n === 1 ? SCI1 : SCI2, `sci${n}`, x, 0, z, { mode: "stand", expr, facing }, t, true);
const ci = (cam: CamInfo, out: Stage, key: string, x: number, y: number, z: number, sc: number, d: (p: import("../../../library/engine/toon").Pen) => void, shadow = false) =>
  sc > 0.01 && card(cam, out, key, x, y, z, q(sc, 40), d, { shadow });

const lab = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  const T1 = 1.6; // the tube's x in shot 8
  if (id === 1) {
    me(cam, out, t, ME[0], ME[2], after(t, 2.48) ? "grin" : "neutral");
    ci(cam, out, `usb${f >= 66 ? 1 : 0}`, 0.55, 1.0 + bob(t), -1.9, 0.32, (p) => usb(p, f >= 66 ? 1 : 0));
    if (f >= 66 && f < 76) burst(out, t, 66 / FPS, 0.55, 1.4, -1.8, 0.5, 0.25);
  } else if (id === 2) {
    me(cam, out, t, -1.15, -2, after(t, 3.24) ? "grin" : "smile", { facing: 1 });
    const ph = q(((t * 1.1) % 1) * 24, 1) / 24 * Math.PI * 2;
    ci(cam, out, `dna${q(ph, 8)}`, 0, 0.1, -2.4, 0.95 * pop(f, 97), (p) => dna(p, ph));
    burst(out, t, 5.66, 0.0, 1.2, -2.0, 1.2, 0.3);
  } else if (id === 8) {
    sci(cam, out, t, 1, -1.9, -2.2, "neutral", 1);
    sci(cam, out, t, 2, 2.0, -2.2, after(t, 33.0) ? "grin" : "neutral", -1);
    [0, 1, 2].forEach((i) => {
      const k = pourK(f), x0 = -1.2 + i * 0.75, x = lerp(x0, T1, 1 - k), sc = 0.8 * pop(f, 800 + i * 6) * k;
      ci(cam, out, "tower", x, 0, -2.4 + i * 0.1, sc, (p) => driveTower(p, 8), true);
    });
    ci(cam, out, `tube${f >= 986 ? 1 : 0}`, T1, 0, -2.2, 0.5, (p) => tube(p, 0.35, f >= 986));
    burst(out, t, 33.0, T1, 0.9, -2.0, 0.9, 0.3);
  } else if (id === 9) {
    sci(cam, out, t, 1, -0.2, -2.4, "smile", 1);
    ci(cam, out, "tube1", 0.85, 0, -2.2, 0.5, (p) => tube(p, 0.35, true));
    ci(cam, out, "clip", 1.6, 0, -2.2, 0.5, (p) => paperclip(p), true);
    burst(out, t, 36.0, 1.25, 0.9, -2.0, 0.8, 0.25);
  } else if (id === 10) {
    sci(cam, out, t, 1, -0.95, -2.4, after(t, 41.0) ? "grin" : "neutral", 1);
    sci(cam, out, t, 2, 1.9, -2.4, after(t, 41.0) ? "smile" : "neutral", -1);
    const T = 1.0, back = smooth((f - 1196) / 18);
    const kc = f < 1196 ? 1 - smooth((f - 1128) / 26) : back, km = f < 1196 ? 1 - smooth((f - 1160) / 26) : back;
    const cx = f < 1196 ? lerp(-0.3, T, 1 - kc) : lerp(T, -0.3, back), mx = f < 1196 ? lerp(0.3, T, 1 - km) : lerp(T, 0.3, back);
    ci(cam, out, "clap", cx, 0, -2.2, 0.55 * kc, (p) => clapper(p), true);
    ci(cam, out, `mon${f >= 1226 ? 1 : 0}`, mx, 0, -2.3, 0.55 * km, (p) => monitor(p, f >= 1226), true);
    ci(cam, out, `tube${f >= 1128 && f < 1196 ? 1 : 0}`, T, 0, -2.2, 0.5, (p) => tube(p, 0.45, f >= 1128 && f < 1196));
    if (f >= 1226 && f < 1236) burst(out, t, 1226 / FPS, 0.1, 1.0, -2.0, 1.0, 0.3);
  } else if (id === 12) {
    me(cam, out, t, -0.9, -2.2, after(t, 45.9) ? "dazed" : "nervous", { facing: 1 });
    ci(cam, out, `coins${coinsN(f)}`, -1.9, 0, -2.2, 0.55, (p) => coins(p, coinsN(f)), true);
    const ang = q(((t * 0.7) % 1) * 36, 1) / 36 * Math.PI * 2;
    ci(cam, out, `clock${q(ang, 6)}`, 0.2, 0, -2.2, 0.42, (p) => clock(p, ang), true);
    if (f >= 1481 && f < 1491) burst(out, t, 1481 / FPS, -1.9, 1.0, -2.0, 0.8, 0.3);
  } else if (id === 13) {
    me(cam, out, t, -0.7, -2.2, after(t, 52.5) ? "shock" : "nervous", { facing: 1 });
    ci(cam, out, "phone1", 0.1, 0, -2.2, 0.42, (p) => phone(p, 1), true);
    ci(cam, out, "tag", 0.75, 0, -2.2, q(lerp(0.4, 1.0, smooth((f - 1580) / 30)), 30), (p) => priceTag(p), true);
  } else if (id === 16) {
    sci(cam, out, t, 1, -0.5, -2.2, "smile", 1);
    const open = f < 2084 ? 1 : 0;
    ci(cam, out, `fr${open}`, 0.9, 0, -2.6, 1.0, (p) => fridge(p, open), true);
    ci(cam, out, "tube0", -0.1, 0.75, -2.0, 0.22 * (f < 2084 ? 1 : 0.0), (p) => tube(p, 0.45, false));
    const no = after(t, 69.1);
    me(cam, out, t, -1.5, -2.0, no ? "shock" : "neutral", { facing: 1, wave: no ? q(Math.sin(t * 12), 20) : undefined });
    if (f >= 2054 && f < 2064) puff(out, t, 2054 / FPS, 0.9, 1.3, -2.3, 1.0);
  }
};

const micro = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  if (id === 3) {
    ci(cam, out, "cell", MX, 0, -3, 1.25, (p) => cell(p), true);
    ci(cam, out, "usb0", MX + 1.0, 0, -2.4, 0.45 * pop(f, 283), (p) => usb(p, 0), true);
    burst(out, t, 283 / FPS, MX + 1.0, 1.0, -2.2, 0.8, 0.3);
  } else if (id === 4) {
    const sc = lerp(1.25, 0.12, smooth((f - 392) / 52));
    ci(cam, out, "cell", MX, 0, -3, sc, (p) => cell(p), true);
    ci(cam, out, "usb1", MX, 0.08 * sc, -2.7, 0.3 * (sc / 1.25) * 1.5, (p) => usb(p, 1));
  } else if (id === 5 || id === 6) {
    FIELD.slice(0, id === 5 ? fieldN(f) : FIELD.length).forEach(([x, z, i]) => {
      const file = id === 6 && f > 560 + (i * 5) % 50 ? i % 3 : -1;
      ci(cam, out, `cellf${file}`, MX + x, 0, z, 0.55, (p) => cell(p, { file }), true);
    });
    if (id === 6) burst(out, t, 628 / FPS, MX, 1.3, -3, 1.4, 0.3);
  } else if (id === 14) {
    const s = q(splitK(f), 12);
    ci(cam, out, `split${s}`, MX, 0, -3, 1.1, (p) => cell(p, { split: s }), true);
    me(cam, out, t, MX - 1.25, -2.4, after(t, 57.0) ? "nervous" : "neutral", { facing: 1 });
    burst(out, t, 1712 / FPS, MX, 1.2, -2.5, 1.1, 0.3);
  } else if (id === 15) {
    const v = f < 1840 ? 0 : f < 1932 ? 1 : 2;
    ci(cam, out, `photo${v}`, MX + 0.4, 0, -3, 0.95, (p) => photo(p, v), true);
    me(cam, out, t, MX - 1.2, -2.6, v === 0 ? "smile" : v === 1 ? "nervous" : "shock", { facing: 1 });
    for (const h of [1840, 1932]) if (f >= h && f < h + 12) ci(cam, out, "redx", MX + 1.0, 1.1, -2.4, 0.28, (p) => redX(p));
    burst(out, t, 1840 / FPS, MX + 0.4, 1.2, -2.6, 1.0, 0.3);
    burst(out, t, 1932 / FPS, MX + 0.4, 1.2, -2.6, 1.0, 0.3);
  }
};

const square = (cam: CamInfo, out: Stage, id: number, t: number, f: number) => {
  if (id === 7) {
    const x = walkX(f), ph = q((t * 1.4) % 1, 24);
    me(cam, out, t, x, -2, after(t, 25.2) ? "grin" : "neutral", { mode: "stroll", phase: ph });
    ci(cam, out, "sand", x + 0.38, 0.95, -1.9, 0.14, (p) => sandwich(p));
    [-9, -6, -3, 0, 3, 6, 9].forEach((dx, i) => ci(cam, out, `tw${i % 3}`, SX + dx * 1.2 + (i % 2) * 0.5, 0, -6 - (i % 3) * 3, 1.5, (p) => driveTower(p, 7 + (i % 3)), true));
    [-7, -4.5, 4.5, 7.5].forEach((dx, i) => ci(cam, out, `tx${i % 2}`, SX + dx, 0, -4.2 - (i % 2) * 6, 1.1, (p) => driveTower(p, 8), true));
  } else if (id === 11) {
    sci(cam, out, t, 1, SX - 1.3, -3, after(t, 43.8) ? "grin" : "smile", 1);
    ci(cam, out, "tube1", SX, 0, -3, 0.6, (p) => tube(p, 0.45, true));
    ci(cam, out, "pyr", SX + 3.5, 0, -18, 7, (p) => pyramid(p), true);
    ci(cam, out, "pyr", SX - 8, 0, -26, 6, (p) => pyramid(p), true);
  } else if (id === 17) {
    const glow = after(t, 74.0);
    me(cam, out, t, SX, -2, after(t, 72.3) ? "smile_closed" : "smile", { facing: 0 });
    ci(cam, out, `cell${glow ? "g" : ""}`, SX - 0.02, 1.0 + bob(t, 0.01, 4), -1.85, 0.2, (p) => cell(p, { glow }));
    if (glow) ci(cam, out, "spark", SX, 0.95, -1.7, q(0.55 + 0.05 * Math.sin(t * 5), 40), (p) => sparkle(p));
    [[-4, -6], [4.5, -7], [-6, -9]].forEach(([dx, z], i) => human(cam, out, 130 + i, FOLK[i + 1], `f${i + 1}`, SX + dx, 0, z, { mode: "stand", expr: "smile", facing: 0 }, t));
  }
};
void phone; void hardDrive; void SHOTS_OF;

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS_OF(id), f = Math.round(t * FPS);
  if (s.set === "L") lab(cam, out, id, t, f);
  else if (s.set === "M") micro(cam, out, id, t, f);
  else square(cam, out, id, t, f);
  return out;
};
