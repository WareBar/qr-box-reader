import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "~/components/Icons";

const SERVER_URL = import.meta.env.WXT_SERVER_URL;
const PROBE_URL = `${SERVER_URL.replace(/\/+$/, "")}/decode`;
const REPO_URL = "https://github.com/WareBar/qr-box-reader";

type Status = "checking" | "ok" | "wrong-server" | "down" | "blocked";

const STEPS = [
  {
    title: "Find the QR code",
    body: "It can be sitting in a chat message, an email, a PDF, or on a web page.",
  },
  {
    title: "Click the QR Box Reader icon",
    body: "It lives in your browser's toolbar, next to the address bar. If you can't spot it, click the little puzzle-piece icon and add QR Box Reader to the list.",
  },
  {
    title: "Drag a box around the code",
    body: "Drag from one corner of the code to the opposite corner. You don't have to be precise — just keep it around the code itself.",
  },
];

// GET /decode is only registered for POST, so a 405 means "this exact Flask app
// is listening". Anything else that answers means it is some other server.
async function probe(): Promise<Exclude<Status, "checking" | "blocked">> {
  try {
    const response = await fetch(PROBE_URL, { cache: "no-store" });
    return response.status === 405 ? "ok" : "wrong-server";
  } catch {
    return "down";
  }
}

// The short label is what most people will ever see, so it avoids the word
// "server" entirely. The long one only shows up inside the help section.
const STATUS: Record<Status, { short: string; detail: string; dot: string; chip: string }> = {
  checking: {
    short: "Checking…",
    detail: "Checking whether QR Box Reader is ready to go…",
    dot: "bg-neutral-400",
    chip: "bg-neutral-100 text-neutral-600",
  },
  ok: {
    short: "Ready to scan",
    detail: "Everything is set up and ready. Just click the icon and drag a box around a code.",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-800",
  },
  "wrong-server": {
    short: "Set-up needed",
    detail:
      "Something is answering at the address QR Box Reader expects, but it isn't the right program. The set-up steps below will sort it out.",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-900",
  },
  down: {
    short: "Set-up needed",
    detail:
      "QR Box Reader can't reach the small helper program it needs. If someone set this up for you, ask them to start it — the steps are below.",
    dot: "bg-red-500",
    chip: "bg-red-50 text-red-800",
  },
  blocked: {
    short: "Set-up needed",
    detail:
      "This page can't check on the helper program directly. If you opened this page from somewhere other than the extension, try again from the extension itself.",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-900",
  },
};

