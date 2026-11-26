import { defineFiche, type HeapObj, type SimAlert, type SimResult, type SimStep } from '../../engine/types';
import { r } from '../../engine/sim-helpers';
import { NOTES, NOTES_CODE, arr1, arr2, cloneMat, str1, str2, type Mat } from '../_lib/numpy-sim';

const A = (m: Mat = NOTES, extra: Partial<HeapObj> = {}) => arr2('a', m, 'int64', extra);
const step0: SimStep = { label: 'a', code: 'a = np.array([[...], ...])', vars: [{ name: 'a', ref: 'a' }], heap: [A()], note: '4 élèves × 3 matières (maths, physique, info).' };

// ------------------------------------------------------------------ 2. masques : filtrer et assigner
const MASK = NOTES.map((row) => (row[0] as number) > 10); // maths > 10 → élèves 0 et 2

function simMasque(use: string): SimResult {
  const maskObj = arr1('m', MASK, 'bool');
  const s1: SimStep = { label: 'Masque', code: 'masque = a[:, 0] > 10', vars: [{ name: 'a', ref: 'a' }, { name: 'masque', ref: 'm' }], heap: [A(NOTES, { selected: ['*:0'] }), maskObj],
    note: 'Comparaison **vectorisée** sur la colonne 0 (maths) → un tableau de booléens, un par élève.' };
  const base = `import numpy as np\n\n${NOTES_CODE}\n\nmasque = a[:, 0] > 10\n`;
  const rowsIn = MASK.flatMap((b, i) => (b ? [i] : []));
  if (use === 'filtre' || use === 'filtrecols') {
    const cols = use === 'filtre' ? [0, 1, 2] : [1, 2];
    const m = rowsIn.map((i) => cols.map((j) => NOTES[i][j]));
    const line = use === 'filtre' ? 'res = a[masque]' : 'res = a[masque, 1:]';
    return {
      code: base + `${line}\nprint(res)`,
      steps: [step0, s1, { label: line.slice(6), code: line, vars: [{ name: 'a', ref: 'a' }, { name: 'masque', ref: 'm' }, { name: 'res', ref: 'res' }],
        heap: [A(NOTES, { selected: rowsIn.flatMap((i) => cols.map((j) => `${i}:${j}`)) }), maskObj, arr2('res', m, 'int64', { badges: ['copie'], fields: [{ label: '.base', slot: { v: null }, hint: 'données propres' }] })],
        note: use === 'filtre' ? 'Le masque sélectionne les **lignes** où il vaut True (élèves 0 et 2).' : 'Masque sur les lignes **et** tranche sur les colonnes, comme `tableau[masque, 5:9]`.' }],
      output: str2(m, 'int64'),
      alerts: [{ level: 'info', atStep: 2, title: 'Copie', message: 'L’indexation booléenne renvoie toujours une **copie** : modifier `res` ne touche pas `a`.' }],
      verdict: '`tableau[masque]` → seulement les lignes où le masque vaut True.',
    };
  }
  if (use === 'assign') {
    const m = cloneMat(NOTES);
    rowsIn.forEach((i) => (m[i][2] = 20));
    return {
      code: base + 'a[masque, 2] = 20\nprint(a)',
      steps: [step0, s1, { label: 'Assigner', code: 'a[masque, 2] = 20', vars: [{ name: 'a', ref: 'a' }, { name: 'masque', ref: 'm' }], heap: [A(m, { changed: rowsIn.map((i) => `${i}:2`) }), maskObj],
        note: '`a` est **modifié sur place** : seules les cases (lignes True, colonne 2) reçoivent 20.' }],
      output: str2(m, 'int64'),
      verdict: '`tableau[masque, col] = valeur` : corriger seulement les lignes ciblées.',
    };
  }
  // masque 2D sur tout le tableau
  const full: Mat = NOTES.map((row) => row.map((x) => (x as number) > 14));
  const cells = full.flatMap((row, i) => row.flatMap((b, j) => (b ? [`${i}:${j}`] : [])));
  const m2 = arr2('m2', full, 'bool');
  const s2: SimStep = { label: 'Masque 2D', code: 'masque = a > 14', vars: [{ name: 'a', ref: 'a' }, { name: 'masque', ref: 'm2' }], heap: [A(), m2], note: 'Comparer **tout le tableau** donne un masque de même forme (4, 3).' };
  if (use === 'clip') {
    const m = cloneMat(NOTES).map((row) => row.map((x) => ((x as number) > 14 ? 15 : x)));
    return {
      code: `import numpy as np\n\n${NOTES_CODE}\n\na[a > 14] = 15\nprint(a)`,
      steps: [step0, s2, { label: 'Plafonner', code: 'a[a > 14] = 15', vars: [{ name: 'a', ref: 'a' }, { name: 'masque', ref: 'm2' }], heap: [A(m, { changed: cells.filter((c) => c !== '0:1') }), m2],
        note: 'Toutes les notes > 14 sont ramenées à 15 (sur place). Le 15 existant reste 15.' }],
      output: str2(m, 'int64'),
      verdict: '`a[a > seuil] = valeur` : plafonner des valeurs aberrantes en une ligne.',
    };
  }
  const vals = cells.map((c) => { const [i, j] = c.split(':').map(Number); return NOTES[i][j]; });
  return {
    code: `import numpy as np\n\n${NOTES_CODE}\n\nres = a[a > 14]\nprint(res)`,
    steps: [step0, s2, { label: 'a[a > 14]', code: 'res = a[a > 14]', vars: [{ name: 'a', ref: 'a' }, { name: 'masque', ref: 'm2' }, { name: 'res', ref: 'res' }],
      heap: [A(NOTES, { selected: cells }), m2, arr1('res', vals, 'int64', { badges: ['copie'] })], note: 'Les valeurs retenues sont mises **à plat** dans un tableau **1D**, dans l’ordre de lecture.' }],
    output: [str1(vals, 'int64')],
    alerts: [{ level: 'warning', atStep: 2, title: 'Le résultat est 1D', message: 'Un masque 2D ne peut pas garder la forme (4, 3) : on obtient un tableau de **3 valeurs**, sans savoir de quelle ligne elles viennent.' }],
    verdict: 'Masque 2D → résultat **1D**.',
  };
}

