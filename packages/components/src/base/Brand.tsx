import {Img, ImgProps, SVG, SVGProps} from '@canvas-commons/2d';
import {useScene} from '@canvas-commons/core';
import {iconSvg, IconName, logo, LogoVariant, useTheme} from '@sinapse-zero/brand';

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface LogoMarkProps extends ImgProps {
  /** Default: 'bottom-right'. */
  corner?: Corner;
  /** Default: 'mark' (symbol only). */
  variant?: LogoVariant;
  /** Distance from the frame edge, in px. Default: 48. */
  inset?: number;
}

/**
 * A discreet Sinapse Zero logo in a corner of the frame.
 *
 * ```tsx
 * view.add(<LogoMark />);
 * ```
 */
export class LogoMark extends Img {
  public constructor({corner = 'bottom-right', variant = 'mark', inset = 48, ...props}: LogoMarkProps) {
    const theme = useTheme();
    const size = useScene().getSize();
    const sx = corner.endsWith('right') ? 1 : -1;
    const sy = corner.startsWith('bottom') ? 1 : -1;
    super({
      src: logo(variant, theme.logo),
      height: 56,
      opacity: 0.55,
      anchor: [sx, sy],
      position: [sx * (size.x / 2 - inset), sy * (size.y / 2 - inset)],
      ...props,
    });
  }
}

export interface BrandIconProps extends Omit<SVGProps, 'svg'> {
  icon: IconName;
  /** Default: theme accent. */
  color?: string;
}

/**
 * A pictogram from the Sinapse Zero kit (battery, voltage, soldering...), recolored.
 *
 * ```tsx
 * <BrandIcon icon={'voltage'} size={120} />
 * ```
 */
export class BrandIcon extends SVG {
  public constructor({icon, color, ...props}: BrandIconProps) {
    const theme = useTheme();
    super({size: 96, ...props, svg: iconSvg(icon, color ?? theme.accent)});
  }
}
