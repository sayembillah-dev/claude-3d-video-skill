// "teleport" (88 s): What if humans could teleport? Production = film data (story.ts) + places from the set library
// (Dave's flat, an optics lab, a mountain ground station, a Tokyo street, a square of booths) + staging (cast.ts).
import { makeShort } from "../../../library/director/Short";
import { Production } from "../../../library/director/world";
import { homeOffice, lab, jungle, cityStreet, townSquare } from "../../../library/sets/sets";
import { backdrop, scatter } from "../../../library/sets/dress";
import { textBoard } from "../../../library/sets/props";
import { FILM, HX, LX, MX, TX, QX } from "./story";
import { stage } from "./cast";
import WORDS from "../../../projects/teleport/voice/words.json";
import CAP from "../../../projects/teleport/captions.json";

export const PRODUCTION: Production = {
  film: FILM,
  places: {
    H: { x: HX, build: (G) => homeOffice(G, { variant: 1 }) },
    L: { x: LX, build: (G) => lab(G, { variant: 1 }) },
    M: { x: MX, build: (G) => {
      jungle(G, { variant: 1 });
      backdrop(G, { kind: "peaks", r: 120, n: 18, h: 40, seed: 3 });
      scatter(G, { x: [-14, 14], z: [-3, 34], n: 90, kinds: ["pebble", "rock", "tuft"], avoid: [[0, 7, 2.4], [0, 20, 4], [0, 0, 2]], seed: 5 });
    } },
    T: { x: TX, build: (G) => {
      cityStreet(G, { variant: 1 });
      textBoard(G, "sign", { text: "TOKYO", x: -3.2, y: 0, z: -7.6, w: 2.2, posts: true, color: "#c9a46a" });
    } },
    Q: { x: QX, build: (G) => {
      townSquare(G, { variant: 3 });
      backdrop(G, { kind: "hills", r: 120, n: 16, h: 18, seed: 9 });
      scatter(G, { x: [-24, 24], z: [-12, 14], n: 60, kinds: ["pebble", "flower", "tuft"], avoid: [[0, -6.5, 3], [0, 0, 7]], seed: 8 });
    } },
  },
  stage,
};
export const TELEPORT_FRAMES = FILM.total;
export const TeleportShort = makeShort(PRODUCTION, {
  words: WORDS, keywords: CAP.keywords,
  captionStyle: { plain: true, size: 0.05, keyScale: 1, upper: false, maxWords: 3, maxChars: 22, outline: "#000000", keyColors: CAP.colors },
});