// ------------------------------------------------------------------ 3. vue ou copie
const SELS: Record<string, { code: string; view: boolean; cells: string[]; mut: string; get: (m: Mat) => Mat | (number | null)[] }> = {
  col: { code: 'x = a[:, 0]', view: true, cells: ['*:0'], mut: 'x[0] = 99', get: (m) => m.map((row) => row[0] as number) },
  colcopy: { code: 'x = a[:, 0].copy()', view: false, cells: ['*:0'], mut: 'x[0] = 99', get: (m) => m.map((row) => row[0] as number) },
  slice: { code: 'x = a[1:3]', view: true, cells: ['1:*', '2:*'], mut: 'x[0, 0] = 99', get: (m) => m.slice(1, 3).map((row) => [...row]) },
  mask: { code: 'x = a[a[:, 0] > 10]', view: false, cells: ['0:*', '2:*'], mut: 'x[0, 0] = 99', get: (m) => [[...m[0]], [...m[2]]] },
};

function simVue(sel: string): SimResult {
  const s = SELS[sel] ?? SELS.col;
  const before = s.get(NOTES);
  const oneD = !Array.isArray(before[0]);
  const after = oneD ? [99, ...(before as number[]).slice(1)] : (before as Mat).map((row, i) => (i === 0 ? [99, ...row.slice(1)] : row));
  const aAfter = cloneMat(NOTES);
  const changedA = s.view ? [sel === 'col' ? '0:0' : '1:0'] : [];
  if (s.view) aAfter[sel === 'col' ? 0 : 1][0] = 99;
  const field = { fields: [{ label: '.base', slot: s.view ? r('a') : { v: null }, hint: s.view ? 'vue sur a' : 'données propres' }], badges: [s.view ? 'vue' : 'copie'] };
  const mk = (vals: Mat | (number | null)[], extra: Partial<HeapObj>) => (oneD ? arr1('x', vals as number[], 'int64', { ...field, ...extra }) : arr2('x', vals as Mat, 'int64', { ...field, ...extra }));
  const alerts: SimAlert[] = [s.view
    ? { level: 'warning', atStep: 2, title: '`a` a été modifié !', message: `\`${s.code.slice(4)}\` est une **vue** : \`x\` et \`a\` partagent la même mémoire. Modifier \`x\` modifie \`a\`.` }
    : { level: 'success', atStep: 2, title: '`a` est intact', message: sel === 'mask' ? 'L’indexation booléenne crée une **copie**.' : '`.copy()` crée un tableau **indépendant**.' }];
  return {
    code: `import numpy as np\n\n${NOTES_CODE}\n\n${s.code}\n${s.mut}\nprint(a)`,
    steps: [step0,
      { label: 'Sélectionner', code: s.code, vars: [{ name: 'a', ref: 'a' }, { name: 'x', ref: 'x' }], heap: [A(NOTES, { selected: s.cells }), mk(before, {})],
        note: s.view ? '`x.base` pointe vers `a` : `x` est une **fenêtre** sur les données de `a`, rien n’est copié.' : '`x.base` vaut None : `x` possède **ses propres données**.' },
      { label: 'Modifier x', code: s.mut, vars: [{ name: 'a', ref: 'a' }, { name: 'x', ref: 'x' }], heap: [A(aAfter, { changed: changedA }), mk(after, { changed: oneD ? ['0:0'] : ['0:0'] })], inspect: 'a' },
    ],
    output: str2(aAfter, 'int64'),
    alerts,
    verdict: s.view ? 'Tranches et sélections de colonnes = **vues**. Ajouter `.copy()` pour travailler sans risque.' : 'Copie indépendante : `a` ne bouge pas.',
  };
}

