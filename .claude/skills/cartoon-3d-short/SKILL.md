---
name: cartoon-3d-short
description: Make a ~55-70 s vertical cartoon story short in the "2D characters in a colourful 3D world" style (flat bean-head cartoon cards with ink outlines, painted 3D town/world with black ink lines, saturated sky, depth-of-field backgrounds, gliding cameras, voice narration, synthesized SFX + march-style music), rendered with three.js inside Remotion. Proven on "The Bridge That Fell for a Song" (2026-10-31). Use when the user asks for another video "like the bridge video", "like the soldiers/bridge short", "in that cartoon 3D style", a history/science story short with cartoon characters in 3D, or says "use the cartoon short skill". Starts with an intake (duration, topic research, script, ElevenLabs voice handoff, resolution), ships with production captions, a publish kit (titles, fact-checked description, tags, thumbnails), an AI cost ledger row and a reusable shared library.
---

# Cartoon 3D story short (three.js + Remotion)

Proven example: **The Bridge That Fell for a Song**. It is an original 67 s short about the 1831 Broughton bridge and 74 soldiers marching in step.
- Code: `src/videos/bridge/` of your Remotion project (composition `BridgeShort`, 1080x1920, 30 fps).
- Script, voice and sound: `~/bridge-short/`.
- Style research: `references/`.

