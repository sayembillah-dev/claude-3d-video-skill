# Soundtrack for "What If Animals Could Sue Humans": all original, synthesized with the bridge short's kit
# (dsp.py / instruments.py / sfx_gen.py). Picture times mirror src/videos/animal-court/story.ts + cast.ts.
# Music: a light pizzicato "courtroom caper" in F (bass pluck + glock tune + brushes), a fife turn for 1519, a warm pad
# for the golden ending, ducked under the voice. SFX: shutter clicks, the gavel, pops, hen crowd, rat squeaks, cat
# meows, paper thumps, room tones. Mix: voice unchanged, music +3 dB, SFX -6 dB on the house balance, master -15 LUFS.
# Run: .venv/bin/python projects/animal-court/audio/court_sound.py   (writes mix.wav, stems and cues.md here)
import json, os, sys
import numpy as np
from scipy import signal, ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "library", "audio"))  # shared sound kit
from dsp import (SR, TAU, ns, tt, rng, dbg, lp, hp, bp, peq, colored, smooth_noise, fades, phase, modal, pan, st, place, widen,
                 make_ir, convolve_st, integrated, true_peak, norm_to, read_wav, write_wav, momentary_max)
import instruments as I
import sfx_gen as G
from sfx_more import pop, shutter, flash_whine, hoot, cluck, bawk, squeak, meow, thump, bell, sad_trombone, room

FPS = 30
TOTAL = 2082
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
ROOT = os.path.dirname(HERE)
SHOTS = {1: (0, 127, "C"), 2: (127, 335, "J"), 3: (335, 511, "C"), 4: (511, 685, "E"), 5: (685, 812, "C"), 6: (812, 926, "E"),
         7: (926, 1021, "E"), 8: (1021, 1279, "C"), 9: (1279, 1550, "M"), 10: (1550, 1762, "E"), 11: (1762, 1848, "C"), 12: (1848, TOTAL, "J")}
cues = []


def cue(t, what):
    cues.append((t, what))


