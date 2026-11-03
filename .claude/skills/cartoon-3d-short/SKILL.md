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
- **Captions ON** (changed 2026-11-03): production captions from `library/captions/Captions.tsx`, with a word-by-word highlight and bigger keywords. No floating labels or overlay text inside the 3D scene. In-world text props are allowed (2026-11-03): a calendar page, a newspaper headline, a banner, a shop sign, a label on a jar. Keep them short, English, painted onto the object, readable for at least 1 s, and out of the caption band (around 79 % of the height). If a prop's text states a fact, it needs a source like any narrated fact.
  - **Captions must never block the visuals.** Keep them small and low: 6.2 % of the frame width, keywords 1.4x, block centre at 79 % of the height (the defaults in `Captions.tsx`).
  - Don't raise or enlarge them without the user asking. Check a few stills of each shot for overlap with faces or key action.
- English only.
- Voice: one steady tone. The user records it in ElevenLabs from our script.
- Jokes are researched real facts. Every number or date needs a source in `SCRIPT.md` before the voice is recorded.
- Every beat needs a **visual gag or payoff on screen**, not just a funny line (teleport v1, 2026-11-03: the jokes fell flat because the picture only illustrated the narration). Before building, write one gag per shot in the shot plan: a reaction (spit-take, faint, double-take), a prop gag (the mug falls and spills), a contrast (asleep in a 'critical' moment), a callback, or a crowd payoff. Get the user's OK on the shot plan with its gags before building.
- Standard mix: music +3 dB, SFX -6 dB, voice unchanged.
- Output resolution: ask at intake (see below). The default is 1440x2560.
- Opus max verifies every check.
- Save after every step.
- "Just do it" once the script is approved.

## Intake (always first, before any building)
Read `CLAUDE.md`, this file and `library/README.md`. Then use AskUserQuestion, one decision per question, with clear options:
1. **Cost baseline.** Read the weekly plan % with the usage tool, then run `.venv/bin/python scripts/cost_log.py start <name> --weekly <pct>`.
2. **Duration.** 30-45 s / 55-65 s (recommended; both reference shorts run 65 s) / 75-90 s. Word budget = seconds x 3.7.
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
7. **Reuse plan.**
   - Check `library/API.md` and `library/music/README.md` for the sets, cast, props, sounds and music that fit.
   - Run `.venv/bin/python scripts/variety.py recent` and pick set variants, a music mood, a light and a palette that the last videos didn't use.
   - Build new only what's missing.

## Pipeline
1. **Topic and facts.** Pick one surprising true story with a physical cause and effect (it should be visual), plus a simple everyday analogy that explains it.
   - Write the facts with their source at the top of `SCRIPT.md`.
2. **Script** (~3.7 words/s, 55-65 s). Beat formula from the bridge short, with the reference-study rules (2026-11-03):
   - **Hook:** the absurd fact in one line ("Seventy-four soldiers knocked down an iron bridge just by walking across it.").
     The first frame already shows a threat or an action in progress (a train bearing down, oil already pouring), never a character standing in a room.
   - **Setting:** year, place, pride.
   - **Action:** escalation over three or four beats, each a little bigger.
   - **Snap:** the moment it breaks.
   - **Deadpan double line:** "Luckily ... / Unluckily ...".
   - **Explanation:** one physics idea through an everyday analogy (the kid on a swing).
   - **Consequence:** the rule it created.
   - **Callback twist:** the ending, landed as a big physical payoff on screen (rails buckle into an explosion, a wave smashes the ship), not a talking head.
   - Never describe on screen what the viewer already sees.
   - Show the mechanism, don't just say it: rails glowing as they expand, the oil slick trailing the ship, the soup bowl standing in for the sea.
3. **Voice.** When the user's `voice.mp3` arrives, run `source env.sh && .venv/bin/python scripts/align_words.py <name>`.
   - It uses local faster-whisper, maps the heard words onto the script words, and writes `voice/voice.wav` (48 kHz) and `voice/words.json`.
   - It prints line starts in frames and lists any words to hand-fix. Everything is timed to `words.json`.
