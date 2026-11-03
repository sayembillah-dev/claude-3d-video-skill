// Shared animal cast + painted props (first made for "What If Animals Could Sue Humans"), in the toon.ts flat style:
// shaded fills with a soft crescent away from the light, thick-thin plum ink, stick limbs with ink-dot hands, the
// toon.ts face library. Everything is drawn in the 600 x 1000 design space with the soles at y = 975; cast.ts scales
// the card to the animal's real size (monkey ~0.95 m, hen ~0.5 m, rat ~0.3 m, cat ~0.5 m).
import { Pen, INK, Expr, mul, shade, faceFront, thickAngle, ellPts, rrect } from "../engine/toon";

type P2 = [number, number];
const SH: [number, number, number] = [0.66, 0.68, 0.78];
const rad = (d: number) => (d * Math.PI) / 180;

/** filled + crescent-shaded shape with a thick-thin ink ring */
const body = (p: Pen, pts: P2[], col: string, light: number, R: number, w = 11) => {
  p.shadedFill(pts, col, mul(col, SH), light, R);
  p.inkRing(pts, w, thickAngle(light));
};
const oval = (p: Pen, cx: number, cy: number, rx: number, ry: number, col: string, light: number, w = 11, rot = 0) =>
  body(p, ellPts(cx, cy, rx, ry, 0, 360, rot), col, light, Math.max(rx, ry), w);
const limb = (p: Pen, pts: P2[], col: string, w: number) => { p.stroke(pts, w + 9, INK); p.stroke(pts, w, col); };

export type CritterOpts = {
  expr?: Expr; blink?: number; light?: number; look?: number;
  /** 0..1 walk phase (bob + feet) */ phase?: number;
  /** monkey hands: "down", "camera" (camera held at the chest, lens to the lens), "reach" (right hand out to a tripod),
   *  "shrug", "up" (cheer) */ arms?: "down" | "camera" | "reach" | "shrug" | "up";
  sit?: boolean; flash?: number;
};
const DEF_LIGHT = rad(-120);

// ---------------- crested macaque (Naruto: black fur, mauve-grey face, spiky crest, amber-free deadpan eyes) ----------------
export const FUR = "#34303c", FACE = "#c9aaa9", FOOT = "#4a4250";
export const monkey = (p: Pen, o: CritterOpts) => {
  const { expr = "neutral", blink = 0, light = DEF_LIGHT, look = 0, phase = 0, arms = "down", sit = false } = o;
  const bob = 10 * Math.cos(4 * Math.PI * phase), sole = 975;
  const hip = sit ? 905 : 815 + bob, chest = hip - 230, hc = chest - 150;
  // tail (behind): a curl out to the left
  limb(p, [[220, hip - 20], [130, hip - 40], [90, hip - 140], [120, hip - 210], [165, hip - 190]], FUR, 22);
  // legs
  if (sit) {
    for (const s of [-1, 1]) { limb(p, [[300 + s * 55, hip - 10], [300 + s * 120, hip + 30], [300 + s * 95, sole - 10]], FUR, 30); oval(p, 300 + s * 105, sole - 12, 42, 18, FOOT, light, 8); }
  } else {
    for (const s of [-1, 1]) {
      const lift = Math.max(0, Math.sin(2 * Math.PI * phase + (s > 0 ? 0 : Math.PI))) * 26;
      limb(p, [[300 + s * 55, hip - 10], [300 + s * 78, hip + 70], [300 + s * 70, sole - 18 - lift]], FUR, 30);
      oval(p, 300 + s * 82, sole - 14 - lift, 46, 18, FOOT, light, 8);
    }
  }
  // torso
  body(p, ellPts(300, chest + 110, 118, 150), FUR, light, 150);
  oval(p, 300, chest + 135, 66, 92, "#5b5162", light, 0); // lighter belly
  // arms
  const sh: [P2, P2] = [[205, chest + 40], [395, chest + 40]];
  const hands: Record<string, [P2[], P2[]]> = {
    down: [[sh[0], [168, chest + 150], [178, chest + 250]], [sh[1], [432, chest + 150], [422, chest + 250]]],
    camera: [[sh[0], [190, chest + 150], [250, chest + 135]], [sh[1], [410, chest + 150], [350, chest + 135]]],
    reach: [[sh[0], [168, chest + 150], [178, chest + 250]], [sh[1], [480, chest - 20], [560, chest - 150]]],
    shrug: [[sh[0], [120, chest + 70], [92, chest - 25]], [sh[1], [480, chest + 70], [508, chest - 25]]],
    up: [[sh[0], [140, chest - 60], [120, chest - 170]], [sh[1], [460, chest - 60], [480, chest - 170]]],
  };
  const [la, ra] = hands[arms];
  for (const a of [la, ra]) { limb(p, a, FUR, 24); p.dot(a[2][0], a[2][1], 22, INK); }
  if (arms === "camera") camera(p, 300, chest + 120, 1.0, o.flash ?? 0);
  // head: ears, crest, skull, face mask
  for (const s of [-1, 1]) { oval(p, 300 + s * 132, hc + 10, 34, 38, FUR, light, 9); p.ell(300 + s * 132, hc + 12, 16, 20, FACE, 0); }
  const crest: P2[] = [];
  for (let i = 0; i <= 8; i++) { const x = 230 + i * 17.5; crest.push([x, hc - 108 - (i % 2 ? 0 : 52) * Math.sin((Math.PI * i) / 8)]); }
  p.poly([[228, hc - 70], ...crest, [372, hc - 70]], FUR, 9);
  body(p, ellPts(300, hc, 128, 120), FUR, light, 128);
  body(p, [...ellPts(300, hc + 18, 96, 86)], FACE, light, 96, 7);
  faceFront(p, 300, hc + 6, 190, expr, 0, look, blink, false, FACE);
  if (arms === "shrug") for (const s of [-1, 1]) p.arc(300 + s * 175, hc - 30, 14, 14, 200, 340, 6);
};

