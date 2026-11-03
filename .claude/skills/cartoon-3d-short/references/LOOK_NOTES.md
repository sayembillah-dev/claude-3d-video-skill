# Look notes (moved out of SKILL.md to keep it lean; read on demand)

## Final look values (bridge after 4 verifier rounds; all in `library/engine/ (originally templates/bridge/)`)
Start every new short from `library/engine/ (originally templates/bridge/)` (copy to `src/videos/<name>/`): the look lives in these values, the
story lives in story.ts / build.ts layout / cast.ts roles. Opus max scores at the end: colour day 7, golden 5-6,
lighting 5-6, ink 6, textures 5-6, characters 7, depth 6-7, composition 6-7 (from 5/3/4/5/4/7/4/6 at the start).
- **Light presets** (`lights.ts`, sun camera-relative and frozen per shot):
  - day: az 75 / el 48, lit [1.58,1.5,1.33], shade [.30,.29,.36], lift [.05,.06,.11] (cool tint ONLY in shade), sky
    top #3e7fd2 → horizon #b8d0ec, fog = horizon, 25→300 m, uSat 1.08, ~15 % blue haze past 60 m.
  - golden: az 6 / el 7 (backlit low sun), key toward #FFB36B ×1.5, violet-blue shade (facade ≈ #444380), sky
    #ffc47c → #8a6f8a, peach fog only past 50 m, sun disc #ffcf9e + bloom, contact blobs + real card shadows.
- **Albedos** (`paint.ts`/`build.ts`): muted brick / cream / ochre / terracotta houses with plinth, cornice, sills,
  hoods, door step, chimney + pot, heights 7 / 8.4 / 9.8 m; warm grey/beige stone (saturation −35 % from "storybook");
  ochre wood deck C* ~51-58 with near-black seams; iron dark and desaturated. Never lemon, never lavender lit faces.
- **Ink** (`ink.ts`): #030303, 5.1 px near (6 m) → 3.3 px far (90 m) at 1080x1920, creases ×0.8 from 35°, depth
  jumps from 1 %, fog tint 0.3 only far; character cards on layer `NOINK` (they carry their own plum ink).
- **Lens** (`lensblur.ts` + `dofAt` in story.ts): cInf px at 1080: hook/river CU 15-16, close-ups 12-14, MS 10-12,
  park 7, golden sway 5, wides/aerials 0. Focus on the eyes of the front row.
- **Post** (`Bridge.tsx`): ink → lens pre → lens main → bloom (thr 1.0, int .5, 6 levels, radius .6) → NEUTRAL tone
  map → grade; MSAA 4. Film grain exists but is OFF (reference measures no grain; it quadruples the file size).
- **Characters** (`toon.ts`/`cast.ts`/`cardshade.ts`): bean heads h/w .94, plum ink #241726, eyes .26 W apart, no blush,
  14 expressions; adults 3.5 head-heights; walk bob 5 %, lean 1-7°, planted 0.8 m stride; blinks 0.5-2.3 s; tight
  contact shadow ~.5 under the feet + sun-direction tail by day; golden rim inner only (never an offset outer copy).
- **Camera** (`story.ts`): cuts on big jumps, smootherstep glides 18-40 f, every hold creeps (no static hold ≥4 f),
  flip kicks decaying over 7 f on impacts, 4-4.6° rolls, foreground props (`FOREGROUND`) in ~1/3 of shots.

## Look targets (measured from the reference; see references/reports/)
- **Ink:**
  - World lines: about 3 px at 1080 wide, near-black #0b0a0c, nearly constant with distance. Silhouettes, depth jumps and normal creases only. No line on wall/floor joins or the horizon. Character cards are never outlined by the world ink.
  - Character ink: dark plum #201628-#2f1d28, thicker on the bottom/shadow side.
- **Colour:**
  - Day median luma ~.57. Non-ink p5 ~.23 (no crushed blacks). Lit chroma C* p90 ~55. Day sky top ~#5e93d9, horizon 1.28x brighter.
  - Golden: peach horizon #ffd08a, violet-blue shadows (never brown), backlit sun.
- **Depth:**
  - DOF on about 1/3 of screen time (CU, MS, inserts), cInf 10-16 px at 1080, focus on the eyes. Establishing and wide shots stay sharp.
  - Fog = horizon colour, 25→420 m day, 20→360 m golden.
  - Bloom only on HDR emissives: threshold 1.0.
- **Camera:**
  - Hard cuts on big jumps. Everything else is a smootherstep glide of 18-40 f, peak ≤ 25 px/f at 720p.
  - Every hold pushes in 0.15-0.35 %/f, with 0.6 %/f on punch words.
  - Rolls of 4-5°.
  - No hand-held float. Impact shakes flip sign every frame and decay over 7 f.
- **Characters:**
  - About 3.5 head-heights tall, legs 1.4 HH.
  - Stick limbs about 0.055 of head width, ink-dot hands.
  - Bean head (h/w ~0.93, narrower chin, pointier crown).
  - No blush or eye highlights. Faces at brightness ~.93.
  - Walk bob 3-7 %, lean 1-7°, planted feet.
  - Blinks every 0.5-2.3 s, lasting 4 f.

