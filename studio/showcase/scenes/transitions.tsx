import {makeScene2D} from '@canvas-commons/2d';
import {waitFor} from '@canvas-commons/core';
import {Background, drawingInterstitial, panelWipe} from '@sinapse-zero/components';
import bracket from '../../presets/drawings/led-bracket.svg?raw';

// Showcase 4: a scene transition (panelWipe) into the drawing interstitial.
export default makeScene2D(function* (view) {
  view.add(<Background />);

  // A transition runs first, after the scene's nodes exist: the previous scene
  // stays visible until the accent bar has swept across.
  yield* panelWipe({direction: 'left'});

  yield* drawingInterstitial(view, {
    drawing: bracket,
    title: 'LED mounting bracket',
    code: 'BT-01-003',
    duration: 4,
  });
  yield* waitFor(0.5);
});
