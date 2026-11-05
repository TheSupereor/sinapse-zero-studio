import {makeScene2D, Txt} from '@canvas-commons/2d';
import {createRef, waitUntil} from '@canvas-commons/core';
import {fontes, tamanhos, useTema} from '@synapticon/brand';
import {aparecer, Fundo, sumir} from '@synapticon/components';

/*
 * SITUAÇÃO — o "cold open". Mostre o problema acontecendo antes de explicar
 * qualquer coisa (estilo Telecurso). Troque o marcador abaixo pela cena.
 *
 * Fluxo manual:
 *  - cada `waitUntil('nome')` vira uma pílula na linha do tempo do editor;
 *  - arraste a pílula até a palavra certa da narração (a onda do áudio aparece
 *    depois que você liga o `audio` no arquivo de projeto do episódio);
 *  - o editor salva a posição em 01-situacao.meta (versione esse arquivo).
 */
export default makeScene2D(function* (view) {
  const tema = useTema();
  const marcador = createRef<Txt>();

  view.add(<Fundo />);
  view.add(
    <Txt
      ref={marcador}
      text={'SITUAÇÃO'}
      fontFamily={fontes.mono}
      fontSize={tamanhos.subtitulo}
      fill={tema.apagado}
      opacity={0}
    />,
  );

  yield* aparecer(marcador());
  yield* waitUntil('fim');
  yield* sumir(marcador());
});
