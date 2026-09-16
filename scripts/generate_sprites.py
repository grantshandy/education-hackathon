#!/usr/bin/env python3
"""
One-time sprite generator for the lo-fi study buddy character.

Uses Amazon Nova Canvas on Bedrock (INPAINTING task) to paint each viseme
mouth shape into a feathered ellipse mask over the mouth, leaving the rest of
the image pixel-perfect.

Usage:
    python scripts/generate_sprites.py

AWS credentials are read from the environment / ~/.aws/credentials.
Run from the repo root. No third-party dependencies beyond boto3.
"""

import base64
import json
import math
import os
import struct
import sys
import time
import zlib
from pathlib import Path

import boto3

# ── paths ────────────────────────────────────────────────────────────────────
REPO_ROOT    = Path(__file__).parent.parent
SOURCE_IMAGE = REPO_ROOT / "frontend" / "public" / "character.jpg"
OUT_DIR      = REPO_ROOT / "frontend" / "public" / "sprites"

# ── Bedrock model ─────────────────────────────────────────────────────────────
REGION      = os.environ.get("AWS_REGION", "us-east-1")
CANVAS_MODEL = "amazon.nova-canvas-v1:0"

# ── mouth mask parameters (pixels in the 1024×1024 source image) ──────────────
MOUTH_CX   = 490
MOUTH_CY   = 538
MASK_RX    = 72   # half-width of mask ellipse
MASK_RY    = 42   # half-height
MASK_BLUR  = 14   # Gaussian feather radius

# ── shared negative prompt ────────────────────────────────────────────────────
NEGATIVE = (
    "deformed mouth, extra teeth, bad anatomy, changed background, "
    "different character, different hair, different clothing, blurry, "
    "watermark, text, signature, low quality"
)

# ── viseme specs ──────────────────────────────────────────────────────────────
# (output_stem, [polly_codes], inpaint_prompt)
#
# Polly viseme reference:
#   sil = silence/rest          p   = bilabial stop (P/B/M)
#   t   = alveolar (T/D/N)      S   = postalveolar (SH/ZH/CH)
#   T   = dental fricative (TH) f   = labiodental (F/V)
#   k   = velar stop (K/G/NG)   i   = front close vowel (EE/Y)
#   r   = rhotic (R)            s   = alveolar fricative (S/Z)
#   u   = back close vowel (OO/W)   @ = schwa (uh)
#   a   = open front vowel (AH/AA)  e = front mid vowel (EH/AY)
#   E   = open-mid front (EH short) o = back mid vowel (OH)
#   O   = open back vowel (AW)
VISEME_SPECS = [
    (
        "viseme_sil", ["sil"],
        "anime girl closed mouth, soft gentle resting smile, lips lightly touching, "
        "Studio Ghibli art style, clean smooth linework, consistent skin tone",
    ),
    (
        "viseme_p", ["p"],
        "anime girl mouth with lips pressed firmly together in a flat line, "
        "tight bilabial seal, no gap between lips, "
        "Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_t", ["t", "S", "T", "s"],
        "anime girl mouth barely open, very narrow horizontal slit between lips, "
        "teeth nearly touching, small slim gap, "
        "Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_f", ["f"],
        "anime girl mouth with upper front teeth gently resting on the lower lip, "
        "lower lip slightly tucked, labiodental shape, "
        "Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_k", ["k"],
        "anime girl mouth moderately open, jaw dropped one-third of the way, "
        "lips relaxed and parted, rounded medium opening, "
        "Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_i", ["i"],
        "anime girl mouth with lips stretched wide horizontally in a long thin smile, "
        "teeth nearly closed, minimal vertical gap, wide spread lips, "
        "Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_r", ["r"],
        "anime girl mouth with lips lightly rounded and pushed slightly forward, "
        "moderate vertical gap, soft round opening, "
        "Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_u", ["u"],
        "anime girl mouth with lips tightly pursed into a small round circle, "
        "forward pucker, kissing shape, very small circular opening, "
        "Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_schwa", ["@"],
        "anime girl mouth half open, jaw dropped halfway, lips relaxed and parted, "
        "neutral oval opening, schwa vowel shape, "
        "Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_a", ["a"],
        "anime girl mouth wide open, jaw dropped fully, large oval opening, "
        "lips relaxed at corners, lower teeth and tongue tip faintly visible, "
        "open AH vowel shape, Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_e", ["e", "E"],
        "anime girl mouth moderately open, lips slightly spread wide, "
        "medium oval opening, EH front vowel shape, "
        "Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_o", ["o"],
        "anime girl mouth forming a clear O shape, lips rounded into a circle, "
        "moderate vertical gap, OH vowel shape, "
        "Studio Ghibli art style, clean linework",
    ),
    (
        "viseme_O", ["O"],
        "anime girl mouth forming a larger open oval, lips rounded and wide, "
        "bigger opening than O shape, AW vowel posture, "
        "Studio Ghibli art style, clean linework",
    ),
]

