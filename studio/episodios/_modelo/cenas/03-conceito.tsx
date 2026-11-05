import {makeScene2D} from '@canvas-commons/2d';
import {waitUntil} from '@canvas-commons/core';
import {capitulo, Fundo} from '@synapticon/components';

/*
 * CONCEITO — a explicação. Comece com um cartão de capítulo e monte a
 * explicação com os componentes (veja studio/mostruario/cenas para exemplos).
 * Duplique este arquivo para cada capítulo (03a, 03b...) e registre-o no arquivo de projeto do episódio.
 */
export default makeScene2D(function* (view) {
  view.add(<Fundo />);
  yield* capitulo(view, {numero: '01', titulo: 'Nome do capítulo'});

  // ... sua explicação aqui ...

  yield* waitUntil('fim');
});
