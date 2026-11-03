# AI cost ledger

One row per finished video. **weekly_pct_used** is the real cost on a Claude plan (share of the weekly limit);
USD columns are API-equivalent estimates (+-50 %) from `ledger/prices.json`. Full columns: `AI_COSTS.csv`.

| project | finished | video_s | resolution | models | weekly_pct_used | context_tokens_end | est_claude_api_usd | est_elevenlabs_usd | render_min | est_total_usd | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| animal-court | 2026-11-03T08:35 | 68.8 | 1440x2560 | claude-sonnet-5-5+claude-opus-5-5 |  | 484078 | 22.22 | 0.25 | 30.0 | 22.47 | first video + library/captions/ledger setup; weekly start not recorded (backfill); tokens est. from 300 turns x 484k end context |
| dna-drive | 2026-11-03T10:22 | 75.3 | 1080x1920 | claude-sonnet-5-5 | 0.0 | 225000 | 2.11 | 0.25 | 3.5 | 2.36 |  |
| dna-drive-v2 | 2026-11-03T11:02 | 75.3 | 1080x1920 | claude-opus-5-5 | 1.0 | 229288 | 4.34 | 0.25 | 3.0 | 4.59 |  |
| teleport | 2026-11-03T18:34 | 83.7 | 1080x1920 | claude-opus-5-5 | 2.0 | 300000 | 12.38 | 0.3 | 13.3 | 12.68 | v1 orbits passed the motion gate (65%) but broke the booth cards; v2 restaged with pushes/cuts after user review (44%, accepted); thumbnails via bridge-stills |

**Total est. API-equivalent spend: $42.10 over 4 video(s).**
