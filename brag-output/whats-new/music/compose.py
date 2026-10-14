"""
An original 42s backing track for the what's-new video, written in code so
we own it outright and can lock it to the video's beat grid.

120 BPM (a beat every 0.5s, matching the composition's SFX grid), C major,
IV–V–iii–vi with a V–I ending. Arranged to the storyboard:

  0–4s    intro: filtered pad opening up, pluck hint, riser into the drop
  4s      drop as "Who owes whom" lands: kick, claps, hats, pumping bass, chord stabs
  12s     crash; the "New" scenes (12.5–29s) add a pluck arp with a dotted-8th delay
  29–36s  full groove under split links and the tools
  36–37s  one-beat break with a clap roll, riser
  37s     crash and back in for the outro title
  40s     last hit on C; the chord rings out under the logo to 42s

  python3 -I compose.py <out.wav>   (needs numpy, scipy)
  then loudness-match and encode: see ../brag-plan.md
"""

import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
BPM = 120
BEAT = 60 / BPM
STEP = BEAT / 4  # a 16th
LENGTH = 42.0
N = int(SR * LENGTH)
rng = np.random.default_rng(7)


def midi(n):
	return 440.0 * 2 ** ((n - 69) / 12)


def at(t):
	return int(round(t * SR))


def lp(x, hz, order=2):
	return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, order=2):
	return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
	return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def saw(freq, n, phase=0.0):
	"""Band-limited (polyBLEP) sawtooth."""
	dt = freq / SR
	t = (phase + dt * np.arange(n)) % 1.0
	y = 2 * t - 1
	a = t < dt
	x = t[a] / dt
	y[a] -= x + x - x * x - 1
	b = t > 1 - dt
	x = (t[b] - 1) / dt
	y[b] -= x * x + x + x + 1
	return y


def env(n, attack, decay, sustain=0.0, release=None):
	"""Attack, exponential decay towards sustain, optional release tail at the end."""
	t = np.arange(n) / SR
	e = np.where(t < attack, t / max(attack, 1e-6), sustain + (1 - sustain) * np.exp(-(t - attack) / decay))
	if release:
		r = min(at(release), n)
		e[n - r :] *= np.linspace(1, 0, r)
	return e


def place(bus, sig, t, gain=1.0):
	i = at(t)
	if i >= len(bus):
		return
	j = min(len(bus), i + len(sig))
	bus[i:j] += sig[: j - i] * gain


def pan(mono, p):
	"""p in [-1, 1], constant power."""
	a = (p + 1) * np.pi / 4
	return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)


# ---------------------------------------------------------------- arrangement
BARS = int(LENGTH / (4 * BEAT))  # 21
F, G, Em, Am, C = "F", "G", "Em", "Am", "C"
PROG = [F, G, Em, Am] * 5
PROG[18:21] = [F, G, C]  # V–I to close
CHORDS = {  # voicings (MIDI) and bass root
	F: ([53, 57, 60, 64], 41),
	G: ([55, 59, 62, 67], 43),
	Em: ([52, 55, 59, 62], 40),
	Am: ([57, 60, 64, 67], 45),
	C: ([55, 60, 64, 67, 74], 36),
}


