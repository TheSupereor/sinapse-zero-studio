import {makeScene2D} from '@canvas-commons/2d';
import {all, createRef, sequence, waitFor, waitUntil} from '@canvas-commons/core';
import {
  Anunciador,
  aparecer,
  Bateria,
  Callout,
  Chave,
  Fio,
  Fundo,
  LED,
  Resistor,
  ritmo,
  sumir,
} from '@synapticon/components';

// Mostruário 2 — circuito com corrente, chave, LED e o inevitável acidente.
export default makeScene2D(function* (view) {
  const bat = createRef<Bateria>();
  const chave = createRef<Chave>();
  const r = createRef<Resistor>();
  const led = createRef<LED>();
  const fios = Array.from({length: 4}, () => createRef<Fio>());
  const callout = createRef<Callout>();
  const sys = createRef<Anunciador>();

  const topo = -250;
  const base = 250;

  view.add(<Fundo />);
  view.add(
    <>
      <Bateria ref={bat} x={-520} rotation={90} rotulo={'9 V'} posicaoRotulo={[0, 70]} />
      <Chave ref={chave} x={-200} y={topo} rotulo={'S1'} />
      <Resistor ref={r} x={120} y={topo} rotulo={'R1 330 Ω'} />
      <LED ref={led} x={460} y={-40} rotation={90} rotulo={'D1'} posicaoRotulo={[0, 70]} />
      <Fio
        ref={fios[0]}
        points={() => [bat().pino('pos'), [bat().pino('pos').x, topo], chave().pino('a')]}
      />
      <Fio ref={fios[1]} points={() => [chave().pino('b'), r().pino('a')]} />
      <Fio
        ref={fios[2]}
        points={() => [r().pino('b'), [led().pino('a').x, topo], led().pino('a')]}
      />
      <Fio
        ref={fios[3]}
        points={() => [
          led().pino('k'),
          [led().pino('k').x, base],
          [bat().pino('neg').x, base],
          bat().pino('neg'),
        ]}
      />
    </>,
  );
  view.add(<Callout ref={callout} alvo={() => led().position().add([40, 0])} cotovelo={[120, 80]} texto={'Aceso. Por enquanto.'} />);
  view.add(<Anunciador ref={sys} y={400} width={1100} opacity={0} />);

  // Começa com os fios desenhados do zero.
  fios.forEach(f => f().end(0));
  const simbolos = [bat(), chave(), r(), led()];
  simbolos.forEach(s => s.opacity(0));

  yield* sequence(0.12, ...simbolos.map(s => aparecer(s, ritmo.normal)));
  yield* sequence(0.15, ...fios.map(f => f().end(1, ritmo.normal)));

  yield* waitUntil('liga');
  yield* chave().fechar();
  yield* all(...fios.map(f => f().ligar()), led().acender());
  yield* callout().mostrar();

  yield* waitUntil('sem-resistor');
  // Alguém "otimizou" o circuito: o resistor vira um pedaço de fio.
  const ponte = (<Fio points={[r().pino('a'), r().pino('b')]} end={0} corrente={1} />) as Fio;
  view.add(ponte);
  yield* all(callout().esconder(), sumir(r(), ritmo.normal), ponte.end(1, ritmo.normal));
  yield* led().queimar();
  yield* all(...[...fios.map(f => f()), ponte].map(f => f.desligar(ritmo.rapido)));

  yield* sys().aparecer();
  yield* sys().dizer('Componente danificado. O valor será descontado do seu salário.');
  yield* waitUntil('fim');
  yield* sys().sumir();
  yield* waitFor(0.5);
});
