import {Circle, initial, Line, Node, Rect, signal, Txt} from '@canvas-commons/2d';
import {
  all,
  createRef,
  delay,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  PossibleVector2,
  SimpleSignal,
  ThreadGenerator,
  useRandom,
  Vector2,
} from '@canvas-commons/core';
import {fontes, tamanhos} from '@synapticon/brand';
import {Componente, ComponenteProps} from './Componente';

/*
 * Convenções (todos os símbolos de dois terminais):
 * - horizontais, pinos em x = ±80 (160 px entre pinos);
 * - gire com `rotation={90}` para vertical; os pinos acompanham.
 * - desenho segue IEC 60617 / ABNT por padrão.
 */

const P = 80;

// ───────────────────────────── Resistor ─────────────────────────────

export interface ResistorProps extends ComponenteProps {
  /** 'iec' = retângulo (ABNT); 'ansi' = zigue-zague. Padrão: 'iec'. */
  estilo?: 'iec' | 'ansi';
}

/** Resistor. Pinos: `a` (esquerda), `b` (direita). */
export class Resistor extends Componente {
  protected readonly pinosLocais = {a: [-P, 0], b: [P, 0]} as Record<string, PossibleVector2>;

  public constructor({estilo = 'iec', ...props}: ResistorProps) {
    super(props);
    if (estilo === 'iec') {
      this.add(
        <>
          <Line points={[[-P, 0], [-44, 0]]} {...this.traco()} />
          <Rect width={88} height={32} {...this.traco()} />
          <Line points={[[44, 0], [P, 0]]} {...this.traco()} />
        </>,
      );
    } else {
      const zigue: PossibleVector2[] = [[-P, 0], [-44, 0]];
      for (let i = 0; i < 6; i++) {
        zigue.push([-44 + 88 * ((i + 0.5) / 6), i % 2 === 0 ? -18 : 18]);
      }
      zigue.push([44, 0], [P, 0]);
      this.add(<Line points={zigue} {...this.traco()} />);
    }
  }
}

// ───────────────────────────── Diodo e LED ─────────────────────────────

/** Diodo. Pinos: `a` (anodo, esquerda), `k` (catodo, direita). */
export class Diodo extends Componente {
  protected readonly pinosLocais = {a: [-P, 0], k: [P, 0]} as Record<string, PossibleVector2>;

  public constructor(props: ComponenteProps) {
    super(props);
    this.add(desenhoDiodo(this.traco()));
  }
}

function desenhoDiodo(traco: object) {
  return (
    <>
      <Line points={[[-P, 0], [-26, 0]]} {...traco} />
      <Line points={[[-26, -28], [-26, 28], [26, 0]]} closed {...traco} />
      <Line points={[[26, -28], [26, 28]]} {...traco} />
      <Line points={[[26, 0], [P, 0]]} {...traco} />
    </>
  );
}

export interface LEDProps extends ComponenteProps {
  /** Cor da luz. Padrão: vermelho do tema. */
  luz?: string;
  /** Brilho inicial, 0–1. */
  brilho?: number;
}

/**
 * LED. Pinos: `a` (anodo, esquerda), `k` (catodo, direita).
 * Controle o signal `brilho` (0–1) à mão ou use `acender()`, `apagar()`, `queimar()`.
 */
export class LED extends Componente {
  protected readonly pinosLocais = {a: [-P, 0], k: [P, 0]} as Record<string, PossibleVector2>;

  @initial(0)
  @signal()
  declare public readonly brilho: SimpleSignal<number, this>;

  private readonly luz: string;
  private readonly corpo = createRef<Node>();
  private readonly fumaca = createRef<Node>();

  public constructor({luz, ...props}: LEDProps) {
    super(props);
    this.luz = luz ?? this.tema.vermelho;

    this.add(
      <>
        <Circle
          size={150}
          fill={this.luz}
          opacity={() => Math.min(1, this.brilho()) * 0.35}
          shadowColor={this.luz}
          shadowBlur={() => 80 * this.brilho()}
        />
        <Line
          points={[[-26, -28], [-26, 28], [26, 0]]}
          closed
          fill={this.luz}
          opacity={() => Math.min(1, this.brilho())}
        />
        <Node ref={this.corpo}>{desenhoDiodo(this.traco())}</Node>
        <Line points={[[6, -40], [30, -64]]} {...this.traco()} lineWidth={4} endArrow arrowSize={12} />
        <Line points={[[26, -32], [50, -56]]} {...this.traco()} lineWidth={4} endArrow arrowSize={12} />
        <Node ref={this.fumaca} />
      </>,
    );
  }

  public *acender(duracao = 0.3): ThreadGenerator {
    yield* this.brilho(1, duracao, easeOutCubic);
  }

  public *apagar(duracao = 0.3): ThreadGenerator {
    yield* this.brilho(0, duracao, easeInCubic);
  }

