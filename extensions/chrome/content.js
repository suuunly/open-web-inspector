// Simple Open Web Inspector Extension Content Script
// The library is already loaded via manifest content_scripts

console.log('🚀 Content script starting to load...');
console.log('🔍 html2canvas available:', typeof window.html2canvas);
console.log('🔍 OpenWebInspector available:', typeof window.OpenWebInspector);

(function() {
    'use strict';
    
    console.log('🔧 Content script IIFE executing...');
    
    // Check if already initialized
    if (window.openWebInspectorExtensionReady) {
        console.log('⚠️ Already initialized, skipping...');
        return;
    }
    window.openWebInspectorExtensionReady = true;
    console.log('✅ Content script initialized!');
    
    // Setup message listener for popup communication
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (typeof window.OpenWebInspector === 'undefined') {
            sendResponse({ success: false, message: 'Inspector not available' });
            return;
        }
        
        if (request.action === 'enable') {
            window.OpenWebInspector.enable();
            sendResponse({ success: true, message: 'Inspector enabled' });
        }
        else if (request.action === 'disable') {
            window.OpenWebInspector.disable();
            sendResponse({ success: true, message: 'Inspector disabled' });
        }
        else if (request.action === 'toggle') {
            window.OpenWebInspector.toggle();
            const isActive = window.OpenWebInspector.isActive();
            sendResponse({ 
                success: true, 
                message: `Inspector ${isActive ? 'enabled' : 'disabled'}`,
                isActive: isActive
            });
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
        else if (request.action === 'selectElement' && request.selector) {
            window.OpenWebInspector.selectElement(request.selector);
            sendResponse({ success: true, message: `Selected: ${request.selector}` });
        }
        
        return true;
    });
    
    // Note: Keyboard shortcuts are handled by the main OpenWebInspector library
    // No need to duplicate them here - the library already sets up Ctrl+Shift+E and Escape
    
    // Log any script errors for debugging
    window.addEventListener('error', (e) => {
        console.error('🚨 Script error detected:', e.message, e.filename, e.lineno);
        if (e.message && (e.message.includes('html2canvas') || e.message.includes('OpenWebInspector'))) {
            console.error('🚨 Extension script error:', e.error);
        }
    });
    
    // html2canvas is now bundled locally via manifest.json - no dynamic loading needed
    
    // Wait for OpenWebInspector to be ready, then initialize
    function checkAndInitialize() {
        if (typeof window.OpenWebInspector !== 'undefined') {
            console.log('🎯 Open Web Inspector Ready!');
            console.log('📋 Available methods:', Object.keys(window.OpenWebInspector));
            console.log('🔍 Initial state - isActive:', window.OpenWebInspector.isActive());
            console.log('📦 Extension version:', window.OpenWebInspector.getVersion?.() || 'unknown');
            console.log('🖼️ html2canvas available:', typeof window.html2canvas);
            
            // Screenshot functionality should work now with bundled html2canvas
        } else {
            console.log('⏳ OpenWebInspector not ready yet, retrying...');
            // Library might still be loading, try again
            setTimeout(checkAndInitialize, 100);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndInitialize);
    } else {
        checkAndInitialize();
    }
    
    // Simple helper for console use
    window.openWebInspectorExtension = {
        enable: () => window.OpenWebInspector?.enable(),
        disable: () => window.OpenWebInspector?.disable(), 
        toggle: () => window.OpenWebInspector?.toggle(),
        status: () => ({
            loaded: typeof window.OpenWebInspector !== 'undefined',
            active: window.OpenWebInspector?.isActive() || false,
            version: window.OpenWebInspector?.getVersion() || null
        })
    };
    
})();
