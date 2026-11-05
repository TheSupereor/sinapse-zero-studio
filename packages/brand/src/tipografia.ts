/**
 * Tipografia: as mesmas famílias dos PDFs Synapticon, carregadas do sistema
 * (Windows). Não versionamos os arquivos de fonte — licença Microsoft.
 */
export const fontes = {
  /** Títulos, números grandes, rótulos técnicos. */
  display: "Bahnschrift, 'DIN Alternate', 'Segoe UI', sans-serif",
  /** Texto corrido, legendas. */
  corpo: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  /** Terminal, código, o anunciador SYS//A. */
  mono: "Consolas, 'Cascadia Mono', 'Courier New', monospace",
} as const;

/** Escala de tamanhos para quadro 1920×1080. */
export const tamanhos = {
  titulo: 96,
  subtitulo: 56,
  corpo: 40,
  rotulo: 28,
  mini: 22,
  /** Números de destaque nos cartões ("552B", "$38"). */
  numero: 120,
} as const;

export const pesos = {
  leve: 300,
  normal: 400,
  semi: 600,
  negrito: 700,
} as const;
