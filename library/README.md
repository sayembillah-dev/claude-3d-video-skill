# Shared library (reusable across every short)

Everything here is **neutral and parameterised**, so it fits any topic without pushing a story in one direction:
no plot, no script lines, no fixed camera. Story code stays in `src/videos/<name>/` and `projects/<name>/`.
Videos **import** from here (`../../../library/...`), so a fix made here reaches every future video. Finished videos
keep working because they import the same files. Check with `npx tsc --noEmit` after any change.

## Catalog
| Path | What it is | Used by |
|---|---|---|
| `API.md` | **One-page map of everything below. Read it instead of the source** | every video |
| `director/` | Shared runtime: `camera.ts` (makeFilm, camera keys, DOF, kicks), `stage.ts` (human / critter / card / fx helpers, card pool), `world.ts` (places, sky, sun, fog), `Short.tsx` (post chain, crossfades, flash, captions). A video only writes data + staging | animal-court |
| `engine/` | The cartoon-3D look (from the bridge short, 4 verifier rounds): `toon.ts` (Pen drawing API, bean-head humans, 14 faces, fx cards), `paint.ts` (HD painted textures), `shade.ts` (two-tone shading), `lights.ts` (day / golden / storm / dusk presets, blends), `cardshade.ts` (lit character cards), `ink.ts` (outline pass), `lensblur.ts` (DOF), `grade.ts` (colour grade), `build.ts` (Batch, boxes, houses, cartoon trees `addVeg`) | animal-court |
| `cast/critters.ts` | Animals in the toon style: `monkey` (crested macaque; arms down / camera / reach / shrug / up; sit; walk), `hen` (5 colours), `rat`, `cat` (3 colours). Props: `camera`, `tripod`, `paperStack`, `dock`, `chair` | animal-court |
| `cast/outfits.ts` | Human roles: photographer, modern lawyer, 3 robed judges, old-European judge and advocate, office worker (`OFFICE`), museum guide (`GUIDE`), lab scientist (`SCIENTIST`) | animal-court, dna-drive-v2 |
| `sets/sets.ts` | Sets in local coordinates (place them with `group.position`): `courtroom` (bench, seal, flags, witness box, tables, gallery, optional crates), `jungle` (clearing, tree ring, optional rock), `courthouse` (columns, 10 steps via `courthouseStepY`, plaza), `townSquare` (cobbled square, 10 gabled houses, judge platform, wall), `lab` (tiled science lab, benches, long window), `microWorld` (pink inside-the-body stage with pastel cell blobs), `homeOffice` (room, desk, window, bookshelf), `cityStreet` (pavement, road, shopfront blocks, lamps, trees), `museumHall` (marble hall, columns, paintings, plinths + rope stanchions), `coldVault` (icy room, freezer racks of tubes, steel table) | animal-court, dna-drive, dna-drive-v2 |
| `sets/dress.ts` | Set dressing for any place: `scatter` (pebbles, rocks, tufts, flowers with avoid zones), `backdrop` (far ring of hills / mesas / peaks) | reference study |
| `cast/science.ts` | Science / tech prop cards: `dna`, `cell`, `usb`, `hardDrive`, `driveTower`, `tube`, `paperclip`, `clapper`, `monitor`, `pyramid`, `coins`, `clock`, `phone`, `priceTag`, `photo`, `fridge`, `sandwich`, `sparkle`, `redX` | dna-drive |
| `captions/Captions.tsx` | Production captions from `words.json`: Montserrat ExtraBold, 1-3 word groups, word-by-word highlight pop, accent-coloured keywords 1.4x bigger. Small and low by default (6.2 % of the width, centre at 79 % of the height) so they never block the picture. Resolution independent | animal-court |
| `captions/CaptionedVideo.tsx` | Burns captions onto an already rendered mp4, with no 3D re-render | animal-court |
| `thumbnail/Thumbnail.tsx` | Thumbnail card (vertical 1080x1920 or wide 1280x720): full-bleed frame, vignette, 1-3 heavy title lines with accent words | animal-court |
| `audio/dsp.py`, `instruments.py`, `sfx_gen.py` | Sound kit: filters, loudness (BS.1770), reverb, limiter helpers; brass / glock / vibes / pluck / fife / snare / pad; footsteps, creaks, whooshes, splashes, crowds, birds, breeze, hammer | bridge, animal-court |
| `audio/universal_subscribe_follow_CTA.mp3` | A 2.8 s spoken subscribe / follow call-to-action clip, reusable at the end of any short (user-supplied voice, not generated here) | any video |
| `audio/sfx_more.py` | Pop, camera shutter, flash whine, monkey hoot, hen cluck / bawk, rat squeak, cat meow, paper thump, church bell, sad trombone, room tone | animal-court |
| `music/` | Original background music (clean scores, -16 LUFS, wav + mp3) with a catalog: mood, key, BPM, sections. First track: `courtroom-caper_pizzicato_F-major_104bpm_69s` | animal-court |
| `../public/fonts/Montserrat-Variable.ttf` | Caption and thumbnail font (SIL OFL, licence beside it). It lives in `public/` because Remotion serves fonts from there | captions, thumbnail |

Project tools live in `scripts/` (not here): `render.mjs` (resolution + progress/ETA + audio mux), `bridge-stills.mjs`
(look-check stills, `COMP=<id>`), `align_words.py` (voice to `words.json`), `short_qa.py` (frame QA), `cost_log.py`
(AI cost ledger), `cleanup.sh` (free disk).

## Using it in a new video
1. Copy `src/videos/_template/{story.ts,cast.ts,index.tsx}` as the skeleton and rename it. Those are the only
   story files; everything else is imported from `library/` (see `API.md`).
2. Build the world from `sets/` (or add a new set builder there if the place is generic: a kitchen, a lab, a beach).
3. Staging in `cast.ts` uses `cast/critters.ts` and `cast/outfits.ts`, plus `bodyFront` townsfolk from `engine/toon.ts`.
4. `index.tsx`: `makeShort(PRODUCTION, { words, keywords })` adds the post chain and captions.

## Promoting new assets (Claude does this at the end of every project)
After delivery, Claude moves anything **reusable and neutral** that the project created into `library/`. That covers
a new animal, a costume, a set, a prop, a sound or an effect. The project's code is switched to import it, `tsc` must
pass, and the catalog above gets a row. Story-specific things stay in the project:
- a prop that only makes sense in one story (like the monkey-selfie easel);
- camera keys, timings and lines of dialogue.

Rule of thumb: **if a different topic could use it unchanged, it goes in the library.**
