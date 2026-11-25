import { defineFiche, type HeapObj, type SimAlert, type SimResult } from '../../engine/types';
import { VENTES, VENTES_CODE, copyFrame, fmtFrame, frameObj, selectRows, seriesObj, type Series } from '../_lib/pandas-sim';

// ------------------------------------------------------------------ simulateur 1 : indexation booléenne
const CONDS: Record<string, { code: string; col: number; mask: boolean[]; alert?: SimAlert }> = {
  pays: { code: 'df["pays"] == "France"', col: 1, mask: [true, true, false, false, false] },
  ventes: {
    code: 'df["ventes"] > 100', col: 2, mask: [true, false, false, true, false],
    alert: { level: 'info', atStep: 1, title: 'NaN dans une comparaison', message: 'Pour la ligne c, `NaN > 100` vaut **False** : une valeur manquante ne vérifie jamais une comparaison.' },
  },
  employes: { code: 'df["employes"] >= 8', col: 3, mask: [true, false, true, true, false] },
};

function simFiltre(cond: string, action: string): SimResult {
  const c = CONDS[cond] ?? CONDS.pays;
  const df = copyFrame(VENTES);
  const maskS: Series = { name: df.columns[c.col], index: [...df.index], values: c.mask, dtype: 'bool' };
  const pos = c.mask.flatMap((m, i) => (m ? [i] : []));
  const rowSel = pos.map((i) => `${i}:*`);
  const step1 = { label: 'Créer df', code: 'df = pd.DataFrame({...})', vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', df)] };
  const step2 = {
    label: 'Masque booléen', code: `masque = ${c.code}`,
    vars: [{ name: 'df', ref: 'df' }, { name: 'masque', ref: 'masque' }],
    heap: [frameObj('df', df, { selected: [`*:${c.col}`] }), seriesObj('masque', maskS)],
    note: 'Opération **vectorisée** : la comparaison est appliquée à toute la colonne d’un coup, sans boucle `for`. Résultat : une Series de booléens alignée sur l’index.',
  };
  const alerts = c.alert ? [c.alert] : [];
  const base = `import numpy as np\nimport pandas as pd\n\n${VENTES_CODE}\n\nmasque = ${c.code}\n`;

  if (action === 'affecter') {
    const after = copyFrame(df);
    pos.forEach((i) => (after.rows[i][2] = 0));
    return {
      code: base + 'df.loc[masque, "ventes"] = 0\nprint(df)',
      steps: [step1, step2, {
        label: 'Affecter', code: 'df.loc[masque, "ventes"] = 0',
        vars: [{ name: 'df', ref: 'df' }, { name: 'masque', ref: 'masque' }],
        heap: [frameObj('df', after, { changed: pos.map((i) => `${i}:2`) }), seriesObj('masque', maskS)],
        note: '`df` est **modifié sur place** : seules les lignes où le masque vaut True reçoivent la valeur.',
      }],
      output: fmtFrame(after),
      alerts,
      verdict: '`df.loc[masque, "colonne"] = valeur` : **filtrer et corriger** en une seule instruction.',
    };
  }
  if (action === 'compter') {
    return {
      code: base + 'n = masque.sum()\nprint(n)',
      steps: [step1, step2, {
        label: 'Compter', code: 'n = masque.sum()',
        vars: [{ name: 'df', ref: 'df' }, { name: 'masque', ref: 'masque' }, { name: 'n', ref: 'n' }],
        heap: [frameObj('df', df, { selected: rowSel.length ? rowSel : ['-1:*'] }), seriesObj('masque', maskS), { id: 'n', pyType: 'int', kind: 'scalar', value: pos.length, note: 'numpy.int64' }],
        note: 'True compte pour 1 et False pour 0 : la somme d’un masque = **nombre de lignes** qui vérifient la condition.',
      }],
      output: [String(pos.length)],
      alerts,
      verdict: '`masque.sum()` → combien de lignes vérifient la condition.',
    };
  }
  const res = selectRows(df, pos);
  return {
    code: base + 'res = df[masque]\nprint(res)',
    steps: [step1, step2, {
      label: 'Filtrer', code: 'res = df[masque]',
      vars: [{ name: 'df', ref: 'df' }, { name: 'masque', ref: 'masque' }, { name: 'res', ref: 'res' }],
      heap: [frameObj('df', df, { selected: rowSel.length ? rowSel : ['-1:*'] }), seriesObj('masque', maskS), frameObj('res', res, { badges: ['nouvel objet'] })],
      note: '`res` est un **nouveau DataFrame** qui ne contient que les lignes où le masque vaut True. `df` est inchangé.',
    }],
    output: fmtFrame(res),
    alerts,
    verdict: '`df[df["colonne"] == valeur]` → **uniquement les lignes** qui vérifient la condition.',
  };
}

// ------------------------------------------------------------------ simulateur 2 : statistiques d'une Series
type Stat = { result: HeapObj; output: string[]; alert?: SimAlert; verdict: string };
const STATS: Record<string, Record<string, Stat>> = {
  ventes: {
    describe: {
      result: seriesObj('res', { name: 'ventes', index: ['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'], values: [4, 111.25, 30.652624, 80, 91.25, 107.5, 127.5, 150], dtype: 'float64' }),
      output: ['count      4.000000', 'mean     111.250000', 'std       30.652624', 'min       80.000000', '25%       91.250000', '50%      107.500000', '75%      127.500000', 'max      150.000000', 'Name: ventes, dtype: float64'],
      verdict: '`describe()` sur une colonne numérique : count, mean, std, min, quartiles, max — en une ligne. Note `count = 4` : le NaN n’est **pas compté**.',
    },
    max: { result: { id: 'res', pyType: 'float', kind: 'scalar', value: 150.0, note: 'numpy.float64' }, output: ['150.0'], verdict: '`max()` ignore les NaN par défaut.' },
    mean: { result: { id: 'res', pyType: 'float', kind: 'scalar', value: 111.25, note: 'numpy.float64' }, output: ['111.25'], verdict: 'La moyenne est calculée sur les **4 valeurs présentes** : (120 + 80 + 150 + 95) / 4 = 111.25.' },
    vc: {
      result: seriesObj('res', { name: 'count', index: ['120.0', '80.0', '150.0', '95.0'], values: [1, 1, 1, 1], dtype: 'int64', indexName: 'ventes' }),
      output: ['ventes', '120.0    1', '80.0     1', '150.0    1', '95.0     1', 'Name: count, dtype: int64'],
      verdict: '`value_counts()` : une Series dont l’**index = les valeurs**, et les valeurs = leur nombre d’occurrences. Les NaN sont exclus.',
    },
    chain: {
      result: { id: 'res', pyType: 'int', kind: 'scalar', value: 1, note: 'numpy.int64' }, output: ['1'],
      verdict: 'Enchaînement de méthodes : `value_counts()` produit une Series, `.loc[80.0]` y lit une étiquette.',
    },
  },
  pays: {
    describe: {
      result: seriesObj('res', { name: 'pays', index: ['count', 'unique', 'top', 'freq'], values: [5, 3, 'France', 2], dtype: 'object' }),
      output: ['count          5', 'unique         3', 'top       France', 'freq           2', 'Name: pays, dtype: object'],
      verdict: 'Sur du **texte**, `describe()` renvoie d’autres statistiques : count, unique, top (valeur la plus fréquente), freq.',
    },
    max: { result: { id: 'res', pyType: 'str', kind: 'scalar', value: 'France' }, output: ['France'], verdict: 'Sur du texte, `max()` renvoie la dernière valeur dans l’ordre **alphabétique**.' },
    mean: {
      result: { id: 'res', pyType: 'TypeError', kind: 'scalar', value: null, ghost: true, note: 'exception — rien n’est créé' },
      output: ['Traceback (most recent call last):', '  ...', "TypeError: Cannot perform reduction 'mean' with string dtype"],
      alert: { level: 'error', atStep: 1, title: 'TypeError', message: 'Impossible de calculer la moyenne d’une colonne de texte. (pandas 2.x : `Could not convert string ... to numeric`.)' },
      verdict: 'Les statistiques numériques n’ont de sens que sur des colonnes numériques.',
    },
    vc: {
      result: seriesObj('res', { name: 'count', index: ['France', 'Allemagne', 'Espagne'], values: [2, 2, 1], dtype: 'int64', indexName: 'pays' }),
      output: ['pays', 'France       2', 'Allemagne    2', 'Espagne      1', 'Name: count, dtype: int64'],
      verdict: '`value_counts()` trie par fréquence décroissante.',
    },
    chain: {
      result: { id: 'res', pyType: 'int', kind: 'scalar', value: 2, note: 'numpy.int64' }, output: ['2'],
      verdict: 'Enchaînement de méthodes, comme `f500["country"].value_counts().loc["China"]` : compter une valeur précise.',
    },
  },
};
const STAT_CODE: Record<string, (c: string) => string> = {
  describe: () => '.describe()', max: () => '.max()', mean: () => '.mean()', vc: () => '.value_counts()',
  chain: (c) => (c === 'ventes' ? '.value_counts().loc[80.0]' : '.value_counts().loc["France"]'),
};

function simStats(colName: string, method: string): SimResult {
  const st = STATS[colName]?.[method] ?? STATS.ventes.describe;
  const j = VENTES.columns.indexOf(colName);
  const line = `res = df["${colName}"]${STAT_CODE[method]?.(colName) ?? '.describe()'}`;
  const df = copyFrame(VENTES);
  const failed = st.result.pyType === 'TypeError';
  return {
    code: `${VENTES_CODE}\n\n${line}\nprint(res)`,
    steps: [
      { label: 'Créer df', code: 'df = pd.DataFrame({...})', vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', df)] },
      {
        label: 'Calculer', code: line,
        vars: failed ? [{ name: 'df', ref: 'df' }] : [{ name: 'df', ref: 'df' }, { name: 'res', ref: 'res' }],
        heap: [frameObj('df', df, { selected: [`*:${j}`] }), st.result],
      },
    ],
    output: st.output,
    alerts: st.alert ? [st.alert] : [],
    verdict: st.verdict,
  };
}

export default defineFiche({
  id: 'pandas-statistiques-filtrage',
  title: 'Statistiques et filtrage (indexation booléenne)',
  theme: 'pandas',
  tags: ['selection', 'agregation', 'manquantes', 'distributions'],
  keywords: ['statistiques', 'filtrage', 'indexation booléenne', 'vectorisation', 'NaN', 'describe', 'max', 'min', 'mean', 'value_counts', 'masque', 'mask', 'df[df["col"] == valeur]', 'method chaining', 'enchaînement', 'np.nan', 'float', 'loc affectation'],
  summary: 'Statistiques descriptives en une ligne, filtrage avec un **masque booléen** et correction ciblée avec `.loc`.',
  concept: `
- **Opérations vectorisées** : pandas hérite de NumPy la possibilité d’appliquer une opération à **tous les éléments** d’une Series en une seule fois, sans boucle \`for\`.
- **\`describe()\`** renvoie en une fois plusieurs statistiques descriptives d’une Series ou d’un DataFrame (count, mean, std, min, quartiles, max).
- **Enchaînement de méthodes** (*method chaining*) : combiner plusieurs méthodes sur une seule ligne, comme \`f500["country"].value_counts().loc["China"]\`.
- **Indexation booléenne** : \`df[df["colonne"] == valeur]\` retourne uniquement les lignes qui vérifient la condition.
- **\`np.nan\`** : pandas convertit automatiquement une colonne entière en **flottant** dès qu’elle contient au moins une valeur NaN.
`,
  useCase: 'Résumer une colonne, isoler les lignes qui répondent à un critère, ou corriger des valeurs aberrantes uniquement sur ces lignes.',
  syntax: `serie.describe()                          # statistiques descriptives
serie.max(), serie.min()                  # minimum et maximum
serie.value_counts().loc[valeur]          # compter une valeur précise
df.loc[etiquette_ligne, etiquette_col] = valeur   # affecter une valeur
df[df["colonne"] == valeur]               # indexation booléenne
df["nouvelle_colonne"] = ...              # créer une colonne`,
  simulator: {
    title: 'Simulateur — indexation booléenne',
    params: [
      { id: 'cond', label: 'Condition', type: 'choice', default: 'pays', options: [
        { value: 'pays', label: '`df["pays"] == "France"`' },
        { value: 'ventes', label: '`df["ventes"] > 100`' },
        { value: 'employes', label: '`df["employes"] >= 8`' },
      ] },
      { id: 'action', label: 'Utilisation du masque', type: 'choice', default: 'filtrer', options: [
        { value: 'filtrer', label: '`df[masque]`', help: 'filtrer les lignes' },
        { value: 'affecter', label: '`df.loc[masque, "ventes"] = 0`', help: 'corriger les lignes ciblées' },
        { value: 'compter', label: '`masque.sum()`', help: 'compter les lignes' },
      ] },
    ],
    simulate: (p) => simFiltre(String(p.cond), String(p.action)),
  },
  simulators: [{
    title: 'Simulateur — statistiques d’une Series',
    params: [
      { id: 'col', label: 'Colonne', type: 'choice', default: 'ventes', options: [
        { value: 'ventes', label: '`df["ventes"]` (float, avec NaN)' },
        { value: 'pays', label: '`df["pays"]` (texte)' },
      ] },
      { id: 'method', label: 'Méthode', type: 'choice', default: 'describe', options: [
        { value: 'describe', label: '`.describe()`' },
        { value: 'max', label: '`.max()`' },
        { value: 'mean', label: '`.mean()`' },
        { value: 'vc', label: '`.value_counts()`' },
        { value: 'chain', label: '`.value_counts().loc[…]`' },
      ] },
    ],
    simulate: (p) => simStats(String(p.col), String(p.method)),
  }],
  pitfalls: [
    'Une colonne d’entiers qui reçoit un seul `NaN` devient **float64** (12 → 12.0).',
    '`NaN == NaN` et `NaN > 100` valent False : les lignes manquantes disparaissent silencieusement d’un filtre.',
    '`df[masque]` renvoie un **nouvel objet** : pour modifier `df`, utiliser `df.loc[masque, "col"] = valeur`.',
    '`describe()` n’affiche pas les mêmes statistiques sur du texte (count, unique, top, freq).',
  ],
  takeaways: [
    'Pas de boucle : les opérations pandas sont **vectorisées**.',
    'Filtrer : `df[condition]` ; corriger : `df.loc[condition, "col"] = valeur`.',
    '`masque.sum()` = nombre de lignes qui vérifient la condition.',
  ],
  related: ['pandas-introduction', 'pandas-selection-avancee'],
  source: 'DataXp — Introduction à NumPy et Pandas, chapitre 4 (sources/pandas/dataxp-statistiques-filtrage-pandas.pdf)',
});
