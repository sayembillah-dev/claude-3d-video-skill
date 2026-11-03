// Story-only props of the animal-court short (the shared cast lives in library/cast/critters.ts).
import { Pen, INK, rrect } from "../../../library/engine/toon";
import { FUR, FACE } from "../../../library/cast/critters";

/** the famous grin in a gold frame on an easel (shots 3, 12) */
export const easelSelfie = (p: Pen) => {
  for (const [x0, x1] of [[300, 150], [300, 450]] as const) p.band([[x0, 200], [x1, 975]], "#8a5a3a", 18, 5);
  p.band([[300, 300], [300, 975]], "#7a4f33", 16, 5);
  p.poly(rrect(110, 150, 490, 560, 12), "#d9a83a", 12);
  p.poly(rrect(140, 180, 460, 530, 6), "#4f9a4a", 8);
  p.ell(220, 250, 60, 46, "#6bb558", 0); p.ell(400, 470, 80, 50, "#3f8a40", 0);
  // big grinning macaque face filling the photo
  p.ell(300, 360, 120, 112, FUR, 9);
  p.ell(300, 378, 88, 78, FACE, 6);
  for (const s of [-1, 1]) p.ell(300 + s * 32, 350, 9, 12, INK, 0);
  p.poly([[230, 392], [370, 392], [350, 440], [250, 440]], "#f6f1e6", 7);
  for (const x of [262, 285, 308, 331]) p.stroke([[x + 4, 394], [x + 4, 438]], 3);
  p.band([[110, 600], [490, 600]], "#7a4f33", 18, 5);
};
