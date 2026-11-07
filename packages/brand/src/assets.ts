/**
 * Brand assets. Icons and ornaments are imported as SVG text so they can be recolored.
 * These files belong to the Sinapse Zero brand and are not covered by the MIT license (see NOTICE.md).
 */

const logos = import.meta.glob<string>('../assets/logo/*.png', {
  eager: true,
  import: 'default',
});

const icons = import.meta.glob<string>('../assets/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const ornaments = import.meta.glob<string>('../assets/ornaments/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function byName(files: Record<string, string>, name: string, kind: string) {
  const key = Object.keys(files).find(
    path => path.endsWith(`/${name}.svg`) || path.endsWith(`/${name}.png`),
  );
  if (!key) {
    const available = Object.keys(files)
      .map(path => path.split('/').pop()!.replace(/\.(svg|png)$/, ''))
      .join(', ');
    throw new Error(`${kind} "${name}" does not exist. Available: ${available}`);
  }
  return files[key];
}

export type LogoVariant = 'full' | 'mark' | 'word';

/** Logo URL. `background` is the kind of background it will sit on. */
export function logo(variant: LogoVariant, background: 'light' | 'dark'): string {
  return byName(logos, `${variant}_${background}`, 'Logo');
}

export type IconName =
  | '3d-printing'
  | 'battery'
  | 'drilling'
  | 'electronics'
  | 'esd'
  | 'heat'
  | 'laser'
  | 'mechanics'
  | 'motor'
  | 'screw'
  | 'soldering'
  | 'voltage';

const GRAPHITE = /#172126/gi;

/** SVG markup of an icon (pictogram only), recolored. */
export function iconSvg(name: IconName, color: string): string {
  return byName(icons, name, 'Icon').replace(GRAPHITE, color);
}

/** SVG markup of a brand ornament (e.g. 'sys-a', 'crosshair', 'corner-brackets') for a background. */
export function ornamentSvg(name: string, background: 'light' | 'dark'): string {
  return byName(ornaments, `${name}-${background}`, 'Ornament');
}
