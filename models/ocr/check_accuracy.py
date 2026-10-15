"""
Accuracy gate for the order scanner's models. Renders receipt lines and pages
the way phone photos degrade them (blur, noise, JPEG, low resolution, a slight
tilt), runs them through the models in this folder, and fails if fewer than
60% of lines are read exactly or any page line is missed by detection.

    /tmp/q/bin/pip install pillow==12.3.0
    /tmp/q/bin/python models/ocr/check_accuracy.py [--reference /tmp/package/assets]

--reference also scores the full-precision models and fails if the shipped
ones read more than 2 points worse. This is a reproducible floor, not a
replacement for the real-image check in README.md.
"""
import argparse
import io
import random
import re
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageDraw, ImageFilter, ImageFont

MIN_LINES_EXACT = 0.60  # share of rendered lines read character for character
MAX_DROP_VS_REFERENCE = 0.02
LINES, PAGES, SEED = 200, 4, 7

here = Path(__file__).parent
fonts = [f for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                     "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                     "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"] if Path(f).exists()]
items = ["Chicken Dum Biryani", "Paneer Butter Masala", "Butter Naan", "Masala Dosa", "Cold Coffee",
         "Veg Fried Rice", "Gulab Jamun", "Delivery fee", "Platform fee", "GST and restaurant charges",
         "Item Total", "Grand Total", "Discount applied", "Amul Taaza Milk 500 ml", "Tip for partner"]


def line_text(rng):
    qty, item, amount = rng.randint(1, 4), rng.choice(items), rng.randint(10, 999) + rng.choice([0, 0.5, 0.35, 0.99])
    return rng.choice([f"{qty} x {item}", item, f"{item} {amount:.2f}", f"{qty} {item} Rs{amount:.2f}"])


def degrade(im, rng):
    """One of the ways a photo of a receipt goes wrong, mildly."""
    im = im.rotate(rng.uniform(-1.5, 1.5), resample=Image.BICUBIC, expand=False, fillcolor=im.getpixel((0, 0)))
    if rng.random() < 0.5:  # low resolution, scaled back up
        s = rng.uniform(0.5, 0.8)
        im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s)))).resize(im.size, Image.BILINEAR)
    im = im.filter(ImageFilter.GaussianBlur(rng.uniform(0, 1.2)))
    a = np.asarray(im, np.float32) + np.random.default_rng(rng.randint(0, 2**31)).normal(0, rng.uniform(0, 8), (im.height, im.width, 3))
    im = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=rng.randint(35, 80))
    return Image.open(buf).convert("RGB")


def render(text, rng, size):
    font = ImageFont.truetype(rng.choice(fonts), size)
    paper, ink = rng.randint(200, 255), rng.randint(0, 80)
    im = Image.new("RGB", (int(font.getlength(text)) + 16, int(size * 1.5)), (paper,) * 3)
    ImageDraw.Draw(im).text((8, size * 0.2), text, font=font, fill=(ink,) * 3)
    return im


def tensor(im, w, h, mean, std):
    a = np.asarray(im.resize((w, h), Image.BILINEAR), np.float32) / 255
    return ((a - mean) / std).astype(np.float32).transpose(2, 0, 1)[None]


class Models:
    def __init__(self, det, rec, keys):
        self.det = ort.InferenceSession(str(det), providers=["CPUExecutionProvider"])
        self.rec = ort.InferenceSession(str(rec), providers=["CPUExecutionProvider"])
        self.keys = [""] + Path(keys).read_text(encoding="utf8").splitlines() + [" "]

    def read(self, im):  # same preprocessing and greedy decoding as lib/paddleOcr.ts
        x = tensor(im, max(16, round(im.width * 48 / im.height)), 48, 0.5, 0.5)
        idx, out, last = self.rec.run(None, {self.rec.get_inputs()[0].name: x})[0][0].argmax(-1), [], 0
        for k in idx:
            if k != last and k != 0 and k < len(self.keys):
                out.append(self.keys[k])
            last = k
        return " ".join("".join(out).split())

    def text_map(self, im):
        w, h = (round(v / 32) * 32 for v in im.size)
        x = tensor(im, w, h, np.array([0.485, 0.456, 0.406]), np.array([0.229, 0.224, 0.225]))
        return self.det.run(None, {self.det.get_inputs()[0].name: x})[0][0, 0], im.width / w, im.height / h


