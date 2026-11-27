import { defineFiche, type HeapObj, type SimAlert, type SimResult, type SimStep } from '../../engine/types';
import { r, v } from '../../engine/sim-helpers';
import { VENTES, VENTES_CODE, copyFrame, fmtFrame, fmtSeries, frameObj, selectRows, seriesObj, type Frame, type Series } from '../_lib/pandas-sim';

const GROUPS = [
  { key: 'Allemagne', rows: [2, 3], color: 1 },
  { key: 'Espagne', rows: [4], color: 2 },
  { key: 'France', rows: [0, 1], color: 0 },
]; // groupby trie les clés par ordre alphabétique
const ROW_COLORS = [0, 0, 1, 1, 2];
const KEYS = GROUPS.map((g) => g.key);

type Agg = { code: string; result: HeapObj; output: string[]; alerts?: SimAlert[]; verdict: string };

function aggCase(agg: string, version: string): Agg {
  const s = (name: string | null, values: (number | null)[], dtype: 'float64' | 'int64'): Series => ({ name, index: KEYS, values, dtype, indexName: 'pays' });
  const f = (columns: string[], rows: (number | null)[][], dtypes: ('float64' | 'int64')[]): Frame => ({ columns, index: KEYS, rows, dtypes, indexName: 'pays' });
  const colorRes = { rowColors: GROUPS.map((g) => g.color) };
  switch (agg) {
    case 'sum': {
      const x = s('ventes', [150, 95, 200], 'float64');
      return { code: 'res = g["ventes"].sum()', result: seriesObj('res', x, colorRes), output: fmtSeries(x), verdict: 'Une valeur **par groupe** : la somme des ventes de chaque pays (le NaN de Berlin est ignoré).' };
    }
    case 'count': {
      const x = s('ventes', [1, 1, 2], 'int64');
      return {
        code: 'res = g["ventes"].count()', result: seriesObj('res', x, colorRes), output: fmtSeries(x),
        alerts: [{ level: 'info', atStep: 3, title: 'count() ignore les NaN', message: 'L’Allemagne a 2 lignes mais **1 seule valeur** de ventes non manquante. Pour le nombre de lignes, utilise `g.size()`.' }],
        verdict: '`count()` compte les valeurs **non manquantes** de chaque groupe.',
      };
    }
    case 'meanall': {
      const x = f(['ventes', 'employes'], [[150, 10], [95, 7], [100, 8]], ['float64', 'float64']);
      return {
        code: 'res = g.mean(numeric_only=True)', result: frameObj('res', x, colorRes), output: fmtFrame(x),
        alerts: [{ level: 'info', atStep: 3, title: 'numeric_only=True', message: 'Seules les colonnes **numériques** sont moyennées : `ville` (texte) est ignorée au lieu de provoquer une `TypeError`.' }],
        verdict: 'Sur tout le GroupBy → un **DataFrame** : une ligne par groupe, une colonne par variable numérique.',
      };
    }
    case 'agg':
    case 'aggnp': {
      const x = f(['mean', 'max'], [[150, 150], [95, 95], [100, 120]], ['float64', 'float64']);
      const np = agg === 'aggnp';
      const alerts: SimAlert[] = np && version === 'p2'
        ? [{ level: 'warning', atStep: 3, title: 'FutureWarning', message: 'pandas 2.x : *The provided callable <function mean> is currently using SeriesGroupBy.mean. In a future version of pandas, the provided callable will be used directly. To keep current behavior pass the string "mean" instead.* → écris plutôt `agg(["mean", "max"])`.' }]
        : np ? [{ level: 'info', atStep: 3, title: 'pandas ≥ 3.0', message: 'Plus d’avertissement ici, mais les **chaînes** `"mean"`, `"max"` restent l’écriture recommandée (plus rapide et sans ambiguïté).' }] : [];
      return {
        code: np ? 'res = g["ventes"].agg([np.mean, np.max])' : 'res = g["ventes"].agg(["mean", "max"])',
        result: frameObj('res', x, colorRes), output: fmtFrame(x), alerts,
        verdict: '`agg()` applique **plusieurs** fonctions à la fois : une colonne de résultat par fonction.',
      };
    }
    case 'get': {
      const x = selectRows(copyFrame(VENTES), [0, 1]);
      return {
        code: 'res = g.get_group("France")', result: frameObj('res', x, { rowColors: [0, 0] }), output: fmtFrame(x),
        verdict: '`get_group()` renvoie les **lignes d’origine** d’un seul groupe, sans calcul.',
      };
    }
    default: {
      const x = s('ventes', [150, 95, 100], 'float64');
      return { code: 'res = g["ventes"].mean()', result: seriesObj('res', x, colorRes), output: fmtSeries(x), verdict: 'Une moyenne **par groupe**. France : (120 + 80) / 2 = 100 ; Allemagne : 150 (le NaN est ignoré).' };
    }
  }
}

