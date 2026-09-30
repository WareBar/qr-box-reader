// Specific reasons to be careful with a link
export function getWarnings(url: URL): string[] {
  const warnings: string[] = [];
  const host = url.hostname.toLowerCase();

  if (url.protocol === "http:") warnings.push("Not encrypted. Don't enter passwords or personal details.");
  if (host.includes("xn--")) warnings.push("Uses look-alike characters that can imitate another site.");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) {
    warnings.push("Points to a numeric address instead of a named website.");
  }
  if (url.username || url.password) warnings.push("Contains a hidden login part before the real domain.");
  if (SHORTENERS.includes(host)) warnings.push("Shortened link, so the real destination is hidden.");
  return warnings;
}
