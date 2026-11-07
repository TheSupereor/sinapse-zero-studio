import {makeScene2D, Txt} from '@canvas-commons/2d';
import {all, createRef, sequence, waitFor, waitUntil} from '@canvas-commons/core';
import {fonts, sizes, useTheme} from '@sinapse-zero/brand';
import {
  Announcer,
  appear,
  Background,
  BrandIcon,
  Callout,
  HighlightBar,
  HighlightBox,
  LogoMark,
  pace,
  StatCard,
} from '@sinapse-zero/components';

// Showcase 1: the visual basics. Drag the events on the timeline to try them.
export default makeScene2D(function* (view) {
  const theme = useTheme();
  const background = createRef<Background>();
  const card = createRef<StatCard>();
  const callout = createRef<Callout>();
  const sentence = createRef<Txt>();
  const box = createRef<HighlightBox>();
  const sys = createRef<Announcer>();

  view.add(<Background ref={background} />);
  view.add(<LogoMark />);
  view.add(
    <StatCard
      ref={card}
      x={-520}
      y={-180}
      label={'Forward voltage'}
      value={'0.0 V'}
      caption={'Red LED, 20 mA'}
      opacity={0}
    />,
  );
  view.add(
    <Callout
      ref={callout}
      target={() => card().right().add([10, 0])}
      elbow={[140, -60]}
      text={'From the datasheet'}
    />,
  );
  view.add(
    <Txt
      ref={sentence}
      x={300}
      y={60}
      text={'Read the datasheet before powering up.'}
      fontFamily={fonts.display}
      fontSize={sizes.subtitle}
      fill={theme.ink}
      opacity={0}
    />,
  );
  view.add(<HighlightBox ref={box} x={-520} y={-180} width={460} height={300} />);
  view.add(<Announcer ref={sys} y={330} opacity={0} />);
  const icons = (['battery', 'voltage', 'electronics', 'soldering', 'esd', 'heat'] as const).map((icon, i) => (
    <BrandIcon icon={icon} size={88} x={-470 + i * 130} y={120} opacity={0} />
  ));
  view.add(icons);

  yield* background().reveal(1);
  yield* appear(card());
  yield* card().countTo(0, 2, 1, n => `${n.toFixed(1)} V`);

  yield* waitUntil('callout');
  yield* callout().show();

  yield* waitUntil('highlight');
  yield* appear(sentence());
  // The highlight is created now: only now is the sentence's width known.
  const highlight = (
    <HighlightBar
      x={sentence().left().x - 8}
      y={sentence().y() + 16}
      width={sentence().width() + 16}
      height={26}
    />
  ) as HighlightBar;
  view.add(highlight);
  highlight.moveBelow(sentence());
  yield* highlight.sweep(pace.normal);

  yield* waitUntil('box');
  yield* box().trace();

  yield* waitUntil('icons');
  yield* sequence(0.08, ...icons.map(n => appear(n, pace.fast)));

  yield* waitUntil('sys');
  yield* sys().appear();
  yield* sys().say('Showcase test in progress. No interns were harmed. Yet.');

  yield* waitUntil('end');
  yield* all(callout().hide(), box().erase(), sys().vanish());
  yield* waitFor(0.5);
});
