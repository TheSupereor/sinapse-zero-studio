import {
  Circle,
  initial,
  Line,
  Node,
  NodeProps,
  Txt,
  vector2Signal,
} from '@canvas-commons/2d';
import {
  all,
  createRef,
  delay,
  easeInOutCubic,
  PossibleVector2,
  SignalValue,
  ThreadGenerator,
  Vector2,
  Vector2Signal,
} from '@canvas-commons/core';
import {fontes, tamanhos, useTema} from '@synapticon/brand';

export interface CalloutProps extends NodeProps {
  /** Ponto apontado, no espaço do pai. Pode ser função: `() => led().pino('a')`. */
  alvo?: SignalValue<PossibleVector2>;
  /** Deslocamento do cotovelo em relação ao alvo. Padrão: [120, -90]. */
  cotovelo?: SignalValue<PossibleVector2>;
  texto: string;
  /** Cor da linha e do ponto. Padrão: destaque do tema. */
  cor?: string;
  /** Já começa visível (uso estático). Padrão: false. */
  visivel?: boolean;
}

/**
 * Rótulo com linha-guia até um ponto, como os da referência
 * ("KV cache", "2 experts in each GPU's memory").
 *
 * ```tsx
 * const c = createRef<Callout>();
 * view.add(<Callout ref={c} alvo={[200, 0]} texto={'Anodo'} />);
 * yield* c().mostrar();
 * ```
 */
export class Callout extends Node {
  @initial([0, 0])
  @vector2Signal('alvo')
  declare public readonly alvo: Vector2Signal<this>;

  @initial([120, -90])
  @vector2Signal('cotovelo')
  declare public readonly cotovelo: Vector2Signal<this>;

  private readonly ponto = createRef<Circle>();
  private readonly linha = createRef<Line>();
  private readonly rotulo = createRef<Txt>();

  public constructor({texto, cor, visivel = false, ...props}: CalloutProps) {
    super(props);
    const tema = useTema();
    const corLinha = cor ?? tema.destaque;
    const paraDireita = () => this.cotovelo().x >= 0;
    const joelho = () => this.alvo().add(this.cotovelo());
    const ponta = () => joelho().add([paraDireita() ? 48 : -48, 0]);

    this.add(
      <>
        <Line
          ref={this.linha}
          points={() => [this.alvo(), joelho(), ponta()]}
          stroke={corLinha}
          lineWidth={3}
          end={visivel ? 1 : 0}
        />
        <Circle
          ref={this.ponto}
          position={() => this.alvo()}
          size={14}
          fill={corLinha}
          scale={visivel ? 1 : 0}
        />
        <Txt
          ref={this.rotulo}
          text={texto}
          position={() => ponta().add([paraDireita() ? 14 : -14, 0])}
          anchorX={() => (paraDireita() ? -1 : 1)}
          fontFamily={fontes.display}
          fontSize={tamanhos.rotulo}
          fontWeight={600}
          fill={tema.tinta}
          opacity={visivel ? 1 : 0}
        />
      </>,
    );
  }

  public *mostrar(duracao = 0.6): ThreadGenerator {
    yield* all(
      this.ponto().scale(1, duracao * 0.4, easeInOutCubic),
      this.linha().end(1, duracao, easeInOutCubic),
      delay(duracao * 0.6, this.rotulo().opacity(1, duracao * 0.4)),
    );
  }

  public *esconder(duracao = 0.4): ThreadGenerator {
    yield* all(
      this.rotulo().opacity(0, duracao * 0.5),
      this.linha().start(1, duracao, easeInOutCubic),
      this.ponto().scale(0, duracao, easeInOutCubic),
    );
    this.linha().start(0).end(0);
  }

  /** Posição atual da ponta do rótulo (útil para encadear outros elementos). */
  public pontaDoRotulo(): Vector2 {
    return this.rotulo().position();
  }
}
