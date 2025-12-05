chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_popup" });
});

chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle_popup") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "toggle_popup" });
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
                // suppress error, sometimes cookie cannot be set if session ended
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
