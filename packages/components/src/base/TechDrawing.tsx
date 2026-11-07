import {Circle, Curve, initial, Node, signal, SVG, SVGProps, Txt} from '@canvas-commons/2d';
import {
  clamp,
  Color,
  createComputed,
  linear,
  SimpleSignal,
  ThreadGenerator,
  TimingFunction,
  Vector2,
} from '@canvas-commons/core';
import {fonts, Theme, useTheme} from '@sinapse-zero/brand';

export interface TechDrawingProps extends SVGProps {
  /** How much of the drawing is plotted, 0–1. Default: 0 (nothing yet). */
  progress?: number;
  /**
   * Map the SVG's colors onto the theme: dark → ink, light → removed, anything else → accent.
   * CAD exports are black on white, which would vanish on the dark theme. Default: true.
   */
  recolor?: boolean;
  /** Multiplies every stroke width. CAD line weights are thin at video scale. Default: 1.5. */
  lineScale?: number;
  /** About how many lines are being drawn at the same time. 1 = one pen. Default: 6. */
  concurrency?: number;
  /** Drawing order. 'document' follows the SVG (usually view by view). Default: 'document'. */
  order?: 'document' | 'left-to-right' | 'top-to-bottom';
  /** Show a glowing pen tip on the line being drawn. Default: true. */
  pen?: boolean;
  /** Render `<text>` elements (dimensions, notes). Default: true. */
  texts?: boolean;
  /** Font used for `<text>` elements. Default: the display font (DIN-like, close to ISO 3098). */
  textFont?: string;
  /** Multiplies text size. 3.5 mm CAD lettering is small once a whole sheet fits a video frame. Default: 1.4. */
  textScale?: number;
  /** Fit inside a [width, height] box, keeping the aspect ratio. */
  fit?: [number, number];
}

interface Item {
  node: Node;
  /** Position used to sort, in the wrapper's (unscaled) space. */
  key: Vector2;
  /** 'line' draws its stroke; 'filled' also fades its fill; 'fade' only fades in. */
  kind: 'line' | 'filled' | 'fade';
}

/**
 * A technical drawing (e.g. a FreeCAD TechDraw export) that plots itself line by line.
 *
 * ```tsx
 * import bracket from '../drawings/bracket.svg?raw';
 *
 * const d = createRef<TechDrawing>();
 * view.add(<TechDrawing ref={d} svg={bracket} fit={[1400, 700]} />);
 * yield* d().plot(4);
 * ```
 *
 * Everything hangs off the `progress` signal, so the drawing scrubs back and forth in the
 * editor, and other elements can follow it: `width={() => 600 * d().progress()}`.
 */
export class TechDrawing extends SVG {
  @initial(0)
  @signal()
  declare public readonly progress: SimpleSignal<number, this>;

  /** Holds the `<text>` elements (they are drawn as `Txt`, not by the SVG parser). */
  public readonly textLayer: Node;

  private readonly items: Item[] = [];
  /** Fraction of the timeline each item spends drawing. */
  private readonly drawSpan: number;
  /** Distance between the start of two consecutive items, on the timeline. */
  private readonly step: number;

