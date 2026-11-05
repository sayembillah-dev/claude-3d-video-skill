---
name: cartoon-3d-short
description: Make a ~55-70 s vertical cartoon story short in the "2D characters in a colourful 3D world" style (flat bean-head cartoon cards with ink outlines, painted 3D town/world with black ink lines, saturated sky, depth-of-field backgrounds, gliding cameras, voice narration, synthesized SFX, no background music by default), rendered with three.js inside Remotion. Proven on "The Bridge That Fell for a Song" (2026-10-31). Use when the user asks for another video "like the bridge video", "like the soldiers/bridge short", "in that cartoon 3D style", a history/science story short with cartoon characters in 3D, or says "use the cartoon short skill". Starts with an intake (duration, topic research, script, ElevenLabs voice handoff, resolution), ships with production captions, a publish kit (titles, fact-checked description, tags, thumbnails), an AI cost ledger row and a reusable shared library.
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
- **Captions ON** (changed 2026-11-03): production captions from `library/captions/Captions.tsx`, with a word-by-word highlight and bigger keywords. No floating labels or overlay text inside the 3D scene. In-world text props are allowed (2026-11-03): a calendar page, a newspaper headline, a banner, a shop sign, a label on a jar. Keep them short, English, painted onto the object, readable for at least 1 s, and out of the caption band (around 70 % of the height). If a prop's text states a fact, it needs a source like any narrated fact.
  - **Captions must sit in the YouTube Shorts safe zone and never block the visuals** (2026-11-03: at 79 % the YouTube title overlay covered them). Defaults in `Captions.tsx`: 6.2 % of the frame width, keywords 1.4x, block centre at 70 % of the height (about 530 px above the bottom of a 1920 frame), right margin 16 % (clear of the like / comment / share buttons). Third-party safe-zone guides put the covered bottom band at 180-300 px and up to ~450 px with a two-line title, so 70 % keeps a margin.
  - Don't move them lower, enlarge them or widen them without the user asking. Keep faces and key action out of the 64-76 % band. Check a few stills of each shot for overlap with faces or key action.
- English only.
- Voice: one steady tone. The user records it in ElevenLabs from our script.
- Jokes are researched real facts. Every number or date needs a source in `SCRIPT.md` before the voice is recorded.
- Every beat needs a **visual gag or payoff on screen**, not just a funny line (teleport v1, 2026-11-03: the jokes fell flat because the picture only illustrated the narration). Before building, write one gag per shot in the shot plan (`SHOTPLAN.md`, step 4): a reaction (spit-take, faint, double-take), a prop gag (the mug falls and spills), a contrast (asleep in a 'critical' moment), a callback, or a crowd payoff. Get the user's OK on the shot plan with its gags before building.
- **Sound: SFX only, no background music** by default (2026-11-03: BGM distracted viewers from the voice). Standard mix: SFX -6 dB, voice unchanged. Add a quiet bed (`MUSIC_DB`, -12 dB or lower) only when the user asks.
- **Pacing: calm enough to follow** (2026-11-03: the teleport short, a cut every 2.3 s, was too rapid and viewers lost track of what to look at). One idea per shot, held 3-5 s; one clear focal subject per frame; cut on sentence boundaries, never mid-sentence; no more than one whip or flash per 15 s.
- **Direction: every line is acted out** (2026-11-05, sleep-experiment v1 was "basic, boring, minimal movement, no fear"). These apply to any topic; pick the tone tools per topic.
  - Each sentence gets a visual that does what it says: talking means a mouth moving at the mic (`mouth` + a `talk()` cycle); whispering means a close-up at the grille; accusing means two people pointing (`arms: "point"`); screaming means hands on the head and a staggering walk; tearing means a book ripping in the hands. Abstract lines get a metaphor insert (a torn voice becomes a rope snapping). Split a sentence into shots when it holds two actions. Never a figure just standing over narration.
  - Faces match the moment (fear, terror, weary, grim, plead, whisper, hope). Nobody smiles unless the line says so.
  - Shaking is meaningful: tremble only in a beat of fear (it decays over about 1.5 s); twitches are rare. Characters keep a slow sway and looking eyes, never constant shaking.
  - Frame 1 of the hook is the most intriguing image, already in motion.
  - Dress the world with in-world text and artifacts wherever they help: room signs, warning tags, stencils, logs, labels, number patches.
  - Sound feels real: reverb per room on the foley, a sound for every action (steps, cloth, paper, breathing), room tone, hits and silences on the beats. SFX may sit about 4 dB above the house -6 when the design is dense.
  - Look, light and camera match the mood. For horror: `dread`/`night` lights, `HorrorFX` (grain, flicker, vignette, flash frames) and `handheld` shake from `library/director/horror.tsx`, snap-ins, hard cuts. Lighter tools for comedy or science.
  - Thumbnail text is the video's title unless the user says otherwise.
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
   - Run `.venv/bin/python scripts/variety.py recent` and pick set variants, a light and a palette that the last videos didn't use (music only if the user asked for a bed).
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
4. **Visual flow plan (before any code).** Once `words.json` exists, write `projects/<name>/SHOTPLAN.md` and get the user's OK before building. Plan the picture the way an editor would: what the viewer must look at during each sentence, then the camera that shows it best.
   - One row per shot: frames and the narration it covers, **focus** (the one thing the viewer must look at), **action** (the gesture or event that shows the line), **faces**, **shot size**, **camera move + why**, **visual aid** (if any), **gag / payoff**, **sound** (foley and room), hold time.
   - **Pacing:** one idea per shot, 3-5 s each (55-65 s ≈ 14-18 shots), cuts on sentence boundaries. A new subject gets a cut; the same subject gets a slow push or character action, not a new angle.
   - **Choose the camera from what the shot has to do** (not for variety):
     | The shot has to... | Use |
     |---|---|
     | establish a new place or time | wide, slow `push()` or `crane` reveal, 3-4 s |
     | explain how something works | static medium or close hold on the mechanism with a slight push; the action moves, not the camera |
     | show scale, a number or a comparison | wide or `crane` up so the whole stack or row fits, held until the number lands |
     | follow travel or a chase | `follow` / `flyPath` alongside the subject, keeping it in the same screen spot |
     | land a punchline, impact or surprise | hard cut to a close-up, or one `whip`, plus a `KICK` |
     | show emotion or a reaction | close-up, slow push in, hold 1.5-2 s past the line |
     | compare two things | two-shot with both in frame, or a cut between matching framings |
   - Keep the focus near the frame centre (35-60 % of the height), above the caption band. Hand the eye from shot to shot: the next focus appears near where the last one was.
   - **Visual aids: show numbers, sizes and comparisons, don't just say them.** Scan the script for every quantity, scale, comparison, process or abstract claim and stage it physically:
     - "weighs as much as 100 elephants" → elephants stacking into a tower next to the object, a counter prop ticking up;
     - "the length of three football fields" → the fields laid end to end with the object over them;
     - "1 in a million" → one coloured figure in a huge crowd, camera pulling back;
     - a process ("the signal is copied, then rebuilt") → the steps happening in order on screen.
     Reuse `crowd`, `scatter`, `buildUp` and the props catalog; build a new counting or stacking prop only when needed and promote it to `library/`. Every number shown must match the sourced script.
