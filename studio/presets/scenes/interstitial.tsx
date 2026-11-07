import {makeScene2D} from '@canvas-commons/2d';
import {waitFor} from '@canvas-commons/core';
import {Background, drawingInterstitial} from '@sinapse-zero/components';
import bracket from '../drawings/led-bracket.svg?raw';

// Drag 'interstitial-out' on the timeline to decide how long the finished sheet stays up.
export default makeScene2D(function* (view) {
  view.add(<Background />);
  yield* drawingInterstitial(view, {
    drawing: bracket,
    title: 'LED mounting bracket',
    code: 'BT-01-003',
    scale: '1:1',
    duration: 4,
  });
  yield* waitFor(0.3);
});
