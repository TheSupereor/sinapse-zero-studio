import {makeScene2D} from '@canvas-commons/2d';
import {Background, closing, LogoMark} from '@sinapse-zero/components';

// CLOSING: SYS//A declares the training complete.
export default makeScene2D(function* (view) {
  view.add(<Background />);
  view.add(<LogoMark />);
  yield* closing(view, {code: 'EP-XX', next: 'EP-YY · Next topic'});
});
