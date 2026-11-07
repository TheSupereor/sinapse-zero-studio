import canvasCommons from '@canvas-commons/vite-plugin';
import {fileURLToPath} from 'node:url';
import {defineConfig, type Plugin} from 'vite';

import {palette} from '../packages/brand/src/tokens';
import {fonts} from '../packages/brand/src/typography';

/*
 * The live demo: a static page that plays projects in the visitor's browser with
 * <canvas-commons-player>, published to GitHub Pages by .github/workflows/pages.yml.
 *
 *   pnpm build:demo   builds into studio/dist-demo/
 *   pnpm demo         builds, then serves it on http://localhost:4173
 *
 * Every project listed here is built to <path>.js next to the page
 * (showcase/blueprint.ts → showcase/blueprint.js); demo/index.html points a player at it.
 * Paths are relative to studio/, as in vite.config.ts.
 */
const projects = ['./showcase/blueprint.ts', './showcase/lab.ts', './presets/interstitial.ts'];

/** Hands the brand's colors and font stacks to the page's CSS, so they live in one place. */
function brandTokens(): Plugin {
  const vars = {
    paper: palette.dark.paper,
    panel: palette.dark.panel,
    rule: palette.dark.rule,
    ink: palette.dark.ink,
    muted: palette.dark.muted,
    faint: palette.dark.faint,
    grid: palette.dark.sheetGrid,
    accent: palette.orange,
    display: fonts.display,
    body: fonts.body,
    mono: fonts.mono,
  };
  const css = Object.entries(vars)
    .map(([name, value]) => `--${name}: ${value};`)
    .join(' ');
  return {
    name: 'sinapse-zero:brand-tokens',
    transformIndexHtml: () => [{tag: 'style', children: `:root { ${css} }`, injectTo: 'head'}],
  };
}

export default defineConfig({
  root: 'demo',
  // Relative URLs: the same build works under /sinapse-zero-studio/ on Pages and locally.
  base: './',
  plugins: [canvasCommons({project: projects}), brandTokens()],
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true,
    rollupOptions: {
      // The page is built together with the projects, so the player and the projects
      // share one copy of the engine.
      input: {index: fileURLToPath(new URL('./demo/index.html', import.meta.url))},
      output: {entryFileNames: '[name].js'},
    },
  },
});
