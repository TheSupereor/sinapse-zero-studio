import {initial, Rect, RectProps, signal, Txt} from '@canvas-commons/2d';
import {
  easeOutCubic,
  SignalValue,
  SimpleSignal,
  ThreadGenerator,
  tween,
} from '@canvas-commons/core';
import {fontes, pesos, tamanhos, useTema} from '@synapticon/brand';

export interface CartaoProps extends RectProps {
  /** Linha pequena de cima, em caixa alta. Ex.: 'TENSÃO DIRETA'. */
  rotulo?: string;
  /** O número grande. Ex.: '2,0 V'. */
  valor?: SignalValue<string>;
  /** Linha de baixo. Ex.: 'LED vermelho, 20 mA'. */
  legenda?: string;
  /** Cor do valor. Padrão: destaque do tema. */
  cor?: string;
}

/**
 * Painel de dado com número grande — o "cartão de datasheet".
 *
 * ```tsx
 * <Cartao ref={c} rotulo={'CORRENTE MÁXIMA'} valor={'20 mA'} legenda={'Datasheet, pág. 2'} />
 * yield* c().contar(0, 20, 1, n => `${n.toFixed(0)} mA`);
 * ```
 */
export class Cartao extends Rect {
  @initial('')
  @signal()
  declare public readonly valor: SimpleSignal<string, this>;

  public constructor({rotulo, legenda, cor, ...props}: CartaoProps) {
    const tema = useTema();
    super({
      layout: true,
      direction: 'column',
      gap: 6,
      padding: [28, 36],
      fill: tema.painel,
      stroke: tema.filete,
      lineWidth: 2,
      radius: 6,
      ...props,
    });

    this.add(
      <>
        {rotulo && (
          <Txt
            text={rotulo.toUpperCase()}
            fontFamily={fontes.display}
            fontSize={tamanhos.mini}
            fontWeight={pesos.semi}
            letterSpacing={2}
            fill={tema.suave}
          />
        )}
        <Txt
          text={() => this.valor()}
          fontFamily={fontes.display}
          fontSize={tamanhos.numero}
          fontWeight={pesos.negrito}
          fill={cor ?? tema.destaque}
        />
        {legenda && (
          <Txt
            text={legenda}
            fontFamily={fontes.corpo}
            fontSize={tamanhos.rotulo}
            fill={tema.suave}
          />
        )}
      </>,
    );
  }

  /** Conta de `de` até `ate`, formatando cada quadro. */
  public *contar(
    de: number,
    ate: number,
    duracao = 1,
    formato: (n: number) => string = n => n.toFixed(0),
  ): ThreadGenerator {
    yield* tween(duracao, t => {
      this.valor(formato(de + (ate - de) * easeOutCubic(t)));
    });
    this.valor(formato(ate));
  }
}
