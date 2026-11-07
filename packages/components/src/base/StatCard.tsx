import {initial, Rect, RectProps, signal, Txt} from '@canvas-commons/2d';
import {
  easeOutCubic,
  SignalValue,
  SimpleSignal,
  ThreadGenerator,
  tween,
} from '@canvas-commons/core';
import {fonts, sizes, useTheme, weights} from '@sinapse-zero/brand';

export interface StatCardProps extends RectProps {
  /** Small all-caps line on top. E.g. 'FORWARD VOLTAGE'. */
  label?: string;
  /** The big number. E.g. '2.0 V'. */
  value?: SignalValue<string>;
  /** Bottom line. E.g. 'Red LED, 20 mA'. */
  caption?: string;
  /** Color of the value. Default: theme accent. */
  color?: string;
}

/**
 * A data panel with a big number: the "datasheet card".
 *
 * ```tsx
 * <StatCard ref={c} label={'MAX CURRENT'} value={'20 mA'} caption={'Datasheet, p. 2'} />
 * yield* c().countTo(0, 20, 1, n => `${n.toFixed(0)} mA`);
 * ```
 */
export class StatCard extends Rect {
  @initial('')
  @signal()
  declare public readonly value: SimpleSignal<string, this>;

  public constructor({label, caption, color, ...props}: StatCardProps) {
    const theme = useTheme();
    super({
      layout: true,
      direction: 'column',
      gap: 6,
      padding: [28, 36],
      fill: theme.panel,
      stroke: theme.rule,
      lineWidth: 2,
      radius: 6,
      ...props,
    });

    this.add(
      <>
        {label && (
          <Txt
            text={label.toUpperCase()}
            fontFamily={fonts.display}
            fontSize={sizes.small}
            fontWeight={weights.semibold}
            letterSpacing={2}
            fill={theme.muted}
          />
        )}
        <Txt
          text={() => this.value()}
          fontFamily={fonts.display}
          fontSize={sizes.number}
          fontWeight={weights.bold}
          fill={color ?? theme.accent}
        />
        {caption && (
          <Txt text={caption} fontFamily={fonts.body} fontSize={sizes.label} fill={theme.muted} />
        )}
      </>,
    );
  }

  /** Counts from `from` to `to`, formatting every frame. */
  public *countTo(
    from: number,
    to: number,
    duration = 1,
    format: (n: number) => string = n => n.toFixed(0),
  ): ThreadGenerator {
    yield* tween(duration, t => {
      this.value(format(from + (to - from) * easeOutCubic(t)));
    });
    this.value(format(to));
  }
}
