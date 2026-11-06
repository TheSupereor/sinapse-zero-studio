import {Grid, Img, Node, Rect, Txt, View2D} from '@canvas-commons/2d';
import {
  all,
  createRef,
  easeInCubic,
  easeOutCubic,
  ThreadGenerator,
  waitFor,
} from '@canvas-commons/core';
import {fonts, logo, sizes, useTheme, weights} from '@synapticon/brand';
import {WipeDirection} from './panelWipe';

export interface StingerOptions {
  /** Where the panel travels to. Default: 'left' (enters from the right, leaves to the left). */
  direction?: WipeDirection;
  /** Time to cover the frame, and again to uncover it. Default: 0.45 s. */
  travel?: number;
  /** Time the frame stays fully covered. Cut between your clips in the middle of it. Default: 0.3 s. */
  hold?: number;
  /** Text shown while covered, e.g. a chapter code. */
  label?: string;
  /** Show the logo mark while covered. Default: true. */
  showLogo?: boolean;
}

/**
 * A "stinger": a branded panel that sweeps in, covers the whole frame, and sweeps out.
 * Render it on a transparent background and lay it over a cut in a video editor; the cut
 * hides under the panel. Total length = 2 × travel + hold; the cut point is its middle.
 *
 * ```tsx
 * yield* stinger(view, {label: 'BT-01'});
 * ```
 */
export function* stinger(view: View2D, options: StingerOptions = {}): ThreadGenerator {
  const {direction = 'left', travel = 0.45, hold = 0.3, label, showLogo = true} = options;
  const theme = useTheme();
  const size = view.size();
  const bar = 28;
  const horizontal = direction === 'left' || direction === 'right';
  // +1 = the panel moves towards positive x/y.
  const sign = direction === 'right' || direction === 'down' ? 1 : -1;
  const away = (horizontal ? size.x : size.y) + bar * 2;

  const panel = createRef<Node>();
  const content = createRef<Node>();
  const w = horizontal ? size.x + bar * 2 : size.x;
  const h = horizontal ? size.y : size.y + bar * 2;
  const offscreen = (k: number) => (horizontal ? {x: k * away, y: 0} : {x: 0, y: k * away});

  view.add(
    <Node ref={panel} position={offscreen(-sign)}>
      <Rect width={w} height={h} fill={theme.background} />
      <Grid width={w} height={h} spacing={80} stroke={theme.grid} lineWidth={2} />
      {/* Accent bars on both edges: the leading one covers, the trailing one reveals. */}
      {[-1, 1].map(s => (
        <Rect
          fill={theme.accent}
          width={horizontal ? bar : w}
          height={horizontal ? h : bar}
          position={horizontal ? [s * (w / 2 - bar / 2), 0] : [0, s * (h / 2 - bar / 2)]}
        />
      ))}
      <Node ref={content} opacity={0}>
        {showLogo && <Img src={logo('mark', theme.logo)} height={140} y={label ? -50 : 0} />}
        {label && (
          <Txt
            text={label}
            y={showLogo ? 90 : 0}
            fontFamily={fonts.mono}
            fontSize={sizes.subtitle}
            fontWeight={weights.semibold}
            letterSpacing={4}
            fill={theme.accent}
          />
        )}
      </Node>
    </Node>,
  );

  yield* all(panel().position(offscreen(0), travel, easeOutCubic), content().opacity(1, travel, easeOutCubic));
  yield* waitFor(hold);
  yield* all(panel().position(offscreen(sign), travel, easeInCubic), content().opacity(0, travel * 0.6));
  panel().remove();
}
