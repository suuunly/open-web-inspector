// Open Web Inspector Auto-Injector Content Script
// Automatically injects Open Web Inspector into every webpage

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        cdnUrl: 'https://cdn.jsdelivr.net/npm/open-web-inspector@latest/dist/open-web-inspector.min.js',
        localUrl: chrome.runtime.getURL('open-web-inspector.min.js'),
        autoEnable: false, // Set to true to auto-enable inspector on every page
        debugMode: true,
        useLocal: true // Use bundled version to avoid CSP issues
    };
    
    // Debug logging
    function log(message, ...args) {
        if (CONFIG.debugMode) {
            console.log(`[Open Web Inspector Extension] ${message}`, ...args);
        }
    }
    
    // Check if already injected to avoid duplicates
    if (window.openWebInspectorInjected) {
        log('Already injected, skipping...');
        return;
    }
    
    // Mark as injected
    window.openWebInspectorInjected = true;
    
    /**
     * Inject Open Web Inspector into the page
     */
    function injectOpenWebInspector() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof window.OpenWebInspector !== 'undefined') {
                log('Open Web Inspector already available');
                resolve(window.OpenWebInspector);
                return;
            }
            
            log('Injecting Open Web Inspector...');
            
            // Create script element
            const script = document.createElement('script');
            script.src = CONFIG.useLocal ? CONFIG.localUrl : CONFIG.cdnUrl;
            script.async = true;
            
            log(`Loading from: ${script.src}`);
            
            // Handle successful load
            script.onload = () => {
                log('✅ Open Web Inspector loaded successfully!');
                
                // Wait a bit for global API setup
                setTimeout(() => {
                    if (typeof window.OpenWebInspector !== 'undefined') {
                        log('🎯 Global API ready!');
                        resolve(window.OpenWebInspector);
                        
                        // Auto-enable if configured
                        if (CONFIG.autoEnable) {
                            window.OpenWebInspector.enable();
                            log('🚀 Auto-enabled inspector');
                        }
                        
                        // Dispatch custom event for other scripts
                        document.dispatchEvent(new CustomEvent('openWebInspectorReady', {
                            detail: { api: window.OpenWebInspector }
                        }));
                    } else {
                        reject(new Error('Global API not available after load'));
                    }
                }, 100);
            };
            
            // Handle load error
            script.onerror = (error) => {
                log('❌ Failed to load Open Web Inspector:', error);
                reject(error);
            };
            
            // Inject into page
            (document.head || document.documentElement).appendChild(script);
        });
    }
    
    /**
     * Setup extension message listener for popup communication
     */
    function setupMessageListener() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            log('Received message:', request);
            
            if (request.action === 'enable') {
                if (typeof window.OpenWebInspector !== 'undefined') {
                    window.OpenWebInspector.enable();
                    sendResponse({ success: true, message: 'Inspector enabled' });
                } else {
                    sendResponse({ success: false, message: 'Inspector not loaded' });
                }
            }
            
            else if (request.action === 'disable') {
                if (typeof window.OpenWebInspector !== 'undefined') {
                    window.OpenWebInspector.disable();
                    sendResponse({ success: true, message: 'Inspector disabled' });
                } else {
                    sendResponse({ success: false, message: 'Inspector not loaded' });
                }
            }
            
            else if (request.action === 'toggle') {
                if (typeof window.OpenWebInspector !== 'undefined') {
                    window.OpenWebInspector.toggle();
                    const isActive = window.OpenWebInspector.isActive();
                    sendResponse({ 
                        success: true, 
                        message: `Inspector ${isActive ? 'enabled' : 'disabled'}`,
                        isActive: isActive
                    });
                } else {
                    sendResponse({ success: false, message: 'Inspector not loaded' });
                }
            }
            
            else if (request.action === 'status') {
                const loaded = typeof window.OpenWebInspector !== 'undefined';
                const active = loaded ? window.OpenWebInspector.isActive() : false;
                sendResponse({ 
                    success: true, 
                    loaded: loaded, 
                    active: active,
                    version: loaded ? window.OpenWebInspector.getVersion() : null
                });
            }
            
            else if (request.action === 'selectElement') {
                if (typeof window.OpenWebInspector !== 'undefined' && request.selector) {
                    window.OpenWebInspector.selectElement(request.selector);
                    sendResponse({ success: true, message: `Selected: ${request.selector}` });
                } else {
                    sendResponse({ success: false, message: 'Inspector not loaded or no selector provided' });
                }
            }
            
            return true; // Keep message channel open for async response
        });
    }
    
    /**
     * Add keyboard shortcut enhancement
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+I = Force enable inspector (in addition to built-in shortcuts)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                if (typeof window.OpenWebInspector !== 'undefined') {
                    window.OpenWebInspector.enable();
                    log('🎯 Inspector enabled via Ctrl+Shift+I');
                } else {
                    log('⚠️ Inspector not loaded yet');
                }
            }
        });
    }
    
    /**
     * Initialize the extension
     */
    async function initialize() {
        try {
            log('🚀 Initializing Open Web Inspector Extension...');
            log('Current page URL:', window.location.href);
            log('Document ready state:', document.readyState);
            
            // Inject the inspector
            await injectOpenWebInspector();
            
            // Setup communication with popup
            setupMessageListener();
            
            // Setup additional keyboard shortcuts
            setupKeyboardShortcuts();
            
            log('✅ Extension initialized successfully!');
            log('OpenWebInspector available:', typeof window.OpenWebInspector);
            
            // Show a subtle notification (can be disabled)
            if (CONFIG.debugMode) {
                console.log(
                    '%c🎯 Open Web Inspector Ready!', 
                    'color: #4CAF50; font-weight: bold; font-size: 14px;',
                    '\n• Press Ctrl+Shift+E to toggle inspector',
                    '\n• Click extension icon for controls', 
                    '\n• Right-click → Inspect with Open Web Inspector'
                );
            }
            
        } catch (error) {
            log('❌ Extension initialization failed:', error);
            console.error('[Open Web Inspector Extension] Detailed error:', error);
        }
    }
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM already ready
        initialize();
    }
    
    // Expose a global helper for console use
    window.openWebInspectorExtension = {
        enable: () => window.OpenWebInspector?.enable(),
        disable: () => window.OpenWebInspector?.disable(), 
        toggle: () => window.OpenWebInspector?.toggle(),
        status: () => ({
            loaded: typeof window.OpenWebInspector !== 'undefined',
            active: window.OpenWebInspector?.isActive() || false,
            version: window.OpenWebInspector?.getVersion() || null
        }),
        select: (selector) => window.OpenWebInspector?.selectElement(selector)
    };
    
})();
