# AI cost ledger: one row per finished video in ledger/AI_COSTS.csv (+ a readable ledger/AI_COSTS.md table).
#   start   : .venv/bin/python scripts/cost_log.py start <name> --weekly 54 [--plan Ultra]
#             (run when the project begins; Claude reads the weekly % with its usage tool)
#   finish  : .venv/bin/python scripts/cost_log.py finish <name> --weekly 61 --context 343000 --turns 230 \
#               [--models claude-opus-5-5] [--output-tokens 120000] [--res 1440x2560] [--render-min 22] \
#               [--renders-failed 2] [--stills 50] [--other "faster-whisper (local)"] [--notes "..."]
#   table   : rebuild AI_COSTS.md from the CSV
# Claude-token estimate (the app does not report billed totals): a session re-sends its context every turn, mostly
# from cache, so cumulative input ~= turns x context_end / 2 (context grows ~linearly); ~93 % of it is cache reads, the
# context itself is written to cache about once, ~2 % is uncached. Multi-model sessions split the turns evenly.
# Prices: ledger/prices.json (edit it). Everything marked est. is an estimate (+-50 %); the weekly % is the real cost.
import argparse, csv, datetime, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = os.path.join(ROOT, "ledger")
CSV, MD, OPEN = os.path.join(L, "AI_COSTS.csv"), os.path.join(L, "AI_COSTS.md"), os.path.join(L, "_open")
COLS = ["project", "started", "finished", "video_s", "resolution", "models", "plan", "weekly_pct_start", "weekly_pct_end",
        "weekly_pct_used", "context_tokens_end", "turns", "est_input_tokens", "est_cache_read_tokens", "est_output_tokens",
        "est_claude_api_usd", "elevenlabs_chars", "est_elevenlabs_usd", "render_min", "renders_failed", "stills", "other_tools",
        "est_total_usd", "notes"]


def prices():
    return json.load(open(os.path.join(L, "prices.json")))


def video_len(name):
    p = os.path.join(ROOT, "projects", name, "voice", "words.json")
    return round(json.load(open(p))[-1]["end"], 1) if os.path.exists(p) else ""


def table():
    rows = list(csv.DictReader(open(CSV))) if os.path.exists(CSV) else []
    show = ["project", "finished", "video_s", "resolution", "models", "weekly_pct_used", "context_tokens_end", "est_claude_api_usd",
            "est_elevenlabs_usd", "render_min", "est_total_usd", "notes"]
    out = ["# AI cost ledger", "", "One row per finished video. **weekly_pct_used** is the real cost on a Claude plan (share of the weekly limit);",
           "USD columns are API-equivalent estimates (+-50 %) from `ledger/prices.json`. Full columns: `AI_COSTS.csv`.", "",
           "| " + " | ".join(show) + " |", "|" + "---|" * len(show)]
    out += ["| " + " | ".join(str(r.get(c, "")) for c in show) + " |" for r in rows]
    tot = sum(float(r["est_total_usd"] or 0) for r in rows)
    out += ["", f"**Total est. API-equivalent spend: ${tot:,.2f} over {len(rows)} video(s).**", ""]
    open(MD, "w").write("\n".join(out))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["start", "finish", "table"])
    ap.add_argument("name", nargs="?")
    ap.add_argument("--weekly", type=float)
    ap.add_argument("--plan", default=None)
    ap.add_argument("--context", type=int, default=0)
    ap.add_argument("--turns", type=int, default=0)
    ap.add_argument("--models", default="claude-opus-5-5")
    ap.add_argument("--output-tokens", type=int, default=0)
    ap.add_argument("--res", default="")
    ap.add_argument("--render-min", type=float, default=0)
    ap.add_argument("--renders-failed", type=int, default=0)
    ap.add_argument("--stills", type=int, default=0)
    ap.add_argument("--other", default="")
    ap.add_argument("--notes", default="")
    ap.add_argument("--weekly-start", type=float, default=None, help="override when no start record exists")
    a = ap.parse_args()
    os.makedirs(OPEN, exist_ok=True)
    if a.cmd == "table":
        return table()
    P = prices()
    if a.cmd == "start":
        json.dump({"started": datetime.datetime.now().isoformat(timespec="minutes"), "weekly": a.weekly, "plan": a.plan or P["plan"]["name"]},
                  open(os.path.join(OPEN, a.name + ".json"), "w"))
        print(f"started {a.name}: weekly {a.weekly}%")
        return
    st = {}
    sp = os.path.join(OPEN, a.name + ".json")
    if os.path.exists(sp):
        st = json.load(open(sp))
    w0 = st.get("weekly", a.weekly_start)
    models = [m.strip() for m in a.models.split(",") if m.strip()]
    cum = a.turns * a.context / 2
    cache_read, cache_write, uncached = 0.93 * cum, float(a.context), 0.02 * cum
    out_tok = a.output_tokens or int(0.35 * a.context)
    usd = 0.0
    for m in models:  # turns split evenly between the models used
        p = P["claude"][m]
        k = 1 / len(models)
        usd += k * (cache_read * p["cache_read"] + cache_write * p["cache_write_5m"] + uncached * p["input"] + out_tok * p["output"]) / 1e6
    chars = 0
    vo = os.path.join(ROOT, "projects", a.name, "VOICEOVER.txt")
    if os.path.exists(vo):
        chars = len(open(vo, encoding="utf-8").read().strip())
    el = P["elevenlabs"]
    el_usd = chars * el["credits_per_char"] * el["usd_per_1k_credits"] / 1000
    row = {"project": a.name, "started": st.get("started", ""), "finished": datetime.datetime.now().isoformat(timespec="minutes"),
           "video_s": video_len(a.name), "resolution": a.res, "models": "+".join(models), "plan": st.get("plan", a.plan or P["plan"]["name"]),
           "weekly_pct_start": "" if w0 is None else w0, "weekly_pct_end": "" if a.weekly is None else a.weekly,
           "weekly_pct_used": "" if (w0 is None or a.weekly is None) else round(a.weekly - w0, 1), "context_tokens_end": a.context,
           "turns": a.turns, "est_input_tokens": int(cum), "est_cache_read_tokens": int(cache_read), "est_output_tokens": out_tok,
           "est_claude_api_usd": round(usd, 2), "elevenlabs_chars": chars, "est_elevenlabs_usd": round(el_usd, 2), "render_min": a.render_min,
           "renders_failed": a.renders_failed, "stills": a.stills, "other_tools": a.other, "est_total_usd": round(usd + el_usd, 2), "notes": a.notes}
    new = not os.path.exists(CSV)
    with open(CSV, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLS)
        if new:
            w.writeheader()
        w.writerow(row)
    if os.path.exists(sp):
        os.remove(sp)
    table()
    print(json.dumps(row, indent=1))


if __name__ == "__main__":
    main()
