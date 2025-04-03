// Background service worker for the X to n8n extension
console.log("Background script loaded. Version 0.1.7");

// Function to send data to n8n (extracted for clarity)
function sendDataToN8n(data, tabId) {
  console.log("Attempting to send data:", data);

  // Retrieve the webhook URL and Path from storage
  chrome.storage.sync.get(['n8nWebhookUrl', 'n8nWebhookPath'], (result) => {
    const baseUrl = result.n8nWebhookUrl;
    const path = result.n8nWebhookPath || ''; // Default to empty string if not set

    if (!baseUrl) {
      console.error("n8n Webhook Base URL not configured in options.");
      // TODO: Provide user feedback
      return;
    }

    // Construct the final URL, ensuring no double slashes
    let finalUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl; // Remove trailing slash from base
    if (path) {
        finalUrl += '/' + path; // Add path if it exists
    }


    console.log("Sending data to final URL:", finalUrl);

    // Send the data using fetch
    fetch(finalUrl, { // Use the constructed final URL
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
        });
      }
      return response.json().catch(() => ({ message: "Request successful, but no JSON response." }));
    })
    .then(responseData => {
      console.log('Success response from n8n:', responseData);
      // TODO: Provide user feedback (e.g., update icon/badge to show success)
    })
    .catch((error) => {
      console.error('Error sending data to n8n:', error);
      // TODO: Provide user feedback (e.g., update icon/badge to show error)
    });
  });
}


// Listener for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked on tab:", tab.id, "URL:", tab.url);

  // Check if the tab URL is a valid X/Twitter post URL
  const postUrlPattern = /^https:\/\/(x|twitter)\.com\/[a-zA-Z0-9_]+\/status\/[0-9]+/;
  if (!tab.url || !postUrlPattern.test(tab.url)) {
     console.log('Not on a valid X/Twitter post page.');
     // Optionally, provide feedback to the user, though it's harder without a popup.
     // We could briefly change the icon or title, but let's keep it simple for now.
     return;
  }

  console.log("Valid post page detected. Sending message to content script...");

  // Send message to content script to get data
  chrome.tabs.sendMessage(tab.id, { action: "getPostData" }, (response) => {
    // This callback will receive the response from the content script's extractPostData
    if (chrome.runtime.lastError) {
      // Handle errors like the content script not being ready or injected
      console.error(`Error sending message to content script: ${chrome.runtime.lastError.message}`);
      // TODO: Provide user feedback (e.g., change icon temporarily)
      return;
    }

    if (response && response.status === "success") {
      console.log("Data received from content script:", response.data);
      // Directly call the function to send data to n8n
      sendDataToN8n(response.data, tab.id);

    } else {
      console.error(`Error getting data from content script: ${response ? response.message : 'No response'}`);
      // TODO: Provide user feedback
    }
  });
});


// Note: The chrome.runtime.onMessage listener is no longer strictly needed for the
// primary workflow initiated by the icon click, as the logic is now handled directly
// within the chrome.action.onClicked callback.
// It's kept here in case other message types are added later.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in background runtime.onMessage:", request);

  // Example: If we needed to handle other actions sent via messages
  // if (request.action === "someOtherAction") {
  //   // Do something else
  //   sendResponse({ status: "done" });
  // }

  // Return false or undefined for synchronous messages, or true if sendResponse will be called asynchronously later.
  // Since we removed the main async action from here, returning false is appropriate if no other async actions exist.
  return false;
});
