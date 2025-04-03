// Popup script for the X to n8n extension
console.log("Popup script loaded.");

const sendButton = document.getElementById('sendButton');
const statusDiv = document.getElementById('status');

sendButton.addEventListener('click', () => {
  statusDiv.textContent = 'Getting post data...';
  sendButton.disabled = true;

  // Get current tab to send message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      statusDiv.textContent = 'Error: No active tab found.';
      sendButton.disabled = false;
      return;
    }
    const activeTab = tabs[0];

    // Check if the tab URL is a valid X/Twitter post URL
    const postUrlPattern = /^https:\/\/(x|twitter)\.com\/[a-zA-Z0-9_]+\/status\/[0-9]+/;
    if (!activeTab.url || !postUrlPattern.test(activeTab.url)) {
       statusDiv.textContent = 'Error: Not on an X/Twitter post page.';
       sendButton.disabled = false;
       return;
    }


    // Send message to content script to get data
    chrome.tabs.sendMessage(activeTab.id, { action: "getPostData" }, (response) => {
      if (chrome.runtime.lastError) {
        // Handle errors like the content script not being ready or injected
        statusDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
        sendButton.disabled = false;
        return;
      }

      if (response && response.status === "success") {
        statusDiv.textContent = 'Data extracted. Sending to n8n...';
        // Send the extracted data to the background script
        chrome.runtime.sendMessage({ action: "sendToN8n", data: response.data }, (bgResponse) => {
           if (chrome.runtime.lastError) {
             statusDiv.textContent = `Error sending: ${chrome.runtime.lastError.message}`;
           } else if (bgResponse) {
             statusDiv.textContent = `Status: ${bgResponse.message}`;
           } else {
             statusDiv.textContent = 'No response from background script.';
           }
           sendButton.disabled = false; // Re-enable button
        });
      } else {
        statusDiv.textContent = `Error: ${response ? response.message : 'No response from content script.'}`;
        sendButton.disabled = false; // Re-enable button
      }
    });
  });
});
