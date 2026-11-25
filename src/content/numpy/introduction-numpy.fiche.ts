import { defineFiche, type HeapObj, type SimAlert, type SimResult, type SimStep } from '../../engine/types';
import { list, r } from '../../engine/sim-helpers';
import { NOTES, NOTES_CODE, arr1, arr2, cloneMat, str1, str2, type Mat } from '../_lib/numpy-sim';

const A = (extra: Partial<HeapObj> = {}) => arr2('a', NOTES, 'int64', extra);
const step0: SimStep = { label: 'a', code: 'a = np.array([[...], ...])', vars: [{ name: 'a', ref: 'a' }], heap: [A()],
  note: 'Un ndarray 2D : **4 lignes** (élèves) × **3 colonnes** (matières). Un seul type pour tout le tableau : int64.' };

// ------------------------------------------------------------------ 1. sélection : ligne, colonne, cellule… vue ou copie
type Sel = { code: string; cells: string[]; result: HeapObj; out: string[]; view: boolean; note: string };
const col = (j: number) => NOTES.map((row) => row[j]);

function selection(sel: string): Sel {
  const viewField = (v: boolean) => ({ fields: [{ label: '.base', slot: v ? r('a') : { v: null }, hint: v ? 'vue sur a' : 'données propres' }], badges: [v ? 'vue' : 'copie'] });
  switch (sel) {
    case 'col': return { code: 'res = a[:, 1]', cells: ['*:1'], view: true, result: arr1('res', col(1), 'int64', viewField(true)), out: [str1(col(1), 'int64')],
      note: '`[:, 1]` : **toutes** les lignes, colonne 1 → un tableau **1D** de 4 valeurs. C’est une **vue** : `res` lit directement les données de `a`.' };
    case 'cell': return { code: 'res = a[1, 2]', cells: ['1:2'], view: false, result: { id: 'res', pyType: 'int', kind: 'scalar', value: 14, fullType: 'numpy.int64' }, out: ['14'],
      note: '`a[ligne, colonne]` → **une valeur**, un scalaire NumPy (np.int64), plus un tableau.' };
    case 'slice': {
      const m = NOTES.slice(1, 3);
      return { code: 'res = a[1:3]', cells: ['1:*', '2:*'], view: true, result: arr2('res', m, 'int64', viewField(true)), out: str2(m, 'int64'),
        note: 'Tranche de lignes 1 et 2 (la 3 est **exclue**) → un tableau 2D (2, 3), **vue** sur `a`.' };
    }
    case 'cols': {
      const m = NOTES.map((row) => row.slice(1));
      return { code: 'res = a[:, 1:]', cells: ['*:1', '*:2'], view: true, result: arr2('res', m, 'int64', viewField(true)), out: str2(m, 'int64'),
        note: 'Toutes les lignes, colonnes 1 et suivantes → (4, 2), **vue**.' };
    }
    case 'fancy': {
      const m = [NOTES[0], NOTES[2]];
      return { code: 'res = a[[0, 2]]', cells: ['0:*', '2:*'], view: false, result: arr2('res', m, 'int64', viewField(false)), out: str2(m, 'int64'),
        note: 'Une **liste** d’indices (*fancy indexing*) choisit des lignes non contiguës : NumPy doit **copier** les données.' };
    }
    default: return { code: 'res = a[1]', cells: ['1:*'], view: true, result: arr1('res', NOTES[1], 'int64', viewField(true)), out: [str1(NOTES[1], 'int64')],
      note: '`a[1]` = la **ligne** 1 → un tableau **1D** de 3 valeurs (shape (3,)). Vue sur `a`.' };
  }
}

function simSelection(sel: string): SimResult {
  const s = selection(sel);
  const alerts: SimAlert[] = [];
  if (s.view) alerts.push({ level: 'warning', atStep: 1, title: 'Vue, pas copie', message: 'Modifier `res` modifierait aussi `a` (ils partagent la même mémoire). Pour un tableau indépendant : `a[…].copy()`.' });
  return {
    code: `import numpy as np\n\n${NOTES_CODE}\n\n${s.code}\nprint(res)\nprint(res.shape)`,
    steps: [step0, { label: 'Sélectionner', code: s.code, vars: [{ name: 'a', ref: 'a' }, { name: 'res', ref: 'res' }], heap: [A({ selected: s.cells }), s.result], note: s.note }],
    output: [...s.out, sel === 'cell' ? '()' : `(${s.result.note?.match(/\(([^)]*)\)/)?.[1] ?? ''})`],
    alerts,
    verdict: 'Lire `a[lignes, colonnes]` : avant la virgule les lignes, après les colonnes ; `:` = tout.',
  };
}

