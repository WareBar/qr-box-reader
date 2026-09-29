(() => {
  const OVERLAY_ID = "qrbox-overlay";
  const PANEL_ID = "qrbox-panel";
  const MIN_BOX_SIZE = 10;       // ignore accidental tiny drags
  const REPAINT_DELAY_MS = 120;  // let the page repaint before the screenshot

  if (document.getElementById(OVERLAY_ID)) return; // already active

  startSelection();

  // 1. Draw a box

  function startSelection() {
    const overlay = createOverlay();
    const box = overlay.firstChild;
    let startX = 0;
    let startY = 0;
    let dragging = false;

    const getRect = (e) => ({
      x: Math.min(startX, e.clientX),
      y: Math.min(startY, e.clientY),
      w: Math.abs(e.clientX - startX),
      h: Math.abs(e.clientY - startY),
    });

    const drawBox = (e) => {
      const r = getRect(e);
      Object.assign(box.style, {
        left: `${r.x}px`,
        top: `${r.y}px`,
        width: `${r.w}px`,
        height: `${r.h}px`,
      });
    };

    const cancel = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") cancel();
    };

    overlay.addEventListener("mousedown", (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      box.style.display = "block";
      drawBox(e);
    });

    overlay.addEventListener("mousemove", (e) => {
      if (dragging) drawBox(e);
    });

    overlay.addEventListener("mouseup", async (e) => {
      dragging = false;
      const rect = getRect(e);

      cancel(); // remove the overlay so it doesn't appear in the screenshot
      if (rect.w < MIN_BOX_SIZE || rect.h < MIN_BOX_SIZE) return;

      await wait(REPAINT_DELAY_MS);
      const result = await chrome.runtime.sendMessage({
        type: "scan",
        rect,
        dpr: window.devicePixelRatio,
      });
      showResult(result);
    });

    document.addEventListener("keydown", onKeyDown);
  }

  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(0,0,0,.25)";

    const box = document.createElement("div");
    box.style.cssText =
      "position:fixed;border:2px solid #00e676;background:rgba(0,230,118,.15);display:none";

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    return overlay;
  }

  //. Show the result

  function showResult(result) {
    document.getElementById(PANEL_ID)?.remove();

    if (result && result.url) {
      showLinkCard(result.url);
    } else {
      showMessageCard("No QR found", "Try a looser box, or zoom in on the image first.");
    }
  }

  function showLinkCard(text) {
    const { host, shadow } = mountCard(`
      <div class="header">
        <span>QR code found</span>
        <button class="close" title="Close">&times;</button>
      </div>
      <div class="body">
        <div class="label">Website</div>
        <div class="domain"></div>
        <div class="label">Full link</div>
        <div class="url"></div>
        <div class="actions">
          <button class="btn primary copy">Copy</button>
          <button class="btn secondary open">Open link</button>
        </div>
        <div class="warning">Check the website above before opening. Links from messages can be scams.</div>
      </div>
    `);

    const parsed = parseWebUrl(text);
    shadow.querySelector(".domain").textContent = parsed ? parsed.hostname : "Not a web link";
    shadow.querySelector(".url").textContent = text;

    const copyButton = shadow.querySelector(".copy");
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        flashLabel(copyButton, "Copied ✓");
      } catch {
        flashLabel(copyButton, "Copy failed");
      }
    });

    const openButton = shadow.querySelector(".open");
    if (parsed) {
      openButton.addEventListener("click", () =>
        window.open(parsed.href, "_blank", "noopener,noreferrer")
      );
    } else {
      openButton.disabled = true; // plain text, Wi-Fi codes, etc.
    }

    shadow.querySelector(".close").addEventListener("click", () => host.remove());
  }

  function showMessageCard(title, message) {
    const { host, shadow } = mountCard(`
      <div class="header error">
        <span></span>
        <button class="close" title="Close">&times;</button>
      </div>
      <div class="body message"></div>
    `);

    shadow.querySelector(".header span").textContent = title;
    shadow.querySelector(".message").textContent = message;
    shadow.querySelector(".close").addEventListener("click", () => host.remove());
    setTimeout(() => host.remove(), 5000);
  }

  // 3. Helpers 

  // Shadow DOM keeps Messenger's CSS from affecting the card (and vice versa)
  function mountCard(innerHtml) {
    const host = document.createElement("div");
    host.id = PANEL_ID;
    host.style.cssText = "position:fixed;top:16px;right:16px;z-index:2147483647";

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>${CARD_STYLES}</style><div class="card">${innerHtml}</div>`;

    document.body.appendChild(host);
    return { host, shadow };
  }

  function parseWebUrl(text) {
    try {
      const url = new URL(text);
      return ["http:", "https:"].includes(url.protocol) ? url : null;
    } catch {
      return null;
    }
  }

  function flashLabel(button, label, ms = 1500) {
    const original = button.textContent;
    button.textContent = label;
    setTimeout(() => (button.textContent = original), ms);
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const CARD_STYLES = `
    .card { width: 340px; background: #fff; color: #1c1e21; border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,.3); overflow: hidden;
            font: 14px/1.4 system-ui, sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center;
              padding: 12px 14px; background: #00c853; color: #fff; font-weight: 600; }
    .header.error { background: #e53935; }
    .close { background: none; border: 0; color: #fff; font-size: 22px;
             line-height: 1; cursor: pointer; }
    .body { padding: 14px; }
    .message { color: #444; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em;
             color: #65676b; margin-bottom: 4px; }
    .domain { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    .url { font: 12px/1.5 ui-monospace, Consolas, monospace; background: #f0f2f5;
           border-radius: 8px; padding: 10px; max-height: 96px; overflow: auto;
           word-break: break-all; user-select: all; }
    .actions { display: flex; gap: 8px; margin-top: 12px; }
    .btn { flex: 1; padding: 9px; border: 0; border-radius: 8px; font: inherit;
           font-weight: 600; cursor: pointer; }
    .primary { background: #0866ff; color: #fff; }
    .secondary { background: #e4e6eb; color: #1c1e21; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .warning { margin-top: 12px; padding: 8px; border-radius: 6px; font-size: 12px;
               background: #fff8e1; color: #8a6d00; }
  `;
})();