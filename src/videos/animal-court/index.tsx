// "What If Animals Could Sue Humans" (69 s): the production = film data (story.ts) + places from the set library +
// staging (cast.ts) + per-shot toggles, rendered by the shared director (library/director).
import { makeShort } from "../../../library/director/Short";
import { Production } from "../../../library/director/world";
import { courtroom, jungle, courthouse, townSquare } from "../../../library/sets/sets";
import { FILM, JX, EX, MX, WITNESS, CRATES, MONK_J } from "./story";
import { stage } from "./cast";
import WORDS from "../../../projects/animal-court/voice/words.json";
import CAP from "../../../projects/animal-court/captions.json";

export const PRODUCTION: Production = {
  film: FILM,
  places: {
    C: { build: (G) => courtroom(G, { witness: WITNESS, crates: CRATES }) },
    J: { x: JX, build: (G) => jungle(G, { rock: [MONK_J[0] - JX, MONK_J[1], MONK_J[2]] }) },
    E: { x: EX, build: (G) => courthouse(G) },
    M: { x: MX, build: (G) => townSquare(G) },
  },
  stage,
  // counsel tables hidden for the two-boxes shot (8) and the paper stack (11); crates only in 8; the flags wave
  pose: (id, _f, t, h) => {
    h.C.tables.visible = id !== 8 && id !== 11;
    h.C.crates.visible = id === 8;
    for (const fl of h.C.flags) {
      const p = fl.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { const u = (i % 11) / 10; p.setZ(i, 0.06 * u * Math.sin(t * 2.2 - u * 4)); }
      p.needsUpdate = true;
    }
  },
};

export const COURT_FRAMES = FILM.total;
export const AnimalCourtShort = makeShort(PRODUCTION, { words: WORDS, keywords: CAP.keywords });
