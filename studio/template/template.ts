import {makeProject} from '@canvas-commons/core';

import situation from './scenes/01-situation?scene';
import opening from './scenes/02-opening?scene';
import concept from './scenes/03-concept?scene';
import recap from './scenes/04-recap?scene';
import closing from './scenes/05-closing?scene';

// 1) Record the narration and export it as ./audio/narration.wav (see audio/README.md).
// 2) Uncomment the two lines below. The waveform shows up on the editor timeline.
// import narration from './audio/narration.wav';

export default makeProject({
  scenes: [situation, opening, concept, recap, closing],
  // audio: narration,
  variables: {
    // 'blueprint' (dark) or 'lab' (light)
    theme: 'blueprint',
    // Language of the template defaults (opening overline, closing lines...): 'en' or 'pt-BR'
    locale: 'en',
  },
});
