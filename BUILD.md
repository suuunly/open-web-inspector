# 🏗️ Build Process

## Overview
This project uses a **build-on-demand** approach where generated files are not committed to git. All builds are generated via npm scripts.

## Quick Start

### For Library Development
```bash
npm install        # Install dependencies
npm run build      # Build both dev and prod versions
npm run dev        # Start development server
```

### For Chrome Extension Development  
```bash
npm run dev:extension      # Build extension for local testing
npm run package:extension  # Create distributable .zip file
```

## Build Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Build library (dev + prod versions) |
| `npm run build:extension` | Build extension with latest code |
| `npm run package:extension` | Build + package extension as zip |
| `npm run clean` | Remove all build artifacts |

## File Structure

```
├── src/index.js                           # Source code
├── dist/                                  # Generated (gitignored)
│   ├── open-web-inspector.js              # Dev build
│   └── open-web-inspector.min.js          # Prod build
├── extensions/chrome/
│   ├── open-web-inspector.min.js          # Copied from dist/
│   └── ...                               # Other extension files
└── open-web-inspector-chrome-extension.zip # Generated package
```

## CI/CD Considerations

For automated deployments, your pipeline should:

1. **Install dependencies:** `npm ci`
2. **Build artifacts:** `npm run build`  
3. **Package extension:** `npm run package:extension`
4. **Deploy:** Use generated zip file

## Development Workflow

1. **Make changes** to `src/index.js`
2. **Test locally:** `npm run dev:extension`
3. **Package for release:** `npm run package:extension`
4. **Commit only source files** (build artifacts are gitignored)

This ensures:
- ✅ Clean git history 
- ✅ No merge conflicts on generated files
- ✅ Always fresh builds
- ✅ Consistent build environment