The style reference is a channel studied privately (`references/`: STYLE_BIBLE.md, reports/*.md, frames/).
- Those videos are private study material. Never upload, publish or send them.
- Never copy their scripts, characters or shots. Story, characters and voice are always OUR OWN.
- Never say the channel's name in a voice-over or description.

User rules that apply:
- **Captions ON** (changed 2026-11-03): production captions from `library/captions/Captions.tsx`, with a word-by-word highlight and bigger keywords. No other text or labels inside the 3D scene.
  - **Captions must never block the visuals.** Keep them small and low: 6.2 % of the frame width, keywords 1.4x, block centre at 79 % of the height (the defaults in `Captions.tsx`).
  - Don't raise or enlarge them without the user asking. Check a few stills of each shot for overlap with faces or key action.
- English only.
- Voice: one steady tone. The user records it in ElevenLabs from our script.
- Jokes are researched real facts. Every number or date needs a source in `SCRIPT.md` before the voice is recorded.
- Standard mix: music +3 dB, SFX -6 dB, voice unchanged.
- Output resolution: ask at intake (see below). The default is 1440x2560.
- Opus max verifies every check.
- Save after every step.
- "Just do it" once the script is approved.

## Intake (always first, before any building)
Read `CLAUDE.md`, this file and `library/README.md`. Then use AskUserQuestion, one decision per question, with clear options:
1. **Cost baseline.** Read the weekly plan % with the usage tool, then run `.venv/bin/python scripts/cost_log.py start <name> --weekly <pct>`.
2. **Duration.** 30-45 s / 55-70 s (recommended, the proven formula) / 75-90 s. Word budget = seconds x 3.7.
3. **Topic.** The user's own topic or 3 suggestions. Then **tailor**: research the facts with sources (web), pick the surprising, visual cause-and-effect, and offer 2-3 angles or hooks. Flag weak or disputed facts.
4. **Script.** Follow the beat formula below, inside the word budget. Show it, revise until approved. Write `projects/<name>/SCRIPT.md` (facts + sources at the top).
5. **Voice handoff.** Write `projects/<name>/VOICEOVER.txt` (spoken lines only, one sentence per line).
   - Tell the user: the character count (`wc -m`), the estimated ElevenLabs credits (about 1 per character on standard models; check their plan), the target length, a steady deadpan delivery, and where to save it: `projects/<name>/voice/voice.mp3`.
   - **Then wait.** Build nothing that depends on timing until the mp3 is in.
6. **Resolution.**
   - 1080x1920: fastest, about 0.6x the 2K render time.
   - **1440x2560: 2K, the default.**
   - 2160x3840: 4K, about 2.3x the 2K render time and 2-3x the file size.
   - Measured 2K speed on the M-series Mac: about 1.6 fps for the 3D render, about 5.5 fps for the captions pass.
7. Check `library/README.md` for sets, cast, props and sounds that fit, and `library/music/README.md` for a background track by mood and tempo. Reuse before building new.

## Pipeline
1. **Topic and facts.** Pick one surprising true story with a physical cause and effect (it should be visual), plus a simple everyday analogy that explains it.
   - Write the facts with their source at the top of `SCRIPT.md`.
2. **Script** (~3.7 words/s, 55-70 s). Beat formula from the bridge short:
   - **Hook:** the absurd fact in one line ("Seventy-four soldiers knocked down an iron bridge just by walking across it.").
   - **Setting:** year, place, pride.
   - **Action:** escalation over three or four beats, each a little bigger.
   - **Snap:** the moment it breaks.
   - **Deadpan double line:** "Luckily ... / Unluckily ...".
   - **Explanation:** one physics idea through an everyday analogy (the kid on a swing).
   - **Consequence:** the rule it created.
   - **Callback twist:** the ending.
   - Never describe on screen what the viewer already sees.
3. **Voice.** When the user's `voice.mp3` arrives, run `source env.sh && .venv/bin/python scripts/align_words.py <name>`.
   - It uses local faster-whisper, maps the heard words onto the script words, and writes `voice/voice.wav` (48 kHz) and `voice/words.json`.
   - It prints line starts in frames and lists any words to hand-fix. Everything is timed to `words.json`.
4. **Shot plan** in `story.ts`: copy the skeleton `src/videos/animal-court/{Court.tsx,story.ts,cast.ts,world.ts}` to `src/videos/<name>/` (rename), register it in `src/Root.tsx`.
   - The engine, cast, sets, captions and thumbnail are **imported from `library/`**, never copied. `templates/bridge/` is the reference for the full bridge source.
   - `SHOTS`: id, a/b frames, light day/golden, crowd mode, `tau` story time.
   - `XFADE`: crossfades at place/time changes.
   - `FLASH_AT`: a white flash after the hook.
   - `CAMS`: per-shot keys `{f, dur?, cut?, s: f => {pos, look, fov, roll}}`.
   - `KICKS`: impact flip-shakes.
   - `DOF`/`dofAt`: lens blur per beat.
   - `FOREGROUND`: near framing props.
   - Every visual reaction lands 0-3 frames before its word.
5. **World.**
   - `lights.ts`: LIGHTS plus the LOOK sky/river/cloud palette per light.
   - `shade.ts`: two-tone shading and `untone()`.
   - `build.ts`: town, houses and Kenney CC0 kit props, recoloured, with sight-line culling of anything blocking a camera.
   - `paint.ts`: HD Canvas2D painted textures with seams painted in as dark tints.
   - `world.ts`: sky shader, fog = horizon colour, river, per-frame posing, sun frozen per shot and camera-relative.
6. **Characters.**
   - `toon.ts`: the Canvas2D `Pen` drawing API, 600x1000 design canvas, soles at y = 975, bean heads, stick limbs, plum variable-width outline, face library.
   - `cast.ts`: camera-facing billboards, crowds, effect cards, blinks, walk cycles. All billboards go on the `NOINK` layer.
   - `cardshade.ts`: cards lit by the scene light, no emissive.
7. **Post** (`Bridge.tsx` + `ink.ts` + `lensblur.ts` + `grade.ts`).
   - Composer order: ink → lens pre → lens main → bloom → NEUTRAL tone map → grade (MSAA 4).
   - Every pixel parameter scales with output height / 1920.
8. **Sound** (`~/bridge-short/audio/`: timeline.py, sfx_gen.py, sfx.py, music.py, instruments.py, dsp.py, mix.py).
   - Event table → synthesized SFX plus an original score ducked under the voice.
   - Output: mix.wav (48 kHz, exact length), stems and cues.md.
   - Lock the picture's time constants before the sound is made. Any later timing change means re-running the sound.
9. **Look checks.** Run `node scripts/bridge-stills.mjs out/<name>/x_ 100,400 0.5`.
   - Set `BRIDGE_ENTRY=src/sandboxes/<n>/index.tsx` to render a sandbox copy.
   - Make side-by-sides against reference frames with `python scripts/sbs_sheet.py out.jpg --ours ... --ref ...`.
   - Send them to an Opus max verifier: 1-3 images, a ≤200-word verdict.
10. **Final render** (captions included, as the last layer of the composition):
    - `source env.sh && node scripts/render.mjs <Comp> out/<name>/<slug>.mp4 --res <1080|1440|2160> --audio projects/<name>/audio/mix.wav`
    - Run it in the background. It writes `out/<name>/render_progress.json` (frames, fps, ETA clock time) every 2 s.
    - Read that file to answer "how long?" and give the ETA up front. It muxes the audio (`-map 0:v:0 -map 1:a:0`) itself.
    - Captions on an already rendered video: copy it to `public/_render/` and render a `CaptionedVideo` composition. This takes minutes, not a 3D re-render.
    - QA: `python scripts/short_qa.py final.mp4 out/<name>/qa shots.json` checks every frame for black, white, frozen and pop frames, plus loudness and sheets.
    - Fix anything it finds, then run a deep Opus audit.
11. **Deliver.** SendUserFile the final mp4 and write `out/<name>/NOTES.md`.
12. **Publish kit** (`out/<name>/PUBLISH.md`):
    - 3 title options (under 60 characters, hook-first, no clickbait the video doesn't pay off).
    - A description with a **fact-check table**: each claim, its verdict and a source link. Flag anything wrong or disputed; never hide it.
    - Hashtags (3-5) and tags (10-15).
    - Thumbnails: `library/thumbnail/Thumbnail.tsx`, vertical 1080x1920 and wide 1280x720, from a strong frame (extract it with ffmpeg from the final render).
13. **Cost ledger.**
    - Read the weekly % again, then run `.venv/bin/python scripts/cost_log.py finish <name> --weekly <pct> --context <tokens> --turns <n> --models <ids> --res WxH --render-min <m> --renders-failed <k> --stills <s>`.
    - This appends `ledger/AI_COSTS.csv` and rebuilds `ledger/AI_COSTS.md`. Report the row to the user.
14. **Promote to the library.** Move every reusable, neutral asset the project created into `library/` (see its "Promoting" rules), switch the imports, run `npx tsc --noEmit`, and add a row to the catalog.
    - Do this **before cleanup**, and always include the background music: export the clean score (no ducking, no story hits, -16 LUFS) as wav + mp3 into `library/music/` with a descriptive name, and add a row to `library/music/README.md`.
15. **Cleanup.**
    - Run `bash scripts/cleanup.sh <name>` (dry run) and show the user the SAFE and OPTIONAL lists with sizes. Delete with `--safe` / `--all` only on their yes.
    - Then run `bash tidy.sh` and update memory.

## Final look values (bridge after 4 verifier rounds; all in `templates/bridge/`)
Start every new short from `templates/bridge/` (copy to `src/videos/<name>/`): the look lives in these values, the
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

## Portable workspace (SSD setup)
- **New machine:** run `bash setup.sh` once in the project root.
  - It checks node, npm, python3 and ffmpeg, runs `npm install`, and builds `.venv` from `requirements.txt` (numpy, scipy, pillow, faster-whisper).
  - Both `node_modules` and `.venv` are platform-specific and get rebuilt there. Everything else is portable as is: code, `library/`, fonts, projects and `ledger/`.
- **Before every render or tool:** `source env.sh`. It sets `REMOTION_TMP`/`TMPDIR` to `tmp/` and `HF_HOME` to `.venv/hf`, and puts `.venv/bin` on PATH.
- **Disk use:** Remotion bundles pile up to about 110 GB over several passes. `scripts/cleanup.sh <name>` lists them; delete only on the user's yes.
- **Keep it organized:** follow the folder rules in the project `CLAUDE.md`.
  - One folder per video: `src/videos/<name>/`, `projects/<name>/`, `out/<name>/`.
  - Shared assets go in `library/`, costs in `ledger/`. No loose files in the root; test stills only in `out/_tests/`.
  - Run `bash tidy.sh` at the end of each session. In this project `~/bridge-short/` means `projects/<name>/`.
