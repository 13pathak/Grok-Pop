let host = null;
let shadow = null;
let container = null;
let iframe = null;
let listenersAttached = false;

function createPopup() {
    // Check for existing host (auto-cleanup for reloads/duplicates)
    const existingHost = document.getElementById('grok-pop-host');
    if (existingHost) {
        existingHost.remove();
    }

    host = document.createElement('div');
    host.id = 'grok-pop-host';
    // Ensure host doesn't affect page layout
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '0';
    host.style.height = '0';
    host.style.zIndex = '2147483647'; // Max z-index

    shadow = host.attachShadow({ mode: 'open' });

    // Add styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles.css');
    shadow.appendChild(link);

    container = document.createElement('div');
    container.className = 'grok-container';
    // Explicitly set initial state to hidden to avoid CSS loading race condition
    container.style.display = 'none';
    container.style.opacity = '0';

    // Header bar for navigation controls
    const header = document.createElement('div');
    header.className = 'grok-header';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    // Use try-catch for cross-origin protection
    backBtn.onclick = () => {
        try { iframe.contentWindow.history.back(); } catch (e) { console.warn("Cannot go back", e); }
    };

    const homeBtn = document.createElement('button');
    homeBtn.textContent = '🏠 Home';
    homeBtn.onclick = () => { iframe.src = 'https://grok.com'; };

    header.appendChild(backBtn);
    header.appendChild(homeBtn);
    container.appendChild(header);

    iframe = document.createElement('iframe');
    iframe.src = 'https://grok.com';
    iframe.allow = "clipboard-read; clipboard-write"; // Allow clipboard interaction

    container.appendChild(iframe);
    shadow.appendChild(container);

    // Guard against missing document.body (e.g., on about:blank or during early load)
    if (!document.body) {
        console.warn('Grok Pop: document.body not available');
        return;
    }

    document.body.appendChild(host);

    // Attach global listeners only once to prevent accumulation
    if (!listenersAttached) {
        listenersAttached = true;

        // Close on Escape - check container visibility, not host
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && container && container.style.display !== 'none' && container.style.opacity !== '0') {
                togglePopup(false);
            }
        });

        // Close when clicking outside - properly detect clicks inside shadow DOM
        document.addEventListener('mousedown', (e) => {
            if (!container || container.style.display === 'none' || container.style.opacity === '0') {
                return; // Popup not visible, do nothing
            }
            // Check if click is inside the host element (which contains the shadow DOM)
            if (host && !host.contains(e.target) && e.target !== host) {
                togglePopup(false);
            }
        });
    }
}

function togglePopup(forceState) {
    if (!host || !document.contains(host)) {
        createPopup();
    }

    const isHidden = container.style.display === 'none' || container.style.opacity === '0';
    const shouldShow = forceState !== undefined ? forceState : isHidden;

    if (shouldShow) {
        container.style.display = 'flex';
        // Small timeout to allow display change before opacity transition
        setTimeout(() => {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 10);
        iframe.focus();
    } else {
        container.style.opacity = '0';
        container.style.transform = 'translateY(10px)';
        setTimeout(() => {
            if (container.style.opacity === '0') {
                container.style.display = 'none';
            }
        }, 300); // Match transition duration
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle_popup") {
        togglePopup();
    }
});
