#!/usr/bin/env node

/**
 * 🚀 Chrome Web Store Publisher
 * 
 * Local script for testing Chrome Web Store publishing
 * This mirrors the GitHub Actions workflow for local development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ChromeStorePublisher {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.extensionDir = path.join(this.projectRoot, 'extensions', 'chrome');
        this.packageJson = require(path.join(this.projectRoot, 'package.json'));
    }

    log(message, emoji = '📋') {
        console.log(`${emoji} ${message}`);
    }

    error(message) {
        console.error(`❌ ${message}`);
        process.exit(1);
    }

    success(message) {
        console.log(`✅ ${message}`);
    }

    async updateVersion(version) {
        this.log(`Updating extension to version ${version}`, '🔄');
        
        try {
            // Update manifest.json
            const manifestPath = path.join(this.extensionDir, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            manifest.version = version;
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
            
            // Update popup.html
            const popupPath = path.join(this.extensionDir, 'popup.html');
            let popupContent = fs.readFileSync(popupPath, 'utf8');
            popupContent = popupContent.replace(/Extension v[\d.]+/, `Extension v${version}`);
            fs.writeFileSync(popupPath, popupContent);
            
            this.success(`Version updated to ${version}`);
        } catch (error) {
            this.error(`Failed to update version: ${error.message}`);
        }
    }

    async buildExtension() {
        this.log('Building extension...', '🏗️');
        
        try {
            execSync('npm run build', { 
                cwd: this.projectRoot, 
                stdio: 'pipe' 
            });
            this.success('Extension built successfully');
        } catch (error) {
            this.error(`Build failed: ${error.message}`);
        }
    }

    async createPackage(version) {
        this.log(`Creating Chrome Web Store package for v${version}...`, '📦');
        
        const packageName = `open-web-inspector-chrome-extension-v${version}.zip`;
        const packagePath = path.join(this.projectRoot, packageName);
        
        try {
            // Remove old package if exists
            if (fs.existsSync(packagePath)) {
                fs.unlinkSync(packagePath);
            }
            
            // Create new package
            const excludeFiles = [
                '*.md',
                '*.DS_Store', 
                'README*',
                'ICON_REQUIREMENTS*',
                '*.log'
            ].map(pattern => `-x "${pattern}"`).join(' ');
            
            execSync(
                `cd "${this.extensionDir}" && zip -r "${packagePath}" . ${excludeFiles}`,
                { stdio: 'pipe' }
            );
            
            // Verify package
            const stats = fs.statSync(packagePath);
            this.success(`Package created: ${packageName} (${Math.round(stats.size / 1024)}KB)`);
            
            // Show package contents
            this.log('Package contents:', '📋');
            const contents = execSync(`unzip -l "${packagePath}"`, { encoding: 'utf8' });
            console.log(contents);
            
            return packagePath;
        } catch (error) {
            this.error(`Package creation failed: ${error.message}`);
        }
    }

    async validateEnvironment() {
        this.log('Validating environment...', '🔍');
        
        const requiredEnvVars = [
            'CHROME_EXTENSION_ID',
            'CHROME_CLIENT_ID', 
            'CHROME_CLIENT_SECRET',
            'CHROME_REFRESH_TOKEN'
        ];
        
        const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
        
        if (missing.length > 0) {
            this.error(`Missing environment variables: ${missing.join(', ')}\n` +
                      'Please set these in your .env file or environment.\n' +
                      'See CHROME_WEB_STORE_AUTOMATION.md for setup instructions.');
        }
        
        this.success('Environment validation passed');
    }

    async publishToStore(packagePath) {
        this.log('Publishing to Chrome Web Store...', '🚀');
        
        try {
            const chromeWebstoreUpload = require('chrome-webstore-upload');
            
            const webStore = chromeWebstoreUpload({
                extensionId: process.env.CHROME_EXTENSION_ID,
                clientId: process.env.CHROME_CLIENT_ID,
                clientSecret: process.env.CHROME_CLIENT_SECRET,
                refreshToken: process.env.CHROME_REFRESH_TOKEN,
            });
            
            // Upload the package
            const zipStream = fs.createReadStream(packagePath);
            await webStore.uploadExisting(zipStream);
            this.success('Package uploaded successfully');
            
            // Publish (or save as draft)
            const publish = process.argv.includes('--publish');
            if (publish) {
                await webStore.publish();
                this.success('Extension published live!');
            } else {
                this.log('Extension saved as draft (use --publish to go live)', '📝');
            }
            
        } catch (error) {
            this.error(`Publishing failed: ${error.message}`);
        }
    }

    async run() {
        const version = process.argv[2] || this.packageJson.version;
        
        console.log(`
🚀 Chrome Web Store Publisher
═══════════════════════════════

📦 Extension: Open Web Inspector
🏷️  Version: ${version}
📁 Target: Chrome Web Store
        `);

        try {
            // await this.validateEnvironment();
            await this.updateVersion(version);
            await this.buildExtension();
            const packagePath = await this.createPackage(version);
            
            console.log(`
✅ Package Ready for Chrome Web Store!

📦 Package: ${path.basename(packagePath)}
📊 Size: ${Math.round(fs.statSync(packagePath).size / 1024)}KB

🚀 Next Steps:
   1. Set up Chrome Web Store API credentials (see CHROME_WEB_STORE_AUTOMATION.md)
   2. Run with credentials: CHROME_EXTENSION_ID=abc123 node scripts/chrome-store-publish.js ${version} --publish
   3. Or use GitHub Actions for automated publishing

🔗 Chrome Web Store: https://chrome.google.com/webstore/devconsole/
            `);
            
            // If credentials are available, attempt publishing
            if (process.env.CHROME_EXTENSION_ID) {
                await this.publishToStore(packagePath);
            }
            
        } catch (error) {
            this.error(`Publishing pipeline failed: ${error.message}`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const publisher = new ChromeStorePublisher();
    publisher.run().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ChromeStorePublisher;