// ------------------------------------------------------------------ 2. agréger le long d'un axe
const AGG: Record<string, Record<string, { v: number | number[]; dtype: 'int64' | 'float64' }>> = {
  sum: { none: { v: 147, dtype: 'int64' }, '0': { v: [47, 55, 45], dtype: 'int64' }, '1': { v: [36, 33, 40, 38], dtype: 'int64' } },
  mean: { none: { v: 12.25, dtype: 'float64' }, '0': { v: [11.75, 13.75, 11.25], dtype: 'float64' }, '1': { v: [12, 11, 13.33333333, 12.66666667], dtype: 'float64' } },
  max: { none: { v: 17, dtype: 'int64' }, '0': { v: [17, 16, 14], dtype: 'int64' }, '1': { v: [15, 14, 17, 16], dtype: 'int64' } },
};

function simAxis(method: string, axis: string, form: string): SimResult {
  const res = (AGG[method] ?? AGG.sum)[axis] ?? AGG.sum.none;
  const arg = axis === 'none' ? '' : `axis=${axis}`;
  const call = form === 'fonction' ? `np.${method}(a${arg ? ', ' + arg : ''})` : `a.${method}(${arg})`;
  const isArr = Array.isArray(res.v);
  const resObj: HeapObj = isArr
    ? arr1('res', res.v as number[], res.dtype)
    : { id: 'res', pyType: res.dtype === 'int64' ? 'int' : 'float', kind: 'scalar', value: res.v as number, fullType: `numpy.${res.dtype}` };
  const rowColors = axis === '1' ? [0, 2, 3, 5] : undefined;
  const note = axis === 'none' ? 'Sans `axis` : **toutes** les valeurs sont agrégées en **un seul nombre**.'
    : axis === '0' ? '`axis=0` : on agrège **en descendant les lignes** → un résultat **par colonne** (3 valeurs). L’axe 0 « disparaît ».'
      : '`axis=1` : on agrège **le long de chaque ligne** → un résultat **par ligne** (4 valeurs). L’axe 1 « disparaît ».';
  return {
    code: `import numpy as np\n\n${NOTES_CODE}\n\nres = ${call}\nprint(res)`,
    steps: [step0, { label: call, code: `res = ${call}`, vars: [{ name: 'a', ref: 'a' }, { name: 'res', ref: 'res' }],
      heap: [A({ rowColors, selected: axis === '0' ? ['*:0', '*:1', '*:2'] : [] }), resObj], note }],
    output: [isArr ? str1(res.v as number[], res.dtype) : String(res.v)],
    alerts: [
      ...(form === 'fonction' ? [{ level: 'info' as const, atStep: 1, title: 'Fonction ou méthode ?', message: '`np.sum(a, axis=0)` (fonction) et `a.sum(axis=0)` (méthode) donnent **le même résultat**. Une méthode s’appelle sur l’objet, une fonction reçoit l’objet en argument.' }] : []),
      ...(method === 'mean' ? [{ level: 'info' as const, atStep: 1, title: 'mean() → float64', message: 'La moyenne d’entiers est toujours un **float**, même si le résultat tombe juste (12.).' }] : []),
    ],
    verdict: `shape (4, 3) → ${axis === 'none' ? 'un scalaire' : axis === '0' ? 'shape (3,)' : 'shape (4,)'}. Moyen mnémotechnique : **axis = la dimension qui disparaît**.`,
  };
}

