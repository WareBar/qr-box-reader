// shows a dim overlay, it lets the user drag a box, returns its coordinates


export type Rect = { x: number; y: number; w: number; h: number };

export function selectRegion(): Promise<Rect | null> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(0,0,0,.25)";
    const box = document.createElement("div");
    box.style.cssText =
      "position:fixed;border:2px solid #00e676;background:rgba(0,230,118,.15);display:none";
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    let startX = 0, startY = 0, dragging = false;

    const getRect = (e: MouseEvent): Rect => ({
      x: Math.min(startX, e.clientX),
      y: Math.min(startY, e.clientY),
      w: Math.abs(e.clientX - startX),
      h: Math.abs(e.clientY - startY),
    });

    const finish = (result: Rect | null) => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
      resolve(result);
    };

    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && finish(null);

    overlay.addEventListener("mousedown", (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      box.style.display = "block";
    });

    overlay.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const r = getRect(e);
      Object.assign(box.style, {
        left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px`,
      });
    });

    overlay.addEventListener("mouseup", (e) => {
      const r = getRect(e);
      finish(r.w < 10 || r.h < 10 ? null : r);
    });

    document.addEventListener("keydown", onKeyDown);
  });
}