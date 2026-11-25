/**
 * Mini-modèle NumPy pour les simulateurs (contenu uniquement).
 * nan = null. Formats vérifiés avec NumPy 2.5.
 */
import type { HeapObj, Prim } from '../../engine/types';

export type NpDtype = 'int64' | 'float64' | 'bool';
export type Mat = Prim[][];

function fmtElems(values: Prim[], dtype: NpDtype): string[] {
  if (dtype === 'bool') {
    const s = values.map((v) => (v ? 'True' : 'False'));
    const w = Math.max(...s.map((x) => x.length));
    return s.map((x) => x.padStart(w));
  }
  if (dtype === 'int64') {
    const s = values.map((v) => String(v));
    const w = Math.max(...s.map((x) => x.length));
    return s.map((x) => x.padStart(w));
  }
  // float64 : représentation minimale, partie entière alignée à droite, décimales complétées par des espaces
  const parts = values.map((v) => {
    if (v === null) return null;
    const n = v as number;
    const str = Number.isInteger(n) ? `${n}.` : String(+n.toFixed(8));
    const [i, f = ''] = str.split('.');
    return { i, f };
  });
  const iw = Math.max(...parts.map((p) => (p ? p.i.length : 0)));
  const fw = Math.max(...parts.map((p) => (p ? p.f.length : 0)));
  const total = iw + 1 + fw;
  return parts.map((p) => (p ? `${p.i.padStart(iw)}.${p.f.padEnd(fw)}` : 'nan'.padStart(Math.min(total, Math.max(3, iw + 1))).padEnd(total)));
}

/** repr() d'un tableau 1D. */
export function repr1(values: Prim[], dtype: NpDtype): string {
  return `array([${fmtElems(values, dtype).join(', ')}])`;
}

/** repr() d'un tableau 2D (une ligne de texte par ligne du tableau). */
export function repr2(rows: Mat, dtype: NpDtype): string[] {
  const flat = fmtElems(rows.flat(), dtype);
  const c = rows[0]?.length ?? 0;
  const lines = rows.map((_, i) => `[${flat.slice(i * c, (i + 1) * c).join(', ')}]`);
  return lines.map((l, i) => (i === 0 ? `array([${l}` : `       ${l}`) + (i === lines.length - 1 ? '])' : ','));
}

/** repr() d'un scalaire NumPy, ex. np.int64(147). */
export const reprScalar = (v: number, dtype: 'int64' | 'float64') => `np.${dtype}(${dtype === 'float64' && Number.isInteger(v) ? `${v}.0` : v})`;

const positions = (n: number) => Array.from({ length: n }, (_, i) => String(i));

export function arr2(id: string, rows: Mat, dtype: NpDtype, extra: Partial<HeapObj> = {}): HeapObj {
  return {
    id, pyType: 'ndarray', kind: 'table',
    table: { columns: positions(rows[0]?.length ?? 0), index: rows.map((_, i) => i), rows, dtypes: Array(rows[0]?.length ?? 0).fill(dtype) },
    note: `shape (${rows.length}, ${rows[0]?.length ?? 0}) · ${dtype}`,
    ...extra,
  };
}

export function arr1(id: string, values: Prim[], dtype: NpDtype, extra: Partial<HeapObj> = {}): HeapObj {
  return {
    id, pyType: 'ndarray', kind: 'table',
    table: { columns: positions(values.length), index: [''], rows: [values], dtypes: Array(values.length).fill(dtype) },
    note: `shape (${values.length},) · ${dtype}`,
    ...extra,
  };
}

/** Le tableau d'exemple : 4 élèves × 3 matières. */
export const NOTES: number[][] = [[12, 15, 9], [8, 11, 14], [17, 13, 10], [10, 16, 12]];
export const NOTES_CODE = `a = np.array([[12, 15,  9],    # élève 0 : maths, physique, info
              [ 8, 11, 14],    # élève 1
              [17, 13, 10],    # élève 2
              [10, 16, 12]])   # élève 3`;
export const cloneMat = (m: Mat): Mat => m.map((r) => [...r]);

/** str() d'un tableau 1D, c.-à-d. ce qu'affiche print(tableau) : [12 15  9]. */
export function str1(values: Prim[], dtype: NpDtype): string {
  return `[${fmtElems(values, dtype).join(' ')}]`;
}

/** str() d'un tableau 2D : [[12 15  9]\n [ 8 11 14]]. */
export function str2(rows: Mat, dtype: NpDtype): string[] {
  const flat = fmtElems(rows.flat(), dtype);
  const c = rows[0]?.length ?? 0;
  return rows.map((_, i) => `${i === 0 ? '[[' : ' ['}${flat.slice(i * c, (i + 1) * c).join(' ')}]${i === rows.length - 1 ? ']' : ''}`);
}
