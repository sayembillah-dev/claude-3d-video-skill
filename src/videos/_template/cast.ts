// TEMPLATE staging: stage(id, t, cam) returns what is on screen in shot `id` at time `t` seconds. Helpers from
// library/director/stage.ts: human() (bean-head people), critter() (animals), card() (any 600x1000 drawing), burst()/puff() fx.
// Reactions land 0-3 frames before their word: use after(t, wordStartSeconds). Quantise floats with q() so drawings are shared.
import { Stage, CamInfo, human, card, burst, after, q, FOLK } from "../../../library/director/stage";
import { SHOTS_OF, FPS, HERO } from "./story";

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS_OF(id), f = Math.round(t * FPS);
  void s; void f; void card; void burst; void q;
  // example: a person who reacts to a word at 1.2 s
  human(cam, out, 1, FOLK[0], "f0", HERO[0], HERO[1], HERO[2], { mode: "stand", expr: after(t, 1.2) ? "grin" : "neutral" }, t);
  return out;
};
