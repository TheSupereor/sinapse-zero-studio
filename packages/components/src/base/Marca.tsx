import {Img, ImgProps, SVG, SVGProps} from '@canvas-commons/2d';
import {useScene} from '@canvas-commons/core';
import {iconeSvg, logo, NomeIcone, useTema, VarianteLogo} from '@synapticon/brand';

export type Canto = 'sup-esq' | 'sup-dir' | 'inf-esq' | 'inf-dir';

export interface MarcaProps extends ImgProps {
  /** Padrão: 'inf-dir'. */
  canto?: Canto;
  /** Padrão: 'mark' (só o símbolo). */
  variante?: VarianteLogo;
  /** Distância da borda, em px. Padrão: 48. */
  margem?: number;
}

/**
 * Logo Synapticon no canto do quadro, discreto.
 *
 * ```tsx
 * view.add(<Marca />);
 * ```
 */
export class Marca extends Img {
  public constructor({canto = 'inf-dir', variante = 'mark', margem = 48, ...props}: MarcaProps) {
    const tema = useTema();
    const tamanho = useScene().getSize();
    const sx = canto.endsWith('dir') ? 1 : -1;
    const sy = canto.startsWith('inf') ? 1 : -1;
    super({
      src: logo(variante, tema.logo),
      height: 56,
      opacity: 0.55,
      anchor: [sx, sy],
      position: [sx * (tamanho.x / 2 - margem), sy * (tamanho.y / 2 - margem)],
      ...props,
    });
  }
}

export interface IconeProps extends Omit<SVGProps, 'svg'> {
  nome: NomeIcone;
  /** Padrão: destaque do tema. */
  cor?: string;
}

/**
 * Pictograma do kit Synapticon (bateria, tensão, solda...), recolorido.
 *
 * ```tsx
 * <Icone nome={'tensao'} size={120} />
 * ```
 */
export class Icone extends SVG {
  public constructor({nome, cor, ...props}: IconeProps) {
    const tema = useTema();
    super({size: 96, ...props, svg: iconeSvg(nome, cor ?? tema.destaque)});
  }
}
