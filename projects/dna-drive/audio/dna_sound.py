# Soundtrack for "What If You Could Store Files in Your DNA?": original, synthesized with the shared kit in library/audio.
# Music: a curious "wonder-lab" bed in D minor / F major (vibes arpeggio + pluck bass + music box), a warm pad for the
# golden ending. SFX: pops and sparkles on every reveal, drive whooshes, glass clinks, a clapper, coin clinks, a clock
# tick, a sad trombone on "Unluckily", a fridge thump, soft beds per place. Mix: voice unchanged, music +3 dB, SFX -6 dB
# on the house balance, master -15 LUFS / -1.2 dBTP.
# Run: .venv/bin/python projects/dna-drive/audio/dna_sound.py   (writes mix.wav, stems and cues.md here)
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
TOTAL = 2300
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
ROOT = os.path.dirname(HERE)
# (first frame, last frame, place): L lab, M micro world, S square
SHOTS = [(0, 197, "L"), (197, 664, "M"), (664, 783, "S"), (783, 1264, "L"), (1264, 1377, "S"), (1377, 1643, "L"),
         (1643, 1973, "M"), (1973, 2111, "L"), (2111, TOTAL, "S")]
cues = []
cue = lambda t, what: cues.append((t, what))


def build_sfx():
    S = np.zeros((2, N))
    r = rng(2031)
    for a, b, pl in SHOTS:
        t0, t1 = fr(a), fr(b)
        d = t1 - t0 + 0.3
        if pl == "L":
            bed = room(d, r, 0.6)
        elif pl == "M":
            bed = 0.35 * G.breeze(d, r, 0.4, bright=600)
        else:
            bed = 0.5 * G.breeze(d, r, 0.5) + st(0.3 * G.bird_chirps(d, r, 0.5))
        g = np.ones(bed.shape[1]); f = ns(0.12); g[:f] = np.linspace(0, 1, f); g[-f:] = np.linspace(1, 0, f)
        place(S, norm_to(bed, -30, "integrated") * g, t0 - 0.15)
        cue(t0, f"bed {pl}")
    ev = lambda x, t, lufs, p=0.0, what="": (place(S, pan(norm_to(x, lufs), p) if np.ndim(x) == 1 else norm_to(x, lufs), t), cue(t, what))
    sparkle = lambda t, p=0.0, lufs=-19, w="sparkle": ev(I.glock(I.m2f(88), 0.5, r) + I.glock(I.m2f(95), 0.4, r) + I.glock(I.m2f(100), 0.3, r), t, lufs, p, w)
    # hook + DNA reveal
    ev(pop(r, 700), fr(66), -18, 0.3, "pop (usb floats in)")
    ev(G.whoosh(0.5, r, peak=0.4), fr(97) - 0.3, -22, 0, "flash whoosh"); sparkle(fr(97), 0, -22, "sparkle (flash)")
    sparkle(5.66, 0, -17, "sparkle (DNA)")
    ev(G.whoosh(0.8, r, peak=0.3), fr(197) - 0.45, -24, 0, "glide into the cell")
    ev(pop(r, 560), fr(283), -17, 0.3, "pop (usb 750 MB)")
    ev(G.whoosh(1.2, r, peak=0.5, f_lo=250, f_hi=1500, tail=0.4), fr(392) - 0.3, -23, 0, "pull-out whoosh")
    # the cell field appears, then each cell gets a file
    for k in range(14):
        ev(pop(r, 420 + 25 * k), fr(484) + k * 0.075, -24, -0.5 + k / 14, "pop (cell field)")
    for k in range(16):
        ev(pop(r, 800 + 40 * (k % 6)), fr(560) + k * 0.06, -25, -0.6 + k / 13, "pop (files)")
    ev(G.whoosh(1.8, r, peak=0.9, f_lo=220, f_hi=1400, tail=0.5), fr(610) - 0.5, -21, 0, "crane up")
    sparkle(fr(628), 0, -20, "sparkle (zettabytes)")
    # walking around eating lunch
    for k in range(int((26.0 - 22.3) / 0.36)):
        ev(G.stroll_step(r, 0.4), 22.3 + k * 0.36, -28, 0.2 if k % 2 else -0.2, "steps")
    # the lab: towers slide in, pour into the tube
    for i in range(3):
        ev(thump(r, 0.5), fr(800 + i * 6) + 0.05, -22, -0.3 + 0.3 * i, "tower lands")
    ev(G.whoosh(1.9, r, peak=0.9, f_lo=250, f_hi=1600, tail=0.4), fr(930) - 0.2, -21, 0.3, "drives pour into the tube")
    ev(G.clink(r, 2400, 0.2), 33.0, -14, 0.3, "glass clink (a single gram)"); sparkle(33.0, 0.3, -18, "sparkle (gram)")
    ev(pop(r, 650), fr(1036) + 0.05, -20, 0.2, "pop (paperclip)")
    # movie + OS in, read back
    ev(G.clink(r, 1900, 0.16), fr(1128) + 0.2, -20, -0.3, "clapper clack"); ev(thump(r, 0.35), fr(1128) + 0.2, -22, -0.3, "clack body")
    ev(G.whoosh(0.5, r, peak=0.4), fr(1135), -25, 0, "movie into tube"); ev(G.whoosh(0.5, r, peak=0.4), fr(1170), -25, 0.2, "OS into tube")
    ev(G.whoosh(0.5, r, peak=0.4), fr(1196) - 0.05, -24, 0, "read back")
    ev(I.glock(I.m2f(91), 0.6, r) + I.glock(I.m2f(98), 0.5, r), fr(1226), -17, 0.2, "ding (read back perfectly)")
    # Luckily / Unluckily
    ev(I.glock(I.m2f(84), 0.6, r) + I.glock(I.m2f(91), 0.45, r), fr(1264) + 0.1, -20, 0.2, "ding (Luckily)")
    ev(sad_trombone(r, fr(1377)), fr(1377), -17, -0.1, "sad trombone (Unluckily)")
    for k in range(10):
        ev(G.clink(r, 3000 + 150 * (k % 4), 0.1), fr(1442) + k * 0.2, -22, -0.5 + 0.1 * k % 1, "coin clink")
    for k in range(int((52.1 - 50.3) / 0.45)):
        ev(G.clink(r, 1100, 0.05), 50.3 + k * 0.45, -30, 0.3, "clock tick")
    ev(thump(r, 0.8), fr(1564) + 0.25, -17, 0, "price tag drops"); ev(G.whoosh(0.6, r, peak=0.3), fr(1580) - 0.1, -26, 0.3, "tag grows")
    # cells copy, typos
    ev(pop(r, 420), fr(1712), -17, 0, "pop (copy)")
    for k in range(4):
        ev(pop(r, 380 + 40 * k), fr(1650) + 0.6 * k + 0.3, -26, 0.1, "cell splits")
    for h in (1840, 1932):
        ev(thump(r, 0.9), fr(h), -15, 0, "buzz thump (typo)"); ev(G.clink(r, 520, 0.25), fr(h), -22, 0, "wrong note")
    # fridge, no
    ev(thump(r, 0.7), fr(2054), -17, 0.4, "fridge door"); ev(G.whoosh(0.6, r, peak=0.3), fr(2054) - 0.1, -26, 0.4, "cold air")
    ev(thump(r, 0.5), 69.1, -22, -0.2, "no")
    # ending
    sparkle(74.0, 0, -16, "sparkle (it's just full)")
    ev(bell(r, 392), 74.0 + 0.05, -22, 0, "soft bell")
    ev(G.whoosh(1.4, r, peak=0.6, f_lo=220, f_hi=1200, tail=0.5), fr(2250) - 0.4, -26, 0, "pull-out whoosh")
    return S


