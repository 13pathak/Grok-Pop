// Helper function to send message with fallback to inject content script
async function sendToggleMessage(tabId) {
    try {
        await chrome.tabs.sendMessage(tabId, { action: "toggle_popup" });
    } catch (error) {
        // Content script not loaded - try to inject it first
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            });
            // CSS is now inlined in content.js, no need to inject separately
            // Now send the message
            await chrome.tabs.sendMessage(tabId, { action: "toggle_popup" });
        } catch (injectError) {
            // Can't inject on this page (chrome://, about:, etc.)
            console.warn('Grok Pop: Cannot run on this page', injectError.message);
        }
    }
}

chrome.action.onClicked.addListener((tab) => {
    sendToggleMessage(tab.id);
});

chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle_popup") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                sendToggleMessage(tabs[0].id);
            }
        });
    }
});

// Cookie Patching to allow Iframe Session
function patchCookies() {
    chrome.cookies.getAll({ domain: "grok.com" }, (cookies) => {
        cookies.forEach((cookie) => {
            forceSameSiteUnrestricted(cookie);
        });
    });
    chrome.cookies.getAll({ domain: "x.ai" }, (cookies) => {
        cookies.forEach((cookie) => {
            forceSameSiteUnrestricted(cookie);
        });
    });
}

function forceSameSiteUnrestricted(cookie) {
    if (cookie.sameSite !== 'no_restriction' && cookie.secure) {
        const newCookie = {
            url: "https://" + cookie.domain.replace(/^\./, '') + cookie.path,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: true,
            httpOnly: cookie.httpOnly,
            expirationDate: cookie.expirationDate,
            storeId: cookie.storeId,
            sameSite: 'no_restriction'
        };
        chrome.cookies.set(newCookie, (setCookie) => {
            if (chrome.runtime.lastError) {
                // Log error for debugging, but don't throw (session may have ended)
                console.warn('Grok Pop: Could not set cookie', cookie.name, chrome.runtime.lastError.message);
            }
        });
    }
}

// Listen for cookie changes
chrome.cookies.onChanged.addListener((changeInfo) => {
    const { cookie, removed } = changeInfo;
    if (removed) return;
    if (cookie.domain.includes('grok.com') || cookie.domain.includes('x.ai')) {
        forceSameSiteUnrestricted(cookie);
    }
});

// Run patch on startup/install
chrome.runtime.onInstalled.addListener(patchCookies);
chrome.runtime.onStartup.addListener(patchCookies);
// Run once immediately in case of reload
patchCookies();
