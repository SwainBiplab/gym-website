/** Accent colour at runtime (client), read from the CSS variable the root layout sets from site settings. */
export function accentHex(fallback = "#E5B93C") {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}

/** Pick dark or light ink for text on the accent colour (WCAG relative luminance). */
export function inkFor(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.4 ? "#0b0c0f" : "#ffffff";
}
