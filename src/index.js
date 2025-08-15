(function() {
    'use strict';

    // Avoid conflicts if already loaded
    if (window.OpenWebInspector) {
        return;
    }

    class OpenWebInspector {
        constructor() {
            this.isAnalyzeMode = false;
            this.currentHighlightedElement = null;
            this.popup = null;
            this.overlay = null;
            this.originalCursor = null;
            this.cssChanges = new Map(); // Track CSS changes: element -> {property: {original, current}}
            this.currentElement = null; // Track current element being inspected
            this.actualSelectedElement = null; // Track actual page element (not inspector UI)
            
            this.init();
        }

        init() {
            this.createStyles();
            this.setupEventListeners();
            this.setupExternalAPI();
            this.setupKeyboardShortcuts();
            this.setupDOMEvents();
            this.checkURLParameters();
        }

        createStyles() {
            // Create and inject CSS styles
            const style = document.createElement('style');
            style.id = 'open-web-inspector-styles';
            style.textContent = `
                .open-web-inspector-highlight {
                    position: relative !important;
                    outline: 2px solid #ff4444 !important;
                    outline-offset: 1px !important;
                    box-shadow: 0 0 0 1px rgba(255, 68, 68, 0.3) !important;
                    z-index: 9998 !important;
                }

                .open-web-inspector-popup {
                    position: fixed !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    width: 98vw !important;
                    max-width: 1200px !important;
                    max-height: 90vh !important;
                    background: white !important;
                    border: 1px solid #ddd !important;
                    border-radius: 10px !important;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3) !important;
                    z-index: 10001 !important;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                    font-size: 15px !important;
                    overflow: hidden !important;
                }

                .open-web-inspector-popup-header {
                    background: #f8f9fa !important;
                    padding: 20px 25px !important;
                    border-bottom: 1px solid #ddd !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                }

                .open-web-inspector-popup-title {
                    margin: 0 !important;
                    font-size: 20px !important;
                    font-weight: 600 !important;
                    color: #333 !important;
                }

                .open-web-inspector-popup-close {
                    background: none !important;
                    border: none !important;
                    font-size: 24px !important;
                    cursor: pointer !important;
                    color: #666 !important;
                    padding: 0 !important;
                    width: 32px !important;
                    height: 32px !important;
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: background-color 0.2s !important;
                }

                .open-web-inspector-popup-close:hover {
                    background-color: #f0f0f0 !important;
                }

                .open-web-inspector-ai-snapshot-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    border: none !important;
                    color: white !important;
                    padding: 8px 16px !important;
                    border-radius: 6px !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                    margin-right: 12px !important;
                }

                .open-web-inspector-ai-snapshot-btn:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
                    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%) !important;
                }

                .open-web-inspector-ai-snapshot-btn:active {
                    transform: translateY(0) !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                }

                .open-web-inspector-ai-snapshot-btn.copied {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%) !important;
                }

                .open-web-inspector-popup-header-actions {
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                }

                .open-web-inspector-screenshot-btn {
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
                    border: none !important;
                    color: white !important;
                    padding: 8px 16px !important;
                    border-radius: 6px !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                    margin-right: 8px !important;
                }

                .open-web-inspector-screenshot-btn:hover {
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
                    background: linear-gradient(135deg, #ff5252 0%, #e53e3e 100%) !important;
                }

                .open-web-inspector-screenshot-btn:active {
                    transform: translateY(0) !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                }

                .open-web-inspector-screenshot-btn.capturing {
                    background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%) !important;
                }

                .open-web-inspector-screenshot-btn.copied {
                    background: linear-gradient(135deg, #48bb78 0%, #38a169 100%) !important;
                }

                .open-web-inspector-css-value-input {
                    background: transparent !important;
                    border: 1px solid transparent !important;
                    color: #e74c3c !important;
                    font-family: 'Courier New', monospace !important;
                    font-size: 11px !important;
                    padding: 2px 4px !important;
                    border-radius: 3px !important;
                    min-width: 60px !important;
                    max-width: 200px !important;
                    transition: all 0.2s ease !important;
                }

                .open-web-inspector-css-value-input:hover {
                    border-color: #3498db !important;
                    background: rgba(52, 152, 219, 0.1) !important;
                }

                .open-web-inspector-css-value-input:focus {
                    outline: none !important;
                    border-color: #3498db !important;
                    background: rgba(52, 152, 219, 0.15) !important;
                    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2) !important;
                }

                .open-web-inspector-css-value-input.changed {
                    background: rgba(46, 204, 113, 0.15) !important;
                    border-color: #2ecc71 !important;
                    color: #27ae60 !important;
                    font-weight: 600 !important;
                }

                .open-web-inspector-css-reset-btn {
                    background: #95a5a6 !important;
                    border: none !important;
                    color: white !important;
                    padding: 2px 6px !important;
                    border-radius: 3px !important;
                    font-size: 10px !important;
                    cursor: pointer !important;
                    margin-left: 8px !important;
                    opacity: 0 !important;
                    transition: opacity 0.2s ease !important;
                }

                .open-web-inspector-css-property:hover .open-web-inspector-css-reset-btn {
                    opacity: 1 !important;
                }

                .open-web-inspector-css-reset-btn:hover {
                    background: #7f8c8d !important;
                }

                .open-web-inspector-css-rule-group {
                    background: #ffffff !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 6px !important;
                    margin-bottom: 12px !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                    overflow: hidden !important;
                }

                .open-web-inspector-css-rule-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    padding: 8px 12px !important;
                    cursor: pointer !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    font-weight: 600 !important;
                    font-size: 12px !important;
                    user-select: none !important;
                    transition: all 0.2s ease !important;
                }

                .open-web-inspector-css-rule-header:hover {
                    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%) !important;
                    transform: translateY(-1px) !important;
                }

                .open-web-inspector-css-rule-header.collapsed {
                    background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%) !important;
                }

                .open-web-inspector-css-rule-selector {
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
                    font-size: 11px !important;
                }

                .open-web-inspector-css-rule-toggle {
                    font-size: 14px !important;
                    transition: transform 0.2s ease !important;
                }

                .open-web-inspector-css-rule-toggle.collapsed {
                    transform: rotate(-90deg) !important;
                }

                .open-web-inspector-css-rule-content {
                    display: block !important;
                    overflow: hidden !important;
                    transition: max-height 0.3s ease !important;
                }

                .open-web-inspector-css-rule-content.collapsed {
                    max-height: 0 !important;
                }

                .open-web-inspector-css-rule-properties {
                    padding: 8px !important;
                }

                .open-web-inspector-css-rules-container {
                    padding: 0 !important;
                    margin: 0 !important;
                }

                .open-web-inspector-css-inherited-rule {
                    border-left: 3px solid #f39c12 !important;
                    background: linear-gradient(135deg, #fff3cd 0%, #fef9e7 100%) !important;
                }

                .open-web-inspector-css-inherited-rule .open-web-inspector-css-rule-header {
                    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%) !important;
                }

                .open-web-inspector-css-inherited-rule .open-web-inspector-css-rule-header:hover {
                    background: linear-gradient(135deg, #e67e22 0%, #d35400 100%) !important;
                }

                .open-web-inspector-popup-content {
                    padding: 0 !important;
                    max-height: calc(90vh - 70px) !important;
                    overflow-y: auto !important;
                }

                .open-web-inspector-tabs {
                    display: flex !important;
                    border-bottom: 1px solid #ddd !important;
                    background: #f8f9fa !important;
                }

                .open-web-inspector-tab {
                    padding: 12px 24px !important;
                    background: none !important;
                    border: none !important;
                    cursor: pointer !important;
                    font-size: 15px !important;
                    font-weight: 500 !important;
                    color: #666 !important;
                    transition: all 0.2s !important;
                    border-bottom: 3px solid transparent !important;
                }

                .open-web-inspector-tab.active {
                    color: #4299e1 !important;
                    border-bottom-color: #4299e1 !important;
                    background: white !important;
                }

                .open-web-inspector-tab:hover {
                    background: #e2e8f0 !important;
                }

                .open-web-inspector-tab-content {
                    padding: 20px 25px !important;
                    display: none !important;
                }

                .open-web-inspector-tab-content.active {
                    display: block !important;
                }

                .open-web-inspector-html-content {
                    background: #f8f9fa !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 4px !important;
                    padding: 15px !important;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
                    font-size: 13px !important;
                    line-height: 1.5 !important;
                    white-space: pre-wrap !important;
                    overflow-x: auto !important;
                    max-height: 400px !important;
                    overflow-y: auto !important;
                    margin: 0 !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                }

                .open-web-inspector-css-grid {
                    display: grid !important;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
                    gap: 1px !important;
                    background: #f0f0f0 !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 4px !important;
                    overflow: hidden !important;
                    margin: 0 !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                }

                .open-web-inspector-css-property {
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    padding: 6px 10px !important;
                    background: white !important;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
                    font-size: 11px !important;
                    line-height: 1.3 !important;
                    min-height: 32px !important;
                    border-bottom: 1px solid #f0f0f0 !important;
                }

                .open-web-inspector-css-property:nth-child(even) {
                    background-color: #f8f9fa !important;
                }

                .open-web-inspector-css-property-name {
                    font-weight: 600 !important;
                    color: #e53e3e !important;
                    min-width: 100px !important;
                    max-width: 130px !important;
                    margin-right: 8px !important;
                    flex-shrink: 0 !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                }

                .open-web-inspector-css-property-value {
                    color: #2d3748 !important;
                    text-align: right !important;
                    flex: 1 !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    white-space: nowrap !important;
                    font-size: 11px !important;
                }

                .open-web-inspector-overlay {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: rgba(0, 0, 0, 0.5) !important;
                    z-index: 10000 !important;
                }

                .open-web-inspector-analyze-cursor {
                    cursor: crosshair !important;
                }

                .open-web-inspector-element-tree-section {
                    background: #ffffff !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 6px !important;
                    margin-bottom: 25px !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                }

                .open-web-inspector-element-tree-header {
                    background: #4299e1 !important;
                    color: white !important;
                    padding: 10px 15px !important;
                    border-radius: 6px 6px 0 0 !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    margin: 0 !important;
                    border-bottom: 1px solid #3182ce !important;
                }

                .open-web-inspector-element-path {
                    background: #f7fafc !important;
                    padding: 8px 12px !important;
                    border-radius: 0 0 6px 6px !important;
                    margin: 0 !important;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
                    font-size: 13px !important;
                    color: #4a5568 !important;
                    white-space: pre !important;
                    overflow-x: auto !important;
                    line-height: 1.5 !important;
                    max-height: 250px !important;
                    overflow-y: auto !important;
                }

                .open-web-inspector-content-section {
                    background: #ffffff !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 6px !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                    overflow: hidden !important;
                }

                .open-web-inspector-element-path .tree-element {
                    cursor: pointer !important;
                    padding: 2px 4px !important;
                    border-radius: 3px !important;
                    transition: all 0.2s ease !important;
                    display: inline-block !important;
                }

                .open-web-inspector-element-path .tree-element:hover {
                    background-color: #e2e8f0 !important;
                    color: #2d3748 !important;
                }

                .open-web-inspector-element-path .tree-element.selected {
                    background-color: #4299e1 !important;
                    color: white !important;
                    font-weight: 600 !important;
                }

                .open-web-inspector-element-path .tree-element.selected:hover {
                    background-color: #3182ce !important;
                }



                .open-web-inspector-preview-content {
                    transform: scale(0.8) !important;
                    transform-origin: top left !important;
                    width: 125% !important;
                    pointer-events: none !important;
                    position: relative !important;
                    overflow: hidden !important;
                    padding: 15px !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 4px !important;
                    background: #ffffff !important;
                    max-height: 300px !important;
                    overflow-y: auto !important;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
                }

                .open-web-inspector-preview-content * {
                    pointer-events: none !important;
                    max-width: none !important;
                    position: static !important;
                }

                .open-web-inspector-preview-content img {
                    max-width: 100% !important;
                    height: auto !important;
                }

                .open-web-inspector-preview-content script {
                    display: none !important;
                }

                .open-web-inspector-sub-tabs {
                    display: flex !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    background: #f8f9fa !important;
                    margin: 0 !important;
                    padding: 0 20px !important;
                }

                .open-web-inspector-sub-tab {
                    padding: 8px 16px !important;
                    background: none !important;
                    border: none !important;
                    cursor: pointer !important;
                    font-size: 13px !important;
                    font-weight: 500 !important;
                    color: #666 !important;
                    transition: all 0.2s !important;
                    border-bottom: 2px solid transparent !important;
                    position: relative !important;
                }

                .open-web-inspector-sub-tab.active {
                    color: #4299e1 !important;
                    border-bottom-color: #4299e1 !important;
                    background: white !important;
                }

                .open-web-inspector-sub-tab:hover {
                    background: #e2e8f0 !important;
                }

                .open-web-inspector-sub-tab.active:hover {
                    background: white !important;
                }

                .open-web-inspector-sub-tab-content {
                    display: none !important;
                    padding: 20px !important;
                }

                .open-web-inspector-sub-tab-content.active {
                    display: block !important;
                }

                /* ========== NEW FAB-STYLE POPUP ========== */
                .open-web-inspector-fab-popup {
                    position: fixed !important;
                    z-index: 999999 !important;
                    background: #2d3748 !important;
                    border-radius: 25px !important;
                    padding: 8px 12px !important;
                    display: flex !important;
                    gap: 4px !important;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
                    backdrop-filter: blur(10px) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    animation: fabSlideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
                }

                @keyframes fabSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.8) translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .open-web-inspector-fab-button {
                    width: 52px !important;
                    height: 52px !important;
                    border-radius: 18px !important;
                    border: none !important;
                    background: transparent !important;
                    color: #e2e8f0 !important;
                    cursor: pointer !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    font-size: 14px !important;
                    position: relative !important;
                    overflow: hidden !important;
                    padding: 6px 4px 4px 4px !important;
                    gap: 2px !important;
                }

                .open-web-inspector-fab-button:before {
                    content: '' !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(255, 255, 255, 0.1) !important;
                    border-radius: 18px !important;
                    opacity: 0 !important;
                    transition: opacity 0.2s !important;
                }

                .open-web-inspector-fab-label {
                    font-size: 9px !important;
                    font-weight: 500 !important;
                    color: inherit !important;
                    text-align: center !important;
                    line-height: 1 !important;
                    margin-top: 1px !important;
                    letter-spacing: 0.3px !important;
                    opacity: 0.9 !important;
                    z-index: 1 !important;
                    position: relative !important;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }

                .open-web-inspector-fab-button:hover:before {
                    opacity: 1 !important;
                }

                .open-web-inspector-fab-button:hover .open-web-inspector-fab-label {
                    opacity: 1 !important;
                    transform: translateY(-1px) !important;
                }

                .open-web-inspector-fab-button:hover {
                    transform: scale(1.05) !important;
                    color: white !important;
                }

                .open-web-inspector-fab-button:active {
                    transform: scale(0.95) !important;
                }

                .open-web-inspector-fab-button svg {
                    width: 16px !important;
                    height: 16px !important;
                    fill: currentColor !important;
                    z-index: 1 !important;
                    position: relative !important;
                }

                /* Color variants for different buttons */
                .open-web-inspector-fab-button.code {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                }

                .open-web-inspector-fab-button.screenshot {
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
                }

                .open-web-inspector-fab-button.natural-language {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
                }

                .open-web-inspector-fab-tooltip {
                    position: absolute !important;
                    bottom: -40px !important;
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    background: #1a202c !important;
                    color: white !important;
                    padding: 4px 8px !important;
                    border-radius: 6px !important;
                    font-size: 11px !important;
                    white-space: nowrap !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    transition: opacity 0.2s !important;
                    z-index: 1000000 !important;
                }

                .open-web-inspector-fab-button:hover .open-web-inspector-fab-tooltip {
                    opacity: 1 !important;
                }

                /* Panel styles for when buttons are clicked */
                .open-web-inspector-panel {
                    position: fixed !important;
                    z-index: 999998 !important;
                    background: white !important;
                    border-radius: 12px !important;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
                    border: 1px solid #e2e8f0 !important;
                    min-width: 350px !important;
                    max-width: 500px !important;
                    max-height: 600px !important;
                    overflow: hidden !important;
                    animation: panelSlideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
                }

                @keyframes panelSlideIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .open-web-inspector-panel-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    color: white !important;
                    padding: 16px 20px !important;
                    font-weight: 600 !important;
                    font-size: 16px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    cursor: move !important;
                }

                .open-web-inspector-panel-close {
                    background: rgba(255, 255, 255, 0.2) !important;
                    border: none !important;
                    color: white !important;
                    width: 24px !important;
                    height: 24px !important;
                    border-radius: 12px !important;
                    cursor: pointer !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s !important;
                }

                .open-web-inspector-panel-close:hover {
                    background: rgba(255, 255, 255, 0.3) !important;
                    transform: scale(1.1) !important;
                }

                .open-web-inspector-panel-header-actions {
                    display: flex !important;
                    align-items: center !important;
                    gap: 10px !important;
                }

                .open-web-inspector-copy-ai-instructions-btn {
                    background: rgba(255, 255, 255, 0.9) !important;
                    border: 1px solid rgba(255, 255, 255, 0.3) !important;
                    color: #4a5568 !important;
                    padding: 6px 12px !important;
                    border-radius: 6px !important;
                    font-size: 12px !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    font-weight: 600 !important;
                    backdrop-filter: blur(10px) !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                }

                .open-web-inspector-copy-ai-instructions-btn:hover {
                    background: rgba(255, 255, 255, 1) !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                    color: #2d3748 !important;
                }

                /* Natural Language Panel Styling */
                .open-web-inspector-natural-language-panel {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                    border: none !important;
                    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4) !important;
                    z-index: 1000000 !important; /* Higher than FAB popup (999999) */
                }

                .open-web-inspector-natural-language-panel .open-web-inspector-panel-header {
                    background: rgba(255, 255, 255, 0.1) !important;
                    backdrop-filter: blur(10px) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
                }

                .open-web-inspector-ask-ai-title {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 2px !important;
                }

                .open-web-inspector-ask-ai-main-title {
                    color: white !important;
                    font-weight: 700 !important;
                    font-size: 16px !important;
                    line-height: 1.2 !important;
                }

                .open-web-inspector-ask-ai-subtitle {
                    color: rgba(255, 255, 255, 0.8) !important;
                    font-weight: 400 !important;
                    font-size: 12px !important;
                    line-height: 1.2 !important;
                    opacity: 0.9 !important;
                }

                .open-web-inspector-natural-language-panel .open-web-inspector-panel-content {
                    background: rgba(255, 255, 255, 0.95) !important;
                    backdrop-filter: blur(10px) !important;
                }

                /* Code Panel Title Styling */
                .open-web-inspector-code-panel-title {
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 2px !important;
                }

                .open-web-inspector-code-panel-main-title {
                    color: white !important;
                    font-weight: 700 !important;
                    font-size: 16px !important;
                    line-height: 1.2 !important;
                }

                .open-web-inspector-code-panel-subtitle {
                    color: rgba(255, 255, 255, 0.8) !important;
                    font-weight: 400 !important;
                    font-size: 12px !important;
                    line-height: 1.2 !important;
                    opacity: 0.9 !important;
                }

                .open-web-inspector-panel-content {
                    padding: 0 !important;
                    overflow-y: auto !important;
                    max-height: 520px !important;
                }

                /* Code panel specific styles */
                .open-web-inspector-code-tabs {
                    display: flex !important;
                    background: #f8f9fa !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                .open-web-inspector-code-tab {
                    flex: 1 !important;
                    padding: 12px 20px !important;
                    background: none !important;
                    border: none !important;
                    cursor: pointer !important;
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    color: #666 !important;
                    transition: all 0.2s !important;
                    border-bottom: 3px solid transparent !important;
                }

                .open-web-inspector-code-tab.active {
                    color: #4299e1 !important;
                    border-bottom-color: #4299e1 !important;
                    background: white !important;
                }

                .open-web-inspector-code-tab:hover {
                    background: #e2e8f0 !important;
                }

                .open-web-inspector-code-tab.active:hover {
                    background: white !important;
                }

                .open-web-inspector-code-tab-content {
                    display: none !important;
                }

                .open-web-inspector-code-tab-content.active {
                    display: block !important;
                }
            `;
            document.head.appendChild(style);
        }

        setupEventListeners() {
            this.handleMouseOver = this.handleMouseOver.bind(this);
            this.handleMouseOut = this.handleMouseOut.bind(this);
            this.handleClick = this.handleClick.bind(this);
            this.handleKeyPress = this.handleKeyPress.bind(this);
            
            document.addEventListener('keydown', this.handleKeyPress);
        }

        setupExternalAPI() {
            // Store reference to this instance for later API attachment
            this._apiInstance = this;
            
            console.log('🚀 OpenWebInspector External API Setup Complete!');
            console.log('📘 API will be available after initialization...');
        }

        attachGlobalAPI() {
            // Attach API methods to the global instance (called after window.OpenWebInspector is set)
            const instance = this;
            
            // Store original class methods
            instance._originalMethods = {
                enableAnalyzeMode: instance.enableAnalyzeMode,
                disableAnalyzeMode: instance.disableAnalyzeMode,
                toggleAnalyzeMode: instance.toggleAnalyzeMode
            };
            
            // Add external API methods to the instance
            instance.enable = () => {
                if (!instance.isAnalyzeMode) {
                    instance.enableAnalyzeMode();
                }
                return true;
            };
            
            instance.disable = () => {
                if (instance.isAnalyzeMode) {
                    instance.disableAnalyzeMode();
                }
                return true;
            };
            
            instance.toggle = () => {
                instance.toggleAnalyzeMode();
                return instance.isAnalyzeMode;
            };
            
            instance.isActive = () => {
                return instance.isAnalyzeMode;
            };
            
            instance.getVersion = () => {
                return '2.0.0'; // Updated version with external API
            };
            
            // Advanced API methods
            instance.selectElement = (selector) => {
                if (!instance.isAnalyzeMode) {
                    instance.enableAnalyzeMode();
                }
                const element = document.querySelector(selector);
                if (element) {
                    instance.showElementDetails(element);
                    return true;
                }
                return false;
            };
            
            console.log('🚀 OpenWebInspector Global API Ready!');
            console.log('📘 Available methods:');
            console.log('  • OpenWebInspector.enable()');
            console.log('  • OpenWebInspector.disable()');
            console.log('  • OpenWebInspector.toggle()');
            console.log('  • OpenWebInspector.isActive()');
            console.log('  • OpenWebInspector.selectElement(selector)');
            console.log('  • OpenWebInspector.getVersion()');
        }

        setupKeyboardShortcuts() {
            // Keyboard shortcuts for external control
            document.addEventListener('keydown', (e) => {
                // Ctrl+Shift+E = Enable analyze mode
                if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                    e.preventDefault();
                    this.toggleAnalyzeMode();
                    console.log('🔥 Analyze mode toggled via keyboard shortcut (Ctrl+Shift+E)');
                }
                
                // Escape = Disable analyze mode (if active)
                if (e.key === 'Escape' && this.isAnalyzeMode) {
                    e.preventDefault();
                    this.disableAnalyzeMode();
                    console.log('👋 Analyze mode disabled via Escape key');
                }
            });
            
            console.log('⌨️ Keyboard shortcuts active:');
            console.log('  • Ctrl+Shift+E = Toggle analyze mode');
            console.log('  • Escape = Disable analyze mode');
        }

        setupDOMEvents() {
            // Custom DOM events for external control
            const instance = this;
            
            document.addEventListener('open-web-inspector-enable', () => {
                if (instance.enable) {
                    instance.enable();
                } else {
                    instance.enableAnalyzeMode();
                }
                console.log('🎯 Analyze mode enabled via DOM event');
            });
            
            document.addEventListener('open-web-inspector-disable', () => {
                if (instance.disable) {
                    instance.disable();
                } else {
                    instance.disableAnalyzeMode();
                }
                console.log('🎯 Analyze mode disabled via DOM event');
            });
            
            document.addEventListener('open-web-inspector-toggle', () => {
                if (instance.toggle) {
                    instance.toggle();
                } else {
                    instance.toggleAnalyzeMode();
                }
                console.log('🎯 Analyze mode toggled via DOM event');
            });
            
            document.addEventListener('open-web-inspector-select', (e) => {
                if (e.detail && e.detail.selector) {
                    if (instance.selectElement) {
                        instance.selectElement(e.detail.selector);
                    } else {
                        // Fallback to manual selection
                        if (!instance.isAnalyzeMode) {
                            instance.enableAnalyzeMode();
                        }
                        const element = document.querySelector(e.detail.selector);
                        if (element) {
                            instance.showElementDetails(element);
                        }
                    }
                    console.log('🎯 Element selected via DOM event:', e.detail.selector);
                }
            });
            
            console.log('📡 DOM events listening:');
            console.log('  • open-web-inspector-enable');
            console.log('  • open-web-inspector-disable');
            console.log('  • open-web-inspector-toggle');
            console.log('  • open-web-inspector-select (with detail.selector)');
        }

        checkURLParameters() {
            // Check URL parameters for auto-enable
            const urlParams = new URLSearchParams(window.location.search);
            const openWebInspector = urlParams.get('open-web-inspector');
            const inspect = urlParams.get('inspect');
            const instance = this;
            
            if (openWebInspector === 'true' || openWebInspector === '1' || openWebInspector === 'enable') {
                setTimeout(() => {
                    if (instance.enable) {
                        instance.enable();
                    } else {
                        instance.enableAnalyzeMode();
                    }
                    console.log('🌐 Analyze mode auto-enabled via URL parameter');
                }, 100);
            }
            
            if (inspect) {
                setTimeout(() => {
                    if (instance.selectElement) {
                        instance.selectElement(inspect);
                    } else {
                        // Fallback to manual selection
                        if (!instance.isAnalyzeMode) {
                            instance.enableAnalyzeMode();
                        }
                        const element = document.querySelector(inspect);
                        if (element) {
                            instance.showElementDetails(element);
                        }
                    }
                    console.log('🌐 Element auto-selected via URL parameter:', inspect);
                }, 200);
            }
            
            console.log('🔗 URL parameters supported:');
            console.log('  • ?open-web-inspector=true (auto-enable)');
            console.log('  • ?inspect=.selector (auto-select element)');
        }

        toggleAnalyzeMode() {
            if (this.isAnalyzeMode) {
                this.disableAnalyzeMode();
            } else {
                this.enableAnalyzeMode();
            }
        }

        enableAnalyzeMode() {
            this.isAnalyzeMode = true;
            
            document.addEventListener('mouseover', this.handleMouseOver);
            document.addEventListener('mouseout', this.handleMouseOut);
            document.addEventListener('click', this.handleClick);
            
            // Change cursor for the entire document
            this.originalCursor = document.body.style.cursor;
            document.body.classList.add('open-web-inspector-analyze-cursor');
            
            console.log('🔍 Analyze mode enabled - hover and click elements to inspect!');
        }

        disableAnalyzeMode() {
            this.isAnalyzeMode = false;
            
            document.removeEventListener('mouseover', this.handleMouseOver);
            document.removeEventListener('mouseout', this.handleMouseOut);
            document.removeEventListener('click', this.handleClick);
            
            // Restore original cursor
            document.body.classList.remove('open-web-inspector-analyze-cursor');
            
            // Remove any existing highlight
            this.removeHighlight();
            
            // Close popup if open
            this.closePopup();
            
            console.log('👋 Analyze mode disabled');
        }

        handleMouseOver(event) {
            if (!this.isAnalyzeMode) return;
            
            // Don't highlight our own popup elements
            if (this.isOurElement(event.target)) return;
            
            this.highlightElement(event.target);
        }

        handleMouseOut(event) {
            if (!this.isAnalyzeMode) return;
            
            // Don't remove highlight when moving to child elements
            if (event.target.contains(event.relatedTarget)) return;
            
            this.removeHighlight();
        }

        handleClick(event) {
            if (!this.isAnalyzeMode) return;
            
            // Don't handle clicks on our popup elements
            if (this.isOurElement(event.target)) return;
            
            event.preventDefault();
            event.stopPropagation();
            
            this.showElementDetails(event.target);
        }

        handleKeyPress(event) {
            // ESC key closes popup
            if (event.key === 'Escape') {
                this.closePopup();
            }
        }

        isOurElement(element) {
            return element.closest('.open-web-inspector-popup, .open-web-inspector-overlay, .open-web-inspector-fab-popup, .open-web-inspector-panel, .open-web-inspector-natural-language-panel') ||
                   element.id === 'analyzeToggle' ||
                   element.classList.contains('open-web-inspector-popup') ||
                   element.classList.contains('open-web-inspector-overlay') ||
                   element.classList.contains('open-web-inspector-fab-popup') ||
                   element.classList.contains('open-web-inspector-panel') ||
                   element.classList.contains('open-web-inspector-natural-language-panel');
        }

        highlightElement(element) {
            this.removeHighlight();
            this.currentHighlightedElement = element;
            element.classList.add('open-web-inspector-highlight');
        }

        removeHighlight() {
            if (this.currentHighlightedElement) {
                this.currentHighlightedElement.classList.remove('open-web-inspector-highlight');
                this.currentHighlightedElement = null;
            }
        }

        showElementDetails(element) {
            this.removeHighlight();
            this.createPopup(element);
        }

        createPopup(element) {
            this.closePopup();
            this.currentElement = element;
            
            // Store the actual page element (not inspector UI) for CSS analysis
            if (!element.className.includes('open-web-inspector')) {
                this.actualSelectedElement = element;
                console.log('🎯 Stored actual page element:', element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''));
            }
            
            // Create the new FAB-style popup
            this.createFabPopup(element);
        }

        createFabPopup(element) {
            // Calculate position near the element
            const rect = element.getBoundingClientRect();
            const fabX = Math.min(rect.right + 10, window.innerWidth - 200);
            const fabY = Math.min(rect.top, window.innerHeight - 60);

            // Create FAB popup
            this.fabPopup = document.createElement('div');
            this.fabPopup.className = 'open-web-inspector-fab-popup';
            this.fabPopup.style.left = fabX + 'px';
            this.fabPopup.style.top = fabY + 'px';

            // Create buttons with SVG icons and text labels
            this.fabPopup.innerHTML = `
                <button class="open-web-inspector-fab-button code" data-action="code">
                    <svg viewBox="0 0 24 24">
                        <path d="M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z"/>
                    </svg>
                    <span class="open-web-inspector-fab-label">Code</span>
                    <div class="open-web-inspector-fab-tooltip">Code Inspector</div>
                </button>
                <button class="open-web-inspector-fab-button screenshot" data-action="screenshot">
                    <svg viewBox="0 0 24 24">
                        <path d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z"/>
                    </svg>
                    <span class="open-web-inspector-fab-label">Capture</span>
                    <div class="open-web-inspector-fab-tooltip">Screenshot</div>
                </button>
                <button class="open-web-inspector-fab-button natural-language" data-action="natural-language">
                    <svg viewBox="0 0 24 24">
                        <!-- Chat bubble -->
                        <path d="M20 2H4A2 2 0 0 0 2 4V16A2 2 0 0 0 4 18H18L22 22V4A2 2 0 0 0 20 2M4 4H20V16H17.17L16 17.17L14.83 16H4V4M6 7V9H12V7H6M6 11V13H15V11H6Z"/>
                        <!-- AI sparkles -->
                        <circle cx="17" cy="6" r="0.8" fill="currentColor" opacity="0.6"/>
                        <circle cx="18" cy="8" r="0.6" fill="currentColor" opacity="0.4"/>
                        <circle cx="16" cy="9" r="0.5" fill="currentColor" opacity="0.5"/>
                    </svg>
                    <span class="open-web-inspector-fab-label">Ask</span>
                    <div class="open-web-inspector-fab-tooltip">Ask AI to modify this element</div>
                </button>
            `;

            document.body.appendChild(this.fabPopup);

            // Setup button click handlers
            this.setupFabHandlers(element);
        }

        setupFabHandlers(element) {
            const buttons = this.fabPopup.querySelectorAll('.open-web-inspector-fab-button');
            
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = button.dataset.action;
                    
                    switch(action) {
                        case 'code':
                            this.openCodePanel(element);
                            break;
                        case 'screenshot':
                            this.takeElementScreenshot(element);
                            break;
                        case 'natural-language':
                            this.openNaturalLanguageInterface(element);
                            break;
                    }
                });
            });

            // Clean up any existing outside click handler
            if (this.fabOutsideClickHandler) {
                document.removeEventListener('click', this.fabOutsideClickHandler);
            }

            // Create a new bound handler and store reference for cleanup
            this.fabOutsideClickHandler = this.handleFabOutsideClick.bind(this);

            // Close FAB when clicking outside (but not if panels will be opened)
            setTimeout(() => {
                if (!this.cssPanel && !this.htmlPanel) {
                    document.addEventListener('click', this.fabOutsideClickHandler, { once: true });
                }
            }, 100);
        }

        handleFabOutsideClick(e) {
            // Don't close if clicking on our own elements
            if (this.isOurElement(e.target)) {
                return;
            }
            
            // Don't close if clicking inside any panel or FAB
            if (e.target.closest('.open-web-inspector-fab-popup, .open-web-inspector-panel')) {
                return;
            }
            
            // Close if clicking elsewhere
            this.closePopup();
        }

        openCSSPanel(element) {
            // Close any existing panels
            this.closePanels();
            
            // Calculate smart positioning (corner placement)
            const { x, y } = this.calculatePanelPosition();
            
            // Create CSS panel
            this.cssPanel = document.createElement('div');
            this.cssPanel.className = 'open-web-inspector-panel';
            this.cssPanel.style.left = x + 'px';
            this.cssPanel.style.top = y + 'px';
            
            this.cssPanel.innerHTML = `
                <div class="open-web-inspector-panel-header">
                    <span>🎨 CSS Editor - ${this.getElementTitle(element)}</span>
                    <button class="open-web-inspector-panel-close">×</button>
                </div>
                <div class="open-web-inspector-panel-content">
                    <div style="padding: 20px;">
                        <div style="color: #3498db; font-weight: normal; font-size: 12px; margin-bottom: 15px; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #3498db;">✏️ Edit live! 📁 Expand/collapse 👨‍👩‍👧‍👦 Shows inherited</div>
                        <div class="open-web-inspector-css-rules-container">
                            ${this.generateCSSStyles(element)}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.cssPanel);
            
            // Setup panel functionality
            this.setupPanelHandlers(this.cssPanel, element);
            this.setupCSSEditing();
            this.setupCSSRuleCollapsing();
            this.makePanelDraggable(this.cssPanel);
        }

        openHTMLPanel(element) {
            // Close any existing panels
            this.closePanels();
            
            // Calculate smart positioning
            const { x, y } = this.calculatePanelPosition();
            
            // Create HTML panel
            this.htmlPanel = document.createElement('div');
            this.htmlPanel.className = 'open-web-inspector-panel';
            this.htmlPanel.style.left = x + 'px';
            this.htmlPanel.style.top = y + 'px';
            
            this.htmlPanel.innerHTML = `
                <div class="open-web-inspector-panel-header">
                    <span>📄 HTML & Tree - ${this.getElementTitle(element)}</span>
                    <button class="open-web-inspector-panel-close">×</button>
                </div>
                <div class="open-web-inspector-panel-content">
                    <div style="padding: 20px;">
                        <div class="open-web-inspector-element-path" style="background: #f8f9fa; padding: 8px 12px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre; overflow-x: auto; line-height: 1.6; margin-bottom: 20px;">${this.getElementPath(element)}</div>
                        
                        <div class="open-web-inspector-sub-tabs">
                            <button class="open-web-inspector-sub-tab active" data-tab="preview">Preview</button>
                            <button class="open-web-inspector-sub-tab" data-tab="html">HTML Structure</button>
                        </div>
                        
                        <div class="open-web-inspector-sub-tab-content active" data-tab-content="preview">
                            <div class="open-web-inspector-preview-content" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px; min-height: 100px; border: 1px solid #e2e8f0;">
                                ${this.getElementHTML(element)}
                            </div>
                        </div>
                        
                        <div class="open-web-inspector-sub-tab-content" data-tab-content="html">
                            <div class="open-web-inspector-html-content" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px; font-family: 'Courier New', monospace; font-size: 11px; white-space: pre-wrap; overflow-x: auto; min-height: 100px; border: 1px solid #e2e8f0;"></div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.htmlPanel);
            
            // Setup panel functionality
            this.setupPanelHandlers(this.htmlPanel, element);
            this.setupTreeElementHandlers();
            this.setupSubTabs();
            this.makePanelDraggable(this.htmlPanel);
            
            // Set HTML content properly
            const htmlContainer = this.htmlPanel.querySelector('.open-web-inspector-html-content');
            if (htmlContainer) {
                const htmlContent = this.getElementHTML(element);
                htmlContainer.innerHTML = '';
                htmlContainer.appendChild(document.createTextNode(htmlContent));
            }
        }

        calculatePanelPosition() {
            // Smart corner positioning to avoid blocking content
            const padding = 20;
            const panelWidth = 450;
            const panelHeight = 600;
            
            // Try top-right corner first
            let x = window.innerWidth - panelWidth - padding;
            let y = padding;
            
            // If FAB is in the way, try bottom-right
            if (this.fabPopup) {
                const fabRect = this.fabPopup.getBoundingClientRect();
                if (fabRect.left < x + panelWidth && fabRect.top < y + panelHeight) {
                    y = Math.max(padding, window.innerHeight - panelHeight - padding);
                }
            }
            
            return { x, y };
        }

        setupPanelHandlers(panel, element) {
            const closeBtn = panel.querySelector('.open-web-inspector-panel-close');
            closeBtn.addEventListener('click', () => this.closePanels());
            
            // Clean up any existing panel outside click handler
            if (this.panelOutsideClickHandler) {
                document.removeEventListener('click', this.panelOutsideClickHandler);
            }

            // Create a new bound handler and store reference for cleanup
            this.panelOutsideClickHandler = this.handlePanelOutsideClick.bind(this);
            
            // Set up outside click handler for panels
            setTimeout(() => {
                document.addEventListener('click', this.panelOutsideClickHandler, { once: true });
            }, 100);
        }

        handlePanelOutsideClick(e) {
            // Don't close if clicking on our own elements
            if (this.isOurElement(e.target)) {
                // Re-setup the outside click handler
                setTimeout(() => {
                    if (this.panelOutsideClickHandler) {
                        document.addEventListener('click', this.panelOutsideClickHandler, { once: true });
                    }
                }, 100);
                return;
            }
            
            // Close everything if clicking elsewhere  
            this.closePopup();
        }

        makePanelDraggable(panel) {
            const header = panel.querySelector('.open-web-inspector-panel-header');
            let isDragging = false;
            let startX, startY, startLeft, startTop;
            
            header.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseInt(panel.style.left);
                startTop = parseInt(panel.style.top);
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                e.preventDefault();
            });
            
            const handleMouseMove = (e) => {
                if (!isDragging) return;
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                panel.style.left = (startLeft + deltaX) + 'px';
                panel.style.top = (startTop + deltaY) + 'px';
            };
            
            const handleMouseUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }

        openCodePanel(element) {
            // Close any existing panels
            this.closePanels();
            
            // Calculate smart positioning (larger panel needs more space)
            const { x, y } = this.calculateCodePanelPosition();
            
            // Create unified code panel
            this.codePanel = document.createElement('div');
            this.codePanel.className = 'open-web-inspector-panel';
            this.codePanel.style.left = x + 'px';
            this.codePanel.style.top = y + 'px';
            this.codePanel.style.width = '650px'; // Wider for combined content
            this.codePanel.style.maxHeight = '700px'; // Taller for combined content
            
            this.codePanel.innerHTML = `
                <div class="open-web-inspector-panel-header">
                    <div class="open-web-inspector-code-panel-title">
                        <div class="open-web-inspector-code-panel-main-title">📝 Code Inspector</div>
                        <div class="open-web-inspector-code-panel-subtitle">${this.getElementTitle(element)}</div>
                    </div>
                    <div class="open-web-inspector-panel-header-actions">
                        <button class="open-web-inspector-copy-ai-instructions-btn" type="button">🤖 Copy AI Instructions</button>
                        <button class="open-web-inspector-panel-close">×</button>
                    </div>
                </div>
                <div class="open-web-inspector-panel-content">
                    <div class="open-web-inspector-code-tabs">
                        <button class="open-web-inspector-code-tab active" data-tab="html">📄 HTML & Tree</button>
                        <button class="open-web-inspector-code-tab" data-tab="css">🎨 CSS Styles</button>
                    </div>
                    
                    <!-- HTML Tab Content -->
                    <div class="open-web-inspector-code-tab-content active" data-tab-content="html">
                        <div style="padding: 20px;">
                            <div class="open-web-inspector-element-path" style="background: #f8f9fa; padding: 8px 12px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre; overflow-x: auto; line-height: 1.6; margin-bottom: 20px;">${this.getElementPath(element)}</div>
                            
                            <div class="open-web-inspector-sub-tabs">
                                <button class="open-web-inspector-sub-tab active" data-tab="preview">Preview</button>
                                <button class="open-web-inspector-sub-tab" data-tab="html">HTML Structure</button>
                            </div>
                            
                            <div class="open-web-inspector-sub-tab-content active" data-tab-content="preview">
                                <div class="open-web-inspector-preview-content" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px; min-height: 100px; border: 1px solid #e2e8f0;">
                                    ${this.getElementHTML(element)}
                                </div>
                            </div>
                            
                            <div class="open-web-inspector-sub-tab-content" data-tab-content="html">
                                <div class="open-web-inspector-html-content" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 10px; font-family: 'Courier New', monospace; font-size: 11px; white-space: pre-wrap; overflow-x: auto; min-height: 100px; border: 1px solid #e2e8f0;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CSS Tab Content -->
                    <div class="open-web-inspector-code-tab-content" data-tab-content="css">
                        <div style="padding: 20px;">
                            <div style="color: #3498db; font-weight: normal; font-size: 12px; margin-bottom: 15px; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #3498db;">✏️ Edit live! 📁 Expand/collapse 👨‍👩‍👧‍👦 Shows inherited</div>
                            <div class="open-web-inspector-css-rules-container">
                                ${this.generateCSSStyles(element)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.codePanel);
            
            // Setup panel functionality
            this.setupCodePanelHandlers(this.codePanel, element);
            this.setupTreeElementHandlers();
            this.setupSubTabs();
            this.setupCSSEditing();
            this.setupCSSRuleCollapsing();
            this.setupCodeTabs();
            this.makePanelDraggable(this.codePanel);
            
            // Set HTML content properly
            const htmlContainer = this.codePanel.querySelector('.open-web-inspector-html-content');
            if (htmlContainer) {
                const htmlContent = this.getElementHTML(element);
                htmlContainer.innerHTML = '';
                htmlContainer.appendChild(document.createTextNode(htmlContent));
            }
        }

        calculateCodePanelPosition() {
            // Smart positioning for larger panel
            const padding = 20;
            const panelWidth = 650;
            const panelHeight = 700;
            
            // Try top-right corner first
            let x = window.innerWidth - panelWidth - padding;
            let y = padding;
            
            // If FAB is in the way, try bottom-right
            if (this.fabPopup) {
                const fabRect = this.fabPopup.getBoundingClientRect();
                if (fabRect.left < x + panelWidth && fabRect.top < y + panelHeight) {
                    y = Math.max(padding, window.innerHeight - panelHeight - padding);
                }
            }
            
            return { x, y };
        }

        setupCodePanelHandlers(panel, element) {
            const closeBtn = panel.querySelector('.open-web-inspector-panel-close');
            closeBtn.addEventListener('click', () => this.closePanels());
            
            // Set up Copy AI Instructions button
            const aiInstructionsBtn = panel.querySelector('.open-web-inspector-copy-ai-instructions-btn');
            if (aiInstructionsBtn) {
                aiInstructionsBtn.addEventListener('click', () => this.generateAISnapshot(element));
            }
            
            // Clean up any existing panel outside click handler
            if (this.panelOutsideClickHandler) {
                document.removeEventListener('click', this.panelOutsideClickHandler);
            }

            // Create a new bound handler and store reference for cleanup
            this.panelOutsideClickHandler = this.handlePanelOutsideClick.bind(this);
            
            // Set up outside click handler for panels
            setTimeout(() => {
                document.addEventListener('click', this.panelOutsideClickHandler, { once: true });
            }, 100);
        }

        setupCodeTabs() {
            if (!this.codePanel) return;
            
            const tabs = this.codePanel.querySelectorAll('.open-web-inspector-code-tab');
            const tabContents = this.codePanel.querySelectorAll('.open-web-inspector-code-tab-content');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetTab = tab.dataset.tab;
                    
                    // Remove active class from all tabs and contents
                    tabs.forEach(t => t.classList.remove('active'));
                    tabContents.forEach(tc => tc.classList.remove('active'));
                    
                    // Add active class to clicked tab and corresponding content
                    tab.classList.add('active');
                    const targetContent = this.codePanel.querySelector(`[data-tab-content="${targetTab}"]`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                });
            });
        }

        closePanels() {
            if (this.cssPanel) {
                this.cssPanel.remove();
                this.cssPanel = null;
            }
            if (this.htmlPanel) {
                this.htmlPanel.remove();
                this.htmlPanel = null;
            }
            if (this.codePanel) {
                this.codePanel.remove();
                this.codePanel = null;
            }
            if (this.naturalLanguagePanel) {
                this.naturalLanguagePanel.remove();
                this.naturalLanguagePanel = null;
            }
            
            // Clean up panel outside click handler
            if (this.panelOutsideClickHandler) {
                document.removeEventListener('click', this.panelOutsideClickHandler);
                this.panelOutsideClickHandler = null;
            }
        }

        generatePopupContent(element) {
            const elementPath = this.getElementPath(element);
            const computedStyles = window.getComputedStyle(element);
            const htmlContent = this.getElementHTML(element);

            return `
                <div class="open-web-inspector-popup-header">
                    <h3 class="open-web-inspector-popup-title">${this.getElementTitle(element)}</h3>
                    <div class="open-web-inspector-popup-header-actions">
                        <button class="open-web-inspector-screenshot-btn" type="button">📸 Screenshot</button>
                        <button class="open-web-inspector-popup-close" type="button">&times;</button>
                    </div>
                </div>
                <div class="open-web-inspector-popup-content">
                    <div class="open-web-inspector-tabs">
                        <button class="open-web-inspector-tab active" data-tab="html">HTML</button>
                        <button class="open-web-inspector-tab" data-tab="css">CSS Styles</button>
                        <button class="open-web-inspector-tab" data-tab="computed">Computed Styles</button>
                    </div>
                    
                    <div class="open-web-inspector-tab-content active" data-tab-content="html">
                        <div class="open-web-inspector-element-tree-section">
                            <div class="open-web-inspector-element-path">${elementPath}</div>
                        </div>
                        
                        <div class="open-web-inspector-content-section">
                            <div class="open-web-inspector-sub-tabs">
                                <button class="open-web-inspector-sub-tab active" data-sub-tab="preview">👁️ Preview</button>
                                <button class="open-web-inspector-sub-tab" data-sub-tab="html-structure">📝 HTML Structure</button>
                            </div>
                            
                            <div class="open-web-inspector-sub-tab-content active" data-sub-tab-content="preview">
                                <div class="open-web-inspector-preview-content">${this.generateElementPreview(element)}</div>
                            </div>
                            
                            <div class="open-web-inspector-sub-tab-content" data-sub-tab-content="html-structure">
                                <div class="open-web-inspector-html-content"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="open-web-inspector-tab-content" data-tab-content="css">
                        <div style="color: #3498db; font-weight: normal; font-size: 12px; margin-bottom: 15px; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #3498db;">✏️ Edit live! 📁 Expand/collapse 👨‍👩‍👧‍👦 Shows inherited</div>
                        <div class="open-web-inspector-css-rules-container">
                            ${this.generateCSSStyles(element)}
                        </div>
                    </div>
                    
                    <div class="open-web-inspector-tab-content" data-tab-content="computed">
                        <h4>Computed Styles:</h4>
                        <div class="open-web-inspector-css-grid">
                            ${this.generateComputedStyles(computedStyles)}
                        </div>
                    </div>
                </div>
            `;
        }

        getElementTitle(element) {
            const elementTag = element.tagName.toLowerCase();
            const elementInfo = element.id ? `#${element.id}` : 
                              (element.className ? `.${element.className.split(' ')[0]}` : '');
            return `Element Inspector - ${elementTag}${elementInfo}`;
        }

        openNaturalLanguageInterface(element) {
            // Close any existing panels first
            this.closePanels();
            
            // Calculate position for the natural language interface
            const rect = element.getBoundingClientRect();
            let interfaceX = Math.min(rect.right + 10, window.innerWidth - 350);
            let interfaceY = Math.min(rect.top, window.innerHeight - 200);
            
            // Adjust position to avoid overlapping with FAB popup if it exists
            if (this.fabPopup) {
                const fabRect = this.fabPopup.getBoundingClientRect();
                // If our panel would overlap with FAB, position it below the FAB
                if (interfaceX < fabRect.right + 10 && interfaceY < fabRect.bottom + 10) {
                    interfaceY = Math.max(fabRect.bottom + 10, interfaceY);
                    // Make sure it still fits on screen
                    if (interfaceY + 200 > window.innerHeight) {
                        interfaceY = window.innerHeight - 210;
                    }
                }
            }
            
            // Create natural language interface panel
            this.naturalLanguagePanel = document.createElement('div');
            this.naturalLanguagePanel.className = 'open-web-inspector-panel open-web-inspector-natural-language-panel';
            this.naturalLanguagePanel.style.left = interfaceX + 'px';
            this.naturalLanguagePanel.style.top = interfaceY + 'px';
            this.naturalLanguagePanel.style.width = '320px';
            this.naturalLanguagePanel.style.maxHeight = '200px';
            
            this.naturalLanguagePanel.innerHTML = `
                <div class="open-web-inspector-panel-header">
                    <div class="open-web-inspector-ask-ai-title">
                        <div class="open-web-inspector-ask-ai-main-title">💬 Ask AI</div>
                        <div class="open-web-inspector-ask-ai-subtitle">${this.getElementTitle(element)}</div>
                    </div>
                    <button class="open-web-inspector-panel-close">×</button>
                </div>
                <div class="open-web-inspector-panel-content">
                    <div style="padding: 20px;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333; font-size: 14px;">
                                What would you like to do with this element?
                            </label>
                            <input type="text" 
                                   class="open-web-inspector-natural-language-input" 
                                   placeholder="e.g., Make this text red, increase the spacing, add a border..."
                                   style="width: 100%; padding: 10px; border: 2px solid #e1e8ed; border-radius: 6px; font-size: 14px; font-family: inherit;"
                                   maxlength="200">
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 10px;">
                            <button class="open-web-inspector-natural-language-cancel" 
                                    style="padding: 8px 16px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 13px;">
                                Cancel
                            </button>
                            <button class="open-web-inspector-natural-language-copy" 
                                    style="padding: 8px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">
                                📋 Copy AI Instructions
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.naturalLanguagePanel);
            
            // Set up event handlers
            this.setupNaturalLanguageHandlers(element);
            
            // Make panel draggable
            this.makePanelDraggable(this.naturalLanguagePanel);
            
            // Focus the input field
            const input = this.naturalLanguagePanel.querySelector('.open-web-inspector-natural-language-input');
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
        }

        setupNaturalLanguageHandlers(element) {
            if (!this.naturalLanguagePanel) return;
            
            const closeBtn = this.naturalLanguagePanel.querySelector('.open-web-inspector-panel-close');
            const cancelBtn = this.naturalLanguagePanel.querySelector('.open-web-inspector-natural-language-cancel');
            const copyBtn = this.naturalLanguagePanel.querySelector('.open-web-inspector-natural-language-copy');
            const input = this.naturalLanguagePanel.querySelector('.open-web-inspector-natural-language-input');
            
            // Close handlers
            const closeHandler = () => this.closePanels();
            closeBtn.addEventListener('click', closeHandler);
            cancelBtn.addEventListener('click', closeHandler);
            
            // Copy button handler
            copyBtn.addEventListener('click', () => this.generateAISnapshotWithRequest(element));
            
            // Enter key handler
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.generateAISnapshotWithRequest(element);
                }
            });
            
            // Input validation and button state
            const updateButtonState = () => {
                const hasText = input.value.trim().length > 0;
                copyBtn.disabled = !hasText;
                copyBtn.style.opacity = hasText ? '1' : '0.6';
                copyBtn.style.cursor = hasText ? 'pointer' : 'not-allowed';
            };
            
            input.addEventListener('input', updateButtonState);
            updateButtonState(); // Initial state
            
            // Outside click handler
            this.naturalLanguageOutsideClickHandler = (e) => {
                if (!this.isOurElement(e.target)) {
                    this.closePanels();
                }
            };
            
            setTimeout(() => {
                document.addEventListener('click', this.naturalLanguageOutsideClickHandler, { once: true });
            }, 100);
        }

        async generateAISnapshotWithRequest(element) {
            const input = this.naturalLanguagePanel?.querySelector('.open-web-inspector-natural-language-input');
            const userRequest = input?.value.trim() || '';
            
            if (!userRequest) {
                // Flash the input to indicate it's required
                if (input) {
                    input.style.borderColor = '#e74c3c';
                    setTimeout(() => {
                        input.style.borderColor = '#e1e8ed';
                    }, 1000);
                }
                return;
            }
            
            // Show loading state
            const copyBtn = this.naturalLanguagePanel?.querySelector('.open-web-inspector-natural-language-copy');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '⏳ Generating...';
                copyBtn.disabled = true;
                
                try {
                    // Generate the enhanced AI snapshot with user request
                    await this.generateAISnapshot(element, userRequest);
                    
                    // Close the natural language panel after successful copy
                    this.closePanels();
                } catch (error) {
                    console.error('Failed to generate AI snapshot with request:', error);
                    copyBtn.innerHTML = '❌ Try Again';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.disabled = false;
                    }, 2000);
                }
            }
        }

        async generateAISnapshot(element, userRequest = '') {
            try {
                // Get element information
                const elementTag = element.tagName.toLowerCase();
                const elementInfo = element.id ? `#${element.id}` : 
                                  (element.className ? `.${element.className.split(' ')[0]}` : '');
                const elementIdentifier = `${elementTag}${elementInfo}`;

                // Get element path (text version without HTML)
                const elementPath = this.getElementPathText(element);
                
                // Get HTML structure
                const htmlContent = this.getElementHTML(element);
                
                // Get CSS styles with changes
                const cssStyles = this.getCSSStylesWithChangesText(element);
                
                // Get computed styles (key ones)
                const computedStyles = this.getKeyComputedStylesText(element);

                // Check if element has CSS changes
                const hasChanges = this.cssChanges.has(element) && Object.keys(this.cssChanges.get(element)).length > 0;
                const changesNote = hasChanges ? 
                    '\n\n⚠️  **IMPORTANT**: This element has been modified using the live CSS editor. The CSS section shows both original and modified values.' : '';

                // Add user request section if provided
                const userRequestSection = userRequest ? `

## 🎯 USER REQUEST
The user wants you to: **${userRequest}**

Please provide specific CSS code and instructions to achieve this request for the element analyzed below.` : '';

                // Create AI-friendly snapshot
                const snapshot = `🤖 AI Element Snapshot - ${elementIdentifier}${changesNote}${userRequestSection}

## ELEMENT CONTEXT
This is an HTML element analysis from a web page inspection tool${hasChanges ? ' with live CSS editing capabilities' : ''}. Use this information to understand the element's structure, styling, and position in the DOM hierarchy.

## ELEMENT PATH
The element's location in the DOM tree:
${elementPath}

## HTML STRUCTURE
\`\`\`html
${htmlContent}
\`\`\`

## ${hasChanges ? 'CSS STYLES (WITH MODIFICATIONS)' : 'EXPLICIT CSS RULES'}
\`\`\`css
${cssStyles}
\`\`\`

## COMPUTED STYLES (FINAL VALUES)
\`\`\`css
${computedStyles}
\`\`\`

## GUIDANCE FOR AI
- Element Type: ${elementTag}
- Identifier: ${elementIdentifier}
- Use this information to understand layout, styling, or help debug CSS/HTML issues
- The element path shows the hierarchical structure from the selected element up to the document root
- **COMPUTED STYLES contain the final values** the browser actually uses (often more useful than raw CSS)
- Cross-origin stylesheets are blocked by browsers but computed styles show the final result${hasChanges ? '\n- **CSS CHANGES**: Modified values are marked with comments showing original vs current values' : ''}

## CSS MODIFICATION GUIDANCE
To modify this element's styles, use these selectors (in order of effectiveness):
${this.generateCSSModificationGuidance(element)}`;

                // Copy to clipboard
                await navigator.clipboard.writeText(snapshot);
                
                // Visual feedback - check FAB system first, then old popup
                const button = (this.fabPopup && this.fabPopup.querySelector('.open-web-inspector-fab-button[data-action="ai"]')) ||
                              (this.popup && this.popup.querySelector('.open-web-inspector-ai-snapshot-btn'));
                
                if (button) {
                    const originalText = button.textContent;
                    button.innerHTML = `<svg viewBox="0 0 24 24">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                    </svg>`;
                    button.classList.add('copied');
                    
                    setTimeout(() => {
                        button.innerHTML = `<svg viewBox="0 0 24 24">
                            <path d="M16,12A2,2 0 0,1 18,10A2,2 0 0,1 20,12A2,2 0 0,1 18,14A2,2 0 0,1 16,12M6,12A2,2 0 0,1 8,10A2,2 0 0,1 10,12A2,2 0 0,1 8,14A2,2 0 0,1 6,12M12,4A2,2 0 0,1 14,2A2,2 0 0,1 16,4A2,2 0 0,1 14,6A2,2 0 0,1 12,4M12,20A2,2 0 0,1 14,18A2,2 0 0,1 16,20A2,2 0 0,1 14,22A2,2 0 0,1 12,20M12,9A2,2 0 0,1 14,7A2,2 0 0,1 16,9A2,2 0 0,1 14,11A2,2 0 0,1 12,9M12,15A2,2 0 0,1 14,13A2,2 0 0,1 16,15A2,2 0 0,1 14,17A2,2 0 0,1 12,15Z"/>
                        </svg>`;
                        button.classList.remove('copied');
                    }, 2000);
                }

            } catch (error) {
                console.error('Failed to generate AI snapshot:', error);
                
                // Fallback visual feedback
                const button = (this.fabPopup && this.fabPopup.querySelector('.open-web-inspector-fab-button[data-action="ai"]')) ||
                              (this.popup && this.popup.querySelector('.open-web-inspector-ai-snapshot-btn'));
                
                if (button) {
                    const originalHTML = button.innerHTML;
                    button.innerHTML = `<svg viewBox="0 0 24 24">
                        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    </svg>`;
                    
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                    }, 2000);
                }
            }
        }

        async takeElementScreenshot(element) {
            // Find button in FAB or old popup system
            const button = (this.fabPopup && this.fabPopup.querySelector('.open-web-inspector-fab-button[data-action="screenshot"]')) ||
                          (this.popup && this.popup.querySelector('.open-web-inspector-screenshot-btn'));
            
            if (!button) {
                console.error('Screenshot button not found');
                return;
            }
            
            const originalHTML = button.innerHTML;
            let wasHighlighted = false;
            
            try {
                // Show capturing state
                button.innerHTML = `<svg viewBox="0 0 24 24">
                    <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21A7,7 0 0,1 14,26H10A7,7 0 0,1 3,19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M10,9A5,5 0 0,0 5,14V17H19V14A5,5 0 0,0 14,9H10Z"/>
                </svg>`;
                button.classList.add('capturing');
                
                // Dynamically load html2canvas if not already loaded
                if (!window.html2canvas) {
                    await this.loadHtml2Canvas();
                }
                
                // Ensure element is visible and has dimensions
                if (element.offsetWidth === 0 || element.offsetHeight === 0) {
                    throw new Error('Element has no visible dimensions');
                }
                
                // Temporarily remove our highlighting and UI elements to avoid capturing them
                wasHighlighted = element.classList.contains('open-web-inspector-highlight');
                element.classList.remove('open-web-inspector-highlight');
                
                // Hide FAB popup and old popup system
                if (this.fabPopup) this.fabPopup.style.display = 'none';
                if (this.popup) this.popup.style.display = 'none';
                if (this.cssPanel) this.cssPanel.style.display = 'none';
                if (this.htmlPanel) this.htmlPanel.style.display = 'none';
                
                // Also temporarily hide our overlay if it exists
                const overlay = document.querySelector('.open-web-inspector-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
                
                // Small delay to ensure UI updates
                await new Promise(resolve => setTimeout(resolve, 150));
                
                // Configure html2canvas options for direct element capture
                const options = {
                    allowTaint: true,
                    useCORS: true,
                    scale: 2, // High quality
                    backgroundColor: '#ffffff', // White background for contrast
                    logging: false,
                    scrollX: 0,
                    scrollY: 0,
                    ignoreElements: (el) => {
                        // Ignore our UI elements
                        return el.classList && (
                            el.classList.contains('open-web-inspector-popup') ||
                            el.classList.contains('open-web-inspector-overlay') ||
                            el.classList.contains('open-web-inspector-highlight-box') ||
                            el.classList.contains('open-web-inspector-fab-popup') ||
                            el.classList.contains('open-web-inspector-panel')
                        );
                    }
                };
                
                // Take screenshot of just the element directly
                console.log('Taking screenshot of element:', element, 'with dimensions:', element.offsetWidth, 'x', element.offsetHeight);
                const canvas = await window.html2canvas(element, options);
                console.log('Canvas created with dimensions:', canvas.width, 'x', canvas.height);
                
                // Convert canvas to blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                
                // Copy to clipboard
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': blob
                    })
                ]);
                
                // Success feedback
                button.innerHTML = `<svg viewBox="0 0 24 24">
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>`;
                button.classList.remove('capturing');
                button.classList.add('copied');
                
            } catch (error) {
                console.error('Screenshot failed:', error);
                
                // Error feedback
                button.innerHTML = `<svg viewBox="0 0 24 24">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>`;
                button.classList.remove('capturing');
                
                // Show user-friendly error
                if (error.name === 'NotAllowedError') {
                    console.warn('Clipboard permission denied. Screenshot was taken but not copied.');
                } else if (error.message && error.message.includes('html2canvas')) {
                    console.warn('Failed to load html2canvas library.');
                }
                
            } finally {
                // Restore UI state
                if (wasHighlighted && this.currentHighlightedElement === element) {
                    element.classList.add('open-web-inspector-highlight');
                }
                
                // Restore UI elements
                if (this.fabPopup) this.fabPopup.style.display = 'flex';
                if (this.popup) this.popup.style.display = 'block';
                if (this.cssPanel) this.cssPanel.style.display = 'block';
                if (this.htmlPanel) this.htmlPanel.style.display = 'block';
                
                // Restore overlay if it was hidden
                const overlay = document.querySelector('.open-web-inspector-overlay');
                if (overlay) {
                    overlay.style.display = 'block';
                }
                
                // Reset button after delay
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.classList.remove('capturing', 'copied');
                }, 2000);
            }
        }

        async loadHtml2Canvas() {
            return new Promise((resolve, reject) => {
                // Check if already loaded
                if (window.html2canvas) {
                    resolve();
                    return;
                }
                
                // Create script tag
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load html2canvas library'));
                
                // Add to head
                document.head.appendChild(script);
            });
        }

        setupCSSEditing() {
            try {
                // Setup CSS input event listeners
                // Check code panel, old popup system, and panel system
                const container = this.codePanel || this.cssPanel || this.popup;
                
                if (!container) {
                    console.error('No container found for CSS editing setup!');
                    return;
                }
                
                if (typeof container.querySelectorAll !== 'function') {
                    console.error('Container is not a valid DOM element:', container);
                    return;
                }
                
                const cssInputs = container.querySelectorAll('.open-web-inspector-css-value-input');
            cssInputs.forEach(input => {
                const property = input.dataset.property;
                const originalValue = input.dataset.originalValue;
                
                // Handle input changes (real-time updates)
                input.addEventListener('input', () => {
                    const newValue = input.value.trim();
                    if (newValue !== originalValue) {
                        this.recordCSSChange(this.currentElement, property, originalValue, newValue);
                        input.classList.add('changed');
                        this.updateResetButton(property, true);
                    } else {
                        this.resetCSSProperty(this.currentElement, property);
                        input.classList.remove('changed');
                        this.updateResetButton(property, false);
                    }
                });

                // Handle Enter key for applying changes
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        input.blur(); // Remove focus to apply change
                        e.preventDefault();
                    }
                });

                // Handle Escape key for cancelling changes
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        input.value = this.getCurrentPropertyValue(this.currentElement, property) || originalValue;
                        input.blur();
                        e.preventDefault();
                    }
                });
            });

            // Setup reset button event listeners
            const resetButtons = container.querySelectorAll('.open-web-inspector-css-reset-btn');
            resetButtons.forEach(button => {
                const property = button.dataset.property;
                button.addEventListener('click', () => {
                    this.resetCSSProperty(this.currentElement, property);
                    this.refreshCSSDisplay();
                });
            });
            } catch (error) {
                console.error('Error in setupCSSEditing:', error);
                console.error('Stack trace:', error.stack);
            }
        }

        updateResetButton(property, show) {
            // Check code panel, old popup system, and panel system
            const container = this.codePanel || this.cssPanel || this.popup;
            if (!container) return;
            
            const propertyContainer = container.querySelector(`[data-property="${property}"]`);
            if (!propertyContainer) return;

            let resetButton = propertyContainer.querySelector('.open-web-inspector-css-reset-btn');
            
            if (show && !resetButton) {
                // Create reset button
                resetButton = document.createElement('button');
                resetButton.className = 'open-web-inspector-css-reset-btn';
                resetButton.dataset.property = property;
                resetButton.textContent = '↺';
                resetButton.title = 'Reset to original';
                resetButton.addEventListener('click', () => {
                    this.resetCSSProperty(this.currentElement, property);
                    this.refreshCSSDisplay();
                });
                propertyContainer.appendChild(resetButton);
            } else if (!show && resetButton) {
                // Remove reset button
                resetButton.remove();
            }
        }

        refreshCSSDisplay() {
            if (!this.currentElement) return;
            
            // Update CSS styles display
            // Check code panel, old popup system, and panel system
            const container = this.codePanel || this.cssPanel || this.popup;
            if (!container) return;
            
            // In panel system, the container is directly in the panel content
            // In old popup system, it's nested under tab content
            const cssContainer = container.querySelector('.open-web-inspector-css-rules-container') || 
                               container.querySelector('.open-web-inspector-tab-content[data-tab-content="css"] .open-web-inspector-css-rules-container');
            
            if (cssContainer) {
                cssContainer.innerHTML = this.generateCSSStyles(this.currentElement);
                this.setupCSSEditing(); // Re-setup event listeners
                this.setupCSSRuleCollapsing(); // Re-setup collapsing functionality
            }
        }

        setupCSSRuleCollapsing() {
            // Setup click handlers for collapsible CSS rule groups
            // Check code panel, old popup system, and panel system
            const container = this.codePanel || this.cssPanel || this.popup;
            if (!container) return;
            
            const ruleHeaders = container.querySelectorAll('.open-web-inspector-css-rule-header');
            ruleHeaders.forEach(header => {
                // Remove existing listeners (if any)
                header.replaceWith(header.cloneNode(true));
                const newHeader = container.querySelector(`[data-rule-id="${header.dataset.ruleId}"]`);
                
                if (newHeader) {
                    newHeader.addEventListener('click', () => {
                        this.toggleCSSRuleGroup(newHeader.dataset.ruleId);
                    });
                }
            });
        }

        toggleCSSRuleGroup(ruleId) {
            // Check code panel, old popup system, and panel system
            const container = this.codePanel || this.cssPanel || this.popup;
            if (!container) return;
            
            const header = container.querySelector(`[data-rule-id="${ruleId}"]`);
            const content = container.querySelector(`[data-rule-content="${ruleId}"]`);
            const toggle = header?.querySelector('.open-web-inspector-css-rule-toggle');
            
            if (!header || !content || !toggle) return;
            
            const isCollapsed = content.classList.contains('collapsed');
            
            if (isCollapsed) {
                // Expand
                content.classList.remove('collapsed');
                header.classList.remove('collapsed');
                toggle.classList.remove('collapsed');
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                // Collapse
                content.style.maxHeight = '0px';
                content.classList.add('collapsed');
                header.classList.add('collapsed');
                toggle.classList.add('collapsed');
            }
        }

        getElementPathText(element) {
            const path = [];
            let current = element;
            
            // Build path up to body
            while (current && current !== document.documentElement) {
                const tagName = current.tagName.toLowerCase();
                const id = current.id ? `#${current.id}` : '';
                const className = current.className ? `.${current.className.split(' ')[0]}` : '';
                const selector = `${tagName}${id}${className}`;
                path.push(selector);
                current = current.parentElement;
            }
            
            // Create indented text representation
            return path.map((selector, index) => {
                const indent = '  '.repeat(index);
                const icon = index === 0 ? '🎯' : '📄';
                return `${indent}${icon} ${selector}`;
            }).join('\n');
        }

        getCSSStylesText(element) {
            const styles = [];
            
            // Get inline styles
            if (element.style.length > 0) {
                styles.push('/* Inline Styles */');
                for (let i = 0; i < element.style.length; i++) {
                    const property = element.style[i];
                    const value = element.style.getPropertyValue(property);
                    styles.push(`${property}: ${value};`);
                }
                styles.push('');
            }
            
            // Get stylesheet rules that apply to this element
            try {
                const matchedRules = [];
                const sheets = document.styleSheets;
                
                for (let i = 0; i < sheets.length; i++) {
                    try {
                        const rules = sheets[i].cssRules || sheets[i].rules;
                        for (let j = 0; j < rules.length; j++) {
                            const rule = rules[j];
                            if (rule.selectorText && element.matches && element.matches(rule.selectorText)) {
                                matchedRules.push({
                                    selector: rule.selectorText,
                                    cssText: rule.style.cssText
                                });
                            }
                        }
                    } catch (e) {
                        // Skip inaccessible stylesheets (CORS)
                    }
                }
                
                if (matchedRules.length > 0) {
                    styles.push('/* Matched CSS Rules */');
                    matchedRules.forEach(rule => {
                        styles.push(`${rule.selector} {`);
                        if (rule.cssText) {
                            const properties = rule.cssText.split(';').filter(p => p.trim());
                            properties.forEach(prop => {
                                if (prop.trim()) {
                                    styles.push(`  ${prop.trim()};`);
                                }
                            });
                        }
                        styles.push('}');
                        styles.push('');
                    });
                }
            } catch (error) {
                styles.push('/* Unable to access some stylesheet rules due to CORS restrictions */');
            }
            
            return styles.join('\n') || '/* Cross-origin stylesheets blocked - see computed styles below for actual values */';
        }

        getCSSStylesWithChangesText(element) {
            const styles = [];
            
            // Check if we have any changes for this element
            const hasChanges = this.cssChanges.has(element) && Object.keys(this.cssChanges.get(element)).length > 0;
            
            if (hasChanges) {
                const changes = this.cssChanges.get(element);
                
                styles.push('/* ===== CSS CHANGES DETECTED ===== */');
                styles.push('/* This element has been modified in the inspector. */');
                styles.push('/* Below are the original vs modified values: */');
                styles.push('');
                
                Object.entries(changes).forEach(([property, change]) => {
                    styles.push(`/* PROPERTY: ${property} */`);
                    styles.push(`/* ORIGINAL: ${change.original} */`);
                    styles.push(`/* MODIFIED: ${change.current} */`);
                    styles.push(`${property}: ${change.current}; /* ← USER CHANGED THIS */`);
                    styles.push('');
                });
                
                styles.push('/* ===== END OF CHANGES ===== */');
                styles.push('');
            }
            
            // Get regular CSS styles using the existing method
            const regularStyles = this.getCSSStylesText(element);
            
            if (hasChanges) {
                styles.push('/* ===== ORIGINAL CSS STYLES (for reference) ===== */');
                styles.push(regularStyles);
            } else {
                return regularStyles;
            }
            
            return styles.join('\n');
        }

        getKeyComputedStylesText(element) {
            const computedStyle = window.getComputedStyle(element);
            
            // Key properties that are most relevant for AI analysis
            const keyProperties = [
                'display', 'position', 'width', 'height', 'margin', 'padding', 
                'border', 'background', 'color', 'font-family', 'font-size', 
                'line-height', 'text-align', 'flex-direction', 'justify-content', 
                'align-items', 'grid-template-columns', 'grid-template-rows',
                'transform', 'opacity', 'z-index', 'overflow'
            ];
            
            const styles = ['/* Key Computed Styles */'];
            
            keyProperties.forEach(property => {
                const value = computedStyle.getPropertyValue(property);
                if (value && value !== 'none' && value !== 'auto' && value !== 'normal' && value !== 'initial') {
                    styles.push(`${property}: ${value};`);
                }
            });
            
            return styles.join('\n');
        }

        setupTabs() {
            const tabs = this.popup.querySelectorAll('.open-web-inspector-tab');
            const tabContents = this.popup.querySelectorAll('.open-web-inspector-tab-content');

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetTab = tab.dataset.tab;
                    
                    // Remove active class from all tabs and contents
                    tabs.forEach(t => t.classList.remove('active'));
                    tabContents.forEach(tc => tc.classList.remove('active'));
                    
                    // Add active class to clicked tab and corresponding content
                    tab.classList.add('active');
                    const targetContent = this.popup.querySelector(`[data-tab-content="${targetTab}"]`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                });
            });
        }

        setupSubTabs() {
            // Check code panel, old popup system, and panel system  
            const container = this.codePanel || this.htmlPanel || this.popup;
            if (!container) {
                console.warn('No container found for sub tabs setup');
                return;
            }
            
            const subTabs = container.querySelectorAll('.open-web-inspector-sub-tab');
            const subTabContents = container.querySelectorAll('.open-web-inspector-sub-tab-content');

            subTabs.forEach(subTab => {
                subTab.addEventListener('click', () => {
                    const targetSubTab = subTab.dataset.tab;
                    
                    // Remove active class from all sub-tabs and contents
                    subTabs.forEach(st => st.classList.remove('active'));
                    subTabContents.forEach(stc => stc.classList.remove('active'));
                    
                    // Add active class to clicked sub-tab and corresponding content
                    subTab.classList.add('active');
                    const targetSubContent = container.querySelector(`[data-tab-content="${targetSubTab}"]`);
                    if (targetSubContent) {
                        targetSubContent.classList.add('active');
                        
                        // Debug: Ensure HTML content is always text when switching to HTML tab
                        if (targetSubTab === 'html') {
                            const htmlContainer = targetSubContent.querySelector('.open-web-inspector-html-content');
                            if (htmlContainer && htmlContainer.children.length > 0) {
                                // If there are child elements, it means HTML was rendered - fix it
                                const textContent = htmlContainer.textContent || htmlContainer.innerText;
                                htmlContainer.innerHTML = '';
                                htmlContainer.appendChild(document.createTextNode(textContent));
                            }
                        }
                    }
                });
            });
        }

        setupTreeElementHandlers() {
            // Check code panel, old html panel, or popup system
            const container = this.codePanel || this.htmlPanel || this.popup;
            if (!container) {
                console.warn('No container found for tree element handlers');
                return;
            }
            
            const treeElements = container.querySelectorAll('.tree-element');
            treeElements.forEach(treeElement => {
                treeElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const elementIndex = parseInt(treeElement.dataset.elementIndex);
                    this.switchToElement(elementIndex);
                });
            });
        }

        switchToElement(elementIndex) {
            if (!this.treeElements || elementIndex < 0 || elementIndex >= this.treeElements.length) {
                return;
            }

            const selectedElement = this.treeElements[elementIndex];
            this.currentSelectedIndex = elementIndex;
            
            // Remove highlighting from any previously highlighted element
            this.removeHighlight();
            
            // Highlight the newly selected element
            this.highlightElement(selectedElement);
            
            // Update current element reference
            this.currentElement = selectedElement;
            
            // Update popup content with new element
            this.updatePopupContent(selectedElement);
            
            // ✨ KEY FEATURE: If unified code panel is open, update CSS tab automatically
            if (this.codePanel) {
                this.updateCodePanelCSS(selectedElement);
            }
        }

        updateCodePanelCSS(element) {
            if (!this.codePanel) return;
            
            // Update the panel title to show current element
            const subtitleSpan = this.codePanel.querySelector('.open-web-inspector-code-panel-subtitle');
            if (subtitleSpan) {
                subtitleSpan.textContent = this.getElementTitle(element);
            }
            
            // Update CSS tab content
            const cssContainer = this.codePanel.querySelector('.open-web-inspector-css-rules-container');
            if (cssContainer) {
                cssContainer.innerHTML = this.generateCSSStyles(element);
                
                // Re-setup CSS functionality for the new element
                this.setupCSSEditing();
                this.setupCSSRuleCollapsing();
            }
        }

        updatePopupContent(element) {
            const elementPath = this.getElementPath(element);
            const computedStyles = window.getComputedStyle(element);
            const htmlContent = this.getElementHTML(element);

            // Check code panel, old panels, or popup system
            const container = this.codePanel || this.htmlPanel || this.cssPanel || this.popup;
            if (!container) {
                console.warn('No container found for updating popup content');
                return;
            }

            // Update the tree
            const treeContainer = container.querySelector('.open-web-inspector-element-path');
            if (treeContainer) {
                treeContainer.innerHTML = elementPath;
                this.setupTreeElementHandlers(); // Re-setup handlers for new tree
            }

            // Re-setup sub-tab handlers after content update
            this.setupSubTabs();

            // Update preview content (using innerHTML for rendered preview)
            const previewContainer = container.querySelector('.open-web-inspector-preview-content');
            if (previewContainer) {
                previewContainer.innerHTML = this.generateElementPreview(element);
            }

            // Update HTML content (using textContent for plain text code)
            const htmlContainer = container.querySelector('.open-web-inspector-html-content');
            if (htmlContainer) {
                // Clear any existing content first
                htmlContainer.innerHTML = '';
                // Add the HTML content as plain text only
                htmlContainer.appendChild(document.createTextNode(htmlContent));
            }

            // Update current element reference
            this.currentElement = element;

            // 🔧 FIX: Handle CSS update for both old and new systems
            let cssContainer = null;
            
            // NEW CODE PANEL SYSTEM
            if (this.codePanel) {
                cssContainer = this.codePanel.querySelector('.open-web-inspector-css-rules-container');
            }
            
            // OLD POPUP SYSTEM (fallback)
            if (!cssContainer && this.popup) {
                cssContainer = this.popup.querySelector('.open-web-inspector-tab-content[data-tab-content="css"] .open-web-inspector-css-rules-container');
            }
            
            if (cssContainer) {
                cssContainer.innerHTML = this.generateCSSStyles(element);
                
                // Re-setup CSS editing after content update
                this.setupCSSEditing();
                
                // Re-setup CSS rule collapsing after content update
                this.setupCSSRuleCollapsing();
            }

            // 🔧 FIX: Handle computed styles for both old and new systems
            if (this.popup) {
                const computedContainer = this.popup.querySelector('.open-web-inspector-tab-content[data-tab-content="computed"] .open-web-inspector-css-grid');
                if (computedContainer) {
                    computedContainer.innerHTML = this.generateComputedStyles(computedStyles);
                }
            }

            // 🔧 FIX: Update title for both old and new systems  
            if (this.popup) {
                const titleElement = this.popup.querySelector('.open-web-inspector-popup-title');
                if (titleElement) {
                    titleElement.textContent = this.getElementTitle(element);
                }
            }

            // 🔧 FIX: Re-setup buttons for old popup system only
            if (this.popup) {
                // Re-setup Screenshot button for new element
                const screenshotBtn = this.popup.querySelector('.open-web-inspector-screenshot-btn');
                if (screenshotBtn) {
                    screenshotBtn.replaceWith(screenshotBtn.cloneNode(true));
                    const newScreenshotBtn = this.popup.querySelector('.open-web-inspector-screenshot-btn');
                    newScreenshotBtn.addEventListener('click', () => this.takeElementScreenshot(element));
                }

                // Note: AI Snapshot button has been moved to code panel
            }
        }

        getElementPath(element) {
            const path = [];
            const elements = [];
            let current = element;
            
            // Build path up to body and store element references
            while (current && current !== document.documentElement) {
                let selector = current.tagName.toLowerCase();
                
                if (current.id) {
                    selector += `#${current.id}`;
                } else if (current.className) {
                    const classes = current.className.toString().split(' ')
                        .filter(cls => cls && !cls.startsWith('open-web-inspector-'))
                        .slice(0, 2)
                        .join('.');
                    if (classes) selector += `.${classes}`;
                }
                
                path.unshift(selector);
                elements.unshift(current);
                current = current.parentElement;
            }
            
            // Store elements for later use
            this.treeElements = elements;
            this.currentSelectedIndex = path.length - 1; // Initially select the target element
            
            // Create interactive structure with clickable elements
            let treeStructure = '';
            for (let i = 0; i < path.length; i++) {
                const indent = '  '.repeat(i);
                const icon = i === path.length - 1 ? '🎯 ' : (i === 0 ? '📄 ' : '📁 ');
                const isSelected = i === this.currentSelectedIndex;
                const className = isSelected ? 'tree-element selected' : 'tree-element';
                
                treeStructure += `${indent}<span class="${className}" data-element-index="${i}">${icon}${path[i]}</span>`;
                if (i < path.length - 1) treeStructure += '\n'; // Add newline only between elements, not at the end
            }
            
            return treeStructure;
        }

        generateElementPreview(element) {
            try {
                // Create a deep clone of the element
                const clone = element.cloneNode(true);
                
                // Remove any open-web-inspector classes to avoid conflicts
                this.cleanClonedElement(clone);
                
                // Get computed styles for the original element
                const computedStyles = window.getComputedStyle(element);
                
                // Apply essential styles to make the preview look correct
                const essentialStyles = [
                    'background', 'background-color', 'background-image', 'background-size', 'background-position',
                    'color', 'border', 'border-radius', 'padding', 'margin', 
                    'font-family', 'font-size', 'font-weight', 'line-height',
                    'text-align', 'display', 'flex-direction', 'justify-content', 'align-items',
                    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
                    'box-shadow', 'opacity', 'overflow'
                ];
                
                let styleString = 'position: relative !important; ';
                essentialStyles.forEach(prop => {
                    const value = computedStyles.getPropertyValue(prop);
                    if (value && value !== 'auto' && value !== 'normal' && value !== 'none') {
                        // Handle some special cases
                        if (prop === 'width' || prop === 'height') {
                            if (value.includes('px') && parseInt(value) > 800) {
                                return; // Skip very large dimensions
                            }
                        }
                        styleString += `${prop}: ${value}; `;
                    }
                });
                
                // Apply the styles to the clone
                clone.style.cssText = styleString;
                
                // Remove script tags and event handlers for safety
                const scripts = clone.querySelectorAll('script');
                scripts.forEach(script => script.remove());
                
                // Remove potentially problematic attributes
                this.cleanElementAttributes(clone);
                
                return clone.outerHTML;
            } catch (error) {
                console.warn('Element preview generation failed:', error);
                return '<div style="padding: 20px; text-align: center; color: #666; border: 1px dashed #ccc; border-radius: 4px;">👁️ Preview not available for this element</div>';
            }
        }

        cleanClonedElement(element) {
            // Remove open-web-inspector classes
            if (element.classList) {
                element.classList.remove('open-web-inspector-highlight');
            }
            
            // Recursively clean child elements
            Array.from(element.children || []).forEach(child => {
                this.cleanClonedElement(child);
            });
        }

        cleanElementAttributes(element) {
            // Remove potentially problematic event handlers and attributes
            const problematicAttributes = [
                'onclick', 'onmouseover', 'onmouseout', 'onload', 'onerror',
                'onsubmit', 'onchange', 'onfocus', 'onblur', 'href'
            ];
            
            problematicAttributes.forEach(attr => {
                if (element.hasAttribute && element.hasAttribute(attr)) {
                    element.removeAttribute(attr);
                }
            });
            
            // Recursively clean child elements
            Array.from(element.children || []).forEach(child => {
                this.cleanElementAttributes(child);
            });
        }

        getElementHTML(element) {
            // Create a copy to avoid modifying the original
            const clone = element.cloneNode(true);
            
            // Remove our classes from the clone
            clone.classList.remove('open-web-inspector-highlight');
            
            // Format the HTML for better readability
            const html = clone.outerHTML;
            return this.formatHTML(html);
        }

        formatHTML(html) {
            // Simple HTML formatting - add line breaks and indentation
            return html
                .replace(/></g, '>\n<')
                .replace(/\n\s*\n/g, '\n')
                .split('\n')
                .map((line, index) => {
                    const depth = (line.match(/^\s*<[^/]/g) || []).length;
                    const indent = '  '.repeat(Math.max(0, depth - 1));
                    return indent + line.trim();
                })
                .join('\n');
        }

        generateCSSStyles(element) {
            const cssRules = this.getMatchedCSSRules(element);
            
            if (cssRules.length === 0) {
                return '<div style="padding: 20px; text-align: center; color: #666;">No CSS rules found for this element</div>';
            }
            
            return cssRules.map(rule => this.generateCSSRuleGroup(rule)).join('');
        }

        getMatchedCSSRules(element) {
            // Use the actual page element, not inspector UI
            const targetElement = this.actualSelectedElement || element;
            
            console.log('🎯 CSS Analysis for:', targetElement.tagName + (targetElement.className ? '.' + targetElement.className.split(' ')[0] : ''));
            
            const matchedRules = [];
            let blockedSheetCount = 0;
            
            // Try to get stylesheet rules (gracefully handle cross-origin blocking)
            let foundDirectRules = false;
            try {
                for (let i = 0; i < document.styleSheets.length; i++) {
                    const sheet = document.styleSheets[i];
                    
                    try {
                        const rules = sheet.cssRules || sheet.rules;
                        if (!rules) continue;
                        
                        for (let j = 0; j < rules.length; j++) {
                            const rule = rules[j];
                            
                            if (rule.type === 1 && rule.selectorText) {
                                try {
                                    if (targetElement.matches(rule.selectorText)) {
                                        console.log(`✅ Found matching rule: ${rule.selectorText}`);
                                        
                                        const properties = [];
                                        for (let k = 0; k < rule.style.length; k++) {
                                            const propName = rule.style[k];
                                            properties.push({
                                                property: propName,
                                                value: rule.style.getPropertyValue(propName)
                                            });
                                        }
                                        
                                        matchedRules.push({
                                            selector: rule.selectorText,
                                            properties: properties,
                                            specificity: this.calculateSpecificity ? this.calculateSpecificity(rule.selectorText) : 100,
                                            source: 'stylesheet'
                                        });
                                        foundDirectRules = true;
                                    }
                                } catch (e) {
                                    continue;
                                }
                            }
                        }
                    } catch (e) {
                        blockedSheetCount++;
                        console.log(`❌ Blocked stylesheet: ${sheet.href || 'inline'} - ${e.message}`);
                    }
                }
            } catch (e) {
                console.error('Error accessing stylesheets:', e);
            }
            
            // Enhanced computed styles for production sites (especially when stylesheets are blocked)
            const computed = window.getComputedStyle(targetElement);
            
            // Generate meaningful selector for computed styles
            const elementSelector = this.generateElementSelector(targetElement);
            const computedSelector = foundDirectRules ? 
                `${elementSelector} (computed)` : 
                `${elementSelector} (computed - ${blockedSheetCount} blocked stylesheets)`;
            
            // Comprehensive list of meaningful computed properties
            const computedProperties = this.extractMeaningfulComputedStyles(computed);
            
            if (computedProperties.length > 0) {
                matchedRules.push({
                    selector: computedSelector,
                    properties: computedProperties,
                    specificity: foundDirectRules ? 1 : 1000, // Higher priority if no direct rules found
                    source: 'computed'
                });
            }
            
            // Add inline styles if present
            const inlineStyles = this.getInlineStyles(targetElement);
            if (inlineStyles.length > 0) {
                matchedRules.push({
                    selector: `${elementSelector} (inline)`,
                    properties: inlineStyles,
                    specificity: 1000,
                    source: 'inline'
                });
            }
            
            console.log(`🎯 Found ${matchedRules.length} total rules (${foundDirectRules ? 'with' : 'without'} direct stylesheet access, ${blockedSheetCount} blocked)`);
            
            // Enhanced sorting for production sites
            return matchedRules.sort((a, b) => {
                // Inline styles always first
                if (a.source === 'inline') return -1;
                if (b.source === 'inline') return 1;
                
                // If no direct rules found, show computed first
                if (!foundDirectRules) {
                    if (a.source === 'computed') return -1;
                    if (b.source === 'computed') return 1;
                }
                
                // Otherwise, stylesheet rules first, then computed
                if (a.source === 'stylesheet' && b.source === 'computed') return -1;
                if (b.source === 'stylesheet' && a.source === 'computed') return 1;
                
                // Within same source, sort by specificity
                return b.specificity - a.specificity;
            });
        }

        // Enhanced helper methods for production CSS detection
        generateElementSelector(element) {
            const tagName = element.tagName.toLowerCase();
            const id = element.id ? `#${element.id}` : '';
            
            // Handle multiple classes properly
            let className = '';
            if (element.className && element.className.trim()) {
                const classes = element.className.trim().split(/\s+/);
                // Show first few meaningful classes (avoid utility class clutter)
                const meaningfulClasses = classes.filter(cls => 
                    !cls.match(/^(is-|has-|u-|js-|sr-only|visually-hidden)/) &&
                    cls.length > 1
                ).slice(0, 3);
                
                if (meaningfulClasses.length > 0) {
                    className = '.' + meaningfulClasses.join('.');
                }
            }
            
            return `${tagName}${id}${className}`;
        }

        extractMeaningfulComputedStyles(computed) {
            const properties = [];
            
            // Categorized meaningful properties for better organization
            const essentialProps = [
                'display', 'position', 'z-index', 'overflow', 'box-sizing',
                'visibility', 'opacity', 'float', 'clear'
            ];
            
            const layoutProps = [
                'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
                'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'
            ];
            
            const borderProps = [
                'border', 'border-width', 'border-style', 'border-color',
                'border-radius', 'outline'
            ];
            
            const backgroundProps = [
                'background', 'background-color', 'background-image', 'background-size',
                'background-position', 'background-repeat'
            ];
            
            const typographyProps = [
                'color', 'font-family', 'font-size', 'font-weight', 'font-style',
                'line-height', 'text-align', 'text-decoration', 'text-transform',
                'letter-spacing', 'word-spacing'
            ];
            
            const flexGridProps = [
                'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
                'align-content', 'grid', 'grid-template-columns', 'grid-template-rows',
                'grid-gap'
            ];
            
            // Combine all property categories
            const allProps = [
                ...essentialProps, ...layoutProps, ...borderProps,
                ...backgroundProps, ...typographyProps, ...flexGridProps
            ];
            
            allProps.forEach(prop => {
                const value = computed.getPropertyValue(prop);
                if (value && this.isMeaningfulValue(prop, value)) {
                    properties.push({ property: prop, value });
                }
            });
            
            return properties;
        }

        isMeaningfulValue(property, value) {
            // Filter out default/meaningless values
            const skipValues = ['initial', 'normal', 'auto', 'none', '0px', '0px 0px', '0px 0px 0px 0px', 'rgba(0, 0, 0, 0)', 'transparent'];
            
            if (skipValues.includes(value)) return false;
            
            // Special cases for specific properties
            if (property === 'font-weight' && value === '400') return false; // Default weight
            if (property === 'line-height' && value === 'normal') return false;
            if (property === 'z-index' && value === 'auto') return false;
            if (property.includes('margin') && value === '0px') return false;
            if (property.includes('padding') && value === '0px') return false;
            
            return true;
        }

        generateCSSModificationGuidance(element) {
            const suggestions = [];
            const tagName = element.tagName.toLowerCase();
            const elementId = element.id;
            const classes = element.className ? element.className.trim().split(/\s+/).filter(cls => 
                cls && !cls.includes('open-web-inspector') && cls.length > 1
            ) : [];
            
            // 1. Most specific - ID selector (highest specificity)
            if (elementId) {
                suggestions.push(`1. **#${elementId}** (highest specificity - overrides almost everything)`);
            }
            
            // 2. Element + ID
            if (elementId) {
                suggestions.push(`2. **${tagName}#${elementId}** (very high specificity)`);
            }
            
            // 3. Element + all classes
            if (classes.length > 0) {
                const allClasses = classes.slice(0, 3).join('.');
                suggestions.push(`3. **${tagName}.${allClasses}** (high specificity - matches exact element)`);
            }
            
            // 4. First meaningful class combinations
            if (classes.length > 0) {
                const mainClass = classes[0];
                suggestions.push(`4. **${tagName}.${mainClass}** (medium specificity - for ${mainClass} styling)`);
                
                if (classes.length > 1) {
                    suggestions.push(`5. **.${mainClass}.${classes[1]}** (class combination)`);
                }
                
                suggestions.push(`6. **.${mainClass}** (targets all ${mainClass} elements)`);
            }
            
            // 7. Element selector (lowest specificity)
            suggestions.push(`${suggestions.length + 1}. **${tagName}** (lowest specificity - affects all ${tagName} elements)`);
            
            // Add practical examples
            suggestions.push('');
            suggestions.push('**EXAMPLE CSS RULES:**');
            if (elementId) {
                suggestions.push(`\`\`\`css\n#${elementId} {\n  color: blue;\n  font-size: 20px;\n}\n\`\`\``);
            } else if (classes.length > 0) {
                suggestions.push(`\`\`\`css\n.${classes[0]} {\n  color: blue;\n  font-size: 20px;\n}\n\`\`\``);
            } else {
                suggestions.push(`\`\`\`css\n${tagName} {\n  color: blue;\n  font-size: 20px;\n}\n\`\`\``);
            }
            
            // Add inline style option
            suggestions.push('');
            suggestions.push('**INLINE STYLE OPTION (highest priority):**');
            suggestions.push(`\`\`\`html\n<${tagName}${elementId ? ` id="${elementId}"` : ''}${classes.length ? ` class="${classes.join(' ')}"` : ''} style="color: blue; font-size: 20px;">\n\`\`\``);
            
            return suggestions.join('\n');
        }

        getInlineStyles(element) {
            const properties = [];
            const style = element.style;
            
            for (let i = 0; i < style.length; i++) {
                const property = style[i];
                const value = style.getPropertyValue(property);
                properties.push({ property, value });
            }
            
            return properties;
        }

        getInheritedStyles(element, existingRules) {
            const inheritedRules = [];
            const inheritableProperties = this.getInheritableProperties();
            
            // Track properties already covered by direct rules
            const coveredProperties = new Set();
            existingRules.forEach(rule => {
                rule.properties.forEach(prop => {
                    coveredProperties.add(prop.property);
                });
            });
            
            // Walk up the DOM tree to find inherited styles
            let parent = element.parentElement;
            let depth = 0;
            const maxDepth = 10; // Limit depth to avoid performance issues
            
            while (parent && parent !== document.documentElement && depth < maxDepth) {
                const parentInheritedProps = this.getParentInheritedProperties(
                    parent, 
                    inheritableProperties, 
                    coveredProperties
                );
                
                if (parentInheritedProps.length > 0) {
                    const parentSelector = this.getElementSelector(parent);
                    inheritedRules.push({
                        selector: `Inherited from ${parentSelector}`,
                        properties: parentInheritedProps,
                        specificity: 0,
                        source: 'inherited',
                        parentElement: parent
                    });
                    
                    // Mark these properties as covered
                    parentInheritedProps.forEach(prop => {
                        coveredProperties.add(prop.property);
                    });
                }
                
                parent = parent.parentElement;
                depth++;
            }
            
            return inheritedRules;
        }

        getInheritableProperties() {
            return [
                'color', 'font-family', 'font-size', 'font-weight', 'font-style',
                'font-variant', 'line-height', 'text-align', 'text-decoration',
                'text-transform', 'text-indent', 'letter-spacing', 'word-spacing',
                'list-style', 'list-style-type', 'list-style-position', 'list-style-image',
                'cursor', 'visibility', 'white-space', 'direction', 'quotes',
                'orphans', 'widows', 'caption-side', 'border-collapse', 'border-spacing',
                'empty-cells', 'table-layout'
            ];
        }

        getParentInheritedProperties(parent, inheritableProperties, coveredProperties) {
            const properties = [];
            const computedStyle = window.getComputedStyle(parent);
            
            // Check for explicit CSS rules on this parent
            try {
                const sheets = Array.from(document.styleSheets);
                
                sheets.forEach(sheet => {
                    try {
                        const rules = Array.from(sheet.cssRules || sheet.rules || []);
                        
                        rules.forEach(rule => {
                            if (rule.type === CSSRule.STYLE_RULE && rule.selectorText) {
                                if (this.elementMatchesSelector(parent, rule.selectorText)) {
                                    const ruleProperties = this.extractPropertiesFromRule(rule);
                                    ruleProperties.forEach(prop => {
                                        if (inheritableProperties.includes(prop.property) && 
                                            !coveredProperties.has(prop.property)) {
                                            properties.push(prop);
                                        }
                                    });
                                }
                            }
                        });
                    } catch (e) {
                        // Skip inaccessible stylesheets
                    }
                });
            } catch (e) {
                console.debug('Error accessing parent stylesheets:', e);
            }
            
            // Check for inline styles on parent
            const parentStyle = parent.style;
            for (let i = 0; i < parentStyle.length; i++) {
                const property = parentStyle[i];
                if (inheritableProperties.includes(property) && !coveredProperties.has(property)) {
                    const value = parentStyle.getPropertyValue(property);
                    properties.push({ property, value });
                }
            }
            
            // Remove duplicates
            const uniqueProperties = [];
            const seenProperties = new Set();
            properties.forEach(prop => {
                if (!seenProperties.has(prop.property)) {
                    uniqueProperties.push(prop);
                    seenProperties.add(prop.property);
                }
            });
            
            return uniqueProperties;
        }

        getElementSelector(element) {
            const tagName = element.tagName.toLowerCase();
            const id = element.id ? `#${element.id}` : '';
            const className = element.className ? `.${element.className.split(' ')[0]}` : '';
            return `${tagName}${id}${className}`;
        }

        elementMatchesSelector(element, selector) {
            try {
                return element.matches(selector);
            } catch (e) {
                return false;
            }
        }

        extractPropertiesFromRule(rule) {
            const properties = [];
            const style = rule.style;
            
            // Group longhand properties back into shorthands for cleaner display
            const shorthandGroups = this.groupIntoShorthands(style);
            
            for (const [property, value] of shorthandGroups) {
                properties.push({ property, value });
            }
            
            return properties;
        }

        groupIntoShorthands(style) {
            const properties = new Map();
            const usedLonghands = new Set();
            
            // Get all properties from the style
            const allProperties = [];
            for (let i = 0; i < style.length; i++) {
                const property = style[i];
                const value = style.getPropertyValue(property);
                allProperties.push({ property, value });
            }
            
            // Try to reconstruct common shorthands
            this.tryReconstructShorthand(allProperties, properties, usedLonghands, 'background', [
                'background-color', 'background-image', 'background-repeat', 
                'background-attachment', 'background-position', 'background-size', 'background-origin', 'background-clip'
            ]);
            
            this.tryReconstructShorthand(allProperties, properties, usedLonghands, 'border', [
                'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
                'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
                'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'
            ]);
            
            this.tryReconstructShorthand(allProperties, properties, usedLonghands, 'padding', [
                'padding-top', 'padding-right', 'padding-bottom', 'padding-left'
            ]);
            
            this.tryReconstructShorthand(allProperties, properties, usedLonghands, 'margin', [
                'margin-top', 'margin-right', 'margin-bottom', 'margin-left'
            ]);
            
            this.tryReconstructShorthand(allProperties, properties, usedLonghands, 'border-radius', [
                'border-top-left-radius', 'border-top-right-radius', 
                'border-bottom-right-radius', 'border-bottom-left-radius'
            ]);
            
            // Add remaining properties that weren't part of any shorthand
            allProperties.forEach(({ property, value }) => {
                if (!usedLonghands.has(property)) {
                    properties.set(property, value);
                }
            });
            
            return properties;
        }

        tryReconstructShorthand(allProperties, properties, usedLonghands, shorthandName, longhandProperties) {
            const foundLonghands = [];
            const longhandValues = [];
            
            // Check if we have any of the longhand properties
            allProperties.forEach(({ property, value }) => {
                if (longhandProperties.includes(property)) {
                    foundLonghands.push(property);
                    longhandValues.push(value);
                }
            });
            
            // If we found longhands, try to reconstruct the shorthand
            if (foundLonghands.length > 0) {
                let shorthandValue = '';
                
                if (shorthandName === 'padding' || shorthandName === 'margin') {
                    // For padding/margin, reconstruct 4-value shorthand
                    const top = this.getLonghandValue(allProperties, `${shorthandName}-top`);
                    const right = this.getLonghandValue(allProperties, `${shorthandName}-right`);
                    const bottom = this.getLonghandValue(allProperties, `${shorthandName}-bottom`);
                    const left = this.getLonghandValue(allProperties, `${shorthandName}-left`);
                    
                    if (top && right && bottom && left) {
                        if (top === right && right === bottom && bottom === left) {
                            shorthandValue = top; // All same
                        } else if (top === bottom && right === left) {
                            shorthandValue = `${top} ${right}`; // Vertical horizontal
                        } else {
                            shorthandValue = `${top} ${right} ${bottom} ${left}`; // All different
                        }
                    }
                } else {
                    // For other shorthands, just show the first meaningful value
                    shorthandValue = longhandValues.find(v => v && v !== 'initial' && v !== 'none') || longhandValues[0];
                }
                
                if (shorthandValue) {
                    properties.set(shorthandName, shorthandValue);
                    // Mark longhands as used
                    foundLonghands.forEach(prop => usedLonghands.add(prop));
                }
            }
        }

        getLonghandValue(allProperties, propertyName) {
            const found = allProperties.find(p => p.property === propertyName);
            return found ? found.value : null;
        }

        calculateSpecificity(selector) {
            // Simplified specificity calculation
            const ids = (selector.match(/#/g) || []).length;
            const classes = (selector.match(/\./g) || []).length;
            const attributes = (selector.match(/\[/g) || []).length;
            const pseudoClasses = (selector.match(/:/g) || []).length;
            const elements = (selector.match(/[a-zA-Z]/g) || []).length;
            
            return (ids * 100) + (classes * 10) + (attributes * 10) + (pseudoClasses * 10) + elements;
        }

        getComputedStylesRule(element, existingRules) {
            const computedStyle = window.getComputedStyle(element);
            // Only include essential computed properties that aren't covered elsewhere
            const essentialProperties = [
                'display', 'position', 'z-index', 'overflow', 'box-sizing'
            ];
            
            const properties = [];
            const coveredProperties = new Set();
            
            // Mark properties that are already covered by explicit rules or inherited
            existingRules.forEach(rule => {
                rule.properties.forEach(prop => {
                    coveredProperties.add(prop.property);
                });
            });
            
            // Add only essential computed properties not covered elsewhere
            essentialProperties.forEach(property => {
                if (!coveredProperties.has(property)) {
                    const value = computedStyle.getPropertyValue(property);
                    if (value && value !== 'none' && value !== 'auto' && value !== 'normal' && value !== 'initial') {
                        properties.push({ property, value });
                    }
                }
            });
            
            return {
                selector: 'computed styles',
                properties: properties,
                specificity: 0,
                source: 'computed'
            };
        }

        generateCSSRuleGroup(rule) {
            const ruleId = `rule-${Math.random().toString(36).substr(2, 9)}`;
            const isExpanded = (rule.source === 'inline' || rule.properties.length <= 5) && rule.source !== 'inherited'; // Auto-expand small rules, but keep inherited collapsed
            
            const propertiesHtml = rule.properties.map(prop => {
                const isChanged = this.hasPropertyChanged(this.currentElement, prop.property);
                const currentValue = this.getCurrentPropertyValue(this.currentElement, prop.property) || prop.value;
                
                return `
                    <div class="open-web-inspector-css-property" data-property="${prop.property}">
                        <span class="open-web-inspector-css-property-name" title="${prop.property}">${prop.property}</span>
                        <input 
                            type="text" 
                            class="open-web-inspector-css-value-input ${isChanged ? 'changed' : ''}" 
                            value="${currentValue}" 
                            data-property="${prop.property}"
                            data-original-value="${prop.value}"
                            title="Click to edit. Press Enter to apply."
                        />
                        ${isChanged ? `<button class="open-web-inspector-css-reset-btn" data-property="${prop.property}" title="Reset to original">↺</button>` : ''}
                    </div>
                `;
            }).join('');
            
            const selectorIcon = rule.source === 'inline' ? '📝' : 
                               rule.source === 'computed' ? '🧮' : 
                               rule.source === 'inherited' ? '👨‍👩‍👧‍👦' : '🎨';
            
            const inheritedClass = rule.source === 'inherited' ? ' open-web-inspector-css-inherited-rule' : '';
            
            return `
                <div class="open-web-inspector-css-rule-group${inheritedClass}">
                    <div class="open-web-inspector-css-rule-header ${isExpanded ? '' : 'collapsed'}" data-rule-id="${ruleId}">
                        <span class="open-web-inspector-css-rule-selector">
                            ${selectorIcon} ${rule.selector} 
                            <small style="opacity: 0.8;">(${rule.properties.length} ${rule.properties.length === 1 ? 'property' : 'properties'})</small>
                        </span>
                        <span class="open-web-inspector-css-rule-toggle ${isExpanded ? '' : 'collapsed'}">▼</span>
                    </div>
                    <div class="open-web-inspector-css-rule-content ${isExpanded ? '' : 'collapsed'}" data-rule-content="${ruleId}">
                        <div class="open-web-inspector-css-rule-properties">
                            ${propertiesHtml}
                        </div>
                    </div>
                </div>
            `;
        }

        hasPropertyChanged(element, property) {
            if (!this.cssChanges.has(element)) return false;
            const changes = this.cssChanges.get(element);
            return changes.hasOwnProperty(property);
        }

        getCurrentPropertyValue(element, property) {
            if (!this.cssChanges.has(element)) return null;
            const changes = this.cssChanges.get(element);
            return changes[property]?.current || null;
        }

        getOriginalPropertyValue(element, property) {
            if (!this.cssChanges.has(element)) return null;
            const changes = this.cssChanges.get(element);
            return changes[property]?.original || null;
        }

        recordCSSChange(element, property, originalValue, newValue) {
            if (!this.cssChanges.has(element)) {
                this.cssChanges.set(element, {});
            }
            const changes = this.cssChanges.get(element);
            
            if (!changes[property]) {
                changes[property] = { original: originalValue };
            }
            changes[property].current = newValue;
            
            // Apply the change to the element
            element.style.setProperty(property, newValue);
        }

        resetCSSProperty(element, property) {
            if (!this.cssChanges.has(element)) return;
            
            const changes = this.cssChanges.get(element);
            if (changes[property]) {
                // Remove the property to restore original styling
                element.style.removeProperty(property);
                delete changes[property];
                
                // If no more changes for this element, remove the element from tracking
                if (Object.keys(changes).length === 0) {
                    this.cssChanges.delete(element);
                }
            }
        }

        generateComputedStyles(computedStyles) {
            const properties = Array.from(computedStyles);
            return properties.map(property => {
                const value = computedStyles.getPropertyValue(property);
                return `
                    <div class="open-web-inspector-css-property">
                        <span class="open-web-inspector-css-property-name" title="${property}">${property}</span>
                        <span class="open-web-inspector-css-property-value" title="${value}">${value}</span>
                    </div>
                `;
            }).join('');
        }

        closePopup() {
            // Close old popup system (if any)
            if (this.popup) {
                this.popup.remove();
                this.popup = null;
            }
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            
            // Close new FAB system
            if (this.fabPopup) {
                this.fabPopup.remove();
                this.fabPopup = null;
            }
            
            // Clean up FAB outside click handler
            if (this.fabOutsideClickHandler) {
                document.removeEventListener('click', this.fabOutsideClickHandler);
                this.fabOutsideClickHandler = null;
            }
            
            // Close any open panels
            this.closePanels();
        }
    }

    // Auto-initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.OpenWebInspector = new OpenWebInspector();
                window.OpenWebInspector.attachGlobalAPI();
            });
        } else {
            window.OpenWebInspector = new OpenWebInspector();
            window.OpenWebInspector.attachGlobalAPI();
        }
    }

    init();

})();