# ---------------------------------------------------------------- SFX
def build_sfx():
    S = np.zeros((2, N))
    r = rng(2026)
    span = lambda i: (fr(SHOTS[i][0]), fr(SHOTS[i][1]))
    # beds per place
    for i, (a, b, place_) in SHOTS.items():
        t0, t1 = fr(a), fr(b)
        d = t1 - t0 + 0.3
        if place_ == "J":
            bed = 0.5 * G.breeze(d, r, 0.6, bright=1300) + st(0.35 * G.bird_chirps(d, r, 0.9, "blackbird")) + st(0.15 * G.crickets(d, r, 4))
        elif place_ == "C":
            bed = room(d, r, 0.7) + st(0.25 * sum(G.babble(d, r, 110 + 40 * k, 1.0 + 0.1 * k, active=0.5) for k in range(3)))
            bed = convolve_st(bed, make_ir(1.1, 31))
        elif place_ == "E":
            bed = 0.7 * G.breeze(d, r, 0.8) + st(0.3 * G.bird_chirps(d, r, 0.6))
        else:
            bed = 0.5 * G.breeze(d, r, 0.5) + st(0.35 * sum(G.babble(d, r, 105 + 35 * k, 1.0 + 0.08 * k, active=0.7) for k in range(5)))
        g = np.ones(bed.shape[1])
        f = ns(0.12)
        g[:f] = np.linspace(0, 1, f); g[-f:] = np.linspace(1, 0, f)
        place(S, norm_to(bed, -30, "integrated") * g, t0 - 0.15)
        cue(t0, f"bed {place_}")
    ev = lambda x, t, lufs, p=0.0, what="": (place(S, pan(norm_to(x, lufs), p) if np.ndim(x) == 1 else norm_to(x, lufs), t), cue(t, what))
    # hook: the selfie flash
    ev(shutter(r), 1.15, -16, 0.1, "shutter (selfie)"); ev(flash_whine(r), 0.55, -26, 0.1, "flash charge")
    ev(G.whoosh(0.7, r, peak=0.35), fr(127) - 0.35, -22, 0, "flash whoosh to the jungle")
    # jungle: footsteps of the monkey, the shutter, a hoot
    for k in range(5):
        ev(G.stroll_step(r, 0.2), fr(236) + k * 0.24, -30, 0.3, "monkey pads")
    ev(shutter(r), 9.73, -15, -0.1, "shutter (tripod)"); ev(hoot(r, 430, 3), 10.55, -18, 0.15, "monkey hoots")
    # the argument: a gasp from the gallery, glide whoosh
    ev(G.whoosh(0.5, r, peak=0.2), fr(458) - 0.1, -26, -0.3, "cut whoosh (the man)")
    ev(G.whoosh(0.5, r, peak=0.2), fr(479) - 0.1, -26, 0.3, "cut whoosh (the monkey)")
    # up the steps
    for k in range(int((22.6 - 17.05) / 0.36)):
        ev(G.stroll_step(r, 0.4), 17.05 + k * 0.36, -27, 0.2 if k % 2 else -0.2, "steps")
    ev(G.whoosh(2.0, r, peak=1.0, f_lo=250, f_hi=1500, tail=0.6), fr(596) - 0.6, -22, 0, "crane up whoosh")
    # the gavel
    ev(G.hammer_hit(r, 1.3), 24.1, -11, 0, "GAVEL on 'no'")
    ev(convolve_st(st(G.hammer_hit(r, 1.0)), make_ir(1.6, 7)) * 0.4, 24.1, -20, 0, "gavel room tail")
    # Luckily / Unluckily
    ev(I.glock(I.m2f(84), 0.6, r) + I.glock(I.m2f(91), 0.45, r), 27.55, -20, 0.2, "ding (Luckily)")
    ev(sad_trombone(r, 30.86), 30.86, -16, -0.1, "sad trombone (Unluckily)")
    # two boxes: pops
    for k, (tp, f0) in enumerate([(1116, 480), (1120, 540), (1124, 600), (1141, 380), (1169, 460), (1176, 620), (1183, 760)]):
        ev(pop(r, f0), fr(tp) - 0.02, -17, -0.4 if k < 3 else 0.35, "pop")
    ev(G.whoosh(0.6, r, peak=0.3), fr(1230) - 0.2, -27, 0.2, "push whoosh")
    # 1519: a church bell, rats, cats
    ev(bell(r, 294), 42.55, -20, -0.3, "church bell 1519")
    for k in range(3):
        ev(squeak(r), 47.55 + 0.11 * k, -22, -0.2, "rat squeaks (sued some rats)")
    ev(meow(r, 560), 50.55, -16, 0.35, "meow (cats)")
    ev(meow(r, 470), 51.0, -19, 0.45, "second meow")
    for k in range(5):
        ev(squeak(r), 50.86 + 0.08 * k, -19, -0.3, "rats squeal")
    # seventy billion hens
    for k in range(6):
        ev(cluck(r, 470), 51.62 + 0.27 * k, -24, 0.1, "hero hen clucks")
    ev(bawk(r, 560), 53.2, -16, 0.05, "bawk (Chickens alone)")
    crowd_d = 58.6 - 53.15
    crowd = np.zeros((2, ns(crowd_d)))
    for k in range(260):
        tm = r.uniform(0, crowd_d - 0.8)
        G._place_mono(crowd[k % 2], cluck(r) * r.uniform(0.3, 1.0), tm)
    ramp_ = np.interp(np.arange(crowd.shape[1]) / SR, [0, 1.0, 3.5, crowd_d - 0.4, crowd_d], [0.2, 0.6, 1.0, 1.0, 0.0])
    crowd = convolve_st(crowd * ramp_, make_ir(0.8, 12))
    ev(crowd, 53.15, -17, 0, "hen class action crowd")
    ev(G.whoosh(2.2, r, peak=1.1, f_lo=200, f_hi=1300, tail=0.7), fr(1678) - 0.8, -21, 0, "crane out whoosh")
    # the judge's paper
    for tp, big in [(60.0, 0.8), (60.44, 1.0), (60.82, 1.3)]:
        ev(thump(r, big), tp, -15, 0.1, "paper thump")
    # ending
    ev(G.whoosh(1.6, r, peak=0.8, f_lo=220, f_hi=1200, tail=0.5), fr(2052) - 0.5, -25, 0, "pull-out whoosh")
    ev(hoot(r, 400, 2), 66.25, -22, 0.2, "monkey shrug hoot")
    return S


# ---------------------------------------------------------------- music (original)
BPM = 104
Q = 60 / BPM
CH = {"F": [53, 57, 60], "C": [48, 52, 55], "Dm": [50, 53, 57], "Bb": [46, 50, 53], "C7": [48, 52, 58], "Gm": [55, 58, 62], "Am": [45, 52, 57]}
PROG = ["F", "C", "Dm", "Bb", "F", "C", "Bb", "C7"]
TUNE = [(0, 72, 1), (1, 74, 0.5), (1.5, 72, 0.5), (2, 69, 1), (3, 67, 1), (4, 69, 1.5), (5.5, 70, 0.5), (6, 72, 2)]  # 2-bar phrase (beats)
TUNE_B = [(0, 77, 1), (1, 76, 0.5), (1.5, 74, 0.5), (2, 72, 1), (3, 70, 1), (4, 69, 1), (5, 67, 1), (6, 65, 2)]


