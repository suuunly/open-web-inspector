# Open Web Inspector 🤖

**The open source AI-controllable web element inspector!**

A revolutionary, lightweight, embeddable JavaScript library that enables DOM
element inspection with hover highlighting, detailed CSS/HTML analysis, and
**external API control**. Perfect for AI landing pages, chatbots, developer
tools, and any website that needs intelligent element inspection capabilities.

## Features

- 🎯 **Hover Highlighting**: Red border appears around elements when hovering in
  analyze mode
- 🔍 **Element Inspector**: Click any element to see its HTML structure and CSS
  styles
- 📱 **Unified Code Panel**: Modern FAB-style interface with synchronized
  HTML/CSS navigation
- 🎨 **Live CSS Editing**: Edit CSS properties in real-time with visual feedback
- 📸 **Element Screenshots**: Capture and copy element screenshots to clipboard
- 🤖 **AI Snapshot**: Generate AI-friendly code analysis summaries
- 🌳 **Interactive Element Tree**: Navigate DOM hierarchy with clickable
  synchronized CSS updates
- 🎛️ **External API Control**: Revolutionary AI-controllable interface with
  global JavaScript API
- ⌨️ **Keyboard Shortcuts**: Ctrl+Shift+E to toggle, Escape to disable
- 🔗 **URL Parameter Support**: Auto-enable via ?web-selector=true
- 📡 **DOM Events**: Custom events for advanced integrations
- 🚀 **Zero Dependencies**: Pure vanilla JavaScript, dynamically loads helpers
  when needed
- 📦 **CDN Ready**: Single file include, works instantly

## Quick Start

### Method 1: CDN Include (Recommended)

🚀 **Automatically updated via GitHub Actions CI/CD pipeline!**

```html
<!-- ✅ Production (minified, ~79KB) -->
<script src="https://unpkg.com/open-web-inspector@latest/dist/open-web-inspector.min.js"></script>

<!-- 🔧 Development (unminified, ~134KB) -->
<script src="https://unpkg.com/open-web-inspector@latest/dist/open-web-inspector.js"></script>

<!-- 🌍 Alternative CDN (jsDelivr) -->
<script src="https://cdn.jsdelivr.net/npm/open-web-inspector@latest/dist/open-web-inspector.min.js"></script>

<!-- 📌 Specific version (recommended for production) -->
<script src="https://unpkg.com/open-web-inspector@1.0.1/dist/open-web-inspector.min.js"></script>
```

**🎯 Quick Enable:**

```html
<script>
  // Auto-enable on page load
  window.addEventListener("DOMContentLoaded", () => {
    OpenWebInspector.enable();
  });
</script>
```

**🤖 AI-Controllable:**

```html
<script>
  // Perfect for AI landing pages!
  OpenWebInspector.enable();

  // AI can call this to select specific elements
  OpenWebInspector.selectElement(".my-component");
</script>
```

### Method 2: Manual Integration

```html
<script src="open-web-inspector.js"></script>
<script>
  // Access the OpenWebInspector instance
  const selector = window.OpenWebInspector;

  // You can also manually toggle analyze mode
  // selector.toggleAnalyzeMode();
</script>
```

## 🤖 AI-Controllable Inspector (Revolutionary Feature!)

**The world's first AI-controllable web element inspector!** Perfect for AI
landing pages, chatbots, and automated workflows.

### Global JavaScript API

```javascript
// Enable analyze mode (AI: "Let me inspect that for you")
OpenWebInspector.enable();

// Disable analyze mode (AI: "Analysis complete")
OpenWebInspector.disable();

// Toggle analyze mode
OpenWebInspector.toggle();

// Check if currently active
OpenWebInspector.isActive(); // returns true/false

// Auto-select specific element (AI: "Let me check that button's CSS")
OpenWebInspector.selectElement(".my-button");

// Get version info
OpenWebInspector.getVersion(); // returns "2.0.0"
```

### AI Landing Page Integration Example

```javascript
// Your AI assistant can write and execute this:
OpenWebInspector.enable();
// User clicks element they want to inspect
// AI can then read the CSS data and provide suggestions
setTimeout(() => OpenWebInspector.disable(), 10000);
```

