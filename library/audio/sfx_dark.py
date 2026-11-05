# Dark / thriller one-shots and beds (first made for "sleep-experiment"). Mono numpy arrays at SR unless noted.
#   hiss(dur, r)          gas hiss from a vent (band noise, quick swell)       whisper(dur, r)     breathy wordless whispering
#   pound(r, n, gap)      muffled fists on a padded wall                       strain(dur, r)      a rising strained tone (a scream, but not a voice)
#   rip(r)                paper tearing                                         slap(r)             a page slapped on glass
#   metal_clank(r, big)   heavy steel door / wheel clank                       metal_creak(dur, r) a slow heavy-hinge groan
#   gunshot(r)            one indoor pistol shot with a short room tail         click(r)            a lamp / switch click
#   buzz(dur, r, f0)      mains buzz of a failing bulb (flicker by gating)      drip(r)             one water drop
#   heartbeat(r, bpm, n)  low double thumps                                     tinroll(dur, r)     a small object rolling on a wet floor
import numpy as np
from scipy import signal
from dsp import SR, ns, lp, hp, bp, colored, smooth_noise, reson

def _env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(d, 1e-4))

def hiss(dur, r, bright=4500):
    n = ns(dur); t = np.arange(n) / SR
    x = bp(r.standard_normal(n), 1800, bright, 2) + 0.3 * hp(r.standard_normal(n), 6000, 2)
    sw = np.minimum(1, t / 0.12) * np.minimum(1, (dur - t) / 0.4) * (0.85 + 0.15 * smooth_noise(n, r, 3))
    return x * sw * 0.5

def whisper(dur, r, rate=5.5):
    n = ns(dur)
    x = bp(r.standard_normal(n), 900, 5200, 2)
    x = reson(x, 1400 + 400 * r.random(), 3) * 0.6 + x * 0.6
    syl = np.clip(smooth_noise(n, r, rate) * 1.6 - 0.2, 0, 1) ** 1.5
    t = np.arange(n) / SR
    return x * syl * np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.1) * 0.6

def pound(r, n=6, gap=0.32):
    out = np.zeros(ns(n * gap + 0.6))
    for k in range(n):
        m = ns(0.35); t = np.arange(m) / SR
        h = np.sin(2 * np.pi * (70 + 20 * r.random()) * t) * np.exp(-t / 0.06) + lp(r.standard_normal(m), 400) * np.exp(-t / 0.03) * 0.8
        s = ns(k * gap + 0.04 * r.random()); out[s:s + m] += h * (0.7 + 0.3 * r.random())
    return lp(out, 900)

def strain(dur, r, f0=420, f1=900):
    n = ns(dur); t = np.arange(n) / SR
    f = f0 + (f1 - f0) * (t / dur) ** 0.7 + 18 * np.sin(2 * np.pi * 6.5 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.tanh(2.5 * (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3.01 * ph)))
    x = bp(x, 300, 3500, 2) + 0.15 * bp(r.standard_normal(n), 1500, 4000) * np.abs(np.sin(ph))
    return x * np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.02) * 0.4

def rip(r, dur=0.45):
    n = ns(dur); t = np.arange(n) / SR
    crack = (r.random(n) < 0.02 + 0.1 * (t / dur)).astype(float) * r.standard_normal(n)
    x = hp(crack, 1200) * 1.5 + bp(r.standard_normal(n), 2000, 7000) * 0.3
    return x * np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.05)

def slap(r):
    m = ns(0.25); t = np.arange(m) / SR
    return (lp(r.standard_normal(m), 2500) * np.exp(-t / 0.025) + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.04) * 0.5)

def metal_clank(r, big=1.0):
    m = ns(1.6 * big); t = np.arange(m) / SR
    modes = [(110, 0.9, 0.5), (243, 0.6, 0.35), (517, 0.45, 0.25), (911, 0.3, 0.15), (1630, 0.2, 0.08)]
    x = sum(a * np.sin(2 * np.pi * f * (1 + 0.003 * r.standard_normal()) * t) * np.exp(-t / (d * big)) for f, a, d in modes)
    x += lp(r.standard_normal(m), 1500) * np.exp(-t / 0.02) * 1.2
    return x * 0.6

