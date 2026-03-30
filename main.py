"""CLI image classification with TensorFlow MobileNetV2.

Usage:
    python main.py --image path/to/image.jpg [--top-k 3]
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple


try:
    import tensorflow as tf
    from tensorflow.keras.applications.mobilenet_v2 import (
        MobileNetV2,
        decode_predictions,
        preprocess_input,
    )
    from tensorflow.keras.preprocessing import image
except Exception as exc:  # pragma: no cover - import error path
    tf = None
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None

Prediction = Tuple[str, str, float]


def validate_image_path(path: str) -> Path:
    """Validate that path exists and looks like an image file."""
    image_path = Path(path).expanduser().resolve()
    allowed_suffixes = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"}

    if not image_path.exists() or not image_path.is_file():
        raise FileNotFoundError(f"Image file not found: {image_path}")
    if image_path.suffix.lower() not in allowed_suffixes:
        raise ValueError(
            f"Unsupported image extension '{image_path.suffix}'. "
            f"Supported extensions: {', '.join(sorted(allowed_suffixes))}"
        )
    return image_path


def load_and_preprocess_image(image_path: Path):
    """Load image from disk and preprocess for MobileNetV2."""
    import numpy as np

    img = image.load_img(image_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_batch = np.expand_dims(img_array, axis=0)
    return preprocess_input(img_batch)


def format_predictions(predictions: Sequence[Prediction]) -> List[str]:
    """Convert decoded predictions into display-friendly strings."""
    lines: List[str] = []
    for rank, (_, label, score) in enumerate(predictions, start=1):
        pretty_label = label.replace("_", " ").title()
        lines.append(f"{rank}. {pretty_label}: {score:.2%}")
    return lines


def classify_image(image_path: Path, top_k: int = 3) -> Iterable[str]:
    """Run model inference and return formatted top-k predictions."""
    if tf is None:
        raise RuntimeError(
            "TensorFlow import failed. Install dependencies from requirements.txt. "
            f"Original error: {_IMPORT_ERROR}"
        )

    model = MobileNetV2(weights="imagenet")
    preprocessed_image = load_and_preprocess_image(image_path)
    raw_predictions = model.predict(preprocessed_image, verbose=0)
    decoded = decode_predictions(raw_predictions, top=top_k)[0]
    return format_predictions(decoded)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Classify an image with MobileNetV2")
    parser.add_argument("--image", required=True, help="Path to the image file")
    parser.add_argument("--top-k", type=int, default=3, help="Number of predictions to show")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        image_path = validate_image_path(args.image)
        if args.top_k < 1 or args.top_k > 10:
            raise ValueError("--top-k must be between 1 and 10")

        print(f"TensorFlow Version: {tf.__version__ if tf is not None else 'unavailable'}")
        print(f"Classifying: {image_path}")
        print("=" * 42)

        for line in classify_image(image_path, top_k=args.top_k):
            print(line)

        print("=" * 42)
        return 0

    except Exception as exc:
        print(f"Error: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
