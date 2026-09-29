const DECODE_URL = "http://localhost:5000/decode";

// Entry points

// Clicking the toolbar icon injects the selection overlay into the page
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });
});

// The content script sends the box coordinates once the user finishes dragging
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "scan") return;

  scanRegion(sender.tab, message.rect, message.dpr)
    .then(sendResponse)
    .catch((error) => sendResponse({ error: String(error) }));

  return true; // keep the message channel open for the async reply
});

//Pipeline: screenshot -> crop -> decode 

async function scanRegion(tab, rect, dpr) {
  const screenshot = await captureTab(tab);
  const cropped = await cropImage(screenshot, rect, dpr);
  return sendToServer(cropped);
}

async function captureTab(tab) {
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  const blob = await (await fetch(dataUrl)).blob();
  return createImageBitmap(blob);
}

// Mouse coordinates are in CSS pixels, the screenshot is in real pixels,
// so everything is multiplied by devicePixelRatio (dpr).
async function cropImage(bitmap, rect, dpr) {
  const x = Math.round(rect.x * dpr);
  const y = Math.round(rect.y * dpr);
  const width = Math.round(rect.w * dpr);
  const height = Math.round(rect.h * dpr);

  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext("2d").drawImage(bitmap, x, y, width, height, 0, 0, width, height);
  return canvas.convertToBlob({ type: "image/png" });
}

async function sendToServer(imageBlob) {
  const formData = new FormData();
  formData.append("image", imageBlob, "qr.png");

  const response = await fetch(DECODE_URL, { method: "POST", body: formData });
  return response.json();
}