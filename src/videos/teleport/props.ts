// Story-only drawings for "teleport" (600 x 1000 design space): the upload screen whose bar never moves.
import { Pen, rrect } from "../../../library/engine/toon";

/** big monitor with a progress bar at pct (0..1) and a spinner at angle a */
export const uploadScreen = (p: Pen, pct = 0, a = 0) => {
  p.poly(rrect(30, 300, 570, 760, 24), "#3a3f52", 11);
  p.poly(rrect(60, 330, 540, 730, 12), "#1f2a44", 7);
  p.poly(rrect(100, 560, 500, 620, 14), "#0f1626", 7);
  if (pct > 0) p.poly(rrect(104, 564, 104 + Math.max(10, 392 * pct), 616, 10), "#5ad8ff", 0);
  for (let i = 0; i < 8; i++) {
    const b = a + (i * Math.PI) / 4;
    p.ell(300 + 60 * Math.cos(b), 450 + 60 * Math.sin(b), 12, 12, `rgba(255,255,255,${(0.25 + 0.75 * (i / 7)).toFixed(2)})`, 0);
  }
  p.poly([[270, 760], [330, 760], [350, 900], [250, 900]], "#3a3f52", 9);
  p.poly(rrect(190, 900, 410, 940, 10), "#3a3f52", 9);
};

/** Dave's coffee mug: upright (spill 0) or tipped over with a puddle (spill 0..1). Bottom at y 975; use scale ~0.07 */
export const floorMug = (p: Pen, spill = 0) => {
  if (spill > 0) p.ell(300, 960, 60 + 230 * spill, 18 + 22 * spill, "#7a4a2a", 7);
  if (spill <= 0) {
    p.stroke([[440, 560], [560, 600], [560, 780], [440, 820]], 40, "#241726");
    p.poly([[130, 450], [470, 450], [455, 975], [145, 975]], "#f2efe6", 12);
    p.poly([[138, 600], [462, 600], [459, 690], [141, 690]], "#d9534f", 0);
  } else {
    p.poly([[80, 700], [560, 700], [560, 970], [80, 970]], "#f2efe6", 12);
    p.poly([[230, 700], [300, 700], [300, 970], [230, 970]], "#d9534f", 0);
    p.ell(560, 835, 30, 135, "#e3ded2", 10);
  }
};
