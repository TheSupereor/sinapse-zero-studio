import {makeScene2D} from '@canvas-commons/2d';
import {all, createRef, waitFor, waitUntil} from '@canvas-commons/core';
import {logo, useTema} from '@synapticon/brand';
import {
  aparecer,
  Fundo,
  Grafico,
  ondas,
  Osciloscopio,
  PrintZoom,
  sumir,
} from '@synapticon/components';

/** Curva I×V aproximada de um LED vermelho (mA em função de V). */
const curvaLed = (v: number) => Math.max(0, (Math.exp((v - 1.6) * 4.48) - 1) * 4);

// Mostruário 3 — gráfico, osciloscópio e zoom em print.
export default makeScene2D(function* (view) {
  const tema = useTema();
  const grafico = createRef<Grafico>();
  const osc = createRef<Osciloscopio>();
  const print = createRef<PrintZoom>();

  view.add(<Fundo />);
  view.add(
    <Grafico
      ref={grafico}
      x={-380}
      y={-20}
      largura={760}
      altura={520}
      faixaX={[0, 3]}
      faixaY={[0, 30]}
      passoX={0.5}
      passoY={5}
      rotuloX={'Tensão (V)'}
      rotuloY={'Corrente (mA)'}
      oculto
    />,
  );
  view.add(
    <Osciloscopio ref={osc} x={520} y={-180} width={640} height={380} onda={ondas.meiaOnda()} ganho={0} canal={'CH1 · após o diodo'} />,
  );
  view.add(<PrintZoom ref={print} src={logo('full', tema.logo)} x={520} y={250} width={640} height={300} opacity={0} />);

  yield* grafico().revelar();
  yield* grafico().plotar(curvaLed, {duracao: 1.6});

  yield* waitUntil('marca');
  yield* grafico().marcar(2, curvaLed(2), {rotulo: '2,0 V → 20 mA'});

  yield* waitUntil('osciloscopio');
  yield* osc().ganho(1, 0.8);

  yield* waitUntil('print');
  yield* aparecer(print());
  yield* print().focar({x: 0, y: 0, w: 420, h: 400});
  yield* print().grifar({x: 40, y: 300, w: 320, h: 60});

  yield* waitUntil('fim');
  yield* print().focar(null);
  yield* all(sumir(print()), osc().ganho(0, 0.6));
  yield* waitFor(0.5);
});
