import ReactDOM from "react-dom/client";

import css from "~/assets/style.css?inline";
import ResultCard from "~/components/ResultCard";
import { selectRegion } from "~/utils/selectRegion";

const REPAINT_DELAY_MS = 120; // let the page repaint before the screenshot

export default defineUnlistedScript(async () => {
  const state = window as unknown as { __qrboxBusy?: boolean };
  if (state.__qrboxBusy) return; // ignore double clicks while selecting
  state.__qrboxBusy = true;

  try {
    document.getElementById("qrbox-host")?.remove(); // clear an old card

    const rect = await selectRegion();
    if (!rect) return;

    await new Promise((resolve) => setTimeout(resolve, REPAINT_DELAY_MS));
    const result = await browser.runtime.sendMessage({
      type: "scan",
      rect,
      dpr: window.devicePixelRatio,
    });

    showCard(result?.url);
  } finally {
    state.__qrboxBusy = false;
  }
});

function showCard(url?: string) {
  const host = document.createElement("div");
  host.id = "qrbox-host";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = css;
  const mount = document.createElement("div");
  shadow.append(style, mount);
  document.body.append(host);

  const root = ReactDOM.createRoot(mount);
  const close = () => {
    root.unmount();
    host.remove();
  };
  root.render(<ResultCard url={url} onClose={close} />);
}
