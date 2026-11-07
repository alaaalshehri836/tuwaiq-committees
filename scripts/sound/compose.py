#!/usr/bin/env python3
"""
Tuwaiq Club — original score + sound design for the cinematic video.

Everything here is synthesized from scratch (no samples, no third-party
music), so the soundtrack is 100% original and royalty-free by construction.

Every sound is placed on the real animation timeline: cue times come from
scripts/sound/cues.json, which scripts/export-cues.mjs reads directly from the
GSAP master timeline (labels named `cue:*`). Change the video timing, re-run
`npm run render:audio`, and the sound follows automatically.

Output:
  video/audio/tuwaiq-soundtrack.wav              mastered stereo mix (48 kHz)
  video/tuwaiq-committees-1080p-audio.mp4        H.264 (copied) + AAC 256 kb/s
  video/tuwaiq-committees-web-720p-audio.mp4     H.264 (copied) + AAC 160 kb/s
"""
import json
import os
import subprocess

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SR = 48000
DATA = json.load(open(os.path.join(ROOT, 'scripts/sound/cues.json')))
DUR = float(DATA['duration'])
LABELS = DATA['labels']
N = int(round(DUR * SR))
rng = np.random.default_rng(1448)


def cue(name):
    return float(LABELS.get('cue:' + name, LABELS.get(name)))


# ------------------------------------------------------------------ mix level knobs
LEVEL = {
    'ambience': 1.0,
    'music': 1.0,
    'sfx': 1.0,
}
TARGET_LUFS = -14.0  # social / mobile friendly
TRUE_PEAK = -1.5

# ------------------------------------------------------------------ helpers


def ns(d):
    """Sample count for a duration (same rounding everywhere)."""
    return int(round(d * SR))


