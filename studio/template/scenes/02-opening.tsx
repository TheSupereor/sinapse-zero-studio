import {makeScene2D} from '@canvas-commons/2d';
import {Background, opening} from '@sinapse-zero/components';

// OPENING: logo, code and title. Drag the 'opening-out' event in the editor.
export default makeScene2D(function* (view) {
  view.add(<Background />);
  yield* opening(view, {code: 'EP-XX', title: 'Training title'});
});
