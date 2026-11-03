// Reusable sets (first built for "What If Animals Could Sue Humans"). Each builder fills a THREE.Group in LOCAL
// coordinates around its origin (ground y = 0, the camera side is +z); place the group with group.position. Every
// material comes from the shared engine (two-tone shading, painted HD textures), so the sets match any short.
// Every builder takes { variant }: 0 is the original look, 1-3 re-dress it (see Variant).
//   courtroom   : US-style courtroom 18 x 21 m: judges' bench + platform, seal, flags, witness box, counsel tables,
//                 bar rail, gallery benches, optional open crates. Returns { tables, crates, flags } to toggle / wave.
//   jungle      : tropical clearing: dirt patch, ring of round/tall trees, bushes; optional rock at o.rock.
//   courthouse  : columned courthouse on 10 steps (stepY in courthouseStepY) + cobbled plaza + trees and hedges.
//   townSquare  : old-European cobbled square ringed by 10 gabled houses, a judge's platform + table, a low stone wall.
import * as THREE from "three";
import { Batch, boxGeo, V, lam, house, addVeg, tri, quad } from "../engine/build";
import { ctex, rep, planksHD, beamHD, stoneHD, cobbleHD, grassHD } from "../engine/paint";

type V3 = [number, number, number];
/** the courthouse steps: 10 steps of 0.25 m x 0.5 m from local z = -12 up to the portico at z = -17, y = 2.5 */
export const courthouseStepY = (z: number) => (z > -12 ? 0 : z < -17 ? 2.5 : Math.min(2.5, Math.ceil((-12 - z) / 0.5) * 0.25));

/** horizontal quad facing up at height y covering x0..x1, z0..z1, uv tiles of `tile` metres */
const up = (x0: number, x1: number, z0: number, z1: number, tile: number, y = 0) =>
  quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile);