def secs(d):
    return np.arange(ns(d)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def sos(kind, f, order=2):
    return signal.butter(order, f, kind, fs=SR, output='sos')


def lp(x, f, order=2):
    return signal.sosfilt(sos('lowpass', min(f, SR * 0.45), order), x)


def hp(x, f, order=2):
    return signal.sosfilt(sos('highpass', f, order), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(sos('bandpass', [lo, min(hi, SR * 0.45)], order), x)


def noise(d):
    return rng.standard_normal(ns(d))


def sweep_bp(x, f_curve, width=0.9, block=256):
    """Band-pass whose centre frequency follows f_curve (Hz per sample)."""
    y = np.zeros_like(x)
    zi = np.zeros((2, 2))
    for i in range(0, len(x), block):
        f = float(np.clip(f_curve[min(i, len(f_curve) - 1)], 40, SR * 0.4))
        lo, hi = f / (1 + width), min(f * (1 + width), SR * 0.45)
        s = sos('bandpass', [lo, hi], 2)
        y[i:i + block], zi = signal.sosfilt(s, x[i:i + block], zi=zi)
    return y


def sweep_lp(x, f_curve, block=256):
    y = np.zeros_like(x)
    zi = np.zeros((1, 2))
    for i in range(0, len(x), block):
        f = float(np.clip(f_curve[min(i, len(f_curve) - 1)], 60, SR * 0.45))
        s = sos('lowpass', f, 2)
        y[i:i + block], zi = signal.sosfilt(s, x[i:i + block], zi=zi)
    return y


def env(n, attack=0.005, release=0.05, curve=1.0):
    """Attack/release envelope over n samples."""
    e = np.ones(n)
    a = min(ns(attack), n)
    r = min(ns(release), n - a)
    if a:
        e[:a] = np.linspace(0, 1, a) ** curve
    if r:
        e[n - r:] = np.linspace(1, 0, r) ** curve
    return e


def decay(n, tau, attack=0.002):
    t = np.arange(n) / SR
    e = np.exp(-t / tau)
    a = min(ns(attack), n)
    if a:
        e[:a] *= np.linspace(0, 1, a)
    return e


def mx(*parts):
    """Sum mono signals of different lengths (zero-padded)."""
    n = max(len(x) for x in parts)
    out = np.zeros(n)
    for x in parts:
        out[:len(x)] += x
    return out


def pan_gains(p):
    a = (np.clip(p, -1, 1) + 1) * np.pi / 4
    return np.cos(a) * np.sqrt(2), np.sin(a) * np.sqrt(2)


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, start, pan=0.0, gain=1.0):
        """Add mono (pan scalar or per-sample array) or stereo signal at time `start`."""
        sig = np.asarray(sig, dtype=float)
        if sig.ndim == 1:
            gl, gr = pan_gains(pan)
            sig = np.vstack([sig * gl, sig * gr])
        i0 = ns(start)
        if i0 < 0:
            sig, i0 = sig[:, -i0:], 0
        n = min(sig.shape[1], N - i0)
        if n > 0:
            self.x[:, i0:i0 + n] += sig[:, :n] * gain


def moving_pan(n, p0, p1):
    return np.linspace(p0, p1, n)


def make_ir(rt60, length, damp_hz, seed):
    r = np.random.default_rng(seed)
    t = secs(length)
    e = 10 ** (-3 * t / rt60)
    pre = ns(0.018)
    ir = []
    for _ in range(2):
        nz = r.standard_normal(len(t)) * e
        nz = lp(nz, damp_hz, 1)
        nz = np.concatenate([np.zeros(pre), nz])
        ir.append(nz / np.sqrt(np.sum(nz ** 2)))
    return np.array(ir)


def reverb(x, ir, wet):
    out = np.zeros_like(x)
    for c in range(2):
        out[c] = signal.fftconvolve(x[c], ir[c])[:N]
    return x * (1 - wet * 0.3) + out * wet


# ------------------------------------------------------------------ instruments


def saw_voices(freq, d, cents=(-7, 0, 7)):
    t = secs(d)
    out = np.zeros(len(t))
    for c in cents:
        f = freq * 2 ** (c / 1200)
        out += signal.sawtooth(2 * np.pi * f * t + rng.uniform(0, 6.28))
    return out / len(cents)


def bell(freq, d=2.5, bright=1.0):
    t = secs(d)
    partials = [(1, 1.0, 1.0), (2.76, 0.45 * bright, 0.55), (5.40, 0.22 * bright, 0.32), (8.93, 0.10 * bright, 0.2)]
    out = np.zeros(len(t))
    for ratio, amp, dec in partials:
        f = freq * ratio
        if f < SR * 0.45:
            out += amp * np.sin(2 * np.pi * f * t) * np.exp(-t / (d * 0.35 * dec))
    return out * env(len(t), 0.002, 0.05)


def fm_pluck(freq, d=0.45, index=2.6):
    t = secs(d)
    mod = index * np.exp(-t / 0.07) * np.sin(2 * np.pi * freq * 2 * t)
    return np.sin(2 * np.pi * freq * t + mod) * decay(len(t), 0.16, 0.003)


def pulse_blip(freq, d=0.06):
    t = secs(d)
    sq = sum(np.sin(2 * np.pi * freq * k * t) / k for k in (1, 3, 5, 7))
    return sq * env(len(t), 0.002, 0.03)


def thump(f0=75, f1=40, d=0.5, tau=0.16):
    t = secs(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.045)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) + 0.25 * np.sin(2 * ph)  # 2nd harmonic: audible on phone speakers
    return body * decay(len(t), tau, 0.002)


def click(d=0.02, lo=2500, hi=8000):
    n = noise(d)
    return bp(n, lo, hi) * decay(len(n), d / 4, 0.0005)


def kick():
    k = thump(130, 46, 0.45, 0.13)
    k[: ns(0.004)] += click(0.004, 1500, 6000)[: ns(0.004)] * 0.6
    return k


def hat(d=0.05):
    n = noise(d)
    return hp(n, 7000) * decay(len(n), 0.012, 0.0005)


def snare(d=0.18):
    n = noise(d)
    t = secs(d)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.03)
    return (bp(n, 900, 6000) * decay(len(n), 0.05) * 0.9 + tone * 0.5)


def whoosh(d, f0, f1, shape='bell', width=0.8):
    n = noise(d)
    u = np.linspace(0, 1, len(n))
    if shape == 'bell':
        a = np.sin(np.pi * u) ** 2
        f = f0 * (f1 / f0) ** np.sin(np.pi * u * 0.5)
    elif shape == 'rise':
        a = u ** 2.4
        f = f0 * (f1 / f0) ** u
    else:  # 'fall'
        a = np.sin(np.pi * np.minimum(u * 1.6, 1) * 0.5) * (1 - u) ** 1.2
        f = f0 * (f1 / f0) ** u
    return sweep_bp(n, f, width) * a


