# teleport: production notes

"What If Humans Could Teleport?": 88 s (voice 84 s plus a 3.6 s payoff tail), 1080x1920, composition `Teleport`.
- Code: `src/videos/teleport/`.
- Script and sources: `projects/teleport/SCRIPT.md`.
- Sound: `projects/teleport/audio/teleport_sound.py`.

## Intake decisions
| Decision | Choice |
|---|---|
| Duration | 55-65 s chosen. The recording came in at 84 s and the user chose to keep that length rather than speed it up or re-record |
| Angle | "cost then chaos" |
| Resolution | 1080x1920 |
| Music | the user asked for "funny and energetic", so this is a new score: "Zip-Zap Polka" (Bb major, 138 BPM oompah with brass stabs, glock and fife hook, and a minor-key pluck stretch for the Parfit beat) |

## Places (variety)
| Place | Set | Light |
|---|---|---|
| Flat | `homeOffice` v1 | day → dusk |
| Lab | `lab` v1 | day |
| Mountain | `jungle` v1, plus `backdrop` peaks and `scatter`; staged facing +z | dusk → storm |
| Tokyo | `cityStreet` v1 | dusk |
| Square | `townSquare` v3, plus hills and `scatter` | day |

## Tuning log for the new tools (first real use)
- **Setup.**
  - `.venv` was broken by exFAT `._*.pth` junk files in site-packages. Python died in `site.py` with a UnicodeDecodeError (byte 0xb0).
  - The fix was `find .venv -name '._*' -delete`, then `pip install -r requirements.txt` (`setup.sh` had left numpy uninstalled because of the same crash).
  - Suggestion: `setup.sh` and `env.sh` should delete `.venv/**/._*` before using the venv.
- **Motion gate vs. vertical framing.**
  - A frame counts as "moving" when more than 10 % of its pixels change by more than 12 grey levels, measured at 180x320.
  - A `pushK` creep never passes that, so every shot here rides a linear `drift` or a linear-ease `orbit` for its whole length. Those are local helpers in `story.ts`; they're candidates for `library/director/camera.ts`.
  - `orbit` with the default `glide` ease stops dead at `dur`, so pass `ease: u => u` to keep it moving until the next key.
- **The 9:16 frame is narrow.** At fov 46 vertical, the horizontal view is about 27°, which is only ±0.8 m at 3.4 m. Two props 8 m apart (the lab islands) can never share a frame, so stage pairs within about 1.5 m, or `follow` the object between them.
- **`jungle` set.** The tree ring blocks every view toward −z. Only the +z side (open within x ±9) shows the sky and `backdrop` peaks, so outdoor "open land" scenes need to look toward +z. A plain open-ground set (`field` / `plateau`) would help.
- **`textCard` vs `textBoard`.** Use `textCard` for any fact prop that may only appear in one shot (the 1984 calendar), because a `textBoard` shows in every shot of that place.
- **`swarm`-style atoms** need their size to scale with distance. A fixed 0.11 card scale vanishes beyond about 6 m.
- **`leanIn` at d 1.9** fills a third of the frame; d 2.6 and scale 0.8 read better beside a desk prop.
- **`explode` w 9 plus 30 small explodes** read well. The bomb field uses only `card` + `explode`, with no new engine code.

## QA (v2, after the user's review)
The user's review of v1 said "nothing feels right". Their complaints:
- the 3D models break while the camera spins (the teleport booth especially);
- the camera spins too much;
- the jokes fall flat.

v2 keeps the 84 s voice and restages every shot. The camera only pushes, slides, cranes and cuts (no orbits), and the framing changes every 2-3 s on the word it shows. New gags:
- the coffee mug that drops on "wiped out" and is still on the floor on "the original just stops";
- an empty-hand sip in Tokyo;
- the receiving scientist celebrating over one photon;
- Dave falling asleep next to a 0.0001 % upload bar;
- the empty plane;
- Dave walking through the BORDER door;
- every Dave waving at the end.

| Check | Result |
|---|---|
| Motion gate | **FAIL by the metric: 44 % moving frames**, no still stretch over 3 s. Accepted on purpose (see below) |
| Loudness | -15.2 LUFS, LRA 2.3 LU, peak -1.1 dBFS |
| Black / frozen / silence | none |
| White frame | f1265 is the planned "megatons" flash |
| Pops | all on planned hard cuts and whips |

### Tuning notes (important)
- **The motion gate rewards rotation, and rotation breaks billboard composites.**
  - v1 reached 65 % with orbits at about 1.5 deg/frame. On a short-radius orbit, camera-facing cards stay in place while each one turns, so the booth's front glass slid off its back card and characters were cropped. The user saw broken models and too much spinning.
  - Fix for the gate: count hard cuts, give sky-heavy frames credit, or lower the bar for cut-driven edits. Don't push orbits.
- **Rule for card props built from several cards** (booth = back + Dave + front): keep the camera within about ±10° of the prop's front. Get motion from pushes, slides, cranes and cuts.
- **Lab:** the islands hide anyone standing behind them (only heads show). Stand characters *beside* the island.
- **`homeOffice`:** a `textCard` calendar at z -5.85 z-fights with the window frame. Use z -5.65.
- **Shots must show the spoken word.** Neither the motion gate nor the loudness check catches a miss. Render one still per punch word, tile them, and fix misses before the full render. That step caught 10 misses in v1.
- **New props in the engine:** `toon.ts` gained `mug`, `sip` (mug at the mouth) and `hand` (empty sip).
- **Remotion CLI:** `npx remotion still` crashed in the bundler (unhandled ErrorEvent). `scripts/bridge-stills.mjs` with `COMP=<Thumb>` at scale 1 works for thumbnails.
- **`short_qa.py`** needs `<mp4> <qa-dir>`.
