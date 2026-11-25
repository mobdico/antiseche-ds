import { defineFiche, type HeapObj, type SimAlert, type SimResult, type SimStep } from '../../engine/types';
import { VENTES, VENTES_CODE, copyFrame, dtypesOf, fmtFrame, fmtSeries, frameObj, selectRows, seriesObj, toSeries, type Frame, type Series } from '../_lib/pandas-sim';

// ------------------------------------------------------------------ simulateur 1 : loc vs iloc
const fmtCell = (f: Frame, i: number, j: number): string => {
  const v = f.rows[i][j];
  if (v === null) return 'NaN';
  return dtypesOf(f)[j] === 'float64' ? (v as number).toFixed(1) : String(v);
};

function rowSeries(f: Frame, i: number): Series {
  return { name: String(f.index[i]), index: [...f.columns], values: f.columns.map((_, j) => fmtCell(f, i, j)), dtype: 'object' };
}

const SORT_ORDER = [3, 0, 4, 1, 2]; // d, a, e, b, c : tri par ventes décroissantes, NaN à la fin

function simLocIloc(acc: string, sel: string, sorted: boolean): SimResult {
  const base = copyFrame(VENTES);
  const df = sorted ? selectRows(base, SORT_ORDER) : base;
  const isLoc = acc === 'loc';
  const pos = (label: string) => df.index.indexOf(label);
  let code = '';
  let selected: string[] = [];
  let result: HeapObj | null = null;
  let output: string[] = [];
  const alerts: SimAlert[] = [];
  const last = sorted ? 2 : 1;

  if (sel === 'row') {
    const i = isLoc ? pos('c') : 2;
    code = isLoc ? 'res = df.loc["c"]' : 'res = df.iloc[2]';
    selected = [`${i}:*`];
    const s = rowSeries(df, i);
    result = seriesObj('res', s);
    output = fmtSeries(s);
    if (sorted) alerts.push(isLoc
      ? { level: 'info', atStep: last, title: '.loc suit l’étiquette', message: 'Après le tri, la ligne « c » est en **dernière position**, mais `.loc["c"]` la retrouve quand même : l’étiquette voyage avec la ligne.' }
      : { level: 'warning', atStep: last, title: '.iloc suit la position', message: 'Après le tri, la position 2 contient la ligne **e** (Madrid), plus la ligne c ! `.iloc` ne regarde que l’ordre **actuel** des lignes.' });
  } else if (sel === 'slice') {
    let ps: number[];
    if (isLoc) {
      const a = pos('b'), b = pos('d');
      ps = a <= b ? Array.from({ length: b - a + 1 }, (_, k) => a + k) : [];
      code = 'res = df.loc["b":"d"]';
    } else {
      ps = [1, 2];
      code = 'res = df.iloc[1:3]';
    }
    selected = ps.map((i) => `${i}:*`);
    const f = selectRows(df, ps);
    result = frameObj('res', f);
    output = fmtFrame(f);
    if (isLoc && !sorted) alerts.push({ level: 'info', atStep: last, title: 'Fin incluse', message: '`.loc["b":"d"]` → b, c **et d** (3 lignes).' });
    if (!isLoc) alerts.push({ level: 'info', atStep: last, title: 'Fin exclue', message: '`.iloc[1:3]` → positions 1 et 2 seulement (comme le slicing Python), **pas la position 3**.' });
    if (isLoc && sorted) alerts.push({ level: 'warning', atStep: last, title: 'Tranche vide !', message: 'Dans l’ordre trié, « b » arrive **après** « d » : la tranche `"b":"d"` ne contient aucune ligne → DataFrame vide, sans erreur.' });
  } else if (sel === 'cell') {
    const i = isLoc ? pos('b') : 1;
    code = isLoc ? 'res = df.loc["b", "ventes"]' : 'res = df.iloc[1, 2]';
    selected = [`${i}:2`];
    const v = df.rows[i][2];
    result = { id: 'res', pyType: v === null ? 'float' : 'float', kind: 'scalar', value: v, note: 'numpy.float64' };
    output = [v === null ? 'nan' : (v as number).toFixed(1)];
    if (sorted && !isLoc) alerts.push({ level: 'warning', atStep: last, title: 'Autre ligne après le tri', message: `La position 1 contient maintenant la ligne **${df.index[1]}** : \`.iloc[1, 2]\` renvoie ${output[0]} et non 80.0.` });
  } else {
    code = isLoc ? 'res = df.loc[:, "ville"]' : 'res = df.iloc[:, 0]';
    selected = ['*:0'];
    const s = toSeries(df, 'ville');
    result = seriesObj('res', s);
    output = fmtSeries(s);
  }

  const steps: SimStep[] = [
    { label: 'Créer df', code: 'df = pd.DataFrame({...}, index=["a", …, "e"])', vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', base, { showPositions: true })],
      note: 'Chaque ligne a une **étiquette** (a…e) *et* une **position** (0…4). Au départ, elles se correspondent.' },
  ];
  if (sorted) steps.push({
    label: 'Trier', code: 'df = df.sort_values("ventes", ascending=False)',
    vars: [{ name: 'df', ref: 'df2' }], heap: [frameObj('df2', df, { showPositions: true, badges: ['nouvel objet'] })],
    note: 'Le tri **déplace les lignes avec leur étiquette** : l’ordre devient d, a, e, b, c. Les positions, elles, restent 0…4. NaN est placé à la fin.',
  });
  const dfId = sorted ? 'df2' : 'df';
  steps.push({
    label: 'Sélectionner', code,
    vars: [{ name: 'df', ref: dfId }, { name: 'res', ref: 'res' }],
    heap: [frameObj(dfId, df, { showPositions: true, selected: selected.length ? selected : ['-1:*'] }), result!],
  });

  const sortLine = sorted ? 'df = df.sort_values("ventes", ascending=False)\n' : '';
  return {
    code: `${VENTES_CODE}\n\n${sortLine}${code}\nprint(res)`,
    steps,
    output,
    alerts,
    verdict: isLoc ? '`.loc[]` sélectionne par **étiquette** (le nom de la ligne).' : '`.iloc[]` sélectionne par **position entière**, en commençant à 0.',
  };
}

