// Options script for X to n8n extension

const urlInput = document.getElementById('webhookUrl');
const pathInput = document.getElementById('webhookPath'); // Get the new path input
const saveButton = document.getElementById('saveButton');
const statusDiv = document.getElementById('status');

// Function to save options to chrome.storage.sync
function saveOptions() {
  const webhookUrl = urlInput.value.trim();
  const webhookPath = pathInput.value.trim(); // Get the path value

  // Basic validation for URL
  if (webhookUrl && !webhookUrl.toLowerCase().startsWith('http')) {
      statusDiv.textContent = 'Error: Please enter a valid HTTP/HTTPS URL.';
      statusDiv.style.color = 'red';
      return;
  }

  // Clean up path: remove leading/trailing slashes
  const cleanedPath = webhookPath.replace(/^\/+|\/+$/g, '');

  chrome.storage.sync.set({
    n8nWebhookUrl: webhookUrl,
    n8nWebhookPath: cleanedPath // Save the cleaned path
  }, () => {
    // Update status to let user know options were saved.
    statusDiv.textContent = 'Options saved.';
    statusDiv.style.color = 'green';
    setTimeout(() => {
      statusDiv.textContent = '';
    }, 1500); // Clear status after 1.5 seconds
  });
}

// Function to restore options from chrome.storage.sync
function restoreOptions() {
  // Use default values if not set
  chrome.storage.sync.get({
    n8nWebhookUrl: '',
    n8nWebhookPath: '' // Add default for path
  }, (items) => {
    urlInput.value = items.n8nWebhookUrl;
    pathInput.value = items.n8nWebhookPath; // Restore the path
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', restoreOptions);
saveButton.addEventListener('click', saveOptions);
