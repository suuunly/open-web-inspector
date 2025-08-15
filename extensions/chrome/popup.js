// Open Web Inspector Extension Popup Script

document.addEventListener('DOMContentLoaded', async () => {
    const elements = {
        loading: document.getElementById('loading'),
        content: document.getElementById('content'),
        status: document.getElementById('status'),
        statusText: document.getElementById('status-text'),
        versionBadge: document.getElementById('version-badge'),
        toggleBtn: document.getElementById('toggleBtn'),
        enableBtn: document.getElementById('enableBtn'),
        disableBtn: document.getElementById('disableBtn')
    };
    
    let currentTab = null;
    
    /**
     * Get the current active tab
     */
    async function getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }
    
    /**
     * Send message to content script
     */
    async function sendMessage(action, data = {}) {
        if (!currentTab) {
            throw new Error('No active tab available');
        }
        
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(currentTab.id, { action, ...data }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }
    
    /**
     * Update the UI status
     */
    function updateStatus(loaded, active, version = null) {
        // Update status container classes
        elements.status.classList.remove('loaded', 'not-loaded', 'active');
        
        if (!loaded) {
            elements.status.classList.add('not-loaded');
            elements.statusText.textContent = 'Inspector not loaded';
            elements.versionBadge.textContent = '';
        } else if (active) {
            elements.status.classList.add('active');
            elements.statusText.textContent = 'Inspector ACTIVE';
            elements.versionBadge.textContent = version ? `v${version}` : '';
        } else {
            elements.status.classList.add('loaded');
            elements.statusText.textContent = 'Inspector ready';
            elements.versionBadge.textContent = version ? `v${version}` : '';
        }
        
        // Update button states
        elements.toggleBtn.disabled = !loaded;
        elements.enableBtn.disabled = !loaded || active;
        elements.disableBtn.disabled = !loaded || !active;
        
        // Update button text
        if (loaded) {
            elements.toggleBtn.textContent = active ? 'Disable Inspector' : 'Enable Inspector';
        } else {
            elements.toggleBtn.textContent = 'Inspector Not Loaded';
        }
    }
    
    /**
     * Check the current status
     */
    async function checkStatus() {
        try {
            const response = await sendMessage('status');
            if (response && response.success) {
                updateStatus(response.loaded, response.active, response.version);
            } else {
                updateStatus(false, false);
            }
        } catch (error) {
            console.error('Failed to check status:', error);
            updateStatus(false, false);
        }
    }
    
    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        // Create a temporary notification (you could enhance this)
        const originalText = elements.statusText.textContent;
        elements.statusText.textContent = message;
        
        setTimeout(() => {
            checkStatus(); // Refresh status after action
        }, 1000);
    }
    
    /**
     * Handle button clicks
     */
    elements.toggleBtn.addEventListener('click', async () => {
        try {
            elements.toggleBtn.disabled = true;
            const response = await sendMessage('toggle');
            
            if (response && response.success) {
                showNotification(response.message, 'success');
            } else {
                showNotification('Failed to toggle inspector', 'error');
            }
        } catch (error) {
            console.error('Toggle failed:', error);
            showNotification('Extension communication error', 'error');
        } finally {
            elements.toggleBtn.disabled = false;
        }
    });
    
    elements.enableBtn.addEventListener('click', async () => {
        try {
            elements.enableBtn.disabled = true;
            const response = await sendMessage('enable');
            
            if (response && response.success) {
                showNotification('Inspector enabled!', 'success');
            } else {
                showNotification('Failed to enable inspector', 'error');
            }
        } catch (error) {
            console.error('Enable failed:', error);
            showNotification('Extension communication error', 'error');
        } finally {
            elements.enableBtn.disabled = false;
        }
    });
    
    elements.disableBtn.addEventListener('click', async () => {
        try {
            elements.disableBtn.disabled = true;
            const response = await sendMessage('disable');
            
            if (response && response.success) {
                showNotification('Inspector disabled', 'success');
            } else {
                showNotification('Failed to disable inspector', 'error');
            }
        } catch (error) {
            console.error('Disable failed:', error);
            showNotification('Extension communication error', 'error');
        } finally {
            elements.disableBtn.disabled = false;
        }
    });
    
    // Initialize
    try {
        currentTab = await getCurrentTab();
        
        if (!currentTab) {
            throw new Error('No active tab found');
        }
        
        // Check if this is a valid web page
        if (!currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://')) {
            elements.loading.style.display = 'none';
            elements.content.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #6c757d;">
                    <p>⚠️ Cannot inject inspector</p>
                    <p style="font-size: 12px;">Extension pages and system pages are not supported</p>
                </div>
            `;
            elements.content.style.display = 'block';
            return;
        }
        
        // Hide loading and show content
        elements.loading.style.display = 'none';
        elements.content.style.display = 'block';
        
        // Check initial status
        await checkStatus();
        
        // Set up periodic status refresh
        const statusInterval = setInterval(checkStatus, 2000);
        
        // Clean up when popup closes
        window.addEventListener('beforeunload', () => {
            clearInterval(statusInterval);
        });
        
    } catch (error) {
        console.error('Popup initialization failed:', error);
        elements.loading.textContent = 'Failed to connect to page';
    }
});
