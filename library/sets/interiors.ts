// Grim interiors (first built for "sleep-experiment"). Same contract as sets.ts: local coordinates, ground y = 0, the
// camera side is +z, place the group with the production's x. Every builder takes { variant } (0-3 re-dress colours).
//   testChamber  : sealed concrete test room 10 x 11 m with a ceiling: two-tone painted walls with stains and cracks,
//                  a steel door with a wheel between two portholes (amber corridor light behind), gas vents, wall
//                  microphone grilles, 5 steel cots, a book shelf, sink + toilet, pipes and valves, caged bulbs, a floor
//                  drain. Returns { door, pages, water, tins } for pose(): swing the door, paste pages over the
//                  portholes, flood the floor, show the tower of uneaten tins.
//   controlRoom  : the observation side 8 x 8 m: a console desk with dials, switches, a reel recorder, intercom mic,
//                  headphones; a big porthole into a glowing room, filing cabinets, a poster, pipes, amber lamps.
//   bedroom      : a child's bedroom at night 7 x 6.5 m: bed with a dark gap under it, nightstand lamp (on / off),
//                  moonlit window with curtains, rug, toy box, shelf, posters. Returns { lampOn, lampOff, glow }.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, quad } from "../engine/build";
import { ctex, rep } from "../engine/paint";
import type { Variant } from "./sets";

type V3 = [number, number, number];
const up = (x0: number, x1: number, z0: number, z1: number, tile: number, y = 0) =>
  quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile);
const down = (x0: number, x1: number, z0: number, z1: number, tile: number, y: number) =>
  quad(V(x0, y, z0), V(x1, y, z0), V(x1, y, z1), V(x0, y, z1), (x1 - x0) / tile, (z1 - z0) / tile);
const cyl = (r: number, h: number, x: number, y: number, z: number, n = 12) => new THREE.CylinderGeometry(r, r, h, n).translate(x, y, z);
const pipeX = (r: number, x0: number, x1: number, y: number, z: number) => new THREE.CylinderGeometry(r, r, x1 - x0, 10).rotateZ(Math.PI / 2).translate((x0 + x1) / 2, y, z);
const pipeZ = (r: number, z0: number, z1: number, x: number, y: number) => new THREE.CylinderGeometry(r, r, z1 - z0, 10).rotateX(Math.PI / 2).translate(x, y, (z0 + z1) / 2);
/** a flat disc facing +z (portholes, gauges, grilles) */
const discZ = (r: number, x: number, y: number, z: number, n = 24) => new THREE.CircleGeometry(r, n).translate(x, y, z);
const ringZ = (r0: number, r1: number, x: number, y: number, z: number) => new THREE.RingGeometry(r0, r1, 28).translate(x, y, z);
/** a valve hand-wheel facing +z: rim + 4 spokes */
const wheelZ = (b: Batch, m: THREE.Material, x: number, y: number, z: number, r: number) => {
  b.add(new THREE.TorusGeometry(r, r * 0.12, 6, 20).translate(x, y, z), m);
  for (let i = 0; i < 2; i++) b.add(boxGeo(V(-r, -r * 0.06, -r * 0.05), V(r, r * 0.06, r * 0.05)).rotateZ((i * Math.PI) / 2 + 0.4).translate(x, y, z), m);
  b.add(cyl(r * 0.18, r * 0.3, x, y, z, 8).rotateX(Math.PI / 2).translate(0, 0, 0), m);
};

