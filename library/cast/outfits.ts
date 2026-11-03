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