## Look-match loop (how the bridge look was reached; reuse for any "make it look like X" pass)
1. **Measure the reference first.** One analysis agent per topic (motion, depth, textures, characters, lighting, outlines, grade), each writing numbers, not adjectives, to `references/reports/<topic>.md`. Shared brief: `compare/CONTEXT.md`. Reports are the source of truth for every agent after.
2. **Sandboxes, one owner per file.** Copy the project folder to `src/videos/<name>_{cam,world,mat,char,post}` with entries `src/sandboxes/<n>/index.tsx` (same `index.tsx` as main, only the import path changed). Ownership used for the bridge:
   - cam: story.ts (camera keys, cuts, kicks, DOF table, foreground props)
   - world: world.ts, lights.ts, shade.ts, grade.ts (sun, sky, fog, river, colour, grade)
   - mat: paint.ts, build.ts (painted textures, buildings, props)
   - char: toon.ts, cast.ts, cardshade.ts (character drawing, posing, card lighting, fx cards)
   - post: ink.ts, Bridge.tsx, lensblur.ts (outline pass, composer, lens blur, bloom)
   Agents only edit their own files in their own sandbox and render stills with `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx node scripts/bridge-stills.mjs out/<name>/<n>/x_ <frames> 0.5`.
3. **Merge** with `python scripts/bridge_merge.py [cam,world,mat,char,post]` (backs main up to `backup/bridge_<time>/`, copies owned files only). Then `npx tsc --noEmit` (filter to the project folder), then **re-sync every sandbox from main** (`cp -f src/videos/<name>/* src/videos/<name>_<n>/`) before the next round.
4. **Verify** with a fresh Opus max agent: side-by-side sheets (`python scripts/sbs_sheet.py out.jpg --ours a b --ref r1 r2`), score each area out of 10 (colour day / golden, lighting, ink, textures, characters, depth, composition) plus a numbered fix list with frame numbers. Map each fix to the file owner and resume that owner's agent with SendMessage (keeps its context). Bridge scores: round 1 5/3/4/5/4/7/4/6 → round 2 5/4/5/6/4/7/6/6 → round 3 see notes.
5. Contracts between owners live in exported constants (e.g. `NOINK` layer from ink.ts, `dofAt`/`FOREGROUND` from story.ts, `LIGHTS`/`LOOK` from lights.ts). Changing a contract means telling every owner that reads it.

## Gotchas
- Kenney nature-kit materials are teal: recolour them by material name in build.ts.
- Cameras end up inside houses: the sight-line culler in build.ts/world.ts removes anything blocking any camera ray.
- Ink in the same merged effect pass as DOF gets overwritten. Ink must be its own pass before the blur.
- Pixel-sized post parameters must scale with resolution: stills are at 0.5, the final at 1.333. R3F clamps dpr to ≥ 1, so `--scale 0.5` stills still render a 1080x1920 buffer.
- **Disk:** every Remotion bundle copies `public/` (~1.3 GB) into `the temp folder\remotion-webpack-bundle-*` and never deletes it. 60+ GB filled the system drive during the bridge passes and a render died with ENOSPC. Always render with `export TEMP='<big drive>/remotion-tmp' TMP='<big drive>/remotion-tmp'` (bridge-stills.mjs sets it itself) and ask the user before deleting old bundle folders in the shared the temp folder (auto mode blocks the sweep). <big drive>/remotion-tmp fills too (~500 folders / 110 GB after the 4 bridge rounds): when a project is finished and nothing is rendering, delete its `remotion-webpack-bundle-*` and `puppeteer_dev_chrome_profile-*` folders there.
- In JS strings write `"<big drive>/remotion-tmp"`, never `"<big drive>\remotion-tmp"` (`\r` becomes a carriage return).
- Remotion writes a silent audio track: mux with `-map 0:v:0 -map 1:a:0`.
- Sub-agents can't write report files in this harness: ask them for a ≤150-word final message and save it yourself to `out/<name>/<n>/REPORT.md`.
- Scratch `.ts` files inside `out/` break `tsc`: name them `.txt`.
- 2K renders run ~4 fps (≈10 min for 67 s). Stills at 0.5 take 3-8 s each after a ~40 s bundle.
- Remotion 4.0.540 rejects `--scale 1.3333` (the height is not an integer). `scripts/render.mjs` computes the exact 4/3. By hand, use `--scale 1.3333333333333333`.
- `InkPass` may lack `dispose()`. Guard the unmount cleanup with `?.()`, or a crossfade layer crashes the whole render (fixed in the animal-court skeleton).
- The template's `scripts/bridge-stills.mjs` had a Windows Chrome path. On macOS it now uses Remotion's own headless shell, and the composition comes from `COMP=<id>`.
- Film grain at 2.5 % made the 2K file 910 MB instead of ~250 MB and will turn to mush on YouTube; the reference has none. Keep it off.

## Readability traps the verifier caught (check every new prop/shot for these)
- **A swing drawn as one rope that disappears behind the kid reads as a HANGING.** Always two ropes to a wide plank
  with the kid between them (`swingKid` in toon.ts), and a frame whose legs clear the arc (A-frame at each end).
- Props or flotsam closer than ~2 m to a lens become huge cut-off blobs at the frame edge. When a camera moves, re-check
  every prop near its new position (the river cameras moved into the floating hats).
- A foreground bush cut by the frame edge reads as a "green ball"; a foreground prop must be recognisable or gone.
- Flags: red + yellow star/diamond reads as Vietnam's. Use a period-correct flag (St George's cross for England 1831).
- Painted signs lit by a side sun go grey-blue and unreadable: give the sign face an unlit material.
- Golden rim light done as an offset outer copy turns every hat into a picture frame: inner rim only, head/torso only.
- Balcony/railing rails at chest height through characters: put the lens ~2.5 m up so rails cross legs, not torsos.
- Flat holds read as freezes in QA (frozen span ≥12 f): every hold needs a creeping push-in.

