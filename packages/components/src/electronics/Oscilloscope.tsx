import {Grid, initial, Line, Rect, RectProps, signal, Txt} from '@canvas-commons/2d';
import {SimpleSignal} from '@canvas-commons/core';
import {fonts, sizes, useTheme} from '@sinapse-zero/brand';

/** A waveform: takes x ∈ [0, 1] (screen width) and t (s); returns −1…1. */
export type Waveform = (x: number, t: number) => number;

export const waves = {
  sine: (cycles = 2): Waveform => (x, t) => Math.sin(2 * Math.PI * (cycles * x - t)),
  square: (cycles = 2): Waveform => (x, t) => (Math.sin(2 * Math.PI * (cycles * x - t)) >= 0 ? 0.8 : -0.8),
  dc: (level = 0.5): Waveform => () => level,
  /** Half-wave rectified: the negative half is gone (diode!). */
  halfWave: (cycles = 2): Waveform => (x, t) => Math.max(0, Math.sin(2 * Math.PI * (cycles * x - t))),
};

export interface OscilloscopeProps extends RectProps {
  /** Default: a 2-cycle sine. */
  wave?: Waveform;
  /** Amplitude multiplier, 0–1. Animate it to "switch on" the signal. Default: 1. */
  gain?: number;
  /** Scroll speed, cycles/s. 0 = frozen. Default: 0.5. */
  scroll?: number;
  /** Caption in the corner. E.g. 'CH1 2 V/div'. */
  channel?: string;
  color?: string;
}

/**
 * An oscilloscope screen with a grid and a trace that scrolls on its own.
 *
 * ```tsx
 * <Oscilloscope ref={o} wave={waves.halfWave()} channel={'CH1 · rectifier output'} />
 * yield* o().gain(1, 0.8);
 * ```
 */
export class Oscilloscope extends Rect {
  @initial(1)
  @signal()
  declare public readonly gain: SimpleSignal<number, this>;

  @initial(0.5)
  @signal()
  declare public readonly scroll: SimpleSignal<number, this>;

  public constructor({wave = waves.sine(), channel, color, width = 720, height = 440, ...props}: OscilloscopeProps) {
    const theme = useTheme();
    super({
      width,
      height,
      fill: theme.panel,
      stroke: theme.rule,
      lineWidth: 3,
      radius: 10,
      clip: true,
      ...props,
    });
    const w = Number(width);
    const h = Number(height);
    const samples = 240;
    const traceColor = color ?? theme.cyan;

    this.add(
      <>
        <Grid width={w} height={h} spacing={[w / 10, h / 8]} stroke={theme.grid} lineWidth={2} />
        <Line points={[[-w / 2, 0], [w / 2, 0]]} stroke={theme.rule} lineWidth={2} />
        <Line
          points={() => {
            const t = this.view().globalTime() * this.scroll();
            const points: [number, number][] = [];
            for (let i = 0; i <= samples; i++) {
              const x = i / samples;
              points.push([-w / 2 + x * w, -wave(x, t) * this.gain() * h * 0.4]);
            }
            return points;
          }}
          stroke={traceColor}
          lineWidth={5}
          lineJoin={'round'}
          shadowColor={traceColor}
          shadowBlur={14}
        />
        {channel && (
          <Txt
            text={channel}
            position={[-w / 2 + 20, -h / 2 + 20]}
            anchor={[-1, -1]}
            fontFamily={fonts.mono}
            fontSize={sizes.small}
            fill={traceColor}
          />
        )}
      </>,
    );
  }
}