# ── idle shift specs ──────────────────────────────────────────────────────────
# Between-paragraph breathing: very subtle body/head sway using COLOR_GUIDED task
# (which gives us full image generation from the source palette/composition).
# We describe the same character but with a micro pose shift.
IDLE_SPECS = [
    (
        "idle_shift_1",
        "Studio Ghibli anime girl at a wooden desk, body slightly shifted right, "
        "head gently tilted to the left by a few degrees, soft closed resting smile, "
        "large headphones, green sweater, pink scarf, orange tabby cat, "
        "European cityscape window, lo-fi warm lighting, same character same room",
    ),
    (
        "idle_shift_2",
        "Studio Ghibli anime girl at a wooden desk, body slightly shifted left, "
        "head gently tilted to the right by a few degrees, soft closed resting smile, "
        "large headphones, green sweater, pink scarf, orange tabby cat, "
        "European cityscape window, lo-fi warm lighting, pensive studying expression",
    ),
]


# ── pure-Python PNG mask generation ──────────────────────────────────────────

def _png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def make_mouth_mask_b64(width: int = 1024, height: int = 1024) -> str:
    """
    Grayscale PNG: white feathered ellipse over mouth (inpaint region),
    black everywhere else. Generated without any third-party library.
    """
    pixels = bytearray(width * height)
    blur_frac = MASK_BLUR / min(MASK_RX, MASK_RY)
    y0 = max(0, MOUTH_CY - MASK_RY - MASK_BLUR * 2)
    y1 = min(height, MOUTH_CY + MASK_RY + MASK_BLUR * 2 + 1)
    x0 = max(0, MOUTH_CX - MASK_RX - MASK_BLUR * 2)
    x1 = min(width, MOUTH_CX + MASK_RX + MASK_BLUR * 2 + 1)
    for y in range(y0, y1):
        for x in range(x0, x1):
            dx = (x - MOUTH_CX) / MASK_RX
            dy = (y - MOUTH_CY) / MASK_RY
            dist = math.sqrt(dx * dx + dy * dy)
            if dist <= 1.0:
                val = 255
            elif dist <= 1.0 + blur_frac:
                val = int(255 * (1.0 - (dist - 1.0) / blur_frac))
            else:
                val = 0
            pixels[y * width + x] = val

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0)
    raw = b"".join(b"\x00" + bytes(pixels[y * width : (y + 1) * width]) for y in range(height))
    idat = zlib.compress(raw, 6)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(b"IHDR", ihdr)
        + _png_chunk(b"IDAT", idat)
        + _png_chunk(b"IEND", b"")
    )
    return base64.b64encode(png).decode()


# ── Bedrock calls ─────────────────────────────────────────────────────────────

