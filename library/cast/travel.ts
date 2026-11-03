// Travel / sci-fi prop drawings (600 x 1000 design space, soles at y = 975), first made for the teleport short:
// teleport booth (back + glass front, scan ring), fax, shredder, satellite, ground dish, car, plane, door, atom, bomb, bin.
// Use with card(); every argument that changes the drawing must also go into the card key.
import { Pen, INK, rrect, shade } from "../engine/toon";

const BOOTH = [["#2fb6c9", "#c9f2fa"], ["#e2574c", "#ffe0d6"], ["#8a5ad6", "#ece0ff"], ["#f2a93b", "#fff0cf"]];
/** back half of a teleport booth: base disc, back wall of the tube, roof cap. v = colour 0 teal, 1 red, 2 violet, 3 amber */
export const boothBack = (p: Pen, v = 0) => {
  const [c, glass] = BOOTH[v % 4];
  p.ell(300, 930, 260, 52, shade(c, 0.7), 11);
  p.poly(rrect(70, 150, 530, 930, 60), glass, 11);
  for (let i = 0; i < 3; i++) p.stroke([[110, 330 + i * 220], [490, 330 + i * 220]], 6, shade(glass, 0.9));
  p.ell(300, 925, 230, 40, shade(c, 0.85), 8);
  p.ell(300, 925, 150, 24, "#eaffff", 6);
};
/** front half: glass sheen, rims, roof and a scan ring at height `scan` (0 = floor, 1 = roof; < 0 = off); glow 0..1 */
export const boothFront = (p: Pen, v = 0, scan = -1, glow = 0) => {
  const [c] = BOOTH[v % 4];
  if (glow > 0) p.poly(rrect(80, 160, 520, 920, 55), `rgba(160,255,250,${(0.55 * glow).toFixed(2)})`, 0);
  p.stroke([[130, 230], [130, 840]], 16, "rgba(255,255,255,0.65)");
  p.stroke([[170, 260], [170, 520]], 9, "rgba(255,255,255,0.5)");
  if (scan >= 0) {
    const y = 900 - scan * 720;
    p.ell(300, y, 245, 40, "rgba(120,255,240,0.35)", 0);
    p.ell(300, y, 235, 34, "rgba(0,0,0,0)", 0); p.stroke([[60, y], [540, y]], 14, "#7dfff0");
  }
  p.poly([[40, 930], [560, 930], [560, 975], [40, 975]], c, 11);
  p.poly(rrect(40, 90, 560, 175, 40), c, 11);
  p.ell(300, 132, 90, 22, glow > 0 ? "#fffbd0" : shade(c, 1.25), 7);
};
/** fax machine (sits on a desk; card soles = desk top). page 0..1 = how far the fresh page has printed out */
export const fax = (p: Pen, page = 0) => {
  if (page > 0) {
    const top = 640 - 360 * page;
    p.poly([[200, 650], [400, 650], [410, top], [190, top]], "#ffffff", 8);
    for (let y = top + 50; y < 630; y += 45) p.stroke([[225, y], [375 - ((y / 45) % 3) * 30, y]], 8, "#9aa3b5");
  }
  p.poly(rrect(70, 640, 530, 975, 30), "#d9d6cf", 11);
  p.poly(rrect(110, 680, 330, 760, 12), "#3a3f52", 7);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) p.ell(390 + j * 45, 700 + i * 45, 15, 15, j === 2 && i === 2 ? "#5ac06a" : "#f4f2ec", 5);
  p.poly(rrect(150, 800, 450, 830, 8), INK, 0);
};
/** office shredder: a page going in from the top (k 0..1 = fed), strips falling in the window. jam = smoke-dark, page stuck */
export const shredder = (p: Pen, k = 0, jam = false) => {
  if (k < 1) {
    const top = 330 + 270 * k;
    p.poly([[210, 610], [390, 610], [395, top], [205, top]], jam ? "#f2efe2" : "#ffffff", 8);
    if (jam) p.poly([[205, top], [250, top - 60], [300, top - 10], [350, top - 70], [395, top]], "#ffffff", 8);
  }
  p.poly(rrect(110, 600, 490, 975, 28), jam ? "#5a5560" : "#8e96a8", 11);
  p.poly(rrect(100, 580, 500, 650, 18), "#3a3f52", 11);
  p.stroke([[180, 615], [420, 615]], 10, INK);
  p.poly(rrect(170, 700, 430, 920, 16), "#cfe6f2", 8);
  for (let i = 0; i < 8; i++) p.stroke([[190 + i * 30, 720 + ((i * 37) % 40)], [195 + i * 30, 900]], 7, "#ffffff");
  p.ell(440, 630, 14, 14, jam ? "#ff4a3a" : "#5ac06a", 5);
};
/** satellite: gold body, two blue solar wings, dish (drawn centred, no ground) */
export const satellite = (p: Pen) => {
  for (const s of [-1, 1]) {
    const x0 = 300 + s * 95, x1 = 300 + s * 290;
    p.stroke([[300, 500], [x0, 500]], 12, INK);
    p.poly([[x0, 430], [x1, 430], [x1, 570], [x0, 570]], "#3b6fd1", 10);
    for (let i = 1; i < 4; i++) { const x = x0 + (x1 - x0) * i / 4; p.stroke([[x, 432], [x, 568]], 5, "#9fc2ff"); }
    p.stroke([[x0, 500], [x1, 500]], 5, "#9fc2ff");
  }
  p.poly(rrect(220, 420, 380, 590, 14), "#e8b23a", 11);
  p.stroke([[235, 470], [365, 470]], 6, "#b8862a"); p.stroke([[235, 540], [365, 540]], 6, "#b8862a");
  p.ell(300, 650, 70, 30, "#f1efe6", 9); p.stroke([[300, 590], [300, 650]], 9, INK);
};
/** ground-station dish on a stand, tilted up to the right */
export const dish = (p: Pen) => {
  p.poly([[230, 975], [370, 975], [330, 640], [270, 640]], "#8e96a8", 11);
  p.poly(rrect(200, 940, 400, 975, 10), "#5f6678", 9);
  p.rot = [-0.6, 300, 520];
  p.ell(300, 520, 230, 90, "#f1efe6", 12); p.ell(300, 530, 185, 62, "#d9dde4", 0);
  p.stroke([[300, 520], [300, 320]], 10, INK); p.ell(300, 315, 22, 22, "#e0383e", 6);
  p.rot = null;
};
/** small cartoon car in side view, nose to the right */
export const car = (p: Pen, col = "#e2574c") => {
  p.poly([[40, 880], [40, 760], [160, 740], [230, 640], [400, 640], [470, 740], [560, 760], [560, 880]], col, 12);
  p.poly([[250, 660], [320, 660], [320, 740], [190, 740]], "#cfe9f7", 8);
  p.poly([[340, 660], [390, 660], [440, 740], [340, 740]], "#cfe9f7", 8);
  p.ell(535, 790, 18, 14, "#fff3a0", 5);
  for (const x of [150, 450]) { p.ell(x, 890, 72, 72, "#2b2f3d", 11); p.ell(x, 890, 30, 30, "#c9ced8", 6); }
};
/** cartoon airliner in side view (centred, flying to the right) */
export const plane = (p: Pen, col = "#f1efe6") => {
  p.poly([[230, 520], [120, 380], [180, 380], [300, 500]], shade(col, 0.85), 10);
  p.poly(rrect(40, 470, 560, 570, 50), col, 12);
  p.poly([[40, 500], [10, 380], [80, 380], [130, 480]], "#3b6fd1", 10);
  p.poly([[260, 540], [420, 540], [330, 660], [270, 660]], shade(col, 0.8), 10);
  for (let i = 0; i < 7; i++) p.ell(190 + i * 45, 505, 12, 14, "#3b6fd1", 0);
  p.poly([[520, 485], [555, 500], [540, 520], [505, 510]], "#2b2f3d", 0);
};
/** free-standing door in a frame; open 0..1 swings the leaf toward the viewer */
export const door = (p: Pen, open = 0, col = "#2f8f9d") => {
  p.poly([[110, 975], [110, 180], [490, 180], [490, 975]], "#6b4a33", 12);
  p.poly([[150, 960], [150, 220], [450, 220], [450, 960]], open > 0 ? "#fff3c4" : shade(col, 0.6), 0);
  const w = 300 * (1 - 0.8 * open), x1 = 150 + w;
  p.poly([[150, 960], [150, 220], [x1, 220 - 40 * open], [x1, 960 + 40 * open]], col, 10);
  if (open < 0.9) p.ell(150 + w * 0.85, 600, 16, 16, "#f2c230", 6);
};
/** atom: nucleus and three orbits. ph = electron phase */
export const atom = (p: Pen, ph = 0, col = "#7bd389") => {
  const cx = 300, cy = 500;
  for (let i = 0; i < 3; i++) {
    p.rot = [i * Math.PI / 3, cx, cy];
    p.ell(cx, cy, 230, 80, "rgba(0,0,0,0)", 8);
    const a = ph + i * 2.1; p.ell(cx + 230 * Math.cos(a), cy + 80 * Math.sin(a), 22, 22, "#5ad8ff", 5);
  }
  p.rot = null;
  p.ell(cx, cy, 70, 70, col, 9); p.ell(cx - 22, cy - 22, 18, 18, "#ffffff", 0);
};
/** classic round cartoon bomb with a lit fuse */
export const bomb = (p: Pen, spark = 0) => {
  p.ell(300, 720, 230, 230, "#2b2f3d", 12);
  p.ell(230, 640, 50, 70, "#4a5066", 0);
  p.poly(rrect(250, 460, 350, 520, 10), "#5f6678", 10);
  p.stroke([[300, 460], [330, 380], [380, 340]], 12, "#c9a46a");
  const r = 40 + 15 * Math.sin(spark * 6.28);
  p.poly([[380, 340 - r], [392, 328], [380 + r, 340], [392, 352], [380, 340 + r], [368, 352], [380 - r, 340], [368, 328]], "#ffd23f", 6);
};
/** open crate heaped with glowing atoms (a "spare parts" bin) */
export const atomBin = (p: Pen) => {
  for (let i = 0; i < 9; i++) {
    const x = 160 + (i % 5) * 70 + (i > 4 ? 35 : 0), y = 560 - (i > 4 ? 60 : 0);
    p.ell(x, y, 46, 46, ["#7bd389", "#5ad8ff", "#ffd23f"][i % 3], 8); p.ell(x - 14, y - 14, 10, 10, "#ffffff", 0);
  }
  p.poly([[90, 590], [510, 590], [480, 975], [120, 975]], "#a8763e", 12);
  for (let y = 680; y < 960; y += 95) p.stroke([[100, y], [495, y]], 8, "#7a5428");
};
