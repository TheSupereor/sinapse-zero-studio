import {makeScene2D} from '@canvas-commons/2d';
import {Background, recap} from '@sinapse-zero/components';

// RECAP: tie this episode to an earlier one (not only the one right before it).
export default makeScene2D(function* (view) {
  view.add(<Background />);
  yield* recap(view, {
    code: 'EP-XX',
    title: 'Recalled episode',
    reminder: 'What the viewer needs to remember, in one sentence.',
  });
});
