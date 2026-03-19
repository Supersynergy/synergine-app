#!/bin/bash
# Optimize images to AVIF + WebP using sharp-cli
# Usage: ./scripts/optimize-images.sh [input-dir] [output-dir]
# Requires: sharp-cli (npm i -g sharp-cli)

set -euo pipefail

INPUT_DIR="${1:-public/images}"
OUTPUT_DIR="${2:-public/images/optimized}"
SIZES=(320 640 1280 1920)
AVIF_QUALITY=70
WEBP_QUALITY=80

if ! command -v sharp &>/dev/null; then
  echo "Error: sharp-cli not found. Install it with: npm i -g sharp-cli" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

find "$INPUT_DIR" -maxdepth 1 \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r src; do
  base=$(basename "$src" | sed 's/\.[^.]*$//')
  echo "Processing: $src"

  for size in "${SIZES[@]}"; do
    # AVIF
    sharp --input "$src" \
      --output "$OUTPUT_DIR/${base}-${size}.avif" \
      resize "$size" \
      toFormat avif \
      quality "$AVIF_QUALITY"

    # WebP
    sharp --input "$src" \
      --output "$OUTPUT_DIR/${base}-${size}.webp" \
      resize "$size" \
      toFormat webp \
      quality "$WEBP_QUALITY"

    echo "  -> ${base}-${size}.avif + .webp"
  done
done

echo "Done. Optimized images written to $OUTPUT_DIR"