### Multiple Control Methods

#### 🌍 **Global API** (Primary Method)

```javascript
OpenWebInspector.enable(); // Perfect for AI assistants
```

#### ⌨️ **Keyboard Shortcuts**

- `Ctrl+Shift+E` - Toggle analyze mode
- `Escape` - Disable analyze mode

#### 📡 **DOM Events** (Advanced)

```javascript
// For complex integrations
document.dispatchEvent(new CustomEvent("web-selector-enable"));
document.dispatchEvent(new CustomEvent("web-selector-disable"));
document.dispatchEvent(
  new CustomEvent("web-selector-select", {
    detail: { selector: ".my-element" },
  }),
);
```

#### 🔗 **URL Parameters**

```
https://yoursite.com?web-selector=true           // Auto-enable
https://yoursite.com?inspect=.my-button         // Auto-select element
```

### Perfect for AI Assistants!

Your AI can now:

- Enable inspection mode on demand
- Guide users to specific elements
- Analyze CSS and provide suggestions
- Disable when analysis is complete
- Work seamlessly with any chat interface

## Usage

1. **Enable Analyze Mode**: Use API, keyboard shortcut, or URL parameter
2. **Hover Elements**: Move your mouse over any element to see red highlighting
3. **Inspect Element**: Click on any highlighted element to open the inspector
4. **Navigate Tree**: Click elements in the tree view to switch context with
   synchronized CSS
5. **Edit CSS Live**: Modify properties in real-time and see changes immediately
6. **Take Screenshots**: Click "📸 Capture" to capture and copy element image
7. **AI Analysis**: Click "✨ AI Snap" to copy AI-friendly code summary
8. **Close Inspector**: Click the X button, press Escape, or use the API

## Advanced Features

### 📸 Element Screenshots

- **One-click capture**: Automatically captures the selected element as a
  high-quality PNG image
- **Clipboard integration**: Images are directly copied to your clipboard for
  easy pasting
- **Smart cropping**: Only captures the specific element, not the entire page
- **Dynamic loading**: html2canvas library is loaded only when screenshot
  feature is used
- **Visual feedback**: Button shows progress and completion status

### 🤖 AI Snapshot

- **AI-optimized format**: Generates structured summaries perfect for pasting
  into AI chats
- **Complete context**: Includes element path, HTML structure, CSS styles, and
  computed values
- **Markdown formatted**: Clean, readable format with syntax highlighting
- **Development guidance**: Includes contextual notes to help AI understand the
  analysis purpose

### 🌳 Interactive Element Tree

- **Clickable navigation**: Click any element in the tree to switch inspector
  context
- **Visual hierarchy**: Clear indentation and icons show DOM structure
- **Real-time updates**: Tree updates when navigating to different elements
- **Smart highlighting**: Selected elements are highlighted on the actual page

## Inspector Features

### HTML Tab

- Complete HTML structure of the selected element
- Element path showing the CSS selector path
- Formatted, readable HTML output

### CSS Styles Tab

- Applied CSS styles from stylesheets and inline styles
- Property names and values clearly displayed
- Source indication (inline vs computed)

### Computed Styles Tab

- All computed CSS properties and their final values
- Comprehensive view of all styling applied to the element

## Keyboard Shortcuts

- `Ctrl+Shift+E` - Toggle analyze mode on/off
- `Escape` - Disable analyze mode and close inspector

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Structure

```
open-web-inspector/
├── open-web-inspector.js    # Main library file
├── index.html                 # Demo page
└── README.md                  # This file
```

## Advanced Configuration

The library automatically initializes and provides a comprehensive external API:

