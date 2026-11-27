import { defineFiche, type SimAlert, type SimResult, type SimStep } from '../../engine/types';
import { fmtFrame, fmtSeries, frameObj, seriesObj, type Frame, type Series } from '../_lib/pandas-sim';

// ------------------------------------------------------------------ 1. dropna : axis et thresh
const DF: Frame = {
  columns: ['nom', 'age', 'ville', 'note'], index: [0, 1, 2, 3],
  rows: [['Ana', 25, 'Paris', null], ['Bob', null, null, null], ['Chloé', 41, 'Lyon', 14], ['Dan', null, 'Nice', null]],
  dtypes: ['object', 'float64', 'object', 'float64'],
};
const DF_CODE = `df = pd.DataFrame({
    "nom":   ["Ana", "Bob", "Chloé", "Dan"],
    "age":   [25, np.nan, 41, np.nan],
    "ville": ["Paris", None, "Lyon", "Nice"],
    "note":  [np.nan, np.nan, 14.0, np.nan],
})`;
const missingCells = (f: Frame) => f.rows.flatMap((r, i) => r.flatMap((x, j) => (x === null ? [`${i}:${j}`] : [])));

function simDropna(axis: string, thresh: string): SimResult {
  const nCols = DF.columns.length, nRows = DF.rows.length;
  const rowCount = DF.rows.map((r) => r.filter((x) => x !== null).length);
  const colCount = DF.columns.map((_, j) => DF.rows.filter((r) => r[j] !== null).length);
  const need = thresh === 'none' ? (axis === '0' ? nCols : nRows) : Number(thresh);
  const nulls: Series = { name: null, index: [...DF.columns], values: colCount.map((c) => nRows - c), dtype: 'int64' };
  let res: Frame, keptSel: string[], explain: string;
  if (axis === '0') {
    const keep = rowCount.flatMap((c, i) => (c >= need ? [i] : []));
    res = { ...DF, index: keep.map((i) => DF.index[i]), rows: keep.map((i) => [...DF.rows[i]]) };
    keptSel = keep.map((i) => `${i}:*`);
    explain = `Valeurs non manquantes par **ligne** : ${rowCount.map((c, i) => `${DF.index[i]} → ${c}`).join(', ')}. Conservées : celles qui en ont **au moins ${need}**.`;
  } else {
    const keep = colCount.flatMap((c, j) => (c >= need ? [j] : []));
    res = { columns: keep.map((j) => DF.columns[j]), index: [...DF.index], rows: DF.rows.map((r) => keep.map((j) => r[j])), dtypes: keep.map((j) => DF.dtypes![j]) };
    keptSel = keep.map((j) => `*:${j}`);
    explain = `Valeurs non manquantes par **colonne** : ${colCount.map((c, j) => `${DF.columns[j]} → ${c}`).join(', ')}. Conservées : celles qui en ont **au moins ${need}**.`;
  }
  const args = [axis === '1' ? 'axis=1' : '', thresh !== 'none' ? `thresh=${thresh}` : ''].filter(Boolean).join(', ');
  const line = `res = df.dropna(${thresh !== 'none' ? `thresh=${thresh}${axis === '1' ? ', axis=1' : ''}` : args})`;
  const alerts: SimAlert[] = [];
  if (thresh === 'none') alerts.push({ level: 'warning', atStep: 2, title: axis === '0' ? 'Il ne reste qu’une ligne sur 4' : 'Il ne reste qu’une colonne sur 4',
    message: `Sans \`thresh\`, il suffit d’**un seul NaN** pour supprimer ${axis === '0' ? 'la ligne' : 'la colonne'}. Toujours regarder \`df.isnull().sum()\` avant de supprimer.` });
  return {
    code: `${DF_CODE}\n\nprint(df.isnull().sum())\n${line}\nprint(res)`,
    steps: [
      { label: 'df', code: 'df = pd.DataFrame({...})', vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', DF, { changed: missingCells(DF) })], note: 'En jaune : les valeurs manquantes (NaN / None).' },
      { label: 'isnull().sum()', code: 'df.isnull().sum()', vars: [{ name: 'df', ref: 'df' }, { name: 'nb_nan', ref: 'nulls' }], heap: [frameObj('df', DF, { changed: missingCells(DF) }), seriesObj('nulls', nulls)],
        note: '`isnull()` donne un tableau de booléens ; `.sum()` compte les True **par colonne**.' },
      { label: 'dropna', code: line, vars: [{ name: 'df', ref: 'df' }, { name: 'res', ref: 'res' }],
        heap: [frameObj('df', DF, { selected: keptSel.length ? keptSel : ['-1:*'] }), frameObj('res', res, { badges: ['nouvel objet'] })], note: explain },
    ],
    output: [...fmtSeries(nulls), ...fmtFrame(res)],
    alerts,
    verdict: `\`axis=${axis}\` → on supprime des **${axis === '0' ? 'lignes' : 'colonnes'}** ; \`thresh=n\` = nombre **minimum de valeurs présentes** pour être conservé.`,
  };
}

// ------------------------------------------------------------------ 2. imputation
const TEMPS: Series = { name: 'temps', index: [0, 1, 2, 3, 4, 5], values: [10, null, 14, null, 12, 20], dtype: 'float64' };
const FILL: Record<string, { code: string; value: number; mean: string; std: string }> = {
  mean: { code: 'df["temps"].mean()', value: 14, mean: '14.0', std: '3.35' },
  median: { code: 'df["temps"].median()', value: 13, mean: '13.67', std: '3.39' },
  zero: { code: '0', value: 0, mean: '9.33', std: '7.97' },
};

function simFillna(strategy: string): SimResult {
  const f = FILL[strategy] ?? FILL.mean;
  const filled: Series = { ...TEMPS, values: TEMPS.values.map((x) => (x === null ? f.value : x)) };
  const line = `df["temps"] = df["temps"].fillna(${f.code})`;
  return {
    code: `df = pd.DataFrame({"temps": [10, np.nan, 14, np.nan, 12, 20]})\nprint(round(df["temps"].mean(), 2), round(df["temps"].std(), 2))\n${line}\nprint(round(df["temps"].mean(), 2), round(df["temps"].std(), 2))`,
    steps: [
      { label: 'Avant', code: 'df["temps"]', vars: [{ name: 'temps', ref: 's0' }], heap: [seriesObj('s0', TEMPS, { changed: ['1:0', '3:0'] })], note: 'Moyenne 14.0, écart-type 4.32 (calculés sur les 4 valeurs présentes).' },
      { label: 'fillna', code: line, vars: [{ name: 'temps', ref: 's1' }], heap: [seriesObj('s1', filled, { changed: ['1:0', '3:0'], badges: ['nouvel objet'] })],
        note: strategy === 'zero' ? 'Remplacer par 0 invente des mesures très basses : la moyenne chute.' : `Les 2 NaN reçoivent ${f.value} : des valeurs **au centre** de la distribution.` },
    ],
    output: ['14.0 4.32', `${f.mean} ${f.std}`],
    alerts: [strategy === 'mean'
      ? { level: 'info', atStep: 1, title: 'Moyenne identique, distribution changée', message: 'La moyenne reste **14.0**, mais l’écart-type passe de 4.32 à **3.35** : ajouter des valeurs égales à la moyenne **resserre** artificiellement la distribution.' }
      : strategy === 'zero'
        ? { level: 'warning', atStep: 1, title: 'Biais introduit', message: 'Moyenne 14.0 → **9.33** et écart-type 4.32 → **7.97** : 0 n’est pas une estimation, c’est une fausse mesure.' }
        : { level: 'info', atStep: 1, title: 'Médiane', message: 'La médiane (13) est moins sensible aux valeurs extrêmes (20). La moyenne bouge légèrement (13.67) et l’écart-type baisse (3.39).' }],
    verdict: 'L’imputation conserve le nombre de lignes, mais **modifie la forme** de la distribution.',
  };
}

// ------------------------------------------------------------------ 3. doublons
const D: Frame = {
  columns: ['nom', 'ville', 'score'], index: [0, 1, 2, 3, 4],
  rows: [['Ana', 'Paris', 12], ['Bob', 'Lyon', 15], ['Ana', 'Paris', 12], ['Ana', 'Nice', 9], ['Bob', 'Lyon', 18]],
  dtypes: ['object', 'object', 'int64'],
};
const SUBSETS: Record<string, { code: string; cols: number[] }> = {
  all: { code: '', cols: [0, 1, 2] },
  nom: { code: '["nom"]', cols: [0] },
  nomville: { code: '["nom", "ville"]', cols: [0, 1] },
};

function simDoublons(subset: string, action: string): SimResult {
  const sub = SUBSETS[subset] ?? SUBSETS.all;
  const seen = new Set<string>();
  const dup = D.rows.map((r) => {
    const key = sub.cols.map((j) => String(r[j])).join('|');
    const d = seen.has(key);
    seen.add(key);
    return d;
  });
  const colSel = sub.cols.map((j) => `*:${j}`);
  const rowColors = dup.map((d) => (d ? 1 : null));
  const step1: SimStep = { label: 'df', code: 'df = pd.DataFrame({...})', vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', D, { selected: colSel })],
    note: subset === 'all' ? 'Comparaison sur **toutes les colonnes**.' : `Comparaison seulement sur ${sub.code} (colonnes en surbrillance).` };
  const n = dup.filter(Boolean).length;
  if (action === 'duplicated') {
    const mask: Series = { name: null, index: [...D.index], values: dup, dtype: 'bool' };
    return {
      code: `res = df.duplicated(${sub.code})\nprint(res)`,
      steps: [step1, { label: 'duplicated', code: `df.duplicated(${sub.code})`, vars: [{ name: 'df', ref: 'df' }, { name: 'res', ref: 'res' }],
        heap: [frameObj('df', D, { selected: colSel, rowColors }), seriesObj('res', mask)],
        note: 'True = la ligne répète une ligne **précédente** ; la **première** occurrence reste False.' }],
      output: fmtSeries(mask),
      verdict: `${n} doublon(s) repéré(s). \`df.duplicated(...).sum()\` les compte.`,
    };
  }
  const keep = dup.flatMap((d, i) => (d ? [] : [i]));
  const res: Frame = { ...D, index: keep.map((i) => D.index[i]), rows: keep.map((i) => [...D.rows[i]]) };
  return {
    code: `res = df.drop_duplicates(${sub.code})\nprint(res)`,
    steps: [step1, { label: 'drop_duplicates', code: `df.drop_duplicates(${sub.code})`, vars: [{ name: 'df', ref: 'df' }, { name: 'res', ref: 'res' }],
      heap: [frameObj('df', D, { selected: keep.map((i) => `${i}:*`), rowColors }), frameObj('res', res, { badges: ['nouvel objet'] })] }],
    output: fmtFrame(res),
    alerts: subset === 'nom' ? [{ level: 'warning', atStep: 1, title: 'Critère trop large', message: 'Sur `["nom"]` seul, « Ana / Nice » et « Bob / Lyon / 18 » sont supprimés alors que ce sont des **lignes différentes**. Choisis les colonnes qui identifient vraiment un enregistrement.' }] : [],
    verdict: `${n} ligne(s) supprimée(s), la première occurrence est conservée.`,
  };
}

export default defineFiche({
  id: 'nettoyage-valeurs-manquantes',
  title: 'Valeurs manquantes et doublons',
  theme: 'nettoyage',
  tags: ['manquantes', 'axis', 'distributions'],
  keywords: ['NaN', 'dropna', 'fillna', 'imputation', 'doublons', 'axis', 'isnull', 'isna', 'notnull', 'sum', 'drop', 'dropna', 'thresh', 'axis=0', 'axis=1', 'fillna', 'mean', 'median', 'imputation', 'duplicated', 'drop_duplicates', 'subset', 'None', 'NaN'],
  summary: 'Compter, supprimer (`dropna`, `thresh`) ou remplacer (`fillna`) les valeurs manquantes, et éliminer les doublons.',
  concept: `
- Les valeurs manquantes sont généralement représentées par **NaN** ou **None** dans un DataFrame pandas.
- \`df.isnull().sum()\` compte le nombre de valeurs manquantes **par colonne**.
- Le paramètre **\`thresh\`** de \`df.dropna()\` fixe le nombre **minimum de valeurs non manquantes** qu’une colonne (ou une ligne) doit avoir pour être conservée.
- \`df.duplicated()\` repère les lignes dont les valeurs sont identiques à une ligne **précédente**, selon les colonnes passées en argument.
- Remplacer les valeurs manquantes par la moyenne d’une colonne (**l’imputation**) ne change pas la moyenne de cette colonne, mais **modifie la forme de sa distribution**.
`,
  useCase: 'Décider, colonne par colonne, s’il faut supprimer, garder ou estimer les données manquantes, puis dédoublonner avant toute analyse.',
  syntax: `df.isnull().sum()                     # valeurs manquantes par colonne
df.notnull().sum()                    # valeurs présentes par colonne
df.drop(colonnes, axis=1)             # supprimer des colonnes précises
df.dropna(thresh=n, axis=1)           # supprimer selon un seuil
df.dropna()                           # supprimer les lignes incomplètes
df["col"].fillna(moyenne)             # imputation
df.duplicated(["col1", "col2"])       # repérer les doublons
df.drop_duplicates(["col1", "col2"])  # supprimer les doublons`,
  simulator: {
    title: 'Simulateur — dropna, axis et thresh',
    params: [
      { id: 'axis', label: 'axis', type: 'choice', default: '0', options: [{ value: '0', label: '`axis=0` (lignes)' }, { value: '1', label: '`axis=1` (colonnes)' }] },
      { id: 'thresh', label: 'thresh', type: 'choice', default: 'none', options: [{ value: 'none', label: 'aucun' }, { value: '2', label: '`thresh=2`' }, { value: '3', label: '`thresh=3`' }] },
    ],
    simulate: (p) => simDropna(String(p.axis), String(p.thresh)),
  },
  simulators: [
    {
      title: 'Simulateur — imputation avec fillna',
      params: [{ id: 'strategy', label: 'Remplacer les NaN par', type: 'choice', default: 'mean', options: [
        { value: 'mean', label: 'la moyenne' }, { value: 'median', label: 'la médiane' }, { value: 'zero', label: '`0`' },
      ] }],
      simulate: (p) => simFillna(String(p.strategy)),
    },
    {
      title: 'Simulateur — doublons',
      params: [
        { id: 'subset', label: 'Colonnes comparées', type: 'choice', default: 'all', options: [
          { value: 'all', label: 'toutes' }, { value: 'nom', label: '`["nom"]`' }, { value: 'nomville', label: '`["nom", "ville"]`' },
        ] },
        { id: 'action', label: 'Méthode', type: 'choice', default: 'duplicated', options: [
          { value: 'duplicated', label: '`duplicated()`' }, { value: 'drop', label: '`drop_duplicates()`' },
        ] },
      ],
      simulate: (p) => simDoublons(String(p.subset), String(p.action)),
    },
  ],
  pitfalls: [
    '`df.dropna()` sans argument supprime toute ligne qui contient **un seul** NaN : on peut perdre presque tout le jeu de données.',
    '`thresh` compte les valeurs **présentes**, pas les valeurs manquantes.',
    'Imputer par la moyenne réduit l’écart-type : les analyses de dispersion deviennent trop optimistes.',
    '`duplicated()` marque la **première** occurrence comme False : `sum()` compte les copies, pas les groupes.',
    '`dropna`, `fillna`, `drop_duplicates` renvoient un **nouvel objet** : penser à réaffecter.',
  ],
  takeaways: [
    'Toujours commencer par `df.isnull().sum()`.',
    '`axis=0` = lignes, `axis=1` = colonnes ; `thresh` = minimum de valeurs présentes.',
    'Imputation : même moyenne, distribution plus resserrée.',
  ],
  mentalModel: {
    title: 'La règle',
    code: `df.isna().sum()            # Series : nombre de NaN PAR COLONNE
df.isna().sum().sum()      # un nombre : total des NaN
df.dropna()                # SUPPRIMER les lignes qui ont au moins un NaN
df.fillna(valeur)          # REMPLACER les NaN, la forme ne change pas
df.duplicated()            # Series de True/False : la ligne répète-t-elle une précédente ?
df.drop_duplicates()       # SUPPRIMER ces répétitions`,
    note: 'Ces méthodes renvoient un **nouveau** DataFrame : sans `df = …`, rien n’est modifié.',
  },
  comparisons: [{
    title: 'dropna ou fillna ?',
    headers: ['', '`dropna`', '`fillna`'],
    rows: [
      ['Effet', '**retire** des lignes (ou des colonnes)', '**remplace** les NaN'],
      ['Forme du résultat', 'plus petite', 'identique'],
      ['Réglages', '`how="all"`, `thresh=n`, `subset=[...]`, `axis=1`', 'une valeur, un dict par colonne, `df.mean()`…'],
      ['Risque', 'perdre beaucoup de lignes : une seule colonne vide suffit', 'inventer des données et **écraser la variance**'],
      ['Propager la valeur précédente', '—', '`df.ffill()` / `df.bfill()` (`fillna(method=…)` n’existe plus en pandas 3)'],
      ['Quand', 'peu de lignes touchées, ou ligne inutilisable', 'colonne utile, valeur raisonnable à estimer'],
    ],
    conclusion: 'Toujours commencer par `df.isna().sum()` : c’est le compte des NaN par colonne qui décide.',
  }, {
    title: 'Les réglages de dropna (a = [1, NaN, 3], b = [NaN, NaN, 6])',
    headers: ['Appel', 'Lignes gardées', 'Règle'],
    rows: [
      ['`dropna()`', '2', 'supprime dès qu’**un** NaN est présent (`how="any"`)'],
      ['`dropna(how="all")`', '0, 2', 'supprime seulement les lignes **entièrement** vides'],
      ['`dropna(subset=["a"])`', '0, 2', 'ne regarde que la colonne `a`'],
      ['`dropna(thresh=2)`', '2', 'garde les lignes ayant **au moins 2** valeurs présentes'],
      ['`dropna(axis=1)`', 'aucune colonne', 'supprime les **colonnes** contenant un NaN'],
    ],
  }, {
    title: 'duplicated : quelles lignes sont marquées ?',
    headers: ['Appel', 'Sur a = [1, 1, 2]', 'Signification'],
    rows: [
      ['`duplicated()`', '`[False, True, False]`', 'la 1re occurrence est gardée (`keep="first"`)'],
      ['`duplicated(keep="last")`', '`[True, False, False]`', 'la dernière est gardée'],
      ['`duplicated(keep=False)`', '`[True, True, False]`', '**toutes** les occurrences sont marquées : pour les inspecter'],
      ['`drop_duplicates(subset="a")`', 'garde les lignes 0 et 2', 'doublon jugé sur la colonne `a` seulement'],
    ],
  }],
  deepDives: [{
    title: 'NaN n’est égal à rien, pas même à lui-même',
    body: `\`NaN\` (« Not a Number ») est une valeur \`float\` spéciale : \`np.nan == np.nan\` vaut **False**. D’où trois conséquences pratiques :

- \`df[df["a"] == np.nan]\` est **toujours vide** : utiliser \`df["a"].isna()\` ;
- une colonne d’entiers qui reçoit un NaN passe en \`float64\` (\`1\` devient \`1.0\`) ;
- les statistiques **ignorent** les NaN : \`mean()\` divise par le nombre de valeurs présentes, et la somme d’une colonne vide vaut \`0.0\`.

\`count()\` donne le nombre de valeurs présentes, \`size\` le nombre de lignes : leur différence est exactement le nombre de NaN.`,
    code: `s = pd.Series([1, np.nan, 3])
s.mean()               # 2.0  ← (1 + 3) / 2, le NaN n’est pas compté
s.count(), s.size      # (2, 3)
s.isna().sum()         # 1`,
  }],
  related: ['nettoyage-pandas', 'pandas-statistiques-filtrage'],
  source: 'DataXp — Nettoyage et Analyse de Données avec Python, chapitre 5 (sources/nettoyage/dataxp-valeurs-manquantes-doublons.pdf)',
});
