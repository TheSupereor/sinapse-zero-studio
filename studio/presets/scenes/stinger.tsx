import {makeScene2D} from '@canvas-commons/2d';
import {stinger} from '@synapticon/components';

// No Background here: everything around the panel must stay transparent.
// travel 0.45 + hold 0.3 + travel 0.45 = 1.2 s. Cut point: 0.6 s (frame 18 at 30 fps).
export default makeScene2D(function* (view) {
  yield* stinger(view, {direction: 'left', travel: 0.45, hold: 0.3, label: 'SYNAPTICON'});
});