def chord_at(t):
	return PROG[min(int(t // (4 * BEAT)), BARS - 1)]


DROP, NEW_IN, NEW_OUT, BREAK, BACK, END = 4.0, 12.0, 29.0, 36.0, 37.0, 40.0


def grooving(t):
	return DROP <= t < END and not (BREAK <= t < BACK)


steps = [i * STEP for i in range(int(LENGTH / STEP))]

# ---------------------------------------------------------------- drums
kick_bus = np.zeros(N)
clap_bus = np.zeros(N)
hat_bus = np.zeros((N, 2))
fx_bus = np.zeros((N, 2))


def kick():
	n = at(0.42)
	t = np.arange(n) / SR
	f = 48 + 110 * np.exp(-t / 0.035)
	body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.16)
	click = hp(rng.standard_normal(n), 2500) * env(n, 0.0005, 0.006) * 0.35
	return np.tanh((body + click) * 1.6)


def clap():
	n = at(0.45)
	noise = bp(rng.standard_normal(n), 900, 3200)
	e = np.zeros(n)
	for k, o in enumerate([0, 0.011, 0.022]):
		seg = env(n - at(o), 0.0005, 0.007 if k < 2 else 0.11)
		e[at(o) :] = np.maximum(e[at(o) :], seg)
	return noise * e


def hat(open_=False):
	n = at(0.32 if open_ else 0.06)
	metal = sum(np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) for f in (3140, 4410, 5230, 6720, 8110))
	x = hp(metal * 0.15 + rng.standard_normal(n), 7000)
	return x * env(n, 0.0005, 0.09 if open_ else 0.018)


def crash():
	n = at(2.4)
	x = hp(rng.standard_normal((n, 2)).T, 4500).T
	return x * env(n, 0.001, 0.75)[:, None]


def riser(length):
	n = at(length)
	x = rng.standard_normal(n)
	out = np.zeros(n)
	blocks = np.array_split(np.arange(n), 48)
	for k, idx in enumerate(blocks):  # high-pass sweeping up
		out[idx] = hp(x[idx[0] : idx[-1] + 1], 300 + 7000 * (k / len(blocks)) ** 2, 1)
	return out * np.linspace(0, 1, n) ** 2


K, CL, HC, HO = kick(), clap(), hat(), hat(True)
for i, t in enumerate(steps):
	s = i % 16
	if grooving(t):
		if s % 4 == 0:
			place(kick_bus, K, t)
		if s in (4, 12):
			place(clap_bus, CL, t)
		closed = HC * (0.55 if s % 2 == 0 else 0.3)
		hat_bus[at(t) : at(t) + len(HC)] += pan(closed, 0.25)[: max(0, min(len(HC), N - at(t)))]
		if s % 4 == 2:
			o = pan(HO * 0.4, -0.2)
			j = min(N, at(t) + len(o))
			hat_bus[at(t) : j] += o[: j - at(t)]
	elif 1.0 <= t < DROP and s % 2 == 0 and t >= 2.0:  # hats hint in the intro's second bar
		place(hat_bus[:, 0], HC * 0.3, t)
		place(hat_bus[:, 1], HC * 0.3, t)
# Clap rolls into the drop and the outro.
for t0, t1 in ((3.0, DROP), (BREAK, BACK)):
	n_hits = int((t1 - t0) / STEP)
	for k in range(n_hits):
		place(clap_bus, CL, t0 + k * STEP, 0.35 + 0.65 * k / n_hits)
# A last kick on the final chord.
place(kick_bus, K, END)
for t in (DROP, NEW_IN, BACK, END):
	c = crash() * 0.5
	fx_bus[at(t) : at(t) + len(c)] += c[: N - at(t)]
for t0, t1 in ((1.0, DROP), (34.5, BACK)):
	r = riser(t1 - t0) * 0.22
	place(fx_bus[:, 0], r, t0)
	place(fx_bus[:, 1], r * 0.9, t0)

# Sidechain: everything melodic ducks under the kick for the pump.
duck = np.ones(N)
for i, t in enumerate(steps):
	if (grooving(t) and i % 4 == 0) or abs(t - END) < 1e-9:
		n = at(0.32)
		shape = 1 - 0.72 * np.exp(-np.arange(n) / SR / 0.075)
		j = min(N, at(t) + n)
		duck[at(t) : j] = np.minimum(duck[at(t) : j], shape[: j - at(t)])

# ---------------------------------------------------------------- bass
bass_bus = np.zeros(N)
BASS_STEPS = {2: 0, 6: 0, 7: 12, 10: 0, 14: 0, 15: 12}  # off-beat 8ths with octave pickups
for i, t in enumerate(steps):
	if not grooving(t):
		continue
	s = i % 16
	if s in BASS_STEPS:
		root = CHORDS[chord_at(t)][1] + BASS_STEPS[s]
		n = at(STEP * (1.6 if BASS_STEPS[s] == 0 else 0.9))
		f = midi(root)
		tone = lp(saw(f, n), 900) * 0.45 + np.sin(2 * np.pi * f * np.arange(n) / SR)
		place(bass_bus, tone * env(n, 0.003, 0.25, 0.6, 0.02), t)
# The held root on the last chord.
n = at(LENGTH - END)
place(bass_bus, np.sin(2 * np.pi * midi(36) * np.arange(n) / SR) * env(n, 0.005, 0.9, 0.0, 0.3), END, 1.1)

# ---------------------------------------------------------------- chords
DETUNE = [-0.11, -0.05, 0.0, 0.05, 0.11]  # semitones
PANS = [-0.7, -0.35, 0.0, 0.35, 0.7]


def supersaw(notes, n, cutoff):
	out = np.zeros((n, 2))
	for d, p in zip(DETUNE, PANS):
		mono = sum(saw(midi(m + d), n, rng.random()) for m in notes)
		out += pan(lp(mono, cutoff), p)
	return out / (len(notes) * 2.2)


pad_bus = np.zeros((N, 2))
stab_bus = np.zeros((N, 2))
for b, name in enumerate(PROG):
	t = b * 4 * BEAT
	notes = CHORDS[name][0]
	n = at(4 * BEAT + 0.3)
	last = b == BARS - 1
	if last:
		n = N - at(t)
	bright = supersaw(notes, n, 2600 if t >= DROP else 1800)
	if t < DROP:  # the intro opens up from a muffled pad
		dark = supersaw(notes, n, 500)
		mix = np.clip((np.arange(n) / SR + t) / DROP, 0, 1)[:, None] ** 1.5
		bright = dark * (1 - mix) + bright * mix
	e = env(n, 0.04 if t < DROP else 0.01, 3.0, 0.85, 0.3 if not last else 1.8)
	place(pad_bus, bright * e[:, None] * (0.75 if t < DROP else 0.42), t)
	# Syncopated stabs (3-3-2 in each half bar) once the groove is in.
	if DROP <= t < END:
		for s in (0, 3, 6, 8, 11, 14):
			ts = t + s * STEP
			if not grooving(ts):
				continue
			m = at(0.2)
			st = supersaw([x + 12 for x in notes[:3]], m, 4200) * env(m, 0.002, 0.07)[:, None]
			place(stab_bus, st, ts, 0.85)

# ---------------------------------------------------------------- pluck arp (the "New" scenes)
arp_bus = np.zeros((N, 2))
ORDER = [0, 2, 1, 3, 2, 0, 3, 1]


def pluck(f, n):
	x = saw(f, n) * 0.6 + np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) * 0.25
	return lp(x, 3500) * env(n, 0.002, 0.09)


