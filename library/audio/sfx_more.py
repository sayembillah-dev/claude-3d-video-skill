# More synthesized one-shots for the shared sound kit (first made for the animal-court short): pop, camera shutter,
# flash whine, monkey hoot, hen cluck / bawk, rat squeak, cat meow, paper thump, church bell, sad trombone, room tone.
# All original numpy/scipy synthesis, mono unless noted; 48 kHz (dsp.SR).
import numpy as np
from scipy import signal
from dsp import SR, TAU, ns, tt, lp, hp, bp, peq, colored, fades, phase, modal, st
import instruments as I
import sfx_gen as G


def pop(r, f0=520):
    t = tt(0.18)
    f = f0 * (1 + 1.4 * np.exp(-t / 0.012))
    y = np.sin(phase(f)) * np.exp(-t / 0.045) + 0.3 * hp(r.standard_normal(len(t)), 2000) * np.exp(-t / 0.004)
    return fades(y, 0.0005, 0.02)


def shutter(r):
    t = tt(0.16)
    y = np.zeros(len(t))
    for k, (dt, a) in enumerate([(0.0, 1.0), (0.055, 0.7)]):
        tl = np.clip(t - dt, 0, None)
        y += a * (t >= dt) * (bp(r.standard_normal(len(t)), 1500, 9000, 2) * np.exp(-tl / 0.004)
                              + 0.6 * modal(0.16, [(2300 + 400 * k, 0.6, 0.01), (4100, 0.3, 0.006)], r) * (t >= dt))
    return fades(y, 0.0, 0.01)


def flash_whine(r, dur=0.7):
    t = tt(dur)
    f = 2400 + 3800 * (t / dur)
    return fades(np.sin(phase(f)) * 0.12 * np.exp(-((t - dur * 0.6) / (dur * 0.35)) ** 2), 0.01, 0.05)


def hoot(r, f0=420, n=2):
    out = []
    for k in range(n):
        d = 0.22
        t = tt(d)
        f = f0 * (1 + 0.9 * (t / d)) * (1 + 0.02 * np.sin(TAU * 7 * t))
        y = np.sin(phase(f)) + 0.35 * np.sin(2 * phase(f)) + 0.12 * np.sin(3 * phase(f))
        out.append(fades(y * np.sin(np.pi * t / d) ** 1.2, 0.005, 0.02))
        out.append(np.zeros(ns(0.07)))
    return lp(np.concatenate(out), 3000)


def cluck(r, f0=None, n=None):
    f0 = f0 or r.uniform(380, 560)
    out = np.zeros(ns(0.8))
    tm = 0.0
    for k in range(n or r.integers(2, 4)):
        d = r.uniform(0.05, 0.09)
        t = tt(d)
        f = f0 * (1.25 - 0.4 * t / d) * r.uniform(0.95, 1.08)
        src = signal.sawtooth(phase(f)) * np.sin(np.pi * t / d) ** 0.8
        y = bp(src, 600, 2600, 2) + 0.6 * peq(src, 1400, 8, 2.0) * 0.2
        G._place_mono(out, y * r.uniform(0.6, 1.0), tm)
        tm += d + r.uniform(0.05, 0.12)
    return out


def bawk(r, f0=520):
    d = 0.42
    t = tt(d)
    f = f0 * np.interp(t, [0, 0.06, 0.3, d], [0.9, 1.5, 1.2, 0.8])
    src = signal.sawtooth(phase(f)) * np.interp(t, [0, 0.03, 0.3, d], [0, 1, 0.8, 0])
    return fades(bp(src, 500, 3200, 2) + 0.4 * peq(src, 1800, 10, 2.5) * 0.15, 0.003, 0.03)


def squeak(r):
    d = r.uniform(0.07, 0.12)
    t = tt(d)
    f = r.uniform(3200, 4200) * (1 + 0.35 * np.sin(np.pi * t / d))
    return fades(np.sin(phase(f)) * np.sin(np.pi * t / d) ** 1.5, 0.002, 0.01)


def meow(r, f0=520):
    d = 0.75
    t = tt(d)
    f = f0 * np.interp(t, [0, 0.15, 0.45, d], [0.85, 1.35, 1.2, 0.75])
    src = signal.sawtooth(phase(f * (1 + 0.012 * np.sin(TAU * 6 * t))))
    formant = np.interp(t, [0, 0.2, 0.5, d], [900, 1900, 1600, 800])
    y = np.zeros(len(t))
    for a, b_ in [(0, 0.25), (0.25, 0.5), (0.5, 1.0)]:
        seg = slice(int(a * len(t)), int(b_ * len(t)))
        fc = float(np.mean(formant[seg]))
        y[seg] = bp(src, fc * 0.6, fc * 1.6, 2)[seg]
    env = np.interp(t, [0, 0.05, 0.6, d], [0, 1, 0.7, 0])
    return fades(lp(y, 4500) * env, 0.004, 0.05)


def thump(r, big=1.0):
    t = tt(0.6)
    body = np.sin(phase(70 * (1 + 0.6 * np.exp(-t / 0.02)))) * np.exp(-t / 0.09)
    paper = bp(r.standard_normal(len(t)), 1200, 7000, 2) * np.exp(-t / 0.05) * 0.6
    return fades((body * 1.2 + paper) * big, 0.0, 0.05)


def bell(r, f=330):
    return fades(modal(4.5, [(f, 1.0, 1.6), (f * 2.0, 0.5, 1.0), (f * 2.4, 0.35, 0.8), (f * 3.0, 0.3, 0.5), (f * 4.2, 0.15, 0.3), (f * 0.5, 0.4, 2.2)], r), 0.002, 0.3)


def sad_trombone(r, t0):
    m = []
    for k, (note, d) in enumerate([(58, 0.32), (57, 0.32), (56, 0.32), (55, 0.9)]):
        m.append((t0 + sum(x[1] for x in [(58, .32), (57, .32), (56, .32)][:k]), note, d))
    out = np.zeros(ns(3.0))
    for tm, note, d in m:
        y = I.brass(I.m2f(note), d, 0.55, r, kind="soft", fall=0.6 if d > 0.5 else 0.0)
        G._place_mono(out, y, tm - t0)
    return out


def room(dur, r, level=1.0):
    return st(lp(colored(ns(dur), r, 1.2), 500, 2) * level)


