import {initial, Rect, RectProps, signal, Txt} from '@canvas-commons/2d';
import {
  all,
  createSignal,
  easeOutCubic,
  linear,
  SimpleSignal,
  ThreadGenerator,
  tween,
  waitFor,
} from '@canvas-commons/core';
import {fonts, sizes, useTheme} from '@sinapse-zero/brand';

/** Typing speed, in characters per second. Deadpan is never in a hurry. */
const CPS = 28;
const CURSOR = '▌';

export interface AnnouncerProps extends RectProps {
  /** Header of the box. Default: 'SYS//A'. */
  title?: string;
  /** Text already on screen (static use, no typing). */
  text?: string;
  /** Box width. Default: 900. */
  width?: number;
}

/**
 * The lab's system terminal: the dry voice that comments on the disaster.
 *
 * ```tsx
 * const sys = createRef<Announcer>();
 * view.add(<Announcer ref={sys} y={300} />);
 * yield* sys().say('Component damaged. The cost will be deducted from your salary.');
 * ```
 */
export class Announcer extends Rect {
  /** Text on screen (without the cursor). Can be animated by hand: `sys().text('...')`. */
  @initial('')
  @signal()
  declare public readonly text: SimpleSignal<string, this>;

  private readonly cursorVisible = createSignal(false);

  public constructor({title = 'SYS//A', width = 900, ...props}: AnnouncerProps) {
    const theme = useTheme();
    super({
      layout: true,
      direction: 'column',
      gap: 14,
      padding: [24, 32],
      width,
      fill: theme.panel,
      stroke: theme.rule,
      lineWidth: 2,
      radius: 6,
      ...props,
    });

    this.add(
      <>
        <Txt
          text={`${title}  •••`}
          fontFamily={fonts.mono}
          fontSize={sizes.small}
          fill={theme.accent}
          letterSpacing={2}
        />
        <Txt
          text={() => this.text() + (this.cursorVisible() ? CURSOR : ' ')}
          fontFamily={fonts.mono}
          fontSize={sizes.label + 4}
          lineHeight={'130%'}
          fill={theme.ink}
          textWrap
          width={width - 64}
        />
      </>,
    );
  }

  /**
   * Types the text. Default duration is proportional to its length (28 characters/s).
   * The cursor then blinks twice and stays on.
   */
  public *say(text: string, duration = text.length / CPS): ThreadGenerator {
    this.cursorVisible(true);
    yield* tween(duration, value => {
      const n = Math.round(linear(value) * text.length);
      this.text(text.slice(0, n));
    });
    this.text(text);
    yield* this.blink(2);
  }

  /** Types `text` after what is already written (use '\n' for a new line). */
  public *append(text: string, duration = text.length / CPS): ThreadGenerator {
    const base = this.text();
    this.cursorVisible(true);
    yield* tween(duration, value => {
      const n = Math.round(linear(value) * text.length);
      this.text(base + text.slice(0, n));
    });
    this.text(base + text);
    yield* this.blink(2);
  }

  /** Blinks the cursor `times` times (0.25 s per phase). */
  public *blink(times = 2): ThreadGenerator {
    for (let i = 0; i < times; i++) {
      this.cursorVisible(false);
      yield* waitFor(0.25);
      this.cursorVisible(true);
      yield* waitFor(0.25);
    }
  }

  /** Deletes the text backwards, like a held backspace. */
  public *clear(duration = 0.3): ThreadGenerator {
    const current = this.text();
    yield* tween(duration, value => {
      this.text(current.slice(0, Math.round((1 - value) * current.length)));
    });
    this.text('');
  }

  public *appear(duration = 0.35): ThreadGenerator {
    this.opacity(0).scale(0.96);
    this.cursorVisible(true);
    yield* all(this.opacity(1, duration, easeOutCubic), this.scale(1, duration, easeOutCubic));
  }

  public *vanish(duration = 0.3): ThreadGenerator {
    yield* this.opacity(0, duration);
    this.cursorVisible(false);
  }
}
