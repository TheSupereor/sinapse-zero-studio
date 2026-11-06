import {colorSignal, initial, Line, LineProps, signal} from '@canvas-commons/2d';
import {
  ColorSignal,
  easeInOutCubic,
  PossibleColor,
  SignalValue,
  SimpleSignal,
  ThreadGenerator,
} from '@canvas-commons/core';
import {useTheme} from '@synapticon/brand';

export interface WireProps extends LineProps {
  /** Visibility of the current dots, 0–1. Default: 0 (no current). */
  current?: SignalValue<number>;
  /**
   * Dot speed in px/s. Negative reverses the direction.
   * Do not animate this value (the dots would jump); to change the "strength" of the
   * current, switch values between scenes or animate `phase` by hand.
   */
  speed?: SignalValue<number>;
  /** Distance between dots, px. Default: 56. */
  spacing?: SignalValue<number>;
  /** Radius of each dot, px. Default: 7. */
  dotRadius?: SignalValue<number>;
  dotColor?: SignalValue<PossibleColor>;
  /**
   * Manual dot offset, px. When set (not null) it replaces the automatic motion:
   * animate it however you like.
   */
  phase?: SignalValue<number | null>;
}

/**
 * A wire whose current dots move on their own (conventional current, from the first
 * point to the last). Dots only appear on the part of the wire that is already drawn.
 *
 * ```tsx
 * <Wire ref={w} points={() => [bat().pin('pos'), r().pin('a')]} />
 * yield* w().energize();      // dots appear and start flowing
 * yield* w().end(1, 0.8);     // or draw the wire first (end starts at 1)
 * ```
 */
export class Wire extends Line {
  @initial(0)
  @signal()
  declare public readonly current: SimpleSignal<number, this>;

  @initial(140)
  @signal()
  declare public readonly speed: SimpleSignal<number, this>;

  @initial(56)
  @signal()
  declare public readonly spacing: SimpleSignal<number, this>;

  @initial(7)
  @signal()
  declare public readonly dotRadius: SimpleSignal<number, this>;

  @colorSignal()
  declare public readonly dotColor: ColorSignal<this>;

  @initial(null)
  @signal()
  declare public readonly phase: SimpleSignal<number | null, this>;

  public constructor(props: WireProps) {
    const theme = useTheme();
    super({
      stroke: theme.ink,
      lineWidth: 6,
      lineCap: 'round',
      lineJoin: 'round',
      dotColor: theme.accent,
      ...props,
    });
  }

  public *energize(duration = 0.4): ThreadGenerator {
    yield* this.current(1, duration, easeInOutCubic);
  }

  public *deenergize(duration = 0.4): ThreadGenerator {
    yield* this.current(0, duration, easeInOutCubic);
  }

  protected override drawShape(context: CanvasRenderingContext2D) {
    super.drawShape(context);

    const intensity = this.current();
    if (intensity <= 0.001) return;

    const total = this.offsetArcLength();
    const gap = Math.max(4, this.spacing());
    const from = Math.min(this.start(), this.end()) * total;
    const to = Math.max(this.start(), this.end()) * total;
    if (to - from < 1) return;

    // Time comes from the view: useTime() only works inside threads, not while drawing.
    const manual = this.phase();
    const offset = manual ?? this.view().globalTime() * this.speed();
    const first = ((offset % gap) + gap) % gap;

    context.save();
    context.globalAlpha *= Math.min(1, intensity);
    context.fillStyle = this.dotColor().serialize();
    const radius = this.dotRadius();
    for (let d = first; d <= total; d += gap) {
      if (d < from || d > to) continue;
      const {position} = this.getPointAtDistance(d);
      context.beginPath();
      context.arc(position.x, position.y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}
