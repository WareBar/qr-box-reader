// A "website" means an http or https link. Anything else is treated as plain content.
export function isWebLink(text: string): boolean {
  try {
    const { protocol } = new URL(text.trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}