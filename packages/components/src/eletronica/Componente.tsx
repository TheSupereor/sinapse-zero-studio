import {Node, NodeProps, Txt} from '@canvas-commons/2d';
import {PossibleVector2, Vector2} from '@canvas-commons/core';
import {fontes, tamanhos, Tema, useTema} from '@synapticon/brand';

export interface ComponenteProps extends NodeProps {
  /** Rótulo acima do símbolo. Ex.: 'R1 330 Ω'. */
  rotulo?: string;
  /** Cor do traço. Padrão: tinta do tema. */
  cor?: string;
  /** Espessura do traço. Padrão: 6. */
  espessura?: number;
  /** Posição do rótulo, local. Padrão: [0, -64]. */
  posicaoRotulo?: PossibleVector2;
}

/**
 * Base dos símbolos esquemáticos. Cada símbolo declara pinos nomeados;
 * `pino('a')` devolve a posição do pino **no espaço do pai** (respeita
 * posição, rotação e escala), então ligue fios e símbolos no mesmo pai:
 *
 * ```tsx
 * <Fio points={() => [r().pino('b'), led().pino('a')]} />
 * ```
 */
export abstract class Componente extends Node {
  protected readonly tema: Tema;
  protected readonly cor: string;
  protected readonly espessura: number;
  protected abstract readonly pinosLocais: Record<string, PossibleVector2>;

  public constructor({rotulo, cor, espessura = 6, posicaoRotulo = [0, -64], ...props}: ComponenteProps) {
    super(props);
    this.tema = useTema();
    this.cor = cor ?? this.tema.tinta;
    this.espessura = espessura;
    if (rotulo) {
      this.add(
        <Txt
          text={rotulo}
          position={posicaoRotulo}
          rotation={() => -this.rotation()}
          fontFamily={fontes.display}
          fontSize={tamanhos.rotulo}
          fontWeight={600}
          fill={this.tema.suave}
        />,
      );
    }
  }

  /** Posição do pino no espaço do pai. */
  public pino(nome: string): Vector2 {
    const local = this.pinosLocais[nome];
    if (local === undefined) {
      throw new Error(
        `${this.constructor.name} não tem o pino "${nome}". Pinos: ${Object.keys(this.pinosLocais).join(', ')}`,
      );
    }
    return new Vector2(local).transformAsPoint(this.localToParent());
  }

  /** Estilo de traço comum a todos os símbolos. */
  protected traco() {
    return {
      stroke: this.cor,
      lineWidth: this.espessura,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
    };
  }
}
