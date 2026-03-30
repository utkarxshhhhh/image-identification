# Image Identification (MobileNetV2)

A simple command-line image classifier using a pre-trained **MobileNetV2** model from TensorFlow/Keras.

## What improved
- Removed Colab-only upload flow and replaced it with a local CLI (`--image`).
- Added input validation and clearer runtime error messages.
- Added lightweight unit tests for core helper logic.
- Added explicit dependencies and a `.gitignore`.

## Requirements
- Python 3.10+
- pip

Install dependencies:

```bash
pip install -r requirements.txt
```

## Usage

```bash
python main.py --image /path/to/photo.jpg --top-k 3
```

### Options
- `--image` (required): path to an image file (`.jpg`, `.jpeg`, `.png`, `.bmp`, `.gif`, `.webp`)
- `--top-k` (optional): number of top predictions to display (1-10, default: 3)

## Run tests

```bash
pip install pytest
pytest -q
```

## Example output

```text
TensorFlow Version: 2.x.x
Classifying: /absolute/path/cat.jpg
==========================================
1. Tabby Cat: 82.13%
2. Tiger Cat: 10.28%
3. Egyptian Cat: 3.56%
==========================================
```