def ease_inout3_velocity(n):
    u = np.linspace(0, 1, n)
    v = np.where(u < 0.5, 12 * u ** 2, 3 * (2 - 2 * u) ** 2)
    return v / v.max()


def door_motor(d, intensity=1.0, seed_pan=0.0):
    """Deep mechanical door movement shaped by the leaf's velocity (power3.inOut)."""
    n = ns(d)
    v = ease_inout3_velocity(n)
    t = np.arange(n) / SR
    f = 44 + 20 * v
    ph = 2 * np.pi * np.cumsum(f) / SR
    hum = signal.sawtooth(ph)
    low = lp(hum, 240, 2) * (0.15 + 0.85 * v ** 0.8)
    mid = lp(hum, 900, 2) * 0.25 * v
    whine = np.sin(2 * np.pi * np.cumsum(320 + 300 * v) / SR) * 0.06 * v
    grind = bp(noise(d), 1300, 3800) * (0.55 + 0.45 * np.sin(2 * np.pi * 21 * t)) * 0.10 * v
    return (low + mid + whine + grind) * intensity * env(n, 0.02, 0.08)


def metal_ring(d=0.9, base=420, gain=1.0):
    t = secs(d)
    out = np.zeros(len(t))
    for r, a in ((1.0, 1.0), (2.32, 0.6), (3.87, 0.4), (5.12, 0.25)):
        out += a * np.sin(2 * np.pi * base * r * t) * np.exp(-t / (0.18 / r ** 0.3))
    return out * gain


# ------------------------------------------------------------------ buses
amb = Bus()
music = Bus()      # dry music (pad, bass, drums)
music_wet = Bus()  # music sent to the hall reverb (pad, arp, bells)
sfx = Bus()
sfx_wet = Bus()

T = {k: cue(k) for k in ('logo', 'glow', 'seam', 'leaves', 'push', 'veil', 'pullBack', 'leavesAll',
                         'paths', 'join', 'lightsFlash', 'registration', 'endCard', 'endItems', 'fadeOut')}
T['hall'] = float(LABELS['hall'])
MOVES = [cue(f'move-{i}') for i in range(5)]
REVEALS = [cue(f'reveal-{i}') for i in range(5)]
RISES = [cue(f'doorRise-{i}') for i in range(5)]
DOOR_PAN = [0.55, 0.28, 0.0, -0.28, -0.55]  # RTL: committee 1 is the right-most door

# Musical grid: one bar per committee highlight (4 beats) → downbeats land on each reveal sequence.
BAR = MOVES[1] - MOVES[0]
BEAT = BAR / 4
GRID0 = MOVES[0]


def beat(k):
    return GRID0 + k * BEAT


# ================================================================== AMBIENCE (whole film)
n_all = N
t_all = np.arange(n_all) / SR
air = bp(rng.standard_normal(n_all), 180, 2400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t_all))
drone = (np.sin(2 * np.pi * 36.71 * t_all) + 0.55 * np.sin(2 * np.pi * 73.42 * t_all + 0.3)
         + 0.25 * np.sin(2 * np.pi * 110.0 * t_all) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t_all)))
amb_env = np.clip(t_all / 1.2, 0, 1)
amb_env *= np.interp(t_all, [0, T['registration'] - 0.5, T['registration'], T['endCard'], DUR],
                     [1, 1, 0.55, 0.7, 0.5])
amb.add(np.vstack([air * 0.030, np.roll(air, 2400) * 0.030]) * amb_env, 0)
amb.add(drone * 0.050 * amb_env, 0)

# ================================================================== SCENE 1 — logo reveal
logo_chime = mx(bell(midi(86), 3.0) * 0.55, bell(midi(93), 2.4, 0.6) * 0.25)
sfx.add(logo_chime, T['logo'], pan=-0.15, gain=0.06)
sfx_wet.add(logo_chime, T['logo'], pan=0.15, gain=0.07)
shimmer = hp(noise(1.6), 5000) * decay(ns(1.6), 0.45, 0.06)
sfx.add(np.vstack([shimmer, np.roll(shimmer, 900)]), T['logo'], gain=0.014)

