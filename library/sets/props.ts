// In-world text props (allowed since 2026-11-03; reference study: a "MAY 1880" calendar, a thrust newspaper, banners
// and signs carry the facts). Text is part of the object: short, English, readable for >= 1 s, kept out of the caption
// band (centre 79 % of the height). A prop that states a fact needs a source like any narrated fact.
//   drawProp(g, kind, o, W, H): paints a prop on a 2D canvas (shared by the board meshes and the billboard textCard).
//   textBoard(G, kind, o): a fixed board in a place (wall sign, calendar on a wall, banner on poles, label on a crate).
// Fonts: Montserrat (bundled, OFL) as "PropSans". makeShort holds the shot canvases until propFont() resolves, so
// a board built in a place builder never paints with a fallback font.
import * as THREE from "three";
import { staticFile } from "remotion";
import { INK } from "../engine/toon";

export const PROP_FONT = "PropSans";
let fontP: Promise<void> | null = null;
export const propFont = () => (fontP ??= new FontFace(PROP_FONT, `url(${staticFile("fonts/Montserrat-Variable.ttf")}) format("truetype")`, { weight: "100 900" })
  .load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); }));

export type PropKind = "calendar" | "newspaper" | "banner" | "sign" | "label";
export type PropOpts = {
  /** main text: calendar big line ("1880"), newspaper headline, banner / sign / label text */
  text: string;
  /** calendar month band ("MAY"), newspaper masthead ("THE DAILY GAZETTE") */
  top?: string;
  /** calendar: circle this day cell (1-28) */
  circle?: number;
  /** base colour: banner cloth, sign wood, label paper */
  color?: string;
  /** text colour */
  ink?: string;
};
/** canvas size per kind (px); world height = width * H / W */
export const PROP_SIZE: Record<PropKind, [number, number]> = {
  calendar: [600, 760], newspaper: [700, 900], banner: [1200, 300], sign: [900, 360], label: [420, 220],
};

const font = (size: number, weight = 800) => `${weight} ${Math.round(size)}px ${PROP_FONT}, Montserrat, sans-serif`;
/** wrap and size text to fit a box; returns the lines and the font size */
const fit = (g: CanvasRenderingContext2D, text: string, maxW: number, maxH: number, weight = 800, maxLines = 3) => {
  const words = text.split(/\s+/);
  for (let size = maxH; size > 8; size *= 0.94) {
    g.font = font(size, weight);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (g.measureText(next).width <= maxW || !cur) cur = next; else { lines.push(cur); cur = w; }
    }
    lines.push(cur);
    if (lines.length <= maxLines && lines.length * size * 1.08 <= maxH && lines.every((l) => g.measureText(l).width <= maxW)) return { lines, size };
  }
  return { lines: [text], size: 10 };
};
const write = (g: CanvasRenderingContext2D, text: string, cx: number, cy: number, maxW: number, maxH: number, fill: string, o: { weight?: number; stroke?: string; sw?: number; maxLines?: number } = {}) => {
  const { lines, size } = fit(g, text, maxW, maxH, o.weight ?? 800, o.maxLines ?? 3);
  g.font = font(size, o.weight ?? 800); g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  lines.forEach((l, i) => {
    const y = cy + (i - (lines.length - 1) / 2) * size * 1.05;
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = o.sw ?? size * 0.16; g.strokeText(l, cx, y); }
    g.fillStyle = fill; g.fillText(l, cx, y);
  });
};
const rrect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, ol = 0) => {
  g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = fill; g.fill();
  if (ol) { g.strokeStyle = INK; g.lineWidth = ol; g.stroke(); }
};
const hash = (i: number, s: number) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

