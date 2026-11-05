import {makeProject} from '@canvas-commons/core';

import situacao from './cenas/01-situacao?scene';
import abertura from './cenas/02-abertura?scene';
import conceito from './cenas/03-conceito?scene';
import retomada from './cenas/04-retomada?scene';
import encerramento from './cenas/05-encerramento?scene';

// 1) Grave a narração no Audacity e exporte para ./audio/narracao.wav
// 2) Descomente as duas linhas abaixo. A onda aparece na linha do tempo do editor.
// import narracao from './audio/narracao.wav';

export default makeProject({
  scenes: [situacao, abertura, conceito, retomada, encerramento],
  // audio: narracao,
  variables: {
    // 'blueprint' (escuro) ou 'laboratorio' (claro)
    tema: 'blueprint',
  },
});