4. **Build the video from the library.** **Read `library/API.md` (one page), not the source.**
   - Copy the neutral template `src/videos/_template/{story.ts,cast.ts,index.tsx}` (+ stub `projects/_template/`) to `src/videos/<name>/`; plan places, cast and camera from the script's own visuals, and open finished videos only to see how one technique was done, then register it in `src/Root.tsx`.
   - `story.ts` is data:
     - positions, story-motion functions;
     - `SHOTS` (id, frames, light, place, sun);
     - `XFADE` links shots: 4-6 f dissolves by default, `ripple` / `double` for water, memory or time jumps; hard cuts only for punches; `flashAt` after the hook;
     - people (`director/people.ts`, `closeUp`): mix scale hard (extreme close-ups where faces fill half the frame, tiny figures in wides), put a foreground shape in some shots, let characters `leanIn` from the edges, and use `crowd`s of 3-5 instead of one figure in an empty set; carry facts on text props (`sets/props.ts`) when a calendar, headline or sign says it faster than narration;
     - effects kit (`director/fx.ts`): show emotion and physics as cartoon effects (steam, sweat, flush, smoke, glow, explode, `buildUp` time-lapses) and `speedLines` on rushes;
     - `CAMS` (`push()` keys for holds; `flyPath` / `follow` / `whip` / `crane` and hard cuts so the framing changes every 1.5-3 s; motivated moves link places):
       - **no orbits as a default move** (teleport v1, 2026-11-03: circling split the layered booth cards apart and the constant spin tired the viewer). Characters and props are flat cards, so keep the camera within about ±10° of their front. An `orbit` is allowed only around a single solid 3D object (a planet, a building) and for at most one shot per video;
       - prefer a cut to a new angle over a long move: a 3-shot sequence (wide, medium, close-up) of the same moment reads better than one sweeping arc;
     - `KICKS` on impacts, `DOF` per beat;
     - depth: every shot has at least 3 layers (foreground shape or dressing, subject, and a background or `backdrop`);
     - light arcs and density (reference study 2026-11-03): let the light change with the story (`lightTo` storm / dusk, `rays` for reveals), and dress every set (`scatter`, `backdrop`, `rain`, `birds`) so no frame shows bare ground or empty sky;
     - it ends with `FILM = makeFilm(...)`.
   - `cast.ts`: `stage(id, t, cam)` with `human` / `critter` / `card` / `burst`. Reactions land 0-3 frames before their word (`after()`).
   - `index.tsx`: the places (set builders + a `variant` the variety log hasn't used lately), `pose()` toggles, `makeShort()`.
   - A new place, animal, costume or prop that another topic could use goes straight into `library/` (sets / cast) with a `variant` option. Story-only drawings go in the video's `props.ts`.
   - Engine, look and post code lives in `library/engine` + `library/director`. Change it only with a verifier pass, and re-check that older videos are pixel-identical.
5. **Sound.** Copy `projects/_template/audio/sound_template.py` → `projects/<name>/audio/<name>_sound.py`.
   - Change the cue list (times from `words.json` and the picture constants) and `build_music()`, or reuse a track from `library/music/`.
   - Mix rule: music +3 dB, SFX −6 dB, voice unchanged, master −15 LUFS / −1.2 dBTP.
   - Lock the picture timing first. Any later timing change means re-running the sound.
6. **Look checks** (keep it cheap):
   - About one still per shot at 0.5 scale: `COMP=<id> node scripts/bridge-stills.mjs out/<name>/stills/x_ <frames> 0.5`.
   - Review them as 1-2 tiled contact sheets (ffmpeg `tile`), not one by one.
   - Fix, then re-render only the changed frames.
   - Deeper look-matching against the reference: `references/LOOK_NOTES.md` (verifier loop, measured targets, readability traps).
7. **Final render** (captions included, as the last layer of the composition):
    - `source env.sh && node scripts/render.mjs <Comp> out/<name>/<slug>.mp4 --res <1080|1440|2160> --audio projects/<name>/audio/mix.wav`
    - Run it in the background. It writes `out/<name>/render_progress.json` (frames, fps, ETA clock time) every 2 s.
    - Read that file to answer "how long?" and give the ETA up front. It muxes the audio (`-map 0:v:0 -map 1:a:0`) itself.
    - Captions on an already rendered video: copy it to `public/_render/` and render a `CaptionedVideo` composition. This takes minutes, not a 3D re-render.
    - QA: `.venv/bin/python scripts/short_qa.py final.mp4 out/<name>/qa shots.json` checks every frame for black, white, frozen and pop frames, plus loudness.
      Its first line is the **motion gate**: it must PASS (>= 65 % fresh frames, no still stretch over 3 s; the references measure 76-79 %). Fresh means the textured part of the picture changes or a cut happened in the last 1.5 s, so sky does not count against you and cuts count as motion.
      On FAIL, fix the listed stretches with a cut to a new angle, character action, a gag or a slow push, never by adding an orbit, then re-render them. A PASS does not prove the staging works: still check the punch-word stills for broken cards.
    - Open its contact sheets only where it flags something. Pops on caption group changes are expected.
8. **Deliver.** SendUserFile the final mp4 and write `out/<name>/NOTES.md`.
9. **Publish kit** (`out/<name>/PUBLISH.md`):
    - 3 title options (under 60 characters, hook-first, no clickbait the video doesn't pay off).
    - A description with a **fact-check table**: each claim, its verdict and a source link. Flag anything wrong or disputed; never hide it.
    - Hashtags (3-5) and tags (10-15).
    - Thumbnails: `library/thumbnail/Thumbnail.tsx`, vertical 1080x1920 and wide 1280x720, from a strong frame (extract it with ffmpeg from the final render).
10. **Cost ledger.**
    - Read the weekly % again, then run `.venv/bin/python scripts/cost_log.py finish <name> --weekly <pct> --context <tokens> --turns <n> --models <ids> --res WxH --render-min <m> --renders-failed <k> --stills <s>`.
    - This appends `ledger/AI_COSTS.csv` and rebuilds `ledger/AI_COSTS.md`. Report the row to the user and compare it with the previous videos.
    - Also run `.venv/bin/python scripts/variety.py log <name> --sets "set:variant,..." --cast ... --music ... --light ... --camera ... --palette ...`.
11. **Promote to the library.** Move every reusable, neutral asset the project created into `library/` (see its "Promoting" rules), switch the imports, run `npx tsc --noEmit`, and add a row to the catalog.
    - Do this **before cleanup**, and always include the background music: export the clean score (no ducking, no story hits, -16 LUFS) as wav + mp3 into `library/music/` with a descriptive name, and add a row to `library/music/README.md`.
12. **Cleanup.**
    - Run `bash scripts/cleanup.sh <name>` (dry run) and show the user the SAFE and OPTIONAL lists with sizes. Delete with `--safe` / `--all` only on their yes.
    - Then run `bash tidy.sh` and update memory.

## Look reference (read only when needed)
`references/LOOK_NOTES.md` holds the final look values, the measured look targets, the look-match verifier loop, the full gotcha list and the readability traps.
Read it only when changing the engine, building a new kind of set or prop, or when a still looks wrong.
The few that bite most often:
- Props closer than about 2 m to the lens become cut-off blobs.
- A foreground prop must be recognisable or gone.
- Rails at chest height through characters: put the lens about 2.5 m up.
- Flat holds read as freezes: every hold creeps.
- Remotion 4.0.540 needs the exact 4/3 scale (`render.mjs` handles it). Guard `InkPass.dispose?.()`.

## Token budget (cost is tracked per video in ledger/)
- **One session per video.** Start fresh; the rules live in CLAUDE.md, this file and memory.
- **Read maps, not code.** `library/API.md` and the catalogs (`library/README.md`, `library/music/README.md`). Use `grep` for one signature; never read whole engine files.
- **Write data, not machinery.** New videos are story data plus staging. The director does the rest.
- **Images cost tokens.** Use tiled contact sheets at 0.5 scale or smaller, look only where the QA numbers point, and never re-read an image you already judged.
- **No polling.** Background renders notify when done. Give the ETA once from `render_progress.json`.
- **Delegate mechanical work.** Code searches, file moves, QA runs and cleanup go to an Explore or general-purpose sub-agent with `model: "sonnet"` (or `"haiku"` for pure lookups). It returns a short summary, and the main context stays small. Research, script and visual judgement stay with the main model.
- **Turn off unrelated connectors** at the start of a session (`session_connectors_status`, then disable vidIQ / OpenSEO / ClickUp / Denowatts and other unrelated ones for the session). Their tool definitions ride along on every turn.
- **Keep messages short.** Don't paste long logs; tail them.

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