function simGroupby(agg: string, version: string): SimResult {
  const df = copyFrame(VENTES);
  const c = aggCase(agg, version);
  const gBox: HeapObj = {
    id: 'g', pyType: 'DataFrameGroupBy', kind: 'box',
    fields: GROUPS.map((g) => ({ label: g.key, slot: v(g.rows.length), hint: `lignes ${g.rows.map((i) => df.index[i]).join(', ')}` })),
    note: 'Aucun calcul n’a encore eu lieu : l’objet mémorise seulement quelles lignes vont dans quel groupe.',
  };
  const gSplit: HeapObj = { ...gBox, fields: GROUPS.map((g) => ({ label: g.key, slot: r(`grp-${g.key}`) })), note: undefined };
  const parts = GROUPS.map((g) => frameObj(`grp-${g.key}`, selectRows(df, g.rows), { rowColors: g.rows.map(() => g.color), badges: ['groupe'] }));
  const steps: SimStep[] = [
    { label: 'df', code: 'df = pd.DataFrame({...})', vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', df, { rowColors: ROW_COLORS })],
      note: 'Les couleurs indiquent le pays de chaque ligne.' },
    { label: 'groupby', code: 'g = df.groupby("pays")', vars: [{ name: 'df', ref: 'df' }, { name: 'g', ref: 'g' }], heap: [frameObj('df', df, { rowColors: ROW_COLORS }), gBox] },
    { label: 'Diviser', code: '# split : un sous-tableau par valeur de "pays"', vars: [{ name: 'g', ref: 'g' }], heap: [gSplit, ...parts],
      note: '**Diviser** (split) : pandas répartit les lignes par pays. Les clés sont **triées** (Allemagne, Espagne, France).' },
    { label: 'Appliquer + combiner', code: c.code, vars: [{ name: 'g', ref: 'g' }, { name: 'res', ref: 'res' }], heap: [gBox, c.result],
      note: agg === 'get' ? undefined : '**Appliquer** la fonction à chaque groupe, puis **combiner** les résultats : l’index du résultat = les clés de groupe.' },
  ];
  return {
    code: `${agg === 'aggnp' ? 'import numpy as np\n' : ''}${VENTES_CODE}\n\ng = df.groupby("pays")\n${c.code}\nprint(res)`,
    steps, output: c.output, alerts: c.alerts, verdict: c.verdict,
  };
}

const PIVOT: Record<string, { values: number[]; all: number; dtype: 'float64' | 'int64' }> = {
  mean: { values: [150, 95, 100], all: 111.25, dtype: 'float64' },
  sum: { values: [150, 95, 200], all: 445, dtype: 'float64' },
  count: { values: [1, 1, 2], all: 4, dtype: 'int64' },
};

function simPivot(aggfunc: string, margins: boolean): SimResult {
  const df = copyFrame(VENTES);
  const pv = PIVOT[aggfunc] ?? PIVOT.mean;
  const res: Frame = {
    columns: ['ventes'], index: margins ? [...KEYS, 'All'] : KEYS, indexName: 'pays', dtypes: [pv.dtype],
    rows: (margins ? [...pv.values, pv.all] : pv.values).map((x) => [x]),
  };
  const line = `res = df.pivot_table(values="ventes", index="pays", aggfunc="${aggfunc}"${margins ? ', margins=True' : ''})`;
  return {
    code: `${VENTES_CODE}\n\n${line}\nprint(res)`,
    steps: [
      { label: 'df', code: 'df = pd.DataFrame({...})', vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', df, { rowColors: ROW_COLORS, selected: ['*:1', '*:2'] })],
        note: '`index="pays"` → une ligne par pays ; `values="ventes"` → la colonne agrégée.' },
      { label: 'pivot_table', code: line, vars: [{ name: 'df', ref: 'df' }, { name: 'res', ref: 'res' }],
        heap: [frameObj('df', df, { rowColors: ROW_COLORS }), frameObj('res', res, { rowColors: [1, 2, 0, ...(margins ? [null] : [])], changed: margins ? ['3:0'] : [] })] },
    ],
    output: fmtFrame(res),
    alerts: margins ? [{ level: 'info', atStep: 1, title: 'margins=True → ligne All', message: aggfunc === 'mean'
      ? 'La ligne **All** est la moyenne sur **toutes les lignes** (111.25), *pas* la moyenne des 3 moyennes (115.0).'
      : `La ligne **All** applique \`${aggfunc}\` à l’ensemble des données.` }] : [],
    verdict: '`pivot_table()` = un groupby présenté sous forme de **tableau croisé**.',
  };
}

