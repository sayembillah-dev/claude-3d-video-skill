# What If Animals Could Sue Humans: production notes (2026-11-03)

**Final file:** `out/animal-court/what-if-animals-could-sue.mp4`
- 1440x2560, 30 fps, 2,082 frames, 69.4 s.
- h264 CRF 16, AAC 320k, about 92 MB.
- Mix at −15.2 LUFS, peak −1.0 dBFS.
- No captions.

**QA** (`scripts/short_qa.py`, report in `qa/report.md`):
- No black, unplanned white, frozen (≥12 f) or pop frames.
- One pop at f1592 (the hen crowd appeared 3 frames before its cut) was fixed in `cast.ts`. Frames 1592-1594 were re-rendered and spliced in.

## Where things are
- **Code:** `src/videos/animal-court/`, composition `AnimalCourt` in `src/Root.tsx`.
  - New: `critters.ts` (monkey, hen, rat, cat and painted props).
  - Rewritten: `story.ts`, `cast.ts`, `world.ts`.
  - Look and post files are unchanged from the bridge template.
- **Script, voice and sound:** `projects/animal-court/`.
  - `SCRIPT.md` has the facts and sources.
  - `VOICEOVER.txt` is the script as sent to ElevenLabs.
  - `voice/voice.mp3` is the user's ElevenLabs file. `voice/words.json` holds faster-whisper tiny.en word times, which match the script 1:1.
  - `audio/court_sound.py` writes `mix.wav`, the stems and `cues.md`.
- **Test stills:** `out/animal-court/stills/`.

## Gotchas found this time
- `--scale 1.3333` fails on Remotion 4.0.540 (height 2559.94 is not an integer). Use `--scale 1.3333333333333333`.
- `fx.ink.dispose()` in the template's `Bridge.tsx` crashes the full render when a crossfade layer unmounts. It's guarded in `Court.tsx`. The bridge template has the same bug.
- `scripts/bridge-stills.mjs` now works on macOS: the Chrome path is only used on Windows, and the composition comes from the `COMP` env var.
- Speed on this Mac: about 1.6 fps at 2K, 22 min for 69 s. Stills at 0.5 scale take about 1.5 s each.
- Python tools (numpy, scipy, faster-whisper, pillow) live in `tmp/venv`, and the whisper model is in `tmp/hf`.

## Token and usage tracking (whole workflow, this session)
| measure | value |
|---|---|
| Context window used at the end | 337,163 tokens of 1,000,000 (34 %) |
| messages | 260,521 |
| system tools | 29,447 |
| MCP tools | 23,652 |
| system prompt | 10,978 |
| skills | 9,935 |
| MCP server instructions | 2,065 |
| Plan (Ultra), weekly all-models limit | 54 % used, resets 2026-11-05 12:00 UTC |
| Weekly Fable limit | 0 % used |
| Extra (paid) usage | not enabled, $0 |

Context tokens are what the session holds at the end. The app doesn't report cumulative billed input and output tokens per session, so the weekly plan percentage is the best measure of total spend. The 54 % is account-wide, not only this video.

**Models:** Sonnet 5.5 up to the word timings, Opus 5.5 after the `/model` switch.

**Local compute:**
- 2 full 2K renders failed at startup.
- 1 full 2K render succeeded (about 22 min).
- About 50 test stills.
- The sound build took about 1 min.
