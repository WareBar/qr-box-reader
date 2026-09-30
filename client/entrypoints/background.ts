import type { Rect } from "~/utils/selectRegion";

const DECODE_URL = `${import.meta.env.WXT_SERVER_URL}/decode`;

export default defineBackground(() => {
  // main() must stay synchronous, so the work happens inside the listener.
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason !== "install") return; // not on update, so it opens once
    void browser.tabs.create({ url: browser.runtime.getURL("/onboarding.html") });
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== "scan") return;

    scanRegion(sender.tab!, message.rect, message.dpr)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: String(error) }));

    return true; // keep the channel open for the async reply
  });
});

async function scanRegion(tab: { windowId: number }, rect: Rect, dpr: number) {
  const dataUrl = await browser.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());

  // Mouse coordinates are CSS pixels; the screenshot is real pixels
  const x = Math.round(rect.x * dpr);
  const y = Math.round(rect.y * dpr);
  const w = Math.round(rect.w * dpr);
  const h = Math.round(rect.h * dpr);

  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext("2d")!.drawImage(bitmap, x, y, w, h, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type: "image/png" });

  const formData = new FormData();
  formData.append("image", blob, "qr.png");
  // send or hit the api endpoint for scanning
  const response = await fetch(DECODE_URL, { method: "POST", body: formData });
  return response.json();
}