// ---------------- textures ----------------
const WALLS = [["#8fa596", "#c9cbbd"], ["#7d8f9e", "#c4c7c0"], ["#9c9582", "#d2cbb8"], ["#8a9a84", "#bfc4b4"]];
/** Soviet two-tone institutional wall: dark painted dado, pale upper wall, a dividing stripe, stains, drips and cracks */
const wallTex = (key: string, low: string, high: string) => ctex(key, 1024, 512, (g, r) => {
  g.fillStyle = high; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = low; g.fillRect(0, 300, 1024, 212);
  g.fillStyle = "rgba(40,30,30,.55)"; g.fillRect(0, 294, 1024, 8);
  for (let i = 0; i < 260; i++) { // mottled paint
    g.fillStyle = `rgba(${r() < 0.5 ? "60,60,50" : "255,255,240"},${0.03 + r() * 0.05})`;
    g.beginPath(); g.ellipse(r() * 1024, r() * 512, 10 + r() * 50, 6 + r() * 30, r() * 3, 0, 7); g.fill();
  }
  for (let i = 0; i < 16; i++) { // rust drips running down
    const x = r() * 1024, y0 = r() * 200, len = 60 + r() * 220;
    const gr = g.createLinearGradient(0, y0, 0, y0 + len); gr.addColorStop(0, "rgba(110,70,40,.45)"); gr.addColorStop(1, "rgba(110,70,40,0)");
    g.fillStyle = gr; g.fillRect(x, y0, 3 + r() * 6, len);
  }
  g.strokeStyle = "rgba(40,30,35,.6)"; g.lineWidth = 2; // hairline cracks
  for (let i = 0; i < 6; i++) { let x = r() * 1024, y = r() * 512; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 40; y += 8 + r() * 18; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 8; i++) { // scuffs along the dado
    g.fillStyle = `rgba(30,25,25,${0.08 + r() * 0.1})`; g.fillRect(r() * 1024, 440 + r() * 60, 30 + r() * 80, 4 + r() * 8);
  }
});
const concreteTex = (key: string, base: string) => ctex(key, 1024, 1024, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { // poured slabs with slightly different greys
    g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.03 + r() * 0.05})`; g.fillRect(i * 256, j * 256, 256, 256);
  }
  g.strokeStyle = "rgba(30,30,35,.5)"; g.lineWidth = 4;
  for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 256, 0); g.lineTo(k * 256, 1024); g.moveTo(0, k * 256); g.lineTo(1024, k * 256); g.stroke(); }
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(20,20,20,${0.05 + r() * 0.12})`; g.fillRect(r() * 1024, r() * 1024, 2 + r() * 4, 2 + r() * 4); }
  for (let i = 0; i < 10; i++) { // damp stains
    const x = r() * 1024, y = r() * 1024, rr = 40 + r() * 120, gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, "rgba(40,45,35,.28)"); gr.addColorStop(1, "rgba(40,45,35,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
  }
});
const steelTex = (key: string, col: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = col; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`; g.lineWidth = 1; const y = r() * 512; g.beginPath(); g.moveTo(0, y); g.lineTo(512, y + (r() - 0.5) * 8); g.stroke(); }
  for (let i = 0; i < 12; i++) { const x = r() * 512, y = r() * 512, rr = 20 + r() * 50, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, "rgba(120,70,40,.35)"); gr.addColorStop(1, "rgba(120,70,40,0)"); g.fillStyle = gr; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr); }
  g.fillStyle = "rgba(30,30,35,.8)";
  for (let k = 0; k < 8; k++) for (const y of [14, 498]) { g.beginPath(); g.arc(20 + k * 67, y, 6, 0, 7); g.fill(); } // rivets
});
const grateTex = () => ctex("drainGrate", 256, 256, (g) => {
  g.fillStyle = "#4a4d50"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.fillStyle = "#0e0f12"; for (let i = 0; i < 7; i++) g.fillRect(40 + i * 26, 50, 14, 156);
  g.strokeStyle = "#241726"; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 120, 0, 7); g.stroke();
});
const ventTex = () => ctex("gasVent", 256, 256, (g) => {
  g.fillStyle = "#6f7470"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#121414"; for (let i = 0; i < 8; i++) g.fillRect(24, 24 + i * 27, 208, 15);
  g.strokeStyle = "#241726"; g.lineWidth = 10; g.strokeRect(5, 5, 246, 246);
  g.fillStyle = "#2a2d2c"; for (const [x, y] of [[14, 14], [242, 14], [14, 242], [242, 242]]) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
});
const micTex = () => ctex("micGrille", 128, 128, (g) => {
  g.fillStyle = "#3d4140"; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
  g.fillStyle = "#0d0f0f"; for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (i * i + j * j < 12) { g.beginPath(); g.arc(64 + i * 13, 64 + j * 13, 4, 0, 7); g.fill(); }
  g.strokeStyle = "#241726"; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 59, 0, 7); g.stroke();
});
/** a torn book page with a grubby brown smear (the story's window covering, kept cartoon-vague) */
const pageTex = (i: number) => ctex("tornPage" + i, 256, 320, (g, r) => {
  g.fillStyle = "#e8dfc4";
  g.beginPath(); g.moveTo(8, 10); for (let k = 0; k < 9; k++) g.lineTo(30 * k + 8, 6 + r() * 12); g.lineTo(248, 312); g.lineTo(8, 306); g.closePath(); g.fill();
  g.fillStyle = "rgba(60,50,40,.55)"; for (let y = 40; y < 290; y += 16) g.fillRect(26, y, 150 + r() * 60, 5); // print lines
  g.fillStyle = "rgba(92,62,32,.75)";
  g.beginPath(); g.ellipse(128 + (r() - 0.5) * 60, 170 + (r() - 0.5) * 60, 70 + r() * 30, 40 + r() * 30, r() * 3, 0, 7); g.fill();
  g.fillStyle = "rgba(92,62,32,.45)"; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(r() * 256, r() * 320, 14 + r() * 20, 8 + r() * 12, r() * 3, 0, 7); g.fill(); }
  g.strokeStyle = "#241726"; g.lineWidth = 5; g.strokeRect(8, 10, 240, 298);
});
const tinTex = (v: number) => ctex("tinLabel" + v, 256, 128, (g) => {
  g.fillStyle = ["#a8503a", "#5f7a48", "#c9a24a"][v]; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#efe6cf"; g.fillRect(0, 44, 256, 40);
  g.fillStyle = "#241726"; g.font = "bold 30px sans-serif"; g.fillText(["MEAT", "BEANS", "FISH"][v], 70, 76);
});

// ---------------- test chamber ----------------
export type ChamberHandles = { door: THREE.Group; pages: THREE.Mesh[][]; water: THREE.Mesh; tins: THREE.Group };
/** where things are (local); use these from story.ts */
export const CHAMBER = {
  door: [0, 0, -6] as V3, ports: [[-2.3, 1.65, -6], [2.3, 1.65, -6]] as V3[], portR: 0.36,
  vents: [[-3.4, 3.05, -6], [3.4, 3.05, -6]] as V3[], mics: [[-4.95, 1.75, -2.6], [4.95, 1.75, -2.6]] as V3[],
  cots: [[-4.2, 0, -3.0], [-4.2, 0, -0.4], [-4.2, 0, 2.2], [4.2, 0, -0.4], [4.2, 0, 2.2]] as V3[], drain: [0.4, 0, -1.2] as V3,
  shelf: [4.55, 0, -4.6] as V3, tins: [-1.9, 0, -5.2] as V3, clock: [1.75, 2.62, -5.95] as V3, calendar: [-1.45, 2.15, -5.9] as V3,
  bulbs: [[-1.6, 2.75, -2.6], [1.6, 2.75, 0.6]] as V3[], H: 3.6,
};
export function testChamber(G: THREE.Group, o: Variant & { tinRows?: number } = {}): ChamberHandles {
  const vi = (o.variant ?? 0) % WALLS.length, [lo, hi] = WALLS[vi], b = new Batch(), C = CHAMBER;
  const wall = lam("chWall" + vi, () => ({ map: rep(wallTex("chWallT" + vi, lo, hi), 1, 1) }));
  const wallS = lam("chWallS" + vi, () => ({ map: rep(wallTex("chWallT" + vi, lo, hi), 1.1, 1) }));
  const steel = lam("chSteel", () => ({ map: steelTex("chSteelT", "#6b7472") })), dark = lam("chDark", () => ({ color: "#2b2e30" }));
  const pipe = lam("chPipe", () => ({ color: "#59625c" })), rust = lam("chRust", () => ({ color: "#7a4e34" })), redV = lam("chValve", () => ({ color: "#9e3434" }));
  const mattress = lam("chMat", () => ({ color: "#8c8a78" })), pillow = lam("chPillow", () => ({ color: "#c2bda6" })), blanket = lam("chBlanket" + vi, () => ({ color: ["#5d5a4a", "#4f5a5f", "#6a5040", "#575c48"][vi] }));
  const amber = lam("chCorridor", () => ({ color: "#ffcf7a", emissive: "#d68a2c" }));
  const bulb = lam("chBulb", () => ({ color: "#fff2c4", emissive: "#ffd27a" }));
  // floor, walls (back wall split around the door and the two portholes), ceiling
  b.add(up(-5, 5, -6, 5, 2.5), lam("chFloor", () => ({ map: concreteTex("chFloorT", "#7c7f78") })));
  const W = 1.0, DH = 2.15;
  b.add(boxGeo(V(-5, 0, -6.3), V(-W / 2 - 0.12, C.H, -6), 0), wall);
  b.add(boxGeo(V(W / 2 + 0.12, 0, -6.3), V(5, C.H, -6), 0), wall);
  b.add(boxGeo(V(-W / 2 - 0.12, DH + 0.12, -6.3), V(W / 2 + 0.12, C.H, -6)), wall);
  b.add(boxGeo(V(-5.3, 0, -6.3), V(-5, C.H, 5)), wallS);
  b.add(boxGeo(V(5, 0, -6.3), V(5.3, C.H, 5)), wallS);
  const ceil = new Batch();
  ceil.add(down(-5.3, 5.3, -6.3, 5, 2.5, C.H), lam("chCeil", () => ({ map: concreteTex("chCeilT", "#9a9c92") })));
  // corridor behind the back wall (lit amber, seen through the portholes and the open door)
  b.add(up(-3, 3, -9, -6.3, 2), lam("chCorFloor", () => ({ color: "#5a5146" })));
  b.add(boxGeo(V(-3, 0, -9.3), V(3, 3.2, -9)), amber);
  for (const s of [-1, 1]) b.add(boxGeo(V(s < 0 ? -3.3 : 3, 0, -9.3), V(s < 0 ? -3 : 3.3, 3.2, -6.3)), lam("chCorWall", () => ({ color: "#b98a52" })));
  // porthole frames: steel ring with 10 bolts, amber glass behind
  for (const [x, y] of C.ports) {
    b.add(discZ(C.portR, x, y, -6.22), amber);
    b.add(new THREE.TorusGeometry(C.portR + 0.05, 0.07, 8, 28).translate(x, y, -5.98), steel);
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; b.add(cyl(0.025, 0.04, x + (C.portR + 0.05) * Math.cos(a), y + (C.portR + 0.05) * Math.sin(a), -5.92, 6).rotateX(0), dark); }
    for (const dy of [-0.48, 0.48]) b.add(boxGeo(V(x - 0.5, y + dy - 0.04, -6.0), V(x + 0.5, y + dy + 0.04, -5.95)), steel); // reinforcing straps
  }
  // door frame + a riveted steel door in a pivot group (hinge on the left)
  b.add(boxGeo(V(-W / 2 - 0.14, 0, -6.05), V(-W / 2, DH + 0.14, -5.92)), steel);
  b.add(boxGeo(V(W / 2, 0, -6.05), V(W / 2 + 0.14, DH + 0.14, -5.92)), steel);
  b.add(boxGeo(V(-W / 2 - 0.14, DH, -6.05), V(W / 2 + 0.14, DH + 0.14, -5.92)), steel);
  b.add(boxGeo(V(-0.9, DH + 0.3, -5.99), V(0.9, DH + 0.55, -5.96)), lam("chSignBg", () => ({ color: "#b8322e" }))); // red warning band
  const door = new THREE.Group(); door.position.set(-W / 2, 0, -6.12);
  const db = new Batch();
  db.add(boxGeo(V(0, 0.02, -0.08), V(W, DH, 0.08), 0.9), lam("chDoor", () => ({ map: steelTex("chDoorT", "#5d6a66") })));
  for (const y of [0.35, 1.1, 1.85]) db.add(boxGeo(V(0.04, y - 0.05, 0.08), V(W - 0.04, y + 0.05, 0.12)), steel);
  wheelZ(db, redV, W / 2, 1.2, 0.18, 0.24);
  db.add(boxGeo(V(W / 2 - 0.12, 1.55, 0.08), V(W / 2 + 0.12, 1.75, 0.1)), amber); // tiny spy slot
  db.build(door); G.add(door);
  // gas vents high on the back wall with a duct running into the ceiling
  for (const [x, y] of C.vents) {
    b.add(boxGeo(V(x - 0.42, y - 0.32, -6.0), V(x + 0.42, y + 0.32, -5.93)), dark);
    b.add(quad(V(x - 0.38, y - 0.28, -5.92), V(x + 0.38, y - 0.28, -5.92), V(x + 0.38, y + 0.28, -5.92), V(x - 0.38, y + 0.28, -5.92)), lam("chVentT", () => ({ map: ventTex() })));
    b.add(boxGeo(V(x - 0.25, y + 0.32, -6.0), V(x + 0.25, C.H, -5.75)), pipe);
  }
  b.add(boxGeo(V(-4.98, 3.0, -5.0), V(-4.9, 3.5, -4.2)), dark); // a third, smaller vent on the left wall
  // microphone grilles on both side walls, with conduit up to the ceiling
  for (const [x, y, z] of C.mics) {
    const s = Math.sign(x);
    b.add(new THREE.CircleGeometry(0.17, 24).rotateY(-s * Math.PI / 2).translate(x - s * 0.04, y, z), lam("chMicT", () => ({ map: micTex() })));
    b.add(boxGeo(V(x - (s > 0 ? 0.06 : -0.02), y - 0.24, z - 0.24), V(x + (s > 0 ? 0.02 : 0.06), y + 0.24, z + 0.24)), steel);
    b.add(boxGeo(V(x - (s > 0 ? 0.08 : -0.02), y + 0.24, z - 0.03), V(x + (s > 0 ? 0.02 : 0.08), C.H, z + 0.03)), pipe);
  }
  // pipes along the walls with valves and brackets
  for (const [y, r] of [[3.3, 0.07], [3.12, 0.045]] as [number, number][]) b.add(pipeX(r, -5, 5, y, -5.85), pipe);
  b.add(pipeZ(0.07, -6, 5, 4.85, 3.3), pipe); b.add(pipeZ(0.05, -6, 5, -4.85, 3.25), pipe);
  b.add(cyl(0.06, 3.3, 3.95, 1.65, -5.85), pipe); b.add(cyl(0.05, 3.25, -3.05, 1.62, -5.88), rust);
  wheelZ(b, redV, 3.95, 1.25, -5.72, 0.14); wheelZ(b, redV, -3.05, 2.2, -5.75, 0.11);
  for (let x = -4.5; x < 5; x += 1.5) b.add(boxGeo(V(x - 0.04, 3.05, -6), V(x + 0.04, 3.4, -5.78)), dark);
  // floor drain + a dark stain round it
  b.add(new THREE.CircleGeometry(0.62, 28).rotateX(-Math.PI / 2).translate(C.drain[0], 0.006, C.drain[2]), lam("chStain", () => ({ color: "#5b5f55" })));
  b.add(new THREE.CircleGeometry(0.26, 24).rotateX(-Math.PI / 2).translate(C.drain[0], 0.012, C.drain[2]), lam("chGrate", () => ({ map: grateTex() })));
  // five steel cots: frame, legs, thin mattress, pillow, a rumpled blanket
  C.cots.forEach(([x, , z], i) => {
    const s = Math.sign(x), x0 = x - 0.45, x1 = x + 0.45, z0 = z - 1.0, z1 = z + 1.0;
    b.add(boxGeo(V(x0, 0.38, z0), V(x1, 0.44, z1)), steel);
    for (const [lx, lz] of [[x0, z0], [x1 - 0.05, z0], [x0, z1 - 0.05], [x1 - 0.05, z1 - 0.05]]) b.add(boxGeo(V(lx, 0, lz), V(lx + 0.05, 0.4, lz + 0.05)), dark);
    b.add(boxGeo(V(x0 + 0.03, 0.44, z0 + 0.03), V(x1 - 0.03, 0.56, z1 - 0.03)), mattress);
    b.add(boxGeo(V(x0 + 0.1, 0.56, z0 + 0.08), V(x1 - 0.1, 0.66, z0 + 0.45)), pillow);
    b.add(boxGeo(V(x0 + 0.05, 0.56, z0 + 0.9 + (i % 2) * 0.2), V(x1 - 0.02, 0.6 + 0.04 * (i % 3), z1 - 0.05)), blanket);
    b.add(boxGeo(V(s > 0 ? x0 - 0.1 : x1, 0.56, z1 - 0.6), V(s > 0 ? x0 : x1 + 0.1, 0.62, z1 - 0.1)), blanket); // blanket hanging over the edge
  });
  // book shelf in the back-right corner, books upright, leaning and fallen
  const [sx, , sz] = C.shelf, wood = lam("chShelf", () => ({ color: "#5e4a36" }));
  b.add(boxGeo(V(sx - 0.42, 0, sz - 0.9), V(sx + 0.42, 2.0, sz - 0.86)), wood);
  for (let s = 0; s < 4; s++) {
    const y = 0.15 + s * 0.48;
    b.add(boxGeo(V(sx - 0.42, y, sz - 0.9), V(sx + 0.42, y + 0.03, sz + 0.9)), wood);
    for (let k = 0; k < 11; k++) {
      if ((k * 7 + s * 3) % 9 === 0) continue; // gaps where pages were torn out
      const c = ["#7a3b34", "#3e5a6a", "#6a6a3e", "#4a3e5a", "#8a6a3a"][(k + s) % 5], h = 0.26 + ((k * 5 + s) % 3) * 0.05;
      b.add(boxGeo(V(sx - 0.3, y + 0.03, sz - 0.8 + k * 0.15), V(sx + 0.2, y + 0.03 + h, sz - 0.68 + k * 0.15)), lam("chBook" + c, () => ({ color: c })));
    }
  }
  for (const [x, z, a] of [[3.6, -3.4, 0.4], [3.2, -2.6, 1.3], [-0.8, -4.4, 2.2], [1.6, 0.4, 0.8]]) // books on the floor
    b.add(boxGeo(V(-0.17, 0, -0.12), V(0.17, 0.05, 0.12)).rotateY(a).translate(x, 0, z), lam("chBook#7a3b34", () => ({ color: "#7a3b34" })));
  // sink + toilet in the back-left corner
  const porc = lam("chPorc", () => ({ color: "#d9d6c8" }));
  b.add(boxGeo(V(-4.95, 0.75, -5.7), V(-4.4, 0.92, -5.15)), porc); b.add(cyl(0.05, 0.75, -4.65, 0.37, -5.45), pipe);
  b.add(cyl(0.025, 0.22, -4.9, 1.0, -5.43, 6), steel);
  b.add(cyl(0.22, 0.42, -4.6, 0.21, -4.6), porc); b.add(boxGeo(V(-4.98, 0.3, -4.85), V(-4.75, 0.85, -4.35)), porc);
  // caged bulbs hanging on cords
  for (const [x, y, z] of C.bulbs) {
    b.add(cyl(0.008, C.H - y - 0.15, x, (C.H + y + 0.15) / 2, z, 4), dark);
    b.add(new THREE.SphereGeometry(0.1, 12, 10).translate(x, y, z), bulb);
    for (let k = 0; k < 4; k++) b.add(new THREE.TorusGeometry(0.13, 0.008, 4, 14).rotateY((k * Math.PI) / 4).translate(x, y, z), dark);
    b.add(new THREE.ConeGeometry(0.2, 0.1, 14, 1, true).translate(x, y + 0.13, z), lam("chShade", () => ({ color: "#3c4440", side: THREE.DoubleSide })));
  }
  // a wall clock rim (the hands are a staging card) and a stencilled room number above the door
  b.add(new THREE.TorusGeometry(0.36, 0.05, 6, 28).translate(C.clock[0], C.clock[1], C.clock[2] + 0.02), dark); // clock rim (face + hands = a card)
  b.build(G); ceil.build(G, false);
  // pages pasted over each porthole (hidden; pose shows them one by one)
  const pages = C.ports.map(([x, y], pi) => Array.from({ length: 6 }, (_, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.45), lam("chPage" + ((k + pi) % 4), () => ({ map: pageTex((k + pi) % 4), alphaTest: 0.5 })));
    const a = (k / 6) * Math.PI * 2 + pi;
    m.position.set(x + 0.17 * Math.cos(a) * (k < 5 ? 1 : 0), y + 0.15 * Math.sin(a) * (k < 5 ? 1 : 0), -5.9 + 0.004 * k);
    m.rotation.z = (k * 0.7 + pi) % 1.2 - 0.6; m.visible = false; m.receiveShadow = true; G.add(m); return m;
  }));
  // flood water (hidden): a dark sheet a few cm deep
  const water = new THREE.Mesh(up(-5, 5, -6, 5, 1.5, 0.05), lam("chWater", () => ({ map: ctex("chWaterT", 512, 512, (g, r) => {
    g.fillStyle = "#5f8a82"; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(220,245,235,.45)"; g.lineWidth = 3;
    for (let i = 0; i < 26; i++) { const x = r() * 512, y = r() * 512, rr = 12 + r() * 40; g.beginPath(); g.ellipse(x, y, rr, rr * 0.35, 0, 0.2, 2.6); g.stroke(); }
    g.fillStyle = "rgba(40,60,58,.35)"; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(r() * 512, r() * 512, 40 + r() * 80, 20 + r() * 30, r() * 3, 0, 7); g.fill(); }
  }) })));
  water.receiveShadow = true; water.visible = false; G.add(water);
  // the tower of uneaten tins (hidden until pose shows it)
  const tins = new THREE.Group(), tb = new Batch(), rows = o.tinRows ?? 10;
  const [tx, , tz] = C.tins;
  for (let rI = 0; rI < rows; rI++) for (let k = 0; k < Math.max(1, 4 - Math.floor(rI / 3)); k++) {
    const x = tx + (k - (Math.max(1, 4 - Math.floor(rI / 3)) - 1) / 2) * 0.24 + ((rI * 7) % 3 - 1) * 0.02, y = 0.08 + rI * 0.16;
    tb.add(cyl(0.1, 0.15, x, y, tz, 14), lam("chTin" + ((k + rI) % 3), () => ({ map: tinTex((k + rI) % 3) })));
    tb.add(cyl(0.102, 0.012, x, y + 0.075, tz, 14), steel);
  }
  tb.build(tins); tins.visible = false; G.add(tins);
  return { door, pages, water, tins };
}

// ---------------- control room ----------------
export const CONTROL = { port: [0, 1.75, -4] as V3, portR: 0.75, desk: [0, 0.82, -3.3] as V3, mic: [-0.9, 0.82, -3.2] as V3,
  dial: [0.95, 1.18, -3.5] as V3, calendar: [3.93, 2.0, -1.6] as V3, door: [-3.95, 0, -0.5] as V3 };
export function controlRoom(G: THREE.Group, o: Variant & { glow?: string } = {}) {
  const vi = (o.variant ?? 0) % WALLS.length, [lo, hi] = WALLS[(vi + 2) % 4], b = new Batch(), C = CONTROL;
  const wall = lam("crWall" + vi, () => ({ map: rep(wallTex("crWallT" + vi, lo, hi), 0.8, 1) }));
  const steel = lam("chSteel", () => ({ map: steelTex("chSteelT", "#6b7472") })), dark = lam("chDark", () => ({ color: "#2b2e30" }));
  const deskM = lam("crDesk", () => ({ map: steelTex("crDeskT", "#55605a") })), pipe = lam("chPipe", () => ({ color: "#59625c" }));
  const glowM = lam("crGlow" + (o.glow ?? ""), () => ({ color: "#c8f0b0", emissive: o.glow ?? "#5f9a46" }));
  const lampM = lam("crLamp", () => ({ color: "#ffe2a0", emissive: "#e8a040" }));
  b.add(up(-4, 4, -4, 4, 2), lam("crFloor", () => ({ map: concreteTex("crFloorT", "#6e6a5e") })));
  b.add(boxGeo(V(-4, 0, -4.3), V(-C.portR - 0.05, 3.4, -4)), wall); b.add(boxGeo(V(C.portR + 0.05, 0, -4.3), V(4, 3.4, -4)), wall);
  b.add(boxGeo(V(-C.portR - 0.05, 0, -4.3), V(C.portR + 0.05, C.port[1] - C.portR, -4)), wall);
  b.add(boxGeo(V(-C.portR - 0.05, C.port[1] + C.portR, -4.3), V(C.portR + 0.05, 3.4, -4)), wall);
  b.add(boxGeo(V(-4.3, 0, -4.3), V(-4, 3.4, 4)), wall); b.add(boxGeo(V(4, 0, -4.3), V(4.3, 3.4, 4)), wall);
  // the big observation porthole: a glowing room beyond, heavy bolted ring
  b.add(boxGeo(V(-C.portR - 0.05, C.port[1] - C.portR, -4.6), V(C.portR + 0.05, C.port[1] + C.portR, -4.5)), glowM);
  b.add(new THREE.TorusGeometry(C.portR + 0.06, 0.1, 8, 32).translate(C.port[0], C.port[1], -3.98), steel);
  for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; b.add(cyl(0.03, 0.05, C.portR * 1.08 * Math.cos(a), C.port[1] + C.portR * 1.08 * Math.sin(a), -3.88, 6).rotateX(0), dark); }
  // console desk: slanted panel with dials, toggles and lamps; a reel recorder; the intercom mic on a stand
  b.add(boxGeo(V(-2.4, 0, -3.9), V(2.4, 0.8, -2.9)), deskM);
  b.add(boxGeo(V(-2.42, 0.8, -3.92), V(2.42, 0.84, -2.86)), dark);
  b.add(boxGeo(V(-2.4, 0.84, -3.9), V(2.4, 1.5, -3.6)).applyMatrix4(new THREE.Matrix4().makeRotationX(-0.35)).translate(0, 0.25, -1.3), deskM);
  const cols = ["#d8343a", "#e8c45a", "#6cc27a", "#f2efe6"];
  for (let k = 0; k < 18; k++) { // toggle switches and indicator lamps along the desk
    const x = -2.1 + k * 0.24;
    b.add(boxGeo(V(x - 0.03, 0.84, -3.15), V(x + 0.03, 0.9, -3.08)), dark);
    b.add(new THREE.SphereGeometry(0.025, 8, 6).translate(x, 0.92, -3.3), lam("crInd" + (k % 4), () => ({ color: cols[k % 4], emissive: cols[k % 4] })));
  }
  for (const [x, y] of [[-1.7, 1.18], [-1.25, 1.18], [1.45, 1.18], [1.9, 1.18]]) { // small round gauges (the O2 dial is a card)
    b.add(discZ(0.13, x, y, -3.48), lam("crGaugeFace", () => ({ color: "#efe9d6" })));
    b.add(new THREE.TorusGeometry(0.13, 0.02, 6, 20).translate(x, y, -3.47), dark);
  }
  // reel-to-reel recorder on the left of the desk
  b.add(boxGeo(V(-2.3, 0.84, -3.75), V(-1.5, 1.05, -3.2)), lam("crRec", () => ({ color: "#4a3e34" })));
  for (const x of [-2.1, -1.7]) b.add(cyl(0.16, 0.03, x, 1.07, -3.48, 20), lam("crReel", () => ({ color: "#2a2a2e" })));
  // intercom mic on a stand + headphones on a hook
  const [mx, my, mz] = C.mic;
  b.add(cyl(0.08, 0.03, mx, my + 0.02, mz, 14), dark); b.add(cyl(0.012, 0.36, mx, my + 0.2, mz, 6), steel);
  b.add(new THREE.SphereGeometry(0.06, 12, 10).scale(1, 1.3, 1).translate(mx, my + 0.42, mz + 0.02), lam("crMic", () => ({ color: "#9aa3a8" })));
  b.add(new THREE.TorusGeometry(0.11, 0.015, 6, 16, Math.PI).translate(0.3, 1.0, -3.0), dark);
  // filing cabinets, a chair, pipes, a poster, amber lamps
  for (const x of [2.9, 3.5]) {
    b.add(boxGeo(V(x - 0.28, 0, -3.95), V(x + 0.28, 1.35, -3.4)), lam("crCab", () => ({ color: "#6f7a6a" })));
    for (const y of [0.35, 0.75, 1.15]) b.add(boxGeo(V(x - 0.1, y, -3.4), V(x + 0.1, y + 0.04, -3.37)), dark);
  }
  b.add(boxGeo(V(1.45, 0.45, -2.6), V(1.95, 0.5, -2.1)), dark); b.add(cyl(0.03, 0.45, 1.7, 0.22, -2.35, 6), dark); // chair, pushed aside
  b.add(boxGeo(V(1.45, 0.5, -2.62), V(1.95, 1.05, -2.58)), dark);
  b.add(pipeX(0.06, -4, 4, 3.15, -3.85), pipe); b.add(pipeX(0.04, -4, 4, 2.98, -3.85), pipe); b.add(cyl(0.05, 3.15, -3.2, 1.58, -3.85), pipe);
  wheelZ(b, lam("chValve", () => ({ color: "#9e3434" })), -3.2, 1.4, -3.75, 0.13);
  b.add(boxGeo(V(-3.95, 0, C.door[2] - 0.55), V(-3.9, 2.15, C.door[2] + 0.55)), lam("chDoor", () => ({ map: steelTex("chDoorT", "#5d6a66") })));
  for (const x of [-1.8, 1.8]) {
    b.add(cyl(0.008, 0.6, x, 3.1, -2.5, 4), dark);
    b.add(new THREE.ConeGeometry(0.28, 0.2, 16, 1, true).translate(x, 2.75, -2.5), lam("crShade", () => ({ color: "#3e4a3a", side: THREE.DoubleSide })));
    b.add(new THREE.SphereGeometry(0.08, 10, 8).translate(x, 2.68, -2.5), lampM);
  }
  b.add(cyl(0.12, 0.03, 2.1, 0.86, -3.15, 12), dark); b.add(cyl(0.015, 0.4, 2.1, 1.05, -3.15, 6), dark); // desk lamp
  b.add(new THREE.ConeGeometry(0.12, 0.14, 12, 1, true).rotateX(0.6).translate(2.1, 1.25, -3.05), lam("crShade", () => ({ color: "#3e4a3a", side: THREE.DoubleSide })));
  b.add(new THREE.SphereGeometry(0.04, 8, 6).translate(2.1, 1.2, -3.0), lampM);
  b.build(G);
}

// ---------------- child's bedroom at night ----------------
export const BEDROOM = { bed: [-0.6, 0, -2.0] as V3, lamp: [1.25, 0.62, -2.9] as V3, under: [-0.6, 0.12, -1.0] as V3, window: [1.6, 1.7, -3.5] as V3 };
export function bedroom(G: THREE.Group, o: Variant = {}) {
  const vi = (o.variant ?? 0) % 4, b = new Batch(), B = BEDROOM;
  const wallC = ["#5d6a9a", "#6a5d8a", "#4f7a8a", "#7a6a5a"][vi];
  const wall = lam("bdWall" + vi, () => ({ map: ctex("bdWallT" + vi, 512, 512, (g, r) => {
    g.fillStyle = wallC; g.fillRect(0, 0, 512, 512);
    g.fillStyle = "rgba(255,255,255,.12)"; for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 512; g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? 4 : 10; g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } g.fill(); }
  }) }));
  const wood = lam("bdWood", () => ({ color: "#7a5236" })), dark = lam("chDark", () => ({ color: "#2b2e30" }));
  b.add(up(-3.5, 3.5, -3.5, 3, 1.6), lam("bdFloor", () => ({ map: ctex("bdFloorT", 512, 512, (g, r) => {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#8a6444" : "#7d5a3c"; g.fillRect(0, i * 64, 512, 64); g.fillStyle = "rgba(30,20,10,.5)"; g.fillRect(0, i * 64, 512, 3); g.fillRect(((i * 197) % 400) + r() * 50, i * 64, 3, 64); }
  }) })));
  b.add(boxGeo(V(-3.5, 0, -3.8), V(B.window[0] - 0.75, 3, -3.5)), wall); b.add(boxGeo(V(B.window[0] + 0.75, 0, -3.8), V(3.5, 3, -3.5)), wall);
  b.add(boxGeo(V(B.window[0] - 0.75, 0, -3.8), V(B.window[0] + 0.75, B.window[1] - 0.6, -3.5)), wall);
  b.add(boxGeo(V(B.window[0] - 0.75, B.window[1] + 0.6, -3.8), V(B.window[0] + 0.75, 3, -3.5)), wall);
  b.add(boxGeo(V(-3.8, 0, -3.8), V(-3.5, 3, 3)), wall); b.add(boxGeo(V(3.5, 0, -3.8), V(3.8, 3, 3)), wall);
  // moonlit window: night sky, moon, cross frame, curtains
  const [wx, wy] = B.window;
  b.add(quad(V(wx - 0.75, wy - 0.6, -3.7), V(wx + 0.75, wy - 0.6, -3.7), V(wx + 0.75, wy + 0.6, -3.7), V(wx - 0.75, wy + 0.6, -3.7)), lam("bdSky", () => ({ map: ctex("bdSkyT", 256, 256, (g, r) => {
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#1a2350"); gr.addColorStop(1, "#33407a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#fff6d8"; for (let i = 0; i < 30; i++) g.fillRect(r() * 256, r() * 200, 2, 2);
    g.fillStyle = "#f6efc6"; g.beginPath(); g.arc(180, 70, 30, 0, 7); g.fill(); g.fillStyle = "#1e2858"; g.beginPath(); g.arc(194, 62, 26, 0, 7); g.fill();
    g.fillStyle = "#141a3a"; g.beginPath(); g.moveTo(0, 256); for (let x = 0; x <= 256; x += 32) g.lineTo(x, 200 + r() * 30); g.lineTo(256, 256); g.fill(); // rooftops
  }), emissive: "#1c2650" })));
  for (const [x0, y0, x1, y1] of [[-0.8, -0.65, 0.8, -0.58], [-0.8, 0.58, 0.8, 0.65], [-0.8, -0.65, -0.73, 0.65], [0.73, -0.65, 0.8, 0.65], [-0.03, -0.6, 0.03, 0.6], [-0.75, -0.03, 0.75, 0.03]])
    b.add(boxGeo(V(wx + x0, wy + y0, -3.55), V(wx + x1, wy + y1, -3.45)), lam("bdTrim", () => ({ color: "#e8e0d0" })));
  for (const s of [-1, 1]) b.add(boxGeo(V(wx + s * 0.95 - 0.22, 0.9, -3.45), V(wx + s * 0.95 + 0.22, 2.55, -3.36)), lam("bdCurtain" + vi, () => ({ color: ["#a05a6a", "#5a8a6a", "#c08a4a", "#6a6aa0"][vi] })));
  b.add(cyl(0.02, 2.4, wx, 2.6, -3.4, 6).rotateZ(0).applyMatrix4(new THREE.Matrix4()), dark);
  // the bed: frame, headboard, mattress, a lumpy duvet, pillow, a dark gap underneath
  const [bx, , bz] = B.bed;
  b.add(boxGeo(V(bx - 0.75, 0.25, bz - 1.2), V(bx + 0.75, 0.42, bz + 1.1)), wood);
  b.add(boxGeo(V(bx - 0.8, 0, bz - 1.3), V(bx + 0.8, 1.15, bz - 1.18)), wood);
  b.add(boxGeo(V(bx - 0.8, 0.3, bz + 1.08), V(bx + 0.8, 0.62, bz + 1.18)), wood); // footboard on legs: the gap under the bed shows
  for (const s of [-1, 1]) b.add(boxGeo(V(bx + s * 0.76 - 0.04, 0, bz + 1.08), V(bx + s * 0.76 + 0.04, 0.3, bz + 1.18)), wood);
  b.add(boxGeo(V(bx - 0.7, 0.42, bz - 1.15), V(bx + 0.7, 0.58, bz + 1.05)), lam("bdMat", () => ({ color: "#ece6da" })));
  b.add(boxGeo(V(bx - 0.5, 0.58, bz - 1.1), V(bx + 0.5, 0.72, bz - 0.7)), lam("bdPillow", () => ({ color: "#f4efe6" })));
  b.add(boxGeo(V(bx - 0.78, 0.5, bz - 0.6), V(bx + 0.78, 0.74, bz + 1.08)), lam("bdDuvet" + vi, () => ({ color: ["#e8a33a", "#d9644f", "#6cc2a4", "#9b73d6"][vi] })));
  b.add(boxGeo(V(bx - 0.74, 0.02, bz - 1.1), V(bx + 0.74, 0.25, bz + 1.0)), lam("bdUnder", () => ({ color: "#07060a" })));
  // nightstand + lamp (on and off versions), a book and a glass of water
  const [lx, ly, lz] = B.lamp;
  b.add(boxGeo(V(lx - 0.3, 0, lz - 0.25), V(lx + 0.3, ly, lz + 0.25)), wood);
  b.add(boxGeo(V(lx - 0.25, 0.3, lz + 0.25), V(lx + 0.25, 0.34, lz + 0.27)), dark);
  b.add(cyl(0.09, 0.04, lx, ly + 0.02, lz, 12), dark); b.add(cyl(0.015, 0.3, lx, ly + 0.17, lz, 6), dark);
  b.add(boxGeo(V(lx + 0.1, ly, lz - 0.1), V(lx + 0.26, ly + 0.04, lz + 0.12)), lam("bdBook", () => ({ color: "#3e5a8a" })));
  b.add(cyl(0.035, 0.12, lx - 0.18, ly + 0.06, lz + 0.1, 10), lam("bdGlass", () => ({ color: "#cfe4ee" })));
  // rug, toy box, a shelf with toys, posters
  b.add(new THREE.CircleGeometry(1.0, 32).rotateX(-Math.PI / 2).scale(1.4, 1, 1).translate(0.9, 0.01, 0.2), lam("bdRug" + vi, () => ({ color: ["#3e6a8a", "#8a3e5a", "#5a8a3e", "#8a6a3e"][vi] })));
  b.add(boxGeo(V(2.4, 0, -1.6), V(3.3, 0.55, -0.9)), lam("bdToy", () => ({ color: "#c0453c" })));
  b.add(boxGeo(V(2.38, 0.55, -1.62), V(3.32, 0.6, -0.88)), lam("bdToyLid", () => ({ color: "#e0b040" })));
  b.add(boxGeo(V(-3.5, 1.6, -3.3), V(-3.2, 1.64, -1.8)), wood);
  for (const [z, c] of [[-3.1, "#e0485a"], [-2.7, "#4fa3e6"], [-2.3, "#f6c344"], [-2.0, "#6cc2a4"]] as [number, string][]) b.add(boxGeo(V(-3.45, 1.64, z - 0.12), V(-3.25, 1.88, z + 0.12)), lam("book" + c, () => ({ color: c })));
  b.add(quad(V(-1.6, 1.5, -3.49), V(-0.6, 1.5, -3.49), V(-0.6, 2.3, -3.49), V(-1.6, 2.3, -3.49)), lam("bdPoster", () => ({ map: ctex("bdPosterT", 256, 205, (g) => {
    g.fillStyle = "#1e2a50"; g.fillRect(0, 0, 256, 205); g.fillStyle = "#f2c230"; g.beginPath(); g.arc(80, 90, 40, 0, 7); g.fill();
    g.fillStyle = "#e0485a"; g.beginPath(); g.moveTo(150, 170); g.lineTo(190, 40); g.lineTo(230, 170); g.fill(); g.strokeStyle = "#f4efe6"; g.lineWidth = 8; g.strokeRect(4, 4, 248, 197);
  }) })));
  b.build(G);
  const lampOn = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 16, 1, true).translate(lx, ly + 0.36, lz), lam("bdShadeOn", () => ({ color: "#ffe6a8", emissive: "#f0b050", side: THREE.DoubleSide })));
  const lampOff = new THREE.Mesh(lampOn.geometry, lam("bdShadeOff", () => ({ color: "#8a7a5a", side: THREE.DoubleSide })));
  lampOff.visible = false; G.add(lampOn, lampOff);
  return { lampOn, lampOff };
}
