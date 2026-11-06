import {useScene} from '@canvas-commons/core';

/**
 * Default on-screen text of the templates, per language. Pick the language with the
 * project variable `locale` (`makeProject({variables: {locale: 'pt-BR'}})`); the default is English.
 * Any template option that takes text overrides these defaults.
 */
export type Locale = 'en' | 'pt-BR';

export interface Strings {
  openingOverline: string;
  recapLabel: (code: string) => string;
  closingLines: (code: string) => string[];
  next: string;
}

export const strings: Record<Locale, Strings> = {
  en: {
    openingOverline: 'SYNAPTICON LABORATORIES · BASIC TRAINING',
    recapLabel: code => `RECAP · FILE ${code}`,
    closingLines: code => [`Basic training ${code} complete.`, 'Proceed to the next module.'],
    next: 'NEXT',
  },
  'pt-BR': {
    openingOverline: 'SYNAPTICON LABORATORIES · TREINAMENTO BÁSICO',
    recapLabel: code => `RETOMADA · ARQUIVO ${code}`,
    closingLines: code => [`Treinamento básico ${code} completo.`, 'Prossiga para o próximo módulo.'],
    next: 'PRÓXIMO',
  },
};

/** Strings for the current scene's `locale` variable. Only works inside a scene. */
export function useStrings(): Strings {
  const locale = useScene().variables.get<Locale>('locale', 'en')();
  return strings[locale] ?? strings.en;
}