// ------------------------------------------------------------------ simulateur 2 : combiner des conditions
const C1 = [true, true, false, false, false]; // pays == France
const C2 = [true, false, false, true, false]; // ventes > 100

function simCombine(op: string, style: string): SimResult {
  const df = copyFrame(VENTES);
  const s = (name: string | null, values: boolean[]): Series => ({ name, index: [...df.index], values, dtype: 'bool' });
  const c1 = '(df["pays"] == "France")', c2 = '(df["ventes"] > 100)';
  const expr: Record<string, Record<string, string>> = {
    paren: { and: `${c1} & ${c2}`, or: `${c1} | ${c2}`, not: `~${c1}` },
    noparen: { and: 'df["pays"] == "France" & df["ventes"] > 100', or: 'df["pays"] == "France" | df["ventes"] > 100', not: '~df["pays"] == "France"' },
    python: { and: `${c1} and ${c2}`, or: `${c1} or ${c2}`, not: `not ${c1}` },
  };
  const e = expr[style]?.[op] ?? expr.paren.and;
  const step1: SimStep = { label: 'Créer df', code: 'df = pd.DataFrame({...})', vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', df)] };
  const code = `${VENTES_CODE}\n\nmasque = ${e}\nprint(df[masque])`;

  let err: { type: string; msg: string; why: string } | null = null;
  if (style === 'python') err = { type: 'ValueError', msg: 'The truth value of a Series is ambiguous. Use a.empty, a.item(), a.any() or a.all().', why: '`and`, `or` et `not` demandent **un seul** booléen, mais une Series en contient plusieurs. pandas refuse de deviner : il faut `&`, `|`, `~`, qui opèrent **élément par élément**.' };
  else if (style === 'noparen' && op === 'not') err = { type: 'TypeError', msg: "bad operand type for unary ~: 'str'", why: 'Sans parenthèses, `~` s’applique d’abord à `df["pays"]` (du texte) avant la comparaison `==`. Inverser du texte n’a pas de sens.' };
  else if (style === 'noparen') err = { type: 'TypeError', msg: `Cannot perform '${op === 'and' ? 'rand_' : 'ror_'}' with a dtyped [float64] array and scalar of type [bool]`, why: `\`${op === 'and' ? '&' : '|'}\` est **prioritaire** sur \`==\` et \`>\` : Python calcule d’abord \`"France" ${op === 'and' ? '&' : '|'} df["ventes"]\`, ce qui n’a aucun sens. D’où les parenthèses obligatoires autour de chaque comparaison.` };

  if (err) {
    return {
      code,
      steps: [step1, { label: 'Évaluer', code: `masque = ${e}`, vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', df)], note: 'L’expression lève une exception : `masque` n’est jamais créé.' }],
      output: ['Traceback (most recent call last):', '  ...', `${err.type}: ${err.msg}`],
      alerts: [{ level: 'error', atStep: 1, title: err.type, message: err.why }],
      verdict: 'Avec pandas : `&` (et), `|` (ou), `~` (non), et **chaque comparaison entre parenthèses**.',
    };
  }
  const m = op === 'and' ? C1.map((v, i) => v && C2[i]) : op === 'or' ? C1.map((v, i) => v || C2[i]) : C1.map((v) => !v);
  const pos = m.flatMap((v, i) => (v ? [i] : []));
  const res = selectRows(df, pos);
  const inter: HeapObj[] = op === 'not' ? [seriesObj('c1', s('pays', C1))] : [seriesObj('c1', s('pays', C1)), seriesObj('c2', s('ventes', C2))];
  return {
    code,
    steps: [
      step1,
      { label: 'Conditions', code: op === 'not' ? c1 : `${c1}   et   ${c2}`, vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', df), ...inter.map((o) => ({ ...o, badges: ['temporaire'] }))],
        note: 'Chaque comparaison produit sa propre Series de booléens (objets temporaires).' },
      { label: 'Combiner', code: `masque = ${e}`, vars: [{ name: 'df', ref: 'df' }, { name: 'masque', ref: 'masque' }], heap: [frameObj('df', df), ...inter.map((o) => ({ ...o, ghost: true })), seriesObj('masque', s(op === 'not' ? 'pays' : null, m))],
        note: op === 'and' ? '`&` : True seulement si **les deux** valent True.' : op === 'or' ? '`|` : True si **au moins une** vaut True.' : '`~` : inverse chaque booléen.' },
      { label: 'Filtrer', code: 'df[masque]', vars: [{ name: 'df', ref: 'df' }, { name: 'masque', ref: 'masque' }], heap: [frameObj('df', df, { selected: pos.length ? pos.map((i) => `${i}:*`) : ['-1:*'] }), seriesObj('masque', s(op === 'not' ? 'pays' : null, m))] },
    ],
    output: fmtFrame(res),
    alerts: [{ level: 'success', atStep: 2, title: 'Syntaxe correcte', message: 'Opérateur pandas + parenthèses autour de chaque comparaison.' }],
    verdict: `${pos.length} ligne(s) retenue(s) : ${pos.map((i) => df.index[i]).join(', ') || 'aucune'}.`,
  };
}

// ------------------------------------------------------------------ simulateur 3 : alignement d'index
function simAlign(src: string): SimResult {
  const df = copyFrame(VENTES);
  const steps: SimStep[] = [{ label: 'Créer df', code: 'df = pd.DataFrame({...})', vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', df)] }];
  if (src === 'list3') {
    const line = 'df["bonus"] = [1, 2, 3]';
    steps.push({ label: 'Affecter', code: line, vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', df)], note: 'Une liste n’a pas d’étiquettes : pandas exige exactement **une valeur par ligne**.' });
    return {
      code: `${VENTES_CODE}\n\n${line}`, steps,
      output: ['Traceback (most recent call last):', '  ...', 'ValueError: Length of values (3) does not match length of index (5)'],
      alerts: [{ level: 'error', atStep: 1, title: 'ValueError', message: 'Liste de 3 valeurs pour 5 lignes : pas d’alignement possible, donc erreur.' }],
      verdict: 'Une **liste** est affectée **par position** et doit avoir la même longueur que le DataFrame.',
    };
  }
  const bonus: Series = { name: null, index: ['a', 'c', 'z'], values: [1, 2, 3], dtype: 'int64' };
  const after = copyFrame(df);
  after.columns = [...after.columns, 'bonus'];
  after.dtypes = [...(after.dtypes ?? []), 'float64'];
  const vals = [1, null, 2, null, null];
  after.rows = after.rows.map((r, i) => [...r, vals[i]]);
  const line = 'df["bonus"] = pd.Series([1, 2, 3], index=["a", "c", "z"])';
  steps.push({ label: 'Series', code: 'bonus = pd.Series([1, 2, 3], index=["a", "c", "z"])', vars: [{ name: 'df', ref: 'df' }, { name: 'bonus', ref: 'bonus' }], heap: [frameObj('df', df), seriesObj('bonus', bonus)] });
  steps.push({
    label: 'Aligner', code: 'df["bonus"] = bonus', vars: [{ name: 'df', ref: 'df' }, { name: 'bonus', ref: 'bonus' }],
    heap: [frameObj('df', after, { changed: [0, 1, 2, 3, 4].map((i) => `${i}:4`) }), seriesObj('bonus', bonus, { selected: ['0:*', '1:*'] })],
    note: 'a → 1, c → 2 ; b, d, e n’existent pas dans `bonus` → **NaN** ; « z » n’existe pas dans `df` → **ignorée**. La colonne devient float64 à cause des NaN.',
  });
  return {
    code: `${VENTES_CODE}\n\n${line}\nprint(df)`, steps,
    output: fmtFrame(after),
    alerts: [{ level: 'warning', atStep: 2, title: 'Alignement silencieux', message: 'Aucune erreur : les étiquettes absentes deviennent NaN et les étiquettes en trop disparaissent. Vérifie toujours les NaN après ce type d’affectation.' }],
    verdict: 'Une **Series** est affectée **par étiquette** (alignement d’index), pas par position.',
  };
}

export default defineFiche({
  id: 'pandas-selection-avancee',
  title: 'Sélection avancée : .loc vs .iloc, conditions combinées',
  theme: 'pandas',
  tags: ['selection', 'tri', 'erreurs'],
  keywords: ['loc', 'iloc', 'sélection', 'indexation booléenne', 'alignement', 'tri', 'iloc', 'position', 'étiquette', 'isnull', 'sort_values', 'ascending', '&', '|', '~', 'and', 'or', 'not',
    'The truth value of a Series is ambiguous', 'ValueError', 'TypeError', "Cannot perform 'rand_'", 'bad operand type for unary ~',
    'Length of values does not match length of index', 'alignement d’index', 'NaN', 'nouvelle colonne'],
  summary: '`.loc` (étiquette) vs `.iloc` (position), combiner des conditions avec `&`, `|`, `~`, et l’alignement d’index.',
  concept: `
- **\`loc[]\` vs \`iloc[]\`** : \`loc[]\` sélectionne par **étiquette**, \`iloc[]\` par **position entière**, en commençant à 0.
- **Opérateurs booléens pandas** : \`&\`, \`|\`, \`~\` remplacent \`and\`, \`or\` et \`not\` sur les Series, et **chaque comparaison combinée doit être entourée de parenthèses**.
- **Alignement d’index** : quand on affecte une Series à une nouvelle colonne, pandas aligne automatiquement les valeurs selon les étiquettes d’index, et remplit les étiquettes manquantes avec NaN.
`,
  useCase: 'Extraire des lignes par leur rang (top 3 après un tri), filtrer sur plusieurs critères à la fois, ajouter une colonne calculée ailleurs.',
  syntax: `df.iloc[ligne, colonne]                 # sélectionner par position
df.iloc[:, 0]                           # colonne entière par position
colonne.isnull()                        # masque des valeurs manquantes
(condition1) & (condition2)             # combiner des conditions
df.sort_values(colonne, ascending=False)  # trier
df["nouvelle_colonne"] = valeurs        # créer une colonne`,
  simulator: {
    title: 'Simulateur — .loc ou .iloc ?',
    params: [
      { id: 'acc', label: 'Accesseur', type: 'choice', default: 'loc', options: [
        { value: 'loc', label: '`.loc` (étiquette)' },
        { value: 'iloc', label: '`.iloc` (position)' },
      ] },
      { id: 'sel', label: 'Sélection', type: 'choice', default: 'slice', options: [
        { value: 'row', label: 'une ligne' },
        { value: 'slice', label: 'une tranche' },
        { value: 'cell', label: 'une cellule' },
        { value: 'col', label: 'une colonne' },
      ] },
      { id: 'sorted', label: 'Trier avant', type: 'toggle', default: false, onLabel: '`sort_values("ventes", ascending=False)`', offLabel: 'ordre d’origine',
        help: 'Le tri change l’ordre des lignes : c’est là que loc et iloc divergent.' },
    ],
    simulate: (p) => simLocIloc(String(p.acc), String(p.sel), !!p.sorted),
  },
  simulators: [
    {
      title: 'Simulateur — combiner des conditions',
      params: [
        { id: 'op', label: 'Opération', type: 'choice', default: 'and', options: [
          { value: 'and', label: 'ET' }, { value: 'or', label: 'OU' }, { value: 'not', label: 'NON' },
        ] },
        { id: 'style', label: 'Écriture', type: 'choice', default: 'paren', options: [
          { value: 'paren', label: '`&` `|` `~` + parenthèses' },
          { value: 'noparen', label: '`&` `|` `~` sans parenthèses' },
          { value: 'python', label: '`and` `or` `not`' },
        ] },
      ],
      simulate: (p) => simCombine(String(p.op), String(p.style)),
    },
    {
      title: 'Simulateur — alignement d’index',
      params: [
        { id: 'src', label: 'Valeur affectée', type: 'choice', default: 'series', options: [
          { value: 'series', label: '`pd.Series([1, 2, 3], index=["a", "c", "z"])`' },
          { value: 'list3', label: '`[1, 2, 3]` (liste)' },
        ] },
      ],
      simulate: (p) => simAlign(String(p.src)),
    },
  ],
  pitfalls: [
    '`.loc["b":"d"]` inclut d ; `.iloc[1:3]` exclut la position 3.',
    'Après un `sort_values()`, `.iloc[0]` est la **première ligne triée**, pas la ligne d’étiquette 0.',
    '`and` / `or` sur des Series → `ValueError: The truth value of a Series is ambiguous`.',
    'Oublier les parenthèses : `df["a"] == 1 & df["b"] > 2` → `TypeError` (priorité de `&`).',
    'Affecter une Series d’index différent produit des **NaN silencieux**.',
  ],
  takeaways: [
    '`loc` = étiquette (fin incluse), `iloc` = position (fin exclue).',
    '`(cond1) & (cond2)`, `(cond1) | (cond2)`, `~(cond)` — toujours avec parenthèses.',
    'Series → alignée par étiquette ; liste → par position.',
  ],
  related: ['pandas-introduction', 'pandas-statistiques-filtrage'],
  source: 'DataXp — Introduction à NumPy et Pandas, chapitre 5 (sources/pandas/dataxp-selection-avancee-agregation-pandas.pdf)',
});
