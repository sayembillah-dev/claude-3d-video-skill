// Spooky / thriller prop cards (first made for "sleep-experiment"), 600 x 1000 design space, soles at y 975, plum ink.
//   o2Dial(p, k)        : a round pressure gauge, needle 0 (left) .. 1 (pinned in the red), "O2" on the face
//   pistol(p, flash)    : a side view of a 1940s pistol held by a hand, muzzle flash 0..1
//   eyesDark(p, open)   : two glowing eyes in a black gap, open 0..1 (blink-in)
//   peakedCap(p)        : a fallen military peaked cap with a red band (rolls on the floor)
//   cigarette(p, lit)   : a cigarette with a glowing tip and a wisp
//   speakerBox(p, k)    : a wall intercom speaker; k 0..1 rings of sound
//   headphones(p)       : 1940s headphones
//   foodTin(p, v)       : one labelled tin can
import { Pen, rrect, ellPts, INK } from "../engine/toon";

export const o2Dial = (p: Pen, k = 0) => {
  p.ell(300, 520, 260, 260, "#3a3f3c", 14);
  p.ell(300, 520, 222, 222, "#efe9d6", 9);
  // red danger arc on the right
  const arc = (a0: number, a1: number, col: string) => {
    const pts = [...ellPts(300, 520, 200, 200, a0, a1, 0, 24), ...ellPts(300, 520, 160, 160, a1, a0, 0, 24)];
    p.poly(pts, col, 0);
  };
  arc(-40, 40, "#d8343a"); arc(-90, -40, "#e8c45a");
  for (let i = 0; i <= 10; i++) { const a = ((-220 + i * 26) * Math.PI) / 180; p.stroke([[300 + 200 * Math.cos(a), 520 + 200 * Math.sin(a)], [300 + 165 * Math.cos(a), 520 + 165 * Math.sin(a)]], i % 5 ? 6 : 11); }
  p.g.fillStyle = INK; p.g.font = "bold 92px sans-serif"; p.g.textAlign = "center"; p.g.fillText("O2", 300, 680);
  const a = ((-220 + 260 * Math.max(0, Math.min(1.04, k))) * Math.PI) / 180;
  p.poly([[300 + 175 * Math.cos(a), 520 + 175 * Math.sin(a)], [300 + 16 * Math.cos(a + 1.57), 520 + 16 * Math.sin(a + 1.57)], [300 - 30 * Math.cos(a), 520 - 30 * Math.sin(a)], [300 + 16 * Math.cos(a - 1.57), 520 + 16 * Math.sin(a - 1.57)]], "#c0392b", 6);
  p.ell(300, 520, 26, 26, "#3a3f3c", 6);
  p.ell(220, 400, 60, 30, "rgba(255,255,255,.35)", 0, 0, 360, -30); // glass glint
};

export const pistol = (p: Pen, flash = 0) => {
  if (flash > 0) {
    const r = 120 + 200 * flash, pts: [number, number][] = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr = i % 2 ? r * 0.45 : r; pts.push([560 + rr * Math.cos(a), 420 + rr * 0.7 * Math.sin(a)]); }
    p.poly(pts, "#fff3b0", 0); p.ell(560, 420, r * 0.35, r * 0.3, "#ffffff", 0);
  }
  p.poly([[130, 380], [540, 380], [540, 460], [250, 460], [250, 480], [130, 480]], "#3a3c40", 11); // slide + frame
  p.poly([[140, 470], [250, 470], [230, 700], [110, 700]], "#5a3b2a", 11); // grip
  for (let i = 0; i < 4; i++) p.stroke([[150 + i * 10, 520 + i * 40], [225 - i * 2, 520 + i * 40]], 4, "#3a2618");
  p.stroke([[270, 480], [300, 540], [250, 545]], 9); // trigger guard
  for (let i = 0; i < 6; i++) p.stroke([[160 + i * 22, 392], [160 + i * 22, 430]], 4, "#26282c");
  // the hand: fingers wrapped round the grip
  p.poly(rrect(70, 470, 260, 690, 60), "#f5c9a0", 10);
  for (let i = 0; i < 3; i++) p.stroke([[110, 540 + i * 45], [250, 530 + i * 45]], 5, "#c9906a");
  p.poly(rrect(200, 430, 330, 480, 22), "#f5c9a0", 9); // trigger finger
  p.poly([[40, 560], [90, 520], [90, 980], [40, 980]], "#e4e0d0", 10); // white coat sleeve
};

