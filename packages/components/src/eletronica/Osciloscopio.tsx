import {Grid, initial, Line, Rect, RectProps, signal, Txt} from '@canvas-commons/2d';
import {SimpleSignal} from '@canvas-commons/core';
import {fontes, tamanhos, useTema} from '@synapticon/brand';

/** Forma de onda: recebe x ∈ [0, 1] (largura da tela) e t (s); devolve −1…1. */
export type Onda = (x: number, t: number) => number;

export const ondas = {
  senoide: (ciclos = 2): Onda => (x, t) => Math.sin(2 * Math.PI * (ciclos * x - t)),
  quadrada: (ciclos = 2): Onda => (x, t) => (Math.sin(2 * Math.PI * (ciclos * x - t)) >= 0 ? 0.8 : -0.8),
  continua: (nivel = 0.5): Onda => () => nivel,
  /** Meia-onda retificada: a parte negativa some (diodo!). */
  meiaOnda: (ciclos = 2): Onda => (x, t) => Math.max(0, Math.sin(2 * Math.PI * (ciclos * x - t))),
};

export interface OsciloscopioProps extends RectProps {
  /** Padrão: senoide de 2 ciclos. */
  onda?: Onda;
  /** Multiplicador de amplitude, 0–1. Anime para "ligar" o sinal. Padrão: 1. */
  ganho?: number;
  /** Velocidade de rolagem, ciclos/s. 0 = congelado. Padrão: 0.5. */
  rolagem?: number;
  /** Legenda no canto. Ex.: 'CH1 2 V/div'. */
  canal?: string;
  cor?: string;
}

/**
 * Tela de osciloscópio com grade e traço que rola sozinho.
 *
 * ```tsx
 * <Osciloscopio ref={o} onda={ondas.meiaOnda()} canal={'CH1 · saída do retificador'} />
 * yield* o().ganho(1, 0.8);
 * ```
 */
export class Osciloscopio extends Rect {
  @initial(1)
  @signal()
  declare public readonly ganho: SimpleSignal<number, this>;

  @initial(0.5)
  @signal()
  declare public readonly rolagem: SimpleSignal<number, this>;

  public constructor({onda = ondas.senoide(), canal, cor, width = 720, height = 440, ...props}: OsciloscopioProps) {
    const tema = useTema();
    super({
      width,
      height,
      fill: tema.painel,
      stroke: tema.filete,
      lineWidth: 3,
      radius: 10,
      clip: true,
      ...props,
    });
    const w = Number(width);
    const h = Number(height);
    const amostras = 240;
    const corTraco = cor ?? tema.ciano;

    this.add(
      <>
        <Grid width={w} height={h} spacing={[w / 10, h / 8]} stroke={tema.grade} lineWidth={2} />
        <Line points={[[-w / 2, 0], [w / 2, 0]]} stroke={tema.filete} lineWidth={2} />
        <Line
          points={() => {
            const t = this.view().globalTime() * this.rolagem();
            const pontos: [number, number][] = [];
            for (let i = 0; i <= amostras; i++) {
              const x = i / amostras;
              pontos.push([-w / 2 + x * w, -onda(x, t) * this.ganho() * h * 0.4]);
            }
            return pontos;
          }}
          stroke={corTraco}
          lineWidth={5}
          lineJoin={'round'}
          shadowColor={corTraco}
          shadowBlur={14}
        />
        {canal && (
          <Txt
            text={canal}
            position={[-w / 2 + 20, -h / 2 + 20]}
            anchor={[-1, -1]}
            fontFamily={fontes.mono}
            fontSize={tamanhos.mini}
            fill={corTraco}
          />
        )}
      </>,
    );
  }
}
