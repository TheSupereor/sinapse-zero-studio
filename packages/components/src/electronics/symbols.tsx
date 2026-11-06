import {Circle, initial, Line, Node, Rect, signal, Txt} from '@canvas-commons/2d';
import {
  all,
  createRef,
  delay,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  PossibleVector2,
  SimpleSignal,
  ThreadGenerator,
  useRandom,
  Vector2,
} from '@canvas-commons/core';
import {fonts, sizes} from '@synapticon/brand';
import {Part, PartProps} from './Part';

/*
 * Conventions (every two-terminal symbol):
 * - drawn horizontally, pins at x = ±80 (160 px apart);
 * - rotate with `rotation={90}` for vertical; the pins follow;
 * - drawn to IEC 60617 by default.
 */

const P = 80;

// ───────────────────────────── Resistor ─────────────────────────────

export interface ResistorProps extends PartProps {
  /** 'iec' = rectangle; 'ansi' = zigzag. Default: 'iec'. */
  standard?: 'iec' | 'ansi';
}

/** Resistor. Pins: `a` (left), `b` (right). */
export class Resistor extends Part {
  protected readonly localPins = {a: [-P, 0], b: [P, 0]} as Record<string, PossibleVector2>;

  public constructor({standard = 'iec', ...props}: ResistorProps) {
    super(props);
    if (standard === 'iec') {
      this.add(
        <>
          <Line points={[[-P, 0], [-44, 0]]} {...this.strokeStyle()} />
          <Rect width={88} height={32} {...this.strokeStyle()} />
          <Line points={[[44, 0], [P, 0]]} {...this.strokeStyle()} />
        </>,
      );
    } else {
      const zigzag: PossibleVector2[] = [[-P, 0], [-44, 0]];
      for (let i = 0; i < 6; i++) {
        zigzag.push([-44 + 88 * ((i + 0.5) / 6), i % 2 === 0 ? -18 : 18]);
      }
      zigzag.push([44, 0], [P, 0]);
      this.add(<Line points={zigzag} {...this.strokeStyle()} />);
    }
  }
}

// ───────────────────────────── Diode and LED ─────────────────────────────

/** Diode. Pins: `a` (anode, left), `k` (cathode, right). */
export class Diode extends Part {
  protected readonly localPins = {a: [-P, 0], k: [P, 0]} as Record<string, PossibleVector2>;

  public constructor(props: PartProps) {
    super(props);
    this.add(diodeShape(this.strokeStyle()));
  }
}

function diodeShape(style: object) {
  return (
    <>
      <Line points={[[-P, 0], [-26, 0]]} {...style} />
      <Line points={[[-26, -28], [-26, 28], [26, 0]]} closed {...style} />
      <Line points={[[26, -28], [26, 28]]} {...style} />
      <Line points={[[26, 0], [P, 0]]} {...style} />
    </>
  );
}

export interface LEDProps extends PartProps {
  /** Color of the light. Default: theme red. */
  glow?: string;
  /** Initial brightness, 0–1. */
  brightness?: number;
}

/**
 * LED. Pins: `a` (anode, left), `k` (cathode, right).
 * Drive the `brightness` signal (0–1) by hand, or use `turnOn()`, `turnOff()`, `burnOut()`.
 */
export class LED extends Part {
  protected readonly localPins = {a: [-P, 0], k: [P, 0]} as Record<string, PossibleVector2>;

  @initial(0)
  @signal()
  declare public readonly brightness: SimpleSignal<number, this>;

  private readonly glow: string;
  private readonly body = createRef<Node>();
  private readonly smoke = createRef<Node>();

  public constructor({glow, ...props}: LEDProps) {
    super(props);
    this.glow = glow ?? this.theme.red;

    this.add(
      <>
        <Circle
          size={150}
          fill={this.glow}
          opacity={() => Math.min(1, this.brightness()) * 0.35}
          shadowColor={this.glow}
          shadowBlur={() => 80 * this.brightness()}
        />
        <Line
          points={[[-26, -28], [-26, 28], [26, 0]]}
          closed
          fill={this.glow}
          opacity={() => Math.min(1, this.brightness())}
        />
        <Node ref={this.body}>{diodeShape(this.strokeStyle())}</Node>
        <Line points={[[6, -40], [30, -64]]} {...this.strokeStyle()} lineWidth={4} endArrow arrowSize={12} />
        <Line points={[[26, -32], [50, -56]]} {...this.strokeStyle()} lineWidth={4} endArrow arrowSize={12} />
        <Node ref={this.smoke} />
      </>,
    );
  }

  public *turnOn(duration = 0.3): ThreadGenerator {
    yield* this.brightness(1, duration, easeOutCubic);
  }

  public *turnOff(duration = 0.3): ThreadGenerator {
    yield* this.brightness(0, duration, easeInCubic);
  }

