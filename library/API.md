# Library API map. Read this instead of the source.

Everything a new video needs, in one page. Open a source file only to change the library itself, and then `grep`
for the one function instead of reading the whole file. Paths are from the project root; videos import with
`../../../library/...`.

## How a video is built (the whole contract)
A video folder `src/videos/<name>/` has 3-4 files (copy the neutral `src/videos/_template/` as the skeleton; finished videos are technique references only):

| File | What you write | Size |
|---|---|---|
| `story.ts` | **Data:** positions (`V3`), story-motion functions (who walks where, when), `SHOTS`, `XFADE`, `CAMS` (keys per shot), `KICKS`, `DOF`. Ends with `export const FILM = makeFilm({...})` | ~150 lines |
| `cast.ts` | `export const stage = (id, t, cam): Stage` → per shot, which characters, props and fx are where, with expressions timed to words | ~150 lines |
| `index.tsx` | `PRODUCTION = { film, places: { key: { x?, build: (G) => setBuilder(G, opts) } }, stage, pose? }` and `export const MyShort = makeShort(PRODUCTION, { words, keywords })` | ~30 lines |
| `props.ts` (optional) | Story-only drawings (anything another topic could use goes in `library/cast/`) | small |

Register it in `src/Root.tsx`: `<Composition id="X" component={MyShort} durationInFrames={FILM.total} fps={30} width={1080} height={1920} />`.

## director/camera.ts (timeline, camera, lens)
- Types:
  - `V3 = [x, y, z]` (metres; y up; the camera usually looks toward −z).
  - `ShotDef = { id, a, b, light: "day"|"golden"|"storm"|"dusk", set: placeKey, sunAz?, sunEl?, lightTo?, rays? }`: frames `a..b`. The sun is camera-relative degrees: az 0 = backlight, 90 = screen right, 180 = behind the camera.
    - `lightTo: { light, a, b }`: blend sky, fog, ambient, sun colour, clouds and grade to another preset between frames a..b (storm rolls in, day turns to dusk). The sun direction and shadows stay the shot's.
    - `rays: { n?=5, k?=.6, at?: V3, spread?=10, len?=40 }`: god-ray shafts along the shot's sun (default anchor on the ground between camera and look point). Best with a high side sun (sunEl 30-45) in storm or golden.
- `makeFilm({ total, shots, xfade?, cams, kicks?, dof, flashAt?, speedLines? })` → `Film`.
  - `xfade[id]` = transition into shot id: frames (plain dissolve) or `{ n, kind }`. Kinds:
    - `"dissolve"` (4-6 f): the default link between shots; keep hard cuts for punches.
    - `"ripple"` (~18 f): concentric water rings over both shots (soup to sea, memory, dream).
    - `"double"` (~24 f): both shots held at half, a double exposure (a face over the place it remembers).
  - `speedLines: [{ a, b, k?=1, cx?=.5, cy?=.45 }]`: anime radial lines over frames a..b (screen overlay, 4-frame ramps). Use on whips, rushes and shocks.
  - `kicks: [timeS, strength]` = 7-frame impact shakes.
  - `flashAt` = a 4-frame white flash.
