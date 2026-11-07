import {makeScene2D} from '@canvas-commons/2d';
import {all, createRef, sequence, waitFor, waitUntil} from '@canvas-commons/core';
import {
  Announcer,
  appear,
  Background,
  Battery,
  Callout,
  LED,
  pace,
  Resistor,
  Switch,
  vanish,
  Wire,
} from '@sinapse-zero/components';

// Showcase 2: a circuit with current, a switch, an LED and the inevitable accident.
export default makeScene2D(function* (view) {
  const battery = createRef<Battery>();
  const sw = createRef<Switch>();
  const resistor = createRef<Resistor>();
  const led = createRef<LED>();
  const wires = Array.from({length: 4}, () => createRef<Wire>());
  const callout = createRef<Callout>();
  const sys = createRef<Announcer>();

  const top = -250;
  const bottom = 250;

  view.add(<Background />);
  view.add(
    <>
      <Battery ref={battery} x={-520} rotation={90} label={'9 V'} labelPosition={[0, 70]} />
      <Switch ref={sw} x={-200} y={top} label={'S1'} />
      <Resistor ref={resistor} x={120} y={top} label={'R1 330 Ω'} />
      <LED ref={led} x={460} y={-40} rotation={90} label={'D1'} labelPosition={[0, 70]} />
      <Wire
        ref={wires[0]}
        points={() => [battery().pin('pos'), [battery().pin('pos').x, top], sw().pin('a')]}
      />
      <Wire ref={wires[1]} points={() => [sw().pin('b'), resistor().pin('a')]} />
      <Wire ref={wires[2]} points={() => [resistor().pin('b'), [led().pin('a').x, top], led().pin('a')]} />
      <Wire
        ref={wires[3]}
        points={() => [
          led().pin('k'),
          [led().pin('k').x, bottom],
          [battery().pin('neg').x, bottom],
          battery().pin('neg'),
        ]}
      />
    </>,
  );
  view.add(
    <Callout
      ref={callout}
      target={() => led().position().add([40, 0])}
      elbow={[120, 80]}
      text={'Lit. For now.'}
    />,
  );
  view.add(<Announcer ref={sys} y={400} width={1100} opacity={0} />);

  // Wires are drawn from scratch.
  wires.forEach(w => w().end(0));
  const symbols = [battery(), sw(), resistor(), led()];
  symbols.forEach(s => s.opacity(0));

  yield* sequence(0.12, ...symbols.map(s => appear(s, pace.normal)));
  yield* sequence(0.15, ...wires.map(w => w().end(1, pace.normal)));

  yield* waitUntil('switch-on');
  yield* sw().close();
  yield* all(...wires.map(w => w().energize()), led().turnOn());
  yield* callout().show();

  yield* waitUntil('no-resistor');
  // Someone "optimized" the circuit: the resistor becomes a piece of wire.
  const bridge = (<Wire points={[resistor().pin('a'), resistor().pin('b')]} end={0} current={1} />) as Wire;
  view.add(bridge);
  yield* all(callout().hide(), vanish(resistor(), pace.normal), bridge.end(1, pace.normal));
  yield* led().burnOut();
  yield* all(...[...wires.map(w => w()), bridge].map(w => w.deenergize(pace.fast)));

  yield* sys().appear();
  yield* sys().say('Component damaged. The cost will be deducted from your salary.');
  yield* waitUntil('end');
  yield* sys().vanish();
  yield* waitFor(0.5);
});