// ------------------------------------------------------------------ 3. vectorisation et broadcasting
function simBroadcast(op: string): SimResult {
  const m = cloneMat(NOTES);
  const scalarOp = (f: (x: number) => number): Mat => m.map((row) => row.map((x) => f(x as number)));
  if (op === 'list') {
    const l = [12, 15, 9];
    return {
      code: 'liste = [12, 15, 9]\nprint(liste * 2)\nprint(np.array(liste) * 2)',
      steps: [
        { label: 'liste * 2', code: 'res = liste * 2', vars: [{ name: 'liste', ref: 'l' }, { name: 'res', ref: 'res' }], heap: [list('l', l), list('res', [...l, ...l], { changed: [3, 4, 5] })],
          note: 'Sur une **liste Python**, `* 2` **répète** la liste (concaténation) : 6 éléments.' },
        { label: 'array * 2', code: 'res = np.array(liste) * 2', vars: [{ name: 'liste', ref: 'l' }, { name: 'res', ref: 'res2' }], heap: [list('l', l), arr1('res2', l.map((x) => x * 2), 'int64', { changed: ['0:0', '0:1', '0:2'] })],
          note: 'Sur un **ndarray**, `* 2` multiplie **chaque élément** : c’est la vectorisation.' },
      ],
      output: ['[12, 15, 9, 12, 15, 9]', str1([24, 30, 18], 'int64')],
      alerts: [{ level: 'warning', atStep: 0, title: 'Même opérateur, sens différent', message: 'Avec une liste, `*` répète ; avec un ndarray, `*` calcule. Convertir avec `np.array()` avant de calculer.' }],
      verdict: 'Vectorisation : une opération sur **tout le tableau** d’un coup, sans boucle `for`.',
    };
  }
  if (op === 'bad') {
    return {
      code: `${NOTES_CODE}\n\nres = a + np.array([1, 2])`,
      steps: [step0, { label: 'a + [1, 2]', code: 'res = a + np.array([1, 2])', vars: [{ name: 'a', ref: 'a' }, { name: 'b', ref: 'b' }], heap: [A(), arr1('b', [1, 2], 'int64')],
        note: '`a` a 3 colonnes, `b` a 2 valeurs : impossible de les aligner.' }],
      output: ['Traceback (most recent call last):', '  ...', 'ValueError: operands could not be broadcast together with shapes (4,3) (2,) '],
      alerts: [{ level: 'error', atStep: 1, title: 'ValueError (broadcasting)', message: 'Pour combiner (4, 3) et un 1D, ce dernier doit avoir **3** valeurs (une par colonne) — ou 1 seule.' }],
      verdict: 'Broadcasting : les dimensions doivent être **égales ou valoir 1**, en partant de la droite.',
    };
  }
  const C: Record<string, { code: string; mat: Mat; dtype: 'int64' | 'float64'; note: string; extra?: HeapObj }> = {
    mul: { code: 'res = a * 2', mat: scalarOp((x) => x * 2), dtype: 'int64', note: 'La valeur 2 est « étendue » (broadcast) à la forme (4, 3) : chaque note est doublée.' },
    pct: { code: 'res = a / 20 * 100', mat: scalarOp((x) => (x / 20) * 100), dtype: 'float64', note: 'Notes sur 20 → pourcentages. `/` produit toujours des **float64**.' },
    row: { code: 'res = a + np.array([1, 0, -1])', mat: m.map((row) => row.map((x, j) => (x as number) + [1, 0, -1][j])), dtype: 'int64',
      note: 'Le tableau (3,) est répété sur **chaque ligne** : +1 en maths, 0 en physique, −1 en info.', extra: arr1('b', [1, 0, -1], 'int64') },
  };
  const c = C[op] ?? C.mul;
  return {
    code: `import numpy as np\n\n${NOTES_CODE}\n\n${c.code}\nprint(res)`,
    steps: [step0, { label: c.code.slice(6), code: c.code, vars: [{ name: 'a', ref: 'a' }, ...(c.extra ? [{ name: 'b', ref: 'b' }] : []), { name: 'res', ref: 'res' }],
      heap: [A(), ...(c.extra ? [c.extra] : []), arr2('res', c.mat, c.dtype, { badges: ['nouvel objet'] })], note: c.note }],
    output: str2(c.mat, c.dtype),
    verdict: 'Opération vectorisée : pas de boucle, un **nouveau** tableau de même forme.',
  };
}

