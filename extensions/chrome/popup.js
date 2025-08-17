// Simple Open Web Inspector Popup

document.addEventListener('DOMContentLoaded', async () => {
    const toggleBtn = document.getElementById('toggleBtn');
    let currentTab = null;
    let isInspecting = false;
    
    // Get current tab
    async function getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }
    
    // Send message to content script
    async function sendMessage(action) {
        if (!currentTab) return;
        
        return new Promise((resolve) => {
            chrome.tabs.sendMessage(currentTab.id, { action }, (response) => {
                resolve(response || { success: false });
            });
        });
    }
    
    // Update button appearance
    function updateButton(inspecting) {
        isInspecting = inspecting;
        if (inspecting) {
            toggleBtn.textContent = 'Stop Inspecting';
            toggleBtn.className = 'toggle-btn stop';
        } else {
            toggleBtn.textContent = 'Inspect';
            toggleBtn.className = 'toggle-btn inspect';
        }
    }
    
    // Handle toggle button click
    toggleBtn.addEventListener('click', async () => {
        toggleBtn.disabled = true;
        
        try {
            const response = await sendMessage('toggle');
            if (response && response.success) {
                updateButton(!isInspecting);
            }
        } catch (error) {
            console.error('Toggle failed:', error);
        }
        
        toggleBtn.disabled = false;
    });
    
    // Initialize
    try {
        currentTab = await getCurrentTab();
        
        // Check if valid page
        if (!currentTab || !currentTab.url || 
            currentTab.url.startsWith('chrome://') || 
            currentTab.url.startsWith('chrome-extension://')) {
            toggleBtn.textContent = 'Not Available';
            toggleBtn.disabled = true;
            return;
        }
        
        // Check initial status
        const response = await sendMessage('status');
        if (response && response.success) {
            updateButton(response.active);
        }
        
    } catch (error) {
        console.error('Popup init failed:', error);
        toggleBtn.textContent = 'Error';
        toggleBtn.disabled = true;
    }
});
