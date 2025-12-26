let host = null;
let shadow = null;
let container = null;
let iframe = null;
let listenersAttached = false;
let isPopupVisible = false;
let iframeLoaded = false; // Track if iframe has been loaded

// Inline CSS for instant rendering (no network delay)
const INLINE_STYLES = `
.grok-container {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 450px;
    height: 600px;
    background-color: #1e1e1e;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
    flex-direction: column;
    overflow: hidden;
    z-index: 999999;
    border: 1px solid #333;
    
    visibility: hidden;
    opacity: 0;
    transform: translate3d(0, 10px, 0);
    
    will-change: opacity, transform, visibility;
    transition: opacity 0.15s ease-out, transform 0.15s ease-out, visibility 0s linear 0.15s;
}

.grok-container.visible {
    visibility: visible;
    opacity: 1;
    transform: translate3d(0, 0, 0);
    transition: opacity 0.15s ease-out, transform 0.15s ease-out, visibility 0s linear 0s;
}

/* Loading spinner while Grok loads on first open */
.grok-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: #1e1e1e;
    color: #888;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
}

.grok-loading::after {
    content: '';
    width: 24px;
    height: 24px;
    margin-left: 10px;
    border: 2px solid #333;
    border-top-color: #888;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

iframe {
    width: 100%;
    height: 100%;
    border: none;
    background-color: #000;
}
`;

function createPopup() {
    const existingHost = document.getElementById('grok-pop-host');
    if (existingHost) {
        existingHost.remove();
    }

    host = document.createElement('div');
    host.id = 'grok-pop-host';
    host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;';

    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = INLINE_STYLES;
    shadow.appendChild(style);

    container = document.createElement('div');
    container.className = 'grok-container';
    container.style.display = 'flex';

    // Create placeholder - NO IFRAME YET (saves ~130MB per tab!)
    const loadingPlaceholder = document.createElement('div');
    loadingPlaceholder.className = 'grok-loading';
    loadingPlaceholder.id = 'grok-loading-placeholder';
    loadingPlaceholder.textContent = 'Loading Grok';
    container.appendChild(loadingPlaceholder);

    shadow.appendChild(container);

    if (!document.body) {
        console.warn('Grok Pop: document.body not available');
        return;
    }

    document.body.appendChild(host);

    if (!listenersAttached) {
        listenersAttached = true;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isPopupVisible) {
                togglePopup(false);
            }
        });

        document.addEventListener('mousedown', (e) => {
            if (!isPopupVisible) return;
            if (host && !host.contains(e.target) && e.target !== host) {
                togglePopup(false);
            }
        });
    }
}

function loadIframe() {
    if (iframeLoaded) return;
    iframeLoaded = true;

    iframe = document.createElement('iframe');
    iframe.src = 'https://grok.com';
    iframe.allow = "clipboard-read; clipboard-write";

    // When iframe loads, remove the loading placeholder
    iframe.onload = () => {
        const placeholder = shadow.getElementById('grok-loading-placeholder');
        if (placeholder) placeholder.remove();
    };

    // Replace placeholder with iframe
    const placeholder = shadow.getElementById('grok-loading-placeholder');
    if (placeholder) {
        placeholder.parentNode.insertBefore(iframe, placeholder);
        // Keep placeholder visible until iframe loads
    } else {
        container.appendChild(iframe);
    }
}

function togglePopup(forceState) {
    if (!host || !document.contains(host)) {
        createPopup();
    }

    const shouldShow = forceState !== undefined ? forceState : !isPopupVisible;

    if (shouldShow) {
        isPopupVisible = true;
        container.classList.add('visible');

        // LAZY LOAD: Only load iframe on first open
        if (!iframeLoaded) {
            loadIframe();
        }

        if (iframe) iframe.focus();
    } else {
        isPopupVisible = false;
        container.classList.remove('visible');
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle_popup") {
        togglePopup();
    }
});

// Pre-create just the DOM shell (lightweight, ~0MB overhead)
// Iframe loads only on first popup trigger (saves ~130MB per tab!)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPopup);
} else {
    createPopup();
}
