#!/usr/bin/env bash
# Kompres satu video (URL atau path) tanpa mengubah resolusi.
# Usage: compress.sh <input-url-or-path> <output-path> [crf]
set -euo pipefail

INPUT="${1:?usage: compress.sh <input> <output> [crf]}"
OUTPUT="${2:?usage: compress.sh <input> <output> [crf]}"
CRF="${3:-30}"

mkdir -p "$(dirname "$OUTPUT")"

ffmpeg -hide_banner -loglevel error -stats -y \
  -i "$INPUT" \
  -c:v libx264 -preset medium -crf "$CRF" \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -c:a aac -b:a 96k \
  -movflags +faststart \
  -f mp4 \
  "$OUTPUT"

echo "OK: $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"