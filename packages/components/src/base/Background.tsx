import {Grid, Rect, RectProps} from '@canvas-commons/2d';
import {createRef, easeInOutCubic, ThreadGenerator, useScene} from '@canvas-commons/core';
import {useTheme} from '@synapticon/brand';

export interface BackgroundProps extends RectProps {
  /** Show the drafting grid. Default: true. */
  grid?: boolean;
  /** Distance between grid lines, in px. Default: 80. */
  gridSpacing?: number;
}

/**
 * Theme background with a drafting grid. Fills the whole frame.
 *
 * ```tsx
 * view.add(<Background />);
 * ```
 */
export class Background extends Rect {
  public readonly gridLines = createRef<Grid>();

  public constructor({grid = true, gridSpacing = 80, ...props}: BackgroundProps) {
    const theme = useTheme();
    const size = useScene().getSize();
    super({width: size.x, height: size.y, fill: theme.background, ...props});

    if (grid) {
      this.add(
        <Grid
          ref={this.gridLines}
          width={size.x}
          height={size.y}
          spacing={gridSpacing}
          stroke={theme.grid}
          lineWidth={2}
        />,
      );
    }
  }

  /** Draws the grid outwards from the center. */
  public *reveal(duration = 1): ThreadGenerator {
    const grid = this.gridLines();
    if (!grid) return;
    grid.start(0.5).end(0.5);
    yield* grid.start(0, duration, easeInOutCubic);
  }
}
