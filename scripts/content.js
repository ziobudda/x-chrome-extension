// Content script for the X to n8n extension
console.log("CONTENT SCRIPT INJECTED AND RUNNING - VERSION 0.1.4"); // Updated version
console.log("Content script loaded on:", window.location.href);

// Helper function to convert Blob to Data URL using Promises
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // reader.result contains the Data URL
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
}

// Function to extract post data - now async to handle blob fetching
async function extractPostData() {
  console.log("Attempting to extract post data (including video blobs)...");

  // Find the main tweet article element on the page
  // On a specific post page, there should ideally be one main article.
  // Using data-testid="tweet" is common.
  const postElement = document.querySelector('article[data-testid="tweet"]');
  if (!postElement) {
    console.error("Content script: Could not find main post article element.");
    return null;
  }

  // Extract text content
  // Text is often within a div with data-testid="tweetText"
  const textElement = postElement.querySelector('div[data-testid="tweetText"]');
  const postText = textElement ? textElement.textContent : ''; // Get text content, handle if not found

  // Extract image URLs
  // Images are often within a div with data-testid="tweetPhoto", containing an img tag
  const imageElements = postElement.querySelectorAll('div[data-testid="tweetPhoto"] img');
  const imageUrls = [];
  imageElements.forEach(img => {
    if (img.src) {
      imageUrls.push(img.src);
    }
  });

  // Extract video URLs
  // Videos often use the <video> tag
  const videoElements = postElement.querySelectorAll('video');
  const videoDataUrls = []; // Store Base64 Data URLs here

  // Use a loop that allows async/await
  for (const video of videoElements) {
      let blobUrl = null;
      // Prefer src on video element if it's a blob
      if (video.src && video.src.startsWith('blob:')) {
          blobUrl = video.src;
      } else {
          // Otherwise check nested source elements
          const sourceElement = video.querySelector('source');
          if (sourceElement && sourceElement.src && sourceElement.src.startsWith('blob:')) {
              blobUrl = sourceElement.src;
          }
      }

      if (blobUrl) {
          try {
              console.log(`Attempting to fetch blob URL: ${blobUrl}`);
              const response = await fetch(blobUrl);
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              const videoBlob = await response.blob();
              console.log(`Fetched blob of type ${videoBlob.type}, size ${videoBlob.size}`);
              // Convert blob to Base64 Data URL
              const dataUrl = await blobToDataURL(videoBlob);
              videoDataUrls.push(dataUrl);
              console.log(`Successfully converted blob to Data URL (length: ${dataUrl.length})`);
          } catch (error) {
              console.error(`Error fetching or converting blob URL ${blobUrl}:`, error);
              // Optionally include an error marker or the original blob URL in the output
              videoDataUrls.push(`Error processing blob: ${blobUrl} - ${error.message}`);
          }
      } else {
          // If video src is not a blob, maybe store the original src?
          if (video.src) videoDataUrls.push(video.src);
          else {
              const sourceElement = video.querySelector('source');
              if (sourceElement && sourceElement.src) videoDataUrls.push(sourceElement.src);
          }
      }
  }


  const postUrl = window.location.href;

  // Basic check if we actually got something (text, images, or videos)
  if (!postText && imageUrls.length === 0 && videoDataUrls.length === 0) {
      console.error("Content script: Could not extract text, images, or videos.");
      return null; // Return null if nothing useful was extracted
  }

  const data = {
    text: postText.trim(),
    images: imageUrls,
    videos: videoDataUrls, // Now contains Base64 Data URLs or original URLs/errors
    url: postUrl,
    timestamp: new Date().toISOString()
  };

  // Note: Logging the full data object might be slow or crash the console if videos are large
  console.log("Content script extracted data:", {
      ...data,
      videos: data.videos.map(v => v.startsWith('data:') ? `Data URL (length ${v.length})` : v) // Log lengths instead of full data URLs
  });

  return data;
}

// Listen for messages from the popup or background script
// Needs to handle the async nature of extractPostData
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPostData") {
    extractPostData().then(data => {
      if (data) {
        // Check for potentially huge data before sending
        const approxSize = JSON.stringify(data).length;
        console.log(`Approximate size of data to send: ${approxSize} bytes`);
        if (approxSize > 50 * 1024 * 1024) { // Example limit: 50MB
            console.warn("Extracted data is very large, might cause issues.");
            // Optionally send truncated data or just an error
            // sendResponse({ status: "error", message: "Extracted data too large due to video content." });
            // return;
        }
        sendResponse({ status: "success", data: data });
      } else {
        sendResponse({ status: "error", message: "Could not extract post data." });
      }
    }).catch(error => {
      console.error("Error during extractPostData execution:", error);
      sendResponse({ status: "error", message: `Extraction failed: ${error.message}` });
    });

    return true; // Required to indicate asynchronous response
  }
});

// We might need to trigger extraction differently, e.g., by adding a button to the page
// or responding to the popup's request.