  /**
   * Clarão, apaga, o corpo escurece e sobe fumaça.
   * Para quando alguém liga o LED direto na bateria. Acontece.
   */
  public *queimar(): ThreadGenerator {
    const random = useRandom();
    yield* this.brilho(1.8, 0.12, easeOutCubic);
    this.brilho(0);
    this.corpo().opacity(0.45);
    const fios = Array.from({length: 5}, (_, i) => {
      const bolha = (
        <Circle
          size={18 + random.nextInt(0, 14)}
          fill={this.tema.apagado}
          opacity={0.7}
          position={[random.nextInt(-20, 20), -10]}
        />
      ) as Circle;
      this.fumaca().add(bolha);
      return delay(
        i * 0.12,
        all(
          bolha.position(bolha.position().add([random.nextInt(-30, 30), -140]), 1.4, easeOutCubic),
          bolha.scale(2.2, 1.4),
          bolha.opacity(0, 1.4, easeInCubic),
        ),
      );
    });
    yield* all(...fios);
    this.fumaca().removeChildren();
  }
}

// ───────────────────────────── Capacitor ─────────────────────────────

/** Capacitor (não polarizado). Pinos: `a`, `b`. */
export class Capacitor extends Componente {
  protected readonly pinosLocais = {a: [-P, 0], b: [P, 0]} as Record<string, PossibleVector2>;

  public constructor(props: ComponenteProps) {
    super(props);
    this.add(
      <>
        <Line points={[[-P, 0], [-12, 0]]} {...this.traco()} />
        <Line points={[[-12, -36], [-12, 36]]} {...this.traco()} />
        <Line points={[[12, -36], [12, 36]]} {...this.traco()} />
        <Line points={[[12, 0], [P, 0]]} {...this.traco()} />
      </>,
    );
  }
}

// ───────────────────────────── Bateria ─────────────────────────────

/** Bateria / fonte CC. Placa longa = positivo. Pinos: `pos` (esquerda), `neg` (direita). */
export class Bateria extends Componente {
  protected readonly pinosLocais = {pos: [-P, 0], neg: [P, 0]} as Record<string, PossibleVector2>;

  public constructor(props: ComponenteProps) {
    super(props);
    this.add(
      <>
        <Line points={[[-P, 0], [-12, 0]]} {...this.traco()} />
        <Line points={[[-12, -40], [-12, 40]]} {...this.traco()} />
        <Line points={[[12, -20], [12, 20]]} {...this.traco()} lineWidth={this.espessura * 1.8} />
        <Line points={[[12, 0], [P, 0]]} {...this.traco()} />
        <Txt
          text={'+'}
          position={[-34, -40]}
          rotation={() => -this.rotation()}
          fontFamily={fontes.display}
          fontSize={tamanhos.rotulo}
          fontWeight={700}
          fill={this.tema.destaque}
        />
      </>,
    );
  }
}

// ───────────────────────────── Terra ─────────────────────────────

/** Terra. Pino: `t` (em cima). */
export class Terra extends Componente {
  protected readonly pinosLocais = {t: [0, -40]} as Record<string, PossibleVector2>;

  public constructor(props: ComponenteProps) {
    super({posicaoRotulo: [0, 60], ...props});
    this.add(
      <>
        <Line points={[[0, -40], [0, 0]]} {...this.traco()} />
        <Line points={[[-32, 0], [32, 0]]} {...this.traco()} />
        <Line points={[[-20, 14], [20, 14]]} {...this.traco()} />
        <Line points={[[-8, 28], [8, 28]]} {...this.traco()} />
      </>,
    );
  }
}

// ───────────────────────────── Chave ─────────────────────────────

export interface ChaveProps extends ComponenteProps {
  /** 0 = aberta, 1 = fechada. Padrão: 0. */
  fechada?: number;
}

/** Chave liga/desliga. Pinos: `a`, `b`. Signal `fechada` (0–1). */
export class Chave extends Componente {
  protected readonly pinosLocais = {a: [-P, 0], b: [P, 0]} as Record<string, PossibleVector2>;

  @initial(0)
  @signal()
  declare public readonly fechada: SimpleSignal<number, this>;

  public constructor(props: ChaveProps) {
    super(props);
    const alavanca = () => {
      const angulo = (-32 * (1 - this.fechada()) * Math.PI) / 180;
      return new Vector2(-40, 0).add(new Vector2(Math.cos(angulo), Math.sin(angulo)).scale(80));
    };
    this.add(
      <>
        <Line points={[[-P, 0], [-40, 0]]} {...this.traco()} />
        <Line points={[[40, 0], [P, 0]]} {...this.traco()} />
        <Line points={() => [[-40, 0], alavanca()]} {...this.traco()} />
        <Circle position={[-40, 0]} size={16} fill={this.cor} />
        <Circle position={[40, 0]} size={16} lineWidth={4} stroke={this.cor} fill={this.tema.fundo} />
      </>,
    );
  }

  public *fechar(duracao = 0.25): ThreadGenerator {
    yield* this.fechada(1, duracao, easeInOutCubic);
  }

  public *abrir(duracao = 0.25): ThreadGenerator {
    yield* this.fechada(0, duracao, easeInOutCubic);
  }
}
