# Soundtrack of "sleep-experiment" (SFX only, no music). Original sound only, synthesized with library/audio
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
from dsp import (SR, ns, rng, dbg, pan, st, place, make_ir, convolve_st, integrated, true_peak, norm_to, read_wav, write_wav, lp)
import instruments as I
import sfx_gen as G
from sfx_more import pop, thump, room, ticks, beeps, boom
import sfx_dark as D
sys.path.insert(0, HERE)

FPS = 30
TOTAL = 2280  # frames: voice 74.0 s + 1.5 s hold
DUR = TOTAL / FPS
N = ns(DUR)
fr = lambda f: f / FPS
ROOT = os.path.dirname(HERE)
cues = []
cue = lambda t, what: cues.append((t, what))


def build_sfx():
    """horror pass: three acoustic spaces (concrete chamber, small control room, dry bedroom) as reverb buses, foley on
    every action, a ventilation bed, a low tension drone, risers into each scare, sub hits and silences before the jolts.
    Times are frames (voice/words.json, story.ts, cast.ts)."""
    r = rng(1)
    B = {k: np.zeros((2, N)) for k in ("dry", "ch", "cr", "bd")}
    WET = {"ch": (make_ir(1.6, 11, early=[(0.019, 0.5, -0.4), (0.031, 0.4, 0.5)]), 0.55), "cr": (make_ir(0.55, 12), 0.3), "bd": (make_ir(0.35, 13, hf=1.4), 0.18)}
    def ev(x, f, lufs, p=0.0, what="", bus="dry", lowpass=None):
        y = norm_to(x, lufs)
        if lowpass: y = lp(y, lowpass, 2)
        place(B[bus], pan(y, p) if np.ndim(y) == 1 else y, fr(f)); cue(fr(f), f"[{bus}] {what}")
    span = lambda a, b: (b - a) / FPS
    CH = [(91, 875), (1352, 2180)]; CR = [(0, 91), (875, 1352)]
    # ---- beds: ventilation rumble everywhere but the bedroom, the drone (cut to silence before the BANG and at the end)
    for a, b in CH: ev(D.vent(span(a, b), r), a, -28, 0, "chamber ventilation", "ch")
    for a, b in CR: ev(D.vent(span(a, b), r), a, -31, 0, "control-room ventilation", "cr")
    for a, b, f0, rise, lv in [(0, 860, 55.0, 0.04, -30), (948, 1405, 52.0, 0.08, -29), (1436, 2140, 49.0, 0.12, -27), (2196, 2250, 41.0, 0.3, -27)]:
        ev(D.drone(span(a, b), r, f0, rise), a, lv, 0, "tension drone")
    for f in range(130, 860, 83): ev(D.drip(r), f + int(20 * r.random()), -32, 0.6 * (r.random() - 0.5), "drip", "ch")
    for f in range(1440, 2170, 47): ev(D.drip(r), f + int(15 * r.random()), -30, 0.7 * (r.random() - 0.5), "drip in the flood", "ch")
    for f in (330, 720, 1250, 1600, 1980): ev(D.knock(r), f, -31, 0.7 * (r.random() - 0.5), "distant pipe knock", "ch")
    ev(ticks(span(2180, 2262), r, 1.0), 2180, -33, 0.3, "bedroom clock", "bd")
    # ---- HOOK (control room): gas roaring behind thick glass, breathing on the other side, the slam
    ev(D.riser(2.2, r), 0, -26, 0, "riser into the slam")
    ev(D.hiss(3.2, r), 0, -24, 0, "gas behind the glass (muffled)", "cr", lowpass=900)
    ev(D.breath(2.2, r, 0.9, 0.8), 0, -27, 0.1, "ragged breathing behind the glass", "cr", lowpass=1400)
    ev(D.glass_slam(r), 65, -12, 0.15, "HAND SLAMS THE GLASS", "cr")
    ev(D.sub_hit(r), 65, -16, 0, "sub hit")
    # ---- inside: the gas pours, five people breathe, eyes snap open
    ev(D.hiss(4.0, r), 91, -20, 0.35, "gas jets out of the vents", "ch")
    ev(D.hiss(3.4, r, 3500), 93, -23, -0.4, "second vent", "ch")
    for k in range(3): ev(D.breath(3.5, r, 0.7 + 0.15 * k, 0.6), 95 + 6 * k, -29, -0.5 + 0.5 * k, "panicked breathing", "ch")
    ev(D.cloth(r), 120, -30, 0.2, "they shift", "ch")
    ev(D.sub_hit(r, 1.2), 157, -20, 0, "snap-in hit")
    ev(D.strain(0.5, r, 900, 1500), 157, -30, 0, "a thin screech on the snap", "ch")
    # ---- the deal, days pass
    for k, f in enumerate([300, 315, 330, 345]): ev(D.rip(r, 0.12), f, -30, -0.2, f"calendar page {k + 2}", "ch")
    ev(D.cloth(r, 0.5), 268, -30, -0.2, "the wave", "ch")
    # ---- day 5: whispers in the grille (close), footsteps behind
    ev(D.whisper(span(402, 491), r), 402, -22, 0.35, "whispering into the grille", "ch")
    ev(D.whisper(span(455, 491), r, 7), 455, -25, -0.3, "a second whisperer", "ch")
    for k in range(3): ev(D.concrete_step(r), 455 + 7 * k, -28, -0.2, "the informer steps", "ch")
    # ---- day 9: laps on concrete, fists, the scream, the clock races, dead silence on "tore"
    for f in range(495, 629, 10): ev(D.concrete_step(r, 0.8), f, -24, 0.4 * np.sin(f / 20), "running footsteps", "ch")
    ev(D.pound(r, 9, 0.33), 540, -22, 0.2, "fists on the wall", "ch")
    ev(D.strain(span(535, 629), r), 535, -20, 0.1, "the scream (strained), cut dead on tore", "ch")
    ev(ticks(span(535, 612), r, 26.0), 535, -27, 0.5, "the clock races", "ch")
    ev(G.creak(span(612, 629), r, 60, 140), 612, -22, 0, "the rope strains and frays")
    ev(D.rip(r, 0.2), 627, -18, 0, "fibres pop")
    ev(G.whoosh(0.3, r, peak=0.2), 629, -20, 0, "the rope snaps and whips")
    ev(D.click(r), 629, -14, 0, "snap crack")
    ev(D.breath(span(632, 700), r, 0.4, 0.2), 632, -28, -0.2, "the calm ones breathing slowly", "ch")
    # ---- pages torn and slapped, the light dies
    for f, pn in ((728, -0.3), (741, 0.3), (757, -0.3), (772, 0.3), (783, -0.3)): ev(D.rip(r), f, -21, pn, "page ripped out of the book", "ch")
    for k in range(9): ev(D.slap(r), 797 + 9 * k, -20, 0.1, "page smeared and slapped on the glass (heard through it)", "cr", lowpass=2500)
    ev(D.cloth(r, 0.8), 792, -27, 0, "hands smearing", "cr", lowpass=2000)
    g = np.ones(ns(span(840, 875)))
    for k in range(len(g) // 2400): g[k * 2400:(k + 1) * 2400] *= 0.0 if k % 3 == 1 else 1.0
    ev(D.buzz(span(840, 875), r, 100.0, g), 840, -25, 0.2, "bulb stutters out", "ch")
    # ---- control room: 2 s of dead silence, then the BANG on the covered glass
    for f in (902, 918): ev(D.click(r), f, -30, 0.1, "taps the headphones", "cr")
    ev(D.glass_slam(r), 935, -11, -0.1, "BANG on the covered glass", "cr")
    ev(D.sub_hit(r), 935, -15, 0, "sub hit")
    ev(D.cloth(r, 0.3), 937, -24, 0.2, "the scientist flinches back", "cr")
    ev(D.breath(span(945, 1130), r, 0.6, 0.7), 945, -26, 0.2, "his breathing, shaky", "cr")
    ev(D.heartbeat(r, 92, 5), 1040, -22, 0, "heartbeat under the dial")
    ev(beeps(r, 3, 880, 0.3), 1100, -26, 0.3, "O2 alarm pips", "cr")
    ev(D.click(r), 1203, -22, -0.2, "mic switch", "cr")
    for f in (1160, 1168, 1176): ev(D.concrete_step(r, 0.3), f, -28, 0, "he steps to the mic", "cr")
    for k, pn in enumerate((-0.45, 0.45)): ev(G.rattle(0.25, r, density=60, heavy=True), 1217 + 3 * k, -20, pn, "rifle bolt", "cr")
    ev(bp_noise(span(1268, 1345), r), 1268, -30, -0.2, "speaker crackle", "cr")
    ev(D.drip(r), 1331, -29, 0.3, "the cigarette lands", "cr")
    # ---- the door: wheel, bolts, hinge, boots, they scream; a flash of the face
    ev(D.riser(1.4, r), 1366, -25, 0, "riser into the door")
    ev(D.metal_creak(0.5, r, 70, 95), 1352, -22, 0, "door wheel spins", "ch")
    ev(D.metal_clank(r, 0.8), 1366, -17, 0, "bolts release", "ch")
    ev(D.metal_creak(0.7, r, 45, 60), 1368, -21, 0, "door swings open", "ch")
    for k in range(4): ev(G.boot(r), 1380 + 6 * k, -25, 0.2 * (k % 2 - 0.5), "boots in the corridor", "ch")
    ev(D.sub_hit(r), 1407, -14, 0, "sub hit on the flash")
    ev(D.strain(1.0, r, 520, 980), 1405, -21, 0.15, "the soldiers scream", "ch")
    # ---- the flood, the begging, the gas back on
    ev(G.water_bed(span(1436, 2180), r, close=0.8), 1436, -29, 0, "flood water", "ch")
    ev(D.heartbeat(r, 58, 4), 1440, -26, 0, "slow heartbeat")
    for k in range(4): ev(D.breath(span(1550, 1711), r, 0.35 + 0.1 * k, 0.9), 1550 + 9 * k, -28, -0.6 + 0.4 * k, "four of them breathing, wet and ragged", "ch")
    ev(D.whisper(span(1627, 1711), r, 4), 1627, -23, 0.2, "they beg", "ch")
    ev(D.hiss(1.4, r), 1686, -20, -0.35, "the gas comes back on", "ch")
    # ---- sealed in, the shot
    for f in range(1715, 1800, 14): ev(D.water_step(r), f + int(5 * r.random()), -27, 0.4 * (r.random() - 0.5), "steps in the water", "ch")
    ev(D.cloth(r, 0.5), 1797, -22, -0.2, "the shove", "ch")
    ev(D.metal_creak(0.7, r, 60, 90), 1798, -21, 0, "door swings shut", "ch")
    ev(D.metal_clank(r, 1.3), 1820, -14, 0, "the door clangs shut", "ch")
    ev(D.cloth(r, 0.3), 1866, -22, 0.2, "pistol drawn from the coat", "ch")
    ev(D.click(r), 1880, -26, 0.2, "hammer cocked", "ch")
    ev(D.gunshot(r), 1903, -10, 0.1, "GUNSHOT", "ch")
    ev(D.sub_hit(r, 1.5), 1903, -17, 0)
    ev(ring(1.8, r), 1906, -31, 0, "ears ringing")
    ev(D.water_step(r), 1914, -25, 0, "the body hits the water (off screen)", "ch")
    ev(D.tinroll(1.5, r), 1915, -26, -0.2, "the cap rolls", "ch")
    # ---- the smile, the flicker, lights out
    ev(D.riser(1.3, r), 2001, -26, 0, "riser into the smile")
    ev(D.sub_hit(r, 1.4), 2040, -17, 0, "snap-in hit")
    ev(D.breath(span(2045, 2140), r, 0.3, 0.3), 2045, -24, 0, "slow, calm breathing (too calm)", "ch")
    g = np.ones(ns(span(2060, 2142)))
    for k in range(len(g) // 4800): g[k * 4800:(k + 1) * 4800] *= 0.15 if (k * 7) % 11 < 3 else 1.0
    ev(D.buzz(span(2060, 2142), r, 100.0, g), 2060, -26, 0.2, "the bulb flickers", "ch")
    ev(D.click(r), 2142, -20, 0.2, "lights out", "ch")
    ev(boom(r, 0.35, 1.4), 2144, -24, 0, "low drop into the dark")
    # ---- bedroom: the lamp, a creak under the bed, the eyes lunge, then nothing
    ev(D.breath(span(2182, 2262), r, 0.22, 0.05), 2182, -31, -0.1, "a child asleep", "bd")
    ev(D.click(r), 2188, -18, 0.35, "lamp click", "bd")
    ev(D.metal_creak(1.0, r, 30, 38), 2203, -25, -0.1, "bed springs: something under the bed", "bd")
    ev(D.breath(1.2, r, 1.1, 0.9), 2210, -27, -0.1, "breathing under the bed", "bd")
    ev(D.riser(0.9, r), 2222, -24, 0, "riser")
    ev(D.strain(0.35, r, 1100, 1900), 2250, -16, 0, "SCREECH as the eyes lunge", "bd")
    ev(D.sub_hit(r), 2250, -13, 0, "final sub hit")
    S = B["dry"]
    for k, (ir, w) in WET.items(): S = S + B[k] + w * convolve_st(B[k], ir)
    S[:, ns(fr(2262)):] *= np.exp(-np.arange(N - ns(fr(2262))) / (0.25 * SR))[None, :]  # the cut to black swallows it
    return S


def bp_noise(dur, r):
    from dsp import bp
    n = ns(dur); x = bp(r.standard_normal(n), 800, 3500)
    return x * (r.random(n) < 0.3) * 0.6


def ring(dur, r):
    n = ns(dur); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 3800 * t) * np.exp(-t / 0.9) * 0.3


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
    S = S * dbg(Lv - 13.0 - integrated(S) - 2.0)  # horror cut: SFX 4 dB above the house -6 (user asked for more realistic, present sound)
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
