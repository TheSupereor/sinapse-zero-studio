import {Grid, Rect, RectProps} from '@canvas-commons/2d';
import {createRef, easeInOutCubic, ThreadGenerator, useScene} from '@canvas-commons/core';
import {useTema} from '@synapticon/brand';

export interface FundoProps extends RectProps {
  /** Mostrar a grade. Padrão: true. */
  grade?: boolean;
  /** Distância entre as linhas da grade, em px. Padrão: 80. */
  espacamento?: number;
}

/**
 * Fundo do tema com grade de prancheta. Ocupa o quadro inteiro.
 *
 * ```tsx
 * view.add(<Fundo />);
 * ```
 */
export class Fundo extends Rect {
  public readonly grade = createRef<Grid>();

  public constructor({grade = true, espacamento = 80, ...props}: FundoProps) {
    const tema = useTema();
    const tamanho = useScene().getSize();
    super({width: tamanho.x, height: tamanho.y, fill: tema.fundo, ...props});

    if (grade) {
      this.add(
        <Grid
          ref={this.grade}
          width={tamanho.x}
          height={tamanho.y}
          spacing={espacamento}
          stroke={tema.grade}
          lineWidth={2}
        />,
      );
    }
  }

  /** Desenha a grade a partir do centro. */
  public *revelar(duracao = 1): ThreadGenerator {
    const grade = this.grade();
    if (!grade) return;
    grade.start(0.5).end(0.5);
    yield* grade.start(0, duracao, easeInOutCubic);
  }
}