for i, t in enumerate(steps):
	intro_hint = 0.5 <= t < DROP and i % 2 == 0
	if not ((NEW_IN <= t < NEW_OUT) or (BACK <= t < END) or intro_hint):
		continue
	notes = CHORDS[chord_at(t)][0]
	tones = sorted(notes[:4])
	note = tones[ORDER[i % 8] % len(tones)] + 12
	n = at(0.22)
	g = 0.5 if intro_hint else (0.8 if i % 4 == 0 else 0.6)
	if intro_hint:
		g *= np.clip((t - 0.5) / 3, 0.2, 1)
	place(arp_bus[:, 0], pluck(midi(note), n), t, g)
	place(arp_bus[:, 1], pluck(midi(note), n), t, g)
# Ping-pong dotted-8th delay.
d = at(3 * STEP)
wet = np.zeros_like(arp_bus)
src = arp_bus.copy()
for k in range(1, 5):
	sh = np.zeros_like(src)
	sh[d * k :] = src[: N - d * k]
	ch = k % 2
	wet[:, ch] += lp(sh[:, 0] + sh[:, 1], 2800) * 0.5 * 0.45**k
arp_bus += wet

# ---------------------------------------------------------------- reverb send
ir_n = at(1.6)
ir_t = np.arange(ir_n) / SR
ir = rng.standard_normal((ir_n, 2)) * np.exp(-ir_t / 0.38)[:, None]
ir[:, 0] = lp(ir[:, 0], 6000)
ir[:, 1] = lp(ir[:, 1], 6000)
ir /= np.sqrt((ir**2).sum(axis=0))
send = clap_bus[:, None] * 0.35 + stab_bus * 0.35 + arp_bus * 0.3 + pad_bus * 0.2
verb = np.stack([fftconvolve(send[:, 0], ir[:, 0])[:N], fftconvolve(send[:, 1], ir[:, 1])[:N]], axis=1)
verb = hp(verb.T, 250).T

# ---------------------------------------------------------------- mix
def rms(x, t0, t1):
	return np.sqrt(np.mean(x[at(t0) : at(t1)] ** 2)) + 1e-12


def stereo(x):
	return x if x.ndim == 2 else np.repeat(x[:, None], 2, axis=1)


# Faders: each part's level in dB against the kick, measured where it plays
# (the groove, the "New" scenes for the arp, the first crash for the effects).
GROOVE = (DROP, BREAK)
PARTS = [
	("kick", kick_bus, 0, GROOVE, False),
	("bass", bass_bus, -3, GROOVE, True),
	("clap", clap_bus, -9, GROOVE, False),
	("hats", hat_bus, -17, GROOVE, False),
	("pad", pad_bus, -8, GROOVE, True),
	("stabs", stab_bus, -6, GROOVE, True),
	("arp", arp_bus, -9, (NEW_IN, NEW_OUT), True),
	("reverb", verb, -13, GROOVE, False),
	("fx", fx_bus, -10, (NEW_IN, NEW_IN + 2), False),
]
ref = rms(kick_bus, *GROOVE)
mix = np.zeros((N, 2))
for name, bus, db, window, ducked in PARTS:
	part = stereo(bus) * (ref * 10 ** (db / 20) / rms(stereo(bus), *window))
	mix += part * duck[:, None] if ducked else part
mix = hp(mix.T, 30).T
# Glue: a light soft clip, then fade the very end.
mix /= np.abs(mix).max()
mix = np.tanh(mix * 1.5) / np.tanh(1.5)
tail = at(0.6)
mix[-tail:] *= np.linspace(1, 0, tail)[:, None]
mix /= np.abs(mix).max() / 0.89

if __name__ == "__main__":
	# Start 20ms in, so downbeats sit on the composition's SFX grid (x.02 / x.52).
	out = np.concatenate([np.zeros((at(0.02), 2)), mix])[:N]
	wavfile.write(sys.argv[1], SR, (out * 32767).astype(np.int16))
	print("bars", BARS, "length", N / SR)
