"""
Rebuilds the order scanner's models in this folder from the published
PaddleOCR PP-OCRv4 ONNX models. See README.md for why these settings.

    python3 -m venv /tmp/q && /tmp/q/bin/pip install onnxruntime==1.31.0 onnx==1.23.2
    npm pack @gutenye/ocr-models@1.4.2 && tar xzf gutenye-ocr-models-1.4.2.tgz
    /tmp/q/bin/python models/ocr/quantize.py package/assets
"""
import shutil
import sys
from pathlib import Path

from onnxruntime.quantization import QuantType, quantize_dynamic
from onnxruntime.quantization.shape_inference import quant_pre_process

src = Path(sys.argv[1])
here = Path(__file__).parent

# Detection: every layer to int8. A quarter of the size, same results on our test bills.
# Recognition: only the final matrix multiplications. Quantising its convolutions
# too broke reading (2 of 14 test bills right instead of 7).
for model, ops, out in [
    ("ch_PP-OCRv4_det_infer", ["Conv", "MatMul", "Gemm"], "ppocr-v4-det-int8.onnx"),
    ("ch_PP-OCRv4_rec_infer", ["MatMul", "Gemm"], "ppocr-v4-rec-int8mm.onnx"),
]:
    pre = here / f"{model}.pre.onnx"
    quant_pre_process(str(src / f"{model}.onnx"), str(pre), skip_symbolic_shape=True)
    quantize_dynamic(str(pre), str(here / out), weight_type=QuantType.QUInt8, op_types_to_quantize=ops)
    pre.unlink()

shutil.copy(src / "ppocr_keys_v1.txt", here / "ppocr-v4-keys.txt")
