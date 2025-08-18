# 🚀 GitHub Actions Automation

This directory contains automated workflows for the Open Web Inspector project.

## 🎯 Available Workflows

### **🏪 Chrome Web Store Auto-Publish**
**File:** `workflows/chrome-web-store-publish.yml`

**Triggers:**
- 🏷️ **GitHub Release** (automatic)
- ⚡ **Manual Dispatch** (on-demand)

**Features:**
- ✅ Automated building and packaging
- ✅ Version management and synchronization
- ✅ Chrome Web Store API publishing
- ✅ Comprehensive error handling
- ✅ Detailed success/failure reporting

## 🔧 Setup Required

1. **📋 Read Setup Guide**: See `../CHROME_WEB_STORE_AUTOMATION.md`
2. **🔑 Configure Secrets**: Add Chrome Web Store API credentials to repository secrets
3. **🎯 Test Locally**: Use `npm run package:chrome` to test packaging

## 🚀 Usage Examples

### **Automatic Release**
```bash
# Create and push a new tag
git tag v1.2.0
git push origin v1.2.0

# Create GitHub release (triggers automation)
gh release create v1.2.0 --title "v1.2.0 - Amazing New Features"
```

### **Manual Trigger**
1. Go to **Actions** tab in GitHub
2. Select **🚀 Chrome Web Store Auto-Publish**
3. Click **Run workflow**
4. Enter version and options

## 📊 Monitoring

- **📈 View runs**: Actions tab → Chrome Web Store Auto-Publish
- **📦 Download artifacts**: Extension packages saved for 30 days
- **🔗 Direct links**: Workflow provides Chrome Web Store links

## 🛡️ Security

- **🔐 Secrets**: All credentials stored securely in GitHub Secrets
- **🚫 No exposure**: No sensitive data in logs or artifacts
- **✅ OAuth 2.0**: Industry-standard authentication flow

---

**🎉 Fully automated Chrome Web Store publishing - from Git tag to live extension!** 🚀
