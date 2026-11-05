import {useScene} from '@canvas-commons/core';
import {paleta} from './tokens';

/**
 * Papéis de cor que os componentes usam. Nunca use hex direto numa cena:
 * peça ao tema (`useTema().destaque`), assim o mesmo episódio funciona nos dois.
 */
export interface Tema {
  nome: NomeTema;
  /** Fundo da tela. */
  fundo: string;
  /** Linhas da grade de fundo. */
  grade: string;
  /** Fundo de cartões, caixas e terminais. */
  painel: string;
  /** Bordas finas e divisores. */
  filete: string;
  /** Texto principal e traço dos esquemas. */
  tinta: string;
  /** Texto secundário e rótulos. */
  suave: string;
  /** Elementos inativos, "fora de foco". */
  apagado: string;
  /** Laranja: o que importa agora. */
  destaque: string;
  /** Segunda cor de destaque (comparações, a "outra" série). */
  ciano: string;
  /** Avisos. */
  ambar: string;
  /** Perigo, erro, "você queimou o LED". */
  vermelho: string;
  /** Logo na variante certa para este fundo. */
  logo: 'claro' | 'escuro';
}

export type NomeTema = 'blueprint' | 'laboratorio';

/** Escuro, tipo prancheta técnica. Padrão dos vídeos. */
export const blueprint: Tema = {
  nome: 'blueprint',
  fundo: paleta.escuro.papel,
  grade: paleta.escuro.gradeDaFolha,
  painel: paleta.escuro.painel,
  filete: paleta.escuro.filete,
  tinta: paleta.escuro.tinta,
  suave: paleta.escuro.suave,
  apagado: paleta.escuro.apagado,
  destaque: paleta.laranja,
  ciano: paleta.escuro.ciano,
  ambar: paleta.escuro.ambar,
  vermelho: paleta.escuro.vermelho,
  logo: 'escuro',
};

/** Claro, painéis brancos de câmara de testes. */
export const laboratorio: Tema = {
  nome: 'laboratorio',
  fundo: paleta.claro.fundoDaFolha,
  grade: paleta.claro.gradeDaFolha,
  painel: paleta.claro.papel,
  filete: paleta.claro.filete,
  tinta: paleta.grafite,
  suave: paleta.claro.suave,
  apagado: paleta.claro.apagado,
  destaque: paleta.laranja,
  ciano: paleta.claro.ciano,
  ambar: paleta.claro.ambar,
  vermelho: paleta.claro.vermelho,
  logo: 'claro',
};

export const temas: Record<NomeTema, Tema> = {blueprint, laboratorio};

/**
 * Tema da cena atual. Lê a variável de projeto `tema`
 * (`makeProject({variables: {tema: 'laboratorio'}})`); padrão: blueprint.
 *
 * Só funciona dentro de uma cena (no gerador ou ao construir nós nele).
 */
export function useTema(): Tema {
  const nome = useScene().variables.get<NomeTema>('tema', 'blueprint')();
  return temas[nome] ?? blueprint;
}
