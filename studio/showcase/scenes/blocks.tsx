import {makeScene2D} from '@canvas-commons/2d';
import {waitFor} from '@canvas-commons/core';
import {Background, chapter, closing, opening, recap} from '@synapticon/components';

// Showcase 0: the episode structure blocks, in order.
export default makeScene2D(function* (view) {
  view.add(<Background />);

  yield* opening(view, {code: 'BT-00', title: 'Showcase'});
  yield* chapter(view, {number: '01', title: 'Visual basics', subtitle: 'Everything the lab has to show.'});
  yield* recap(view, {
    code: 'BT-00',
    title: 'Datasheets',
    reminder: 'Before powering anything, read the datasheet. It knows more than you do and does not bill overtime.',
  });
  yield* closing(view, {code: 'BT-00', next: 'BT-01 · LED'});
  yield* waitFor(0.5);
});
