import {makeScene2D} from '@canvas-commons/2d';
import {Fundo, retomada} from '@synapticon/components';

// RETOMADA — ligue este episódio a um anterior (não só ao imediatamente anterior).
export default makeScene2D(function* (view) {
  view.add(<Fundo />);
  yield* retomada(view, {
    codigo: 'BT-XX',
    titulo: 'Episódio retomado',
    lembrete: 'O que o espectador precisa lembrar, numa frase.',
  });
});
