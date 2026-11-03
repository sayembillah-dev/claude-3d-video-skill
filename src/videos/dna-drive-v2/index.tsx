// "dna-drive-v2" (75 s): the fresh remake of the DNA-storage what-if. Production = film data (story.ts) + places from the
// set library (home office, inside the body, city street, museum of storage, cold vault) + staging (cast.ts).
import { makeShort } from "../../../library/director/Short";
import { Production } from "../../../library/director/world";
import { homeOffice, microWorld, cityStreet, museumHall, coldVault } from "../../../library/sets/sets";
import { FILM, HX, BX, SX, MX, VX, PL } from "./story";
import { stage } from "./cast";
import WORDS from "../../../projects/dna-drive-v2/voice/words.json";
import CAP from "../../../projects/dna-drive-v2/captions.json";

export const PRODUCTION: Production = {
  film: FILM,
  places: {
    H: { x: HX, build: (G) => homeOffice(G, { variant: 0 }) },
    B: { x: BX, build: (G) => microWorld(G, { variant: 2 }) },
    S: { x: SX, build: (G) => cityStreet(G, { variant: 0 }) },
    M: { x: MX, build: (G) => museumHall(G, { variant: 0, plinths: PL.map(([x, y, z]) => [x - MX, y, z] as [number, number, number]) }) },
    V: { x: VX, build: (G) => coldVault(G, { variant: 0 }) },
  },
  stage,
};
export const DNA2_FRAMES = FILM.total;
export const DnaDrive2Short = makeShort(PRODUCTION, {
  words: WORDS, keywords: CAP.keywords,
  captionStyle: { plain: true, size: 0.05, keyScale: 1, upper: false, maxWords: 3, maxChars: 22, outline: "#000000", keyColors: CAP.colors },
});
