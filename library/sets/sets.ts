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

// ---------------- home office, city street, museum hall, cold vault (first built for "dna-drive-v2") ----------------
//   homeOffice : small room 10 x 12 m, walls 3.2 m, a window on the back wall (z = -6), a desk (x ±1.3, z -4.2..-3.5,
//                top .76), a bookshelf on the left wall, a rug and a floor lamp. variant re-dresses wall + desk colours.
//   cityStreet : modern street: pavement z -8..-3, road z -3..6 with dashes, far pavement z 6..9, a row of shopfront blocks
//                along z -9 (x ±60), lamp posts and trees on the pavement. variant re-dresses the block colours.
//   museumHall : marble hall x ±12, z -12..10, walls 7 m, columns along x ±9, framed paintings on the back wall (z -12),
//                rope stanchions; plinths (1.0 m tall, .9 m square) at o.plinths. variant re-dresses wall + floor.
//   coldVault  : icy storage room x ±6, z -8..6, walls 3.6 m, freezer racks of small tubes on the back wall (z -8) and the
//                side walls, a steel table (x ±1.4, z -3..-2, top .92). variant re-dresses the wall tint + tube caps.
const OFFICEWALL = ["#f3d9a4", "#cfe2d8", "#f0c9c0", "#d4d8ef"], DESK = ["#9a6a44", "#6f7f94", "#b98a5a", "#5f6e5a"];
const floorBoards = (key: string, c0: string, c1: string) => ctex(key, 512, 512, (g, r) => {
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? c0 : c1; g.fillRect(0, i * 64, 512, 64); }
  g.strokeStyle = "rgba(60,35,20,.35)"; g.lineWidth = 3;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); const x = r() * 512; g.beginPath(); g.moveTo(x, i * 64); g.lineTo(x, i * 64 + 64); g.stroke(); }
});
export function homeOffice(G: THREE.Group, o: Variant = {}) {
  const vi = (o.variant ?? 0) % OFFICEWALL.length, b = new Batch();
  const wall = lam("offWall" + vi, () => ({ color: OFFICEWALL[vi] })), desk = lam("offDesk" + vi, () => ({ color: DESK[vi] }));
  const trim = lam("offTrim", () => ({ color: "#fbf3e2" })), dark = lam("offDark", () => ({ color: "#3a3040" }));
  b.add(up(-5, 5, -6, 6, 2.5), lam("offFloor", () => ({ map: floorBoards("offBoards", "#c99a66", "#bb8b58") })));
  b.add(boxGeo(V(-5, 0, -6.3), V(5, 3.2, -6)), wall);
  b.add(boxGeo(V(-5.3, 0, -6.3), V(-5, 3.2, 6)), wall);
  b.add(boxGeo(V(5, 0, -6.3), V(5.3, 3.2, 6)), wall);
  b.add(boxGeo(V(-5, 0, -6.02), V(5, 0.14, -5.92)), trim);
  // window with a blue sky and a cross frame
  b.add(boxGeo(V(-2.2, 1.3, -6.02), V(0.6, 2.8, -5.97)), lam("offSky", () => ({ color: "#a9dcf6" })));
  for (const [x0, y0, x1, y1] of [[-2.3, 1.22, 0.7, 1.32], [-2.3, 2.78, 0.7, 2.88], [-2.3, 1.22, -2.2, 2.88], [0.6, 1.22, 0.7, 2.88], [-0.85, 1.3, -0.75, 2.8], [-2.2, 2.0, 0.6, 2.08]])
    b.add(boxGeo(V(x0, y0, -5.99), V(x1, y1, -5.9)), trim);
  // desk with legs and a drawer block
  b.add(boxGeo(V(-1.3, 0.7, -4.2), V(1.3, 0.76, -3.5)), desk);
  for (const x of [-1.25, 1.17]) b.add(boxGeo(V(x, 0, -4.15), V(x + 0.08, 0.7, -3.55)), dark);
  b.add(boxGeo(V(0.55, 0.12, -4.15), V(1.2, 0.7, -3.55)), desk);
  b.add(boxGeo(V(0.58, 0.38, -3.56), V(1.17, 0.42, -3.53)), dark);
  // bookshelf on the left wall with coloured books
  b.add(boxGeo(V(-5, 0, -3.5), V(-4.55, 2.4, -0.5)), desk);
  for (let s = 0; s < 4; s++) for (let k = 0; k < 9; k++) {
    const c = ["#e0485a", "#4fa3e6", "#f6c344", "#6cc2a4", "#9b73d6"][(k + s * 2) % 5], h = 0.32 + ((k * 7 + s) % 3) * 0.06;
    b.add(boxGeo(V(-4.6, 0.12 + s * 0.58, -3.35 + k * 0.31), V(-4.52, 0.12 + s * 0.58 + h, -3.12 + k * 0.31)), lam("book" + c, () => ({ color: c })));
  }
  // rug + floor lamp
  b.add(up(-2.2, 2.2, -3.2, 0.8, 4.4, 0.01), lam("offRug" + vi, () => ({ color: ["#d9644f", "#4f86c6", "#6a9a5a", "#c4884a"][vi] })));
  b.add(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 8).translate(2.6, 0.85, -5.2), dark);
  b.add(new THREE.ConeGeometry(0.32, 0.4, 16, 1, true).translate(2.6, 1.85, -5.2), lam("offShade", () => ({ color: "#ffe6a8", side: THREE.DoubleSide })));
  b.add(new THREE.CylinderGeometry(0.22, 0.25, 0.04, 16).translate(2.6, 0.02, -5.2), dark);
  addVeg(b, "bush", 4.2, 0, -5.2, 1.3, 77);
  b.build(G);
}

