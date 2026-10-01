#!/usr/bin/env bash
# Kompres satu video (URL atau path) tanpa mengubah resolusi.
# Usage: compress.sh <input-url-or-path> <output-path> [crf] [referer]
set -euo pipefail

INPUT="${1:?usage: compress.sh <input> <output> [crf] [referer]}"
OUTPUT="${2:?usage: compress.sh <input> <output> [crf] [referer]}"
CRF="${3:-30}"
REFERER="${4:-}"

UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

mkdir -p "$(dirname "$OUTPUT")"

HDR=()
if [ -n "$REFERER" ]; then
  HDR+=(-headers "Referer: ${REFERER}\r\nOrigin: ${REFERER%%/embed*}")
fi

ffmpeg -hide_banner -loglevel error -stats -y \
  -user_agent "$UA" \
  "${HDR[@]}" \
  -protocol_whitelist file,http,https,tcp,tls,crypto \
  -i "$INPUT" \
  -c:v libx264 -preset medium -crf "$CRF" \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -c:a aac -b:a 96k \
  -movflags +faststart \
  -f mp4 \
  "$OUTPUT"

echo "OK: $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"