# anticipation riser while the door glows (ends exactly on the latch)
d = T['seam'] - T['glow']
riser = whoosh(d, 350, 3800, 'rise', 0.7) * 0.09
u = np.linspace(0, 1, len(riser))
tone = np.sin(2 * np.pi * np.cumsum(146.8 * 2 ** u) / SR) * u ** 2 * (0.7 + 0.3 * np.sin(2 * np.pi * 11 * secs(d)))
sfx.add((riser + tone * 0.035) * env(len(riser), 0.05, 0.012), T['glow'], gain=0.7)

# ================================================================== SCENE 2 — door opens
latch = mx(thump(78, 40, 0.6, 0.16) * 0.24, click(0.025) * 0.10)
sfx.add(latch, T['seam'])
sfx.add(metal_ring(1.0, 410, 0.035), T['seam'], pan=-0.2)
sfx_wet.add(metal_ring(1.0, 410, 0.05), T['seam'], pan=0.2)
hiss = hp(noise(0.9), 2500) * decay(ns(0.9), 0.22, 0.01)
sfx.add(np.vstack([hiss, np.roll(hiss, 500)]), T['leaves'], gain=0.03)

leaf_d = 1.7  # matches the leaf tween duration in masterTimeline.ts
motor = door_motor(leaf_d)
sfx.add(motor, T['leaves'], pan=-0.35, gain=0.08)
sfx.add(door_motor(leaf_d), T['leaves'], pan=0.35, gain=0.08)
sfx_wet.add(motor, T['leaves'], gain=0.09)
settle = mx(thump(62, 38, 0.6, 0.18) * 0.18, click(0.015, 1500, 5000) * 0.06)
sfx.add(settle, T['leaves'] + leaf_d - 0.05)

# light pouring out: airy high chord swell
d = T['hall'] - T['leaves']
glow_chord = sum(np.sin(2 * np.pi * midi(m) * secs(d) + i) for i, m in enumerate((74, 81, 86, 88)))
glow_chord *= np.clip(secs(d) / 1.4, 0, 1) ** 1.5 * env(ns(d), 0.01, 0.4) / 4
music_wet.add(np.vstack([glow_chord, np.roll(glow_chord, 700)]), T['leaves'], gain=0.05)

# ================================================================== SCENE 2b — camera flight
d = T['hall'] - T['push']
fly = whoosh(d, 160, 5200, 'rise', 0.9)
fly *= env(len(fly), 0.05, 0.06)
sfx.add(np.vstack([fly, np.roll(fly, 300)]), T['push'], gain=0.17)
rumble = lp(signal.sawtooth(2 * np.pi * 34 * secs(d)), 140) * np.linspace(0, 1, ns(d)) ** 2
sfx.add(rumble, T['push'], gain=0.13)
# reverse chord swelling into the hall
rev = sum(np.sin(2 * np.pi * midi(m) * secs(d)) for m in (50, 57, 62, 65, 69)) / 5
rev *= np.linspace(0, 1, ns(d)) ** 3 * env(ns(d), 0.01, 0.03)
music_wet.add(np.vstack([rev, rev]), T['push'], gain=0.18)

# arrival bloom as the veil lifts on the hall
bloom = thump(70, 34, 2.4, 0.55) * 0.5 + lp(noise(2.4), 1400) * decay(ns(2.4), 0.7, 0.01) * 0.10
sfx.add(bloom, T['hall'], gain=0.45)
sfx_wet.add(bloom, T['hall'], gain=0.22)

# five doors rising
for i, t0 in enumerate(RISES):
    lift = whoosh(0.9, 260, 900, 'bell', 0.6) * 0.05
    sfx.add(lift, t0, pan=DOOR_PAN[i])
    sfx.add(mx(click(0.012, 2000, 6000) * 0.035, thump(90, 55, 0.25, 0.05) * 0.06), t0 + 1.1, pan=DOOR_PAN[i])

# ================================================================== MUSIC
# Chords (MIDI) — D minor, cinematic electronic.
CH = {
    'Dm9': [50, 53, 57, 60, 64],
    'Bbmaj7': [46, 50, 53, 57, 60],
    'Fadd9': [53, 57, 60, 67],
    'Cadd9': [48, 55, 62, 64],
    'Gm9': [43, 50, 53, 57, 58],
    'Asus': [45, 50, 52, 57],
    'Dend': [38, 45, 50, 53, 57, 64],
}
ROOT_OF = {'Dm9': 38, 'Bbmaj7': 34, 'Fadd9': 41, 'Cadd9': 36, 'Gm9': 31, 'Asus': 33, 'Dend': 38}

