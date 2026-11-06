import {Img, Node, Rect, RectProps} from '@canvas-commons/2d';
import {all, createRef, easeInOutCubic, ThreadGenerator, Vector2} from '@canvas-commons/core';
import {useTheme} from '@synapticon/brand';
import {HighlightBar} from './Highlight';

/** A region of the image, in pixels of the original file (measure it in any image editor). */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ScreenshotZoomProps extends RectProps {
  /** Imported image: `import datasheet from '../images/led.png'`. */
  src: string;
  width?: number;
  height?: number;
}

/**
 * A window showing a screenshot (datasheet, paper, post) that zooms in and highlights passages.
 *
 * ```tsx
 * const s = createRef<ScreenshotZoom>();
 * view.add(<ScreenshotZoom ref={s} src={datasheet} />);
 * yield* s().focus({x: 120, y: 400, w: 600, h: 180});
 * yield* s().highlightRegion({x: 140, y: 450, w: 300, h: 40});
 * yield* s().focus(null); // back to the whole image
 * ```
 */
export class ScreenshotZoom extends Rect {
  /** Node holding the image and the highlights (this is what moves and scales). */
  public readonly sheet = createRef<Node>();
  public readonly image = createRef<Img>();
  private readonly windowWidth: number;
  private readonly windowHeight: number;

  public constructor({src, width = 1200, height = 680, ...props}: ScreenshotZoomProps) {
    const theme = useTheme();
    super({
      width,
      height,
      clip: true,
      fill: theme.panel,
      stroke: theme.rule,
      lineWidth: 2,
      radius: 6,
      ...props,
    });
    this.windowWidth = width;
    this.windowHeight = height;
    this.add(
      <Node ref={this.sheet}>
        <Img ref={this.image} src={src} width={width} />
      </Node>,
    );
  }

  /** Image pixels → local coordinates of the sheet. */
  public toLocal(px: number, py: number): Vector2 {
    const natural = this.image().naturalSize();
    const k = this.windowWidth / natural.x;
    return new Vector2((px - natural.x / 2) * k, (py - natural.y / 2) * k);
  }

  /** Frames the region (or the whole image, with `null`). */
  public *focus(region: Region | null, duration = 1): ThreadGenerator {
    yield* this.loaded();
    if (!region) {
      yield* all(
        this.sheet().scale(1, duration, easeInOutCubic),
        this.sheet().position(Vector2.zero, duration, easeInOutCubic),
      );
      return;
    }
    const k = this.windowWidth / this.image().naturalSize().x;
    const zoom =
      Math.min(this.windowWidth / (region.w * k), this.windowHeight / (region.h * k)) * 0.92;
    const center = this.toLocal(region.x + region.w / 2, region.y + region.h / 2);
    yield* all(
      this.sheet().scale(zoom, duration, easeInOutCubic),
      this.sheet().position(center.scale(-zoom), duration, easeInOutCubic),
    );
  }

  /**
   * Creates a highlight (not yet swept) over the region and returns it.
   * The image must be loaded: call it after `yield* s().loaded()` (or after any `focus`).
   */
  public highlight(region: Region): HighlightBar {
    const k = this.windowWidth / this.image().naturalSize().x;
    const leftEdge = this.toLocal(region.x, region.y + region.h / 2);
    const bar = (<HighlightBar position={leftEdge} width={region.w * k} height={region.h * k} />) as HighlightBar;
    this.sheet().add(bar);
    return bar;
  }

  /** Highlights the region. */
  public *highlightRegion(region: Region, duration = 0.5): ThreadGenerator {
    yield* this.loaded();
    yield* this.highlight(region).sweep(duration);
  }

  /** Waits for the image to load (required before measuring it). */
  public *loaded(): ThreadGenerator {
    yield this.image();
  }
}
