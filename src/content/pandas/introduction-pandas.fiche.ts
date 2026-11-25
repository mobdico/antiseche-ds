import { defineFiche, type SimAlert } from '../../engine/types';
import { VENTES, VENTES_CODE, copyFrame, fmtFrame, fmtSeries, frameObj, selectRows, seriesObj, toSeries, type Frame } from '../_lib/pandas-sim';
import type { HeapObj } from '../../engine/types';

type Case = {
  code: string;
  selected: string[];
  result?: HeapObj;
  output: string[];
  alerts?: SimAlert[];
  verdict: string;
};

function cases(df: Frame): Record<string, Case> {
  const slice = selectRows(df, [1, 2, 3]);
  const twoCols: Frame = { columns: ['ville', 'ventes'], index: [...df.index], rows: df.rows.map((r) => [r[0], r[2]]), dtypes: ['object', 'float64'] };
  return {
    col: {
      code: 'res = df["ventes"]',
      selected: ['*:2'],
      result: seriesObj('res', toSeries(df, 'ventes')),
      output: ["<class 'pandas.Series'>", '(5,)', ...fmtSeries(toSeries(df, 'ventes'))],
      verdict: 'Une seule colonne entre crochets → une **Series** (1 dimension). Chaque colonne d’un DataFrame *est* une Series.',
    },
    cols: {
      code: 'res = df[["ville", "ventes"]]',
      selected: ['*:0', '*:2'],
      result: frameObj('res', twoCols),
      output: ["<class 'pandas.DataFrame'>", '(5, 2)', ...fmtFrame(twoCols)],
      verdict: 'Une **liste** de colonnes (doubles crochets) → un **DataFrame**, même avec une seule colonne dans la liste.',
    },
    row: {
      code: 'res = df.loc["b"]',
      selected: ['1:*'],
      result: seriesObj('res', { name: 'b', index: [...df.columns], values: [...df.rows[1]], dtype: 'object' }),
      output: ["<class 'pandas.Series'>", '(4,)', 'ville         Lyon', 'pays        France', 'ventes        80.0', 'employes         6', 'Name: b, dtype: object'],
      verdict: 'Une ligne seule → une **Series** dont l’index est formé des **noms de colonnes**. Ses types étant mélangés, son dtype devient `object`.',
    },
    rowslice: {
      code: 'res = df.loc["b":"d"]',
      selected: ['1:*', '2:*', '3:*'],
      result: frameObj('res', slice),
      output: ["<class 'pandas.DataFrame'>", '(3, 4)', ...fmtFrame(slice)],
      alerts: [{ level: 'info', atStep: 1, title: 'Borne de fin INCLUSE', message: 'Avec des **étiquettes**, `"b":"d"` renvoie b, c **et d** — contrairement au slicing Python classique où la fin est exclue.' }],
      verdict: 'Tranche par étiquette avec `.loc` → **la dernière étiquette est incluse** (3 lignes : b, c, d).',
    },
    getslice: {
      code: 'res = df["b":"d"]',
      selected: ['1:*', '2:*', '3:*'],
      result: frameObj('res', slice),
      output: ["<class 'pandas.DataFrame'>", '(3, 4)', ...fmtFrame(slice)],
      alerts: [{ level: 'info', atStep: 1, title: 'Tranche de lignes sans .loc', message: '`df["b":"d"]` (avec `:`) découpe les **lignes**, borne incluse. Mais sans `:`, `df["b"]` cherche une **colonne** « b »…' }],
      verdict: 'Raccourci accepté pour une **tranche** de lignes — mais préfère `.loc["b":"d"]`, plus explicite.',
    },
    cell: {
      code: 'res = df.loc["b", "ventes"]',
      selected: ['1:2'],
      result: { id: 'res', pyType: 'float', kind: 'scalar', value: 80.0, note: 'numpy.float64' },
      output: ["<class 'numpy.float64'>", '()', '80.0'],
      verdict: '`df.loc[ligne, colonne]` avec deux étiquettes → une **valeur unique** (un scalaire), plus un tableau.',
    },
    keyerror: {
      code: 'res = df["b"]',
      selected: [],
      output: ['Traceback (most recent call last):', '  ...', "KeyError: 'b'"],
      alerts: [{ level: 'error', atStep: 1, title: "KeyError: 'b'", message: '`df[...]` avec une seule étiquette cherche une **colonne**. Il n’existe pas de colonne « b » → erreur. Pour une ligne, il faut **toujours** `.loc["b"]`.' }],
      verdict: 'Pour sélectionner **une seule ligne**, `.loc[]` est obligatoire.',
    },
  };
}