def invoke_inpaint(client, image_b64: str, mask_b64: str, prompt: str, seed: int) -> bytes:
    """Nova Canvas INPAINTING task."""
    body = {
        "taskType": "INPAINTING",
        "inPaintingParams": {
            "image": image_b64,
            "maskImage": mask_b64,
            "text": prompt,
            "negativeText": NEGATIVE,
        },
        "imageGenerationConfig": {
            "numberOfImages": 1,
            "quality": "standard",
            "seed": seed,
        },
    }
    resp = client.invoke_model(
        modelId=CANVAS_MODEL,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    result = json.loads(resp["body"].read())
    if "images" not in result or not result["images"]:
        raise RuntimeError(f"No images in response: {result}")
    return base64.b64decode(result["images"][0])


def invoke_color_guided(client, image_b64: str, prompt: str, seed: int) -> bytes:
    """Nova Canvas COLOR_GUIDED_GENERATION for idle shift frames."""
    body = {
        "taskType": "COLOR_GUIDED_GENERATION",
        "colorGuidedGenerationParams": {
            "referenceImage": image_b64,
            "text": prompt,
            "negativeText": NEGATIVE,
        },
        "imageGenerationConfig": {
            "numberOfImages": 1,
            "quality": "standard",
            "width": 1024,
            "height": 1024,
            "seed": seed,
        },
    }
    resp = client.invoke_model(
        modelId=CANVAS_MODEL,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    result = json.loads(resp["body"].read())
    if "images" not in result or not result["images"]:
        raise RuntimeError(f"No images in response: {result}")
    return base64.b64decode(result["images"][0])


# ── generation loops ──────────────────────────────────────────────────────────

def generate_viseme_frames(client, src_b64: str, mask_b64: str) -> None:
    print(f"\nGenerating {len(VISEME_SPECS)} viseme frames (Nova Canvas inpaint)...")
    for i, (stem, codes, prompt) in enumerate(VISEME_SPECS):
        out_path = OUT_DIR / f"{stem}.png"
        if out_path.exists():
            print(f"  [{i+1}/{len(VISEME_SPECS)}] {stem} — skipping (exists)")
            continue
        print(f"  [{i+1}/{len(VISEME_SPECS)}] {stem} ({', '.join(codes)})")
        try:
            png_bytes = invoke_inpaint(client, src_b64, mask_b64, prompt, seed=i * 7 + 42)
            out_path.write_bytes(png_bytes)
            print(f"    -> saved ({len(png_bytes)//1024} KB)")
        except Exception as e:
            print(f"    ERROR: {e}", file=sys.stderr)
        if i < len(VISEME_SPECS) - 1:
            time.sleep(0.5)


def generate_idle_frames(client, src_b64: str) -> None:
    print(f"\nGenerating {len(IDLE_SPECS)} idle shift frames (Nova Canvas color-guided)...")
    for i, (stem, prompt) in enumerate(IDLE_SPECS):
        out_path = OUT_DIR / f"{stem}.png"
        if out_path.exists():
            print(f"  [{i+1}/{len(IDLE_SPECS)}] {stem} — skipping (exists)")
            continue
        print(f"  [{i+1}/{len(IDLE_SPECS)}] {stem}")
        try:
            png_bytes = invoke_color_guided(client, src_b64, prompt, seed=100 + i * 13)
            out_path.write_bytes(png_bytes)
            print(f"    -> saved ({len(png_bytes)//1024} KB)")
        except Exception as e:
            print(f"    ERROR: {e}", file=sys.stderr)
        if i < len(IDLE_SPECS) - 1:
            time.sleep(0.5)


def write_manifest() -> None:
    manifest: dict[str, str] = {}
    for stem, codes, _ in VISEME_SPECS:
        for code in codes:
            manifest[code] = f"/sprites/{stem}.png"
    for i, (stem, _) in enumerate(IDLE_SPECS):
        manifest[f"idle_{i+1}"] = f"/sprites/{stem}.png"

    out = OUT_DIR / "manifest.json"
    out.write_text(json.dumps(manifest, indent=2))
    print(f"\nManifest -> {out}")
    for k, v in manifest.items():
        print(f"  {k:10s} -> {v}")


def main() -> None:
    if not SOURCE_IMAGE.exists():
        print(f"ERROR: source image not found: {SOURCE_IMAGE}", file=sys.stderr)
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Source : {SOURCE_IMAGE}")
    print(f"Output : {OUT_DIR}")
    print(f"Model  : {CANVAS_MODEL}")
    print(f"Region : {REGION}")
    print(f"Mask   : ellipse cx={MOUTH_CX} cy={MOUTH_CY} rx={MASK_RX} ry={MASK_RY} blur={MASK_BLUR}")

    client = boto3.client("bedrock-runtime", region_name=REGION)

    print("\nLoading source image...")
    src_b64 = base64.b64encode(SOURCE_IMAGE.read_bytes()).decode()
    print(f"  -> {len(src_b64)//1024} KB base64")

    print("Building mouth mask...")
    mask_b64 = make_mouth_mask_b64()
    print(f"  -> {len(mask_b64)//1024} KB base64")

    generate_viseme_frames(client, src_b64, mask_b64)
    generate_idle_frames(client, src_b64)
    write_manifest()

    print("\nDone! Sprites saved to frontend/public/sprites/")


if __name__ == "__main__":
    main()
