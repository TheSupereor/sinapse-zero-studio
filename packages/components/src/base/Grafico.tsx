import {Circle, Line, Node, NodeProps, Txt} from '@canvas-commons/2d';
import {
  all,
  createRef,
  delay,
  easeInOutCubic,
  map,
  ThreadGenerator,
  TimingFunction,
  Vector2,
} from '@canvas-commons/core';
import {fontes, tamanhos, useTema} from '@synapticon/brand';

export interface GraficoProps extends NodeProps {
  /** Largura da área de plotagem, em px. Padrão: 900. */
  largura?: number;
  /** Altura da área de plotagem, em px. Padrão: 500. */
  altura?: number;
  /** Faixa do eixo X: [mín, máx]. */
  faixaX: [number, number];
  /** Faixa do eixo Y: [mín, máx]. */
  faixaY: [number, number];
  /** Passo das marcas no eixo X. Padrão: faixa/5. */
  passoX?: number;
  passoY?: number;
  rotuloX?: string;
  rotuloY?: string;
  formatoX?: (n: number) => string;
  formatoY?: (n: number) => string;
  /** Começa invisível; use `revelar()`. Padrão: false. */
  oculto?: boolean;
}

export interface OpcoesCurva {
  cor?: string;
  espessura?: number;
  /** Pontos amostrados quando a fonte é uma função. Padrão: 160. */
  amostras?: number;
  /** Tracejado, ex.: [12, 10]. */
  tracejado?: number[];
}

export interface OpcoesMarca {
  rotulo?: string;
  cor?: string;
  /** Guias tracejadas até os eixos. Padrão: true. */
  guias?: boolean;
}

/** Função y = f(x) ou lista de pontos [x, y] nas unidades do gráfico. */
export type FonteCurva = ((x: number) => number) | [number, number][];

const formatoPadrao = (n: number) =>
  Number.isInteger(n) ? n.toString() : n.toFixed(1).replace('.', ',');

/**
 * Gráfico com eixos, marcas, curva que se desenha e pontos marcados com guias.
 * Origem do nó = centro da área de plotagem.
 *
 * ```tsx
 * const g = createRef<Grafico>();
 * view.add(<Grafico ref={g} faixaX={[0, 5]} faixaY={[0, 30]} rotuloX={'Tensão (V)'} rotuloY={'Corrente (mA)'} />);
 * yield* g().plotar(v => (v < 1.8 ? 0 : (v - 1.8) * 40));
 * yield* g().marcar(2, 8, {rotulo: '2 V → 8 mA'});
 * ```
 */
export class Grafico extends Node {
  public readonly largura: number;
  public readonly altura: number;
  public readonly faixaX: [number, number];
  public readonly faixaY: [number, number];

  private readonly eixos = createRef<Line>();
  private readonly escala = createRef<Node>();
  private readonly camadaCurvas = createRef<Node>();

  public constructor({
    largura = 900,
    altura = 500,
    faixaX: x,
    faixaY: y,
    passoX = (x[1] - x[0]) / 5,
    passoY = (y[1] - y[0]) / 5,
    rotuloX,
    rotuloY,
    formatoX = formatoPadrao,
    formatoY = formatoPadrao,
    oculto = false,
    ...props
  }: GraficoProps) {
    super(props);
    const tema = useTema();
    this.largura = largura;
    this.altura = altura;
    this.faixaX = x;
    this.faixaY = y;

    const w2 = largura / 2;
    const h2 = altura / 2;
    const marcasX = passos(x, passoX);
    const marcasY = passos(y, passoY);
    const texto = {
      fontFamily: fontes.mono,
      fontSize: tamanhos.mini,
      fill: tema.suave,
    };

    this.add(
      <>
        <Node ref={this.escala} opacity={oculto ? 0 : 1}>
          {marcasY.map(v => (
            <Line
              points={[this.ponto(x[0], v), this.ponto(x[1], v)]}
              stroke={tema.grade}
              lineWidth={2}
            />
          ))}
          {marcasX.map(v => (
            <Txt {...texto} text={formatoX(v)} position={this.ponto(v, y[0]).add([0, 30])} />
          ))}
          {marcasY.map(v => (
            <Txt
              {...texto}
              text={formatoY(v)}
              position={this.ponto(x[0], v).add([-18, 0])}
              anchorX={1}
            />
          ))}
          {rotuloX && (
            <Txt
              {...texto}
              fontFamily={fontes.display}
              fontSize={tamanhos.rotulo}
              fill={tema.tinta}
              text={rotuloX}
              position={[0, h2 + 76]}
            />
          )}
          {rotuloY && (
            <Txt
              {...texto}
              fontFamily={fontes.display}
              fontSize={tamanhos.rotulo}
              fill={tema.tinta}
              text={rotuloY}
              rotation={-90}
              position={[-w2 - 96, 0]}
            />
          )}
        </Node>
        <Line
          ref={this.eixos}
          points={[
            [-w2, -h2],
            [-w2, h2],
            [w2, h2],
          ]}
          stroke={tema.suave}
          lineWidth={3}
          end={oculto ? 0 : 1}
        />
        <Node ref={this.camadaCurvas} />
      </>,
    );
  }