# ---------------------------------------------------------------- music (original): "wonder-lab", 96 BPM
BPM = 96
Q = 60 / BPM
CH = {"Dm": [50, 53, 57], "Bb": [46, 50, 53], "F": [53, 57, 60], "C": [48, 52, 55], "Gm": [55, 58, 62], "A": [45, 49, 52]}
PROG = ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"]
ARP = [0, 1, 2, 1, 2, 1, 2, 1]  # chord-tone indices per eighth


def build_music(clean=False):
    M = np.zeros((2, N))
    r = rng(1953)
    bar = 4 * Q
    for b in range(int(DUR / bar) + 2):
        t0 = b * bar
        if t0 > DUR:
            break
        ch = PROG[b % 8]
        root = CH[ch][0]
        golden = t0 >= fr(2111) - 0.3
        place(M, I.pad([I.m2f(n) for n in CH[ch]], bar * 1.05, 0.28 if not golden else 0.5, r, att=0.9, rel=1.0), t0)
        if golden:
            for k, n in enumerate(CH[ch] + [CH[ch][0] + 12]):
                place(M, pan(I.musicbox(I.m2f(n + 24), 0.4, r), 0.25 * (-1) ** k), t0 + k * Q)
            continue
        for k, iv in enumerate([0, 7, 0, 7]):
            place(M, pan(I.pluck(I.m2f(root - 12 + iv), 0.7 if k % 2 == 0 else 0.5, r, dur=0.5, bright=0.3), -0.15), t0 + k * Q)
        sec = 1.0 if t0 > 8 else 0.7
        for k in range(8):
            n = CH[ch][ARP[k]] + 24
            place(M, pan(I.vibes(I.m2f(n), 0.34 * sec, r, dur=0.9), 0.3 if k % 2 else -0.1), t0 + k * Q / 2)
        if b % 2 == 1:
            place(M, pan(I.glock(I.m2f(CH[ch][2] + 36), 0.28, r), 0.3), t0 + 3.5 * Q)
        for k in [1, 3]:
            place(M, pan(I.brush(0.3, r), 0.1), t0 + k * Q)
    M = convolve_st(M, make_ir(0.9, 4)) * 0.3 + M
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
    rep = ["# What If You Could Store Files in Your DNA? - soundtrack cue sheet", "",
           f"- mix.wav: 48 kHz stereo 24-bit, {N} samples = {DUR:.3f} s",
           f"- integrated {integrated(out):.1f} LUFS, true peak {true_peak(out):.1f} dBTP, max limiter reduction {-20*np.log10(gr.min()):.2f} dB",
           f"- stems: voice {integrated(V):.1f} / music {integrated(M):.1f} / sfx {integrated(S):.1f} LUFS", "", "## Cues", ""]
    rep += [f"- {t:6.2f} s  {w}" for t, w in sorted(cues)]
    open(os.path.join(HERE, "cues.md"), "w").write("\n".join(rep) + "\n")
    print("\n".join(rep[:6]))


if __name__ == "__main__":
    main()
