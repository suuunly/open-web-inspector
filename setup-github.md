# GitHub Repository Setup Guide

This guide walks you through setting up your repository for automated CDN
deployment.

## 1. Initialize Git Repository (if not done)

```bash
git init
git add .
git commit -m "Initial commit: Web Element Selector library with automated build pipeline"
```

## 2. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `embedded-web-selector`
3. Set it to public (required for CDN access)
4. Don't initialize with README (we already have one)

## 3. Connect Local Repository to GitHub

```bash
# Replace 'yourusername' with your actual GitHub username
git remote add origin https://github.com/yourusername/embedded-web-selector.git
git branch -M main
git push -u origin main
```

## 4. Set Up NPM Publishing (Required for CDN)

### Create NPM Account

1. Go to [npmjs.com](https://www.npmjs.com) and create an account
2. Verify your email address

### Generate NPM Token

1. Log in to npm: `npm login`
2. Generate an access token: `npm token create --type=automation`
3. Copy the token (you'll need it for GitHub secrets)

### Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:
   - **Name**: `NPM_TOKEN`
   - **Value**: Your npm token from step 2

## 5. Update Package.json with Your Details

Update the following fields in `package.json`:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/embedded-web-selector.git"
  },
  "homepage": "https://github.com/yourusername/embedded-web-selector#readme",
  "bugs": {
    "url": "https://github.com/yourusername/embedded-web-selector/issues"
  }
}
```

## 6. Create Your First Release

```bash
# Test the build process
npm run build:all

# Create initial release tag
git tag v1.0.0
git push origin main --tags
```

## 7. Verify Deployment

After pushing the tag, check:

1. **GitHub Actions**: Go to **Actions** tab to see the workflow running
2. **GitHub Releases**: Check the **Releases** section for your new release
3. **NPM Package**: Visit `https://www.npmjs.com/package/embedded-web-selector`
4. **CDN Links**: Test the CDN URLs:
   - `https://cdn.jsdelivr.net/npm/embedded-web-selector@1.0.0/dist/web-element-selector.min.js`
   - `https://unpkg.com/embedded-web-selector@1.0.0/dist/web-element-selector.min.js`

## 8. Future Releases

For subsequent releases:

```bash
# Method 1: Automatic version bump and build
npm run prepare-release
git push origin main --tags

# Method 2: Manual version control
npm version patch  # or minor, major
git push origin main --tags
```

## Troubleshooting

### Build Fails

- Ensure all dependencies are installed: `npm ci`
- Check that Node.js version is 18+ in the workflow

### NPM Publish Fails

- Verify `NPM_TOKEN` secret is correctly set
- Ensure package name is unique (check on npmjs.com)
- Make sure you're logged in: `npm whoami`

### CDN Not Updating

- CDN propagation can take 2-10 minutes
- Try accessing with specific version: `@1.0.0` instead of `@latest`
- Clear browser cache

### Permission Errors

- Ensure repository is public
- Check that GitHub Actions have proper permissions
- Verify NPM account is verified
