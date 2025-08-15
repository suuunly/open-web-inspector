# Release Process

This document describes how to create a new release of the Web Element Selector
library.

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
  `https://cdn.jsdelivr.net/npm/embedded-web-selector@VERSION/dist/web-element-selector.min.js`
- **unpkg:**
  `https://unpkg.com/embedded-web-selector@VERSION/dist/web-element-selector.min.js`

Replace `VERSION` with the actual version number (e.g., `1.0.1`).

## Build Scripts

- `npm run build` - Minify the main JavaScript file
- `npm run build:all` - Build and copy all distribution files
- `npm run clean` - Remove the dist directory
- `npm run prepare-release` - Build and bump version for release

## File Structure

```
dist/
├── web-element-selector.js        # Unminified version
├── web-element-selector.min.js    # Minified version (production)
└── web-element-selector.min.js.map # Source map for debugging
```

## Troubleshooting

- **Build fails:** Check that all dependencies are installed with `npm ci`
- **CDN not updating:** CDN propagation can take a few minutes
- **npm publish fails:** Ensure `NPM_TOKEN` secret is set in GitHub repository
  settings
