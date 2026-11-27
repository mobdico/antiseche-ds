import { defineFiche, type SimAlert, type SimResult, type SimStep } from '../../engine/types';
import { fmtFrame, fmtSeries, frameObj, seriesObj, type Frame, type Series } from '../_lib/pandas-sim';

const TXT: Series = { name: 'texte', index: [0, 1, 2, 3], values: ['Python 3.12', 'pandas', null, 'PYTHON'], dtype: 'object' };
const TXT_CODE = 's = pd.Series(["Python 3.12", "pandas", np.nan, "PYTHON"], name="texte")';

// ------------------------------------------------------------------ 1. str.contains et les NaN
function simContains(mode: string, version: string): SimResult {
  const call = mode === 'case' ? 's.str.contains("python", case=False, na=False)' : mode === 'na' ? 's.str.contains("Python", na=False)' : 's.str.contains("Python")';
  const raw = mode === 'case' ? [true, false, false, true] : [true, false, false, false];
  const nanMask = mode === 'plain' && version === 'p2';
  const maskVals = nanMask ? [true, false, null, false] : raw;
  const mask: Series = { name: 'texte', index: [0, 1, 2, 3], values: maskVals, dtype: nanMask ? 'object' : 'bool' };
  const steps: SimStep[] = [
    { label: 's', code: TXT_CODE, vars: [{ name: 's', ref: 's' }], heap: [seriesObj('s', TXT, { changed: ['2:0'] })], note: 'La ligne 2 est manquante (NaN).' },
    { label: 'contains', code: `masque = ${call}`, vars: [{ name: 's', ref: 's' }, { name: 'masque', ref: 'm' }], heap: [seriesObj('s', TXT), seriesObj('m', mask, { changed: nanMask ? ['2:0'] : [] })],
      note: nanMask ? 'pandas 2.x : sur une valeur manquante, `contains()` renvoie **NaN**, pas False. Le masque n’est plus purement booléen.'
        : mode === 'case' ? '`case=False` ignore la casse : « PYTHON » est trouvé aussi.' : mode === 'na' ? '`na=False` : une valeur manquante est comptée comme « ne contient pas ».'
          : 'pandas ≥ 3.0 : le texte a le dtype `str`, et `contains()` renvoie False sur les valeurs manquantes.' },
  ];
  const code = `${TXT_CODE}\nmasque = ${call}\nprint(s[masque])`;
  if (nanMask) {
    steps.push({ label: 'Filtrer', code: 's[masque]', vars: steps[1].vars, heap: steps[1].heap });
    return {
      code, steps,
      output: ['Traceback (most recent call last):', '  ...', 'ValueError: Cannot mask with non-boolean array containing NA / NaN values'],
      alerts: [{ level: 'error', atStep: 2, title: 'ValueError', message: 'Un masque qui contient NaN ne peut pas servir à filtrer. Solution : `str.contains(motif, na=False)`.' }],
      verdict: 'pandas 2.x : toujours écrire `na=False` quand la colonne peut contenir des valeurs manquantes.',
    };
  }
  const pos = raw.flatMap((b, i) => (b ? [i] : []));
  const res: Series = { ...TXT, index: pos, values: pos.map((i) => TXT.values[i]) };
  steps.push({ label: 'Filtrer', code: 's[masque]', vars: [{ name: 's', ref: 's' }, { name: 'res', ref: 'res' }], heap: [seriesObj('s', TXT, { selected: pos.map((i) => `${i}:*`) }), seriesObj('res', res)] });
  const alerts: SimAlert[] = [];
  if (mode === 'plain') alerts.push({ level: 'info', atStep: 1, title: 'Comportement de pandas ≥ 3.0', message: 'Plus d’erreur ici, mais `na=False` reste recommandé : ton code fonctionnera aussi avec pandas 2.x.' });
  return {
    code, steps,
    // le dtype affiché du texte dépend de la version : object (2.x) ou str (≥ 3.0)
    output: fmtSeries(res).map((l) => (l.startsWith('Name:') && version === 'p3' && mode === 'plain' ? l.replace('object', 'str') : l)),
    alerts,
    verdict: '`str.contains(motif, na=False)` : chercher un motif **sans planter** sur les valeurs manquantes.',
  };
}

// ------------------------------------------------------------------ 2. extract vs extractall
const VER: Series = { name: 'txt', index: [0, 1, 2, 3], values: ['Version 3.12 et 3.11', 'v2.7', 'aucune', null], dtype: 'object' };

