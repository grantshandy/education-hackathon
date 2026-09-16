#!/usr/bin/env bash
# Crops all sprites, viseme PNGs, and GIFs to a sub-region you define.
# Find the crop box in GIMP: Tools > Transform > Crop, note the X/Y/W/H
# from the Tool Options panel (or Image > Canvas Size after a selection).
#
# Usage:
#   bash scripts/crop-sprites.sh <x> <y> <width> <height>
#
# Example — crop to a 400x300 region starting at pixel (100, 50):
#   bash scripts/crop-sprites.sh 100 50 400 300
#
# Backups are saved alongside each file as <name>.bak.png / <name>.bak.gif
# Run again with different values; backups are only written if they don't
# already exist (so the original is always preserved).
set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo "Usage: $0 <x> <y> <width> <height>"
  echo "  x, y        — top-left corner of the crop region (pixels)"
  echo "  width, height — size of the crop region (pixels)"
  exit 1
fi

X=$1
Y=$2
W=$3
H=$4

SPRITES_DIR="frontend/public/sprites"
PUBLIC_DIR="frontend/public"

echo "Crop region: ${W}x${H} at +${X}+${Y}"
echo ""

crop_png() {
  local src="$1"
  local bak="${src%.png}.bak.png"
  if [[ ! -f "$bak" ]]; then
    cp "$src" "$bak"
    echo "  backed up → $(basename "$bak")"
  fi
  convert "$bak" -crop "${W}x${H}+${X}+${Y}" +repage "$src"
  echo "  cropped   → $(basename "$src")"
}

crop_jpg() {
  local src="$1"
  local bak="${src%.jpg}.bak.jpg"
  if [[ ! -f "$bak" ]]; then
    cp "$src" "$bak"
    echo "  backed up → $(basename "$bak")"
  fi
  convert "$bak" -crop "${W}x${H}+${X}+${Y}" +repage "$src"
  echo "  cropped   → $(basename "$src")"
}

crop_gif() {
  local src="$1"
  local bak="${src%.gif}.bak.gif"
  if [[ ! -f "$bak" ]]; then
    cp "$src" "$bak"
    echo "  backed up → $(basename "$bak")"
  fi
  # -coalesce expands frames before crop, -layers optimize recompresses after
  convert "$bak" -coalesce -crop "${W}x${H}+${X}+${Y}" +repage -layers optimize "$src"
  echo "  cropped   → $(basename "$src")"
}

echo "── Viseme sprites ──────────────────────────────────────"
for f in "$SPRITES_DIR"/viseme_*.png; do
  crop_png "$f"
done

echo ""
echo "── Transition GIFs ─────────────────────────────────────"
for f in "$SPRITES_DIR"/transition_*.gif; do
  crop_gif "$f"
done

echo ""
echo "── Main character images ────────────────────────────────"
crop_png "$PUBLIC_DIR/studying.png"
crop_jpg "$PUBLIC_DIR/at-attention.jpg"

echo ""
echo "Done. Originals are in *.bak.* files."
echo "To restore: for f in frontend/public/**/*.bak.*; do cp \"\$f\" \"\${f/.bak/}\"; done"
