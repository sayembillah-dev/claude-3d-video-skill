# Soundtrack of "dna-drive-v2" (from the template). Original sound only, synthesized with library/audio
# (dsp / instruments / sfx_gen / sfx_more). Fill build_sfx() cues and build_music() (or reuse a library/music track).
# Mix: voice unchanged, music +3 dB, SFX -6 dB on the house balance, master -15 LUFS / -1.2 dBTP, ducked under the voice.
# Run: .venv/bin/python projects/<name>/audio/<name>_sound.py   (writes mix.wav, stems and cues.md here)
import json, os, sys
import numpy as np
from scipy import signal, ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "library", "audio"))
from dsp import (SR, ns, rng, dbg, pan, st, place, make_ir, convolve_st, integrated, true_peak, norm_to, read_wav, write_wav)
import instruments as I
import sfx_gen as G
from sfx_more import pop, thump, bell, shutter, room
sys.path.insert(0, HERE)

FPS = 30
TOTAL = 2300  # frames: voice 75.47 s + tail
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
ROOT = os.path.dirname(HERE)
cues = []
cue = lambda t, what: cues.append((t, what))


def build_sfx():
    """beds per place + one-shot cues; times from voice/words.json and the picture constants (story.ts / cast.ts)"""
    S = np.zeros((2, N))
    r = rng(1)
    ev = lambda x, t, lufs, p=0.0, what="": (place(S, pan(norm_to(x, lufs), p) if np.ndim(x) == 1 else norm_to(x, lufs), t), cue(t, what))
    fade = lambda x, a=0.3: x * np.minimum(1, np.minimum(np.arange(x.shape[-1]) / ns(a), (x.shape[-1] - np.arange(x.shape[-1])) / ns(a)))
    ding = lambda f, v=0.6: I.glock(I.m2f(f), v, r)
    # beds
    ev(fade(room(6.6, r, 0.6)), 0.0, -34, 0, "home: room tone")
    ev(fade(G.bubbles(8.7, r, 6.0)), 6.5, -30, 0, "body: soft bubbles")
    crowd = sum(pan(G.babble(10.9, r, 105 + 25 * k, 1.0 + 0.06 * k), -0.6 + 0.3 * k) for k in range(5))
    ev(fade(crowd, 0.5), 15.2, -30, 0, "street: lunch crowd")
    ev(fade(G.breeze(10.9, r, 0.6)), 15.2, -34, 0, "street: breeze")
    ev(fade(room(28.6, r, 1.0), 0.5), 26.1, -36, 0, "museum: hall tone")
    ev(fade(G.bubbles(11.0, r, 5.0)), 54.76, -31, 0, "body: bubbles")
    ev(fade(G.breeze(4.6, r, 0.5, bright=500)), 65.78, -32, 0, "vault: cold hum")
    ev(fade(room(5.0, r, 0.6)), 70.38, -35, 0, "home: room tone")
    # one-shots
    ev(pop(r, 900), 0.66, -24, 0.3, "save click")
    ev(G.whoosh(0.4, r, peak=0.5), 2.3, -26, 0, "swish: body?")
    for t, f, w in [(5.64, 84, "DNA ding"), (8.72, 79, "file pops in"), (11.92, 72, "USB pop")]:
        ev(pop(r, 620), t, -21, 0, w); ev(ding(f), t + 0.02, -24, 0.1, w + " (glock)")
    for k in range(4):
        ev(pop(r, 1100 + 120 * k), 9.44 + 0.35 * k, -28, -0.2 + 0.15 * k, "files flip")
    ev(G.whoosh(1.7, r, peak=0.3, f_lo=250, f_hi=1400), 12.84, -24, 0, "pull back: too small to see")
    for k, t in enumerate([18.0, 18.26, 18.54]):
        ev(pop(r, 700 + 150 * k), t, -22, -0.4 + 0.4 * k, "cell file pop")
    ev(thump(r, 1.4), 20.92, -23, 0, "drive towers land"); ev(G.whoosh(0.5, r, peak=0.2), 20.6, -24, 0, "towers rise")
    for k in range(6):
        ev(thump(r, 0.5), 22.2 + 0.62 * k, -30, (-0.2, 0.2)[k % 2], "towers walk")
    ev(pop(r, 260), 25.2, -22, 0.2, "bite")
    ev(ding(86, 0.5), 27.92, -26, 0, "2017 ding")
    ev(thump(r, 1.6), 31.04, -23, -0.3, "petabyte tower")
    ev(pop(r, 560), 32.86, -22, 0, "gram pop")
    ev(G.clink(r, 2600), 35.98, -22, 0.2, "paperclip clink")
    for k, f in enumerate([79, 83, 86, 91]):
        ev(ding(f, 0.5), 40.86 + 0.07 * k, -25, 0.2, "perfectly sparkle")
    ev(I.triangle(0.5, r), 42.1, -27, 0.2, "Luckily")
    ev(I.brush(0.6, r, swish=True), 45.88, -26, 0, "Unluckily")
    for k in range(12):
        ev(G.clink(r, 1900 + 90 * (k % 4)), 47.7 + 0.1 * k, -27, 0.3 * ((k % 3) - 1), "coin clinks")
    for k in range(16):
        ev(G.clink(r, 3200, dur=0.04), 50.2 + 0.12 * k, -30, 0.25, "clock ticks fast")
    ev(shutter(r), 52.36, -22, 0, "selfie shutter")
    ev(pop(r, 480), 53.28, -22, 0.2, "price tag grows")
    ev(G.whoosh(0.5, r, peak=0.4), 54.6, -26, 0, "back into the body")
    ev(G.whoosh(1.8, r, peak=0.85, f_lo=300, f_hi=1800), 57.06, -26, 0, "cell stretches")
    ev(pop(r, 420), 58.86, -22, 0, "cell splits")
    for t in (61.3, 64.5):
        ev(pop(r, 1500), t, -22, 0.1, "typo glitch"); ev(G.clink(r, 900), t + 0.05, -26, -0.1, "typo glitch")
    ev(G.whoosh(0.9, r, peak=0.4, f_lo=2500, f_hi=6000, air=0.6), 67.7, -28, -0.2, "cold mist hiss")
    ev(thump(r, 0.6), 69.24, -24, 0.3, "not in people")
    ev(ding(86, 0.45), 73.38, -27, -0.1, "full sparkle")
    return S