def score(models):
    rng = random.Random(SEED)
    lines = [(t, degrade(render(t, rng, rng.randint(22, 36)), rng)) for t in (line_text(rng) for _ in range(LINES))]
    reads = [models.read(im) for _, im in lines]
    exact = sum(r == t for r, (t, _) in zip(reads, lines)) / LINES
    amounts = [(re.findall(r"\d+\.\d\d", t), re.findall(r"\d+\.\d\d", r)) for r, (t, _) in zip(reads, lines)]
    amounts = [want == got for want, got in amounts if want]
    misses = [(t, r) for r, (t, _) in zip(reads, lines) if r != t]

    found = total = 0  # detection: does every line on a page light up the text map?
    for _ in range(PAGES):
        font, size = ImageFont.truetype(rng.choice(fonts), 24), 24
        page = Image.new("RGB", (640, 960), (rng.randint(215, 255),) * 3)
        draw, boxes = ImageDraw.Draw(page), []
        for i in range(26):
            t = line_text(rng)
            draw.text((24, 20 + i * 35), t, font=font, fill=(rng.randint(0, 70),) * 3)
            boxes.append(draw.textbbox((24, 20 + i * 35), t, font=font))
        prob, sx, sy = models.text_map(degrade(page, rng))
        for x0, y0, x1, y1 in boxes:
            region = prob[int(y0 / sy):int(y1 / sy) + 1, int(x0 / sx):int(x1 / sx) + 1]
            found += (region > 0.3).mean() > 0.2
            total += 1
    return exact, sum(amounts) / len(amounts), found / total, misses


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--reference", type=Path, help="folder with the full-precision PP-OCRv4 ONNX models")
    args = ap.parse_args()
    if not fonts:
        sys.exit("No DejaVu or Liberation fonts found; install fonts-dejavu-core.")

    runs = {"shipped": Models(here / "ppocr-v4-det-int8.onnx", here / "ppocr-v4-rec-int8mm.onnx", here / "ppocr-v4-keys.txt")}
    if args.reference:
        r = args.reference
        runs["full precision"] = Models(r / "ch_PP-OCRv4_det_infer.onnx", r / "ch_PP-OCRv4_rec_infer.onnx", r / "ppocr_keys_v1.txt")

    print(f"{LINES} degraded receipt lines, {PAGES} degraded receipt pages (seed {SEED})")
    print(f"{'models':16} {'lines exact':>12} {'amounts right':>14} {'page lines found':>17}")
    results = {}
    for name, m in runs.items():
        exact, amounts, found, misses = results[name] = score(m)
        print(f"{name:16} {exact:12.0%} {amounts:14.0%} {found:17.0%}")
    exact, _, found, misses = results["shipped"]
    for want, got in misses[:5]:
        print(f"  misread: {want!r} -> {got!r}")

    failures = []
    if exact < MIN_LINES_EXACT:
        failures.append(f"only {exact:.0%} of lines read exactly (need {MIN_LINES_EXACT:.0%})")
    if found < 1:
        failures.append(f"detection missed {1 - found:.0%} of page lines")
    if "full precision" in results and results["full precision"][0] - exact > MAX_DROP_VS_REFERENCE:
        failures.append(f"quantization costs {results['full precision'][0] - exact:.0%} of lines (max {MAX_DROP_VS_REFERENCE:.0%})")
    print("FAIL: " + "; ".join(failures) if failures else "PASS")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
