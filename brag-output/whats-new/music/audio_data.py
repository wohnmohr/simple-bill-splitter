"""
Per-frame bass and mid levels (0–1) that make the composition's background
glows breathe with the music.

  python3 -I audio_data.py <track> <out.js>   (needs numpy and ffmpeg)
"""

import json
import subprocess
import sys

import numpy as np

FPS, SR, WIN = 30, 44100, 2048
BANDS = {"bass": (30, 150), "mid": (300, 2000)}

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.float32)
frames = int(len(x) / SR * FPS)
freqs = np.fft.rfftfreq(WIN, 1 / SR)
window = np.hanning(WIN)
levels = {k: np.zeros(frames) for k in BANDS}
for f in range(frames):
	c = int(f / FPS * SR)
	seg = x[max(0, c - WIN // 2) : c + WIN // 2]
	spec = np.abs(np.fft.rfft(np.pad(seg, (0, WIN - len(seg))) * window))
	for k, (lo, hi) in BANDS.items():
		levels[k][f] = np.sqrt(np.mean(spec[(freqs >= lo) & (freqs < hi)] ** 2))

out = {"fps": FPS}
for k, v in levels.items():
	# Fast attack, gentle release, then 0–1 between the quiet floor and the loud end.
	s = np.zeros_like(v)
	for i, e in enumerate(v):
		s[i] = e if i == 0 or e > s[i - 1] else s[i - 1] * 0.82 + e * 0.18
	lo, hi = np.percentile(s, 2), np.percentile(s, 99.5)
	out[k] = [round(float(n), 2) for n in np.clip((s - lo) / (hi - lo), 0, 1)]
open(sys.argv[2], "w").write("window.AUDIO=" + json.dumps(out) + ";\n")
print(frames, "frames")
