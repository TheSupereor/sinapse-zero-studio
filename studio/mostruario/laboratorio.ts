import {makeProject} from '@canvas-commons/core';

import base from './cenas/base?scene';
import blocos from './cenas/blocos?scene';
import circuito from './cenas/circuito?scene';
import grafico from './cenas/grafico?scene';

// Mesmas cenas do mostruário, no tema claro (laboratorio).
export default makeProject({
  scenes: [blocos, base, circuito, grafico],
  variables: {tema: 'laboratorio'},
});