const BLOCKS = [["#e9a77a", "#9fc6d9", "#f2d27e", "#b7a2d6", "#9fd1a8"], ["#d98c8c", "#8fb4e0", "#e9c89a", "#a9c99a", "#e0b0cf"],
  ["#c9b39a", "#a7c4c9", "#e6a67a", "#9fb0d6", "#d6c87a"], ["#f0b8a0", "#86c0b0", "#f2e0a0", "#c0a0d0", "#a0c0e0"]];
const winGrid = (key: string, wall: string) => ctex(key, 256, 256, (g) => {
  g.fillStyle = wall; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    g.fillStyle = "#3a4a6a"; g.fillRect(30 + i * 128, 30 + j * 128, 70, 80);
    g.fillStyle = "rgba(190,225,250,.85)"; g.fillRect(36 + i * 128, 36 + j * 128, 58, 68);
    g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(40 + i * 128, 40 + j * 128, 14, 60);
  }
});
export function cityStreet(G: THREE.Group, o: Variant = {}) {
  const vi = (o.variant ?? 0) % BLOCKS.length, b = new Batch();
  const pave = lam("cityPave", () => ({ color: "#d8d2c8" })), road = lam("cityRoad", () => ({ color: "#575a66" })), white = lam("cityLine", () => ({ color: "#f4f1e6" }));
  const dark = lam("cityDark", () => ({ color: "#3a3446" }));
  b.add(up(-300, 300, -300, 300, 6), lam("grassHD", () => ({ map: grassHD() })));
  // lifted off the grass plane (coplanar quads z-fight and flicker)
  b.add(up(-60, 60, -9, -3, 2, 0.01), pave);
  b.add(up(-60, 60, -3, 6, 4, 0.01), road);
  b.add(up(-60, 60, 6, 9, 2, 0.01), pave);
  for (let x = -58; x < 60; x += 4) b.add(up(x, x + 2, 1.35, 1.6, 2, 0.02), white);
  b.add(boxGeo(V(-60, 0, -3.12), V(60, 0.14, -2.98)), lam("cityKerb", () => ({ color: "#b4ada2" })));
  // shopfront blocks: walls with a window grid, a coloured awning and a dark shop window at street level
  let x = -60, k = 0;
  while (x < 60) {
    const w = 7 + (k % 3) * 2, h = 9 + ((k * 5) % 4) * 2.5, c = BLOCKS[vi][k % 5];
    b.add(boxGeo(V(x, 0, -16), V(x + w - 0.2, h, -9), 4), lam(`cityWall${vi}_${k % 5}`, () => ({ map: winGrid(`cityWin${vi}_${k % 5}`, c) })));
    b.add(boxGeo(V(x, h, -16.2), V(x + w - 0.2, h + 0.3, -8.8)), dark);
    b.add(boxGeo(V(x + 0.6, 0, -9.02), V(x + w - 0.8, 2.3, -8.95)), lam("cityShop", () => ({ color: "#2f3c58" })));
    const aw = ["#e0485a", "#4fa3e6", "#f6c344", "#6cc2a4", "#ef8a4a"][(k + vi) % 5];
    b.add(quad(V(x + 0.4, 2.9, -9), V(x + w - 0.6, 2.9, -9), V(x + w - 0.6, 2.5, -8.0), V(x + 0.4, 2.5, -8.0)), lam("awn" + aw, () => ({ color: aw, side: THREE.DoubleSide })));
    x += w; k++;
  }
  // lamp posts + trees on the near pavement edge
  for (let lx = -56; lx < 60; lx += 12) {
    b.add(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8).translate(lx, 2.1, -3.5), dark);
    b.add(new THREE.SphereGeometry(0.22, 12, 8).translate(lx, 4.3, -3.5), lam("cityBulb", () => ({ color: "#fff3c4" })));
    addVeg(b, "round", lx + 6, 0, -8.2, 5.5, 300 + lx);
  }
  b.build(G);
}

