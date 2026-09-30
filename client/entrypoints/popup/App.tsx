import { useState } from "react";



const ICONS = {
  qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  scan: "M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4",
  alert:
    "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
} as const;

function Icon({ name, className = "h-4 w-4" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

const STEPS = [
  "Open the image that has the QR code",
  "Click the button below",
  "Drag a box around the QR code",
];

export default function App() {
  const [error, setError] = useState("");
  const [selecting, setSelecting] = useState<boolean>(false);


  async function startScan() {
    setError("");
    setSelecting(true);
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      await browser.scripting.executeScript({
        target: { tabId: tab?.id! },
        files: ["/scanner.js"],
      });
      window.close(); // close the popup so the page is clickable
    } catch {
      setError("Can't scan this page. Chrome blocks extensions on some pages.");
      setSelecting(false)
    }
  }

  return (
    <div className="w-60 p-4 font-sans">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon name="qr" className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold leading-tight">QR Box Reader</h1>
          <p className="text-xs text-neutral-500">Read a QR code right from your screen</p>
        </div>
      </div>


      {/* How it works */}
      <ol className="mb-4 space-y-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-2.5 text-[13px] text-neutral-700">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-600">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>


      {/* Main action */}
      <button
        onClick={startScan}
        disabled={selecting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
      >
        <Icon name="scan" className="h-[18px] w-[18px]" />
        {selecting ? "Starting…" : "Select QR code"}
      </button>

      {/* Error */}
      {error && (
        <div role="alert" className="mt-3 flex gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-800">
          <Icon name="alert" className="mt-px h-3.5 w-3.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}


      
    <div className="mt-4 space-y-1.5 border-t border-neutral-100 pt-3 text-center">
      <p className="text-xs text-neutral-500">
        Developed by{" "}
        <a
          href="https://github.com/WareBar"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          WareBar
        </a>
      </p>
      <p className="text-[11px] text-neutral-400">Press Esc to cancel while selecting.</p>
    </div>

    </div>
  );
}