function simExtract(method: string): SimResult {
  const all = method === 'extractall';
  const res: Frame = all
    ? { columns: ['0', '1'], index: ['(0, 0)', '(0, 1)', '(1, 0)'], rows: [['3', '12'], ['3', '11'], ['2', '7']], dtypes: ['object', 'object'], indexName: '(ligne, match)' }
    : { columns: ['0', '1'], index: [0, 1, 2, 3], rows: [['3', '12'], ['2', '7'], [null, null], [null, null]], dtypes: ['object', 'object'] };
  const out = all
    ? ['         0   1', '  match       ', '0 0      3  12', '  1      3  11', '1 0      2   7']
    : fmtFrame(res);
  return {
    code: `s = pd.Series(["Version 3.12 et 3.11", "v2.7", "aucune", np.nan], name="txt")\nmotif = r"(\\d+)\\.(\\d+)"\nres = s.str.${method}(motif)\nprint(res)`,
    steps: [
      { label: 's', code: 's = pd.Series([...])', vars: [{ name: 's', ref: 's' }], heap: [seriesObj('s', VER)],
        note: 'Motif `(\\d+)\\.(\\d+)` : un ou plusieurs chiffres, un point, un ou plusieurs chiffres. Chaque paire de **parenthèses** = un groupe = une colonne du résultat.' },
      { label: method, code: `s.str.${method}(motif)`, vars: [{ name: 's', ref: 's' }, { name: 'res', ref: 'res' }],
        heap: [seriesObj('s', VER, { selected: ['0:*', '1:*'] }), frameObj('res', res, { badges: ['nouvel objet'], changed: all ? ['1:0', '1:1'] : [] })],
        note: all ? '`extractall()` : **une ligne par correspondance**. La ligne 0 en a deux (3.12 et 3.11) ; les lignes sans correspondance disparaissent. L’index a deux niveaux : (ligne d’origine, numéro de match).'
          : '`extract()` : **une ligne par ligne d’origine**, seulement la **première** correspondance (3.12, pas 3.11). Pas de correspondance → NaN.' },
    ],
    output: out,
    alerts: [{ level: 'info', atStep: 1, title: 'Résultat en texte', message: 'Les groupes extraits sont des **chaînes** (« 12 », pas 12) : ajouter `.astype(int)` pour calculer avec.' }],
    verdict: all ? '`extractall()` → **toutes** les correspondances.' : '`extract()` → **la première** correspondance par ligne.',
  };
}

// ------------------------------------------------------------------ 3. vectorisé vs apply
function simApply(mode: string): SimResult {
  const steps: SimStep[] = [{ label: 's', code: TXT_CODE, vars: [{ name: 's', ref: 's' }], heap: [seriesObj('s', TXT, { changed: ['2:0'] })] }];
  if (mode === 'applyraw') {
    steps.push({ label: 'apply', code: 's.apply(lambda x: x.upper())', vars: [{ name: 's', ref: 's' }], heap: [seriesObj('s', TXT, { selected: ['2:*'] })], note: 'Pour la ligne 2, `x` vaut `nan`, un **float** : il n’a pas de méthode `.upper()`.' });
    return {
      code: `${TXT_CODE}\nres = s.apply(lambda x: x.upper())`, steps,
      output: ['Traceback (most recent call last):', '  ...', "AttributeError: 'float' object has no attribute 'upper'"],
      alerts: [{ level: 'error', atStep: 1, title: 'AttributeError', message: '`apply()` passe chaque valeur telle quelle, NaN compris. La fonction plante sur la première valeur manquante.' }],
      verdict: 'Préférer `s.str.upper()` : les méthodes `.str` gèrent les NaN toutes seules.',
    };
  }
  const vec = mode === 'str';
  const res: Series = { ...TXT, values: ['PYTHON 3.12', 'PANDAS', vec ? null : 'NAN', 'PYTHON'] };
  const line = vec ? 's.str.upper()' : 's.apply(lambda x: str(x).upper())';
  steps.push({ label: vec ? '.str.upper()' : 'apply(str(x))', code: `res = ${line}`, vars: [{ name: 's', ref: 's' }, { name: 'res', ref: 'res' }],
    heap: [seriesObj('s', TXT), seriesObj('res', res, { changed: ['2:0'] })],
    note: vec ? 'La valeur manquante est **exclue du calcul** et reste NaN.' : '`str(nan)` donne la chaîne « nan » → « NAN » : la valeur manquante est devenue du **texte**.' });
  return {
    code: `${TXT_CODE}\nres = ${line}\nprint(res)\nprint(res.isnull().sum())`, steps,
    output: [...fmtSeries(res), vec ? '1' : '0'],
    alerts: vec ? [] : [{ level: 'warning', atStep: 1, title: 'NaN converti en « NAN »', message: '`res.isnull().sum()` vaut **0** : la valeur manquante a disparu, remplacée par un faux texte. Elle ne sera plus détectée par `dropna()` ni `fillna()`.' }],
    verdict: vec ? 'Méthodes `.str` : vectorisées et sûres face aux NaN.' : '`apply()` traite NaN comme la chaîne « nan » : à éviter pour du texte.',
  };
}

