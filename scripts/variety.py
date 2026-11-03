# Variety log: what each finished video used, so the next one can avoid repeating the same look.
#   log    : .venv/bin/python scripts/variety.py log <name> --sets "courtroom:0,jungle:0" --cast "monkey,hen,judges" \
#              --music courtroom-caper --light "day,golden" --camera "push-ins, crane outs" --palette "warm wood, green"
#   recent : .venv/bin/python scripts/variety.py recent [n]   -> last n videos + what is over-used (run at intake)
# Stored in ledger/VARIETY.csv (one row per video). Set entries are "set:variant" (see library/sets/sets.ts Variant).
import argparse, collections, csv, datetime, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV = os.path.join(ROOT, "ledger", "VARIETY.csv")
COLS = ["project", "date", "sets", "cast", "music", "light", "camera", "palette", "notes"]


def rows():
    return list(csv.DictReader(open(CSV))) if os.path.exists(CSV) else []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["log", "recent"])
    ap.add_argument("name", nargs="?")
    for c in COLS[2:]:
        ap.add_argument(f"--{c}", default="")
    a = ap.parse_args()
    if a.cmd == "log":
        new = not os.path.exists(CSV)
        with open(CSV, "a", newline="") as f:
            w = csv.DictWriter(f, fieldnames=COLS)
            if new:
                w.writeheader()
            w.writerow({"project": a.name, "date": datetime.date.today().isoformat(), **{c: getattr(a, c) for c in COLS[2:]}})
        print("logged", a.name)
        return
    n = int(a.name or 5)
    rs = rows()[-n:]
    if not rs:
        print("no videos logged yet: anything goes")
        return
    for r in rs:
        print(f"{r['date']}  {r['project']:<22} sets={r['sets']}  cast={r['cast']}  music={r['music']}  light={r['light']}  camera={r['camera']}")
    for col in ["sets", "cast", "music", "light", "palette"]:
        c = collections.Counter(x.strip() for r in rs for x in r[col].split(",") if x.strip())
        rep = [f"{k} x{v}" for k, v in c.most_common() if v > 1]
        if rep:
            print(f"repeated {col}: {', '.join(rep)}")
    print("-> prefer unused sets/variants, a different music mood and a new palette or light for the next video.")


if __name__ == "__main__":
    main()
