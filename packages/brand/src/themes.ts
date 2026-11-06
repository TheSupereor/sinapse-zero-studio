import {useScene} from '@canvas-commons/core';
import {palette} from './tokens';

/**
 * Color roles used by every component. Never hard-code a hex value in a scene:
 * ask the theme (`useTheme().accent`), so the same episode renders in both themes.
 */
export interface Theme {
  name: ThemeName;
  /** Screen background. */
  background: string;
  /** Background grid lines. */
  grid: string;
  /** Fill of cards, boxes and terminals. */
  panel: string;
  /** Thin borders and dividers. */
  rule: string;
  /** Main text and schematic strokes. */
  ink: string;
  /** Secondary text and labels. */
  muted: string;
  /** Inactive, "out of focus" elements. */
  faint: string;
  /** Orange: what matters right now. */
  accent: string;
  /** Second accent (comparisons, the "other" series). */
  cyan: string;
  /** Warnings. */
  amber: string;
  /** Danger, errors, "you burnt the LED". */
  red: string;
  /** Which logo variant suits this background. */
  logo: 'light' | 'dark';
}

export type ThemeName = 'blueprint' | 'lab';

/** Dark, drafting-table look. The default. */
export const blueprint: Theme = {
  name: 'blueprint',
  background: palette.dark.paper,
  grid: palette.dark.sheetGrid,
  panel: palette.dark.panel,
  rule: palette.dark.rule,
  ink: palette.dark.ink,
  muted: palette.dark.muted,
  faint: palette.dark.faint,
  accent: palette.orange,
  cyan: palette.dark.cyan,
  amber: palette.dark.amber,
  red: palette.dark.red,
  logo: 'dark',
};

/** Light, white test-chamber panels. */
export const lab: Theme = {
  name: 'lab',
  background: palette.light.sheet,
  grid: palette.light.sheetGrid,
  panel: palette.light.paper,
  rule: palette.light.rule,
  ink: palette.graphite,
  muted: palette.light.muted,
  faint: palette.light.faint,
  accent: palette.orange,
  cyan: palette.light.cyan,
  amber: palette.light.amber,
  red: palette.light.red,
  logo: 'light',
};

export const themes: Record<ThemeName, Theme> = {blueprint, lab};

/**
 * Theme of the current scene. Reads the project variable `theme`
 * (`makeProject({variables: {theme: 'lab'}})`); defaults to blueprint.
 *
 * Only works inside a scene (in its generator, or while building nodes there).
 */
export function useTheme(): Theme {
  const name = useScene().variables.get<ThemeName>('theme', 'blueprint')();
  return themes[name] ?? blueprint;
}