export default defineFiche({
  id: 'numpy-introduction',
  title: 'Introduction à NumPy : ndarray, axes et vectorisation',
  theme: 'numpy',
  tags: ['debuter', 'axis', 'references', 'agregation'],
  keywords: ['ndarray', 'shape', 'axis', 'vectorisation', 'broadcasting', 'vue', 'np.array', 'shape', 'ndim', 'dtype', 'sum', 'mean', 'max', 'axis=0', 'axis=1', 'np.mean', 'méthode', 'fonction', 'broadcast',
    'operands could not be broadcast together with shapes', 'ValueError', 'vue', 'copie', 'copy', 'base', 'fancy indexing', 'tranche', 'slicing'],
  summary: 'Le **ndarray**, sélectionner lignes et colonnes, agréger le long d’un **axe**, et calculer sans boucle (vectorisation, broadcasting).',
  concept: `
- Un **ndarray** (*n-dimensional array*) est la structure de données centrale de NumPy. Il peut avoir une ou plusieurs dimensions.
- La **vectorisation** consiste à remplacer une boucle \`for\` par une opération appliquée simultanément à toutes les valeurs d’un tableau, ce qui la rend beaucoup plus rapide.
- Le **broadcasting** permet à NumPy d’effectuer une opération entre un tableau et une valeur unique, en étendant implicitement cette valeur à la forme du tableau.
- L’attribut \`ndarray.shape\` retourne un tuple donnant le nombre de **lignes** puis le nombre de **colonnes** d’un tableau à deux dimensions.
- Une **méthode** s’appelle sur un objet (\`vitesse_mph.mean()\`), une **fonction** s’appelle indépendamment (\`np.mean(vitesse_mph)\`). NumPy propose souvent les deux formes.
`,
  useCase: 'Calculer en une ligne la moyenne de chaque élève ou de chaque matière, convertir toute une colonne d’unités, sans écrire de boucle.',
  syntax: `import numpy as np
np.array(ma_liste)           # créer un ndarray
ndarray.shape                # dimensions (lignes, colonnes)
ndarray[index_ligne]         # une ligne
ndarray[:, index_colonne]    # une colonne
ndarray.sum(axis=1)          # statistique le long d'un axe`,
  simulator: {
    title: 'Simulateur — sélectionner dans un ndarray',
    params: [{ id: 'sel', label: 'Sélection', type: 'choice', default: 'row', options: [
      { value: 'row', label: '`a[1]`' }, { value: 'col', label: '`a[:, 1]`' }, { value: 'cell', label: '`a[1, 2]`' },
      { value: 'slice', label: '`a[1:3]`' }, { value: 'cols', label: '`a[:, 1:]`' }, { value: 'fancy', label: '`a[[0, 2]]`' },
    ] }],
    simulate: (p) => simSelection(String(p.sel)),
  },
  simulators: [
    {
      title: 'Simulateur — agréger le long d’un axe',
      params: [
        { id: 'method', label: 'Méthode', type: 'choice', default: 'sum', options: [{ value: 'sum', label: '`sum`' }, { value: 'mean', label: '`mean`' }, { value: 'max', label: '`max`' }] },
        { id: 'axis', label: 'axis', type: 'choice', default: '0', options: [{ value: 'none', label: 'aucun' }, { value: '0', label: '`axis=0`' }, { value: '1', label: '`axis=1`' }] },
        { id: 'form', label: 'Écriture', type: 'choice', default: 'methode', options: [{ value: 'methode', label: 'méthode `a.sum()`' }, { value: 'fonction', label: 'fonction `np.sum(a)`' }] },
      ],
      simulate: (p) => simAxis(String(p.method), String(p.axis), String(p.form)),
    },
    {
      title: 'Simulateur — vectorisation et broadcasting',
      params: [{ id: 'op', label: 'Opération', type: 'choice', default: 'mul', options: [
        { value: 'mul', label: '`a * 2`' }, { value: 'pct', label: '`a / 20 * 100`' }, { value: 'row', label: '`a + np.array([1, 0, -1])`' },
        { value: 'bad', label: '`a + np.array([1, 2])`' }, { value: 'list', label: 'liste Python `* 2`' },
      ] }],
      simulate: (p) => simBroadcast(String(p.op)),
    },
  ],
  pitfalls: [
    '`axis=0` donne un résultat **par colonne** (on descend les lignes), `axis=1` un résultat **par ligne**.',
    '`a[1:3]` et `a[:, 1]` sont des **vues** : les modifier modifie `a`.',
    '`liste * 2` répète la liste ; `np.array(liste) * 2` multiplie chaque valeur.',
    'Un ndarray n’a **qu’un seul dtype** : mélanger texte et nombres convertit tout en texte.',
  ],
  takeaways: [
    '`a[lignes, colonnes]`, `:` = tout.',
    '`axis` = la dimension qui disparaît.',
    'Pas de boucle : opérations vectorisées + broadcasting.',
  ],
  related: ['numpy-indexation-booleenne', 'pandas-introduction'],
  source: 'DataXp — Introduction à NumPy et Pandas, chapitre 1 (sources/numpy/dataxp-introduction-numpy.pdf)',
});
