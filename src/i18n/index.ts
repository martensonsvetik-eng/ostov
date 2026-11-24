import { ru } from './ru';
import { en } from './en';
import type { Dict, Lang } from './types';

export type { Dict, Lang };

export function getDict(lang: Lang): Dict {
  return lang === 'en' ? en : ru;
}
