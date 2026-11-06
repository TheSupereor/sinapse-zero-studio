import {makeProject} from '@canvas-commons/core';

import basics from './scenes/basics?scene';
import blocks from './scenes/blocks?scene';
import chart from './scenes/chart?scene';
import circuit from './scenes/circuit?scene';

// The same gallery in the light theme, with Brazilian Portuguese template strings.
export default makeProject({
  scenes: [blocks, basics, circuit, chart],
  variables: {theme: 'lab', locale: 'pt-BR'},
});
