/**
 * Typography: the same families as the brand's PDF documents, loaded from the system (Windows).
 * Font files are not committed, because they are under the Microsoft license.
 * The fallbacks keep the layout close on macOS and Linux.
 */
export const fonts = {
  /** Titles, big numbers, technical labels. */
  display: "Bahnschrift, 'DIN Alternate', 'Segoe UI', sans-serif",
  /** Running text, captions. */
  body: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  /** Terminal, code, the SYS//A announcer. */
  mono: "Consolas, 'Cascadia Mono', 'Courier New', monospace",
} as const;

/** Size scale for a 1920×1080 frame. */
export const sizes = {
  title: 96,
  subtitle: 56,
  body: 40,
  label: 28,
  small: 22,
  /** Headline numbers on stat cards ("552B", "$38"). */
  number: 120,
} as const;

export const weights = {
  light: 300,
  regular: 400,
  semibold: 600,
  bold: 700,
} as const;
