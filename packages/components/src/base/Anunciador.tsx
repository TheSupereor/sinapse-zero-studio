import {initial, Rect, RectProps, signal, Txt} from '@canvas-commons/2d';
import {
  all,
  createSignal,
  easeOutCubic,
  linear,
  SimpleSignal,
  ThreadGenerator,
  tween,
  waitFor,
} from '@canvas-commons/core';
import {fontes, tamanhos, useTema} from '@synapticon/brand';

/** Caracteres por segundo da digitação. Deadpan não tem pressa. */
const CPS = 28;
const CURSOR = '▌';

export interface AnunciadorProps extends RectProps {
  /** Cabeçalho da caixa. Padrão: 'SYS//A'. */
  titulo?: string;
  /** Texto já visível (uso estático, sem digitar). */
  texto?: string;
  /** Largura da caixa. Padrão: 900. */
  width?: number;
}

/**
 * Terminal do sistema do laboratório: a voz seca que comenta o desastre.
 *
 * ```tsx
 * const sys = createRef<Anunciador>();
 * view.add(<Anunciador ref={sys} y={300} />);
 * yield* sys().dizer('Componente danificado. O custo será descontado do seu salário.');
 * ```
 */
export class Anunciador extends Rect {
  /** Texto exibido (sem o cursor). Pode ser animado à mão: `sys().texto('...')`. */
  @initial('')
  @signal()
  declare public readonly texto: SimpleSignal<string, this>;

  private readonly cursorVisivel = createSignal(false);

  public constructor({titulo = 'SYS//A', width = 900, ...props}: AnunciadorProps) {
    const tema = useTema();
    super({
      layout: true,
      direction: 'column',
      gap: 14,
      padding: [24, 32],
      width,
      fill: tema.painel,
      stroke: tema.filete,
      lineWidth: 2,
      radius: 6,
      ...props,
    });

    this.add(
      <>
        <Txt
          text={`${titulo}  •••`}
          fontFamily={fontes.mono}
          fontSize={tamanhos.mini}
          fill={tema.destaque}
          letterSpacing={2}
        />
        <Txt
          text={() => this.texto() + (this.cursorVisivel() ? CURSOR : ' ')}
          fontFamily={fontes.mono}
          fontSize={tamanhos.rotulo + 4}
          lineHeight={'130%'}
          fill={tema.tinta}
          textWrap
          width={width - 64}
        />
      </>,
    );
  }

  /**
   * Digita o texto. `duracao` padrão: proporcional ao tamanho (28 caracteres/s).
   * Depois, o cursor pisca duas vezes e fica aceso.
   */
  public *dizer(texto: string, duracao = texto.length / CPS): ThreadGenerator {
    this.cursorVisivel(true);
    yield* tween(duracao, valor => {
      const n = Math.round(linear(valor) * texto.length);
      this.texto(texto.slice(0, n));
    });
    this.texto(texto);
    yield* this.piscar(2);
  }

  /** Digita `texto` depois do que já está escrito (use '\n' para nova linha). */
  public *continuar(texto: string, duracao = texto.length / CPS): ThreadGenerator {
    const base = this.texto();
    this.cursorVisivel(true);
    yield* tween(duracao, valor => {
      const n = Math.round(linear(valor) * texto.length);
      this.texto(base + texto.slice(0, n));
    });
    this.texto(base + texto);
    yield* this.piscar(2);
  }

  /** Pisca o cursor `vezes` vezes (0,25 s por fase). */
  public *piscar(vezes = 2): ThreadGenerator {
    for (let i = 0; i < vezes; i++) {
      this.cursorVisivel(false);
      yield* waitFor(0.25);
      this.cursorVisivel(true);
      yield* waitFor(0.25);
    }
  }

  /** Apaga o texto de trás para frente, como backspace segurado. */
  public *limpar(duracao = 0.3): ThreadGenerator {
    const atual = this.texto();
    yield* tween(duracao, valor => {
      this.texto(atual.slice(0, Math.round((1 - valor) * atual.length)));
    });
    this.texto('');
  }

  public *aparecer(duracao = 0.35): ThreadGenerator {
    this.opacity(0).scale(0.96);
    this.cursorVisivel(true);
    yield* all(this.opacity(1, duracao, easeOutCubic), this.scale(1, duracao, easeOutCubic));
  }

  public *sumir(duracao = 0.3): ThreadGenerator {
    yield* this.opacity(0, duracao);
    this.cursorVisivel(false);
  }
}
