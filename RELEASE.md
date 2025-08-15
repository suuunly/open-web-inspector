# Release Process

This document describes how to create a new release of the Open Web Inspector
library.

## Changelog

### Version 1.0.4 (2024-08-15)

🎯 **AI-Actionable CSS Enhancement**

**New Features:**

- ✨ **AI-Actionable CSS Modification Guidance**: AI snapshots now include
  specific selector recommendations and code examples
- 🎨 **Enhanced Production CSS Detection**: Better handling of cross-origin
  stylesheets and computed styles
- 📊 **Smart Class Filtering**: Intelligent handling of multiple CSS classes
  with meaningful selector generation
- 🧠 **CSS Specificity Guidance**: Clear recommendations on which selectors to
  use for modifications
- 📝 **Ready-to-Use Code Examples**: Includes CSS rules and HTML inline style
  examples

**Improvements:**

- 🔧 **Better Cross-Origin Messaging**: Clear indication when stylesheets are
  blocked by CORS
- 📈 **Enhanced Computed Styles**: More comprehensive property extraction with
  meaningful value filtering
- 🎯 **Improved Element Selectors**: Smarter class combination logic that avoids
  utility class clutter
- 🤖 **AI-Friendly Output**: Structured guidance that enables AI systems to take
  actionable CSS modifications

**Technical Details:**

- Enhanced `generateCSSModificationGuidance()` method for intelligent selector
  suggestions
- Improved computed styles extraction with categorized properties (layout,
  typography, background, etc.)
- Better element selector generation with multiple class handling
- Production-grade cross-origin stylesheet detection and fallback

**For AI Developers:** This release makes Open Web Inspector snapshots
significantly more useful for AI workflows. AIs can now understand not just what
styles are applied, but exactly how to modify them with proper selectors and
specificity.

### Version 1.0.3 and Earlier

Previous releases focused on core inspector functionality, live CSS editing, and
basic cross-origin support.

## Automated Release Process

The project uses GitHub Actions to automatically build, minify, and deploy to
CDN when a new version tag is pushed.

### Creating a Release

1. **Update version and create tag:**
   ```bash
   # This will bump the patch version and create a git tag
   npm run prepare-release

   # Or manually bump version
   npm version patch   # 1.0.0 -> 1.0.1
   npm version minor   # 1.0.0 -> 1.1.0  
   npm version major   # 1.0.0 -> 2.0.0
   ```

2. **Push the tag to trigger release:**
   ```bash
   git push origin main --tags
   ```

3. **The GitHub Action will automatically:**
   - Install dependencies
   - Build and minify the JavaScript
   - Create a GitHub release with CDN links
   - Upload build artifacts
   - Publish to npm registry
   - Update CDN caches

## Manual Release (if needed)

If you need to create a release manually:

```bash
# Install dependencies
npm install

# Build the minified version
npm run build:all

# Verify the build
ls -la dist/

# Create and push tag
git tag v1.0.1
git push origin v1.0.1
```

## CDN Availability

After a successful release, the library will be available on:

- **jsDelivr:**
  `https://cdn.jsdelivr.net/npm/open-web-inspector@VERSION/dist/open-web-inspector.min.js`
- **unpkg:**
  `https://unpkg.com/open-web-inspector@VERSION/dist/open-web-inspector.min.js`

Replace `VERSION` with the actual version number (e.g., `1.0.1`).

## Build Scripts

- `npm run build` - Minify the main JavaScript file
- `npm run build:all` - Build and copy all distribution files
- `npm run clean` - Remove the dist directory
- `npm run prepare-release` - Build and bump version for release

## File Structure

```
dist/
├── open-web-inspector.js        # Unminified version
├── open-web-inspector.min.js    # Minified version (production)
└── open-web-inspector.min.js.map # Source map for debugging
```

## Troubleshooting

- **Build fails:** Check that all dependencies are installed with `npm ci`
- **CDN not updating:** CDN propagation can take a few minutes
- **npm publish fails:** Ensure `NPM_TOKEN` secret is set in GitHub repository
  settings