export default defineFiche({
  id: 'pandas-introduction',
  title: 'Introduction à pandas : DataFrame, Series et .loc',
  theme: 'pandas',
  tags: ['dataframe', 'series', 'loc', 'sélection', 'bases'],
  keywords: ['read_csv', 'shape', 'head', 'tail', 'dtypes', 'info', 'value_counts', 'KeyError', 'object', 'étiquette', 'label', 'tranche', 'slice'],
  summary: 'Charger, inspecter un DataFrame et sélectionner par **étiquette** avec `df["col"]` et `.loc[]`.',
  concept: `
Un **DataFrame** est une structure à **deux dimensions**, comparable à une feuille de calcul. Une **Series** n’a qu’**une dimension** : chaque colonne d’un DataFrame est en réalité une Series.

- \`df.shape\` renvoie un tuple \`(nombre_de_lignes, nombre_de_colonnes)\`, exactement comme pour un ndarray NumPy.
- Le dtype \`object\` regroupe les colonnes qui contiennent du **texte** : aucun dtype numérique ne peut les représenter. ⚠️ *Mise à jour pandas ≥ 3.0 :* le texte a désormais par défaut son propre dtype \`str\` (\`object\` reste utilisé pour les colonnes aux types mélangés).
- Une sélection par étiquette avec \`.loc[]\` ou par tranche (\`df["a":"b"]\`) **inclut la dernière valeur** de la tranche.
- \`df["colonne"]\` sélectionne une colonne sans passer par \`.loc[]\`, alors qu’une **ligne seule** exige toujours \`.loc[]\`.
`,
  useCase: 'Premier contact avec un jeu de données : le charger, vérifier ses dimensions et ses types, puis en extraire des lignes ou des colonnes.',
  syntax: `pd.read_csv("fichier.csv")      # charger un CSV
df.shape                         # (lignes, colonnes)
df.head(), df.tail()             # aperçu du début / de la fin
df.dtypes, df.info()             # types des colonnes
df.loc[ligne, colonne]           # sélection par étiquette
serie.value_counts()             # compter les valeurs uniques`,
  simulator: {
    title: 'Simulateur — sélectionner dans un DataFrame',
    params: [
      {
        id: 'sel', label: 'Sélection', type: 'choice', default: 'col',
        options: [
          { value: 'col', label: '`df["ventes"]`' },
          { value: 'cols', label: '`df[["ville", "ventes"]]`' },
          { value: 'row', label: '`df.loc["b"]`' },
          { value: 'rowslice', label: '`df.loc["b":"d"]`' },
          { value: 'getslice', label: '`df["b":"d"]`' },
          { value: 'cell', label: '`df.loc["b", "ventes"]`' },
          { value: 'keyerror', label: '`df["b"]`' },
        ],
      },
    ],
    simulate: (p) => {
      const df = copyFrame(VENTES);
      const c = cases(df)[String(p.sel)] ?? cases(df).col;
      const dfObj = (extra: Partial<HeapObj> = {}) => frameObj('df', df, extra);
      return {
        code: `import numpy as np\nimport pandas as pd\n\n${VENTES_CODE}\n\n${c.code}\nprint(type(res))\nprint(res.shape)\nprint(res)`,
        steps: [
          { label: 'Créer df', code: 'df = pd.DataFrame({...}, index=["a", "b", "c", "d", "e"])', vars: [{ name: 'df', ref: 'df' }], heap: [dfObj()],
            note: 'Les étiquettes d’index sont **a…e** (et non 0…4) pour bien distinguer étiquette et position.' },
          {
            label: 'Sélection', code: c.code,
            vars: c.result ? [{ name: 'df', ref: 'df' }, { name: 'res', ref: 'res' }] : [{ name: 'df', ref: 'df' }],
            heap: c.result ? [dfObj({ selected: c.selected }), c.result] : [dfObj()],
            note: c.result ? 'En surbrillance : les cellules de `df` récupérées dans `res`.' : 'L’instruction lève une exception : `res` n’est jamais créé.',
          },
        ],
        output: c.output,
        alerts: c.alerts,
        verdict: c.verdict,
      };
    },
  },
  pitfalls: [
    '`df["b"]` cherche une **colonne** « b » → `KeyError`. Pour une ligne : `df.loc["b"]`.',
    '`df.loc["b":"d"]` **inclut** « d », alors que `liste[1:3]` exclut l’indice 3.',
    '`df["ventes"]` (Series) ≠ `df[["ventes"]]` (DataFrame à une colonne).',
    'Le dtype d’une colonne de texte dépend de la version : `object` en pandas 1.x/2.x, `str` en pandas ≥ 3.0.',
  ],
  takeaways: [
    'DataFrame = 2D, Series = 1D ; une colonne est une Series.',
    '`.loc[]` = par **étiquette**, borne de fin **incluse**.',
    '`df.shape` → `(lignes, colonnes)`.',
  ],
  related: ['pandas-statistiques-filtrage', 'pandas-selection-avancee'],
  source: 'DataXp — Introduction à NumPy et Pandas, chapitre 3 (sources/pandas/dataxp-introduction-pandas.pdf)',
});
