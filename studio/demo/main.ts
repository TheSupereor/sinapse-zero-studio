/*
 * Live demo: plays studio projects in the browser.
 * Each <canvas-commons-player data-project="showcase/blueprint"> loads showcase/blueprint.js,
 * which vite.demo.config.ts builds next to this page.
 */
import '@canvas-commons/player';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow/latin-700.css';
import '@fontsource/cascadia-mono/latin-400.css';
import '@fontsource/cascadia-mono/latin-700.css';
import './style.css';

/** The element's runtime fields this page relies on (not part of the published types). */
type Player = HTMLElement & {state?: 'initial' | 'loading' | 'ready' | 'error'};

const FRAME_WIDTH = 1920;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Canvas text is laid out with whatever font is available when a node is built,
// so the web fonts must finish loading before any project starts.
const sample = 'Aa Çç Ãã 0123';
const faces = [
  ...['400', '600', '700'].flatMap(weight => [`${weight} 16px Barlow`, `${weight} 16px Selawik`]),
  '400 16px "Cascadia Mono"',
  '700 16px "Cascadia Mono"',
];
await Promise.all(faces.map(face => document.fonts.load(face, sample).catch((): FontFace[] => [])));

/** Resolves once the player has loaded its project (the element has no event for this). */
function whenReady(player: Player): Promise<boolean> {
  return new Promise(resolve => {
    const poll = () => {
      if (player.state === 'ready' || player.state === 'error') resolve(player.state === 'ready');
      else requestAnimationFrame(poll);
    };
    poll();
  });
}

/** Render at the size the canvas is shown, in steps of 0.25, instead of always at 1920 × 1080. */
function fitQuality(player: Player) {
  const scale = (player.clientWidth * devicePixelRatio) / FRAME_WIDTH;
  const quality = Math.min(1, Math.max(0.5, Math.ceil(scale * 4) / 4));
  if (player.getAttribute('quality') !== String(quality)) player.setAttribute('quality', String(quality));
}

// Play only what is on screen: every frame is rendered on the visitor's device.
const visibility = new IntersectionObserver(
  entries => {
    for (const entry of entries) entry.target.toggleAttribute('paused', !entry.isIntersecting);
  },
  {threshold: 0.25},
);
const resizing = new ResizeObserver(entries => {
  for (const entry of entries) fitQuality(entry.target as Player);
});

async function start(player: Player) {
  // With reduced motion, players wait for a click instead of starting on their own.
  if (!reducedMotion) {
    player.setAttribute('auto', 'true');
    visibility.observe(player);
  }

  // The element replaces the project's variables (theme, locale) with its `variables`
  // attribute, even when the attribute is missing, so hand it the project's own first.
  // The player then imports the same module again, from the cache.
  const src = new URL(`${player.dataset.project}.js`, document.baseURI).href;
  const {default: project} = await import(/* @vite-ignore */ src);
  player.setAttribute('variables', JSON.stringify(project.variables ?? {}));
  player.setAttribute('src', src);

  // Settings can only change once a project is loaded: the element reads them from it.
  if (await whenReady(player)) {
    fitQuality(player);
    resizing.observe(player);
  }
}

for (const player of document.querySelectorAll<Player>('canvas-commons-player[data-project]')) {
  start(player).catch(error => console.error(`Could not start ${player.dataset.project}:`, error));
}
