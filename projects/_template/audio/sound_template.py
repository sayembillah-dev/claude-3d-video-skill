# TEMPLATE soundtrack script: copy to projects/<name>/audio/<name>_sound.py. Original sound only, synthesized with library/audio
# (dsp / instruments / sfx_gen / sfx_more). Fill build_sfx() cues and build_music() (or reuse a library/music track).
# Mix: voice unchanged, SFX -6 dB on the house balance, master -15 LUFS / -1.2 dBTP. No background music by default
# (since 2026-11-03 the user found BGM distracting): MUSIC_DB = None. Only when the user asks for a bed, set MUSIC_DB to a
# level relative to the old +3 dB balance (e.g. -12.0 = a quiet bed), ducked under the voice.
# Run: .venv/bin/python projects/<name>/audio/<name>_sound.py   (writes mix.wav, stems and cues.md here)
import json, os, sys
import numpy as np
from scipy import signal, ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "library", "audio"))
from dsp import (SR, ns, rng, dbg, pan, st, place, make_ir, convolve_st, integrated, true_peak, norm_to, read_wav, write_wav)
import instruments as I
import sfx_gen as G
from sfx_more import pop, thump, bell, sad_trombone, room
sys.path.insert(0, HERE)

FPS = 30
TOTAL = 90  # frames: voice length + tail
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
ROOT = os.path.dirname(HERE)
cues = []
cue = lambda t, what: cues.append((t, what))


def build_sfx():
    """beds per place + one-shot cues. Times come from voice/words.json and the picture constants (story.ts / cast.ts)."""
    S = np.zeros((2, N))
    r = rng(1)
    ev = lambda x, t, lufs, p=0.0, what="": (place(S, pan(norm_to(x, lufs), p) if np.ndim(x) == 1 else norm_to(x, lufs), t), cue(t, what))
    # examples (delete): ev(pop(r, 700), 2.2, -18, 0.3, "pop"); ev(G.whoosh(0.5, r, peak=0.4), 3.0, -22, 0, "whoosh")
    ev(room(2.0, r, 0.5), 0.0, -30, 0, "room tone")
    return S


MUSIC_DB = None  # None = SFX only (house default). A number turns on a quiet, ducked bed; never above -8.0.
# ---------------------------------------------------------------- music (original): replace with a mood that fits, or load a track from library/music
BPM = 100
Q = 60 / BPM
CH = {"C": [48, 52, 55], "Am": [45, 48, 52], "F": [53, 57, 60], "G": [43, 47, 50]}
PROG = ["C", "Am", "F", "G"]


def build_music(clean=False):
    M = np.zeros((2, N))
    r = rng(7)
    bar = 4 * Q
    for b in range(int(DUR / bar) + 2):
        t0 = b * bar
        if t0 > DUR:
            break
        ch = PROG[b % 4]
        place(M, I.pad([I.m2f(n) for n in CH[ch]], bar * 1.05, 0.3, r, att=0.9, rel=1.0), t0)
        for k in range(4):
            place(M, pan(I.pluck(I.m2f(CH[ch][0] - 12), 0.6, r, dur=0.5), -0.15), t0 + k * Q)
    t = np.arange(N) / SR
    g = np.interp(t, [0, 0.1, DUR - 2.4, DUR - 0.2, DUR], [0, 1, 1, 0.0, 0.0])
    return M * g[None, :]


# ---------------------------------------------------------------- mix
def limiter(x, ceil_db=-1.2, look=0.003, rel=0.08):
    c = dbg(ceil_db)
    n = x.shape[1]
    up = np.abs(signal.resample_poly(x, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    La = max(1, ns(look))
    g1 = ndimage.minimum_filter1d(gr, 2 * La + 1, mode="nearest")
    kr = 1 - np.exp(-1 / (rel * SR))
    g2 = signal.lfilter([kr], [1, -(1 - kr)], g1 - 1.0) + 1.0
    g2 = np.minimum(g1, np.maximum(g2, g1))
    g3 = np.minimum(1.0, ndimage.uniform_filter1d(g2, 2 * La + 1, mode="nearest"))
    return x * g3[None, :], g3


def duck(words, depth=-3.0):
    spans = []
    for w in words:
        s, e = w["start"], w["end"]
        if spans and s - spans[-1][1] < 0.3:
            spans[-1][1] = e
        else:
            spans.append([s, e])
    ctrl = 1000
    va = np.zeros(int(DUR * ctrl) + 2)
    for s, e in spans:
        va[max(0, int((s - 0.08) * ctrl)): int((e + 0.12) * ctrl)] = 1
    env = np.clip(ndimage.uniform_filter1d(va, 120), 0, 1)
    return np.interp(np.arange(N) / SR, np.arange(len(env)) / ctrl, depth * env)


def main():
    x, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    assert sr == SR
    v = np.zeros(N); vv = x.mean(0); v[: min(N, len(vv))] = vv[:N]
    V = st(v)
    words = json.load(open(os.path.join(ROOT, "voice", "words.json")))
    Lv = integrated(V)
    S = build_sfx()
    if MUSIC_DB is None:
        M = np.zeros_like(S)
    else:
        M = build_music() * dbg(duck(words))[None, :]
        M = M * dbg(Lv - 10.5 - integrated(M) + 3.0 + MUSIC_DB)
    S = S * dbg(Lv - 13.0 - integrated(S) - 6.0)
    mix = V + M + S
    g = dbg(-15.0 - integrated(mix))
    mix, V, M, S = mix * g, V * g, M * g, S * g
    out, gr = limiter(mix)
    write_wav(os.path.join(HERE, "mix.wav"), out)
    for name, y in [("voice", V), ("music", M), ("sfx", S)]:
        write_wav(os.path.join(HERE, f"stem_{name}.wav"), y)
    rep = ["# soundtrack cue sheet", "",
           f"- mix.wav: 48 kHz stereo 24-bit, {N} samples = {DUR:.3f} s",
           f"- integrated {integrated(out):.1f} LUFS, true peak {true_peak(out):.1f} dBTP, max limiter reduction {-20*np.log10(gr.min()):.2f} dB",
           f"- stems: voice {integrated(V):.1f} / music " + ("off" if MUSIC_DB is None else f"{integrated(M):.1f}") + f" / sfx {integrated(S):.1f} LUFS", "", "## Cues", ""]
    rep += [f"- {t:6.2f} s  {w}" for t, w in sorted(cues)]
    open(os.path.join(HERE, "cues.md"), "w").write("\n".join(rep) + "\n")
    print("\n".join(rep[:6]))


if __name__ == "__main__":
    main()
