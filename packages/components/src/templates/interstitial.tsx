import {Line, Node, Rect, Txt, View2D} from '@canvas-commons/2d';
import {
  all,
  createRef,
  easeInOutCubic,
  PossibleVector2,
  sequence,
  ThreadGenerator,
  waitUntil,
} from '@canvas-commons/core';
import {fonts, useTheme, weights} from '@synapticon/brand';
import {TechDrawing, TechDrawingProps} from '../base/TechDrawing';
import {useStrings} from '../strings';
import {appear, pace} from '../timing';

export interface DrawingInterstitialOptions {
  /** SVG markup of the drawing: `import bracket from './drawings/bracket.svg?raw'`. */
  drawing: string;
  /** Part name for the title block. */
  title: string;
  /** Drawing number. E.g. 'BT-01-003'. */
  code?: string;
  /** Default: '1:1'. */
  scale?: string;
  /** Default: '1/1'. */
  sheet?: string;
  /** Status lines shown in turn while the drawing plots. Default: localized dry ones. */
  messages?: string[];
  /** Plotting time, s. Default: 4. */
  duration?: number;
  /** Exit event. Default: 'interstitial-out'. */
  event?: string;
  /** Passed to the TechDrawing (lineScale, order, concurrency...). */
  drawingProps?: Partial<Omit<TechDrawingProps, 'svg'>>;
}

const COLUMNS = 8;
const ROWS = 4;

/**
 * A loading-screen interstitial: an engineering drawing sheet (border, zone marks, title
 * block) whose drawing plots itself while a progress bar fills and a status line rotates
 * through dry messages. Then it waits for its event and fades out.
 *
 * Use it between chapters, or render it alone as a preset (see studio/presets).
 *
 * ```tsx
 * import bracket from '../drawings/bracket.svg?raw';
 * yield* drawingInterstitial(view, {drawing: bracket, title: 'LED bracket', code: 'BT-01-003'});
 * ```
 */