export default defineFiche({
  id: 'pandas-agregation',
  title: 'Agrégation : groupby et pivot_table',
  theme: 'pandas',
  tags: ['agregation', 'restructurer', 'versions'],
  keywords: ['groupby', 'agrégation', 'pivot_table', 'split-apply-combine', 'groupby', 'GroupBy', 'get_group', 'mean', 'numeric_only', 'agg', 'aggfunc', 'np.mean', 'pivot_table', 'margins', 'All', 'tableau croisé', 'FutureWarning', 'count', 'size'],
  summary: 'Diviser un DataFrame en **groupes**, appliquer une fonction à chacun et combiner les résultats.',
  concept: `
- **Le groupby** : diviser un DataFrame en groupes selon les valeurs d’une colonne, pour ensuite appliquer une fonction à chaque groupe (*split → apply → combine*).
- Un objet **GroupBy ne déclenche aucun calcul** tant qu’aucune fonction, comme \`mean()\` ou \`get_group()\`, n’est appelée dessus.
- La méthode **\`agg()\`** permet d’appliquer plusieurs fonctions d’agrégation à la fois, ou une fonction personnalisée.
- Le paramètre **\`margins=True\`** de \`pivot_table()\` ajoute une ligne **All** contenant le résultat de l’agrégation sur l’ensemble des données.
`,
  useCase: 'Ventes moyennes par pays, nombre de clients par segment, tableau croisé avec total général.',
  syntax: `df.groupby("col")                          # créer un objet GroupBy
GroupBy.get_group("valeur")                # sélectionner un groupe précis
GroupBy.mean(numeric_only=True)            # moyenne par groupe
GroupBy.agg([np.mean, np.max])             # plusieurs agrégations
                                           # (recommandé : agg(["mean", "max"]))
df.pivot_table(values, index, aggfunc)     # tableau croisé
pivot_table(..., margins=True)             # + ligne de total "All"`,
  simulator: {
    title: 'Simulateur — groupby pas à pas',
    params: [
      { id: 'agg', label: 'Fonction appliquée', type: 'choice', default: 'mean', options: [
        { value: 'mean', label: '`g["ventes"].mean()`' },
        { value: 'sum', label: '`g["ventes"].sum()`' },
        { value: 'count', label: '`g["ventes"].count()`' },
        { value: 'meanall', label: '`g.mean(numeric_only=True)`' },
        { value: 'agg', label: '`g["ventes"].agg(["mean", "max"])`' },
        { value: 'aggnp', label: '`g["ventes"].agg([np.mean, np.max])`' },
        { value: 'get', label: '`g.get_group("France")`' },
      ] },
      { id: 'version', label: 'Version de pandas', type: 'choice', default: 'p3', showIf: { agg: 'aggnp' }, options: [
        { value: 'p2', label: 'pandas 2.x' }, { value: 'p3', label: 'pandas ≥ 3.0' },
      ] },
    ],
    simulate: (p) => simGroupby(String(p.agg), String(p.version)),
  },
  simulators: [{
    title: 'Simulateur — pivot_table',
    params: [
      { id: 'aggfunc', label: 'aggfunc', type: 'choice', default: 'mean', options: [
        { value: 'mean', label: '`"mean"`' }, { value: 'sum', label: '`"sum"`' }, { value: 'count', label: '`"count"`' },
      ] },
      { id: 'margins', label: 'margins', type: 'toggle', default: true, onLabel: '`margins=True`', offLabel: '`margins=False`' },
    ],
    simulate: (p) => simPivot(String(p.aggfunc), !!p.margins),
  }],
  pitfalls: [
    '`print(df.groupby("pays"))` n’affiche **aucun résultat** : il faut appeler une fonction d’agrégation.',
    '`count()` ignore les NaN ; `size()` compte toutes les lignes.',
    'La ligne `All` de `margins=True` agrège **toutes les lignes**, ce n’est pas la moyenne des moyennes.',
    '`agg([np.mean])` → `FutureWarning` en pandas 2.x : préférer `agg(["mean"])`.',
  ],
  takeaways: [
    'split → apply → combine.',
    'GroupBy = paresseux, rien n’est calculé avant l’appel d’une fonction.',
    'Résultat indexé par les **clés de groupe**, triées.',
  ],
  mentalModel: {
    title: 'La règle',
    code: `df.groupby("ville")["age"].mean()     # Series    index = ville, .name = 'age'
df.groupby("ville")[["age"]].mean()   # DataFrame index = ville
df.groupby("ville", as_index=False)["age"].mean()   # ville reste une COLONNE
df.groupby("ville").agg(moy=("age", "mean"), n=("age", "size"))   # colonnes nommées
df.groupby("ville")["age"].transform("mean")   # même longueur que df`,
    note: 'La clé du `groupby` **devient l’index** du résultat ; `as_index=False` ou `.reset_index()` la remet en colonne.',
  },
  comparisons: [{
    title: 'Compter : value_counts, size, count, nunique',
    headers: ['Expression', 'Renvoie', 'Compte les NaN ?', '`.name` / index'],
    rows: [
      ['`df["ville"].value_counts()`', 'Series **triée** par fréquence', 'non (`dropna=False` pour les voir)', '`.name = "count"`, index nommé `ville`'],
      ['`df.groupby("ville").size()`', 'Series triée par **clé**', 'les lignes oui, la clé NaN non (`dropna=False`)', '`.name = None`, index nommé `ville`'],
      ['`df.groupby("ville").count()`', '**DataFrame** : une colonne par colonne', 'non : valeurs **non manquantes** par colonne', 'colonnes = les autres colonnes'],
      ['`df["ville"].count()`', 'un entier', 'non', '—'],
      ['`len(df)` / `df["ville"].size`', 'un entier', 'oui', '—'],
      ['`df["ville"].nunique()`', 'un entier : nombre de valeurs **distinctes**', 'non', '—'],
      ['`value_counts(normalize=True)`', 'Series de proportions', 'non', '`.name = "proportion"`'],
    ],
    conclusion: '`size` compte les **lignes**, `count` compte les **valeurs présentes**. Leur écart = le nombre de NaN.',
  }, {
    title: 'groupby, pivot_table ou transform ?',
    headers: ['', '`groupby(...).agg`', '`pivot_table`', '`groupby(...).transform`'],
    rows: [
      ['Forme du résultat', 'une ligne par groupe', 'un tableau croisé : groupes en lignes **et** en colonnes', '**même nombre de lignes** que `df`'],
      ['Usage typique', 'moyenne par ville', 'ventes par ville × mois', 'ajouter « moyenne de sa ville » à chaque ligne'],
      ['Case sans données', '—', 'NaN (`fill_value=0`)', '—'],
      ['Total général', '—', '`margins=True` → ligne et colonne `All`', '—'],
    ],
    conclusion: 'Résumer → `agg`. Croiser deux variables → `pivot_table`. Comparer chaque ligne à son groupe → `transform`.',
  }],
  deepDives: [{
    title: 'Split – apply – combine',
    body: `\`groupby\` ne calcule rien tout seul : il renvoie un objet **GroupBy**, une promesse de découpage. Le calcul a lieu au moment où l’on appelle \`mean()\`, \`agg()\`…

1. **split** : les lignes sont réparties selon les valeurs de la clé (les clés NaN sont écartées par défaut) ;
2. **apply** : la fonction est appliquée à chaque morceau ;
3. **combine** : les résultats sont recollés, et **les clés deviennent l’index**.

Avec \`transform\`, l’étape combine renvoie chaque résultat **à la place des lignes d’origine** : on retrouve l’index de \`df\`, ce qui permet de l’affecter directement à une nouvelle colonne.`,
    code: `df["moy_ville"] = df.groupby("ville")["age"].transform("mean")
df["ecart"] = df["age"] - df["moy_ville"]     # chaque personne comparée à sa ville`,
  }],
  related: ['pandas-combiner', 'pandas-statistiques-filtrage'],
  source: 'DataXp — Nettoyage et Analyse de Données avec Python, chapitre 1 (sources/pandas/dataxp-agregation-donnees.pdf)',
});
