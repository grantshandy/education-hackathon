#!/usr/bin/env bash
# Crops viseme sprites to just the mouth region and updates manifest.json
# with mouthPosition so CharacterCanvas positions them correctly.
#
# at-attention.png is kept FULL-FRAME (it's the base layer during talking).
# Only viseme_*.png files get cropped.
#
# Usage:
#   bash scripts/crop-sprites.sh <x> <y> <width> <height>
#
# Get coordinates from the crop tool:
#   npm run dev   # then visit http://localhost:5173/crop-tool.html
set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo "Usage: $0 <x> <y> <width> <height>"
  echo "  Get coordinates from http://localhost:5173/crop-tool.html"
  exit 1
fi

X=$1 Y=$2 W=$3 H=$4
SPRITES_DIR="frontend/public/sprites"
ATTENTION="frontend/public/at-attention.png"

echo "Crop region: ${W}x${H} at +${X}+${Y}"
echo ""

# Get original dimensions from at-attention.png (same as uncropped visemes)
ORIG_W=$(ffprobe -v error -show_entries stream=width -of csv=p=0 "$ATTENTION")
ORIG_H=$(ffprobe -v error -show_entries stream=height -of csv=p=0 "$ATTENTION")
echo "Source dimensions: ${ORIG_W}x${ORIG_H}"

# Backup and crop each viseme
echo ""
echo "── Cropping viseme sprites ─────────────────────────────"
for f in "$SPRITES_DIR"/viseme_*.png; do
  bak="${f%.png}.bak.png"
  if [[ ! -f "$bak" ]]; then
    cp "$f" "$bak"
  fi
  ffmpeg -y -loglevel error -i "$bak" -vf "crop=${W}:${H}:${X}:${Y}" "$f"
  echo "  $(basename "$f")  →  ${W}x${H}"
done

# Calculate mouthPosition percentages
echo ""
echo "── Updating manifest.json ──────────────────────────────"
python3 -c "
import json, sys
x, y, w, h = $X, $Y, $W, $H
ow, oh = $ORIG_W, $ORIG_H
mp = {
    'left':   round(x / ow * 100, 1),
    'top':    round(y / oh * 100, 1),
    'width':  round(w / ow * 100, 1),
    'height': round(h / oh * 100, 1)
}
path = '$SPRITES_DIR/manifest.json'
with open(path) as f:
    data = json.load(f)
data['mouthPosition'] = mp
with open(path, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
print(f'  mouthPosition: left={mp[\"left\"]}%  top={mp[\"top\"]}%  width={mp[\"width\"]}%  height={mp[\"height\"]}%')
"

echo ""
echo "Done. Originals saved as *.bak.png"
echo "Rebuild:  cd frontend && npm run build"
echo "Restore:  for f in $SPRITES_DIR/*.bak.png; do cp \"\$f\" \"\${f/.bak/}\"; done"