# (start, end, chord, pad cutoff Hz, pad level)
PAD_PLAN = [
    (T['leaves'], beat(0), 'Dm9', 1250, 1.0),
    (beat(0), beat(4), 'Dm9', 1300, 1.0),
    (beat(4), beat(8), 'Bbmaj7', 1400, 1.0),
    (beat(8), beat(12), 'Fadd9', 1500, 1.0),
    (beat(12), beat(16), 'Cadd9', 1600, 1.0),
    (beat(16), beat(20), 'Gm9', 1700, 1.0),
    (beat(20), beat(24), 'Bbmaj7', 1900, 1.05),
    (beat(24), beat(28), 'Cadd9', 2200, 1.1),
    (beat(28), T['registration'], 'Asus', 2600, 1.15),
    (T['registration'], beat(33), 'Dm9', 3600, 1.25),
    (beat(33), T['endCard'], 'Bbmaj7', 3400, 1.2),
    (T['endCard'], DUR, 'Dend', 2000, 1.15),
]
for i, (s, e, name, cutoff, lvl) in enumerate(PAD_PLAN):
    d = e - s + (0.35 if i < len(PAD_PLAN) - 1 else 0)
    n = ns(d)
    voices_l = sum(saw_voices(midi(m), d, (-9, 0, 6)) for m in CH[name])
    voices_r = sum(saw_voices(midi(m), d, (-5, 3, 10)) for m in CH[name])
    first, last = i == 0, i == len(PAD_PLAN) - 1
    e_ = env(n, 2.2 if first else 0.3, 4.8 if last else 0.35)
    if last:  # resolution: long natural release that lands with the fade to black
        e_ *= np.interp(np.arange(n) / SR, [0, 1.0, d], [1, 0.9, 0.0]) ** 0.6
    pad = np.vstack([lp(voices_l, cutoff), lp(voices_r, cutoff)]) * e_ / len(CH[name]) * lvl
    music.add(pad, s, gain=0.11)
    music_wet.add(pad, s, gain=0.10)

# hall: low pulse-less bass bed under the pad (music present before the beat)
d = beat(0) - T['hall']
bed = (np.sin(2 * np.pi * midi(38) * secs(d)) + 0.5 * lp(signal.sawtooth(2 * np.pi * midi(38) * secs(d)), 300))
bed *= env(ns(d), 1.5, 0.25)
music.add(bed, T['hall'], gain=0.07)

# Sidechain-style pump from the kick pattern (applied to pad + bass later)
kick_times = []
for k in range(0, 20, 2):              # committees: half-time pulse
    kick_times.append(beat(k))
for k in range(22, 31):                # finale build: every beat
    kick_times.append(beat(k))
for k in range(31, 35):                # climax: every beat (first hit = impact)
    kick_times.append(T['registration'] if k == 31 else beat(k))
for t0 in kick_times:
    music.add(kick(), t0, gain=0.30 if t0 < T['paths'] else 0.36)

# hats: off-beat 8ths from the 3rd committee, 16th feel in the climax
for k in range(8, 20):
    music.add(hat(), beat(k) + BEAT / 2, pan=0.25, gain=0.035)
for k in range(22, 31):
    music.add(hat(), beat(k) + BEAT / 2, pan=0.25, gain=0.05)
    music.add(hat(0.03), beat(k) + BEAT / 4 * 3, pan=-0.25, gain=0.02)
for k in range(31, 35):
    for q in range(4):
        if q:
            music.add(hat(0.04 if q == 2 else 0.03), beat(k) + q * BEAT / 4, pan=0.25 if q % 2 else -0.2,
                      gain=0.06 if q == 2 else 0.03)
# backbeat in the climax
for k in (32, 34):
    music.add(snare(), beat(k), gain=0.10)
    music_wet.add(snare(), beat(k), gain=0.05)

# build: accelerating snare roll + riser into the registration impact
roll_start, roll_end = beat(28), T['registration'] - 0.12
t0, step = roll_start, BEAT / 2
while t0 < roll_end:
    prog = (t0 - roll_start) / (roll_end - roll_start)
    music.add(snare(0.12), t0, pan=0.1 * np.sin(t0 * 7), gain=0.02 + 0.07 * prog ** 1.5)
    step = BEAT / 2 if prog < 0.35 else BEAT / 4 if prog < 0.7 else BEAT / 8
    t0 += step
