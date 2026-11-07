/**
 * Color tokens of the Sinapse Zero identity, sampled from the channel banner.
 * Components never read these directly: they ask the theme (see `themes.ts`).
 */
export const palette = {
  /** Accent orange: the "this matters" color. */
  orange: '#EF6920',
  /** Graphite: the brand ink. */
  graphite: '#172126',

  light: {
    paper: '#FAFAFA',
    muted: '#5A656B',
    faint: '#8E979C',
    rule: '#C6CACD',
    panel: '#EEEFF0',
    cyan: '#1F8FB0',
    amber: '#D9961A',
    red: '#C8322B',
    sheet: '#F4F4F3',
    sheetGrid: '#E3E4E4',
  },

  dark: {
    paper: '#0E1113',
    ink: '#E8ECEE',
    muted: '#9AA3A9',
    faint: '#6A747A',
    rule: '#2E3539',
    panel: '#161B1E',
    cyan: '#6CC7E0',
    amber: '#F2B33D',
    red: '#F0605A',
    sheet: '#0B1418',
    sheetGrid: '#13232A',
  },
} as const;
