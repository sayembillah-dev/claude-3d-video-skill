# Shorts Studio (portable)

Remotion + three.js project for cartoon 3D story shorts. The skill lives in `.claude/skills/cartoon-3d-short/` (SKILL.md); use it when asked for a cartoon short. **Start every new video with the skill's Intake section**:
1. cost baseline;
2. duration;
3. topic, research and tailoring;
4. script;
5. VOICEOVER.txt handoff (character count + `projects/<name>/voice/voice.mp3`), then wait for the mp3;
6. resolution choice.

- First run on any machine: `bash setup.sh` (needs node, npm, python3, ffmpeg). It builds `node_modules` and `.venv` (Python tools from `requirements.txt`).
- Before any render or tool: `source env.sh`. It puts REMOTION_TMP/TMPDIR in `tmp/`, HF_HOME in `.venv/hf`, and `.venv/bin` on PATH. Bundles are ~1.3 GB each and are never auto-deleted.
- Final renders: `node scripts/render.mjs <Comp> out/<name>/<slug>.mp4 --res <1080|1440|2160> --audio projects/<name>/audio/mix.wav`, run in the background. Read `out/<name>/render_progress.json` for progress and ETA; don't poll the process.
- Python: always `.venv/bin/python` (system python has no numpy).
- Token budget: one session per video.
  - Read `library/API.md` instead of library source.
  - Videos are data (`story.ts`) plus staging (`cast.ts`); the shared runtime is `library/director/`.
  - Use few, tiled images, no polling, and cheaper sub-agents for mechanical work.
  - Turn off unrelated connectors for the session. Details: the skill's "Token budget" section.
- Variety: before planning a video, run `.venv/bin/python scripts/variety.py recent` and avoid repeating its sets, variants, music or palette.
- User rules:
  - Captions ON (library/captions, Montserrat): since 2026-11-03 the default is the plain speed style: small (5 % of the width), white with a black outline, 2-3 whole words at a time, no per-word highlight, only keywords coloured (`plain: true`, `keyColors`). Low (centre at 79 % of the height) so they never block the visuals. No floating labels or overlay text in the 3D scene; in-world text props are allowed (since 2026-11-03: calendars, newspaper headlines, banners, signs, labels on objects), short, English, drawn as part of the object and kept clear of the caption band.
  - English only.
  - Resolution is asked at intake (default 1440x2560).
  - Every fact has a source. Disputed facts get flagged to the user.
- After delivery, always:
  - publish kit `out/<name>/PUBLISH.md` (titles, description with fact checks, tags, thumbnails);
  - cost row via `scripts/cost_log.py` into `ledger/`;
  - promote reusable assets to `library/`;
  - cleanup offer via `scripts/cleanup.sh <name>` (delete only on the user's yes);
  - `bash tidy.sh`.

## Keep it organized (strict)
- Never create loose files in the project root.
  - Allowed root items: `src/ library/ scripts/ audio/ public/ projects/ out/ ledger/ tmp/ training_data/ .claude/ .git/` and the platform-specific `node_modules/ .venv/`. `training_data/` holds private reference videos and is git-ignored.
  - Allowed config files: `package.json`, `package-lock.json`, `tsconfig.json`, `requirements.txt`, `env.sh`, `setup.sh`, `tidy.sh`, `CLAUDE.md`, `.gitignore`.
- Git commits and PRs: **no Claude co-author or contributor lines** (no `Co-Authored-By: Claude`, no "Generated with Claude Code"). The user is the only author.
- Git versions only what production and reuse need (see `.gitignore`): renders, wav mixes and stems, installs, scratch and the private reference frames stay out. After adding a new kind of file, check it lands on the right side of `.gitignore`.
- `library/` holds shared, neutral, reusable assets: engine, cast, sets, captions, thumbnail, audio kit. Videos import from it; never copy it into a video folder. Catalog and promotion rules: `library/README.md`.
- `public/fonts/` holds the bundled fonts (OFL). `public/_render/` holds temporary render inputs; clean them after use.
- `ledger/` holds the AI cost ledger: `AI_COSTS.csv` / `AI_COSTS.md` and `prices.json`. Never delete it.
- One folder per video, same `<name>` everywhere:
  - code: `src/videos/<name>/`;
  - script, voice, captions and sound: `projects/<name>/` (`SCRIPT.md`, `VOICEOVER.txt`, `captions.json`, `voice/`, `audio/`);
  - renders, QA and publish kit: `out/<name>/`.
- Throwaway test stills go in `out/_tests/` only. Delete them when done.
- Scratch and temp files go in `tmp/`, never next to the source. `tmp/` is safe to empty when nothing renders.
- Sandboxes and backups follow the skill's names (`src/sandboxes/`, `backup/`) and are deleted after a video is finished.
- Do not install or copy anything outside this folder. Run `bash tidy.sh` after each session (exFAT adds `._` junk files).