5. **Build the video from the library**, following the approved `SHOTPLAN.md`. **Read `library/API.md` (one page), not the source.**
   - Copy the neutral template `src/videos/_template/{story.ts,cast.ts,index.tsx}` (+ stub `projects/_template/`) to `src/videos/<name>/`; plan places, cast and camera from the script's own visuals, and open finished videos only to see how one technique was done, then register it in `src/Root.tsx`.
   - `story.ts` is data:
     - positions, story-motion functions;
     - `SHOTS` (id, frames, light, place, sun);
     - `XFADE` links shots: 4-6 f dissolves by default, `ripple` / `double` for water, memory or time jumps; hard cuts only for punches; `flashAt` after the hook;
     - people (`director/people.ts`, `closeUp`): mix scale hard (extreme close-ups where faces fill half the frame, tiny figures in wides), put a foreground shape in some shots, let characters `leanIn` from the edges, and use `crowd`s of 3-5 instead of one figure in an empty set; carry facts on text props (`sets/props.ts`) when a calendar, headline or sign says it faster than narration;
     - effects kit (`director/fx.ts`): show emotion and physics as cartoon effects (steam, sweat, flush, smoke, glow, explode, `buildUp` time-lapses) and `speedLines` on rushes;
     - `CAMS` (`push()` keys for holds; `flyPath` / `follow` / `whip` / `crane` and hard cuts as chosen in `SHOTPLAN.md`; one idea per shot held 3-5 s, motivated moves link places):
       - **no orbits as a default move** (teleport v1, 2026-11-03: circling split the layered booth cards apart and the constant spin tired the viewer). Characters and props are flat cards, so keep the camera within about ±10° of their front. An `orbit` is allowed only around a single solid 3D object (a planet, a building) and for at most one shot per video;
       - prefer a slow push or character action over a new angle while the subject stays the same; cut only when the subject or idea changes;
     - `KICKS` on impacts, `DOF` per beat;
     - depth: every shot has at least 3 layers (foreground shape or dressing, subject, and a background or `backdrop`);
     - light arcs and density (reference study 2026-11-03): let the light change with the story (`lightTo` storm / dusk, `rays` for reveals), and dress every set (`scatter`, `backdrop`, `rain`, `birds`) so no frame shows bare ground or empty sky;
     - it ends with `FILM = makeFilm(...)`.
   - `cast.ts`: `stage(id, t, cam)` with `human` / `critter` / `card` / `burst`. Reactions land 0-3 frames before their word (`after()`).
   - `index.tsx`: the places (set builders + a `variant` the variety log hasn't used lately), `pose()` toggles, `makeShort()`.
   - A new place, animal, costume or prop that another topic could use goes straight into `library/` (sets / cast) with a `variant` option. Story-only drawings go in the video's `props.ts`.
   - Engine, look and post code lives in `library/engine` + `library/director`. Change it only with a verifier pass, and re-check that older videos are pixel-identical.
6. **Sound.** Copy `projects/_template/audio/sound_template.py` → `projects/<name>/audio/<name>_sound.py`.
   - Change the cue list (times from `words.json` and the picture constants). Leave `MUSIC_DB = None`: **no background music** unless the user asked for a bed.
   - Without music, the SFX carry the energy: a cue on every action, light room tone or ambience per place (birds, lab hum, wind), and a few silences for punchlines.
   - Mix rule: SFX −6 dB, voice unchanged, master −15 LUFS / −1.2 dBTP; a requested bed at `MUSIC_DB` -12 or lower.
   - Lock the picture timing first. Any later timing change means re-running the sound.
7. **Look checks** (keep it cheap):
   - About one still per shot at 0.5 scale: `COMP=<id> node scripts/bridge-stills.mjs out/<name>/stills/x_ <frames> 0.5`.
   - Review them as 1-2 tiled contact sheets (ffmpeg `tile`), not one by one.
   - Fix, then re-render only the changed frames.
   - Deeper look-matching against the reference: `references/LOOK_NOTES.md` (verifier loop, measured targets, readability traps).
8. **Final render** (captions included, as the last layer of the composition):
    - `source env.sh && node scripts/render.mjs <Comp> out/<name>/<slug>.mp4 --res <1080|1440|2160> --audio projects/<name>/audio/mix.wav`
    - Run it in the background. It writes `out/<name>/render_progress.json` (frames, fps, ETA clock time) every 2 s.
    - Read that file to answer "how long?" and give the ETA up front. It muxes the audio (`-map 0:v:0 -map 1:a:0`) itself.
    - Captions on an already rendered video: copy it to `public/_render/` and render a `CaptionedVideo` composition. This takes minutes, not a 3D re-render.
    - QA: `.venv/bin/python scripts/short_qa.py final.mp4 out/<name>/qa shots.json` checks every frame for black, white, frozen and pop frames, plus loudness.
      Its first line is the **motion gate**: it must PASS (>= 65 % fresh frames, no still stretch over 4 s; the references measure 76-79 %). Fresh means the textured part of the picture changes or a cut happened in the last 1.5 s, so sky does not count against you and cuts count as motion.
      On FAIL, fix the listed stretches with a cut to a new angle, character action, a gag or a slow push, never by adding an orbit, then re-render them. A PASS does not prove the staging works: still check the punch-word stills for broken cards.
      The second line is **PACING**: on `WARN too rapid` (under 3 s between cuts on average), merge shots that show the same idea before delivery.
    - Open its contact sheets only where it flags something. Pops on caption group changes are expected.
9. **Deliver.** SendUserFile the final mp4 and write `out/<name>/NOTES.md`.
10. **Publish kit** (`out/<name>/PUBLISH.md`):
    - 3 title options (under 60 characters, hook-first, no clickbait the video doesn't pay off).
    - A description with a **fact-check table**: each claim, its verdict and a source link. Flag anything wrong or disputed; never hide it.
    - Hashtags (3-5) and tags (10-15).
    - Thumbnails: `library/thumbnail/Thumbnail.tsx`, vertical 1080x1920 and wide 1280x720, from a strong frame (extract it with ffmpeg from the final render).
11. **Cost ledger.**
    - Read the weekly % again, then run `.venv/bin/python scripts/cost_log.py finish <name> --weekly <pct> --context <tokens> --turns <n> --models <ids> --res WxH --render-min <m> --renders-failed <k> --stills <s>`.
    - This appends `ledger/AI_COSTS.csv` and rebuilds `ledger/AI_COSTS.md`. Report the row to the user and compare it with the previous videos.
    - Also run `.venv/bin/python scripts/variety.py log <name> --sets "set:variant,..." --cast ... --music ... --light ... --camera ... --palette ...`.
12. **Promote to the library.** Move every reusable, neutral asset the project created into `library/` (see its "Promoting" rules), switch the imports, run `npx tsc --noEmit`, and add a row to the catalog.
    - Do this **before cleanup**, and include any background music used (only when the user asked for a bed): export the clean score (no ducking, no story hits, -16 LUFS) as wav + mp3 into `library/music/` with a descriptive name, and add a row to `library/music/README.md`.
13. **Cleanup.**
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
