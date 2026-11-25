/**
 * Petits constructeurs pour écrire les simulations des fiches de façon concise.
 * Utilisés UNIQUEMENT par le contenu (src/content) — le moteur ne s'en sert pas.
 */
import type { HeapObj, Prim, Slot, TableData } from './types';

/** Adresse mémoire factice mais stable, dérivée de l'id (façon id() de CPython). */
export function fakeAddr(id: string): string {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return '0x7f' + ((h >>> 0) % 0xffffff).toString(16).padStart(6, '0') + '0';
}

export const v = (x: Prim): Slot => ({ v: x });
export const r = (id: string): Slot => ({ ref: id });

export function list(id: string, items: (Prim | Slot)[], extra: Partial<HeapObj> = {}): HeapObj {
  return {
    id, pyType: 'list', kind: 'sequence',
    items: items.map((x) => (x !== null && typeof x === 'object' ? x : v(x))),
    ...extra,
  };
}

export function scalar(id: string, value: Prim, extra: Partial<HeapObj> = {}): HeapObj {
  const pyType = typeof value === 'number' ? (Number.isInteger(value) ? 'int' : 'float') : typeof value === 'string' ? 'str' : value === null ? 'NoneType' : 'bool';
  return { id, pyType, kind: 'scalar', value, ...extra };
}

export function table(id: string, pyType: string, data: TableData, extra: Partial<HeapObj> = {}): HeapObj {
  return { id, pyType, kind: 'table', table: data, ...extra };
}

/** Clone profond (les étapes d'une simulation ne doivent pas partager d'objets JS). */
export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

/** Représentation Python d'une valeur primitive. */
export const pyRepr = (x: Prim): string =>
  x === null ? 'None' : typeof x === 'string' ? `'${x}'` : typeof x === 'boolean' ? (x ? 'True' : 'False') : String(x);
