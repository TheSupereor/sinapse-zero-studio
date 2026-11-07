import {
  Circle,
  initial,
  Line,
  Node,
  NodeProps,
  Txt,
  vector2Signal,
} from '@canvas-commons/2d';
import {
  all,
  createRef,
  delay,
  easeInOutCubic,
  PossibleVector2,
  SignalValue,
  ThreadGenerator,
  Vector2,
  Vector2Signal,
} from '@canvas-commons/core';
import {fonts, sizes, useTheme} from '@sinapse-zero/brand';

export interface CalloutProps extends NodeProps {
  /** The point being labeled, in the parent's space. Can be a function: `() => led().pin('a')`. */
  target?: SignalValue<PossibleVector2>;
  /** Offset of the elbow from the target. Default: [120, -90]. */
  elbow?: SignalValue<PossibleVector2>;
  text: string;
  /** Color of the leader line and dot. Default: theme accent. */
  color?: string;
  /** Start fully visible (static use). Default: false. */
  startVisible?: boolean;
}

/**
 * A label with a leader line to a point, like the annotations in hardware explainers.
 *
 * ```tsx
 * const c = createRef<Callout>();
 * view.add(<Callout ref={c} target={[200, 0]} text={'Anode'} />);
 * yield* c().show();
 * ```
 */
export class Callout extends Node {
  @initial([0, 0])
  @vector2Signal('target')
  declare public readonly target: Vector2Signal<this>;

  @initial([120, -90])
  @vector2Signal('elbow')
  declare public readonly elbow: Vector2Signal<this>;

  private readonly dot = createRef<Circle>();
  private readonly leader = createRef<Line>();
  private readonly label = createRef<Txt>();

  public constructor({text, color, startVisible = false, ...props}: CalloutProps) {
    super(props);
    const theme = useTheme();
    const lineColor = color ?? theme.accent;
    const toTheRight = () => this.elbow().x >= 0;
    const knee = () => this.target().add(this.elbow());
    const tip = () => knee().add([toTheRight() ? 48 : -48, 0]);

    this.add(
      <>
        <Line
          ref={this.leader}
          points={() => [this.target(), knee(), tip()]}
          stroke={lineColor}
          lineWidth={3}
          end={startVisible ? 1 : 0}
        />
        <Circle
          ref={this.dot}
          position={() => this.target()}
          size={14}
          fill={lineColor}
          scale={startVisible ? 1 : 0}
        />
        <Txt
          ref={this.label}
          text={text}
          position={() => tip().add([toTheRight() ? 14 : -14, 0])}
          anchorX={() => (toTheRight() ? -1 : 1)}
          fontFamily={fonts.display}
          fontSize={sizes.label}
          fontWeight={600}
          fill={theme.ink}
          opacity={startVisible ? 1 : 0}
        />
      </>,
    );
  }

  public *show(duration = 0.6): ThreadGenerator {
    yield* all(
      this.dot().scale(1, duration * 0.4, easeInOutCubic),
      this.leader().end(1, duration, easeInOutCubic),
      delay(duration * 0.6, this.label().opacity(1, duration * 0.4)),
    );
  }

  public *hide(duration = 0.4): ThreadGenerator {
    yield* all(
      this.label().opacity(0, duration * 0.5),
      this.leader().start(1, duration, easeInOutCubic),
      this.dot().scale(0, duration, easeInOutCubic),
    );
    this.leader().start(0).end(0);
  }

  /** Current position of the label's anchor (handy for chaining other elements). */
  public labelPosition(): Vector2 {
    return this.label().position();
  }
}
