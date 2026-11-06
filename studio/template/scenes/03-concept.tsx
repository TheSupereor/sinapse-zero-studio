import {makeScene2D} from '@canvas-commons/2d';
import {waitUntil} from '@canvas-commons/core';
import {Background, chapter} from '@synapticon/components';

/*
 * CONCEPT: the explanation. Start with a chapter card and build the explanation from
 * components (studio/showcase/scenes has an example of each one).
 * Duplicate this file for every chapter (03a, 03b...) and list it in the project file.
 */
export default makeScene2D(function* (view) {
  view.add(<Background />);
  yield* chapter(view, {number: '01', title: 'Chapter name'});

  // ... your explanation here ...

  yield* waitUntil('end');
});
