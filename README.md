# Grok Pop - Chrome Extension

**Grok Pop** is a Chrome extension that provides a floating, persistent mini-interface for [Grok.com](https://grok.com), enabling you to chat with Grok from any tab without context switching.

![Grok Pop Icon](icon.png)

## 🚀 Features

*   **Floating UI**: A sleek, dark-mode popup that slides in from the side, similar to the Perplexity extension.
*   **Persistent Login**: Automatically syncs your session from `grok.com`. If you are logged in there, you are logged in everywhere.
*   **Smart Navigation**: Includes custom "Back" and "Home" buttons within the popup header for easy navigation.
*   **Seamless Embedding**: Bypasses `X-Frame-Options` and strict CSP headers to allow Grok to load on any website.
*   **Keyboard Shortcut**: Toggle the popup instantly with `Ctrl+Shift+Y` (Windows/Linux) or `Cmd+Shift+Y` (Mac).

## 📥 Installation

1.  Clone or download this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top-right corner.
4.  Click **Load unpacked**.
5.  Select the **Grok Pop** folder.

## 🛠 Usage

1.  **Open the Popup**: Click the extension icon in your browser toolbar or press `Ctrl+Shift+Y`.
2.  **Login**: If you aren't logged in, simply open [grok.com](https://grok.com) in a new tab and sign in. The extension will automatically pick up your session.
3.  **Close**: Click anywhere outside the popup or press `Escape`.

## 🔒 Privacy & Permissions

This extension uses the following permissions to function:
*   `declarativeNetRequest`: To modify response headers (removing frame blocks) so Grok can be embedded.
*   `cookies`: To sync your existing `grok.com` session cookies with the popup's iframe.
*   `activeTab` / `scripting`: To inject the floating UI into your current page.

## 📝 License

[MIT](LICENSE)
