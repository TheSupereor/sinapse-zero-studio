/**
 * Tokens de cor da identidade Synapticon Alfa.
 *
 * Fonte da verdade: `~/.claude/skills/synapticon-pdf/kit/paleta/paleta.css`
 * (amostrada do banner do canal). Se a paleta mudar lá, atualize aqui.
 */
export const paleta = {
  /** Laranja de destaque — a cor "isto importa". */
  laranja: '#EF6920',
  /** Grafite — a tinta da marca. */
  grafite: '#172126',

  claro: {
    papel: '#FAFAFA',
    suave: '#5A656B',
    apagado: '#8E979C',
    filete: '#C6CACD',
    painel: '#EEEFF0',
    ciano: '#1F8FB0',
    ambar: '#D9961A',
    vermelho: '#C8322B',
    fundoDaFolha: '#F4F4F3',
    gradeDaFolha: '#E3E4E4',
  },

  escuro: {
    papel: '#0E1113',
    tinta: '#E8ECEE',
    suave: '#9AA3A9',
    apagado: '#6A747A',
    filete: '#2E3539',
    painel: '#161B1E',
    ciano: '#6CC7E0',
    ambar: '#F2B33D',
    vermelho: '#F0605A',
    fundoDaFolha: '#0B1418',
    gradeDaFolha: '#13232A',
  },
} as const;