def metal_creak(dur, r, f0=55, f1=80):
    n = ns(dur); t = np.arange(n) / SR
    f = f0 + (f1 - f0) * t / dur
    pulses = signal.sawtooth(2 * np.pi * np.cumsum(f * (1 + 0.2 * smooth_noise(n, r, 4))) / SR, 0.1)
    x = reson(pulses, 330, 6) + reson(pulses, 760, 8) * 0.6 + reson(pulses, 1450, 10) * 0.3
    return x * np.minimum(1, t / 0.1) * np.minimum(1, (dur - t) / 0.2) * 0.25

def gunshot(r):
    m = ns(1.8); t = np.arange(m) / SR
    crack = r.standard_normal(m) * np.exp(-t / 0.008) * 2.0
    body = lp(r.standard_normal(m), 1800) * np.exp(-t / 0.06) * 1.2 + np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t / 0.08) + 40) / SR) * np.exp(-t / 0.12)
    tail = lp(r.standard_normal(m), 1200) * np.exp(-t / 0.5) * 0.25 * np.minimum(1, t / 0.03)
    return np.tanh(crack + body + tail)

def click(r):
    m = ns(0.06); t = np.arange(m) / SR
    return hp(r.standard_normal(m), 2500) * np.exp(-t / 0.004) + np.sin(2 * np.pi * 2200 * t) * np.exp(-t / 0.006) * 0.4

def buzz(dur, r, f0=100.0, gate=None):
    n = ns(dur); t = np.arange(n) / SR
    x = signal.sawtooth(2 * np.pi * f0 * t) * 0.5 + signal.square(2 * np.pi * 2 * f0 * t) * 0.15
    x = bp(x, 150, 3000)
    g = np.ones(n) if gate is None else gate
    return x * g * np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.05) * 0.3

def drip(r):
    m = ns(0.18); t = np.arange(m) / SR
    f = 900 + 1600 * (1 - np.exp(-t / 0.02)) + 300 * r.random()
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035) * np.minimum(1, t / 0.001)

def heartbeat(r, bpm=60, n=4):
    gap = 60 / bpm; out = np.zeros(ns(n * gap + 0.5))
    for k in range(n):
        for d, a in ((0, 1.0), (0.22, 0.7)):
            m = ns(0.25); t = np.arange(m) / SR
            h = np.sin(2 * np.pi * 48 * t) * np.exp(-t / 0.07) * a
            s = ns(k * gap + d); out[s:s + m] += h
    return lp(out, 200)

def tinroll(dur, r):
    n = ns(dur); t = np.arange(n) / SR
    hits = (r.random(n) < 0.0016).astype(float) * (0.5 + 0.5 * r.random(n))
    x = reson(hits, 1900, 20) + reson(hits, 3100, 25) * 0.6 + bp(r.standard_normal(n), 300, 1500) * 0.05
    return x * np.minimum(1, (dur - t) / 0.3)

# ---- realism pass (sleep-experiment v2): foley, room air and tension
#   concrete_step(r, scuff)  heel thud + grit on concrete          water_step(r)        a foot in ankle-deep water
#   breath(dur, r, rate, ragged)  heavy breathing (in / out cycles)   cloth(r, dur)        a sleeve / coat rustle
#   vent(dur, r)            ventilation rumble + mains hum           drone(dur, r, f0)    a low dissonant tension drone
#   riser(dur, r)           a rising noise + tone swell into a scare  sub_hit(r)           a deep sub drop for jump scares
#   glass_slam(r)           a palm slammed on thick glass            knock(r)             a distant pipe knock
def concrete_step(r, scuff=0.5):
    m = ns(0.35); t = np.arange(m) / SR
    heel = np.sin(2 * np.pi * np.cumsum(r.uniform(70, 95) * (1 + 0.3 * np.exp(-t / 0.01))) / SR) * np.exp(-t / 0.025)
    grit = bp(r.standard_normal(m), 1500, 7000) * np.exp(-t / 0.012) * 0.5
    sc = bp(r.standard_normal(m), 800, 4000) * np.clip(t / 0.03, 0, 1) * np.exp(-t / 0.09) * 0.3 * scuff
    return heel * 0.8 + grit + sc