```javascript
// 🤖 AI-Friendly Global API
OpenWebInspector.enable(); // Enable analyze mode
OpenWebInspector.disable(); // Disable analyze mode
OpenWebInspector.toggle(); // Toggle analyze mode
OpenWebInspector.isActive(); // Check if active (returns boolean)
OpenWebInspector.selectElement(".btn"); // Auto-select element
OpenWebInspector.getVersion(); // Get version info

// 📡 DOM Events (Advanced Integrations)
document.dispatchEvent(new CustomEvent("web-selector-enable"));
document.dispatchEvent(new CustomEvent("web-selector-disable"));
document.dispatchEvent(
  new CustomEvent("web-selector-select", {
    detail: { selector: ".my-element" },
  }),
);

// 🔗 URL Parameters (Auto-Enable)
// ?web-selector=true          - Auto-enable on page load
// ?inspect=.my-button        - Auto-select specific element

// ⌨️ Keyboard Events (Built-in)
// Ctrl+Shift+E               - Toggle analyze mode
// Escape                     - Disable analyze mode
```

### Console Feedback

The library provides helpful console messages:

```
🚀 OpenWebInspector Global API Ready!
📘 Available methods:
  • OpenWebInspector.enable()
  • OpenWebInspector.disable()
  • OpenWebInspector.toggle()
  • OpenWebInspector.isActive()
  • OpenWebInspector.selectElement(selector)
  • OpenWebInspector.getVersion()

⌨️ Keyboard shortcuts active:
  • Ctrl+Shift+E = Toggle analyze mode
  • Escape = Disable analyze mode

📡 DOM events listening:
  • web-selector-enable
  • web-selector-disable
  • web-selector-toggle
  • web-selector-select (with detail.selector)

🔗 URL parameters supported:
  • ?web-selector=true (auto-enable)
  • ?inspect=.selector (auto-select element)
```

## CSS Classes Used

The library uses CSS classes with the `web-selector-` prefix to avoid conflicts:

- `.web-selector-highlight` - Applied to hovered elements
- `.web-selector-popup` - Main popup container
- `.web-selector-overlay` - Background overlay
- `.web-selector-analyze-cursor` - Applied to body when in analyze mode

## Customization

You can override the default styles by adding your own CSS after including the
library:

```css
.web-selector-highlight {
  outline-color: blue !important; /* Change highlight color */
}

.web-selector-popup {
  max-width: 600px !important; /* Adjust popup size */
}
```

## 🚀 Deployment & CI/CD

This project features **fully automated deployment** via GitHub Actions!

### 📦 Automated NPM Publishing

Every release automatically:

- ✅ Builds optimized production bundles
- ✅ Publishes to npm registry
- ✅ Updates CDN links (unpkg + jsDelivr)
- ✅ Generates comprehensive release notes
- ✅ Validates build integrity

### 🎯 Release Process

**Option 1: GitHub Release (Recommended)**

```bash
# Create a new release on GitHub
# Actions automatically build & publish to npm + CDN
```

**Option 2: Manual Trigger**

```bash
# Use GitHub Actions workflow dispatch
# Go to Actions → Release & Publish → Run workflow
```

**Option 3: Local Development**

```bash
npm run version:patch  # 1.0.0 → 1.0.1
npm run version:minor  # 1.0.1 → 1.1.0  
npm run version:major  # 1.1.0 → 2.0.0
git push origin main --tags
```

### 📊 Build Pipeline

```yaml
Trigger → Build → Test → Optimize → Publish → CDN Update
↓        ↓      ↓       ↓         ↓         ↓
GitHub   Terser  Smoke   79KB     NPM     Auto-Live
Action   Build   Test   Bundle   Publish   on CDN!
```

### 🌍 CDN Availability

After each release, your package is **instantly available** on:

| CDN          | URL Template                                                 | Update Time |
| ------------ | ------------------------------------------------------------ | ----------- |
| **unpkg**    | `https://unpkg.com/open-web-inspector@{version}/`            | ~1 minute   |
| **jsDelivr** | `https://cdn.jsdelivr.net/npm/open-web-inspector@{version}/` | ~2 minutes  |

### 🔧 Development Setup

```bash
# Clone and setup
git clone <your-repo>
cd open-web-inspector
npm install

# Start development
npm run dev              # Start server on :8002
npm run build           # Build both dev + production
npm run size           # Check bundle sizes

# Test examples
open http://localhost:8002/examples/
```

## License

MIT License - feel free to use in any project!

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test with the demo page
5. Submit a pull request

## Demo

Open `index.html` in your browser to see the library in action with a full demo
page showcasing various elements and styling scenarios.
