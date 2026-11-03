# More synthesized one-shots for the shared sound kit (first made for the animal-court short): pop, camera shutter,
# flash whine, monkey hoot, hen cluck / bawk, rat squeak, cat meow, paper thump, church bell, sad trombone, room tone; teleport: zap, hum, boom, ticks, grind, beeps.
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




# ---- first made for the teleport short: sci-fi / comic one-shots (zap, hum, boom, ticks, grind, beeps)
def zap(r, up=True, dur=0.45):
    """teleport zap: a fast sine sweep with a buzzy tremolo and a sparkle tail"""
    n = ns(dur); t = np.arange(n) / SR
    f = (300 * (8 ** (t / dur))) if up else (2400 * (0.125 ** (t / dur)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * t))) + 0.25 * np.sin(3 * ph)
    env = np.minimum(1, t / 0.01) * np.exp(-t / (dur * 0.45))
    sp = np.random.default_rng(int(r.integers(1 << 30))).standard_normal(n) * np.exp(-t / 0.08) * 0.2
    return (x * env + sp * env) * 0.6

def hum(dur, r, f0=110):
    """scanner hum: detuned saws with a slow wobble, rising in pitch"""
    n = ns(dur); t = np.arange(n) / SR
    f = f0 * (1 + 0.6 * t / dur)
    x = sum(signal.sawtooth(2 * np.pi * np.cumsum(f * d) / SR) for d in (1.0, 1.007, 2.003)) / 3
    x = signal.sosfilt(signal.butter(2, 1800, "lp", fs=SR, output="sos"), x)
    return x * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * t)) * np.minimum(1, t / 0.3) * np.minimum(1, (dur - t) / 0.15)

def boom(r, big=1.0, dur=2.6):
    """cartoon explosion: low thump + noise blast decaying through a closing low-pass"""
    n = ns(dur); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * np.cumsum(55 * np.exp(-t / 0.35) + 30) / SR) * np.exp(-t / (0.5 * big))
    no = r.standard_normal(n) * np.exp(-t / (0.35 * big))
    no = signal.sosfilt(signal.butter(2, 900, "lp", fs=SR, output="sos"), no) * 1.4
    return (low + no) * np.minimum(1, t / 0.004)

def ticks(dur, r, rate=12.0):
    """a clock ticking very fast"""
    S = np.zeros(ns(dur)); k = 0
    while k / rate < dur - 0.05:
        c = G.clink(r, 2200 if k % 2 else 1700, 0.04); i = ns(k / rate); S[i:i + len(c)] += c[: len(S) - i]; k += 1
    return S

def grind(dur, r, jam=False):
    """shredder / fax motor: a buzzing motor tone plus paper crunch"""
    n = ns(dur); t = np.arange(n) / SR
    f = 95 * (1 - (0.35 * t / dur if jam else 0))
    m = signal.square(2 * np.pi * np.cumsum(f) / SR) * 0.3
    crunch = G.rattle(dur, r, density=40 if not jam else 18, heavy=jam)[:n]
    crunch = np.pad(crunch, (0, n - len(crunch)))
    return (m + crunch) * np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.05)

def beeps(r, n=3, f=1400, gap=0.16):
    S = np.zeros(ns(gap * n + 0.2)); t = np.arange(ns(0.09)) / SR
    for k in range(n):
        b = np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.004) * np.minimum(1, (0.09 - t) / 0.01); i = ns(k * gap); S[i:i + len(b)] += b
    return S * 0.5