/** paint a prop on a W x H canvas (any W x H with the kind's aspect; drawn in the kind's design size) */
export const drawProp = (g: CanvasRenderingContext2D, kind: PropKind, o: PropOpts, W: number, H: number) => {
  const [dw, dh] = PROP_SIZE[kind];
  g.save(); g.scale(W / dw, H / dh);
  const ink = o.ink;
  if (kind === "calendar") {
    rrect(g, 14, 30, 572, 716, 18, "#fbf6ea", 10);
    rrect(g, 14, 30, 572, 160, 18, o.color ?? "#d8483c", 10);
    for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(80 + i * 73, 30, 14, 0, Math.PI * 2); g.fillStyle = "#c9c2b4"; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); }
    write(g, o.top ?? "MAY", 300, 115, 500, 100, "#ffffff", { weight: 900 });
    write(g, o.text, 300, 300, 520, 170, ink ?? "#2b2340", { weight: 900, maxLines: 1 });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
      const x = 50 + c * 72, y = 420 + r * 76, n = r * 7 + c + 1;
      g.strokeStyle = "#bdb4a2"; g.lineWidth = 3; g.strokeRect(x, y, 66, 70);
      g.fillStyle = "#8a8170"; g.font = font(24, 700); g.textAlign = "left"; g.textBaseline = "top"; g.fillText(String(n), x + 7, y + 6);
      if (o.circle === n) { g.beginPath(); g.ellipse(x + 33, y + 35, 44, 40, -0.2, 0, Math.PI * 2); g.strokeStyle = "#d8483c"; g.lineWidth = 8; g.stroke(); }
    }
  } else if (kind === "newspaper") {
    rrect(g, 10, 10, 680, 880, 6, "#f1ead8", 10);
    write(g, o.top ?? "THE DAILY GAZETTE", 350, 80, 620, 80, ink ?? "#241726", { weight: 900, maxLines: 1 });
    g.fillStyle = "#241726"; g.fillRect(40, 132, 620, 8); g.fillRect(40, 148, 620, 3);
    write(g, o.text.toUpperCase(), 350, 270, 620, 220, ink ?? "#241726", { weight: 900 });
    rrect(g, 40, 400, 290, 220, 4, "#d6cdb6", 5);
    g.strokeStyle = "#9f957f"; g.lineWidth = 6;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(60, 590 - i * 40); g.quadraticCurveTo(185, 470 - i * 30 + 60 * hash(i, 2), 310, 560 - i * 45); g.stroke(); }
    g.fillStyle = "#b7ad97";
    for (let col = 0; col < 2; col++) for (let i = 0; i < 16; i++) {
      const x = col ? 360 : 40, y = col ? 405 + i * 28 : 640 + i * 28, w = (col ? 300 : 290) * (0.7 + 0.3 * hash(i, col + 4));
      if (y < 860) g.fillRect(x, y, w, 12);
    }
  } else if (kind === "banner") {
    const c = o.color ?? "#d8483c";
    rrect(g, 10, 20, 1180, 200, 10, c, 10);
    g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(14, 186, 1172, 30);
    for (let i = 0; i < 12; i++) {
      const x = 20 + i * 98;
      g.beginPath(); g.moveTo(x, 222); g.lineTo(x + 90, 222); g.lineTo(x + 45, 292); g.closePath();
      g.fillStyle = i % 2 ? "#f2d64b" : "#3f6fb5"; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    }
    write(g, o.text.toUpperCase(), 600, 112, 1100, 150, ink ?? "#ffffff", { weight: 900, stroke: INK, maxLines: 1 });
  } else if (kind === "sign") {
    const c = o.color ?? "#b07a48";
    rrect(g, 10, 10, 880, 340, 22, c, 12);
    g.strokeStyle = "rgba(60,30,10,0.35)"; g.lineWidth = 5;
    for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(16, 10 + i * 113); g.lineTo(884, 10 + i * 113); g.stroke(); }
    g.lineWidth = 3;
    for (let i = 0; i < 9; i++) { const y = 30 + hash(i, 7) * 300, x = 40 + hash(i, 8) * 600; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 90, y - 10, x + 200, y + 4); g.stroke(); }
    for (const [x, y] of [[40, 40], [860, 40], [40, 320], [860, 320]]) { g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fillStyle = "#5a4636"; g.fill(); }
    write(g, o.text.toUpperCase(), 450, 180, 780, 250, ink ?? "#fff4d6", { weight: 900, stroke: INK });
  } else {
    rrect(g, 10, 10, 400, 200, 16, o.color ?? "#fbf6ea", 8);
    g.strokeStyle = "#c9b98f"; g.lineWidth = 4; g.strokeRect(32, 32, 356, 156);
    write(g, o.text.toUpperCase(), 210, 110, 320, 120, ink ?? "#2b2340", { weight: 800 });
  }
  g.restore();
};

export type BoardOpts = PropOpts & {
  /** board centre (local metres) and width; height follows the kind's aspect */
  x: number; y: number; z: number; w: number;
  /** yaw in radians (0 = faces +z) */
  yaw?: number; depth?: number;
  /** sign / banner: posts down to the ground (y = 0) */
  posts?: boolean;
};
/** a fixed text board in a place (shaded, inked, casts shadows) */
export const textBoard = (G: THREE.Group, kind: PropKind, o: BoardOpts) => {
  const [W, H] = PROP_SIZE[kind], k = Math.min(1, 1024 / W), cv = document.createElement("canvas");
  cv.width = Math.round(W * k * 1.6); cv.height = Math.round(H * k * 1.6);
  drawProp(cv.getContext("2d")!, kind, o, cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const h = (o.w * H) / W, d = kind === "sign" ? o.depth ?? 0.06 : 0;
  const g = new THREE.Group();
  // a sign is a solid plank; paper and cloth are one alpha-tested sheet (a box would show its back wall through the gaps)
  const board = kind === "sign"
    ? new THREE.Mesh(new THREE.BoxGeometry(o.w, h, d), [...Array(4).fill(new THREE.MeshLambertMaterial({ color: "#7a5232" })), new THREE.MeshLambertMaterial({ map: tex }), new THREE.MeshLambertMaterial({ color: "#7a5232" })])
    : new THREE.Mesh(new THREE.PlaneGeometry(o.w, h), new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide }));
  board.castShadow = true; board.receiveShadow = true;
  g.add(board);
  if (o.posts) {
    const pm = new THREE.MeshLambertMaterial({ color: "#6b4a2f" }), r = Math.max(0.03, o.w * 0.025), ph = o.y + h / 2;
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(r, r, ph, 8), pm);
      post.position.set(sx * (o.w / 2 - r), ph / 2 - o.y, -d / 2 - r);
      post.castShadow = true; g.add(post);
    }
  }
  g.position.set(o.x, o.y, o.z); g.rotation.y = o.yaw ?? 0;
  G.add(g);
  return g;
};
