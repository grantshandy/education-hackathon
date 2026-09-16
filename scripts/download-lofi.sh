#!/usr/bin/env bash
# Downloads 5 minutes of lofi video + audio, compresses, uploads to S3.
# Run from inside nix-shell: bash scripts/download-lofi.sh
set -euo pipefail

BUCKET="education-hackathon-audio-247826798819"
REGION="us-east-1"
URL="https://www.youtube.com/watch?v=CFGLoQIhmow"
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

echo "==> Downloading raw video (first 5 min)..."
yt-dlp \
  --format "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4]" \
  --merge-output-format mp4 \
  --download-sections "*0:00-5:00" \
  --output "$TMPDIR/raw.%(ext)s" \
  "$URL"

RAW="$TMPDIR/raw.mp4"

echo "==> Compressing video (no audio, 720p, CRF 28)..."
ffmpeg -y -i "$RAW" \
  -vf "scale=-2:480,fps=24" \
  -c:v libx264 -crf 28 -preset slow \
  -an \
  "$TMPDIR/lofi-video.mp4"

echo "==> Extracting and compressing audio (128kbps mp3)..."
ffmpeg -y -i "$RAW" \
  -vn \
  -c:a libmp3lame -b:a 128k \
  "$TMPDIR/lofi-music.mp3"

echo "==> Uploading to S3..."
aws s3 cp "$TMPDIR/lofi-video.mp4" "s3://$BUCKET/lofi-video.mp4" \
  --content-type "video/mp4" --region "$REGION"
aws s3 cp "$TMPDIR/lofi-music.mp3" "s3://$BUCKET/lofi-music.mp3" \
  --content-type "audio/mpeg" --region "$REGION"

VIDEO_SIZE=$(du -sh "$TMPDIR/lofi-video.mp4" | cut -f1)
AUDIO_SIZE=$(du -sh "$TMPDIR/lofi-music.mp3" | cut -f1)
echo "==> Done! video=${VIDEO_SIZE}, audio=${AUDIO_SIZE}"
echo "    s3://$BUCKET/lofi-video.mp4"
echo "    s3://$BUCKET/lofi-music.mp3"
