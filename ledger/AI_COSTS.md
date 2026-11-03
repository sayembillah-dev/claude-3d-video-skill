# AI cost ledger

One row per finished video. **weekly_pct_used** is the real cost on a Claude plan (share of the weekly limit);
USD columns are API-equivalent estimates (+-50 %) from `ledger/prices.json`. Full columns: `AI_COSTS.csv`.

| project | finished | video_s | resolution | models | weekly_pct_used | context_tokens_end | est_claude_api_usd | est_elevenlabs_usd | render_min | est_total_usd | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| animal-court | 2026-11-03T08:35 | 68.8 | 1440x2560 | claude-sonnet-5-5+claude-opus-5-5 |  | 484078 | 22.22 | 0.25 | 30.0 | 22.47 | first video + library/captions/ledger setup; weekly start not recorded (backfill); tokens est. from 300 turns x 484k end context |
| dna-drive | 2026-11-03T10:22 | 75.3 | 1080x1920 | claude-sonnet-5-5 | 0.0 | 225000 | 2.11 | 0.25 | 3.5 | 2.36 |  |

**Total est. API-equivalent spend: $24.83 over 2 video(s).**
