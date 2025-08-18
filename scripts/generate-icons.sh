#!/bin/bash

# 🎨 Chrome Extension Icon Generator
# Generates all required icon sizes from the base icon

echo "🎨 Generating Chrome Extension Icons..."

BASE_ICON="../resources/icon.png"
ICONS_DIR="../extensions/chrome/icons"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found!"
    echo ""
    echo "📦 To install ImageMagick:"
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    echo "   Windows: Download from https://imagemagick.org/script/download.php"
    echo ""
    echo "🔄 Alternative: Use online tools like:"
    echo "   • https://www.iloveimg.com/resize-image"
    echo "   • https://squoosh.app/"
    echo "   • https://tinypng.com/"
    echo ""
    echo "📐 Required sizes:"
    echo "   • 16x16 pixels → icon-16.png"
    echo "   • 32x32 pixels → icon-32.png" 
    echo "   • 48x48 pixels → icon-48.png"
    echo "   • 128x128 pixels → icon-128.png"
    exit 1
fi

# Create icons directory if it doesn't exist
mkdir -p "$ICONS_DIR"

# Generate all required sizes
echo "📐 Generating icon-16.png (16x16)..."
convert "$BASE_ICON" -resize 16x16 "$ICONS_DIR/icon-16.png"

echo "📐 Generating icon-32.png (32x32)..."
convert "$BASE_ICON" -resize 32x32 "$ICONS_DIR/icon-32.png"

echo "📐 Generating icon-48.png (48x48)..."
convert "$BASE_ICON" -resize 48x48 "$ICONS_DIR/icon-48.png"

echo "📐 Generating icon-128.png (128x128)..."
convert "$BASE_ICON" -resize 128x128 "$ICONS_DIR/icon-128.png"

echo ""
echo "✅ All Chrome extension icons generated successfully!"
echo ""
echo "📂 Generated files:"
echo "   • $ICONS_DIR/icon-16.png"
echo "   • $ICONS_DIR/icon-32.png"
echo "   • $ICONS_DIR/icon-48.png"
echo "   • $ICONS_DIR/icon-128.png"
echo ""
echo "🚀 Ready for Chrome Web Store submission!"