const HALL = [["#efe4d0", "#e8dcc6", "#c9b48f"], ["#dfe6ec", "#d6dee6", "#9fb0c4"], ["#efdcd2", "#e6cfc3", "#c09a8a"], ["#e3e8d8", "#d9e0cc", "#a9b48f"]];
const marble = (key: string, a: string, c: string) => ctex(key, 512, 512, (g, r) => {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? a : c; g.fillRect(i * 128, j * 128, 128, 128); }
  g.strokeStyle = "rgba(120,100,90,.18)"; g.lineWidth = 2;
  for (let n = 0; n < 24; n++) { g.beginPath(); const y = r() * 512; g.moveTo(0, y); g.bezierCurveTo(170, y + r() * 60 - 30, 340, y + r() * 60 - 30, 512, y + r() * 40 - 20); g.stroke(); }
});
const painting = (key: string, v: number) => ctex(key, 256, 200, (g) => {
  g.fillStyle = ["#9ad0f0", "#f2c48a", "#b7e0b0", "#d8b8ec"][v % 4]; g.fillRect(0, 0, 256, 200);
  g.fillStyle = ["#4f9a4a", "#c0603a", "#3a7ab0", "#9a5ab0"][v % 4];
  g.beginPath(); g.moveTo(0, 200); g.lineTo(70 + v * 20, 90); g.lineTo(150, 150); g.lineTo(210 - v * 10, 70); g.lineTo(256, 200); g.fill();
  g.fillStyle = "#ffe36b"; g.beginPath(); g.arc(190 - v * 30, 50, 22, 0, 7); g.fill();
});
export function museumHall(G: THREE.Group, o: Variant & { plinths?: V3[] } = {}) {
  const vi = (o.variant ?? 0) % HALL.length, [wc, fc, ac] = HALL[vi], b = new Batch();
  const wall = lam("hallWall" + vi, () => ({ color: wc })), trim = lam("hallTrim", () => ({ color: "#fbf6ea" }));
  const gold = lam("hallGold", () => ({ color: "#d4aa48" })), rope = lam("hallRope", () => ({ color: "#b8343a" }));
  b.add(up(-12, 12, -12, 10, 3), lam("hallFloor" + vi, () => ({ map: marble("hallMarble" + vi, fc, ac) })));
  b.add(boxGeo(V(-12, 0, -12.4), V(12, 7, -12)), wall);
  b.add(boxGeo(V(-12.4, 0, -12.4), V(-12, 7, 10)), wall);
  b.add(boxGeo(V(12, 0, -12.4), V(12.4, 7, 10)), wall);
  b.add(boxGeo(V(-12, 0, -12.02), V(12, 0.3, -11.9)), trim);
  b.add(boxGeo(V(-12, 6.4, -12.05), V(12, 6.8, -11.85)), trim);
  // paintings in gold frames on the back wall
  for (let k = 0; k < 4; k++) {
    const cx = -8.4 + k * 5.6;
    b.add(boxGeo(V(cx - 1.5, 2.6, -12.0), V(cx + 1.5, 5.0, -11.92)), gold);
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.1), new THREE.MeshBasicMaterial({ map: painting("hallPaint" + k, k + vi), color: 0xe4e4e4 }));
    pm.position.set(cx, 3.8, -11.9); G.add(pm);
  }
  // columns along the sides
  for (const s of [-1, 1]) for (let z = -10; z <= 8; z += 4.5) {
    b.add(new THREE.CylinderGeometry(0.42, 0.48, 6.4, 20).translate(s * 9.5, 3.2, z), trim);
    b.add(boxGeo(V(s * 9.5 - 0.6, 0, z - 0.6), V(s * 9.5 + 0.6, 0.3, z + 0.6)), trim);
    b.add(boxGeo(V(s * 9.5 - 0.6, 6.3, z - 0.6), V(s * 9.5 + 0.6, 6.6, z + 0.6)), trim);
  }
  // plinths with a gold cap + rope stanchions in front of them
  const P = o.plinths ?? [];
  for (const p of P) {
    b.add(boxGeo(V(p[0] - 0.45, 0, p[2] - 0.45), V(p[0] + 0.45, 0.94, p[2] + 0.45)), trim);
    b.add(boxGeo(V(p[0] - 0.5, 0.94, p[2] - 0.5), V(p[0] + 0.5, 1.0, p[2] + 0.5)), gold);
  }
  // rope stanchions between the plinths (never in front of an exhibit), 1.6 m in front of them
  if (P.length) {
    const za = P[0][2] + 1.6, posts = [P[0][0] - 1.3, ...P.slice(1).map((p, k) => (p[0] + P[k][0]) / 2), P[P.length - 1][0] + 1.3];
    for (const xs of posts) b.add(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8).translate(xs, 0.45, za), gold);
    for (let k = 0; k + 1 < posts.length; k++) {
      const xa = posts[k], xb = posts[k + 1];
      b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(xa, 0.85, za), V((xa + xb) / 2, 0.55, za), V(xb, 0.85, za)]), 12, 0.03, 6), rope);
    }
  }
  b.build(G);
}