const usFlag = () => ctex("usFlag", 380, 200, (g) => {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? "#f4efe4" : "#b8343a"; g.fillRect(0, (i * 200) / 13, 380, 200 / 13 + 1); }
  g.fillStyle = "#2f3f75"; g.fillRect(0, 0, 160, 108);
  g.fillStyle = "#f4efe4";
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { g.beginPath(); g.arc(14 + c * 26 + (r % 2) * 13, 12 + r * 21, 4.5, 0, 7); g.fill(); }
});
const sealTex = () => ctex("seal", 256, 256, (g) => {
  g.fillStyle = "#d4aa48"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.strokeStyle = "#2a1f2c"; g.lineWidth = 8; g.stroke();
  g.fillStyle = "#2f3f75"; g.beginPath(); g.arc(128, 128, 92, 0, 7); g.fill();
  g.strokeStyle = "#e9cf7a"; g.lineWidth = 6; g.stroke();
  // scales of justice
  g.strokeStyle = "#e9cf7a"; g.lineWidth = 7; g.lineCap = "round";
  g.beginPath(); g.moveTo(128, 70); g.lineTo(128, 180); g.moveTo(80, 92); g.lineTo(176, 92); g.moveTo(100, 186); g.lineTo(156, 186); g.stroke();
  for (const x of [80, 176]) { g.beginPath(); g.moveTo(x, 92); g.lineTo(x - 18, 132); g.moveTo(x, 92); g.lineTo(x + 18, 132); g.stroke(); g.beginPath(); g.arc(x, 132, 20, 0, Math.PI); g.stroke(); }
});
const windowTex = () => ctex("courtWin", 256, 512, (g) => {
  g.fillStyle = "#cfe3f4"; g.fillRect(0, 0, 256, 512);
  const gr = g.createLinearGradient(0, 0, 256, 512); gr.addColorStop(0, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(150,190,230,.2)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = "#6e4a32"; g.lineWidth = 14;
  g.strokeRect(7, 7, 242, 498); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 512); for (const y of [128, 256, 384]) { g.moveTo(0, y); g.lineTo(256, y); } g.stroke();
});
const panelTex = () => ctex("panelWood", 512, 256, (g, r) => {
  g.fillStyle = "#8a5a3a"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(60,30,15,${0.08 + r() * 0.08})`; g.lineWidth = 2; g.beginPath(); const y = r() * 256; g.moveTo(0, y); g.bezierCurveTo(170, y + 6, 340, y - 6, 512, y + 3); g.stroke(); }
  g.strokeStyle = "rgba(40,20,10,.55)"; g.lineWidth = 6;
  for (const x of [16, 272]) g.strokeRect(x, 26, 224, 204);
  g.strokeStyle = "rgba(255,220,170,.25)"; g.lineWidth = 3;
  for (const x of [22, 278]) g.strokeRect(x, 32, 212, 192);
});

/** variant 0 = the original look; other values re-dress the place (wall / stone colours, tree layout, house styles)
 *  so a reused set looks different from one video to the next. Pick a variant that the variety log hasn't used lately. */
export type Variant = { variant?: number };
const PLASTER = ["#e6d3b0", "#d6dcc4", "#e7cbb6", "#cfd6e0"], DARKWOOD = ["#6e452c", "#5a3a2c", "#7a5232", "#4f3a30"];
export type CourtroomOpts = Variant & { witness?: V3; crates?: V3[] };
export function courtroom(G: THREE.Group, o: CourtroomOpts = {}) {
  const b = new Batch();
  const WITNESS = o.witness ?? [-5, 0.7, -7.6], CRATES = o.crates ?? [[-1.05, 0, -4], [1.05, 0, -4]];
  const tables = new THREE.Group(), crates = new THREE.Group(), flags: THREE.Mesh[] = [];
  const floor = lam("courtFloor", () => ({ map: planksHD() }));
  const vi = (o.variant ?? 0) % PLASTER.length;
  const plaster = lam("plaster" + vi, () => ({ color: PLASTER[vi] }));
  const wood = lam("panelWood", () => ({ map: panelTex() }));
  const dark = lam("darkWood" + vi, () => ({ color: DARKWOOD[vi] }));
  const trim = lam("courtTrim", () => ({ color: "#f1e4c8" }));
  b.add(up(-9, 9, -12, 9, 4), floor);
  // walls: wood wainscot 0-1.3 m, plaster above, cornice; tall windows on both sides
  b.add(boxGeo(V(-9, 0, -12.4), V(9, 8, -12)), plaster);
  b.add(boxGeo(V(-9, 0, -12.02), V(9, 1.3, -11.9), 2.2), wood);
  b.add(boxGeo(V(-9, 7.3, -12.05), V(9, 7.6, -11.85)), trim);
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -9.4 : 9, x1 = s < 0 ? -9 : 9.4;
    b.add(boxGeo(V(x0, 0, -12.4), V(x1, 8, 9)), plaster);
    b.add(boxGeo(V(s < 0 ? -9.02 : 8.9, 0, -12), V(s < 0 ? -8.9 : 9.02, 1.3, 9), 2.2), wood);
    for (const z of [-8, -3, 2, 7]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 3.6), new THREE.MeshBasicMaterial({ map: windowTex(), color: 0xe8e8e8 }));
      win.position.set(s * 8.88, 4.0, z); win.rotation.y = -s * Math.PI / 2; G.add(win);
      b.add(boxGeo(V(s < 0 ? -9 : 8.8, 2.05, z - 0.95), V(s < 0 ? -8.8 : 9, 2.15, z + 0.95)), trim);
    }
  }
  // judges' platform + bench with inset panels
  b.add(boxGeo(V(-4.2, 0, -11.9), V(4.2, 0.55, -9.4), 2), dark);
  b.add(boxGeo(V(-3.6, 0, -9.6), V(3.6, 1.5, -8.9), 2.2), wood);
  b.add(boxGeo(V(-3.75, 1.5, -9.75), V(3.75, 1.6, -8.8)), dark);
  // seal + flags behind the bench
  const seal = new THREE.Mesh(new THREE.CircleGeometry(1.0, 48), new THREE.MeshBasicMaterial({ map: sealTex(), color: 0xe0e0e0 }));
  seal.position.set(0, 4.5, -11.88); G.add(seal);
  for (const x of [-5.2, 5.2]) {
    b.add(new THREE.CylinderGeometry(0.04, 0.04, 3.4, 8).translate(x, 1.7, -11.3), lam("brass", () => ({ color: "#c9a24a" })));
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9, 10, 1), lam("usFlag", () => ({ map: usFlag(), side: THREE.DoubleSide })));
    fl.position.set(x + (x < 0 ? 0.75 : -0.75), 2.85, -11.3); fl.castShadow = true; flags.push(fl); G.add(fl);
  }
  // witness box (0.85 m rail) with a stool
  b.add(boxGeo(V(WITNESS[0] - 0.75, 0, WITNESS[2] - 0.7), V(WITNESS[0] + 0.75, 0.74, WITNESS[2] + 0.7), 2.2), wood);
  b.add(boxGeo(V(WITNESS[0] - 0.8, 0.74, WITNESS[2] - 0.75), V(WITNESS[0] + 0.8, 0.8, WITNESS[2] + 0.75)), dark);
  // bar rail + gallery benches
  for (const [x0, x1] of [[-8.9, -1], [1, 8.9]]) {
    b.add(boxGeo(V(x0, 0.95, -0.55), V(x1, 1.05, -0.4)), dark);
    for (let x = x0 + 0.2; x < x1; x += 0.45) b.add(boxGeo(V(x - 0.03, 0, -0.5), V(x + 0.03, 0.95, -0.44)), dark);
  }
  for (let z = 1.2; z < 7; z += 1.3) for (const [x0, x1] of [[-8, -1.2], [1.2, 8]]) {
    b.add(boxGeo(V(x0, 0.42, z), V(x1, 0.5, z + 0.45)), dark);
    b.add(boxGeo(V(x0, 0.5, z + 0.4), V(x1, 1.0, z + 0.48)), wood);
  }
  b.build(G);
  // counsel tables (hidden for the two-boxes shot) and the two crates (only there)
  const tb = new Batch();
  for (const [x0, x1] of [[-3.9, -1.3], [1.3, 3.9]]) {
    tb.add(boxGeo(V(x0, 0.72, -4.1), V(x1, 0.8, -3.1)), dark);
    tb.add(boxGeo(V(x0 + 0.05, 0, -3.25), V(x1 - 0.05, 0.72, -3.15), 2.2), wood);
    for (const x of [x0 + 0.1, x1 - 0.15]) tb.add(boxGeo(V(x, 0, -4.0), V(x + 0.06, 0.72, -3.94)), dark);
  }
  tb.add(boxGeo(V(1.85, 0, -4.85), V(2.55, 0.48, -4.25)), dark); // the monkey's chair seat
  tb.build(tables);
  const cb = new Batch(), crateM = lam("crate", () => ({ map: rep(beamHD(), 1, 1) }));
  for (const c of CRATES) {
    // open crate: four walls + floor, so what pops up inside reads from above
    for (const [x0, x1, z0, z1] of [[-0.9, 0.9, 0.48, 0.6], [-0.9, 0.9, -0.6, -0.48], [-0.9, -0.78, -0.6, 0.6], [0.78, 0.9, -0.6, 0.6]])
      cb.add(boxGeo(V(c[0] + x0, 0, c[2] + z0), V(c[0] + x1, 1.1, c[2] + z1), 0.55), crateM);
    cb.add(boxGeo(V(c[0] - 0.8, 0, c[2] - 0.5), V(c[0] + 0.8, 0.05, c[2] + 0.5)), crateM);
    for (const s of [-1, 1]) cb.add(boxGeo(V(c[0] + s * 0.9 - 0.06, 0, c[2] + 0.58), V(c[0] + s * 0.9 + 0.06, 1.12, c[2] + 0.66)), dark);
    cb.add(boxGeo(V(c[0] - 0.96, 1.02, c[2] + 0.58), V(c[0] + 0.96, 1.12, c[2] + 0.66)), dark);
  }
  cb.build(crates);
  G.add(tables, crates);
  return { tables, crates, flags };
}

export function jungle(G: THREE.Group, o: Variant & { rock?: V3 | null } = {}) {
  const vs = o.variant ?? 0;
  const b = new Batch(), JX = 0, MONK_J = o.rock;
  b.add(up(JX - 300, JX + 300, -300, 300, 6), lam("grassHD", () => ({ map: grassHD() })));
  b.add(up(JX - 3.5, JX + 3.5, -2.5, 3.5, 3, 0.01), lam("dirt", () => ({ color: "#b48a5c" })));
  // the rock the monkey stands on
  if (MONK_J) {
    const rock = new THREE.DodecahedronGeometry(0.42, 1); rock.scale(1.1, 0.5, 0.9);
    b.add(rock, lam("rock", () => ({ color: "#a39a8c" })), new THREE.Matrix4().makeTranslation(MONK_J[0], 0.0, MONK_J[2] - 0.05));
  }
  // a ring of rainforest: tall and round trees behind, bushes at the clearing's edge, nothing in front of the lenses
  let seed = 11 + 1000 * vs;
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2 + Math.sin(i * 7.1 + vs) * 0.05, r = 9 + ((i + vs) % 5) * 4.5 + Math.sin(i * 3.3 + vs * 1.7) * 1.5;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > -3 && Math.abs(x) < 9) continue;           // keep the lenses' side open
    if (x > 0 && z > 0 && x < 24) continue;            // the aerial's line of sight
    const k = (["round", "tall", "fat", "round", "tall"] as const)[(i + vs) % 5];
    addVeg(b, k, JX + x, 0, z, 7 + (i % 4) * 2.2, seed++);
  }
  for (let i = 0; i < 18; i++) {
    const x = -6 + i * 0.75 + Math.sin(i * 2.7) * 0.4, z = -3.2 - (i % 3) * 0.9;
    addVeg(b, "bush", JX + x, 0, z, 1.2 + (i % 3) * 0.4, 400 + i);
  }
  for (const [x, z] of [[-6.5, 1.5], [-7.5, -1], [6.8, 1.2], [7.6, -1.5]]) addVeg(b, "bush", JX + x, 0, z, 1.6, 500 + x);
  b.build(G);
}

const STONE: [string[], string][] = [[["#e9dfcd", "#e1d6c2", "#eee6d8", "#d9cdb8"], "#b3a693"], [["#e3e1dc", "#d8d6d1", "#ebe9e4", "#d0cec8"], "#a9a6a0"],
  [["#ecd9bf", "#e2cdb0", "#f1e1ca", "#dac4a5"], "#b49c7f"]];
export function courthouse(G: THREE.Group, o: Variant = {}) {
  const [sc, sm] = STONE[(o.variant ?? 0) % STONE.length];
  const b = new Batch(), EX = 0;
  const sk = "courtStone" + ((o.variant ?? 0) % STONE.length || ""), stoneM = lam(sk, () => ({ map: stoneHD(sk, sc, sm) }));
  const trim = lam("courtTrimE", () => ({ color: "#f3ead8" }));
  b.add(up(EX - 400, EX + 400, -300, 400, 6), lam("grassHD", () => ({ map: grassHD() })));
  b.add(up(EX - 30, EX + 30, -12, 40, 4, 0.012), lam("cobbleHD", () => ({ map: cobbleHD() })));
  for (let i = 0; i < 10; i++) b.add(boxGeo(V(EX - 11, 0, -21), V(EX + 11, (i + 1) * 0.25, -12 - 0.5 * i), 1.5), stoneM);
  b.add(boxGeo(V(EX - 12.5, 0, -32), V(EX + 12.5, 13, -21), 3), stoneM);                 // the building
  b.add(boxGeo(V(EX - 1.6, 2.5, -21.05), V(EX + 1.6, 7.6, -20.95)), lam("door", () => ({ color: "#4a3326" })));
  for (let k = 0; k < 8; k++) {
    const x = EX - 8.75 + 2.5 * k;
    b.add(new THREE.CylinderGeometry(0.5, 0.56, 8, 20).translate(x, 6.5, -18.4), stoneM);
    b.add(boxGeo(V(x - 0.7, 2.5, -19.1), V(x + 0.7, 2.85, -17.7)), trim);
    b.add(boxGeo(V(x - 0.72, 10.15, -19.12), V(x + 0.72, 10.5, -17.68)), trim);
  }
  b.add(boxGeo(V(EX - 10.5, 10.5, -21), V(EX + 10.5, 12, -17.4), 3), stoneM);            // entablature
  b.add(boxGeo(V(EX - 10.7, 11.9, -21), V(EX + 10.7, 12.2, -17.2)), trim);
  b.add(tri(V(EX - 10.5, 12.2, -17.4), V(EX + 10.5, 12.2, -17.4), V(EX, 15.4, -17.4)), stoneM); // pediment
  b.add(quad(V(EX + 10.7, 12.2, -17.2), V(EX + 10.7, 12.2, -21), V(EX, 15.6, -21), V(EX, 15.6, -17.2)), lam("courtRoof", () => ({ color: "#8f97a8", side: THREE.DoubleSide })));
  b.add(quad(V(EX, 15.6, -17.2), V(EX, 15.6, -21), V(EX - 10.7, 12.2, -21), V(EX - 10.7, 12.2, -17.2)), lam("courtRoof", () => ({ color: "#8f97a8" })));
  let s = 900;
  for (const sx of [-1, 1]) for (let z = -6; z < 60; z += 7) addVeg(b, "round", EX + sx * (34 + (z % 3)), 0, z, 7 + (z % 4), s++);
  for (const sx of [-1, 1]) for (let x = 14; x < 26; x += 3) addVeg(b, "hedge", EX + sx * x, 0, -13, 1.2, s++);
  b.build(G);
}

export function townSquare(G: THREE.Group, o: Variant = {}) {
  const b = new Batch(), MX = 0;
  b.add(up(MX - 300, MX + 300, -300, 300, 6), lam("grassHD", () => ({ map: grassHD() })));
  b.add(up(MX - 30, MX + 30, -30, 30, 4, 0.012), lam("cobbleHD", () => ({ map: cobbleHD() })));
  const hs: [number, number, number, number, number][] = [
    [MX - 10, -14, 0, 6, 8.4], [MX - 3.5, -14.5, 0, 6, 9.8], [MX + 3, -14, 0, 6, 7], [MX + 9.5, -14.5, 0, 6.5, 8.4],
    [MX - 13, -6, Math.PI / 2, 6, 7], [MX - 13, 0.5, Math.PI / 2, 6, 8.4], [MX - 13, 7, Math.PI / 2, 6, 9.8],
    [MX + 13, -6, -Math.PI / 2, 6, 8.4], [MX + 13, 0.5, -Math.PI / 2, 6, 7], [MX + 13, 7, -Math.PI / 2, 6, 8.4],
  ];
  hs.forEach(([x, z, yaw, w, h], i) => house(b, x, z, yaw, w, 6, h, i + 3 + (o.variant ?? 0) * 3));
  const dark = lam("darkWood", () => ({ color: "#6e452c" })), cloth = lam("redCloth", () => ({ color: "#9e2f35" }));
  b.add(boxGeo(V(MX - 1.9, 0, -7.7), V(MX + 1.9, 0.45, -6.1), 2), dark);
  b.add(boxGeo(V(MX - 1.5, 0.45, -6.5), V(MX + 1.5, 1.2, -5.9)), cloth);
  b.add(boxGeo(V(MX - 1.6, 1.2, -6.6), V(MX + 1.6, 1.27, -5.8)), dark);
  b.add(boxGeo(V(MX + 2.6, 0, -2.4), V(MX + 4.8, 0.9, -1.6), 1.5), lam("wallStone", () => ({ map: stoneHD("wallStone") })));
  b.build(G);
}

// ---------------- science lab + micro world (first built for the DNA short) ----------------
//   lab        : tiled science lab 14 x 18 m: mint walls with a long window, benches with glassware, shelves, a floor of
//                checker tiles. Back wall at z = -9, camera side +z. variant re-dresses wall + bench colours.
//   microWorld : an open pink "inside the body" stage: soft floor, a ring of big pastel blobs (cells) in the distance.
const LABWALL = ["#cfe8dc", "#d8e4f2", "#f1e0c8", "#e4d6ee"], BENCH = ["#6a8fa8", "#8a6a9a", "#5f9a7a", "#b07a5a"];
const tileTex = () => ctex("labTile", 256, 256, (g) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? "#e9edf0" : "#c9d4dc"; g.fillRect(i * 64, j * 64, 64, 64); }
  g.strokeStyle = "rgba(60,70,90,.25)"; g.lineWidth = 2; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64, 256); g.moveTo(0, k * 64); g.lineTo(256, k * 64); g.stroke(); }
});
export function lab(G: THREE.Group, o: Variant = {}) {
  const vi = (o.variant ?? 0) % LABWALL.length, b = new Batch();
  const wall = lam("labWall" + vi, () => ({ color: LABWALL[vi] })), bench = lam("labBench" + vi, () => ({ color: BENCH[vi] }));
  const top = lam("labTop", () => ({ color: "#2f3a44" })), steel = lam("labSteel", () => ({ color: "#b9c2ca" }));
  b.add(up(-7, 7, -9, 9, 2), lam("labFloor", () => ({ map: tileTex() })));
  b.add(boxGeo(V(-7, 0, -9.4), V(7, 4.6, -9)), wall);
  b.add(boxGeo(V(-7.4, 0, -9.4), V(-7, 4.6, 9)), wall);
  b.add(boxGeo(V(7, 0, -9.4), V(7.4, 4.6, 9)), wall);
  b.add(boxGeo(V(-7, 0, -9.02), V(7, 0.18, -8.9)), steel);                          // skirting
  b.add(boxGeo(V(-5, 1.8, -9.02), V(5, 3.8, -8.95)), lam("labSky", () => ({ color: "#bfe3f7" })));  // long window
  for (const x of [-5, -1.7, 1.7, 5]) b.add(boxGeo(V(x - 0.05, 1.75, -8.98), V(x + 0.05, 3.85, -8.9)), steel);
  b.add(boxGeo(V(-5.05, 1.75, -8.98), V(5.05, 1.85, -8.9)), steel); b.add(boxGeo(V(-5.05, 3.75, -8.98), V(5.05, 3.85, -8.9)), steel);
  // back benches with a dark top and jars on top
  for (const [x0, x1] of [[-6.8, -2.6], [2.6, 6.8]]) {
    b.add(boxGeo(V(x0, 0, -8.8), V(x1, 0.86, -7.4), 1.5), bench);
    b.add(boxGeo(V(x0 - 0.05, 0.86, -8.85), V(x1 + 0.05, 0.94, -7.35)), top);
    for (let x = x0 + 0.5; x < x1; x += 0.9) {
      const h = 0.25 + ((x * 7) % 3) * 0.1, c = ["#e8738a", "#6cc2a4", "#f2c14e", "#79a6e6"][Math.abs(Math.floor(x * 3)) % 4];
      b.add(new THREE.CylinderGeometry(0.15, 0.17, h, 14).translate(x, 0.94 + h / 2, -8.2), lam("jar" + c, () => ({ color: c })));
    }
  }
  // wall shelves
  for (const y of [2.2, 3.1]) for (const s of [-1, 1]) b.add(boxGeo(V(s < 0 ? -7 : 6.6, y, -7.5), V(s < 0 ? -6.6 : 7, y + 0.06, 8)), steel);
  // island benches in the middle, low enough to see over (0.86 m)
  for (const x of [-4.6, 4.6]) {
    b.add(boxGeo(V(x - 0.8, 0, -1.4), V(x + 0.8, 0.86, 1.4), 1.5), bench);
    b.add(boxGeo(V(x - 0.85, 0.86, -1.45), V(x + 0.85, 0.94, 1.45)), top);
    for (let k = 0; k < 3; k++) b.add(new THREE.CylinderGeometry(0.1, 0.1, 0.34, 12).translate(x - 0.45 + k * 0.45, 1.11, 0), lam("flask" + k, () => ({ color: ["#79d0b0", "#f08f9d", "#ffd36b"][k] })));
  }
  b.build(G);
}

const MICRO = [["#f4b6c8", "#ffd8e2"], ["#b9d7f4", "#dcecff"], ["#d7c4f1", "#ece2ff"], ["#f6cfa6", "#ffe8cf"]];
export function microWorld(G: THREE.Group, o: Variant = {}) {
  const vi = (o.variant ?? 0) % MICRO.length, [c0, c1] = MICRO[vi], b = new Batch();
  b.add(up(-300, 300, -300, 300, 6), lam("microFloor" + vi, () => ({ color: c0 })));
  b.add(up(-6, 6, -9, 8, 3, 0.012), lam("microMat" + vi, () => ({ color: c1 })));
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + Math.sin(i * 5.3) * 0.08, r = 28 + (i % 4) * 7 + Math.sin(i * 2.1) * 3;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > -2 && Math.abs(x) < 12) continue;
    const rad = 3 + (i % 5) * 1.2, col = ["#ef8fb0", "#f6b27a", "#9fd3a3", "#a9a0e8", "#f4d06f"][i % 5];
    const s = new THREE.SphereGeometry(rad, 18, 12); s.scale(1, 0.8, 1);
    b.add(s, lam("blob" + col, () => ({ color: col })), new THREE.Matrix4().makeTranslation(x, rad * 0.55, z));
    const n = new THREE.SphereGeometry(rad * 0.38, 12, 8);
    b.add(n, lam("nuc" + col, () => ({ color: "#6a4a8a" })), new THREE.Matrix4().makeTranslation(x * 0.985, rad * 0.62, z * 0.985 + (z < 0 ? rad * 0.55 : -rad * 0.55)));
  }
  b.build(G);
}