export default defineFiche({
  id: 'numpy-indexation-booleenne',
  title: 'L’indexation booléenne avec NumPy',
  theme: 'numpy',
  tags: ['selection', 'references'],
  keywords: ['masque', 'indexation booléenne', 'nan', 'vue', 'copie', 'genfromtxt', 'np.genfromtxt', 'delimiter', 'skip_header', 'nan', 'masque', 'mask', 'tableau[masque]', 'tableau[masque] = valeur', '>', '<', '==', '!=', 'vue', 'copie', '.copy()', '.base', 'view'],
  summary: 'Filtrer et modifier un ndarray avec un **masque booléen**, et savoir quand on obtient une **vue** ou une **copie**.',
  concept: `
- Un **masque booléen** est un tableau de True et False créé avec un opérateur de comparaison (\`>\`, \`<\`, \`==\`, \`!=\`), utilisé pour **filtrer** ou **assigner** des valeurs dans un ndarray.
- L’indexation booléenne fonctionne aussi bien en 1D qu’en 2D, en combinant le masque avec une sélection de colonnes (\`tableau[masque, 5:9]\`).
- Sélectionner une colonne d’un ndarray 2D avec \`tableau[:, index_colonne]\` renvoie une **vue**, pas une copie : modifier cette sélection modifie aussi le tableau d’origine.
`,
  useCase: 'Isoler les trajets de plus de 10 km, corriger les valeurs aberrantes, extraire les lignes d’une catégorie, sans boucle.',
  syntax: `tableau > valeur                             # créer un masque
tableau[masque]                              # filtrer
tableau[masque] = nouvelle_valeur            # assigner`,
  simulator: {
    title: 'Simulateur — filtrer et assigner avec un masque',
    params: [{ id: 'use', label: 'Instruction', type: 'choice', default: 'filtre', options: [
      { value: 'filtre', label: '`a[masque]`' }, { value: 'filtrecols', label: '`a[masque, 1:]`' }, { value: 'assign', label: '`a[masque, 2] = 20`' },
      { value: 'flat', label: '`a[a > 14]`' }, { value: 'clip', label: '`a[a > 14] = 15`' },
    ] }],
    simulate: (p) => simMasque(String(p.use)),
  },
  simulators: [
    {
      title: 'Simulateur — vue ou copie ?',
      params: [{ id: 'sel', label: 'Sélection, puis modification de x', type: 'choice', default: 'col', options: [
        { value: 'col', label: '`a[:, 0]`' }, { value: 'colcopy', label: '`a[:, 0].copy()`' }, { value: 'slice', label: '`a[1:3]`' }, { value: 'mask', label: '`a[a[:, 0] > 10]`' },
      ] }],
      simulate: (p) => simVue(String(p.sel)),
    },
  ],
  pitfalls: [
    '`a[:, 0]` et `a[1:3]` sont des **vues** : les modifier modifie le tableau d’origine.',
    '`a[masque]` est une **copie** : modifier le résultat ne change pas `a` (pour modifier : `a[masque] = …`).',
    'Un masque 2D (`a[a > 14]`) donne un résultat **1D**.',
  ],
  takeaways: [
    'Masque = comparaison vectorisée → tableau de bool.',
    'Filtrer : `a[masque]` ; corriger : `a[masque] = v`.',
    'Tranche = vue ; masque / liste d’indices = copie ; en cas de doute : `.copy()`.',
  ],
  related: ['numpy-introduction', 'pandas-statistiques-filtrage'],
  source: 'DataXp — Introduction à NumPy et Pandas, chapitre 2 (sources/numpy/dataxp-indexation-booleenne-numpy.pdf)',
});
