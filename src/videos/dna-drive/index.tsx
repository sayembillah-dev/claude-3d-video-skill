// "What If You Could Store Files in Your DNA?" (75 s): film data (story.ts) + sets from the library + staging (cast.ts),
// rendered by the shared director. Plain "speed" captions (white, black outline, 2-3 whole words, coloured keywords).
import { makeShort } from "../../../library/director/Short";
import { Production } from "../../../library/director/world";
import { lab, microWorld, townSquare } from "../../../library/sets/sets";
import { FILM, MX, SX } from "./story";
import { stage } from "./cast";
import WORDS from "../../../projects/dna-drive/voice/words.json";
import CAP from "../../../projects/dna-drive/captions.json";

export const PRODUCTION: Production = {
  film: FILM,
  places: {
    L: { build: (G) => lab(G, { variant: 0 }) },
    M: { x: MX, build: (G) => microWorld(G, { variant: 0 }) },
    S: { x: SX, build: (G) => townSquare(G, { variant: 2 }) },
  },
  stage,
};

export const DNA_FRAMES = FILM.total;
export const DnaDriveShort = makeShort(PRODUCTION, {
  words: WORDS, keywords: CAP.keywords,
  captionStyle: { plain: true, size: 0.05, keyScale: 1, upper: false, maxWords: 3, maxChars: 22, color: "#FFFFFF", outline: "#000000", accent: "#FFD84A", keyColors: CAP.colors },
});
