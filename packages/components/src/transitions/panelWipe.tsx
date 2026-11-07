import {Rect, useScene2D} from '@canvas-commons/2d';
import {
  createSignal,
  easeInOutCubic,
  ThreadGenerator,
  TimingFunction,
  useTransition,
} from '@canvas-commons/core';
import {useTheme} from '@sinapse-zero/brand';

/** Where the moving edge travels to. 'left' = the new scene comes in from the right. */
export type WipeDirection = 'left' | 'right' | 'up' | 'down';

export interface PanelWipeOptions {
  /** Default: 'left'. */
  direction?: WipeDirection;
  /** Default: 0.8 s. */
  duration?: number;
  /** Width of the accent bar on the moving edge, px. 0 hides it. Default: 28. */
  barWidth?: number;
  /** Default: theme accent. */
  color?: string;
  ease?: TimingFunction;
}

/**
 * Scene transition: the new scene is revealed behind an accent bar that sweeps across
 * the frame. Call it first thing in a scene, after adding its nodes:
 *
 * ```tsx
 * export default makeScene2D(function* (view) {
 *   view.add(<Background />);
 *   yield* panelWipe({direction: 'left'});
 *   // ...
 * });
 * ```
 *
 * Built on `useTransition`: it clips the canvas before the new scene draws, and the
 * previous scene stays visible outside the clip.
 */
export function* panelWipe(options: PanelWipeOptions = {}): ThreadGenerator {
  const {direction = 'left', duration = 0.8, barWidth = 28, color, ease = easeInOutCubic} = options;
  const scene = useScene2D();
  const theme = useTheme();
  const size = scene.getSize();
  const real = scene.getRealSize();
  const pixel = real.x / size.x;
  const horizontal = direction === 'left' || direction === 'right';
  const span = (horizontal ? size.x : size.y) + barWidth;

  // Position of the moving edge, in px from the side the wipe starts on.
  const travelled = createSignal(0);

  const endTransition = useTransition(ctx => {
    const t = travelled() * pixel;
    const bar = barWidth * pixel;
    ctx.beginPath();
    switch (direction) {
      case 'left':
        ctx.rect(real.x - t, 0, t + bar, real.y);
        break;
      case 'right':
        ctx.rect(-bar, 0, t + bar, real.y);
        break;
      case 'up':
        ctx.rect(0, real.y - t, real.x, t + bar);
        break;
      case 'down':
        ctx.rect(0, -bar, real.x, t + bar);
        break;
    }
    ctx.clip();
  });

  // The bar rides the edge, inside the revealed area, so it is drawn by the new scene.
  const edge = () => {
    const t = travelled();
    switch (direction) {
      case 'left':
        return {x: size.x / 2 - t + barWidth / 2, y: 0};
      case 'right':
        return {x: -size.x / 2 + t - barWidth / 2, y: 0};
      case 'up':
        return {x: 0, y: size.y / 2 - t + barWidth / 2};
      case 'down':
        return {x: 0, y: -size.y / 2 + t - barWidth / 2};
    }
  };
  const bar = (
    <Rect
      zIndex={1000}
      fill={color ?? theme.accent}
      width={horizontal ? barWidth : size.x}
      height={horizontal ? size.y : barWidth}
      position={() => edge()}
    />
  ) as Rect;
  if (barWidth > 0) scene.getView().add(bar);

  yield* travelled(span, duration, ease);
  bar.remove();
  endTransition();
}
