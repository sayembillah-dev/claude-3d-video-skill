# sleep-experiment: production notes

- **Story:** The Russian Sleep Experiment (creepypasta), retold in our own words. 219 words, voice 74.0 s, film 76 s (2280 f).
- **Render:** 1080x1920 at 30 fps, captions in the plain speed style, SFX only (no music).
- **Places** (new, in `library/sets/interiors.ts`):
  - `testChamber`: concrete cell with portholes, a steel door, vents, mic grilles, cots, books, pipes and a drain. Handles for the door, the pasted pages, the flood water and the tin tower.
  - `controlRoom`: console, O2 dial, intercom, reel recorder and the big porthole.
  - `bedroom`: night bedroom with a lamp that switches on and off, and a dark gap under the bed.
- **Cast:**
  - New outfits: `PRISONER[5]`, `PRISONER_GAUNT` (eye bags), `SOVIET_SOLDIER[3]` (ushanka), `COMMANDER` (peaked cap), `SOV_SCIENTIST[3]`.
  - New expressions in `engine/toon.ts`: `creepy`, `scream`, `haunted`. Also added: an Outfit `bags` field and the `ushanka` and `peaked` hats. All additive; older videos are unaffected.
- **Props** (`library/cast/sinister.ts`): o2Dial, pistol, eyesDark, peakedCap, cigarette, speakerBox, headphones, foodTin, openBook, sheetBody, paperedGlass, blackout, wallMic.
- **Sound kit** (`library/audio/sfx_dark.py`): hiss, whisper, pound, strain, rip, slap, metal_clank, metal_creak, gunshot, click, buzz, drip, heartbeat, tinroll.
- **Gotchas learned:**
  - Cards are alpha-tested, so a translucent card renders solid. Do full-frame dimming with a `soft` fx quad. See `dim()` in cast.ts.
  - The 9:16 frame is narrow: at 1 m the frame is only about 0.5 m wide. Cards a little off the look axis vanish. Aim the look point at the prop, or follow it.
  - To put a card in front of a dimmer on the same screen spot, project it onto the camera ray. See `near()` in cast.ts.

## v2 horror pass (2026-11-05, after user feedback: "not frightening, basic, minimal movement")
- Look: every room in the new `dread` light (night for the bedroom), and the `HorrorFX` overlay: grain, vignette, flicker, scratches and dust. The bulb dies in stutters (862-875, 1366-1382, 2090-2140, 2189-2195). Subliminal inverted flash frames of the grin play at 1408 and 2253, then a cut to black at 2262.
- Camera: `handheld` shake with jolts at every scare; snap-ins at 157 and 2040; dutch angles; hard cuts only (the grin double-exposes into the bedroom).
- Hook: a hollow-eyed face rises out of the gas in the observation porthole and slams a hand on the glass on "locked".
- Scares: a BANG on the covered glass after 2 s of silence (936); a giant wall shadow reaching up as they beg for the gas; the eyes under the bed lunge at the lens.
- Faces: hollow black sockets with pinprick pupils; the sleepless twitch (head snaps) and the frightened tremble.
- Sound:
  - three reverb spaces (concrete chamber 1.6 s, control room, dry bedroom);
  - foley: footsteps, water steps, boots, cloth, breathing;
  - ventilation rumble with mains hum, distant pipe knocks;
  - a low tension drone (cut before scares), risers, sub hits;
  - SFX 4 dB above the house balance.
- QA: motion 82 % fresh, loudness -15.3 LUFS. The pacing check reads the flicker and flash frames as cuts.
