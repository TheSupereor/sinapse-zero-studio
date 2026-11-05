import {Node} from '@canvas-commons/2d';
import {
  all,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  ThreadGenerator,
} from '@canvas-commons/core';

/** Durações padrão, em segundos. Use-as para o vídeo inteiro ter o mesmo ritmo. */
export const ritmo = {
  rapido: 0.3,
  normal: 0.6,
  lento: 1.2,
} as const;

/** Curvas de easing com nomes do que fazem. */
export const curvas = {
  /** Algo chegando: rápido no começo, assenta no fim. */
  entrada: easeOutCubic,
  /** Algo saindo: começa devagar, acelera. */
  saida: easeInCubic,
  /** Movimento de um lugar a outro. */
  suave: easeInOutCubic,
} as const;

/** Surge com fade e uma leve subida. */
export function* aparecer(no: Node, duracao: number = ritmo.normal, subida = 24): ThreadGenerator {
  const y = no.y();
  no.opacity(0).y(y + subida);
  yield* all(no.opacity(1, duracao, curvas.entrada), no.y(y, duracao, curvas.entrada));
}

/** Some com fade (e uma leve descida). */
export function* sumir(no: Node, duracao: number = ritmo.rapido, descida = 0): ThreadGenerator {
  yield* all(no.opacity(0, duracao, curvas.saida), no.y(no.y() + descida, duracao, curvas.saida));
}
