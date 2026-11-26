/**
 * Inspecteur : déduit automatiquement le type et les attributs d'un objet du schéma mémoire.
 * Fonction pure, sans dépendance au contenu.
 */
import type { HeapObj, Prim } from './types';

export interface Attr { name: string; value: string }

const q = (x: Prim) => (typeof x === 'string' ? `'${x}'` : x === null ? 'nan' : typeof x === 'boolean' ? (x ? 'True' : 'False') : String(x));

/** repr façon numpy d'une liste de valeurs (1 dimension, tronquée). */
export function arrayRepr(values: Prim[], dtype?: string, max = 8): string {
  const cut = values.length > max;
  const vals = cut ? [...values.slice(0, 3), ...values.slice(-3)] : values;
  let parts: string[];
  if (dtype === 'float64') parts = vals.map((x) => (x === null ? 'nan' : Number.isInteger(x) ? `${x}.` : String(+(x as number).toFixed(8))));
  else if (dtype === 'object' || dtype === 'str') parts = vals.map((x) => (x === null ? 'nan' : q(x)));
  else parts = vals.map(q);
  if (dtype !== 'object' && dtype !== 'str') { const w = Math.max(...parts.map((x) => x.length)); parts = parts.map((x) => x.padStart(w)); }
  const body = cut ? [...parts.slice(0, 3), '...', ...parts.slice(3)].join(', ') : parts.join(', ');
  return `array([${body}]${dtype === 'object' ? ', dtype=object' : ''})`;
}

/** repr d'un index pandas. */
export function indexRepr(index: (string | number)[], name?: string): string {
  const n = index.length;
  if (n && index.every((v, i) => v === i)) return `RangeIndex(start=0, stop=${n}, step=1)`;
  const shown = n > 8 ? [...index.slice(0, 3).map(q), '...', ...index.slice(-3).map(q)] : index.map(q);
  return `Index([${shown.join(', ')}]${name ? `, name='${name}'` : ''})`;
}

const shapeStr = (dims: number[]) => (dims.length === 1 ? `(${dims[0]},)` : `(${dims.join(', ')})`);

export function inspectObj(o: HeapObj): { type: string; attrs: Attr[] } {
  const attrs: Attr[] = [];
  const t = o.table;
  const numpyNote = o.note && /^numpy\.\w+$/.test(o.note) ? o.note : undefined;
  let type = o.fullType ?? numpyNote ?? o.pyType;
  switch (o.pyType) {
    case 'DataFrame':
      type = o.fullType ?? 'pandas.DataFrame';
      if (t) {
        attrs.push({ name: '.shape', value: shapeStr([t.rows.length, t.columns.length]) });
        attrs.push({ name: '.ndim', value: '2' });
        attrs.push({ name: '.index', value: indexRepr(t.index, o.indexName) });
        attrs.push({ name: '.columns', value: `Index([${t.columns.map((c) => `'${c}'`).join(', ')}])` });
        if (t.dtypes) attrs.push({ name: '.dtypes', value: t.columns.map((c, j) => `${c}: ${t.dtypes![j]}`).join(' · ') });
      }
      break;
    case 'Series':
      type = o.fullType ?? 'pandas.Series';
      if (t) {
        const name = t.columns[0];
        attrs.push({ name: '.shape', value: shapeStr([t.rows.length]) });
        attrs.push({ name: '.name', value: name ? `'${name}'` : 'None' });
        attrs.push({ name: '.dtype', value: t.dtypes?.[0] ?? '?' });
        attrs.push({ name: '.index', value: indexRepr(t.index, o.indexName) });
        attrs.push({ name: '.values', value: arrayRepr(t.rows.map((r) => r[0]), t.dtypes?.[0]) });
      }
      break;
    case 'ndarray':
      type = o.fullType ?? 'numpy.ndarray';
      if (t) {
        const oneD = t.index.length === 1 && t.index[0] === '';
        const dims = oneD ? [t.columns.length] : [t.rows.length, t.columns.length];
        attrs.push({ name: '.shape', value: shapeStr(dims) });
        attrs.push({ name: '.ndim', value: String(dims.length) });
        attrs.push({ name: '.size', value: String(dims.reduce((a, b) => a * b, 1)) });
        attrs.push({ name: '.dtype', value: t.dtypes?.[0] ?? '?' });
      }
      break;
    case 'list':
    case 'tuple':
    case 'Index':
      attrs.push({ name: 'len()', value: String(o.items?.length ?? 0) });
      if (o.pyType === 'Index') type = o.fullType ?? 'pandas.Index';
      break;
    case 'dict':
      attrs.push({ name: 'len()', value: String(o.fields?.length ?? 0) });
      attrs.push({ name: '.keys()', value: `dict_keys([${(o.fields ?? []).map((f) => f.label).join(', ')}])` });
      break;
    case 'str':
      attrs.push({ name: 'len()', value: String(typeof o.value === 'string' ? [...o.value].length : 0) });
      break;
    case 'DataFrameGroupBy':
      type = o.fullType ?? 'pandas.api.typing.DataFrameGroupBy';
      attrs.push({ name: '.ngroups', value: String(o.fields?.length ?? 0) });
      attrs.push({ name: '.groups', value: `{${(o.fields ?? []).map((f) => `'${f.label}': ${f.hint ?? '…'}`).join(', ')}}` });
      break;
    default:
      if (o.kind === 'scalar') attrs.push({ name: 'valeur', value: q(o.value ?? null) });
  }
  // champs « attributs » du schéma (ex. .base) : une référence est résolue en nom de variable par l'inspecteur
  for (const f of o.fields ?? []) {
    if (!f.label.startsWith('.')) continue;
    attrs.push({ name: f.label, value: 'ref' in f.slot ? `@ref:${f.slot.ref}` : q(f.slot.v === null ? 'None' : f.slot.v).replace(/^'None'$/, 'None') });
  }
  // ce qui N'existe PAS sur ce type : source fréquente d'AttributeError
  if (o.pyType === 'Series') attrs.push({ name: '.columns', value: 'n’existe pas (c’est une Series : AttributeError)' });
  if (o.pyType === 'DataFrame') attrs.push({ name: '.name', value: 'n’existe pas (c’est un DataFrame : AttributeError)' });
  for (const a of o.attrs ?? []) {
    const i = attrs.findIndex((x) => x.name === a.name);
    if (i >= 0) attrs[i] = a; else attrs.push(a);
  }
  return { type, attrs };
}