export const eyesDark = (p: Pen, open = 1, gap = true) => {
  if (gap) p.poly(rrect(40, 380, 560, 640, 40), "#050408", 0);
  if (open <= 0) return;
  for (const x of [210, 390]) {
    p.ell(x, 510, 62, 46 * open, "#f4f0a0", 0);
    p.ell(x, 510, 80, 64 * open, "rgba(244,240,160,.18)", 0);
    p.ell(x + 6, 512, 14, 40 * open, "#120b10", 0);
  }
};

export const peakedCap = (p: Pen) => {
  p.ell(300, 900, 230, 60, "rgba(0,0,0,.25)", 0);
  p.poly([[110, 760], [490, 760], [470, 860], [130, 860]], "#56603e", 11);
  p.ell(300, 750, 240, 70, "#56603e", 11);
  p.poly([[130, 830], [470, 830], [468, 870], [132, 870]], "#b8323a", 9);
  p.ell(300, 900, 200, 40, "#16171b", 10, 0, 180);
  const s: [number, number][] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 14 : 32; s.push([300 + r * Math.cos(a), 800 + r * Math.sin(a)]); }
  p.poly(s, "#e8c45a", 5);
};

export const cigarette = (p: Pen, lit = 1) => {
  p.poly(rrect(120, 470, 460, 530, 14), "#f4f0e6", 9);
  p.poly(rrect(120, 470, 210, 530, 10), "#d8a060", 9);
  if (lit > 0) { p.ell(460, 500, 22, 30, "#ff7a30", 6); p.ell(460, 500, 40, 46, "rgba(255,140,60,.25)", 0); }
  p.stroke([[470, 460], [440, 400], [480, 340], [450, 280]], 6, "rgba(200,200,210,.7)");
};

export const speakerBox = (p: Pen, k = 0) => {
  p.poly(rrect(150, 380, 450, 680, 30), "#4a4f4c", 12);
  for (let i = 0; i < 7; i++) p.stroke([[190, 420 + i * 38], [410, 420 + i * 38]], 10, "#1c1e1e");
  for (let i = 1; i <= 3; i++) if (k * 3 >= i) p.arc(300, 530, 180 + i * 50, 180 + i * 50, -40, 40, 8, "rgba(255,255,255,.6)");
};

export const headphones = (p: Pen) => {
  p.arc(300, 600, 180, 200, 180, 360, 22);
  for (const x of [120, 480]) { p.ell(x, 640, 60, 85, "#3a3c40", 10); p.ell(x, 640, 30, 50, "#2a2a2e", 0); }
};

export const foodTin = (p: Pen, v = 0) => {
  p.poly(rrect(170, 620, 430, 975, 18), "#9aa3a8", 10);
  p.poly([[175, 690], [425, 690], [425, 900], [175, 900]], ["#a8503a", "#5f7a48", "#c9a24a"][v % 3], 0);
  p.ell(300, 620, 130, 30, "#c9d0d4", 9);
};

