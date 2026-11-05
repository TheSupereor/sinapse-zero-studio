import {makeProject} from '@canvas-commons/core';

import base from './cenas/base?scene';
import blocos from './cenas/blocos?scene';
import circuito from './cenas/circuito?scene';
import grafico from './cenas/grafico?scene';

// Mostruário no tema escuro. O mesmo conjunto roda claro em laboratorio.ts.
export default makeProject({
  scenes: [blocos, base, circuito, grafico],
  variables: {tema: 'blueprint'},
});
