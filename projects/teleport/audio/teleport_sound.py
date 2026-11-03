# Soundtrack of "teleport" (copied from the template). Original sound only, synthesized with library/audio
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
from sfx_more import pop, thump, bell, sad_trombone, room, flash_whine, zap, hum, boom, ticks, grind, beeps
sys.path.insert(0, HERE)

FPS = 30
TOTAL = 2640  # frames: voice 84 s + payoff tail
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
    # beds
    for a, b in [(0, 4.0), (21.6, 26.5), (26.5, 38.1), (52.6, 66.0)]:
        ev(room(b - a, r, 0.6), a, -34, 0, "flat room tone")
    for a, b in [(4.0, 7.0), (46.1, 52.6), (76.2, 80.0)]:
        ev(G.babble(b - a, r, 150, 1.0, rate=3.5, active=0.5), a, -34, 0.2, "Tokyo street murmur")
    ev(G.breeze(6.0, r), 12.3, -32, 0, "mountain wind")
    ev(G.breeze(8.5, r, level=1.4), 38.1, -30, 0, "storm wind")
    ev(G.bird_chirps(10, r, 0.4), 66.0, -34, 0.3, "square birds")
    ev(G.bird_chirps(4, r, 0.5), 80.0, -36, -0.3, "square birds")
    # 1: scan, wiped out
    ev(hum(3.1, r), 0.0, -24, 0.2, "scanner hum")
    ev(zap(r, up=False), 3.12, -18, 0.2, "wiped out zap")
    ev(pop(r, 420), 3.2, -22, 0.2, "puff")
    # 2: Tokyo arrival
    ev(G.whoosh(0.5, r, peak=0.4), 3.75, -24, 0, "cut whoosh")
    ev(hum(1.0, r, 150), 4.2, -27, 0.1, "Tokyo booth charges")
    ev(zap(r), 5.05, -18, 0.1, "arrival zap")
    for k in range(4): ev(G.stroll_step(r), 5.9 + k * 0.32, -30, 0.2, "steps")
    # 3: photon
    ev(G.whoosh(0.8, r, peak=0.5, f_lo=900, f_hi=4000), 10.1, -26, -0.3, "photon flies")
    ev(I.glock(I.m2f(84), 0.8, r), 11.8, -22, 0.3, "photon lands (ding)")
    # 4: satellite
    ev(G.whoosh(0.9, r, peak=0.5), 12.1, -26, 0, "ripple whoosh")
    ev(beeps(r, 4, 1500), 13.7, -26, 0.2, "uplink beeps")
    ev(flash_whine(r, 1.2), 14.2, -30, 0, "beam whine")
    # 5: info only, original destroyed
    for k in range(6): ev(pop(r, 900 + 120 * k), 17.4 + k * 0.4, -30, -0.3 + 0.12 * k, "bit blips")
    ev(pop(r, 300), 19.82, -18, -0.3, "photon pops")
    ev(thump(r, 0.6), 19.84, -24, -0.3, "destroyed thump")
    # 6: atoms
    ev(hum(4.8, r, 130), 21.7, -27, 0.2, "scanner hum")
    for k in range(14): ev(pop(r, 700 + 60 * (k % 7)), 23.9 + k * 0.14, -29, 0.3 * np.sin(k), "atom pops")
    # 7-8: upload, age of the universe
    ev(G.whoosh(0.35, r, peak=0.3), 26.4, -20, -0.2, "whip")
    ev(beeps(r, 2, 900), 27.6, -28, -0.2, "upload start beeps")
    ev(ticks(5.0, r, 14), 32.9, -28, 0.2, "clock spinning")
    ev(sad_trombone(r, 0) if False else beeps(r, 3, 500, 0.3), 36.9, -28, -0.2, "sad error beeps")
    # 9: energy, megatons, bomb field
    ev(flash_whine(r, 3.3), 38.8, -26, 0, "energy charges")
    ev(boom(r, 1.6, 3.4), 42.16, -14, 0, "BOOM megatons")
    for k in range(10): ev(boom(r, 0.6, 1.2), 44.3 + k * 0.09 + (k % 3) * 0.12, -22, -0.6 + 0.13 * k, "bomb field")
    # 10-11: spare atoms, zero
    for k in range(10): ev(pop(r, 800 + 50 * k), 46.4 + k * 0.09, -29, -0.3 + 0.06 * k, "atoms hop")
    ev(zap(r), 47.55, -20, 0, "Dave rebuilt zap")
    ev(sad_trombone(r, 0), 50.6, -26, 0.2, "zero atoms trombone")
    # 12: fax and shredder
    ev(beeps(r, 3, 2100, 0.12), 53.0, -28, -0.2, "fax handshake")
    ev(grind(1.3, r), 53.5, -27, -0.2, "fax prints")
    ev(grind(1.0, r), 55.6, -24, 0.3, "shredder chews")
    # 13-14: Parfit, the original stops
    ev(G.whoosh(0.3, r, peak=0.3), 61.25, -26, 0, "whip")
    ev(zap(r, up=False, dur=0.6), 65.05, -22, 0.2, "original stops")
    # 15-16: commuters blink away, booths sprout
    for i in range(6): ev(zap(r, dur=0.3), 66.0 + i * 0.9 + 2.2, -26, -0.5 + 0.2 * i, "commuter zaps")
    ev(ticks(1.5, r, 4), 69.0, -30, 0, "clock")
    ev(G.whoosh(1.5, r, peak=0.6), 70.5, -28, 0, "crane up wind")
    for i in range(16): ev(pop(r, 500 + 40 * i), 73.9 + i * 0.12, -28, -0.7 + 0.09 * i, "booths sprout")
    # 17: traffic vanishes, plane, border door
    ev(G.babble(0.1, r, 150, 1.0) * 0, 76.0, -60, 0, "")
    for i in range(5): ev(pop(r, 380 + 60 * i), 76.2 + i * 0.16, -24, -0.5 + 0.25 * i, "car blinks out")
    ev(pop(r, 260), 77.4, -24, 0.3, "plane blinks out")
    ev(G.creak(0.6, r), 79.1, -26, 0.4, "door creak")
    ev(bell(r, 880), 79.3, -30, 0.4, "door ding")
    # 18: the jam, the flood
    ev(grind(1.2, r), 80.2, -24, 0.3, "shredder chews")
    ev(grind(1.5, r, jam=True), 81.4, -20, 0.3, "shredder jams")
    ev(thump(r, 0.8), 81.42, -20, 0.3, "jam clunk")
    for j in range(55): ev(zap(r, dur=0.22), 82.27 + j * 3.2 / 30, -27 + (j % 3), -0.4 + 0.8 * ((j * 7) % 11) / 10, "Dave printed")
    ev(G.babble(4.0, r, 170, 1.0, rate=5, active=0.8), 83.6, -28, 0, "Dave crowd chatter")
    return S


