// Science / tech prop drawings (600 x 1000 design space, soles at y = 975), first made for the DNA short: dna helix, cell, usb, hardDrive, driveTower, tube, paperclip, clapper, monitor, pyramid, coins, clock, phone, priceTag, photo, fridge, sandwich, sparkle, redX. Use with card().
import { Pen, INK, rrect, ellPts, shade } from "../engine/toon";

const A = "#ef5d8f", B = "#4fa3e6";
/** double helix, vertical; ph = twist phase (radians) */
export const dna = (p: Pen, ph = 0, y0 = 90, y1 = 960, amp = 120, cx = 300) => {
  const N = 60, pts = (s: number) => Array.from({ length: N + 1 }, (_, i) => { const y = y0 + (y1 - y0) * i / N; return [cx + amp * Math.sin(ph + y / 70 + s * Math.PI), y] as [number, number]; });
  const a = pts(0), b = pts(1);
  for (let i = 0; i <= N; i += 4) p.stroke([a[i], b[i]], 9, i % 8 ? "#f6c344" : "#7bd389");
  for (let i = 0; i < N; i++) {
    const front = Math.cos(ph + (y0 + (y1 - y0) * i / N) / 70) > 0;
    const [s1, s2] = front ? [b, a] : [a, b];
    p.stroke([s1[i], s1[i + 1]], 22, INK); p.stroke([s1[i], s1[i + 1]], 14, s1 === a ? A : B);
    p.stroke([s2[i], s2[i + 1]], 22, INK); p.stroke([s2[i], s2[i + 1]], 14, s2 === a ? A : B);
  }
};
const fileIcon = (p: Pen, cx: number, cy: number, k: number, v: number) => {
  const c = ["#ffffff", "#ffe29a", "#b9f0d0"][v];
  p.poly(rrect(cx - 60 * k, cy - 74 * k, cx + 60 * k, cy + 74 * k, 10 * k), c, 8);
  if (v === 0) for (let i = 0; i < 4; i++) p.stroke([[cx - 36 * k, cy - 36 * k + i * 22 * k], [cx + 36 * k, cy - 36 * k + i * 22 * k]], 6, "#8a90a8");
  if (v === 1) { p.ell(cx, cy + 6 * k, 38 * k, 30 * k, "#79b8e8", 5); p.ell(cx + 16 * k, cy - 6 * k, 9 * k, 9 * k, "#fff3a0", 0); }
  if (v === 2) { p.ell(cx - 14 * k, cy + 30 * k, 16 * k, 12 * k, INK, 0); p.stroke([[cx + 2 * k, cy + 28 * k], [cx + 2 * k, cy - 40 * k], [cx + 30 * k, cy - 28 * k]], 7); }
};
/** one body cell: soft blob, purple nucleus with a tiny helix; file = 0..2 shows a file icon on top (or -1 none) */
/** fit: keep both halves of a split inside the 600-wide canvas (the original split runs past its edges) */
export const cell = (p: Pen, o: { file?: number; glow?: boolean; split?: number; mouth?: boolean; fit?: boolean } = {}) => {
  const body = (cx: number, rx: number, ry: number) => {
    p.ell(cx, 540, rx, ry, o.glow ? "#ffd9a0" : "#f7b3c9", 12);
    p.ell(cx, 520, rx * 0.5, ry * 0.43, "#9b73d6", 9);
    const pts: [number, number][] = Array.from({ length: 20 }, (_, i) => [cx - rx * 0.36 + (rx * 0.72) * i / 19, 520 + Math.sin(i * 1.3) * ry * 0.12]);
    p.stroke(pts, 8, "#f6c344");
  };
  const s = o.split ?? 0;
  if (s > 0.02 && o.fit) { body(300 - 142 * s, 250 - 100 * s, 330 - 90 * s); body(300 + 142 * s, 250 - 100 * s, 330 - 90 * s); }
  else if (s > 0.02) { body(300 - 150 * s, 250 - 60 * s, 330 - 70 * s); body(300 + 150 * s, 250 - 60 * s, 330 - 70 * s); }
  else body(300, 250, 330);
  if (o.file !== undefined && o.file >= 0) fileIcon(p, 300, 120, 0.9, o.file % 3);
};
export const usb = (p: Pen, glow = 0) => {
  p.poly(rrect(220, 360, 380, 470, 10), "#9fa6b3", 9);
  p.poly(rrect(200, 470, 400, 900, 26), "#2f3a55", 11);
  p.poly(rrect(235, 520, 365, 600, 8), "#ccd3df", 6);
  p.ell(300, 700, 30, 30, glow ? "#fff08a" : "#e0485a", 6);
  p.ell(300, 800, 0.1, 0.1, null, 0);
  p.poly(rrect(250, 395, 275, 430, 3), INK, 0); p.poly(rrect(325, 395, 350, 430, 3), INK, 0);
  p.ell(300, 930, 66, 28, null, 9);
};
export const hardDrive = (p: Pen, y = 975, v = 0) => {
  const c = ["#5b6b8a", "#7a5b8a", "#4f8a7a"][v % 3];
  p.poly(rrect(60, y - 120, 540, y, 14), c, 10);
  p.poly(rrect(90, y - 92, 300, y - 60, 6), "#dfe5ee", 6);
  p.ell(470, y - 76, 14, 14, v % 2 ? "#6be39a" : "#ffd36b", 5);
};
/** a stack of n hard drives, each slightly turned */
export const driveTower = (p: Pen, n = 8) => { for (let i = 0; i < n; i++) hardDrive(p, 975 - i * 118, i); };
export const tube = (p: Pen, fill = 0.35, glow = false) => {
  p.poly(rrect(205, 360, 395, 880, 18), "rgba(210,235,250,0.85)", 11);
  p.ell(300, 880, 95, 60, "rgba(210,235,250,0.85)", 11);
  p.poly(rrect(212, 880 - 520 * fill, 388, 890, 14), glow ? "#ffe9a8" : "#b69be8", 0);
  p.poly(rrect(195, 330, 405, 390, 14), "#e0485a", 10);
  for (let i = 0; i < 6; i++) p.dot(250 + (i * 37) % 100, 860 - ((i * 53) % Math.max(60, 520 * fill - 30)), 7, "#f6c344");
  p.poly(rrect(120, 930, 480, 975, 10), "#6a4a3a", 9);
};
export const paperclip = (p: Pen) => {
  const pts: [number, number][] = [[200, 300], [200, 780], [260, 840], [330, 780], [330, 380], [390, 330], [420, 380], [420, 870], [330, 960], [200, 900]];
  p.stroke(pts, 26, INK); p.stroke(pts, 16, "#c8ced6");
};
export const clapper = (p: Pen) => {
  p.poly(rrect(110, 520, 490, 900, 12), "#2c2f3a", 11);
  for (let i = 0; i < 5; i++) p.poly([[110 + i * 76, 420], [186 + i * 76, 420], [160 + i * 76, 500], [84 + i * 76, 500]], i % 2 ? "#ffffff" : "#2c2f3a", 8);
  p.poly(rrect(100, 500, 500, 540, 6), "#ffffff", 8);
  p.ell(300, 720, 90, 90, "#f6c344", 8); p.poly([[270, 680], [270, 760], [340, 720]], "#2c2f3a", 6);
};
export const monitor = (p: Pen, ok = false) => {
  p.poly(rrect(80, 380, 520, 760, 22), "#3a3f52", 11);
  p.poly(rrect(110, 410, 490, 730, 12), ok ? "#c8f2d2" : "#79c0f2", 7);
  if (ok) p.stroke([[200, 580], [270, 650], [400, 500]], 28, "#2c9a5a");
  else for (let i = 0; i < 4; i++) p.stroke([[150, 460 + i * 60], [150 + 160 + (i % 2) * 90, 460 + i * 60]], 12, "#ffffff");
  p.poly([[270, 760], [330, 760], [350, 900], [250, 900]], "#3a3f52", 9);
  p.poly(rrect(190, 900, 410, 940, 10), "#3a3f52", 9);
};
export const pyramid = (p: Pen) => {
  p.poly([[40, 975], [560, 975], [300, 300]], "#e5c27a", 12); p.poly([[300, 300], [560, 975], [380, 975]], shade("#e5c27a", 0.82), 0);
  for (let y = 420; y < 960; y += 90) p.stroke([[300 - (y - 300) * 0.5, y], [300 + (y - 300) * 0.5, y]], 5, "#b8924f");
};
export const coins = (p: Pen, n = 14) => {
  for (let i = 0; i < n; i++) {
    const y = 960 - i * 46, dx = 12 * Math.sin(i * 2.1);
    p.ell(300 + dx, y, 190, 44, "#f2c230", 9); p.ell(300 + dx, y - 14, 190, 44, "#ffd95a", 9);
  }
  p.ell(300, 960 - n * 46 + 20, 130, 30, "#fff0a0", 7);
};
export const clock = (p: Pen, ang = 0) => {
  p.ell(300, 560, 250, 250, "#ffffff", 13);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; p.stroke([[300 + 205 * Math.sin(a), 560 - 205 * Math.cos(a)], [300 + 232 * Math.sin(a), 560 - 232 * Math.cos(a)]], 9); }
  p.stroke([[300, 560], [300 + 150 * Math.sin(ang), 560 - 150 * Math.cos(ang)]], 14);
  p.stroke([[300, 560], [300 + 95 * Math.sin(ang / 12), 560 - 95 * Math.cos(ang / 12)]], 20, "#c0392b");
  p.dot(300, 560, 18);
};
export const phone = (p: Pen, shot = 0) => {
  p.poly(rrect(150, 300, 450, 940, 40), "#20232f", 12);
  p.poly(rrect(170, 350, 430, 890, 18), shot ? "#79c0f2" : "#33384a", 0);
  if (shot) { p.ell(300, 600, 70, 70, "#ffe08a", 6); p.poly([[170, 890], [250, 720], [330, 800], [430, 690], [430, 890]], "#4f9a4a", 0); }
};
export const priceTag = (p: Pen) => {
  p.stroke([[300, 100], [300, 260]], 7, INK);
  p.poly([[300, 240], [500, 330], [500, 800], [100, 800], [100, 330]], "#ffe29a", 11);
  p.ell(300, 330, 28, 28, "#ffffff", 8);
  p.ell(300, 590, 120, 120, "#f2c230", 9);
  p.ell(300, 590, 80, 80, null, 10);
};
/** vacation photo: v 0 beach, 1 beach with a pine in place of the palm, 2 snowy mountain, framed */
export const photo = (p: Pen, v = 0) => {
  p.poly(rrect(60, 300, 540, 760, 14), "#ffffff", 12);
  const sky = ["#8fd0ff", "#9ac6f0", "#a7c5ea"][v];
  p.poly(rrect(95, 335, 505, 640, 6), sky, 0);
  if (v < 2) {
    p.poly([[95, 560], [505, 560], [505, 665], [95, 665]], "#f4e1a0", 0); p.poly([[95, 520], [505, 520], [505, 570], [95, 570]], "#3fa6d9", 0);
    p.ell(430, 400, 34, 34, "#ffe36b", 0);
    if (v === 0) { p.stroke([[220, 620], [235, 470]], 14, "#8a5a3a"); for (const [dx, dy] of [[-70, 25], [-40, -5], [60, 20], [40, -10]]) p.ell(235 + dx, 462 + dy, 52, 16, "#3f9a4a", 6, 0, 360, dx * 0.3); }
    else { p.stroke([[220, 620], [235, 450]], 14, "#6e452c"); p.poly([[235, 380], [195, 470], [275, 470]], "#2f7a4a", 7); p.poly([[235, 430], [180, 520], [290, 520]], "#2f7a4a", 7); }
  } else {
    p.poly([[95, 640], [220, 420], [300, 520], [390, 380], [505, 640]], "#8a96b0", 8); p.poly([[390, 380], [350, 440], [390, 430], [430, 450]], "#ffffff", 4);
    p.poly([[95, 640], [505, 640], [505, 665], [95, 665]], "#5aa04f", 0);
  }
  p.poly(rrect(95, 670, 505, 725, 4), "#ffffff", 0);
  p.stroke([[130, 698], [300, 698]], 6, "#c9ccd6");
};
export const fridge = (p: Pen, open = 0) => {
  p.poly(rrect(120, 260, 480, 975, 24), "#cfe6f2", 12);
  if (open > 0.5) { p.poly(rrect(150, 300, 450, 940, 10), "#eaf6ff", 7); for (const y of [480, 650, 800]) p.stroke([[150, y], [450, y]], 9, "#a9c4d4"); }
  else { p.stroke([[120, 560], [480, 560]], 9, "#9ab5c4"); p.poly(rrect(420, 380, 446, 500, 8), "#7d8d99", 6); p.poly(rrect(420, 600, 446, 760, 8), "#7d8d99", 6); }
  for (const [x, y] of [[260, 330], [340, 400], [200, 420]]) { p.stroke([[x - 20, y], [x + 20, y]], 7, "#ffffff"); p.stroke([[x, y - 20], [x, y + 20]], 7, "#ffffff"); }
};
export const sandwich = (p: Pen) => {
  p.poly([[100, 940], [500, 940], [470, 880], [130, 880]], "#e0b070", 10); p.poly([[110, 880], [490, 880], [490, 840], [110, 840]], "#6fbf5a", 8);
  p.poly([[100, 840], [500, 840], [480, 790], [120, 790]], "#e86a5a", 8); p.poly([[130, 790], [470, 790], [440, 700], [160, 700]], "#e0b070", 10);
};
export const sparkle = (p: Pen) => { for (const [x, y, r] of [[300, 500, 140], [150, 300, 60], [460, 340, 70], [420, 700, 50]]) p.poly([[x, y - r], [x + r * 0.28, y - r * 0.28], [x + r, y], [x + r * 0.28, y + r * 0.28], [x, y + r], [x - r * 0.28, y + r * 0.28], [x - r, y], [x - r * 0.28, y - r * 0.28]], "#fff3a0", 0); };
export const redX = (p: Pen) => { p.stroke([[120, 300], [480, 700]], 56, INK); p.stroke([[480, 300], [120, 700]], 56, INK); p.stroke([[120, 300], [480, 700]], 40, "#e0383e"); p.stroke([[480, 300], [120, 700]], 40, "#e0383e"); };
export const lens = (p: Pen) => { p.ell(280, 520, 190, 190, "rgba(200,235,255,0.55)", 14); p.stroke([[420, 660], [520, 800]], 40, INK); p.stroke([[420, 660], [520, 800]], 26, "#8a5a3a"); };
void ellPts;