  /** Converte unidades do gráfico para px locais. */
  public ponto(x: number, y: number): Vector2 {
    const [x0, x1] = this.faixaX;
    const [y0, y1] = this.faixaY;
    return new Vector2(
      map(-this.largura / 2, this.largura / 2, (x - x0) / (x1 - x0)),
      map(this.altura / 2, -this.altura / 2, (y - y0) / (y1 - y0)),
    );
  }

  /** Desenha os eixos e mostra a escala. */
  public *revelar(duracao = 1): ThreadGenerator {
    yield* all(
      this.eixos().end(1, duracao, easeInOutCubic),
      delay(duracao * 0.5, this.escala().opacity(1, duracao * 0.5)),
    );
  }

  /**
   * Cria a curva (invisível, `end = 0`) e a devolve, para você animar como quiser:
   * `yield* g().curva(f).end(1, 2)`.
   */
  public curva(fonte: FonteCurva, opcoes: OpcoesCurva = {}): Line {
    const tema = useTema();
    const {cor = tema.destaque, espessura = 5, amostras = 160, tracejado} = opcoes;
    const linha = (
      <Line
        points={this.pontosDe(fonte, amostras)}
        stroke={cor}
        lineWidth={espessura}
        lineJoin={'round'}
        lineCap={'round'}
        lineDash={tracejado}
        end={0}
      />
    ) as Line;
    this.camadaCurvas().add(linha);
    return linha;
  }

  /** Cria a curva e a desenha da esquerda para a direita. */
  public *plotar(
    fonte: FonteCurva,
    opcoes: OpcoesCurva & {duracao?: number; ease?: TimingFunction} = {},
  ): ThreadGenerator {
    const {duracao = 1.2, ease = easeInOutCubic, ...resto} = opcoes;
    yield* this.curva(fonte, resto).end(1, duracao, ease);
  }

  /** Cria uma marca (ponto + guias + rótulo) invisível e a devolve. */
  public marca(x: number, y: number, opcoes: OpcoesMarca = {}): Node {
    const tema = useTema();
    const {rotulo, cor = tema.destaque, guias = true} = opcoes;
    const p = this.ponto(x, y);
    const [x0] = this.faixaX;
    const [y0] = this.faixaY;
    const grupo = (
      <Node opacity={0}>
        {guias && (
          <Line
            points={[this.ponto(x, y0), p, this.ponto(x0, y)]}
            stroke={tema.suave}
            lineWidth={2}
            lineDash={[8, 8]}
          />
        )}
        <Circle position={p} size={18} fill={cor} />
        {rotulo && (
          <Txt
            text={rotulo}
            position={p.add([22, -26])}
            anchorX={-1}
            fontFamily={fontes.display}
            fontSize={tamanhos.rotulo}
            fontWeight={600}
            fill={cor}
          />
        )}
      </Node>
    ) as Node;
    this.camadaCurvas().add(grupo);
    return grupo;
  }

  /** Mostra uma marca num ponto. */
  public *marcar(
    x: number,
    y: number,
    opcoes: OpcoesMarca & {duracao?: number} = {},
  ): ThreadGenerator {
    const {duracao = 0.5, ...resto} = opcoes;
    yield* this.marca(x, y, resto).opacity(1, duracao);
  }

  private pontosDe(fonte: FonteCurva, amostras: number): Vector2[] {
    if (Array.isArray(fonte)) {
      return fonte.map(([x, y]) => this.ponto(x, y));
    }
    const [x0, x1] = this.faixaX;
    const [y0, y1] = this.faixaY;
    const pontos: Vector2[] = [];
    // A curva entra no gráfico no primeiro ponto dentro da faixa Y e termina
    // exatamente na borda por onde sai (sem "achatar" no teto).
    let anterior: [number, number] | null = null;
    let dentro = false;
    for (let i = 0; i <= amostras; i++) {
      const x = x0 + ((x1 - x0) * i) / amostras;
      const y = fonte(x);
      const naFaixa = y >= y0 && y <= y1;
      if (naFaixa) {
        if (!dentro && anterior) pontos.push(this.ponto(...cruzamento(anterior, [x, y], y0, y1)));
        pontos.push(this.ponto(x, y));
        dentro = true;
      } else if (dentro) {
        pontos.push(this.ponto(...cruzamento(anterior, [x, y], y0, y1)));
        break;
      }
      anterior = [x, y];
    }
    return pontos;
  }
}

/** Ponto onde o segmento a→b cruza a borda (y0 ou y1) que um dos dois ultrapassa. */
function cruzamento(
  a: [number, number],
  b: [number, number],
  y0: number,
  y1: number,
): [number, number] {
  const limite = a[1] > y1 || b[1] > y1 ? y1 : y0;
  const t = (limite - a[1]) / (b[1] - a[1]);
  return [a[0] + t * (b[0] - a[0]), limite];
}

function passos([inicio, fim]: [number, number], passo: number): number[] {
  const n = Math.round((fim - inicio) / passo);
  return Array.from({length: n + 1}, (_, i) => +(inicio + i * passo).toFixed(6));
}