export default function App() {
  const [status, setStatus] = useState<Status>("checking");
  const helpRef = useRef<HTMLDetailsElement>(null);

  const check = useCallback(async () => {
    setStatus("checking");
    const result = await probe();
    if (result === "down" && location.protocol === "https:") setStatus("blocked");
    else setStatus(result);
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  // A plain "#help" link would only scroll to the collapsed section, so open it.
  const openHelp = useCallback(() => {
    const help = helpRef.current;
    if (!help) return;
    help.open = true;
    help.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const ready = status === "ok";
  const style = STATUS[status];

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 antialiased">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <header className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icon name="qr" className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Welcome to QR Box Reader</h1>
            <p className="mt-0.5 text-neutral-500">Read a QR code without reaching for your phone.</p>
          </div>
        </header>

        <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-[17px] leading-relaxed text-neutral-700">
            QR codes are usually scanned with a phone camera, which is awkward when the code is
            on the same screen you're looking at. QR Box Reader fixes that: it reads the code
            straight off your screen and shows you the web address it points to.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${style.chip}`}
            >
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              {style.short}
            </span>
            {!ready && status !== "checking" && (
              <button
                onClick={openHelp}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                What's this? →
              </button>
            )}
          </div>
        </div>

        <section className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold">How to use it</h2>
          <ol className="space-y-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[13px] font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 rounded-lg bg-blue-50 p-4 text-[15px] leading-relaxed text-blue-900">
            That's it. You'll see the web address the code points to, along with the name of the
            site. Copy it, or open it when you're ready — nothing is ever opened automatically.
          </p>
        </section>

        <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-900">
            <Icon name="lock" className="h-5 w-5 text-amber-600" />
            A quick word on safety
          </h2>
          <p className="text-[15px] leading-relaxed text-amber-900">
            Scammers can hide a fake website inside a QR code, so it's worth being a bit careful
            with codes you didn't expect. Check the address before you open one, especially if it
            arrived from someone you don't know.
          </p>
          <p className="mt-2.5 text-[15px] leading-relaxed text-amber-900">
            QR Box Reader is built to help with that. It shows you the site name on its own,
            separate from the full link, so a lookalike address is easy to spot. It also warns you
            about the usual tricks — unencrypted links, addresses that mimic real sites, and
            shortened links that hide where they really go.
          </p>
          <p className="mt-2.5 text-[15px] leading-relaxed text-amber-900">
            And everything happens on your own computer. No image is ever uploaded anywhere.
          </p>
        </section>

        <details ref={helpRef} className="group mb-8 rounded-xl border border-neutral-200 bg-white">
          <summary className="cursor-pointer list-none px-6 py-4 text-[15px] font-medium marker:content-none">
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Icon name="help" className="h-4 w-4 text-neutral-400" />
                Not working? Set-up and troubleshooting
              </span>
              <Icon
                name="refresh"
                className="h-4 w-4 shrink-0 text-neutral-400 transition group-open:rotate-90"
              />
            </span>
          </summary>

          <div className="border-t border-neutral-100 px-6 py-5">
            <p className="mb-4 flex items-start gap-2.5 text-[15px] leading-relaxed text-neutral-600">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
              {style.detail}
            </p>

            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-[15px] leading-relaxed text-neutral-700">
                QR Box Reader does all its decoding on your own computer, using a small helper
                program written in Python. If you installed this yourself, that helper needs to be
                running before you can scan anything. Open a terminal and run:
              </p>
              <ol className="mt-3 space-y-2 font-mono text-[13px]">
                <li className="rounded bg-white px-2.5 py-1.5 text-neutral-800">cd server</li>
                <li className="rounded bg-white px-2.5 py-1.5 text-neutral-800">
                  python -m venv venv
                </li>
                <li className="rounded bg-white px-2.5 py-1.5 text-neutral-800">
                  venv\Scripts\activate <span className="text-neutral-400"># Windows</span>
                </li>
                <li className="rounded bg-white px-2.5 py-1.5 text-neutral-800">
                  source venv/bin/activate{" "}
                  <span className="text-neutral-400"># macOS / Linux, instead of the line above</span>
                </li>
                <li className="rounded bg-white px-2.5 py-1.5 text-neutral-800">
                  pip install -r requirements.txt
                </li>
                <li className="rounded bg-white px-2.5 py-1.5 text-neutral-800">python app.py</li>
              </ol>
              <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">
                Leave <span className="font-mono">python app.py</span> running in its own window
                while you scan. It should print{" "}
                <span className="font-mono">Running on http://localhost:5000</span>.
              </p>
            </div>

            <p className="mt-4 flex items-center gap-2 text-[13px] text-neutral-500">
              <span className="font-mono">{PROBE_URL}</span>
              <button
                onClick={() => void check()}
                className="ml-auto flex shrink-0 items-center gap-1.5 font-medium text-blue-600 hover:text-blue-700"
              >
                <Icon name="refresh" className="h-3.5 w-3.5" />
                Check again
              </button>
            </p>

            <p className="mt-4 text-[13px] leading-relaxed text-neutral-500">
              If you run the helper on a different address, update{" "}
              <span className="font-mono">WXT_SERVER_URL</span> in{" "}
              <span className="font-mono">client/.env</span> to match, then rebuild the extension.
            </p>
          </div>
        </details>

        <footer className="border-t border-neutral-200 pt-6 text-center">
          <p className="text-sm text-neutral-500">
            Built by{" "}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
            >
              WareBar
              <Icon name="external" className="h-3 w-3" />
            </a>
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            You can find this page again from the extension's popup at any time.
          </p>
        </footer>
      </div>
    </div>
  );
}
