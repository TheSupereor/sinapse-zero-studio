import {Node} from '@canvas-commons/2d';
import {
  all,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  ThreadGenerator,
} from '@canvas-commons/core';

/** Standard durations, in seconds. Use them so the whole video keeps one rhythm. */
export const pace = {
  fast: 0.3,
  normal: 0.6,
  slow: 1.2,
} as const;

/** Easing curves named after what they do. */
export const easings = {
  /** Something arriving: fast at first, settles at the end. */
  enter: easeOutCubic,
  /** Something leaving: starts slow, speeds up. */
  exit: easeInCubic,
  /** Moving from one place to another. */
  move: easeInOutCubic,
} as const;

/** Fades in with a slight rise. */
export function* appear(node: Node, duration: number = pace.normal, rise = 24): ThreadGenerator {
  const y = node.y();
  node.opacity(0).y(y + rise);
  yield* all(node.opacity(1, duration, easings.enter), node.y(y, duration, easings.enter));
}

/** Fades out (with an optional slight drop). */
export function* vanish(node: Node, duration: number = pace.fast, drop = 0): ThreadGenerator {
  yield* all(node.opacity(0, duration, easings.exit), node.y(node.y() + drop, duration, easings.exit));
}