export function* drawingInterstitial(view: View2D, options: DrawingInterstitialOptions): ThreadGenerator {
  const theme = useTheme();
  const text = useStrings().interstitial;
  const {
    drawing,
    title,
    code = '—',
    scale = '1:1',
    sheet = '1/1',
    messages = text.messages,
    duration = 4,
    event = 'interstitial-out',
    drawingProps = {},
  } = options;

  const size = view.size();
  const outer = {w: size.x - 80, h: size.y - 80};
  const inner = {w: outer.w - 64, h: outer.h - 64};
  const right = inner.w / 2;
  const bottom = inner.h / 2;

  const group = createRef<Node>();
  const frames = [createRef<Rect>(), createRef<Rect>()];
  const zones = createRef<Node>();
  const titleBlock = createRef<Node>();
  const status = createRef<Node>();
  const plot = createRef<TechDrawing>();

  const mono = {fontFamily: fonts.mono, fill: theme.muted};
  const progress = () => plot().progress();

  // Zone marks: numbers along the top and bottom, letters down the sides, like a real sheet.
  const zoneMarks: Node[] = [];
  const band = (outer.h - inner.h) / 4;
  for (let i = 0; i < COLUMNS; i++) {
    const x = -right + (i + 0.5) * (inner.w / COLUMNS);
    for (const s of [-1, 1]) {
      zoneMarks.push(<Txt {...mono} text={`${i + 1}`} fontSize={18} position={[x, s * (bottom + band)]} />);
      if (i > 0) {
        const tx = -right + i * (inner.w / COLUMNS);
        zoneMarks.push(tick([tx, s * bottom], [tx, s * (outer.h / 2)], theme.rule));
      }
    }
  }
  for (let i = 0; i < ROWS; i++) {
    const y = -bottom + (i + 0.5) * (inner.h / ROWS);
    for (const s of [-1, 1]) {
      zoneMarks.push(
        <Txt {...mono} text={String.fromCharCode(65 + i)} fontSize={18} position={[s * (right + band), y]} />,
      );
      if (i > 0) {
        const ty = -bottom + i * (inner.h / ROWS);
        zoneMarks.push(tick([s * right, ty], [s * (outer.w / 2), ty], theme.rule));
      }
    }
  }

  // Title block in the bottom-right corner: three rows, the last one split in three.
  const block = {w: 640, row: 60};
  const left = right - block.w;
  const top = bottom - block.row * 3;
  const cell = (x: number, y: number, label: string, value: string) => (
    <Node>
      <Txt {...mono} text={label} fontSize={15} letterSpacing={1} anchor={[-1, -1]} position={[x + 12, y + 8]} />
      <Txt
        text={value}
        fontFamily={fonts.display}
        fontSize={26}
        fontWeight={weights.semibold}
        fill={theme.ink}
        anchorX={-1}
        position={[x + 12, y + 38]}
      />
    </Node>
  );
  const thirds = [left, left + 240, left + 440];

  view.add(
    <Node ref={group}>
      <Rect ref={frames[0]} width={outer.w} height={outer.h} stroke={theme.muted} lineWidth={3} end={0} />
      <Rect ref={frames[1]} width={inner.w} height={inner.h} stroke={theme.muted} lineWidth={2} end={0} />
      <Node ref={zones} opacity={0}>
        {zoneMarks}
      </Node>

      <TechDrawing
        ref={plot}
        svg={drawing}
        y={-70}
        fit={[inner.w - 200, inner.h - 250]}
        {...drawingProps}
      />

      <Node ref={titleBlock} opacity={0}>
        <Rect
          width={block.w}
          height={block.row * 3}
          position={[left + block.w / 2, top + block.row * 1.5]}
          fill={theme.panel}
          stroke={theme.muted}
          lineWidth={2}
        />
        {tick([left, top + block.row], [right, top + block.row], theme.muted)}
        {tick([left, top + block.row * 2], [right, top + block.row * 2], theme.muted)}
        {tick([thirds[1], top + block.row * 2], [thirds[1], bottom], theme.muted)}
        {tick([thirds[2], top + block.row * 2], [thirds[2], bottom], theme.muted)}
        <Txt
          text={'SYNAPTICON LABORATORIES'}
          fontFamily={fonts.display}
          fontSize={26}
          fontWeight={weights.bold}
          letterSpacing={3}
          fill={theme.accent}
          anchorX={-1}
          position={[left + 12, top + block.row / 2]}
        />
        {cell(left, top + block.row, text.title, title.toUpperCase())}
        {cell(thirds[0], top + block.row * 2, text.drawingNo, code)}
        {cell(thirds[1], top + block.row * 2, text.scale, scale)}
        {cell(thirds[2], top + block.row * 2, text.sheet, sheet)}
      </Node>

      <Node ref={status} opacity={0} position={[-right + 32, bottom - 72]}>
        <Txt
          fontFamily={fonts.mono}
          fontSize={22}
          anchorX={-1}
          fill={() => (progress() >= 1 ? theme.accent : theme.ink)}
          text={() => {
            const p = progress();
            if (p >= 1) return text.ready;
            const i = Math.min(messages.length - 1, Math.floor(p * messages.length));
            return `${text.loading} · ${messages[i]}`;
          }}
        />
        <Rect anchorX={-1} y={40} width={560} height={10} fill={theme.rule} />
        <Rect anchorX={-1} y={40} width={() => 560 * progress()} height={10} fill={theme.accent} />
        <Txt
          fontFamily={fonts.mono}
          fontSize={22}
          anchorX={-1}
          position={[580, 40]}
          fill={theme.muted}
          text={() => `${String(Math.round(progress() * 100)).padStart(3, '0')}%`}
        />
      </Node>
    </Node>,
  );

  yield* all(
    ...frames.map(f => f().end(1, pace.slow, easeInOutCubic)),
    zones().opacity(1, pace.slow),
  );
  yield* sequence(0.15, appear(titleBlock(), pace.normal), appear(status(), pace.normal));
  yield* plot().plot(duration);

  yield* waitUntil(event);
  yield* group().opacity(0, pace.normal);
  group().remove();
}

function tick(from: PossibleVector2, to: PossibleVector2, color: string) {
  return <Line points={[from, to]} stroke={color} lineWidth={2} />;
}
