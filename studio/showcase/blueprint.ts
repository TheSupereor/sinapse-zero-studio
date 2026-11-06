import {makeProject} from '@canvas-commons/core';

import basics from './scenes/basics?scene';
import blocks from './scenes/blocks?scene';
import chart from './scenes/chart?scene';
import circuit from './scenes/circuit?scene';
import transitions from './scenes/transitions?scene';

// Component gallery, dark theme. The same scenes run in the light theme in lab.ts.
export default makeProject({
  scenes: [blocks, basics, circuit, chart, transitions],
  variables: {theme: 'blueprint', locale: 'en'},
});