def build_music(clean=False):
    """clean=True: no gavel dropout (the version kept in library/music for reuse)"""
    M = np.zeros((2, N))
    r = rng(519)
    bar = 4 * Q
    nbars = int(DUR / bar) + 2
    for b in range(nbars):
        t0 = b * bar
        if t0 > DUR:
            break
        ch = PROG[b % 8]
        root = CH[ch][0]
        golden = t0 >= fr(1848) - 0.3
        med = fr(1279) <= t0 < fr(1550) - 0.3
        hens = fr(1597) <= t0 < fr(1762)
        if golden:
            if b % 2 == 0:
                place(M, I.pad([I.m2f(n + 12) for n in CH[ch]], 2 * bar, 0.5, r, att=0.8, rel=1.2), t0)
            for k in range(4):
                place(M, pan(I.pluck(I.m2f(root - 12 + (7 if k % 2 else 0)), 0.5, r, dur=1.0), -0.2), t0 + k * Q)
            for (bt, n, d) in (TUNE if b % 2 == 0 else TUNE_B):
                if bt < 4:
                    place(M, pan(I.musicbox(I.m2f(n + 12), 0.45, r), 0.25), t0 + bt * Q)
            continue
        # bass: pizzicato root / fifth on 1 and 3, walking pickups
        for k, iv in enumerate([0, 7, 0, 7] if not hens else [0, 7, 12, 7]):
            place(M, pan(I.pluck(I.m2f(root - 12 + iv), 0.75 if k % 2 == 0 else 0.55, r, dur=0.6, bright=0.35), -0.15), t0 + k * Q)
        # off-beat chord plucks
        for k in [0.5, 1.5, 2.5, 3.5]:
            for n in CH[ch]:
                place(M, pan(I.pluck(I.m2f(n + 12), 0.25, r, dur=0.35, bright=0.6), 0.2), t0 + k * Q + r.uniform(0, 0.006))
        # brushes on 2 and 4
        for k in [1, 3]:
            place(M, pan(I.brush(0.45, r), 0.1), t0 + k * Q)
        # tune: glock (fife in 1519)
        phrase = TUNE if (b // 2) % 2 == 0 else TUNE_B
        half = b % 2
        for (bt, n, d) in phrase:
            if half * 4 <= bt < half * 4 + 4:
                tn = t0 + (bt - half * 4) * Q
                if med:
                    place(M, pan(I.fife(I.m2f(n), d * Q * 0.9, 0.5, r), 0.25), tn)
                else:
                    place(M, pan(I.glock(I.m2f(n + 12), 0.5, r), 0.25), tn)
        if hens and b % 2 == 1:
            place(M, I.snare_roll and pan(I.snare(0.45, r), 0) , t0 + 3.5 * Q)
    # hook sting + the gavel stop: music drops out for half a beat on the gavel
    M = convolve_st(M, make_ir(0.9, 4)) * 0.35 + M
    g = np.ones(N)
    t = np.arange(N) / SR
    if not clean:
        g *= 1 - 0.85 * np.exp(-((t - 24.3) / 0.25) ** 2)
    g *= np.interp(t, [0, 0.1, DUR - 2.4, DUR - 0.2, DUR], [0, 1, 1, 0.0, 0.0])
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
    env = signal.lfilter([0.02], [1, -0.98], va)
    env = np.maximum(env, ndimage.maximum_filter1d(va, 1) * 0)  # keep shape
    env = np.clip(ndimage.uniform_filter1d(va, 120), 0, 1)
    return np.interp(np.arange(N) / SR, np.arange(len(env)) / ctrl, depth * env)


def main():
    x, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    assert sr == SR
    v = np.zeros(N)
    vv = x.mean(0)
    v[: min(N, len(vv))] = vv[:N]
    V = st(v)
    words = json.load(open(os.path.join(ROOT, "voice", "words.json")))
    Lv = integrated(V)
    M = build_music()
    M = M * dbg(duck(words))[None, :]
    S = build_sfx()
    # house balance (bridge): music sits ~10.5 LU under the voice, SFX ~13 LU under; user rule: music +3 dB, SFX -6 dB
    M = M * dbg(Lv - 10.5 - integrated(M) + 3.0)
    S = S * dbg(Lv - 13.0 - integrated(S) - 6.0)
    mix = V + M + S
    g = dbg(-15.0 - integrated(mix))
    mix, V, M, S = mix * g, V * g, M * g, S * g
    out, gr = limiter(mix)
    write_wav(os.path.join(HERE, "mix.wav"), out)
    for name, y in [("voice", V), ("music", M), ("sfx", S)]:
        write_wav(os.path.join(HERE, f"stem_{name}.wav"), y)
    rep = [f"# What If Animals Could Sue Humans - soundtrack cue sheet", "",
           "All sound is original: synthesized in numpy/scipy by `court_sound.py` with the bridge kit (`dsp.py`, `instruments.py`, `sfx_gen.py`).",
           "Voice = `voice/voice.wav` (ElevenLabs, from the user), gain only.", "",
           f"- mix.wav: 48 kHz stereo 24-bit, {N} samples = {DUR:.3f} s",
           f"- integrated {integrated(out):.1f} LUFS, true peak {true_peak(out):.1f} dBTP, max limiter reduction {-20*np.log10(gr.min()):.2f} dB",
           f"- stems: voice {integrated(V):.1f} / music {integrated(M):.1f} / sfx {integrated(S):.1f} LUFS", "", "## Cues", ""]
    rep += [f"- {t:6.2f} s  {w}" for t, w in sorted(cues)]
    open(os.path.join(HERE, "cues.md"), "w").write("\n".join(rep) + "\n")
    print("\n".join(rep[:9]))


if __name__ == "__main__":
    main()
