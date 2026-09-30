import { useState } from "react";
import { SHORTENERS } from "@/utils/shorteners";
import { parseWebUrl } from "@/utils/parseWebUrl";
import { CardShell } from "./CardShell";
import { isWebLink } from "@/utils/isWebLink";
import { getWarnings } from "@/utils/getWarnings";
import { Icon } from "./Icons";



type Props = { url?: string; onClose: () => void };


export default function ResultCard({ url, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!url) {
    return (
      <CardShell title="No QR found" isError onClose={onClose}>
        <p className="text-neutral-600">
          Try a looser box, or zoom in on the image first.
        </p>
      </CardShell>
    );
  }

  const parsed = parseWebUrl(url);


  const content = url.trim();
  const isWeb = isWebLink(content);
  const web = isWeb ? new URL(content) : null;
  const warnings = web ? getWarnings(web) : [];
  const hasWarnings = warnings.length > 0;


  async function copy() {
    await navigator.clipboard.writeText(url!);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <CardShell title="QR code found" onClose={onClose}>
      {
        web?
          <>
          <div className="">

            <div className="mb-1 text-[11px] uppercase tracking-wider text-neutral-500">
              Website
            </div>

            <div className="mb-3 text-base font-semibold">
              {parsed ? parsed.hostname : "Not a web link"}
            </div>

            <div className="mb-1 text-[11px] uppercase tracking-wider text-neutral-500">
              Full link
            </div>


            <div className="max-h-24 select-all overflow-auto break-all rounded-lg bg-neutral-100 p-2.5 font-mono text-xs leading-relaxed">
              {url}
            </div>


            <div className="mt-3 flex gap-2">
              <button
                onClick={copy}
                className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
              <button
                disabled={!parsed}
                onClick={() => window.open(parsed!.href, "_blank", "noopener,noreferrer")}
                className="flex-1 rounded-lg bg-neutral-200 py-2 font-semibold hover:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Open link
              </button>
            </div>


            {hasWarnings && (
              <ul className="mt-3 space-y-1.5 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
                {warnings.map((w) => (
                  <li key={w} className="flex gap-2">
                    <Icon name="alert" className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}

          </div>
          </>
          :
          <>
          {/* shows when the value of the qr-code is not a website and just a text or some */}
          <div className="">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-neutral-500">
              Scanned QR
            </div>


            <div className="mb-1 text-[11px] uppercase tracking-wider text-neutral-500">
              Content
            </div>

            <div className="max-h-24 select-all overflow-auto break-all rounded-lg bg-neutral-100 p-2.5 font-mono text-xs leading-relaxed">
              {url}
            </div>

          </div>
          </>
      }
    </CardShell>
  );
}
