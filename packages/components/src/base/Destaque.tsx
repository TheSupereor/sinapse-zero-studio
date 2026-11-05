import {Rect, RectProps} from '@canvas-commons/2d';
import {easeInOutCubic, ThreadGenerator} from '@canvas-commons/core';
import {useTema} from '@synapticon/brand';

export interface GrifoProps extends RectProps {
  /** Largura final do grifo. */
  width: number;
  /** Já começa varrido (uso estático). Padrão: false. */
  visivel?: boolean;
}

/**
 * Grifo de marca-texto que varre da esquerda para a direita.
 * A posição é a da **borda esquerda** (anchorX = -1).
 *
 * ```tsx
 * <Grifo ref={g} x={-300} y={40} width={420} height={44} />
 * yield* g().varrer();
 * ```
 */
export class Grifo extends Rect {
  private readonly larguraFinal: number;

  public constructor({width, visivel = false, ...props}: GrifoProps) {
    const tema = useTema();
    super({
      height: 44,
      fill: tema.destaque,
      opacity: 0.35,
      anchorX: -1,
      radius: 3,
      ...props,
      width: visivel ? width : 0,
    });
    this.larguraFinal = width;
  }

  public *varrer(duracao = 0.5): ThreadGenerator {
    yield* this.width(this.larguraFinal, duracao, easeInOutCubic);
  }

  public *apagar(duracao = 0.3): ThreadGenerator {
    yield* this.opacity(0, duracao);
    this.width(0).opacity(0.35);
  }
}

export interface MolduraProps extends RectProps {
  visivel?: boolean;
}

/**
 * Caixa de contorno que se desenha em volta de algo.
 *
 * ```tsx
 * <Moldura ref={m} width={500} height={120} />
 * yield* m().desenhar();
 * ```
 */
export class Moldura extends Rect {
  public constructor({visivel = false, ...props}: MolduraProps) {
    const tema = useTema();
    super({
      stroke: tema.destaque,
      lineWidth: 4,
      radius: 6,
      end: visivel ? 1 : 0,
      ...props,
    });
  }

  public *desenhar(duracao = 0.6): ThreadGenerator {
    yield* this.end(1, duracao, easeInOutCubic);
  }

  public *apagar(duracao = 0.4): ThreadGenerator {
    yield* this.start(1, duracao, easeInOutCubic);
    this.start(0).end(0);
  }
}
