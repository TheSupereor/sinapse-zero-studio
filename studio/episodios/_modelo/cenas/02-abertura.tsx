import {makeScene2D} from '@canvas-commons/2d';
import {abertura, Fundo} from '@synapticon/components';

// VINHETA — logo, código e título. Arraste o evento 'abertura-sai' no editor.
export default makeScene2D(function* (view) {
  view.add(<Fundo />);
  yield* abertura(view, {codigo: 'BT-XX', titulo: 'Título do treinamento'});
});