  /**
   * A flash, then darkness: the body dims and smoke rises.
   * For when someone wires the LED straight to the battery. It happens.
   */
  public *burnOut(): ThreadGenerator {
    const random = useRandom();
    yield* this.brightness(1.8, 0.12, easeOutCubic);
    this.brightness(0);
    this.body().opacity(0.45);
    const puffs = Array.from({length: 5}, (_, i) => {
      const puff = (
        <Circle
          size={18 + random.nextInt(0, 14)}
          fill={this.theme.faint}
          opacity={0.7}
          position={[random.nextInt(-20, 20), -10]}
        />
      ) as Circle;
      this.smoke().add(puff);
      return delay(
        i * 0.12,
        all(
          puff.position(puff.position().add([random.nextInt(-30, 30), -140]), 1.4, easeOutCubic),
          puff.scale(2.2, 1.4),
          puff.opacity(0, 1.4, easeInCubic),
        ),
      );
    });
    yield* all(...puffs);
    this.smoke().removeChildren();
  }
}

// ───────────────────────────── Capacitor ─────────────────────────────

/** Capacitor (non-polarized). Pins: `a`, `b`. */
export class Capacitor extends Part {
  protected readonly localPins = {a: [-P, 0], b: [P, 0]} as Record<string, PossibleVector2>;

  public constructor(props: PartProps) {
    super(props);
    this.add(
      <>
        <Line points={[[-P, 0], [-12, 0]]} {...this.strokeStyle()} />
        <Line points={[[-12, -36], [-12, 36]]} {...this.strokeStyle()} />
        <Line points={[[12, -36], [12, 36]]} {...this.strokeStyle()} />
        <Line points={[[12, 0], [P, 0]]} {...this.strokeStyle()} />
      </>,
    );
  }
}

// ───────────────────────────── Battery ─────────────────────────────

/** Battery / DC source. Long plate = positive. Pins: `pos` (left), `neg` (right). */
export class Battery extends Part {
  protected readonly localPins = {pos: [-P, 0], neg: [P, 0]} as Record<string, PossibleVector2>;

  public constructor(props: PartProps) {
    super(props);
    this.add(
      <>
        <Line points={[[-P, 0], [-12, 0]]} {...this.strokeStyle()} />
        <Line points={[[-12, -40], [-12, 40]]} {...this.strokeStyle()} />
        <Line points={[[12, -20], [12, 20]]} {...this.strokeStyle()} lineWidth={this.strokeWidth * 1.8} />
        <Line points={[[12, 0], [P, 0]]} {...this.strokeStyle()} />
        <Txt
          text={'+'}
          position={[-34, -40]}
          rotation={() => -this.rotation()}
          fontFamily={fonts.display}
          fontSize={sizes.label}
          fontWeight={700}
          fill={this.theme.accent}
        />
      </>,
    );
  }
}

// ───────────────────────────── Ground ─────────────────────────────

/** Ground. Pin: `gnd` (top). */
export class Ground extends Part {
  protected readonly localPins = {gnd: [0, -40]} as Record<string, PossibleVector2>;

  public constructor(props: PartProps) {
    super({labelPosition: [0, 60], ...props});
    this.add(
      <>
        <Line points={[[0, -40], [0, 0]]} {...this.strokeStyle()} />
        <Line points={[[-32, 0], [32, 0]]} {...this.strokeStyle()} />
        <Line points={[[-20, 14], [20, 14]]} {...this.strokeStyle()} />
        <Line points={[[-8, 28], [8, 28]]} {...this.strokeStyle()} />
      </>,
    );
  }
}

// ───────────────────────────── Switch ─────────────────────────────

export interface SwitchProps extends PartProps {
  /** 0 = open, 1 = closed. Default: 0. */
  closed?: number;
}

/** On/off switch. Pins: `a`, `b`. Signal `closed` (0–1). */
export class Switch extends Part {
  protected readonly localPins = {a: [-P, 0], b: [P, 0]} as Record<string, PossibleVector2>;

  @initial(0)
  @signal()
  declare public readonly closed: SimpleSignal<number, this>;

  public constructor(props: SwitchProps) {
    super(props);
    const lever = () => {
      const angle = (-32 * (1 - this.closed()) * Math.PI) / 180;
      return new Vector2(-40, 0).add(new Vector2(Math.cos(angle), Math.sin(angle)).scale(80));
    };
    this.add(
      <>
        <Line points={[[-P, 0], [-40, 0]]} {...this.strokeStyle()} />
        <Line points={[[40, 0], [P, 0]]} {...this.strokeStyle()} />
        <Line points={() => [[-40, 0], lever()]} {...this.strokeStyle()} />
        <Circle position={[-40, 0]} size={16} fill={this.color} />
        <Circle position={[40, 0]} size={16} lineWidth={4} stroke={this.color} fill={this.theme.background} />
      </>,
    );
  }

  public *close(duration = 0.25): ThreadGenerator {
    yield* this.closed(1, duration, easeInOutCubic);
  }

  public *open(duration = 0.25): ThreadGenerator {
    yield* this.closed(0, duration, easeInOutCubic);
  }
}
