import {Rect, RectProps} from '@canvas-commons/2d';
import {easeInOutCubic, ThreadGenerator} from '@canvas-commons/core';
import {useTheme} from '@synapticon/brand';

export interface HighlightBarProps extends RectProps {
  /** Final width of the highlight. */
  width: number;
  /** Start already swept (static use). Default: false. */
  startVisible?: boolean;
}

/**
 * Highlighter stroke that sweeps from left to right.
 * Its position is the **left edge** (anchorX = -1).
 *
 * ```tsx
 * <HighlightBar ref={h} x={-300} y={40} width={420} height={44} />
 * yield* h().sweep();
 * ```
 */
export class HighlightBar extends Rect {
  private readonly finalWidth: number;

  public constructor({width, startVisible = false, ...props}: HighlightBarProps) {
    const theme = useTheme();
    super({
      height: 44,
      fill: theme.accent,
      opacity: 0.35,
      anchorX: -1,
      radius: 3,
      ...props,
      width: startVisible ? width : 0,
    });
    this.finalWidth = width;
  }

  public *sweep(duration = 0.5): ThreadGenerator {
    yield* this.width(this.finalWidth, duration, easeInOutCubic);
  }

  public *erase(duration = 0.3): ThreadGenerator {
    yield* this.opacity(0, duration);
    this.width(0).opacity(0.35);
  }
}

export interface HighlightBoxProps extends RectProps {
  startVisible?: boolean;
}

/**
 * Outline box that traces itself around something.
 *
 * ```tsx
 * <HighlightBox ref={b} width={500} height={120} />
 * yield* b().trace();
 * ```
 */
export class HighlightBox extends Rect {
  public constructor({startVisible = false, ...props}: HighlightBoxProps) {
    const theme = useTheme();
    super({
      stroke: theme.accent,
      lineWidth: 4,
      radius: 6,
      end: startVisible ? 1 : 0,
      ...props,
    });
  }

  public *trace(duration = 0.6): ThreadGenerator {
    yield* this.end(1, duration, easeInOutCubic);
  }

  public *erase(duration = 0.4): ThreadGenerator {
    yield* this.start(1, duration, easeInOutCubic);
    this.start(0).end(0);
  }
}
