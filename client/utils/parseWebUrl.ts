export function parseWebUrl(text: string) {
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}