export default defineFiche({
  id: 'nettoyage-chaines',
  title: 'Manipuler les chaînes de caractères avec pandas',
  theme: 'nettoyage',
  tags: ['texte', 'manquantes', 'versions'],
  keywords: ['str', 'regex', 'contains', 'extract', 'NaN', 'texte', '.str', 'str.contains', 'na=False', 'case=False', 'str.extract', 'str.extractall', 'regex', 'expression régulière', 'motif', 'pattern', '[0-9]', '\\d',
    'Cannot mask with non-boolean array containing NA / NaN values', 'AttributeError', "'float' object has no attribute", 'apply', 'merge', 'left_on', 'right_on'],
  summary: 'Les méthodes `.str` vectorisées, les expressions régulières avec `contains`, `extract`, `extractall`, et le piège des valeurs manquantes.',
  concept: `
- Les **méthodes de chaînes vectorisées** de pandas, accessibles via l’attribut \`str\`, traitent chaque élément d’une colonne comme une chaîne de caractères sans conversion explicite, contrairement à \`apply()\`.
- Une **expression régulière** (regex) est un motif de caractères utilisé pour rechercher ou extraire des sous-chaînes, par exemple \`[0-9]\` pour un chiffre ou \`[a-z]\` pour une lettre minuscule.
- \`Series.str.extract()\` ne renvoie que la **première** correspondance par ligne, tandis que \`Series.str.extractall()\` renvoie **toutes** les correspondances trouvées.
- Les méthodes vectorisées **excluent automatiquement les valeurs manquantes** du calcul, contrairement à \`apply()\` qui les traite comme la chaîne \`nan\`.
`,
  useCase: 'Repérer les lignes qui mentionnent un mot-clé, extraire un numéro de version, une année ou un code postal d’une colonne de texte libre.',
  syntax: `pd.merge(left=df1, right=df2, how="left",
         left_on="col1", right_on="col2")   # clés de noms différents
serie.str.methode()                         # méthodes de chaînes
serie.str.contains(motif, na=False)         # chercher sans planter sur NaN
serie.str.extract(motif)                    # première correspondance
serie.str.extractall(motif)                 # toutes les correspondances`,
  simulator: {
    title: 'Simulateur — str.contains et les valeurs manquantes',
    params: [
      { id: 'mode', label: 'Appel', type: 'choice', default: 'plain', options: [
        { value: 'plain', label: '`contains("Python")`' },
        { value: 'na', label: '`contains("Python", na=False)`' },
        { value: 'case', label: '`contains("python", case=False, na=False)`' },
      ] },
      { id: 'version', label: 'Version de pandas', type: 'choice', default: 'p2', showIf: { mode: 'plain' }, options: [{ value: 'p2', label: 'pandas 2.x' }, { value: 'p3', label: 'pandas ≥ 3.0' }] },
    ],
    simulate: (p) => simContains(String(p.mode), String(p.version)),
  },
  simulators: [
    {
      title: 'Simulateur — extract ou extractall',
      params: [{ id: 'method', label: 'Méthode', type: 'choice', default: 'extract', options: [{ value: 'extract', label: '`str.extract(motif)`' }, { value: 'extractall', label: '`str.extractall(motif)`' }] }],
      simulate: (p) => simExtract(String(p.method)),
    },
    {
      title: 'Simulateur — méthode .str ou apply() face aux NaN',
      params: [{ id: 'mode', label: 'Écriture', type: 'choice', default: 'str', options: [
        { value: 'str', label: '`s.str.upper()`' },
        { value: 'applystr', label: '`s.apply(lambda x: str(x).upper())`' },
        { value: 'applyraw', label: '`s.apply(lambda x: x.upper())`' },
      ] }],
      simulate: (p) => simApply(String(p.mode)),
    },
  ],
  pitfalls: [
    'pandas 2.x : `s[s.str.contains(motif)]` plante s’il y a des NaN → ajouter `na=False`.',
    '`contains()` est sensible à la casse par défaut : `case=False` pour l’ignorer.',
    '`contains()` interprète le motif comme une **regex** : « 3.12 » trouve aussi « 3x12 » (le point = n’importe quel caractère). `regex=False` pour une recherche littérale.',
    '`extract()` exige au moins un **groupe** entre parenthèses dans le motif.',
    '`apply(str)` transforme NaN en texte « nan » : la valeur manquante devient invisible.',
  ],
  takeaways: [
    'Texte en colonne → méthodes `.str`, pas de boucle ni d’`apply`.',
    '`contains(motif, na=False)` pour filtrer.',
    '`extract` = 1ʳᵉ correspondance ; `extractall` = toutes.',
  ],
  mentalModel: {
    title: 'La règle',
    code: `s.replace("Paris", "PAR")          # remplace des valeurs ENTIÈRES (la cellule vaut "Paris")
s.str.replace("Est", "E")          # remplace un MORCEAU de texte dans chaque cellule
s.str.contains("aris", na=False)   # masque booléen, sans NaN
s.str.extract(r"(\\d+)")            # le morceau capturé entre ( ) → DataFrame
s.str.strip().str.lower()          # les méthodes .str s’enchaînent`,
    note: '`.str` applique une méthode de chaîne à **chaque cellule** d’une colonne, et laisse passer les valeurs manquantes.',
  },
  comparisons: [{
    title: 'replace ou str.replace ?',
    headers: ['', '`s.replace(a, b)`', '`s.str.replace(a, b)`'],
    rows: [
      ['Remplace', 'une **valeur entière** de cellule', 'un **morceau** de texte dans la cellule'],
      ['`"Lyon-Est"` avec `("Est", "E")`', 'inchangé', '`"Lyon-E"`'],
      ['Plusieurs remplacements', 'un dict : `{"Paris": "P", "Nice": "N"}`', 'enchaîner les appels, ou une regex'],
      ['Regex', 'avec `regex=True`', '`regex=False` par défaut (pandas ≥ 2) ; `regex=True` pour activer'],
      ['Marche aussi sur', 'nombres, DataFrame entier', 'colonnes de texte seulement'],
    ],
    conclusion: 'Recoder des catégories → `replace` (ou `map`). Nettoyer l’intérieur du texte → `str.replace`.',
  }, {
    title: 'Les méthodes .str : ce qu’elles renvoient',
    headers: ['Méthode', 'Renvoie', 'Exemple'],
    rows: [
      ['`str.lower()`, `strip()`, `replace()`', 'Series de texte', '`" Paris "` → `"paris"`'],
      ['`str.contains(motif)`', 'Series de booléens (un masque)', '`case=False`, `na=False`, `regex=False`'],
      ['`str.len()`', 'Series de nombres (float s’il y a un NaN)', '`"Paris"` → `5.0`'],
      ['`str.split("-")`', 'Series de **listes**', '`"Lyon-Est"` → `["Lyon", "Est"]`'],
      ['`str.split("-", expand=True)`', '**DataFrame**, une colonne par morceau', 'shape `(n, nb max de morceaux)`'],
      ['`str.extract(r"(\\d+)")`', '**DataFrame** (une colonne par groupe)', '`expand=False` → Series s’il n’y a qu’un groupe'],
      ['`str.findall(r"\\d+")`', 'Series de listes : **toutes** les occurrences', '`"a1b22"` → `["1", "22"]`'],
      ['`str[0]`', 'le premier caractère', '`"Paris"` → `"P"`'],
    ],
    conclusion: 'Dans un motif, `.` veut dire « n’importe quel caractère » quand la regex est active : `str.contains(".")` est vrai partout. Pour un vrai point : `regex=False`.',
  }],
  related: ['nettoyage-pandas', 'pandas-transformer', 'pandas-combiner'],
  source: 'DataXp — Nettoyage et Analyse de Données avec Python, chapitre 4 (sources/nettoyage/dataxp-manipulation-chaines-pandas.pdf)',
});
