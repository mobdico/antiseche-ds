/**
 * Mini-modèle pandas pour les simulateurs (contenu uniquement).
 * Valeur manquante (NaN / None) = null.
 * Les résultats des fiches ont été vérifiés avec le vrai pandas (2.2 et 3.1).
 */
import type { HeapObj, Prim } from '../../engine/types';

export type Dtype = 'int64' | 'float64' | 'object' | 'bool';

export interface Frame {
  columns: string[];
  index: (string | number)[];
  rows: Prim[][];
  dtypes?: Dtype[]; // déduit si absent
  indexName?: string;
}

export interface Series {
  name: string | null;
  index: (string | number)[];
  values: Prim[];
  dtype?: Dtype;
  indexName?: string;
}

export function inferDtype(values: Prim[]): Dtype {
  const nn = values.filter((v) => v !== null);
  if (nn.length && nn.every((v) => typeof v === 'boolean')) return 'bool';
  if (nn.every((v) => typeof v === 'number')) {
    if (values.some((v) => v === null) || nn.some((v) => !Number.isInteger(v))) return 'float64';
    return 'int64';
  }
  return 'object';
}

export const col = (f: Frame, name: string): Prim[] => f.rows.map((r) => r[f.columns.indexOf(name)]);
export const dtypesOf = (f: Frame): Dtype[] => f.dtypes ?? f.columns.map((c) => inferDtype(col(f, c)));

export function toSeries(f: Frame, name: string): Series {
  const j = f.columns.indexOf(name);
  return { name, index: [...f.index], values: f.rows.map((r) => r[j]), dtype: dtypesOf(f)[j] };
}

export function selectRows(f: Frame, positions: number[]): Frame {
  return { ...f, index: positions.map((i) => f.index[i]), rows: positions.map((i) => [...f.rows[i]]), dtypes: dtypesOf(f) };
}

// ------------------------------------------------------------------ formatage façon pandas
function fmtColumn(values: Prim[], dtype: Dtype): string[] {
  if (dtype === 'float64') {
    const nums = values.filter((v): v is number => typeof v === 'number');
    let dec = 1;
    for (const n of nums) {
      const s = String(n);
      const d = s.includes('.') ? s.split('.')[1].length : 0;
      dec = Math.max(dec, Math.min(d, 6));
    }
    return values.map((v) => (v === null ? 'NaN' : (v as number).toFixed(dec)));
  }
  if (dtype === 'bool') return values.map((v) => (v === null ? 'NaN' : v ? 'True' : 'False'));
  return values.map((v) => (v === null ? 'NaN' : typeof v === 'boolean' ? (v ? 'True' : 'False') : String(v)));
}

const padL = (s: string, n: number) => s.padStart(n);
const padR = (s: string, n: number) => s.padEnd(n);

/** Équivalent (simplifié) de print(df). */
export function fmtFrame(f: Frame): string[] {
  if (!f.rows.length) return ['Empty DataFrame', `Columns: [${f.columns.join(', ')}]`, 'Index: []'];
  const dts = dtypesOf(f);
  const cells = f.columns.map((_c, j) => fmtColumn(f.rows.map((r) => r[j]), dts[j]));
  const idx = f.index.map(String);
  const idxW = Math.max(...idx.map((s) => s.length), f.indexName?.length ?? 0);
  const widths = f.columns.map((c, j) => Math.max(c.length, ...cells[j].map((s) => s.length)));
  const lines = [padR('', idxW) + f.columns.map((c, j) => '  ' + padL(c, widths[j])).join('')];
  if (f.indexName) lines.push(padR(f.indexName, idxW) + widths.map((w) => '  ' + ' '.repeat(w)).join(''));
  idx.forEach((ix, i) => lines.push(padR(ix, idxW) + cells.map((cc, j) => '  ' + padL(cc[i], widths[j])).join('')));
  return lines.map((l) => l.replace(/\s+$/, ''));
}

/** Équivalent (simplifié) de print(serie). */
export function fmtSeries(s: Series): string[] {
  const dtype = s.dtype ?? inferDtype(s.values);
  const vals = fmtColumn(s.values, dtype);
  const idx = s.index.map(String);
  const idxW = Math.max(...idx.map((x) => x.length), 0);
  const w = Math.max(...vals.map((x) => x.length), 0);
  const lines: string[] = [];
  if (s.indexName) lines.push(s.indexName);
  idx.forEach((ix, i) => lines.push(padR(ix, idxW) + '    ' + padL(vals[i], w)));
  lines.push(s.name !== null ? `Name: ${s.name}, dtype: ${dtype}` : `dtype: ${dtype}`);
  return lines;
}

// ------------------------------------------------------------------ objets du schéma mémoire
export function frameObj(id: string, f: Frame, extra: Partial<HeapObj> = {}): HeapObj {
  return {
    id, pyType: 'DataFrame', kind: 'table',
    table: { columns: f.columns, index: f.index, rows: f.rows, dtypes: dtypesOf(f) },
    indexName: f.indexName,
    note: `shape (${f.rows.length}, ${f.columns.length})`,
    ...extra,
  };
}

export function seriesObj(id: string, s: Series, extra: Partial<HeapObj> = {}): HeapObj {
  return {
    id, pyType: 'Series', kind: 'table',
    table: { columns: [s.name ?? ''], index: s.index, rows: s.values.map((v) => [v]), dtypes: [s.dtype ?? inferDtype(s.values)] },
    indexName: s.indexName,
    note: `dtype ${s.dtype ?? inferDtype(s.values)}${s.name !== null ? ` · name '${s.name}'` : ''}`,
    ...extra,
  };
}

// ------------------------------------------------------------------ jeux de données communs
/** Le DataFrame d'exemple utilisé dans la plupart des fiches pandas. */
export const VENTES: Frame = {
  columns: ['ville', 'pays', 'ventes', 'employes'],
  index: ['a', 'b', 'c', 'd', 'e'],
  rows: [
    ['Paris', 'France', 120, 10],
    ['Lyon', 'France', 80, 6],
    ['Berlin', 'Allemagne', null, 8],
    ['Munich', 'Allemagne', 150, 12],
    ['Madrid', 'Espagne', 95, 7],
  ],
  dtypes: ['object', 'object', 'float64', 'int64'],
};

export const VENTES_CODE = `df = pd.DataFrame({
    "ville":    ["Paris", "Lyon", "Berlin", "Munich", "Madrid"],
    "pays":     ["France", "France", "Allemagne", "Allemagne", "Espagne"],
    "ventes":   [120.0, 80.0, np.nan, 150.0, 95.0],
    "employes": [10, 6, 8, 12, 7],
}, index=["a", "b", "c", "d", "e"])`;

export const copyFrame = (f: Frame): Frame => ({ ...f, index: [...f.index], rows: f.rows.map((r) => [...r]), dtypes: f.dtypes ? [...f.dtypes] : undefined });
