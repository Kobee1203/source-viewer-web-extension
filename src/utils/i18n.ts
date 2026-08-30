import { i18n } from '#i18n';
import type { GeneratedI18nStructure } from '#i18n';

/** Typed localized-message lookup. Messages live in src/locales/*.yml. */
export const t = i18n.t;

export type I18nKey = keyof GeneratedI18nStructure;
export type I18nSimpleKey = {
  [K in I18nKey]: GeneratedI18nStructure[K]['substitutions'] extends 0
    ? GeneratedI18nStructure[K] extends { namedSubstitutions: unknown }
      ? never
      : K
    : never;
}[I18nKey];
