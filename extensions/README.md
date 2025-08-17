# Browser Extensions for Open Web Inspector

This directory contains browser extensions that automatically inject the Open
Web Inspector into every webpage you visit.

## 🚀 Chrome Extension

### Installation (Developer Mode)

1. **Open Chrome Extensions page:**
   - Go to `chrome://extensions/`
   - Or click Menu → More Tools → Extensions

2. **Enable Developer Mode:**
   - Toggle "Developer mode" in the top-right corner

3. **Load the Extension:**
   - Click "Load unpacked"
   - Select the `extensions/chrome/` folder
   - The extension should appear in your extensions list

4. **Test it:**
   - Visit any website
   - The Open Web Inspector is now automatically available
   - Use `Ctrl+Shift+E` to toggle the inspector
   - Click the extension icon for controls

### Features

- ✅ **Auto-injection**: Automatically loads Open Web Inspector on every page
- ✅ **Popup Controls**: Click extension icon for enable/disable/toggle controls
- ✅ **Context Menu**: Right-click → "Inspect with Open Web Inspector"
- ✅ **Keyboard Shortcuts**:
  - `Ctrl+Shift+E` - Toggle inspector
  - `Ctrl+Shift+I` - Force enable inspector
  - `Escape` - Disable inspector
- ✅ **Status Display**: Shows whether inspector is loaded/active
- ✅ **Zero Configuration**: Works instantly on any website

### Extension Structure

```
extensions/chrome/
├── manifest.json       # Extension configuration (Manifest V3)
├── content.js         # Auto-injection script
├── popup.html         # Extension popup interface
├── popup.js           # Popup functionality  
├── background.js      # Service worker & context menu
└── icons/             # Extension icons (placeholder)
```

### How It Works

1. **Direct Bundle Loading**: `open-web-inspector.min.js` loads as trusted
   extension content script
2. **Simple Setup**: `content.js` provides keyboard shortcuts and popup
   communication
3. **Zero CSP Issues**: Extension files are trusted by browser, no injection
   needed
4. **Instant Availability**: Library is ready immediately on every page
5. **Clean Interface**: Simple toggle button and keyboard shortcuts

### Development Commands

```bash
# Build everything (including extension)
npm run build

# Extension-specific commands
npm run build:extension
npm run dev:extension
```

## 🔧 Future Firefox Extension

Firefox extension support is planned using the same shared codebase with
Firefox-specific manifest adjustments.

```
extensions/firefox/
├── manifest.json       # Firefox Manifest V2/V3
└── (shared files)      # Symlinks to chrome/ files
```

## 📦 Extension Distribution

The extensions can be:

- **Loaded manually** in developer mode (current method)
- **Published to Chrome Web Store** (requires submission)
- **Distributed as .crx files** for enterprise deployment
- **Auto-built** as part of the npm package

## 🎯 Use Cases

- **Automatic Developer Tools**: Every page gets inspection capabilities
- **AI Assistant Integration**: Perfect for AI-controlled web analysis
- **Educational Tools**: Students can inspect any website element
- **QA Testing**: Quick access to CSS debugging on any site
- **Design Analysis**: Instant access to styling information

The extension makes your browser into a powerful web development tool by
default! 🚀
