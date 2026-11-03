// Reusable human roles for the bean-head cast (toon.ts Outfit). Neutral costumes, no story baked in:
//   PHOTOG  photographer / explorer (khaki, cap)   LAWYER  modern lawyer (navy suit)
//   JUDGE[v] modern judges in black robes (3 looks) MJ      old-European judge (red robe, cap)   MLAW  old-European advocate
import { Outfit, SKINS, INK } from "../engine/toon";

export const PHOTOG: Outfit = { jacket: "#8a7a4e", pants: "#4b5a3a", boots: "#5a3b2a", hat: "cap", cap: "#3a5f8a", skin: SKINS[1] };
export const LAWYER: Outfit = { jacket: "#2f3e66", pants: "#2b2f3d", boots: INK, hat: "hair", hair: "#7a4b2a", skin: SKINS[3], buttons: "#d9dde0" };
export const JUDGE = [0, 1, 2].map((v): Outfit => ({ jacket: "#26222e", pants: "#26222e", boots: INK, hat: "hair", hair: ["#d9d4cc", "#3a2a20", "#8f8a86"][v],
  skin: SKINS[[0, 3, 1][v]], build: v === 1 ? "stout" : "adult", moustache: v === 2 ? "#8f8a86" : undefined }));
export const MJ: Outfit = { jacket: "#9e2f35", pants: "#5a2328", boots: "#3a2a20", hat: "cap", cap: "#7e2228", build: "stout", moustache: "#4a3020", skin: SKINS[0] };
export const MLAW: Outfit = { jacket: "#4f3d6b", pants: "#33293f", boots: INK, hat: "cap", cap: "#2e2440", skin: SKINS[2], buttons: "#e8c45a" };
// first made for "dna-drive-v2": an office worker (hero), a museum guide and a lab scientist in a white coat
export const OFFICE: Outfit = { jacket: "#2f8f9d", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#3a2a20", skin: SKINS[1], buttons: "#f1efe6" };
export const GUIDE: Outfit = { jacket: "#8a2f4f", pants: "#2b2f3d", boots: INK, hat: "cap", cap: "#5a1f36", skin: SKINS[3], buttons: "#e8c45a" };
export const SCIENTIST: Outfit = { jacket: "#f2f4f6", pants: "#5b6b8a", boots: "#3a3446", hat: "hair", hair: "#b8b0a8", skin: SKINS[2], buttons: "#9fb0c4" };
// first made for "teleport": a commuter in a mustard jacket (hero) and a tweedy philosopher
export const COMMUTER: Outfit = { jacket: "#e8a33a", pants: "#3b4a7a", boots: "#4a3020", hat: "hair", hair: "#b8572a", skin: SKINS[0], buttons: "#3b4a7a" };
export const PHILOSOPHER: Outfit = { jacket: "#7a5a3a", pants: "#4a3f36", boots: INK, hat: "hair", hair: "#d9d4cc", skin: SKINS[0], moustache: "#d9d4cc", build: "stout" };
