# X to n8n Chrome Extension - Initial Setup

This document outlines the initial setup steps performed for the "X to n8n" Chrome extension project.

## Project Goal

The goal of this extension is to extract data from a post on X (formerly Twitter) and send it to a specified n8n workflow via a webhook.

## Initial Structure Created

The following directory structure and core files have been created:

```
.
├── docs/
│   └── README.md  (This file)
├── icons/         (Directory for extension icons - currently empty, references removed from manifest)
├── scripts/       (Directory for JavaScript files)
│   ├── background.js (Background service worker)
│   ├── content.js    (Content script for X/Twitter pages)
│   ├── options.js    (JavaScript for the options page)
│   ├── options.js    (JavaScript for the options page)
│   └── popup.js      (JavaScript for the popup - **No longer used for main action**)
├── manifest.json  (The core extension manifest file, version 0.1.8)
├── options.html   (The HTML file for the extension's options page)
└── popup.html     (The HTML file for the extension's popup - **No longer used for main action**)
```

### File Descriptions

*   **`manifest.json`**: Defines the extension's properties, permissions, background script, content script, and popup action. **Note:** References to specific icon files have been temporarily removed to allow loading the extension without the actual icon files present.
*   **`scripts/background.js`**: Handles background tasks, including listening for messages and (eventually) sending data to the n8n webhook. Currently contains placeholder logic.
*   **`scripts/content.js`**: Injected into X/Twitter pages to (eventually) extract post data when requested. Currently contains placeholder logic.
*   **`popup.html`**: Provides the user interface (a button) displayed when the extension icon is clicked.
*   **`scripts/popup.js`**: **(No longer used)** Previously handled popup logic.
*   **`options.html` / `scripts/options.js`**: Provides an options page where the user can input and save the n8n webhook **Base URL** and an **Optional Path**. These are stored using `chrome.storage.sync`.

## Current Functionality (v0.1.8)

*   **Options Page:** An options page is available for configuring the n8n webhook **Base URL** and an **Optional Path** (accessible via right-click on icon -> Options, or `chrome://extensions` -> Details -> Extension options).
*   **Webhook URL Storage:** The Base URL (`n8nWebhookUrl`) and Optional Path (`n8nWebhookPath`) are saved using `chrome.storage.sync`.
*   **Immediate Action on Icon Click:** Clicking the extension icon triggers the background script (`scripts/background.js`).
*   **Post URL Validation:** The background script checks if the current tab is a valid X/Twitter post page when the icon is clicked. If not, it silently stops.
*   **Data Extraction (including Video Blobs):** If the URL is valid, the background script messages the content script (`scripts/content.js`) to asynchronously extract:
    *   Post text content.
    *   Image URLs.
    *   **Video Data (Base64):** Fetches video data from `blob:` URLs and converts it to Base64 Data URLs. **Warning:** This can result in very large data payloads.
    *   The post's URL.
    *   A timestamp.
*   **Sending Data to n8n:** Upon receiving the data from the content script, the background script retrieves the saved Base URL and Optional Path. It constructs the final webhook URL by combining the base and path (handling slashes appropriately) and sends the extracted data to this final URL via a POST request.
*   **Status Updates:** Feedback is primarily through logs in the background script's console (Service Worker console).
*   **Console Logging (for Testing):** Logs remain in the content script (for extraction details) and background script (for action triggers, message handling, and fetch status/errors).
*   **Asynchronous Handling:** All relevant parts handle asynchronous operations correctly.
*   **Basic Error Handling:** Includes checks for valid URL, content script communication, missing webhook URL, and network errors.

## How to Load the Extension in Chrome (for Testing)

Follow these steps to load the unpacked extension into Google Chrome:

1.  **Open Google Chrome.**
2.  **Navigate to the Extensions page:** Type `chrome://extensions` into the address bar and press Enter.
3.  **Enable Developer Mode:** Find the "Developer mode" toggle switch (usually in the top-right corner) and ensure it is turned **on**.
4.  **Load the Extension:**
    *   Click the "**Load unpacked**" button that appears.
    *   In the file browser window that opens, navigate to the root directory of this project (`/Users/michel/LAVORI/ziobuddalabs/chrome1`).
    *   Select the directory (do not go inside it, just select the `chrome1` folder itself).
    *   Click "Select" or "Open".

The "X to n8n" extension should now appear on your `chrome://extensions` page. You will also see its icon (a default puzzle piece since specific icons are not defined in the manifest) in your Chrome toolbar.

**Note:** Remember to configure the n8n webhook URL in the extension's options page after loading/reloading it. Further development could include adding icons. Reload the extension via `chrome://extensions` after any code changes.