d = T['registration'] - beat(26)
build = whoosh(d, 300, 6500, 'rise', 0.8) * env(ns(d), 0.1, 0.02)
sfx.add(np.vstack([build, np.roll(build, 600)]), beat(26), gain=0.11)

# bass: 8ths on the chord root, pumped
BASS_SECTIONS = [(beat(0), beat(20)), (beat(22), T['registration'] - 0.15), (T['registration'], T['endCard'])]


def chord_at(t):
    for s, e, name, *_ in PAD_PLAN:
        if s <= t < e:
            return name
    return 'Dm9'


for s, e in BASS_SECTIONS:
    t0 = s
    while t0 < e - 0.01:
        f = midi(ROOT_OF[chord_at(t0 + 0.01)])
        d = min(BEAT / 2, e - t0)
        tt = secs(d)
        body = lp(signal.sawtooth(2 * np.pi * f * tt), 420) + 0.8 * np.sin(2 * np.pi * f * tt)
        e_ = env(len(tt), 0.006, 0.05) * (0.55 + 0.45 * np.exp(-tt / 0.18))
        music.add(body * e_, t0, gain=0.09 if s < T['paths'] else 0.12)
        t0 += BEAT / 2

# arpeggio (FM pluck), ping-pong, filter opening across the committees
ARP_SECTIONS = [(beat(0), beat(20), 1100, 3200), (beat(22), T['registration'] - 0.15, 2200, 4200),
                (T['registration'], T['endCard'], 4200, 4800)]
arp_bus = np.zeros((2, N))
for s, e, c0, c1 in ARP_SECTIONS:
    step, j, t0 = BEAT / 4, 0, s
    while t0 < e - 0.01:
        notes = [m + 12 for m in CH[chord_at(t0 + 0.01)]]
        pattern = [0, 2, 1, 3, 2, 4 % len(notes), 1, 3]
        m = notes[pattern[j % 8] % len(notes)] + (12 if j % 16 >= 12 else 0)
        prog = (t0 - s) / max(e - s, 1e-3)
        p = fm_pluck(midi(m), 0.45, 1.8 + 1.4 * prog)
        p = lp(p, c0 + (c1 - c0) * prog)
        gl, gr = pan_gains(0.35 if j % 2 else -0.35)
        i0 = ns(t0)
        n = min(len(p), N - i0)
        arp_bus[0, i0:i0 + n] += p[:n] * gl
        arp_bus[1, i0:i0 + n] += p[:n] * gr
        j += 1
        t0 += step
# dotted-8th ping-pong delay
dl = ns(BEAT * 0.75)
echo = np.zeros_like(arp_bus)
src = arp_bus.copy()
for r in range(1, 5):
    g = 0.38 ** r
    # ping-pong: each repeat jumps to the other side
    echo[r % 2, dl * r:] += lp(src[(r + 1) % 2, :-dl * r], 3000) * g
arp_mix = arp_bus + echo
music.add(arp_mix, 0, gain=0.055)
music_wet.add(arp_mix, 0, gain=0.04)

# climax lead: bright bell motif (Tuwaiq "call")
MOTIF = [69, 74, 76, 77, 76, 74, 72, 74]
for i, m in enumerate(MOTIF):
    t0 = T['registration'] + i * BEAT / 2 if i else T['registration']
    if t0 < T['endCard'] - 0.05:
        b = bell(midi(m + 12), 1.4, 0.8)
        music.add(b, t0, pan=0.15, gain=0.045)
        music_wet.add(b, t0, pan=-0.15, gain=0.05)

# ================================================================== SCENE 3 — committee highlights
REVEAL_NOTES = [74, 76, 77, 79, 81]  # D5 E5 F5 G5 A5 — each reveal one step higher
for i in range(5):
    # camera glide whoosh (follows the 1.15 s camera move, travels with it)
    w = whoosh(1.15, 280, 2600, 'bell', 0.7)
    sfx.add(w, MOVES[i], pan=moving_pan(len(w), 0.0 if i == 0 else 0.45, 0.4 if i == 0 else -0.25), gain=0.07)
    # signature reveal: bell on the door side, pixel blips on the caption side, soft sub hit
    f = midi(REVEAL_NOTES[i])
    b = bell(f, 2.2, 0.9)
    sfx.add(b, REVEALS[i], pan=0.3, gain=0.065)
    sfx_wet.add(b, REVEALS[i], pan=-0.1, gain=0.08)
    for j, semi in enumerate((0, 7, 12)):
        sfx.add(pulse_blip(f * 2 * 2 ** (semi / 12)), REVEALS[i] + 0.05 + j * 0.055, pan=-0.3, gain=0.022)
    sfx.add(thump(95, 50, 0.4, 0.09), REVEALS[i], gain=0.075)
    # the highlighted door opens a little
    sfx.add(door_motor(1.1, 0.45), REVEALS[i] - 0.05, pan=0.3, gain=0.17)

