import {Circle, Line, Node, NodeProps, Txt} from '@canvas-commons/2d';
import {
  all,
  createRef,
  delay,
  easeInOutCubic,
  map,
  ThreadGenerator,
  TimingFunction,
  Vector2,
} from '@canvas-commons/core';
import {fonts, sizes, useTheme} from '@synapticon/brand';

export interface ChartProps extends NodeProps {
  /** Width of the plot area, in px. Default: 900. */
  plotWidth?: number;
  /** Height of the plot area, in px. Default: 500. */
  plotHeight?: number;
  /** X axis range: [min, max]. */
  rangeX: [number, number];
  /** Y axis range: [min, max]. */
  rangeY: [number, number];
  /** Tick step on the X axis. Default: range / 5. */
  stepX?: number;
  stepY?: number;
  labelX?: string;
  labelY?: string;
  formatX?: (n: number) => string;
  formatY?: (n: number) => string;
  /** Start hidden; call `reveal()`. Default: false. */
  startHidden?: boolean;
}

export interface CurveOptions {
  color?: string;
  width?: number;
  /** Samples taken when the source is a function. Default: 160. */
  samples?: number;
  /** Dash pattern, e.g. [12, 10]. */
  dash?: number[];
}

export interface MarkOptions {
  label?: string;
  color?: string;
  /** Dashed guides down to the axes. Default: true. */
  guides?: boolean;
}

/** A function y = f(x), or a list of [x, y] points in chart units. */
export type CurveSource = ((x: number) => number) | [number, number][];

const defaultFormat = (n: number) => (Number.isInteger(n) ? n.toString() : n.toFixed(1));

/**
 * Chart with axes, ticks, self-drawing curves and marked points with guides.
 * The node's origin is the center of the plot area.
 *
 * ```tsx
 * const c = createRef<Chart>();
 * view.add(<Chart ref={c} rangeX={[0, 5]} rangeY={[0, 30]} labelX={'Voltage (V)'} labelY={'Current (mA)'} />);
 * yield* c().plot(v => (v < 1.8 ? 0 : (v - 1.8) * 40));
 * yield* c().markAt(2, 8, {label: '2 V → 8 mA'});
 * ```
 */
export class Chart extends Node {
  public readonly plotWidth: number;
  public readonly plotHeight: number;
  public readonly rangeX: [number, number];
  public readonly rangeY: [number, number];

  private readonly axes = createRef<Line>();
  private readonly scaleGroup = createRef<Node>();
  private readonly curveLayer = createRef<Node>();

  public constructor({
    plotWidth = 900,
    plotHeight = 500,
    rangeX: x,
    rangeY: y,
    stepX = (x[1] - x[0]) / 5,
    stepY = (y[1] - y[0]) / 5,
    labelX,
    labelY,
    formatX = defaultFormat,
    formatY = defaultFormat,
    startHidden = false,
    ...props
  }: ChartProps) {
    super(props);
    const theme = useTheme();
    this.plotWidth = plotWidth;
    this.plotHeight = plotHeight;
    this.rangeX = x;
    this.rangeY = y;

    const w2 = plotWidth / 2;
    const h2 = plotHeight / 2;
    const ticksX = steps(x, stepX);
    const ticksY = steps(y, stepY);
    const tickText = {
      fontFamily: fonts.mono,
      fontSize: sizes.small,
      fill: theme.muted,
    };
    const axisLabel = {
      ...tickText,
      fontFamily: fonts.display,
      fontSize: sizes.label,
      fill: theme.ink,
    };

    this.add(
      <>
        <Node ref={this.scaleGroup} opacity={startHidden ? 0 : 1}>
          {ticksY.map(v => (
            <Line points={[this.point(x[0], v), this.point(x[1], v)]} stroke={theme.grid} lineWidth={2} />
          ))}
          {ticksX.map(v => (
            <Txt {...tickText} text={formatX(v)} position={this.point(v, y[0]).add([0, 30])} />
          ))}
          {ticksY.map(v => (
            <Txt {...tickText} text={formatY(v)} position={this.point(x[0], v).add([-18, 0])} anchorX={1} />
          ))}
          {labelX && <Txt {...axisLabel} text={labelX} position={[0, h2 + 76]} />}
          {labelY && <Txt {...axisLabel} text={labelY} rotation={-90} position={[-w2 - 96, 0]} />}
        </Node>
        <Line
          ref={this.axes}
          points={[
            [-w2, -h2],
            [-w2, h2],
            [w2, h2],
          ]}
          stroke={theme.muted}
          lineWidth={3}
          end={startHidden ? 0 : 1}
        />
        <Node ref={this.curveLayer} />
      </>,
    );
  }

