// TEMPLATE production: film data (story.ts) + places from library/sets + staging (cast.ts). Captions: the plain speed style.
import { makeShort } from "../../../library/director/Short";
import { Production } from "../../../library/director/world";
import { townSquare } from "../../../library/sets/sets"; // pick sets that fit the topic; see library/API.md for all of them
import { FILM, AX } from "./story";
import { stage } from "./cast";
import WORDS from "../../../projects/_template/voice/words.json";
import CAP from "../../../projects/_template/captions.json";

export const PRODUCTION: Production = {
  film: FILM,
  places: { A: { x: AX, build: (G) => townSquare(G, { variant: 0 }) } }, // use a variant the variety log hasn't used lately
  stage,
};
export const TEMPLATE_FRAMES = FILM.total;
export const TemplateShort = makeShort(PRODUCTION, {
  words: WORDS, keywords: CAP.keywords,
  captionStyle: { plain: true, size: 0.05, keyScale: 1, upper: false, maxWords: 3, maxChars: 22, outline: "#000000", keyColors: CAP.colors },
});
// register in src/Root.tsx: <Composition id="X" component={TemplateShort} durationInFrames={TEMPLATE_FRAMES} fps={30} width={1080} height={1920} />