  public constructor({
    recolor = true,
    lineScale = 1.5,
    concurrency = 6,
    order = 'document',
    pen = true,
    texts = true,
    textFont = fonts.display,
    textScale = 1.4,
    fit,
    svg,
    ...props
  }: TechDrawingProps) {
    const theme = useTheme();
    const prepared = prepareSvg(typeof svg === 'function' ? svg() : svg);
    // An SVG element without stroke-width means 1 user unit; without this the
    // parser would inherit the node's default of 0.
    super({lineWidth: 1, ...props, svg: prepared.markup});

    if (fit) {
      const size = this.document().size;
      if (size.x > 0 && size.y > 0) {
        this.width(size.x * Math.min(fit[0] / size.x, fit[1] / size.y));
      }
    }

    // Shapes parsed by the SVG node: always Curves (path, rect, circle, line...) or Img.
    for (const node of this.wrapper.children()) {
      if (node instanceof Curve) {
        if (recolor) {
          const stroke = mapColor(node.stroke(), theme);
          if (stroke !== undefined) node.stroke(stroke);
          const fill = mapColor(node.fill(), theme);
          if (fill !== undefined) node.fill(fill);
        }
        node.lineWidth(node.lineWidth() * lineScale);
        const start = node.getPointAtPercentage(0).position.transformAsPoint(node.localToParent());
        this.items.push({node, key: start, kind: node.fill() ? 'filled' : 'line'});
      } else {
        this.items.push({node, key: node.position(), kind: 'fade'});
      }
    }

    // `<text>` is ignored by the SVG parser, so it is rebuilt here as Txt nodes.
    // They live outside the scaled wrapper and are scaled by hand, which keeps the glyphs crisp.
    this.textLayer = new Node({});
    this.add(this.textLayer);
    if (texts) {
      for (const text of prepared.texts) {
        const fill = recolor ? mapColor(new Color(text.fill), theme) : text.fill;
        if (fill === null) continue;
        const txt = (
          <Txt
            text={text.content}
            position={() => text.position.mul(this.wrapper.scale())}
            rotation={text.rotation}
            fontSize={() => text.fontSize * textScale * this.wrapper.scale().x}
            anchorX={text.anchorX}
            fontFamily={textFont}
            fill={fill ?? text.fill}
          />
        ) as Txt;
        this.textLayer.add(txt);
        this.items.push({node: txt, key: text.position, kind: 'fade'});
      }
    }

    if (order === 'left-to-right') {
      this.items.sort((a, b) => a.key.x - b.key.x || a.key.y - b.key.y);
    } else if (order === 'top-to-bottom') {
      this.items.sort((a, b) => a.key.y - b.key.y || a.key.x - b.key.x);
    }

    const n = this.items.length;
    this.drawSpan = n > 0 ? Math.min(1, concurrency / n) : 1;
    this.step = n > 1 ? (1 - this.drawSpan) / (n - 1) : 0;

    this.items.forEach((item, i) => {
      const local = () => this.local(i, this.progress());
      if (item.node instanceof Curve) item.node.end(local);
      if (item.kind !== 'line') item.node.opacity(local);
    });

    if (pen) {
      const active = createComputed(() => this.activeLine());
      this.add(
        <Circle
          size={14}
          fill={theme.accent}
          shadowColor={theme.accent}
          shadowBlur={18}
          opacity={() => (active() ? 1 : 0)}
          position={() => {
            const current = active();
            if (!current) return Vector2.zero;
            const {curve, at} = current;
            return curve
              .getPointAtPercentage(at)
              .position.transformAsPoint(curve.localToParent())
              .transformAsPoint(this.wrapper.localToParent());
          }}
        />,
      );
    }
  }

  /** Plots the whole drawing. Plotters move at constant speed, hence `linear`. */
  public *plot(duration = 4, ease: TimingFunction = linear): ThreadGenerator {
    yield* this.progress(1, duration, ease);
  }

  /** Fades the drawing out. */
  public *erase(duration = 0.5): ThreadGenerator {
    yield* this.opacity(0, duration);
  }

  /** How far item `i` is drawn (0–1) at overall progress `p`. */
  private local(i: number, p: number): number {
    return clamp(0, 1, (p - i * this.step) / this.drawSpan);
  }

  /** The most recently started line that is still being drawn, if any. */
  private activeLine(): {curve: Curve; at: number} | null {
    const p = this.progress();
    if (p <= 0 || p >= 1 || this.items.length === 0) return null;
    const last = this.step > 0 ? Math.min(this.items.length - 1, Math.floor(p / this.step)) : 0;
    for (let i = last; i >= 0; i--) {
      if (i * this.step + this.drawSpan < p) break;
      const item = this.items[i];
      const at = this.local(i, p);
      if (item.node instanceof Curve && at > 0 && at < 1) return {curve: item.node, at};
    }
    return null;
  }
}

/** Maps a CAD color onto the theme. `undefined` = leave it alone (gradients, patterns, none). */
function mapColor(style: unknown, theme: Theme): string | null | undefined {
  if (!(style instanceof Color)) return undefined;
  if (style.alpha() === 0) return null;
  const [lightness] = style.lab();
  if (lightness >= 85) return null;
  if (lightness <= 45) return theme.ink;
  return theme.accent;
}

interface ParsedText {
  content: string;
  /** Position in the wrapper's unscaled space (same space as the parsed shapes). */
  position: Vector2;
  rotation: number;
  fontSize: number;
  anchorX: number;
  fill: string;
}