  /** Converts chart units to local px. */
  public point(x: number, y: number): Vector2 {
    const [x0, x1] = this.rangeX;
    const [y0, y1] = this.rangeY;
    return new Vector2(
      map(-this.plotWidth / 2, this.plotWidth / 2, (x - x0) / (x1 - x0)),
      map(this.plotHeight / 2, -this.plotHeight / 2, (y - y0) / (y1 - y0)),
    );
  }

  /** Draws the axes and fades the scale in. */
  public *reveal(duration = 1): ThreadGenerator {
    yield* all(
      this.axes().end(1, duration, easeInOutCubic),
      delay(duration * 0.5, this.scaleGroup().opacity(1, duration * 0.5)),
    );
  }

  /**
   * Creates a curve (invisible, `end = 0`) and returns it, so you can animate it any way you like:
   * `yield* c().curve(f).end(1, 2)`.
   */
  public curve(source: CurveSource, options: CurveOptions = {}): Line {
    const theme = useTheme();
    const {color = theme.accent, width = 5, samples = 160, dash} = options;
    const line = (
      <Line
        points={this.pointsOf(source, samples)}
        stroke={color}
        lineWidth={width}
        lineJoin={'round'}
        lineCap={'round'}
        lineDash={dash}
        end={0}
      />
    ) as Line;
    this.curveLayer().add(line);
    return line;
  }

  /** Creates a curve and draws it from left to right. */
  public *plot(
    source: CurveSource,
    options: CurveOptions & {duration?: number; ease?: TimingFunction} = {},
  ): ThreadGenerator {
    const {duration = 1.2, ease = easeInOutCubic, ...rest} = options;
    yield* this.curve(source, rest).end(1, duration, ease);
  }

  /** Creates an invisible mark (dot + guides + label) and returns it. */
  public mark(x: number, y: number, options: MarkOptions = {}): Node {
    const theme = useTheme();
    const {label, color = theme.accent, guides = true} = options;
    const p = this.point(x, y);
    const [x0] = this.rangeX;
    const [y0] = this.rangeY;
    const group = (
      <Node opacity={0}>
        {guides && (
          <Line
            points={[this.point(x, y0), p, this.point(x0, y)]}
            stroke={theme.muted}
            lineWidth={2}
            lineDash={[8, 8]}
          />
        )}
        <Circle position={p} size={18} fill={color} />
        {label && (
          <Txt
            text={label}
            position={p.add([22, -26])}
            anchorX={-1}
            fontFamily={fonts.display}
            fontSize={sizes.label}
            fontWeight={600}
            fill={color}
          />
        )}
      </Node>
    ) as Node;
    this.curveLayer().add(group);
    return group;
  }

  /** Shows a mark at a point. */
  public *markAt(x: number, y: number, options: MarkOptions & {duration?: number} = {}): ThreadGenerator {
    const {duration = 0.5, ...rest} = options;
    yield* this.mark(x, y, rest).opacity(1, duration);
  }

  private pointsOf(source: CurveSource, samples: number): Vector2[] {
    if (Array.isArray(source)) {
      return source.map(([x, y]) => this.point(x, y));
    }
    const [x0, x1] = this.rangeX;
    const [y0, y1] = this.rangeY;
    const points: Vector2[] = [];
    // The curve enters at the first sample inside the Y range and ends exactly on the edge
    // it leaves through, instead of flattening against the ceiling.
    let previous: [number, number] | null = null;
    let inside = false;
    for (let i = 0; i <= samples; i++) {
      const x = x0 + ((x1 - x0) * i) / samples;
      const y = source(x);
      const inRange = y >= y0 && y <= y1;
      if (inRange) {
        if (!inside && previous) points.push(this.point(...crossing(previous, [x, y], y0, y1)));
        points.push(this.point(x, y));
        inside = true;
      } else if (inside) {
        points.push(this.point(...crossing(previous!, [x, y], y0, y1)));
        break;
      }
      previous = [x, y];
    }
    return points;
  }
}

/** Where the segment a→b crosses the edge (y0 or y1) that one of them overshoots. */
function crossing(a: [number, number], b: [number, number], y0: number, y1: number): [number, number] {
  const edge = a[1] > y1 || b[1] > y1 ? y1 : y0;
  const t = (edge - a[1]) / (b[1] - a[1]);
  return [a[0] + t * (b[0] - a[0]), edge];
}

function steps([start, end]: [number, number], step: number): number[] {
  const n = Math.round((end - start) / step);
  return Array.from({length: n + 1}, (_, i) => +(start + i * step).toFixed(6));
}