- **Camera keys** are `Key = { f, dur?, cut?, ease?, arc?, shutter?, s: (f) => Framing }`: from frame f, glide (dur, default 24 f, curve `ease`) or cut to `s(f)`. `arc` swings the view direction instead of sliding the look point (big pans). `shutter` = motion-blur exposure in frames from this key on (default `SHUTTER` .5, 0 = off).
  - `push(f, pos, look, { rate=.0025, punch?, n=35, fov=40, roll=0, cut?, dur? })`: the standard creeping dolly key. `punch` (~.006) is for punch words; every hold should creep.
  - `dolly(pos, look, k, {fov, roll})` and `zoom(pos, look, fov, k)` (zoom = the lens stays put, e.g. against a wall), with `pushK(f, f0, rate, punch?, n?)` as k.
  - `rolled(fn, roll)`, `at(p, dx, dy, dz)`, `glide`, `smooth`, `easeOut`, `clamp01`.
  - Moving-camera keys (reference study 2026-11-03; each blends in from the previous key over `blend` frames, or `cut`):
    - `flyPath(f, pts, { dur, look?: V3 | V3[], ahead?, lift?, bank?, fov, roll, ease, blend, cut, shutter })`: drone fly-through along a smooth constant-speed spline. `look` = fixed point, a second path travelled in step, or omitted = look down the path. `bank` ~.5 rolls into turns.
    - `follow(f, target(g) => V3, off, { lag=6, lookOff, fov, shutter=0 })`: trail a moving object (drip, thrown hook, walker); make the move motivated by what is moving. Sharp by default (`shutter` 0): the blur only sees camera motion, so a blurred follow ghosts the tracked card.
    - `whip(f, to, n=8, shutter=.75)`: whip pan to a framing with `whipEase` + arc; follow with a `push` for the hold and a whoosh SFX.
    - `orbit(f, center, { r, h, a0, a1, dur, lookUp })` (degrees, 0 = camera on +z), `crane(f, from, to, look, { dur })` (rise-up reveal / crane-down).
    - `closeUp(f, head, { fill=.45, dir=[0, .12, 1], fov=32, rate=0, punch, roll, cut, dur })`: frame a head (centre ≈ feet + 1.5) so it fills `fill` of the frame height (.35 close-up, .5-.6 extreme). Pair with a shallow DOF beat.
    - `spline(pts)` → `u => V3` for your own paths (e.g. a prop's flight that a `follow` tracks).
  - Grammar: the framing changes every 1.5-3 s (a move, not only cuts) and no hold sits on a creep alone for more than ~3 s; link places with motivated moves (follow the object, whip, fly-through) or 4-6 f crossfades; hard cuts are for punches. Glides 18-60 f; rolls 0.03-0.04 rad on emphasis, 0.08-0.15 rad dutch for chaos.
  - Motion blur (`engine/blur.ts`, after the DOF) is automatic from the camera keys: creeps stay sharp (2 px dead zone), whips and fly-throughs smear. No blur across a `cut` or a shot start; kick shakes stay crisp. Stills A/B: inputProps `{ post: { blur: false } }`.
- **DOF** `Dof = { f, dur?, cInf, focus? }`: cInf is the blur in px at 1080 wide.
  - Close-ups 12-16, medium shots 9-12, wide or establishing 0 (sharp).
  - `focus(f)` is a world point; the default is the camera look point.

## director/stage.ts (staging helpers for cast.ts)
- `Stage = { places: Place[], fx: FxPlace[] }`. Start `stage()` with `const out: Stage = { places: [], fx: [] }`.
- `human(cam, out, i, outfit, okey, x, y, z, frontOpts, t, shadow=true)`: a bean-head person.
  - `i` is a unique id (it seeds the blinks).
  - `frontOpts`: `{ mode: "stand"|"stroll"|"march"|"sit", expr, facing: -1|0|1, phase, wave, headTilt, prop }`.
    - `prop`: `["hammer", k]`, `"icecream"`, `"shako"`, `"mug"` (coffee at the chest), `"sip"` (mug at the mouth) or `"hand"` (sipping from an empty hand).
  - Camera rule for props built from several cards (e.g. a booth = back card + person + front card): no orbits. Keep the camera within about ±10° of the front, because circling slides the cards apart.
- `critter(cam, out, "monkey"|"hen"|"rat"|"cat", i, x, y, z, t, { expr, arms, phase, sit, v, flash, mirror, shadow, scale })`.
  - Default sizes come from `SIZE`: monkey .45, hen .25, rat .14, cat .23 (card scale; 1 = 2.16 m).
- `card(cam, out, key, x, y, z, scale, (p, light) => draw(p), { mirror, shadow })`: any 600x1000 drawing, soles at y = 975.
- Effects:
  - `burst(out, t, t0, x, y, z, w, dur=.3)`: impact star.
  - `puff(out, t, t0, x, y, z, w)`: dust puff.
  - `rain(out, t, cam, { n=220, area=9, depth=16, h=10, speed=14, slant=.18, len=.9 })`: world-anchored rain streaks in front of the camera (parallax on moves). Pair with storm light.
  - `birds(out, t, cx, cy, cz, { n=5, r=6, size=.5, speed=.35 })`: ink-V flock circling a point; keep it in open sky (size ~.8 at 15-20 m).
- **Effects kit** (`director/fx.ts`; head-anchored helpers take the head centre, ≈ y + 1.5 for a standing human):
  - `steam(out, cam, t, t0, x, y, z, { dur=1.4, w=.32, col })`: puffs out of both ears (anger).
  - `sweat(out, cam, t, t0, x, y, z, { dur=1.5, side=1, n=2, w=.13 })`: drops sliding off the temple (nerves).
  - `flush(outfit, okey, k, col="#b05ad6")` → `{ o, key }`: face colour shift for `human()` (fury purple, red, sick green).
  - `glow(out, t, x, y, z, { w=1, h?, col="#ffb347", k=1, pulse=0 })`: soft heat glow (hot rail, lantern, forge).
  - `smoke(out, t, t0, x, y, z, { dur=3, w=1, col, rate=4, rise=1.2, drift=[.3, 0] })`: rising cartoon smoke column.
  - `foam(out, t, x, y, z, { w=1.2, seed, col })`: flat foam patch on water.
  - `explode(out, t, t0, x, y, z, { w=3 })`: flash star, fireball, debris and smoke; pair with a kick, `flashAt` and SFX.
  - `buildUp(pieces, k, { overlap=2, from: "scale"|"drop" })`: time-lapse assembly in `pose()`; build each piece as its own object and return them as a handle.
  - `textCard(out, kind, opts, x, y, z, w, rot=0)`: a text prop held up or thrust at the lens (camera-facing, unlit; see props below).
- **People** (`director/people.ts`; uses the full `cam` that `stage()` receives):
  - `screenAt(cam, sx, sy, d)`: world point at frame fraction (sx, sy) (0..1, y down) and depth d.
  - `foreground(cam, out, "shoulder"|"leaves"|"post", { side="left", d=1.1, cover, col, hair, sy })`: a near shape at the frame edge for depth; focus the DOF behind it.
  - `leanIn(cam, out, i, outfit, okey, t, { edge: "left"|"right"|"top", k=1, d=1.8, fo, scale })`: a character breaking into the frame, tilted; animate `k` 0 → 1 to slide in.
  - `crowd(cam, out, t, { x, z, y?, n=5, rows, spacing=.75, seed, i0=20, outfits?, expr?, fo, shadow })`: 3-6 townsfolk in jittered rows.
- Timing:
  - `after(t, wordStart)`: true from 2 f before the word.
  - `lidAt(t, i)`: blinks.
  - `strikeK(t, hitTimes)`: hammer pose, 0 = up and 1 = struck.
  - `LEAD`, `FPS = 30`.
- Utilities:
  - `hh(i, s)`: deterministic random in [0, 1).
  - `q(v, n)`: quantise; use it on every float that goes into a drawing key, so canvases get shared.
  - `FOLK[0..5]`: townsfolk outfits.
- **Expressions (`Expr`):** neutral, stern, grin, laugh, whistle, nervous, shock, relief, relief_open, dazed, pained, smile, smile_closed, lick.

## director/world.ts + Short.tsx
- `Production = { film, places: Record<key, { x?, z?, build(G) }>, stage, pose?(id, f, t, handles) }`.
  - Every place is built once and shown only during its shots.
  - `handles[key]` is whatever `build` returned (for toggles and animation in `pose`).
- `makeShort(prod, { words?, keywords?, captionStyle?, background? })` → the composition.
  - The post chain: ink → DOF → motion blur → bloom → tone map → grade, with transitions (`director/transitions.tsx`), speed lines, the flash and captions.
  - inputProps `{ captions: false }` renders a clean master.

## sets/sets.ts (every builder: local coordinates, ground y = 0, place it with `x` in the production)
Every builder takes `variant` (0 = original, 1-3 re-dress: wall / stone colours, tree layout, house styles). Check `scripts/variety.py recent` first.

**Dressing** (`sets/dress.ts`, call inside a place's `build(G)` after the set):
- `scatter(G, { x: [x0, x1], z: [z0, z1], n, kinds?: ("pebble"|"rock"|"tuft"|"flower")[], avoid?: [x, z, r][], y?: (x, z) => h, seed?, stones?, greens?, flowers? })`: ground clutter, kept off `avoid` circles (stand and walk spots). Pebbles have no ink.
- `backdrop(G, { kind?: "hills"|"mesas"|"peaks", r=130, n=16, h=22, color?, band?, gap?: [deg0, deg1], seed? })`: a far ring for depth; keep `r` inside the light's fog far (storm 170).

**Text props** (`sets/props.ts`; allowed since 2026-11-03: short, English, part of the object, readable >= 1 s, out of the caption band; a stated fact needs a source):
- `textBoard(G, kind, { text, top?, circle?, color?, ink?, x, y, z, w, yaw?, depth?, posts? })`: a fixed board in a place (shaded, inked). Kinds:
  - `calendar` (`top` = month band, `text` = big line, `circle` = day cell 1-28);
  - `newspaper` (`top` = masthead, `text` = headline);
  - `banner` (cloth with bunting; `color`);
  - `sign` (wooden plank; `posts: true` stands it on the ground);
  - `label` (small paper label for a jar or crate).
- `drawProp(g, kind, opts, W, H)` paints one on any canvas; `makeShort` waits for the prop font (Montserrat) before building places.

| Builder | Options | Layout facts (local) |
|---|---|---|
| `courtroom(G, { witness?, crates?, variant? })` → `{ tables, crates, flags }` | witness box pos, crate positions | room x ±9, z −12..9. Bench front z −8.9 (top 1.5 m), judges stand at z −10.1, y .55. Counsel tables z −3.1..−4.1 at x ±1.3..3.9 (top .8). Bar rail z −.5, gallery z 1.2-7 |
| `jungle(G, { rock?, variant? })` | rock under a character | dirt clearing x ±3.5, z −2.5..3.5. Trees ring r 9-30 (kept off z > −3 within x ±9). Bushes z −3..−5 |
| `courthouse(G, { variant? })` + `courthouseStepY(z)` | — | 10 steps from z −12 (y 0) to −17 (y 2.5), columns at z −18.4, door at z −21. Plaza z −12..40, x ±30 |
| `lab(G, { variant? })` | — | room x ±7, z −9..9, walls 4.6 m, long window on the back wall, benches at z −8.8..−7.4 and islands at x ±4.6 |
| `microWorld(G, { variant? })` | — | open pink stage, ring of pastel cell blobs from r 28; keep scenes within x ±6, z −9..8 |
| `homeOffice(G, { variant? })` | — | room x ±5, z −6..6, walls 3.2 m, window on the back wall (z −6), desk x ±1.3, z −4.2..−3.5 (top .76): stand a person behind it at z −4.65 |
| `cityStreet(G, { variant? })` | — | pavement z −9..−3, road z −3..6, shopfront blocks along z −9 (x ±60), lamps at z −3.5; walk people along z ≈ −5.2 |
| `museumHall(G, { variant?, plinths? })` | plinth positions (local) | hall x ±12, z −12..10, walls 7 m, columns x ±9.5; plinths 1.0 m tall (put exhibits at y 1.0); rope 1.6 m in front, posts between plinths. People beside a plinth (±0.8) read well in medium shots |
| `coldVault(G, { variant? })` | — | room x ±6, z −8..6, walls 3.6 m, tube racks on the back wall, freezers on the sides, steel table x ±1.4, z −3..−2 (top .92) |
| `townSquare(G, { variant? })` | — | square x ±30. Houses at z −14 and x ±13. Judge platform z −7.7..−6.1 (top .45), table z −6.5..−5.9 (top 1.27). Low wall x 2.6..4.8, z −2.4..−1.6 (top .9) |

## cast/ (drawings) and engine/toon.ts
- `critters.ts`:
  - Animals: `monkey`, `hen`, `rat`, `cat`, drawn through `critter()`.
  - Props: `camera(p, cx, cy, k, flash)`, `tripod(p, flash)`, `paperStack(p)`, `dock(p)`, `chair(p)` (use with `card()`).
  - Colours: `FUR`, `FACE`.
- `outfits.ts`: `PHOTOG`, `LAWYER`, `JUDGE[0..2]`, `MJ` (old-European judge), `MLAW` (advocate), `OFFICE`, `GUIDE`, `SCIENTIST`, `COMMUTER` (shirt and tie), `PHILOSOPHER` (grey hair, brown jacket).
- `travel.ts` (sci-fi travel props):
  - Booth in two cards so a human stands inside: `boothBack(p, v)` behind, `boothFront(p, v, scan, glow)` in front (`v` 0-2 colour, `scan` 0..1 laser line or -1 off, `glow` 0..1).
  - `fax(p, page)`, `shredder(p, k, jam)`, `satellite(p)`, `dish(p)`, `car(p, col)`, `plane(p, col)`, `door(p, open, col)` (a free-standing border door, `open` 0..1).
  - `atom(p, ph, col)` (spinning orbit phase), `bomb(p, spark)`, `atomBin(p)` (a bin of loose atoms).
- `science.ts`: `dna`, `cell({ file, glow, split, fit })` (use `fit: true` for a split that stays inside the card), `usb`, `hardDrive`, `driveTower`, `tube`, `paperclip`, `clapper`, `monitor`, `pyramid`, `coins`, `clock`, `phone`, `priceTag`, `photo`, `fridge`, `sandwich`, `sparkle`, `redX`, `lens`.
  - In `engine/toon.ts`: `townsfolk(v)`, `soldier(v)`, `KID`, `PARENT`, `OFFICER`, `RIFLEMAN`.
- Outfit fields: `{ jacket, pants, boots, hat?: "cap"|"hair"|"tophat"|"bonnet"|"shako"|"shako_tall", cap?, hair?, skin?, moustache?, build?: "adult"|"stout"|"kid", buttons?, belt? }`.
- Drawing a new character or prop:
  - `new Pen(g)`: `poly(pts, fill, ol)`, `ell(cx, cy, rx, ry, fill, ol)`, `stroke(pts, w, col)`, `band(pts, fill, w, rim)`, `shadedFill`, `inkRing`, `dot`.
  - Helpers: `ellPts`, `rrect`, `faceFront(p, cx, cy, W, expr, facing, look, lid, brim, skin)`, `mul`, `shade`, `mix`, `INK`.
  - The design space is 600x1000, soles at y = 975, plum ink `#241726`, outline 9-12 px.

## engine/ (look; change only with a verifier pass)
- `build.ts`: `Batch` (`add(geo, mat, matrix?)`, `build(G)`), `boxGeo(min, max, tile)`, `quad`, `tri`, `V`, `lam(key, () => params)` (a cached two-tone material), `addVeg(b, kind, x, y, z, h, seed)` (`round|fat|tall|cone|bush|hedge`), `house(b, x, z, yaw, w, d, h, style)`.
- `paint.ts`: HD textures `planksHD`, `beamHD`, `stoneHD(key, cols, mortar)`, `cobbleHD`, `grassHD`, `roofHD`, `facadeHD`, `cloudHD`; plus `ctex(key, w, h, draw)` for your own canvas texture and `rep`.
- `lights.ts`: `LIGHTS` / `LOOK` for `day | golden | storm | dusk`; `mixLight` / `mixLook` blend two (used by `lightTo`).
- `ink.ts` (`NOINK` layer), `lensblur.ts`, `blur.ts` (camera motion blur), `grade.ts`, `shade.ts`, `cardshade.ts`: the post and look internals.

## captions/, thumbnail/, audio/, music/
- `captions/Captions.tsx`: `<Captions words keywords style? />`. **Speed style** (user's preferred, 2026-11-03): `style={{ plain: true, size: 0.05, keyScale: 1, upper: false, maxWords: 3, outline: "#000", keyColors: {phrase: colour} }}`: white text, black outline, no per-word highlight, only keywords coloured.
  - Defaults: 6.2 % of the width, keywords 1.4x, block centre at 70 % of the height, right margin 16 %: inside the YouTube Shorts safe zone (bottom ~300-450 px of a 1920 frame are covered by the title and channel overlay, the right ~100-170 px by the buttons). Don't move them lower or wider.
  - Keywords come from `projects/<name>/captions.json`.
- `captions/CaptionedVideo.tsx`: captions over a finished mp4 in `public/_render/`.
- `thumbnail/Thumbnail.tsx`: `{ image, lines, accent }`, for a 1080x1920 or 1280x720 composition.
- Audio (Python, `.venv/bin/python`):
  - `audio/dsp.py`: filters, loudness (`integrated`, `true_peak`, `norm_to`), `place`, `pan`, `st`, reverb, wav i/o.
  - `audio/instruments.py`: `brass`, `glock`, `vibes`, `musicbox`, `pluck`, `fife`, `snare`, `cymbal`, `timpani`, `brush`, `pad`, `triangle`, `whistle`.
  - `audio/sfx_gen.py`: `whoosh`, `creak`, `clink`, `rattle`, `boot`, `stroll_step`, `hammer_hit`, `splash_big`, `bubbles`, `water_bed`, `breeze`, `bird_chirps`, `crickets`, `babble`, `applause`, `hurrah`, `oof`, `whoa`, `flag_flutter`, `swing_squeak`.
  - `audio/sfx_more.py`: `pop`, `shutter`, `flash_whine`, `hoot`, `cluck`, `bawk`, `squeak`, `meow`, `thump`, `bell`, `sad_trombone`, `room`, `zap(r, up, dur)` (teleport zap, rising or falling), `hum(dur, r, f0)`, `boom(r, big, dur)`, `ticks(dur, r, rate)` (clock), `grind(dur, r, jam)` (shredder), `beeps(r, n, f, gap)`.
  - Skeleton for a new soundtrack: `projects/_template/audio/sound_template.py`. Copy it and change the cue list and `build_music()`.
- `music/README.md`: the track catalog (mood, key, BPM, sections). Reuse a track or write a new score.

## Scripts (run after `source env.sh`)
- `node scripts/bridge-stills.mjs <prefix> <frames> 0.5` with `COMP=<id>`: look-check stills.
- `node scripts/render.mjs <id> <out.mp4> --res 1080|1440|2160 --audio mix.wav`: progress and ETA in `render_progress.json`.
- `.venv/bin/python scripts/align_words.py <name>`: `voice.mp3` → `words.json`.
- `.venv/bin/python scripts/short_qa.py <mp4> <outdir> <shots.json>`: frame QA; the report opens with the motion gate (PASS needs >= 65 % fresh frames, where sky is ignored and cuts count as motion, and no still stretch over 3 s; fix a FAIL with cuts or action, never an orbit).
- `.venv/bin/python scripts/cost_log.py start|finish ...`: the cost ledger.
- `.venv/bin/python scripts/variety.py recent|log ...`: the variety log.
- `bash scripts/cleanup.sh <name> [--safe|--all]`: free disk.
