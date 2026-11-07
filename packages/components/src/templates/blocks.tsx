import {Img, Line, Node, Rect, Txt, View2D} from '@canvas-commons/2d';
import {
  all,
  createRef,
  delay,
  sequence,
  ThreadGenerator,
  waitFor,
  waitUntil,
} from '@canvas-commons/core';
import {fonts, logo, sizes, useTheme, weights} from '@sinapse-zero/brand';
import {Announcer} from '../base/Announcer';
import {HighlightBox} from '../base/Highlight';
import {useStrings} from '../strings';
import {appear, easings, pace, vanish} from '../timing';

/*
 * Episode structure blocks (situation → concept → recap → closing).
 *
 * Every block:
 *  1. enters on its own;
 *  2. waits for a named EVENT: it shows up on the editor timeline and you drag it
 *     to the right moment of the narration;
 *  3. leaves and removes what it created.
 *
 * Use them inside any scene: `yield* chapter(view, {...})`.
 * If one scene uses the same block twice, pass a different `event` to each.
 */

// ───────────────────────────── Opening ─────────────────────────────

export interface OpeningOptions {
  /** Training code. E.g. 'BT-01'. */
  code: string;
  title: string;
  /** Line above the code. Default: localized 'SINAPSE ZERO · BASIC TRAINING'. */
  overline?: string;
  /** Exit event. Default: 'opening-out'. */
  event?: string;
}

/** Opening title: logo, code and title of the training. */
export function* opening(view: View2D, options: OpeningOptions): ThreadGenerator {
  const theme = useTheme();
  const {code, title, overline = useStrings().openingOverline, event = 'opening-out'} = options;
  const group = createRef<Node>();
  const mark = createRef<Img>();
  const texts = createRef<Node>();
  const rule = createRef<Line>();

  view.add(
    <Node ref={group}>
      <Img ref={mark} src={logo('mark', theme.logo)} height={160} y={-170} opacity={0} />
      <Node ref={texts} y={40}>
        <Txt
          text={overline}
          y={-40}
          fontFamily={fonts.display}
          fontSize={sizes.small}
          fontWeight={weights.semibold}
          letterSpacing={4}
          fill={theme.muted}
          opacity={0}
        />
        <Txt text={code} y={40} fontFamily={fonts.mono} fontSize={sizes.subtitle} fill={theme.accent} opacity={0} />
        <Txt
          text={title}
          y={130}
          fontFamily={fonts.display}
          fontSize={sizes.title}
          fontWeight={weights.bold}
          fill={theme.ink}
          opacity={0}
        />
      </Node>
      <Line ref={rule} points={[[-360, 250], [360, 250]]} stroke={theme.accent} lineWidth={4} end={0} />
    </Node>,
  );

  yield* appear(mark(), pace.normal);
  yield* sequence(0.12, ...texts().children().map(t => appear(t, pace.normal)));
  yield* rule().end(1, pace.normal, easings.move);

  yield* waitUntil(event);
  yield* vanish(group(), pace.normal);
  group().remove();
}

// ───────────────────────────── Chapter ─────────────────────────────

export interface ChapterOptions {
  /** Index. E.g. '01'. */
  number: string;
  title: string;
  subtitle?: string;
  /** Exit event. Default: 'chapter-out'. */
  event?: string;
}

/** Chapter card: big orange index, title and rule. */
export function* chapter(view: View2D, options: ChapterOptions): ThreadGenerator {
  const theme = useTheme();
  const {number, title, subtitle, event = 'chapter-out'} = options;
  const group = createRef<Node>();
  const index = createRef<Txt>();
  const name = createRef<Txt>();
  const sub = createRef<Txt>();
  const rule = createRef<Line>();

  view.add(
    <Node ref={group} x={-700}>
      <Txt
        ref={index}
        text={number}
        anchorX={-1}
        y={-60}
        fontFamily={fonts.display}
        fontSize={220}
        fontWeight={weights.bold}
        fill={theme.accent}
        opacity={0}
      />
      <Line ref={rule} points={[[0, 70], [1100, 70]]} stroke={theme.rule} lineWidth={3} end={0} />
      <Txt
        ref={name}
        text={title}
        anchorX={-1}
        y={140}
        fontFamily={fonts.display}
        fontSize={sizes.title}
        fontWeight={weights.semibold}
        fill={theme.ink}
        opacity={0}
      />
      {subtitle && (
        <Txt
          ref={sub}
          text={subtitle}
          anchorX={-1}
          y={220}
          fontFamily={fonts.body}
          fontSize={sizes.body}
          fill={theme.muted}
          opacity={0}
        />
      )}
    </Node>,
  );

  yield* all(
    appear(index(), pace.normal, 40),
    delay(0.15, rule().end(1, pace.slow, easings.move)),
    delay(0.3, appear(name(), pace.normal)),
    subtitle ? delay(0.45, appear(sub(), pace.normal)) : waitFor(0),
  );

  yield* waitUntil(event);
  yield* all(vanish(group(), pace.normal), group().x(-760, pace.normal, easings.exit));
  group().remove();
}

