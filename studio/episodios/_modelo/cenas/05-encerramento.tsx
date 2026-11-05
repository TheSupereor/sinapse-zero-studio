import {makeScene2D} from '@canvas-commons/2d';
import {encerramento, Fundo, Marca} from '@synapticon/components';

// ENCERRAMENTO — o SYS//A declara o treinamento concluído.
export default makeScene2D(function* (view) {
  view.add(<Fundo />);
  view.add(<Marca />);
  yield* encerramento(view, {codigo: 'BT-XX', proximo: 'BT-YY · Próximo tema'});
});