def water_step(r):
    m = ns(0.6); t = np.arange(m) / SR
    sl = bp(r.standard_normal(m), 300, 2500) * np.exp(-t / 0.06) * np.minimum(1, t / 0.008)
    drops = (r.random(m) < 0.002 * np.exp(-t / 0.2)).astype(float)
    pl = sum(reson(drops, f, 30) for f in (900, 1400, 2100)) * 0.4
    return sl + pl + np.pad(concrete_step(r, 0.1) * 0.3, (0, m - ns(0.35)))

def breath(dur, r, rate=0.5, ragged=0.5):
    n = ns(dur); t = np.arange(n) / SR
    ph = (t * rate + 0.3 * ragged * smooth_noise(n, r, 1.5)) % 1.0
    env = np.where(ph < 0.4, np.sin(np.pi * ph / 0.4) ** 2 * 0.7, np.abs(np.sin(np.pi * (ph - 0.4) / 0.6)) ** 1.5)
    env *= 1 + ragged * 0.6 * np.clip(smooth_noise(n, r, 9), -1, 1)
    x = bp(r.standard_normal(n), 350, 2600) + 0.4 * reson(r.standard_normal(n), 900, 4) * 0.1
    return x * env * np.minimum(1, t / 0.2) * np.minimum(1, (dur - t) / 0.2) * 0.5

def cloth(r, dur=0.4):
    n = ns(dur); t = np.arange(n) / SR
    x = bp(r.standard_normal(n), 900, 6000) * np.clip(smooth_noise(n, r, 30) * 1.5, 0, 1)
    return x * np.sin(np.pi * t / dur) * 0.6

def vent(dur, r):
    n = ns(dur); t = np.arange(n) / SR
    rum = lp(colored(n, r, 2.0), 160, 2) * 3.0
    hm = 0.08 * (np.sin(2 * np.pi * 50 * t) + 0.5 * np.sin(2 * np.pi * 100 * t) + 0.25 * np.sin(2 * np.pi * 150 * t))
    air = bp(r.standard_normal(n), 300, 1200) * 0.08 * (1 + 0.3 * smooth_noise(n, r, 0.3))
    return (rum + hm + air) * np.minimum(1, t / 1.0) * np.minimum(1, (dur - t) / 1.0)

def drone(dur, r, f0=55.0, rise=0.0):
    n = ns(dur); t = np.arange(n) / SR
    f = f0 * (1 + rise * t / dur)
    x = sum(a * np.sin(2 * np.pi * np.cumsum(f * m * (1 + 0.002 * smooth_noise(n, r, 0.2))) / SR) for m, a in ((1, 1), (1.06, 0.7), (1.5, 0.35), (2.13, 0.2)))
    x += 0.25 * bp(r.standard_normal(n), 80, 400) * (0.6 + 0.4 * smooth_noise(n, r, 0.25))
    return x * np.minimum(1, t / 2.0) * np.minimum(1, (dur - t) / 1.0) * 0.4

def riser(dur, r):
    n = ns(dur); t = np.arange(n) / SR
    u = t / dur
    nz = r.standard_normal(n)
    sweep = signal.sosfilt(signal.butter(2, [300, 6000], "bp", fs=SR, output="sos"), nz) * u ** 2
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * u ** 2) / SR) * u ** 3 * 0.5
    return (sweep + tone) * np.minimum(1, (dur - t) / 0.01)

def sub_hit(r, dur=2.0):
    n = ns(dur); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t / 0.25) + 28) / SR) * np.exp(-t / 0.7)
    x += lp(r.standard_normal(n), 900) * np.exp(-t / 0.05) * 0.8
    return np.tanh(1.6 * x)

def glass_slam(r):
    m = ns(1.2); t = np.arange(m) / SR
    thud = np.sin(2 * np.pi * np.cumsum(110 * np.exp(-t / 0.03) + 60) / SR) * np.exp(-t / 0.08)
    slap = lp(r.standard_normal(m), 3000) * np.exp(-t / 0.02)
    ring = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in ((1870, 0.12, 0.25), (2930, 0.08, 0.18), (4410, 0.05, 0.1)))
    rattle = bp(r.standard_normal(m), 2000, 6000) * (np.sin(2 * np.pi * 37 * t) > 0.6) * np.exp(-t / 0.15) * 0.25
    return thud + slap + ring + rattle

def knock(r):
    return lp(metal_clank(r, 0.35), 1800) * 0.8