// ---------------- hen ----------------
export const hen = (p: Pen, o: CritterOpts & { v?: number }) => {
  const { expr = "neutral", blink = 0, light = DEF_LIGHT, look = 0, phase = 0, v = 0 } = o;
  const col = ["#f4ede0", "#c56a38", "#e9c58a", "#f4ede0", "#8a5a3a"][v % 5], sole = 975, bob = 12 * Math.cos(4 * Math.PI * phase);
  for (const s of [-1, 1]) {
    const lift = Math.max(0, Math.sin(2 * Math.PI * phase + (s > 0 ? 0 : Math.PI))) * 30;
    limb(p, [[300 + s * 60, 820 + bob], [300 + s * 70, sole - 20 - lift]], "#f2b632", 14);
    for (const d of [-40, 0, 40]) limb(p, [[300 + s * 70, sole - 20 - lift], [300 + s * 70 + d, sole - 8 - lift]], "#f2b632", 10);
  }
  // tail feathers
  p.poly([[420, 640 + bob], [540, 470 + bob], [560, 560 + bob], [520, 650 + bob]], shade(col, 0.9), 10);
  body(p, ellPts(300, 690 + bob, 215, 170, 0, 360, -8), col, light, 215);
  p.arc(330, 690 + bob, 110, 70, 10, 160, 9); // wing
  const hc = 440 + bob;
  for (const [x, y, r] of [[262, hc - 140, 34], [300, hc - 158, 40], [340, hc - 140, 34]] as const) p.ell(x, y, r, r, "#e2332d", 9);
  body(p, ellPts(300, hc, 120, 130), col, light, 130);
  faceFront(p, 300, hc - 10, 180, expr, 0, look, blink, false, col);
  p.poly([[268, hc + 26], [332, hc + 26], [300, hc + 76]], "#f2b632", 8); // beak over the mouth
  p.ell(300, hc + 98, 18, 26, "#e2332d", 7); // wattle
};

// ---------------- rat ----------------
export const rat = (p: Pen, o: CritterOpts) => {
  const { expr = "neutral", blink = 0, light = DEF_LIGHT, look = 0, phase = 0 } = o;
  const col = "#9b97a6", pink = "#f2a7b4", sole = 975, bob = 10 * Math.cos(4 * Math.PI * phase);
  limb(p, [[400, 900], [520, 930], [575, 860], [545, 790]], pink, 14); // tail
  for (const s of [-1, 1]) oval(p, 300 + s * 80, sole - 18, 50, 20, pink, light, 8);
  body(p, ellPts(300, 780 + bob, 165, 175), col, light, 175);
  oval(p, 300, 810 + bob, 90, 110, "#c7c3cf", light, 0);
  for (const s of [-1, 1]) { const a = [[240 + s * 1, 690 + bob], [205, 770 + bob], [250, 800 + bob]] as P2[]; if (s > 0) a.forEach((q) => (q[0] = 600 - q[0])); limb(p, a, col, 20); p.dot(a[2][0], a[2][1], 16, INK); }
  const hc = 500 + bob;
  for (const s of [-1, 1]) { oval(p, 300 + s * 120, hc - 100, 70, 70, col, light, 10); p.ell(300 + s * 120, hc - 98, 42, 42, pink, 0); }
  body(p, ellPts(300, hc, 140, 130), col, light, 140);
  faceFront(p, 300, hc - 4, 190, expr, 0, look, blink, false, col);
  p.ell(300, hc + 40, 16, 12, "#e0607a", 6);
  for (const s of [-1, 1]) for (const k of [-1, 1]) p.stroke([[300 + s * 40, hc + 44 + k * 6], [300 + s * 120, hc + 34 + k * 22]], 4);
};

