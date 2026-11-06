import {makeProject} from '@canvas-commons/core';

import stinger from './scenes/stinger?scene';

/*
 * Stinger transition, rendered on its own for a video editor.
 *
 * stinger.meta is set to export a PNG image sequence with a transparent background
 * (output/stinger/000000.png...). An MP4 would not work here: H.264 has no alpha channel.
 * Place the sequence on the track above a cut and cut in the middle of the hold.
 */
export default makeProject({
  scenes: [stinger],
  variables: {theme: 'blueprint', locale: 'en'},
});