# ================================================================== SCENE 4 — finale
d = 1.9
pull = whoosh(d, 2600, 380, 'fall', 0.8)
sfx.add(np.vstack([pull, np.roll(pull, 450)]), T['pullBack'], gain=0.13)
for i in range(5):
    t0 = T['leavesAll'] + 0.08 * i
    sfx.add(door_motor(1.1, 0.35), t0, pan=DOOR_PAN[i], gain=0.22)
for i in range(5):
    t0 = T['lightsFlash'] + 0.08 * i
    s = bell(midi(86 + (0, 2, 5, 7, 9)[i]), 1.2, 0.5)
    sfx.add(s, t0, pan=DOOR_PAN[i], gain=0.035)
    sfx_wet.add(s, t0, pan=DOOR_PAN[i], gain=0.03)
# message accents
sfx.add(thump(80, 45, 0.9, 0.22), T['paths'], gain=0.14)
sfx_wet.add(thump(80, 45, 0.9, 0.22), T['paths'], gain=0.1)
sfx.add(thump(85, 45, 1.0, 0.25), T['join'], gain=0.16)

# registration impact — measured, not bombastic
imp_d = 3.0
impact = thump(92, 36, imp_d, 0.42) * 0.62
impact += lp(noise(imp_d), 900) * decay(ns(imp_d), 0.10, 0.002) * 0.30
crash = hp(noise(imp_d), 4500) * decay(ns(imp_d), 0.75, 0.003)
sfx.add(impact, T['registration'], gain=0.62)
sfx.add(np.vstack([crash, np.roll(crash, 1100)]), T['registration'], gain=0.035)
sfx_wet.add(impact, T['registration'], gain=0.25)

# end card: final hit + logo chime callback, then resolve
sfx.add(thump(80, 38, 2.5, 0.5) * 0.5, T['endCard'], gain=0.45)
sfx_wet.add(thump(80, 38, 2.5, 0.5) * 0.5, T['endCard'], gain=0.2)
end_chime = mx(bell(midi(86), 4.5) * 0.6, bell(midi(81), 4.5, 0.7) * 0.4, bell(midi(74), 4.5, 0.5) * 0.3)
sfx.add(end_chime, T['endItems'], pan=-0.1, gain=0.09)
sfx_wet.add(end_chime, T['endItems'], pan=0.1, gain=0.12)

# ================================================================== MIX
t = np.arange(N) / SR
# pump pad/bass slightly with the kick for an electronic pulse
pump = np.ones(N)
for t0 in kick_times:
    i0 = ns(t0)
    seg = 1 - 0.28 * np.exp(-np.arange(ns(0.4)) / (0.11 * SR))
    n = min(len(seg), N - i0)
    pump[i0:i0 + n] = np.minimum(pump[i0:i0 + n], seg[:n])
# duck the music under the big moments
duck = np.interp(t, [0, T['push'] + 1.3, T['hall'], T['hall'] + 0.8, T['registration'] - 0.01,
                     T['registration'] + 0.05, T['registration'] + 0.7, DUR],
                 [1, 1, 0.7, 1, 1, 0.8, 1, 1])
# music arrives with the door, grows to the climax
music_gain = np.interp(t, [0, T['leaves'], T['leaves'] + 1.0, T['hall'], beat(0), T['paths'], T['registration'], T['endCard'], DUR],
                       [0.0, 0.0, 0.8, 1.0, 0.95, 1.0, 1.25, 1.1, 1.0])

hall_ir = make_ir(2.8, 4.0, 5000, 7)
room_ir = make_ir(1.5, 2.2, 6500, 9)
music_mix = (music.x * pump + reverb(music_wet.x * pump, hall_ir, 0.9)) * duck * music_gain * LEVEL['music']
# scene levels for the sound effects: keep the opening restrained so the film builds to the climax
sfx_scene = np.interp(t, [0, T['seam'] - 0.1, T['seam'], T['leaves'] + 2.0, T['push'] + 0.6, DUR],
                      [0.8, 0.8, 0.55, 0.55, 0.75, 0.75])
