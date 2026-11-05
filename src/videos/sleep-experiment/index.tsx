// "sleep-experiment" (76 s): The Russian Sleep Experiment, retold. Production = film data (story.ts) + three places from
// the interiors library (test chamber, observation room, child's bedroom) + staging (cast.ts) + pose() for the moving
// set pieces (door, pasted pages, flood water, the tin tower, the bedside lamp).
import { makeShort } from "../../../library/director/Short";
import { Production } from "../../../library/director/world";
import { testChamber, controlRoom, bedroom, ChamberHandles } from "../../../library/sets/interiors";
import { textBoard } from "../../../library/sets/props";
import { FILM, CX, RX, BX, smooth, clamp01 } from "./story";
import { stage } from "./cast";
import React from "react";
import { HorrorFX, handheld, HorrorOpts } from "../../../library/director/horror";
import WORDS from "../../../projects/sleep-experiment/voice/words.json";
import CAP from "../../../projects/sleep-experiment/captions.json";

const doorOpen = (id: number, f: number) =>
  id < 16 ? 0 : id === 16 ? smooth((f - 1366) / 18) : id <= 18 ? 1 : id === 19 ? 1 - smooth((f - 1800) / 22) : 0; // v3 shot ids
export const PRODUCTION: Production = {
  film: FILM,
  places: {
    C: { x: CX, build: (G) => {
      const h = testChamber(G, { variant: 0 });
      // in-world text (story details, not facts): the room's name, a warning on the door, stencils at the vents
      textBoard(G, "sign", { text: "TEST CHAMBER 4", x: 0, y: 2.6, z: -5.9, w: 1.25, color: "#8a2a26", ink: "#f2e6c8" });
      textBoard(G, "label", { text: "DO NOT OPEN", x: 0.95, y: 1.55, z: -5.91, w: 0.42, color: "#e8d27a", ink: "#2a1a10" });
      for (const x of [-3.4, 3.4]) textBoard(G, "label", { text: "GAS", x, y: 2.58, z: -5.91, w: 0.36, color: "#d9d2b0", ink: "#7a1a14" });
      textBoard(G, "label", { text: "NO SLEEP", x: -3.4, y: 1.1, z: -5.91, w: 0.5, color: "#cfc6a8", ink: "#3a2a20" });
      return h;
    } },
    R: { x: RX, build: (G) => {
      controlRoom(G, { variant: 0, glow: "#5f9a46" });
      textBoard(G, "sign", { text: "OBSERVATION", x: 0, y: 2.85, z: -3.96, w: 1.3, color: "#3e4a3a", ink: "#e8e0c0" });
      textBoard(G, "newspaper", { top: "SUBJECT LOG", text: "5 SUBJECTS / NO SLEEP", x: -2.95, y: 1.65, z: -3.97, w: 0.55 });
      textBoard(G, "label", { text: "SILENCE", x: 2.55, y: 2.25, z: -3.97, w: 0.6, color: "#a8282c", ink: "#f4efe0" });
      textBoard(G, "label", { text: "FILE 4", x: 2.9, y: 1.12, z: -3.39, w: 0.3, color: "#e8dfc4", ink: "#2a1a10" });
    } },
    B: { x: BX, build: (G) => bedroom(G, { variant: 0 }) },
  },
  stage,
  pose: (id, f, _t, h) => {
    const C = h.C as ChamberHandles;
    if (C) {
      C.door.rotation.y = 1.45 * doorOpen(id, f);
      C.pages[0].forEach((m) => (m.visible = id >= 10));
      C.pages[1].forEach((m) => (m.visible = id >= 10));
      C.water.visible = id >= 16;
      C.tins.visible = id >= 17;
    }
    const B = h.B as { lampOn: { visible: boolean }; lampOff: { visible: boolean } } | undefined;
    if (B) { const on = !(id === 23 && f >= 2187); B.lampOn.visible = on; B.lampOff.visible = !on; }
  },
};
export const SLEEP_FRAMES = FILM.total;
// horror post: archival-film overlay + handheld camera. Jolts on every scare; the bulb dies in stutters; subliminal
// flash frames of the grin when the door opens and as the eyes lunge; a hard cut to black at the end.
const HITS: [number, number][] = [[66, 1.0], [157, 0.6], [936, 1.0], [1223, 0.3], [1409, 0.9], [1822, 0.7], [1903, 1.2], [2040, 0.6], [2189, 0.3], [2250, 1.0]];
const FX: HorrorOpts = {
  vig: 0.8, grain: 0.17, flicker: 0.07, scratches: 0.45, dust: 0.6,
  hardFlicker: [[862, 875, 0.85], [1366, 1382, 0.6], [2090, 2140, 0.75], [2189, 2195, 0.6]],
  flashImg: "_render/sleep-flash.jpg", flashes: [[1408, 2], [2253, 3]],
  black: [[2262, 2281]],
};
const Overlay: React.FC<{ f: number }> = ({ f }) => <HorrorFX f={f} o={FX} />;
export const SleepShort = makeShort(PRODUCTION, {
  words: WORDS, keywords: CAP.keywords, shake: (f) => handheld(f, { amp: 6, hits: HITS }), overlay: Overlay, background: "#000000",
  captionStyle: { plain: true, size: 0.05, keyScale: 1, upper: false, maxWords: 3, maxChars: 22, outline: "#000000", keyColors: CAP.colors },
});