// ───────────────────────────── Recap ─────────────────────────────

export interface RecapOptions {
  /** The training being recalled. E.g. 'BT-00'. */
  code: string;
  title: string;
  /** What to remember, in one sentence. */
  reminder: string;
  /** Label above the title. Default: localized 'RECAP · FILE <code>'. */
  label?: string;
  /** Exit event. Default: 'recap-out'. */
  event?: string;
}

/**
 * "Remember BT-00?": an archive card that ties this episode to an earlier one.
 * Recaps are what stitch the trainings together; use one in every episode.
 */
export function* recap(view: View2D, options: RecapOptions): ThreadGenerator {
  const theme = useTheme();
  const {code, title, reminder, label = useStrings().recapLabel(code), event = 'recap-out'} = options;
  const card = createRef<Rect>();
  const box = createRef<HighlightBox>();

  view.add(
    <Rect
      ref={card}
      layout
      direction={'column'}
      gap={18}
      padding={[40, 56]}
      width={1100}
      fill={theme.panel}
      radius={8}
      opacity={0}
    >
      <Txt text={label} fontFamily={fonts.mono} fontSize={sizes.small} letterSpacing={3} fill={theme.accent} />
      <Txt
        text={title}
        fontFamily={fonts.display}
        fontSize={sizes.subtitle}
        fontWeight={weights.semibold}
        fill={theme.ink}
      />
      <Txt
        text={reminder}
        fontFamily={fonts.body}
        fontSize={sizes.body}
        lineHeight={'135%'}
        fill={theme.muted}
        textWrap
        width={1100 - 112}
      />
    </Rect>,
  );
  view.add(<HighlightBox ref={box} width={() => card().width() + 24} height={() => card().height() + 24} />);

  yield* appear(card(), pace.normal);
  yield* box().trace(pace.slow);

  yield* waitUntil(event);
  yield* all(vanish(card(), pace.normal), box().erase(pace.normal));
  card().remove();
  box().remove();
}

// ───────────────────────────── Closing ─────────────────────────────

export interface ClosingOptions {
  /** The training just completed. E.g. 'BT-01'. */
  code: string;
  /** Next training. E.g. 'BT-02 · Resistor'. */
  next?: string;
  /** SYS//A lines. Default: localized "Basic training <code> complete." + "Proceed to the next module." */
  lines?: string[];
  /** Exit event. Default: 'closing-out'. */
  event?: string;
}

/** The lab system declares the training complete. With its usual enthusiasm. */
export function* closing(view: View2D, options: ClosingOptions): ThreadGenerator {
  const theme = useTheme();
  const text = useStrings();
  const {code, next, lines = text.closingLines(code), event = 'closing-out'} = options;
  const sys = createRef<Announcer>();
  const upNext = createRef<Txt>();

  view.add(<Announcer ref={sys} width={1000} opacity={0} />);
  if (next) {
    view.add(
      <Txt
        ref={upNext}
        text={`${text.next} → ${next}`}
        y={200}
        fontFamily={fonts.display}
        fontSize={sizes.label}
        fontWeight={weights.semibold}
        letterSpacing={3}
        fill={theme.muted}
        opacity={0}
      />,
    );
  }

  yield* sys().appear();
  for (const [i, line] of lines.entries()) {
    yield* i === 0 ? sys().say(line) : sys().append(`\n${line}`);
  }
  if (next) yield* appear(upNext(), pace.normal);

  yield* waitUntil(event);
  yield* all(sys().vanish(pace.normal), next ? vanish(upNext(), pace.normal) : waitFor(0));
  sys().remove();
  upNext()?.remove();
}
