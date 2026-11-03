# Music library (original, royalty-free: synthesized by us, no samples, no third-party audio)

Every track is the **clean** score: no ducking under a voice and no story hits, loudness-normalised to **-16 LUFS
integrated**, true peak ≤ -1 dBTP, 48 kHz stereo. The `.wav` is the master (24-bit); use the `.mp3` (320k) for quick previews.
When reusing a track, the mix script ducks it under the voice and sets its level (house rule: music +3 dB). Cut on bar lines
(one bar = 60/BPM x 4 s).

| File | Mood | Key / tempo | Length | Sections (s) | Made for | Generator |
|---|---|---|---|---|---|---|
| `courtroom-caper_pizzicato_F-major_104bpm_69s` | light, sneaky, comic: legal caper / curious mischief | F major, 104 BPM, 4/4 (bar = 2.31 s), 8-bar loop F-C-Dm-Bb-F-C-Bb-C7 | 69.4 s, fades out from 67.0 | 0-42.6 pizzicato bass + off-beat plucks + glockenspiel tune + brushes; 42.6-51.6 same groove with a **fife** melody (old-world / medieval colour); 53.2-58.7 driving octave bass + snare hits (crowd / build-up); 61.6-67 **warm pad + music box** (soft, reflective ending) | animal-court (2026-11-03) | `projects/animal-court/audio/court_sound.py` → `build_music(clean=True)` |
| `wonder-lab_vibes-pluck-pad_D-minor_96bpm_77s` | curious, bright, science / explainer wonder | D minor / F, 96 BPM, 4/4 (bar = 2.5 s), 8-bar loop Dm-Bb-F-C-Dm-Bb-Gm-A | 76.7 s, fades out from 74.3 | 0-76 vibes arpeggio + pluck bass + brushes + glock sparkles; from 70.4 s warm pad + music box (soft golden ending) | dna-drive (2026-11-03) | `projects/dna-drive/audio/dna_sound.py` -> `build_music(clean=True)` |

To add a track: export the project's `build_music(clean=True)` (or equivalent) normalised to -16 LUFS. Name it
`<mood-name>_<instruments>_<key>_<bpm>bpm_<len>s.wav`, add the `.mp3`, and add a row here.
