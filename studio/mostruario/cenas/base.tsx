import {makeScene2D, Txt} from '@canvas-commons/2d';
import {all, createRef, sequence, waitFor, waitUntil} from '@canvas-commons/core';
import {fontes, tamanhos, useTema} from '@synapticon/brand';
import {
  Anunciador,
  aparecer,
  Callout,
  Cartao,
  Fundo,
  Grifo,
  Icone,
  Marca,
  Moldura,
  ritmo,
} from '@synapticon/components';

// Mostruário 1 — componentes base. Arraste os eventos na linha do tempo para testar.
export default makeScene2D(function* (view) {
  const tema = useTema();
  const fundo = createRef<Fundo>();
  const cartao = createRef<Cartao>();
  const callout = createRef<Callout>();
  const frase = createRef<Txt>();
  const moldura = createRef<Moldura>();
  const sys = createRef<Anunciador>();

  view.add(<Fundo ref={fundo} />);
  view.add(<Marca />);
  view.add(
    <Cartao
      ref={cartao}
      x={-520}
      y={-180}
      rotulo={'Tensão direta'}
      valor={'0,0 V'}
      legenda={'LED vermelho, 20 mA'}
      opacity={0}
    />,
  );
  view.add(<Callout ref={callout} alvo={() => cartao().right().add([10, 0])} cotovelo={[140, -60]} texto={'Do datasheet'} />);
  view.add(
    <Txt
      ref={frase}
      x={300}
      y={60}
      text={'Leia o datasheet antes de ligar.'}
      fontFamily={fontes.display}
      fontSize={tamanhos.subtitulo}
      fill={tema.tinta}
      opacity={0}
    />,
  );
  view.add(<Moldura ref={moldura} x={-520} y={-180} width={460} height={300} />);
  view.add(<Anunciador ref={sys} y={330} opacity={0} />);
  const icones = (['bateria', 'tensao', 'eletronica', 'solda', 'esd', 'calor'] as const).map((nome, i) => (
    <Icone nome={nome} size={88} x={-470 + i * 130} y={120} opacity={0} />
  ));
  view.add(icones);

  yield* fundo().revelar(1);
  yield* aparecer(cartao());
  yield* cartao().contar(0, 2, 1, n => `${n.toFixed(1).replace('.', ',')} V`);

  yield* waitUntil('callout');
  yield* callout().mostrar();

  yield* waitUntil('grifo');
  yield* aparecer(frase());
  // O grifo nasce na hora: só agora a largura da frase é conhecida.
  const grifo = (
    <Grifo x={frase().left().x - 8} y={frase().y() + 16} width={frase().width() + 16} height={26} />
  ) as Grifo;
  view.add(grifo);
  grifo.moveBelow(frase());
  yield* grifo.varrer(ritmo.normal);

  yield* waitUntil('moldura');
  yield* moldura().desenhar();

  yield* waitUntil('icones');
  yield* sequence(0.08, ...icones.map(n => aparecer(n, ritmo.rapido)));

  yield* waitUntil('sys');
  yield* sys().aparecer();
  yield* sys().dizer('Teste de mostruário em andamento. Nenhum estagiário foi ferido. Ainda.');

  yield* waitUntil('fim');
  yield* all(callout().esconder(), moldura().apagar(), sys().sumir());
  yield* waitFor(0.5);
});
