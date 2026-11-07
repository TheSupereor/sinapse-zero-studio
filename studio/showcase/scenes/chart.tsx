import {makeScene2D} from '@canvas-commons/2d';
import {all, createRef, waitFor, waitUntil} from '@canvas-commons/core';
import {logo, useTheme} from '@sinapse-zero/brand';
import {
  appear,
  Background,
  Chart,
  Oscilloscope,
  ScreenshotZoom,
  vanish,
  waves,
} from '@sinapse-zero/components';

/** Approximate I–V curve of a red LED (mA as a function of V). */
const ledCurve = (v: number) => Math.max(0, (Math.exp((v - 1.6) * 4.48) - 1) * 4);

// Showcase 3: chart, oscilloscope and screenshot zoom.
export default makeScene2D(function* (view) {
  const theme = useTheme();
  const chart = createRef<Chart>();
  const scope = createRef<Oscilloscope>();
  const screenshot = createRef<ScreenshotZoom>();

  view.add(<Background />);
  view.add(
    <Chart
      ref={chart}
      x={-380}
      y={-20}
      plotWidth={760}
      plotHeight={520}
      rangeX={[0, 3]}
      rangeY={[0, 30]}
      stepX={0.5}
      stepY={5}
      labelX={'Voltage (V)'}
      labelY={'Current (mA)'}
      startHidden
    />,
  );
  view.add(
    <Oscilloscope
      ref={scope}
      x={520}
      y={-180}
      width={640}
      height={380}
      wave={waves.halfWave()}
      gain={0}
      channel={'CH1 · after the diode'}
    />,
  );
  // Any image works here: a datasheet, a paper, a post. The logo stands in for one.
  view.add(
    <ScreenshotZoom ref={screenshot} src={logo('full', theme.logo)} x={520} y={250} width={640} height={300} opacity={0} />,
  );

  yield* chart().reveal();
  yield* chart().plot(ledCurve, {duration: 1.6});

  yield* waitUntil('mark');
  yield* chart().markAt(2, ledCurve(2), {label: '2.0 V → 20 mA'});

  yield* waitUntil('scope');
  yield* scope().gain(1, 0.8);

  yield* waitUntil('screenshot');
  yield* appear(screenshot());
  // Regions are in pixels of the image file: here, the name under the mark.
  yield* screenshot().focus({x: 0, y: 880, w: 1172, h: 440});
  yield* screenshot().highlightRegion({x: -12, y: 900, w: 1196, h: 192});

  yield* waitUntil('end');
  yield* screenshot().focus(null);
  yield* all(vanish(screenshot()), scope().gain(0, 0.6));
  yield* waitFor(0.5);
});
