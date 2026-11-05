import {makeScene2D} from '@canvas-commons/2d';
import {waitFor} from '@canvas-commons/core';
import {abertura, capitulo, encerramento, Fundo, retomada} from '@synapticon/components';

// Mostruário 4 — os blocos de estrutura do episódio, em sequência.
export default makeScene2D(function* (view) {
  view.add(<Fundo />);

  yield* abertura(view, {codigo: 'BT-00', titulo: 'Mostruário'});
  yield* capitulo(view, {numero: '01', titulo: 'Componentes base', subtitulo: 'Tudo o que o laboratório tem para mostrar.'});
  yield* retomada(view, {
    codigo: 'BT-00',
    titulo: 'Datasheets',
    lembrete: 'Antes de ligar qualquer coisa, consulte o datasheet. Ele sabe mais do que você e não cobra hora extra.',
  });
  yield* encerramento(view, {codigo: 'BT-00', proximo: 'BT-01 · LED'});
  yield* waitFor(0.5);
});
