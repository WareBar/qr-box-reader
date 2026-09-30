import { useState, type ReactNode } from "react";

type ShellProps = {
  title: string;
  isError?: boolean;
  onClose: () => void;
  children: ReactNode;
};


export function CardShell({ title, isError, onClose, children }: ShellProps) {
  return (
    <div className="fixed right-4 top-4 z-[2147483647] w-[340px] overflow-hidden rounded-xl bg-white font-sans text-sm text-neutral-900 shadow-2xl">
      <div
        className={`flex items-center justify-between px-3.5 py-3 font-semibold text-white ${
          isError ? "bg-red-600" : "bg-emerald-600"
        }`}
      >
        <span>{title}</span>
        <button onClick={onClose} className="text-2xl leading-none" aria-label="Close">
          &times;
        </button>
      </div>
      <div className="p-3.5">{children}</div>
    </div>
  );
}
