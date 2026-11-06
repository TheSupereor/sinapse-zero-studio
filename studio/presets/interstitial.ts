import {makeProject} from '@canvas-commons/core';

import interstitial from './scenes/interstitial?scene';

/*
 * Drawing interstitial ("loading screen"), rendered on its own.
 *
 * It is full-frame and opaque, so an MP4 (interstitial.meta: WebCodecs) is fine:
 * in a video editor, it simply sits between two clips.
 * Swap the drawing for your own FreeCAD export (see docs/guide.md › Technical drawings).
 */
export default makeProject({
  scenes: [interstitial],
  variables: {theme: 'blueprint', locale: 'en'},
});
