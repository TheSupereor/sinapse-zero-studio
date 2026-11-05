/**
 * Assets da marca, copiados de `~/.claude/skills/synapticon-pdf/kit/`.
 * Ícones e ornamentos vêm como texto SVG para poderem ser recoloridos.
 */

const logos = import.meta.glob<string>('../assets/logo/*.png', {
  eager: true,
  import: 'default',
});

const icones = import.meta.glob<string>('../assets/icones/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const ornamentos = import.meta.glob<string>('../assets/ornamentos/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function porNome(mapa: Record<string, string>, nome: string, tipo: string) {
  const chave = Object.keys(mapa).find(caminho =>
    caminho.endsWith(`/${nome}.svg`) || caminho.endsWith(`/${nome}.png`),
  );
  if (!chave) {
    const disponiveis = Object.keys(mapa)
      .map(c => c.split('/').pop()!.replace(/\.(svg|png)$/, ''))
      .join(', ');
    throw new Error(`${tipo} "${nome}" não existe. Disponíveis: ${disponiveis}`);
  }
  return mapa[chave];
}

export type VarianteLogo = 'full' | 'mark' | 'word';

/** URL do logo. `fundo` é o tipo de fundo onde ele vai aparecer. */
export function logo(variante: VarianteLogo, fundo: 'claro' | 'escuro'): string {
  return porNome(logos, `${variante}_${fundo}`, 'Logo');
}

/** Nomes: bateria, calor, eletronica, esd, furacao, impressao3d, laser, mecanica, motor, parafuso, solda, tensao. */
export type NomeIcone =
  | 'bateria'
  | 'calor'
  | 'eletronica'
  | 'esd'
  | 'furacao'
  | 'impressao3d'
  | 'laser'
  | 'mecanica'
  | 'motor'
  | 'parafuso'
  | 'solda'
  | 'tensao';

const GRAFITE = /#172126/gi;

/** SVG do ícone (só o pictograma), recolorido. */
export function iconeSvg(nome: NomeIcone, cor: string): string {
  return porNome(icones, nome, 'Ícone').replace(GRAFITE, cor);
}

/** SVG de um ornamento do kit (ex.: 'sys-a', 'mira', 'cantoneiras'), na variante do fundo. */
export function ornamentoSvg(nome: string, fundo: 'claro' | 'escuro'): string {
  return porNome(ornamentos, `${nome}-${fundo}`, 'Ornamento');
}