const VAULT = [["#d6ecf6", "#4fa3e6"], ["#e1f3ee", "#e0485a"], ["#e4e6f6", "#f6c344"], ["#eef3f6", "#6cc2a4"]];
export function coldVault(G: THREE.Group, o: Variant = {}) {
  const vi = (o.variant ?? 0) % VAULT.length, [wc, cap] = VAULT[vi], b = new Batch();
  const wall = lam("vaultWall" + vi, () => ({ color: wc })), steel = lam("vaultSteel", () => ({ color: "#aeb8c2" }));
  const rack = lam("vaultRack", () => ({ color: "#7f8c99" })), glass = lam("vaultTube", () => ({ color: "#e8f4fb" })), capM = lam("vaultCap" + vi, () => ({ color: cap }));
  b.add(up(-6, 6, -8, 6, 2), lam("vaultFloor", () => ({ map: tileTex() })));
  b.add(boxGeo(V(-6, 0, -8.3), V(6, 3.6, -8)), wall);
  b.add(boxGeo(V(-6.3, 0, -8.3), V(-6, 3.6, 6)), wall);
  b.add(boxGeo(V(6, 0, -8.3), V(6.3, 3.6, 6)), wall);
  // freezer racks: steel frames, shelves and rows of capped tubes (back wall + the two side walls)
  const racks: [number, number, number, number][] = [[-5.4, -1.0, -7.95, -7.4], [1.0, 5.4, -7.95, -7.4]];
  for (const [x0, x1, z0, z1] of racks) {
    b.add(boxGeo(V(x0, 0, z0), V(x1, 3.0, z0 + 0.05)), rack);
    for (let s = 0; s < 5; s++) {
      const y = 0.35 + s * 0.6;
      b.add(boxGeo(V(x0, y, z0), V(x1, y + 0.04, z1)), steel);
      for (let x = x0 + 0.15; x < x1 - 0.1; x += 0.22) {
        b.add(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 8).translate(x, y + 0.17, (z0 + z1) / 2), glass);
        b.add(new THREE.CylinderGeometry(0.056, 0.056, 0.06, 8).translate(x, y + 0.33, (z0 + z1) / 2), capM);
      }
    }
    for (const x of [x0, x1 - 0.06]) b.add(boxGeo(V(x, 0, z0), V(x + 0.06, 3.0, z1)), steel);
  }
  for (const s of [-1, 1]) for (let z = -6.5; z < 2; z += 2.2) {
    b.add(boxGeo(V(s < 0 ? -6 : 5.1, 0, z), V(s < 0 ? -5.1 : 6, 2.2, z + 2.0)), lam("vaultFreezer", () => ({ color: "#f4f8fb" })));
    b.add(boxGeo(V(s < 0 ? -5.12 : 5.06, 1.4, z + 0.3), V(s < 0 ? -5.06 : 5.12, 1.9, z + 0.4)), steel);
  }
  // steel table in the middle
  b.add(boxGeo(V(-1.4, 0.86, -3), V(1.4, 0.92, -2)), steel);
  for (const [x, z] of [[-1.35, -2.95], [1.3, -2.95], [-1.35, -2.1], [1.3, -2.1]]) b.add(boxGeo(V(x, 0, z), V(x + 0.05, 0.86, z + 0.05)), rack);
  // ceiling light strips (bright, cold)
  for (const x of [-3, 0, 3]) b.add(boxGeo(V(x - 0.15, 3.5, -7), V(x + 0.15, 3.56, 4)), lam("vaultLamp", () => ({ color: "#ffffff", emissive: "#cfe8ff" })));
  b.build(G);
}