# ---------------------------------------------------------------- music (original): "pocket-circuit", G major 112 BPM, plucks + glock + whistle
BPM = 112
Q = 60 / BPM
BAR = 4 * Q
CH = {"G": [43, 47, 50, 55], "D": [38, 42, 45, 50], "Em": [40, 43, 47, 52], "C": [36, 40, 43, 48], "Am": [45, 48, 52, 57], "B": [47, 51, 54, 59]}
PROG = ["G", "D", "Em", "C"]
DARK = ["Em", "C", "Am", "B"]  # "bigger problem" section
TUNE = [[(0, 74), (1, 71), (2, 72), (3, 74)], [(0, 76), (1.5, 74), (3, 71)], [(0, 72), (1, 71), (2, 69), (3, 67)], [(0, 69), (2, 71)]]


def build_music(clean=False):
    M = np.zeros((2, N))
    r = rng(7)
    whist = []
    for b in range(int(DUR / BAR) + 2):
        t0 = b * BAR
        if t0 > DUR:
            break
        dark = 54.4 <= t0 < 65.0
        end = t0 >= 69.5
        ch = (DARK if dark else PROG)[b % 4]
        notes = CH[ch]
        # pluck bass: root on 1 and 3, fifth on the "and" of 2 (staccato, bouncy)
        for beat, m in [(0, notes[0]), (1.5, notes[2]), (2, notes[0]), (3.5, notes[1])]:
            if end and beat > 0:
                continue
            place(M, pan(I.pluck(I.m2f(m - 12 if m > 45 else m), 0.7, r, dur=0.35, bright=0.35), -0.1), t0 + beat * Q)
        # off-beat chord plucks
        if not end:
            for beat in (0.5, 1.5, 2.5, 3.5):
                for m in notes[1:]:
                    place(M, pan(I.pluck(I.m2f(m + 12), 0.28, r, dur=0.2, bright=0.7), 0.25), t0 + beat * Q)
        # brushes on 2 and 4 (not in the dark section's first bar or the ending)
        if not end:
            for beat in (1, 3):
                place(M, pan(I.brush(0.45 if not dark else 0.3, r), 0.1), t0 + beat * Q)
        # glock sparkles every other bar outside the museum (where the whistle sings)
        if not dark and not end and not (26.0 <= t0 < 41.5) and b % 2 == 0:
            for k, m in enumerate([notes[3] + 24, notes[2] + 24, notes[1] + 36]):
                place(M, pan(I.glock(I.m2f(m), 0.3, r), 0.35), t0 + (2 + k * 0.5) * Q)
        if dark:
            place(M, I.pad([I.m2f(n + 12) for n in notes[:3]], BAR * 1.05, 0.22, r, att=0.6, rel=0.8), t0)
        if 26.0 <= t0 < 41.5:
            whist += [(t0 + bt * Q, Q * 0.9, m, 0.7) for bt, m in TUNE[b % 4]]
        if end:
            place(M, I.pad([I.m2f(n + 12) for n in CH["G"][:3]], BAR * 1.1, 0.3, r, att=0.8, rel=1.2), t0)
            for k, m in enumerate([79, 74, 71, 67]):
                place(M, pan(I.musicbox(I.m2f(m), 0.45, r), 0.2), t0 + k * Q)
    if whist:
        ws, w = I.whistle(whist, r)
        place(M, pan(w * 0.5, -0.25), ws)
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
    M = build_music() * dbg(duck(words))[None, :]
    S = build_sfx()
    M = M * dbg(Lv - 10.5 - integrated(M) + 3.0)
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
           f"- stems: voice {integrated(V):.1f} / music {integrated(M):.1f} / sfx {integrated(S):.1f} LUFS", "", "## Cues", ""]
    rep += [f"- {t:6.2f} s  {w}" for t, w in sorted(cues)]
    open(os.path.join(HERE, "cues.md"), "w").write("\n".join(rep) + "\n")
    print("\n".join(rep[:6]))


if __name__ == "__main__":
    main()