/** an open book held at the chest (scale ~.18) */
export const openBook = (p: Pen, col = "#7a3b34") => {
  p.poly([[60, 700], [300, 740], [540, 700], [540, 960], [300, 990], [60, 960]], col, 10);
  p.poly([[80, 690], [295, 725], [295, 965], [80, 935]], "#efe6cf", 7);
  p.poly([[305, 725], [520, 690], [520, 935], [305, 965]], "#efe6cf", 7);
  for (let i = 0; i < 6; i++) { p.stroke([[110, 750 + i * 30], [270, 775 + i * 30]], 4, "rgba(60,50,40,.6)"); p.stroke([[330, 775 + i * 30], [490, 750 + i * 30]], 4, "rgba(60,50,40,.6)"); }
};
/** a sheet over a still body seen from the side, one pale hand slipping out (no blood, no body shown) */
export const sheetBody = (p: Pen) => {
  p.ell(300, 965, 290, 22, "rgba(0,0,0,.3)", 0);
  p.poly([[20, 960], [40, 880], [110, 840], [160, 860], [230, 830], [330, 845], [420, 820], [520, 850], [580, 900], [585, 960]], "#e6e2d6", 10);
  for (const x of [150, 280, 400]) p.stroke([[x, 860], [x + 30, 950]], 4, "rgba(120,115,100,.5)");
  p.poly([[330, 950], [350, 985], [395, 990], [410, 975], [380, 955]], "#d9d2b0", 7);
};
/** porthole glass seen from outside, pasted over with pages from inside */
export const paperedGlass = (p: Pen, n = 7) => {
  p.ell(300, 500, 280, 280, "#2a2420", 0);
  p.clip(ellPts(300, 500, 278, 278, 0, 360, 0, 40), () => {
    for (let i = 0; i < n; i++) {
      const a = i * 2.1, x = 300 + 150 * Math.cos(a) * (i ? 1 : 0), y = 500 + 150 * Math.sin(a) * (i ? 1 : 0);
      p.poly([[x - 160, y - 200], [x + 150, y - 185], [x + 160, y + 190], [x - 150, y + 200]], i % 2 ? "#c9bea0" : "#d6cbae", 6);
      for (let l = 0; l < 6; l++) p.stroke([[x - 110, y - 140 + l * 40], [x + 60, y - 140 + l * 40]], 5, "rgba(60,50,40,.45)");
      p.ell(x + 40 * Math.cos(a * 3), y + 60, 46, 22, "rgba(92,62,32,.5)", 0, 0, 360, a * 40);
    }
  });
};
/** the whole frame going dark (k 0..1) with two eyes that stay lit */
export const blackout = (p: Pen, k = 1, eyes = 1) => {
  p.poly([[-400, -400], [1000, -400], [1000, 1400], [-400, 1400]], `rgba(5,4,8,${Math.max(0, Math.min(1, k)).toFixed(2)})`, 0);
  if (eyes > 0) for (const x of [255, 345]) { p.ell(x, 470, 26, 20 * eyes, "#f4f0a0", 0); p.ell(x + 3, 471, 6, 17 * eyes, "#120b10", 0); }
};
/** a round wall microphone grille on a riveted plate (scale ~.12) */
export const wallMic = (p: Pen) => {
  p.poly(rrect(120, 330, 480, 690, 30), "#5d6563", 11);
  for (const [x, y] of [[155, 365], [445, 365], [155, 655], [445, 655]]) p.ell(x, y, 12, 12, "#2b2e30", 0);
  p.ell(300, 510, 140, 140, "#3d4140", 10);
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (i * i + j * j < 12) p.ell(300 + i * 34, 510 + j * 34, 10, 10, "#0d0f0f", 0);
  p.stroke([[300, 330], [300, 40]], 22, "#59625c");
};
/** a smeared hand print slammed on glass from the far side (grubby, not bloody); smear 0..1 drags it down */
export const handprint = (p: Pen, smear = 0) => {
  const col = "rgba(18,12,10,.96)", dy = 140 * smear;
  p.ell(300, 560 + dy * 0.3, 95, 115, col, 0);
  for (const [x, y, w, h, a] of [[195, 400, 26, 95, -18], [255, 360, 26, 115, -6], [318, 355, 26, 118, 4], [378, 380, 25, 102, 14], [420, 520, 24, 80, 50]] as number[][])
    p.ell(x, y + dy * 0.3, w, h, col, 0, 0, 360, a);
  if (smear > 0) for (let i = 0; i < 5; i++) p.stroke([[220 + i * 40, 600 + dy * 0.3], [214 + i * 41, 640 + dy]], 14, "rgba(40,30,24,.5)");
};
/** a long distorted human shadow (for a soft fx card on a wall): bean head, thin stretched body, long arms */
export const shadowFigure = (p: Pen, reach = 0) => {
  const c = "rgba(4,4,6,.62)";
  p.ell(300, 170, 95, 115, c, 0);
  p.poly([[230, 260], [370, 260], [350, 760], [250, 760]], c, 0);
  p.poly([[250, 750], [290, 750], [270, 990], [225, 990]], c, 0); p.poly([[310, 750], [350, 750], [375, 990], [330, 990]], c, 0);
  const ay = 300 - 260 * reach;
  p.stroke([[240, 300], [150, 420 - 120 * reach], [110, ay + 250]], 34, c); p.stroke([[360, 300], [450, 420 - 120 * reach], [490, ay + 250]], 34, c);
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) p.stroke([[300 + s * 190, ay + 250], [300 + s * (200 + 10 * k), ay + 200 - 12 * k]], 9, c);
};
/** a taut rope fraying in the middle (k 0..1) and snapping (snap 0..1: the two ends whip apart and dangle) */
export const rope = (p: Pen, k = 0, snap = 0) => {
  const col = "#b08a5a", dk = "#7a5a34";
  const strand = (y0: number, y1: number, x: number, w: number) => { p.stroke([[x, y0], [x, y1]], w, INK); p.stroke([[x, y0], [x, y1]], w - 8, col); for (let y = y0; y < y1; y += 26) p.stroke([[x - w / 2 + 5, y], [x + w / 2 - 5, y + 16]], 4, dk); };
  if (snap <= 0) {
    strand(0, 470, 300, 44); strand(530, 1000, 300, 44);
    const n = Math.round(10 * (1 - k)) + 2; // fewer fibres hold as it frays
    for (let i = 0; i < n; i++) p.stroke([[282 + (i * 36) / n, 470], [284 + (i * 36) / n + 6 * Math.sin(i), 530]], 5, col);
    for (let i = 0; i < 14 * k; i++) p.stroke([[300 + (i % 2 ? 1 : -1) * 20, 480 + i * 3], [300 + (i % 2 ? 1 : -1) * (40 + 30 * k), 470 + i * 5]], 3, col);
  } else {
    const d = 160 * Math.min(1, snap * 1.6), sw = 30 * Math.sin(snap * 14) * (1 - snap);
    strand(0, 470 - d, 300 + sw, 44); strand(530 + d, 1000, 300 - sw, 44);
    for (const [y, s] of [[470 - d, 1], [530 + d, -1]] as [number, number][]) for (let i = 0; i < 9; i++) p.stroke([[290 + i * 3, y], [270 + i * 8 + sw * s, y + s * (30 + 10 * (i % 3))]], 4, col);
  }
};
/** an open book held at the chest with a page being ripped out (k 0..1: the page lifts, tears free and flies up) */
export const tearBook = (p: Pen, k = 0) => {
  openBook(p);
  const a = Math.min(1, k * 1.4), fly = Math.max(0, k - 0.7) / 0.3;
  const x0 = 305, top = 690 - 140 * fly, ang = -0.9 * a;
  const P = (x: number, y: number): [number, number] => [x0 + (x - x0) * Math.cos(ang) - (y - 965) * Math.sin(ang) * 0.3 + 60 * fly, top + (y - 690) * (1 - 0.3 * a) + 965 - 965];
  const pg: [number, number][] = [P(305, 725), P(520, 690), P(520, 935), P(305, 965)];
  p.poly(pg, "#f2ead2", 7);
  if (a > 0.4 && fly < 1) for (let i = 0; i < 5; i++) p.stroke([[305, 735 + i * 45], [292 - 10 * (i % 2), 745 + i * 45]], 4, "rgba(60,50,40,.8)"); // the torn edge
};
/** n torn pages pasted on glass, seen from the far side (no background: the room behind stays visible) */
export const pagesOnGlass = (p: Pen, n = 0) => {
  const spots: [number, number, number][] = [[230, 420, -0.2], [380, 440, 0.25], [300, 560, 0.05], [190, 600, 0.3], [410, 610, -0.15], [290, 380, -0.35], [300, 690, 0.15], [210, 500, 0.4], [400, 520, -0.3]];
  for (let i = 0; i < Math.min(n, spots.length); i++) {
    const [x, y, a] = spots[i], c = Math.cos(a), s = Math.sin(a), R = (dx: number, dy: number): [number, number] => [x + dx * c - dy * s, y + dx * s + dy * c];
    p.poly([R(-95, -125), R(90, -118), R(96, 120), R(-90, 125)], i % 2 ? "#cfc4a6" : "#ddd2b2", 6);
    for (let l = 0; l < 6; l++) p.stroke([R(-70, -90 + l * 32), R(40, -90 + l * 32)], 4, "rgba(60,50,40,.45)");
    p.ell(R(10, 20)[0], R(10, 20)[1], 50, 30, "rgba(70,48,26,.75)", 0, 0, 360, a * 57);
  }
};
/** a 1940s stand microphone head (scale ~.25): a round grille on a short neck */
export const standMic = (p: Pen) => {
  p.stroke([[300, 620], [300, 980]], 24, INK); p.stroke([[300, 620], [300, 980]], 14, "#6a7072");
  p.ell(300, 500, 120, 140, "#4a5052", 11);
  for (let i = -3; i <= 3; i++) p.stroke([[300 + i * 30, 380 + Math.abs(i) * 8], [300 + i * 30, 620 - Math.abs(i) * 8]], 7, "#1a1c1d");
  p.ell(300, 500, 120, 140, null, 11); p.ell(300, 370, 60, 20, "#8a9092", 8);
};