const SHAPES = 'path, rect, circle, ellipse, line, polyline, polygon';
const INLINED = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
] as const;

/**
 * Makes CAD exports digestible for the Canvas Commons SVG parser, using the browser's own
 * SVG engine:
 *
 * 1. **Styles.** The parser only reads inline styles and attributes, but exports often style
 *    through CSS classes. Every shape gets its computed style written inline, and `<style>`
 *    blocks are removed (left in, they would leak into the editor page).
 * 2. **Text.** The parser ignores `<text>`, so text elements are measured here, with every
 *    nested transform resolved (FreeCAD rotates vertical dimensions), and rebuilt as Txt.
 *    Coordinates are mapped the way the parser maps shapes: viewBox → document size, centered.
 */
function prepareSvg(markup: string): {markup: string; texts: ParsedText[]} {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-100000px;top:0;visibility:hidden;pointer-events:none';
  document.body.appendChild(host);
  try {
    host.innerHTML = markup;
    const root = host.querySelector('svg');
    if (!root) return {markup, texts: []};

    for (const shape of Array.from(root.querySelectorAll<SVGElement>(SHAPES))) {
      if (shape.closest('defs')) continue;
      const computed = getComputedStyle(shape);
      for (const property of INLINED) {
        let value = computed.getPropertyValue(property).trim();
        if (!value || value.startsWith('url(')) continue;
        if (property === 'stroke-dasharray') {
          if (value === 'none') continue;
          value = value.replace(/px/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ');
        } else if (property === 'stroke-width' || property === 'stroke-dashoffset') {
          value = String(parseFloat(value));
        }
        shape.style.setProperty(property, value);
      }
    }

    const texts = readTexts(root);
    root.querySelectorAll('style').forEach(style => style.remove());
    return {markup: root.outerHTML, texts};
  } finally {
    host.remove();
  }
}

function readTexts(root: SVGSVGElement): ParsedText[] {
  const rootMatrix = root.getScreenCTM();
  if (!rootMatrix) return [];
  const hasViewBox = root.hasAttribute('viewBox');
  const hasSize = root.hasAttribute('width') || root.hasAttribute('height');
  if (!hasViewBox && !hasSize) return [];
  const box = root.viewBox.baseVal;
  const size = hasSize
    ? new Vector2(root.width.baseVal.value, root.height.baseVal.value)
    : new Vector2(box.width, box.height);
  const view = hasViewBox ? {x: box.x, y: box.y, w: box.width, h: box.height} : {x: 0, y: 0, w: size.x, h: size.y};
  const scale = new Vector2(size.x / view.w, size.y / view.h);
  const center = new Vector2(view.x + view.w / 2, view.y + view.h / 2);
  const toRoot = rootMatrix.inverse();

  const result: ParsedText[] = [];
  for (const element of Array.from(root.querySelectorAll('text'))) {
    const content = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
    const matrix = element.getScreenCTM();
    if (!content || !matrix) continue;
    const local = toRoot.multiply(matrix);
    const map = (x: number, y: number) => {
      const p = new DOMPoint(x, y).matrixTransform(local);
      return new Vector2((p.x - center.x) * scale.x, (p.y - center.y) * scale.y);
    };

    const firstSpan = element.querySelector('tspan');
    const x = parseFloat(element.getAttribute('x') ?? firstSpan?.getAttribute('x') ?? '0') || 0;
    const y = parseFloat(element.getAttribute('y') ?? firstSpan?.getAttribute('y') ?? '0') || 0;
    const style = getComputedStyle(element);
    const fontSize = parseFloat(style.fontSize) || 16;
    // SVG places text on its baseline; Txt is centered. Lift by ~0.35 em.
    const origin = map(x, y - fontSize * 0.35);
    const along = map(x + 1, y - fontSize * 0.35).sub(origin);

    result.push({
      content,
      position: origin,
      rotation: (Math.atan2(along.y, along.x) * 180) / Math.PI,
      fontSize: fontSize * along.magnitude,
      anchorX: style.textAnchor === 'middle' ? 0 : style.textAnchor === 'end' ? 1 : -1,
      fill: style.fill && style.fill !== 'none' ? style.fill : '#000',
    });
  }
  return result;
}