# ---------------------------------------------------------------- music (original): "Zip-Zap Polka" — fast comic oompah, Bb major, 138 BPM
BPM = 138
Q = 60 / BPM
BAR = 4 * Q
# chord: (root midi for the tuba, chord tones for the stabs / melody)
CH = {"Bb": (34, [58, 62, 65]), "F": (41, [57, 60, 65]), "Gm": (43, [55, 58, 62]), "Eb": (39, [55, 58, 63]),
      "C7": (36, [58, 60, 64]), "F7": (41, [57, 63, 65]), "Cm": (36, [55, 60, 63])}
PROG = ["Bb", "F", "Gm", "F", "Eb", "Bb", "C7", "F7"]
DARK = ["Gm", "Cm", "F", "Bb", "Gm", "Eb", "C7", "F7"]   # the Parfit / "is it you" stretch: same groove, minor colour
MOTIF = [(0, 0, 0.9), (0.5, 1, 0.6), (1, 2, 0.8), (1.5, 1, 0.5), (2, 2, 0.8), (3, 0, 0.7), (3.5, 1, 0.6)]
MOTIF2 = [(0, 2, 0.9), (0.75, 1, 0.6), (1.5, 0, 0.8), (2, 1, 0.7), (2.5, 2, 0.7), (3, 2, 0.9)]


def build_music(clean=False):
    M = np.zeros((2, N))
    r = rng(7)
    end_t = DUR - 0.4  # button chord
    nbar = int(end_t / BAR)
    for b in range(nbar):
        t0 = b * BAR
        sec = "dark" if 56.0 <= t0 < 65.5 else "break" if 41.9 <= t0 < 43.6 else "full"
        ch = (DARK if sec == "dark" else PROG)[b % 8]
        root, tones = CH[ch]
        if sec == "break":
            continue  # a bar of silence for the megaton BOOM
        # oompah: tuba on 1 and 3 (root, fifth), brass stabs on the off-beats
        for k, nn in [(0, root), (2, root + 7)]:
            place(M, pan(I.brass(I.m2f(nn), Q * 0.8, 0.85, r, kind="tuba"), -0.1), t0 + k * Q)
        for k in (1, 3):
            for nn in tones:
                place(M, pan(I.brass(I.m2f(nn), Q * 0.35, 0.55, r, kind="stab"), 0.25), t0 + k * Q)
        # drums: snare on 2 and 4, brush 8ths
        for k in (1, 3): place(M, pan(I.snare(0.55, r, dur=0.2), 0.05), t0 + k * Q)
        for k in range(8): place(M, pan(I.brush(0.25 + 0.15 * (k % 2), r), -0.2), t0 + k * Q / 2)
        # melody: glock in "full", whistle-ish fife in "dark"
        mot = MOTIF if (b // 2) % 2 == 0 else MOTIF2
        for (bt, deg, vel) in mot:
            nn = tones[deg] + 12
            if sec == "dark":
                place(M, pan(I.pluck(I.m2f(nn), 0.6 * vel, r, dur=0.4), 0.3), t0 + bt * Q)
            else:
                place(M, pan(I.glock(I.m2f(nn), 0.55 * vel, r, dur=0.6), 0.3), t0 + bt * Q)
                if 66 <= t0 or t0 < 21:  # fife doubles the hook in the openers and the finale
                    place(M, pan(I.fife(I.m2f(nn), Q * 0.4, 0.45 * vel, r), -0.25), t0 + bt * Q)
    # build-ups: snare rolls into the BOOM and into the finale
    for a, b_, v0, v1 in [(38.8, 41.9, 0.15, 0.8), (79.6, 82.2, 0.2, 0.9)]:
        for (ts, v) in I.snare_roll(a, b_, v0, v1, r): place(M, st(I.snare(v, r, dur=0.12)), ts)
    place(M, st(I.cymbal(0.8, r)), 43.6)
    place(M, st(I.cymbal(0.9, r)), 82.25)
    # the button: a fat Bb chord + cymbal at the end
    for nn in [34, 46, 58, 62, 65, 70]:
        place(M, st(I.brass(I.m2f(nn), 0.9, 0.95, r, kind="horn" if nn > 50 else "tuba")), end_t - 1.0)
    place(M, st(I.timpani(I.m2f(34), 0.9, r)), end_t - 1.0)
    place(M, st(I.cymbal(1.0, r, dur=2.0)), end_t - 1.0)
    t = np.arange(N) / SR
    g = np.interp(t, [0, 0.05, DUR - 0.3, DUR], [1, 1, 1, 0.0])
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