sfx_mix = (sfx.x + reverb(sfx_wet.x, room_ir, 0.8)) * sfx_scene * LEVEL['sfx']
amb_mix = amb.x * LEVEL['ambience']
mix = music_mix + sfx_mix + amb_mix
if os.environ.get('STEMS'):  # debug: dump layers for analysis
    for name, x in (('music', music_mix), ('sfx', sfx_mix), ('amb', amb_mix), ('sfx_dry', sfx.x), ('sfx_wet', reverb(sfx_wet.x, room_ir, 0.8))):
        wavfile.write(f'/tmp/stem_{name}.wav', SR, x.T.astype(np.float32))

# master: clean lows, gentle glue compression, safe ceiling, timed fades
mix = np.vstack([hp(mix[0], 26, 2), hp(mix[1], 26, 2)])
level = lp(np.max(np.abs(mix), axis=0), 3, 1)  # slow envelope (glue, not squash)
thr = 0.6 * np.max(level)
gain = np.where(level > thr, (thr / np.maximum(level, 1e-9)) ** (1 - 1 / 1.3), 1.0)
mix = mix * gain
fade_in = np.clip(t / 0.03, 0, 1)
fade_out = np.where(t < T['fadeOut'], 1.0, np.cos(np.clip((t - T['fadeOut']) / (DUR - T['fadeOut']), 0, 1) * np.pi / 2))
mix *= fade_in * fade_out
mix = mix / np.max(np.abs(mix)) * 0.7
mix = np.tanh(mix * 1.15) / np.tanh(1.15) * 0.7  # soft saturation (no hard clipping)

out_dir = os.path.join(ROOT, 'video', 'audio')
os.makedirs(out_dir, exist_ok=True)
raw = os.path.join(out_dir, '_premaster.wav')
wavfile.write(raw, SR, mix.T.astype(np.float32))

# loudness: ONE static gain to the target (keeps the mix balance), then a
# look-ahead true-peak limiter. (ffmpeg's loudnorm can silently fall back to
# dynamic mode, which flattens the build-up — so it is not used.)
from scipy.ndimage import minimum_filter1d, uniform_filter1d


def integrated_lufs(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    summary = out[out.rindex('Summary'):]
    return float(summary.split('I:')[1].split('LUFS')[0])


def true_peak_limit(x, ceiling_db):
    ceiling = 10 ** (ceiling_db / 20)
    over = np.max(np.abs(signal.resample_poly(x, 4, 1, axis=1)), axis=0)  # 4x oversampled peaks
    peak = over.reshape(-1, 4).max(axis=1)[:x.shape[1]]
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    w = int(0.006 * SR)  # 6 ms look-ahead / smoothing: never exceeds the required gain
    g = uniform_filter1d(minimum_filter1d(need, w * 2 + 1), w * 2 + 1)
    return x * g


x = mix
for _ in range(3):
    gain_db = TARGET_LUFS - integrated_lufs(raw)
    x = true_peak_limit(x * 10 ** (gain_db / 20), TRUE_PEAK - 0.3)
    wavfile.write(raw, SR, x.T.astype(np.float32))
    if abs(integrated_lufs(raw) - TARGET_LUFS) < 0.15:
        break
final_wav = os.path.join(out_dir, 'tuwaiq-soundtrack.wav')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-c:a', 'pcm_s24le', final_wav], check=True)
os.remove(raw)
print(f'✓ {final_wav}  ({integrated_lufs(final_wav):.1f} LUFS)')

# mux: keep the video stream untouched, add AAC audio
for src, dst, br in (('tuwaiq-committees-1080p.mp4', 'tuwaiq-committees-1080p-audio.mp4', '256k'),
                     ('tuwaiq-committees-web-720p.mp4', 'tuwaiq-committees-web-720p-audio.mp4', '160k')):
    vid = os.path.join(ROOT, 'video', src)
    out = os.path.join(ROOT, 'video', dst)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', vid, '-i', final_wav,
                    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', br, '-ar', str(SR),
                    '-ac', '2', '-t', str(DUR), '-movflags', '+faststart', out], check=True)
    print(f'✓ {out}')
