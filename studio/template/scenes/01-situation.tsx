import {makeScene2D, Txt} from '@canvas-commons/2d';
import {createRef, waitUntil} from '@canvas-commons/core';
import {fonts, sizes, useTheme} from '@sinapse-zero/brand';
import {appear, Background, vanish} from '@sinapse-zero/components';

/*
 * SITUATION: the cold open. Show the problem happening before explaining anything.
 * Replace the placeholder below with the scene.
 *
 * Manual sync:
 *  - every `waitUntil('name')` becomes a pill on the editor timeline;
 *  - drag the pill to the right word of the narration (the waveform appears once
 *    you enable `audio` in the episode's project file);
 *  - the editor saves the position in 01-situation.meta (commit that file).
 */
export default makeScene2D(function* (view) {
  const theme = useTheme();
  const placeholder = createRef<Txt>();

  view.add(<Background />);
  view.add(
    <Txt
      ref={placeholder}
      text={'SITUATION'}
      fontFamily={fonts.mono}
      fontSize={sizes.subtitle}
      fill={theme.faint}
      opacity={0}
    />,
  );

  yield* appear(placeholder());
  yield* waitUntil('end');
  yield* vanish(placeholder());
});