// ---------------- cat ----------------
export const cat = (p: Pen, o: CritterOpts & { v?: number }) => {
  const { expr = "smile", blink = 0, light = DEF_LIGHT, look = 0, v = 0 } = o;
  const col = ["#e8933a", "#5a5560", "#f1ead9"][v % 3], sole = 975;
  limb(p, [[400, 940], [520, 900], [540, 720], [500, 650]], col, 34); // tail up
  body(p, [...ellPts(300, 790, 160, 190)], col, light, 190);
  for (const s of [-1, 1]) oval(p, 300 + s * 70, sole - 22, 55, 26, col, light, 8);
  const hc = 520;
  for (const s of [-1, 1]) p.poly([[300 + s * 70, hc - 100], [300 + s * 150, hc - 210], [300 + s * 155, hc - 60]], col, 10);
  body(p, ellPts(300, hc, 150, 130), col, light, 150);
  if (v % 3 === 0) for (const dx of [-30, 0, 30]) p.stroke([[300 + dx, hc - 128], [300 + dx * 1.2, hc - 90]], 9, shade(col, 0.7));
  faceFront(p, 300, hc - 4, 200, expr, 0, look, blink, false, col);
  p.poly([[288, hc + 24], [312, hc + 24], [300, hc + 36]], "#e0607a", 4);
  for (const s of [-1, 1]) for (const k of [-1, 1]) p.stroke([[300 + s * 50, hc + 34 + k * 6], [300 + s * 140, hc + 26 + k * 22]], 4);
};

// ---------------- props (lit cards) ----------------
/** compact camera: body, lens toward the viewer, optional flash glow 0..1 */
export const camera = (p: Pen, cx: number, cy: number, k = 1, flash = 0) => {
  p.poly(rrect(cx - 95 * k, cy - 60 * k, cx + 95 * k, cy + 60 * k, 16 * k), "#2a2b33", 9);
  p.poly(rrect(cx - 70 * k, cy - 84 * k, cx - 20 * k, cy - 60 * k, 6 * k), "#2a2b33", 7);
  p.ell(cx + 10 * k, cy, 46 * k, 46 * k, "#4a4d5a", 9);
  p.ell(cx + 10 * k, cy, 26 * k, 26 * k, "#1a2a44", 6);
  p.ell(cx + 2 * k, cy - 8 * k, 8 * k, 8 * k, "#6f8fc0", 0);
  p.ell(cx + 65 * k, cy - 38 * k, 14 * k, 9 * k, flash > 0 ? "#fffbe0" : "#d6d8de", 5);
};
/** camera on a tripod (shot 2): head at ~1.25 m on a card scaled 1 */
export const tripod = (p: Pen, flash = 0) => {
  for (const [x0, x1] of [[300, 170], [300, 430], [300, 300]] as const) p.band([[x0, 420], [x1, 975]], "#5c5f6b", 14, 4);
  p.band([[300, 380], [300, 430]], "#5c5f6b", 26, 4);
  camera(p, 300, 330, 0.95, flash);
};
/** a towering stack of paper (shot 11); n = sheets drawn */
export const paperStack = (p: Pen) => {
  for (let i = 0; i < 26; i++) {
    const y = 975 - i * 36, dx = 14 * Math.sin(i * 1.7);
    p.poly([[130 + dx, y], [470 + dx, y], [480 + dx, y - 34], [120 + dx, y - 34]], i % 3 ? "#f7f3ea" : "#ece6d6", 6);
    p.stroke([[160 + dx, y - 17], [300 + dx, y - 17]], 4, "#b9b3c4");
  }
};
/** the medieval court's little rat dock (wood rail) */
export const dock = (p: Pen) => {
  p.poly([[60, 975], [540, 975], [540, 760], [60, 760]], "#8a5a3a", 10);
  for (const x of [100, 220, 340, 460]) p.band([[x, 975], [x, 760]], "#6e452c", 12, 4);
  p.band([[40, 760], [560, 760]], "#a8724a", 30, 6);
};
/** plain wooden chair (the "things" box) */
export const chair = (p: Pen) => {
  const W = "#b07a4a", D = "#8a5a3a";
  for (const x of [170, 430]) p.band([[x, 975], [x, 560]], D, 26, 6);
  for (const x of [190, 410]) p.band([[x, 560], [x, 120]], W, 26, 6);
  p.poly(rrect(160, 140, 440, 230, 14), W, 9);
  p.poly(rrect(170, 300, 430, 360, 10), W, 8);
  p.poly([[120, 520], [480, 520], [500, 590], [100, 590]], W, 10);
};
