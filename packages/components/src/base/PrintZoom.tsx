import {Img, Node, Rect, RectProps} from '@canvas-commons/2d';
import {all, createRef, easeInOutCubic, ThreadGenerator, Vector2} from '@canvas-commons/core';
import {useTema} from '@synapticon/brand';
import {Grifo} from './Destaque';

/** Região da imagem, em pixels da imagem original (meça num editor de imagem). */
export interface Regiao {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PrintZoomProps extends RectProps {
  /** Imagem importada: `import datasheet from '../imagens/led.png'`. */
  src: string;
  width?: number;
  height?: number;
}

/**
 * Janela com um print (datasheet, artigo, tweet) que dá zoom e grifa trechos.
 *
 * ```tsx
 * const p = createRef<PrintZoom>();
 * view.add(<PrintZoom ref={p} src={datasheet} />);
 * yield* p().focar({x: 120, y: 400, w: 600, h: 180});
 * yield* p().grifar({x: 140, y: 450, w: 300, h: 40});
 * yield* p().focar(null); // volta ao quadro inteiro
 * ```
 */
export class PrintZoom extends Rect {
  /** Nó que contém a imagem e os grifos (é ele que move e escala). */
  public readonly folha = createRef<Node>();
  public readonly imagem = createRef<Img>();
  private readonly larguraJanela: number;
  private readonly alturaJanela: number;

  public constructor({src, width = 1200, height = 680, ...props}: PrintZoomProps) {
    const tema = useTema();
    super({
      width,
      height,
      clip: true,
      fill: tema.painel,
      stroke: tema.filete,
      lineWidth: 2,
      radius: 6,
      ...props,
    });
    this.larguraJanela = width;
    this.alturaJanela = height;
    this.add(
      <Node ref={this.folha}>
        <Img ref={this.imagem} src={src} width={width} />
      </Node>,
    );
  }

  /** Pixels da imagem → coordenadas locais da folha. */
  public paraLocal(px: number, py: number): Vector2 {
    const natural = this.imagem().naturalSize();
    const k = this.larguraJanela / natural.x;
    return new Vector2((px - natural.x / 2) * k, (py - natural.y / 2) * k);
  }

  /** Enquadra a região (ou o print inteiro, com `null`). */
  public *focar(regiao: Regiao | null, duracao = 1): ThreadGenerator {
    yield* this.carregada();
    if (!regiao) {
      yield* all(
        this.folha().scale(1, duracao, easeInOutCubic),
        this.folha().position(Vector2.zero, duracao, easeInOutCubic),
      );
      return;
    }
    const k = this.larguraJanela / this.imagem().naturalSize().x;
    const escala = Math.min(
      this.larguraJanela / (regiao.w * k),
      this.alturaJanela / (regiao.h * k),
    ) * 0.92;
    const centro = this.paraLocal(regiao.x + regiao.w / 2, regiao.y + regiao.h / 2);
    yield* all(
      this.folha().scale(escala, duracao, easeInOutCubic),
      this.folha().position(centro.scale(-escala), duracao, easeInOutCubic),
    );
  }

  /**
   * Cria um grifo (ainda não varrido) sobre a região e o devolve.
   * A imagem precisa estar carregada: chame depois de `yield* p().carregada()`
   * (ou de qualquer `focar`/`grifar`).
   */
  public grifo(regiao: Regiao): Grifo {
    const k = this.larguraJanela / this.imagem().naturalSize().x;
    const esquerda = this.paraLocal(regiao.x, regiao.y + regiao.h / 2);
    const g = (<Grifo position={esquerda} width={regiao.w * k} height={regiao.h * k} />) as Grifo;
    this.folha().add(g);
    return g;
  }

  /** Grifa a região. */
  public *grifar(regiao: Regiao, duracao = 0.5): ThreadGenerator {
    yield* this.carregada();
    yield* this.grifo(regiao).varrer(duracao);
  }

  /** Espera a imagem carregar (necessário antes de medir o tamanho dela). */
  public *carregada(): ThreadGenerator {
    yield this.imagem();
  }
}
