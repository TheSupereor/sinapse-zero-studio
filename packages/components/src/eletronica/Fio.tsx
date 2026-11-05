import {colorSignal, initial, Line, LineProps, signal} from '@canvas-commons/2d';
import {
  ColorSignal,
  easeInOutCubic,
  PossibleColor,
  SignalValue,
  SimpleSignal,
  ThreadGenerator,
} from '@canvas-commons/core';
import {useTema} from '@synapticon/brand';

export interface FioProps extends LineProps {
  /** Visibilidade dos pontos de corrente, 0–1. Padrão: 0 (sem corrente). */
  corrente?: SignalValue<number>;
  /**
   * Velocidade dos pontos em px/s. Negativo inverte o sentido.
   * Não anime este valor (os pontos dão saltos); para mudar a "força" da
   * corrente, troque de valor entre cenas ou anime `fase` à mão.
   */
  velocidade?: SignalValue<number>;
  /** Distância entre pontos, px. Padrão: 56. */
  espacamento?: SignalValue<number>;
  /** Raio de cada ponto, px. Padrão: 7. */
  raioPonto?: SignalValue<number>;
  corPontos?: SignalValue<PossibleColor>;
  /**
   * Deslocamento manual dos pontos, px. Se definido (não nulo), substitui o
   * movimento automático: anime-o como quiser.
   */
  fase?: SignalValue<number | null>;
}

/**
 * Fio com pontos de corrente que andam sozinhos (sentido convencional,
 * do primeiro ponto para o último). Os pontos só aparecem no trecho já desenhado.
 *
 * ```tsx
 * <Fio ref={f} points={() => [bat().pino('pos'), r().pino('a')]} />
 * yield* f().ligar();         // pontos aparecem e correm
 * yield* f().end(1, 0.8);     // ou desenhe o fio primeiro (end começa em 1)
 * ```
 */
export class Fio extends Line {
  @initial(0)
  @signal()
  declare public readonly corrente: SimpleSignal<number, this>;

  @initial(140)
  @signal()
  declare public readonly velocidade: SimpleSignal<number, this>;

  @initial(56)
  @signal()
  declare public readonly espacamento: SimpleSignal<number, this>;

  @initial(7)
  @signal()
  declare public readonly raioPonto: SimpleSignal<number, this>;

  @colorSignal()
  declare public readonly corPontos: ColorSignal<this>;

  @initial(null)
  @signal()
  declare public readonly fase: SimpleSignal<number | null, this>;

  public constructor(props: FioProps) {
    const tema = useTema();
    super({
      stroke: tema.tinta,
      lineWidth: 6,
      lineCap: 'round',
      lineJoin: 'round',
      corPontos: tema.destaque,
      ...props,
    });
  }

  public *ligar(duracao = 0.4): ThreadGenerator {
    yield* this.corrente(1, duracao, easeInOutCubic);
  }

  public *desligar(duracao = 0.4): ThreadGenerator {
    yield* this.corrente(0, duracao, easeInOutCubic);
  }

  protected override drawShape(context: CanvasRenderingContext2D) {
    super.drawShape(context);

    const intensidade = this.corrente();
    if (intensidade <= 0.001) return;

    const total = this.offsetArcLength();
    const espaco = Math.max(4, this.espacamento());
    const inicio = Math.min(this.start(), this.end()) * total;
    const fim = Math.max(this.start(), this.end()) * total;
    if (fim - inicio < 1) return;

    const manual = this.fase();
    const deslocamento = manual ?? this.view().globalTime() * this.velocidade();
    const primeiro = ((deslocamento % espaco) + espaco) % espaco;

    context.save();
    context.globalAlpha *= Math.min(1, intensidade);
    context.fillStyle = this.corPontos().serialize();
    const raio = this.raioPonto();
    for (let d = primeiro; d <= total; d += espaco) {
      if (d < inicio || d > fim) continue;
      const {position} = this.getPointAtDistance(d);
      context.beginPath();
      context.arc(position.x, position.y, raio, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }
}
