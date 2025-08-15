// Open Web Inspector Extension Background Script
// Handles extension lifecycle and context menu integration

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Open Web Inspector Extension installed/updated:', details.reason);
    
    // Create context menu item
    chrome.contextMenus.create({
        id: 'open-web-inspector-enable',
        title: 'Inspect with Open Web Inspector',
        contexts: ['all']
    });
    
    // Show welcome notification on first install
    if (details.reason === 'install') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'Open Web Inspector Installed!',
            message: 'Click any page to auto-inject the inspector. Use Ctrl+Shift+E to toggle.'
        });
    }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'open-web-inspector-enable') {
        // Send message to content script to enable inspector
        chrome.tabs.sendMessage(tab.id, { action: 'enable' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Failed to communicate with content script:', chrome.runtime.lastError);
                
                // Try to inject content script if not already present
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                }).catch(error => {
                    console.error('Failed to inject content script:', error);
                });
            } else if (response && response.success) {
                console.log('Inspector enabled via context menu');
            }
        });
    }
});

// Handle extension icon click (though popup handles most interaction)
chrome.action.onClicked.addListener((tab) => {
    // This won't fire if popup is defined, but keeping for completeness
    console.log('Extension icon clicked for tab:', tab.id);
});

// Listen for tab updates to re-inject if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only act on complete page loads
    if (changeInfo.status === 'complete' && tab.url) {
        // Skip chrome:// and extension pages
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            return;
        }
        
        console.log('Page loaded, content script should auto-inject:', tab.url);
    }
});

// Handle messages from content scripts (if needed for coordination)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request, 'from tab:', sender.tab?.id);
    
    // Handle any background-specific tasks here
    if (request.action === 'extensionStatus') {
        sendResponse({
            success: true,
            extensionId: chrome.runtime.id,
            version: chrome.runtime.getManifest().version
        });
    }
    
    return true; // Keep message channel open
});
