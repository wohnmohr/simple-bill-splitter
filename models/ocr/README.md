# Order scanner models

The on-device text reader behind "Scan a food order screenshot" (`lib/ocr.ts`,
`lib/paddleOcr.ts`). They are copied to `public/ocr` at build time
(`scripts/copy-ocr-assets.mjs`) and run in the browser: screenshots never
leave the device.

| File | What it is |
|---|---|
| `ppocr-v4-det-int8.onnx` | PaddleOCR PP-OCRv4 text detection, all layers int8 (1.3 MB, from 4.5 MB) |
| `ppocr-v4-rec-int8mm.onnx` | PP-OCRv4 multilingual recognition, final layers int8 (7.4 MB, from 10.3 MB) |
| `ppocr-v4-keys.txt` | The recogniser's characters, in class order |

**Where they come from.** [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
PP-OCRv4 (Apache-2.0), as converted to ONNX in
[`@gutenye/ocr-models`](https://www.npmjs.com/package/@gutenye/ocr-models) 1.4.2
(MIT), then quantised with `quantize.py` (the steps are at its top).

**Why these.** On 14 real images (a Swiggy order screenshot and 13 photos of
paper receipts) and our mock Swiggy, Zomato and Instamart screenshots:

| Engine | Read correctly | Wrong but looked right | Download (compressed) |
|---|---|---|---|
| Tesseract 5 (before) | 4 of 14 | 0 | ~6 MB |
| PP-OCRv4, full precision | 7 of 14 | 0 | ~17 MB |
| **PP-OCRv4, as here** | **7 of 14** | **0** | **~11 MB** |
| PP-OCRv4, recognition fully int8 | 2 of 14 | 1 | ~7 MB |

Changing a model? Give it a new file name (the `/ocr` cache is long) and
re-run the scanner fixtures and the real-image check before shipping.
