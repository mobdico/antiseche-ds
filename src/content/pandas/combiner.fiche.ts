import { defineFiche, type SimAlert, type SimResult } from '../../engine/types';
import { fmtFrame, frameObj, type Frame } from '../_lib/pandas-sim';

// ------------------------------------------------------------------ merge
const VENTES_M: Frame = { columns: ['magasin_id', 'ventes'], index: [0, 1, 2], rows: [[1, 120], [2, 80], [4, 95]], dtypes: ['int64', 'int64'] };
const MAGASINS: Frame = { columns: ['magasin_id', 'ville'], index: [0, 1, 2], rows: [[1, 'Paris'], [2, 'Lyon'], [3, 'Berlin']], dtypes: ['int64', 'object'] };
const LEFT_ONLY = 1; // couleur : ligne présente seulement à gauche
const RIGHT_ONLY = 3; // couleur : ligne présente seulement à droite

const MERGES: Record<string, { rows: [number, number | null, string | null][]; colors: (number | null)[]; ventesFloat: boolean; text: string }> = {
  inner: { rows: [[1, 120, 'Paris'], [2, 80, 'Lyon']], colors: [null, null], ventesFloat: false,
    text: '**inner** : seules les clés présentes **des deux côtés** (1 et 2). Les magasins 3 et 4 disparaissent.' },
  left: { rows: [[1, 120, 'Paris'], [2, 80, 'Lyon'], [4, 95, null]], colors: [null, null, LEFT_ONLY], ventesFloat: false,
    text: '**left** : **toutes** les lignes de gauche ; le magasin 4, sans correspondance, reçoit `ville = NaN`.' },
  right: { rows: [[1, 120, 'Paris'], [2, 80, 'Lyon'], [3, null, 'Berlin']], colors: [null, null, RIGHT_ONLY], ventesFloat: true,
    text: '**right** : toutes les lignes de droite ; Berlin n’a pas de ventes → NaN (la colonne `ventes` devient float).' },
  outer: { rows: [[1, 120, 'Paris'], [2, 80, 'Lyon'], [3, null, 'Berlin'], [4, 95, null]], colors: [null, null, RIGHT_ONLY, LEFT_ONLY], ventesFloat: true,
    text: '**outer** : toutes les clés des deux côtés, triées ; NaN partout où il manque une correspondance.' },
};

function simMerge(how: string): SimResult {
  const m = MERGES[how] ?? MERGES.inner;
  const res: Frame = { columns: ['magasin_id', 'ventes', 'ville'], index: m.rows.map((_, i) => i), rows: m.rows.map((x) => [...x]), dtypes: ['int64', m.ventesFloat ? 'float64' : 'int64', 'object'] };
  const keyset = new Set(m.rows.map((x) => x[0]));
  const colorSrc = (f: Frame, onlyColor: number, otherKeys: number[]) => f.rows.map((row) => (otherKeys.includes(row[0] as number) ? null : keyset.has(row[0] as number) ? onlyColor : null));
  const dim = (f: Frame) => f.rows.flatMap((row, i) => (keyset.has(row[0] as number) ? [`${i}:*`] : []));
  const nanCells = res.rows.flatMap((row, i) => row.flatMap((x, j) => (x === null ? [`${i}:${j}`] : [])));
  const line = `res = pd.merge(left=ventes, right=magasins, on="magasin_id"${how === 'inner' ? '' : `, how="${how}"`})`;
  const alerts: SimAlert[] = [];
  if (m.ventesFloat) alerts.push({ level: 'info', atStep: 1, title: 'int64 → float64', message: 'Un NaN est apparu dans `ventes` : pandas convertit toute la colonne en flottant (120 → 120.0).' });
  if (how === 'inner') alerts.push({ level: 'warning', atStep: 1, title: 'Lignes perdues', message: 'Le magasin 4 (ventes) et Berlin (magasins) ont disparu **sans avertissement**. Compare toujours `len()` avant / après une jointure.' });
  return {
    code: `ventes = pd.DataFrame({"magasin_id": [1, 2, 4], "ventes": [120, 80, 95]})
magasins = pd.DataFrame({"magasin_id": [1, 2, 3], "ville": ["Paris", "Lyon", "Berlin"]})

${line}
print(res)`,
    steps: [
      { label: 'Les deux tables', code: 'ventes, magasins', vars: [{ name: 'ventes', ref: 'L' }, { name: 'magasins', ref: 'R' }],
        heap: [frameObj('L', VENTES_M, { badges: ['left'] }), frameObj('R', MAGASINS, { badges: ['right'] })],
        note: 'Clé commune : `magasin_id`. Les clés 1 et 2 existent des deux côtés ; 4 seulement à gauche ; 3 seulement à droite.' },
      { label: `merge how="${how}"`, code: line, vars: [{ name: 'ventes', ref: 'L' }, { name: 'magasins', ref: 'R' }, { name: 'res', ref: 'res' }],
        heap: [
          frameObj('L', VENTES_M, { badges: ['left'], selected: dim(VENTES_M).length ? dim(VENTES_M) : ['-1:*'], rowColors: colorSrc(VENTES_M, LEFT_ONLY, [1, 2]) }),
          frameObj('R', MAGASINS, { badges: ['right'], selected: dim(MAGASINS).length ? dim(MAGASINS) : ['-1:*'], rowColors: colorSrc(MAGASINS, RIGHT_ONLY, [1, 2]) }),
          frameObj('res', res, { badges: ['nouvel objet'], rowColors: m.colors, changed: nanCells }),
        ],
        note: m.text },
    ],
    output: fmtFrame(res),
    alerts,
    verdict: 'Le type de jointure (`how`) décide **quelles lignes survivent** quand une clé n’a pas de correspondance.',
  };
}

// ------------------------------------------------------------------ concat
const D1: Frame = { columns: ['magasin_id', 'ventes'], index: [0, 1], rows: [[1, 120], [2, 80]], dtypes: ['int64', 'int64'] };
const D2: Frame = { columns: ['magasin_id', 'ventes', 'remise'], index: [0, 1], rows: [[3, 60, 0.1], [4, 95, 0.2]], dtypes: ['int64', 'int64', 'float64'] };

function simConcat(axis: string, ignore: boolean): SimResult {
  let res: Frame;
  let colors: (number | null)[];
  const alerts: SimAlert[] = [];
  let note: string;
  if (axis === '1') {
    res = { columns: ['magasin_id', 'ventes', 'magasin_id', 'ventes', 'remise'], index: [0, 1], rows: [[1, 120, 3, 60, 0.1], [2, 80, 4, 95, 0.2]], dtypes: ['int64', 'int64', 'int64', 'int64', 'float64'] };
    colors = [null, null];
    note = '`axis=1` : les tables sont **collées côte à côte**, alignées sur l’index (0 avec 0, 1 avec 1).';
    alerts.push({ level: 'warning', atStep: 1, title: 'Colonnes en double', message: '`magasin_id` et `ventes` apparaissent deux fois : `res["ventes"]` renverra alors un **DataFrame de 2 colonnes**. Pour associer sur une clé, utilise plutôt `pd.merge()`.' });
  } else {
    res = { columns: ['magasin_id', 'ventes', 'remise'], index: ignore ? [0, 1, 2, 3] : [0, 1, 0, 1], rows: [[1, 120, null], [2, 80, null], [3, 60, 0.1], [4, 95, 0.2]], dtypes: ['int64', 'int64', 'float64'] };
    colors = [0, 0, 2, 2];
    note = '`axis=0` : les lignes de `df2` sont **empilées sous** celles de `df1`. Toutes les colonnes sont conservées ; `remise` n’existe pas dans `df1` → NaN.';
    if (!ignore) alerts.push({ level: 'warning', atStep: 1, title: 'Index dupliqué : 0, 1, 0, 1', message: 'Chaque table garde son index d’origine. `res.loc[0]` renverrait **2 lignes** ! Ajoute `ignore_index=True` pour renuméroter 0…3.' });
    else alerts.push({ level: 'success', atStep: 1, title: 'Index réinitialisé', message: '`ignore_index=True` renumérote les lignes de 0 à 3.' });
  }
  const args = axis === '1' ? ', axis=1' : ignore ? ', ignore_index=True' : '';
  const line = `res = pd.concat([df1, df2]${args})`;
  const changed = res.rows.flatMap((row, i) => row.flatMap((x, j) => (x === null ? [`${i}:${j}`] : [])));
  return {
    code: `df1 = pd.DataFrame({"magasin_id": [1, 2], "ventes": [120, 80]})
df2 = pd.DataFrame({"magasin_id": [3, 4], "ventes": [60, 95], "remise": [0.1, 0.2]})

${line}
print(res)`,
    steps: [
      { label: 'Les deux tables', code: 'df1, df2', vars: [{ name: 'df1', ref: 'd1' }, { name: 'df2', ref: 'd2' }],
        heap: [frameObj('d1', D1, { rowColors: [0, 0] }), frameObj('d2', D2, { rowColors: [2, 2] })] },
      { label: `concat axis=${axis}`, code: line, vars: [{ name: 'df1', ref: 'd1' }, { name: 'df2', ref: 'd2' }, { name: 'res', ref: 'res' }],
        heap: [frameObj('d1', D1, { rowColors: [0, 0] }), frameObj('d2', D2, { rowColors: [2, 2] }), frameObj('res', res, { rowColors: colors, changed, badges: ['nouvel objet'] })],
        note },
    ],
    output: fmtFrame(res),
    alerts,
    verdict: axis === '1' ? '`concat(axis=1)` juxtapose par **index**, sans regarder les valeurs des colonnes.' : '`concat()` (axis=0) **empile** : idéal pour réunir des fichiers de même structure (ex. un CSV par mois).',
  };
}

export default defineFiche({
  id: 'pandas-combiner',
  title: 'Combiner des données : concat et merge',
  theme: 'pandas',
  tags: ['restructurer', 'manquantes'],
  keywords: ['merge', 'concat', 'jointure', 'combiner', 'pd.concat', 'pd.merge', 'axis', 'ignore_index', 'on', 'how', 'inner', 'left', 'right', 'outer', 'left_index', 'right_index', 'suffixes', '_x', '_y', 'join', 'empiler', 'index dupliqué'],
  summary: '**Empiler** des tables avec `pd.concat()` ou les **joindre** sur une clé avec `pd.merge()` — et choisir le bon type de jointure.',
  concept: `
- Le **concat vertical** (\`axis=0\`) empile les DataFrames les uns sous les autres. Par défaut, il **conserve toutes les colonnes** des deux DataFrames et remplit les valeurs manquantes avec NaN.
- Une jointure **inner** ne garde que les lignes dont la clé existe **dans les deux** DataFrames. Une jointure **left** garde **toutes les lignes du DataFrame de gauche**, même sans correspondance.
- \`pd.merge()\` peut joindre deux DataFrames sur une **colonne commune** avec \`on\`, ou sur leur **index** avec \`left_index=True\` et \`right_index=True\`.
`,
  useCase: 'Réunir des exports mensuels de même format (concat) ; enrichir une table de ventes avec les informations des magasins (merge).',
  syntax: `pd.concat([df1, df2])                       # combiner verticalement
pd.concat([df1, df2], axis=1)               # combiner horizontalement
pd.concat([df1, df2], ignore_index=True)    # réinitialiser l'index
pd.merge(left=df1, right=df2, on="col")     # joindre sur une colonne
how="left"                                  # type de jointure
left_index=True, right_index=True           # joindre sur l'index
suffixes=("_a", "_b")                       # suffixes des colonnes en double`,
  simulator: {
    title: 'Simulateur — pd.merge et le paramètre how',
    params: [
      { id: 'how', label: 'how', type: 'choice', default: 'inner', options: [
        { value: 'inner', label: '`"inner"` (défaut)' }, { value: 'left', label: '`"left"`' }, { value: 'right', label: '`"right"`' }, { value: 'outer', label: '`"outer"`' },
      ] },
    ],
    simulate: (p) => simMerge(String(p.how)),
  },
  simulators: [{
    title: 'Simulateur — pd.concat',
    params: [
      { id: 'axis', label: 'axis', type: 'choice', default: '0', options: [
        { value: '0', label: '`axis=0` (empiler)' }, { value: '1', label: '`axis=1` (côte à côte)' },
      ] },
      { id: 'ignore', label: 'ignore_index', type: 'toggle', default: false, onLabel: '`ignore_index=True`', offLabel: '`ignore_index=False`', showIf: { axis: '0' } },
    ],
    simulate: (p) => simConcat(String(p.axis), !!p.ignore),
  }],
  pitfalls: [
    '`pd.merge()` fait un **inner** par défaut : des lignes peuvent disparaître sans avertissement.',
    '`pd.concat()` sans `ignore_index=True` produit un **index dupliqué** (0, 1, 0, 1).',
    'Un NaN introduit par une jointure convertit une colonne d’entiers en **float**.',
    'Colonnes de même nom hors clé → suffixes `_x` / `_y` par défaut (personnalisables avec `suffixes`).',
  ],
  takeaways: [
    'concat = empiler / juxtaposer ; merge = associer sur une **clé**.',
    'inner = intersection, left = tout à gauche, right = tout à droite, outer = union.',
    'Vérifier `len(res)` après chaque jointure.',
  ],
  mentalModel: {
    title: 'La règle',
    code: `pd.concat([a, b])                 # EMPILER : b sous a (colonnes alignées par NOM)
pd.concat([a, b], axis=1)         # COLLER : b à droite de a (lignes alignées par INDEX)
pd.merge(a, b, on="id")           # JOINDRE : associer les lignes qui ont la même CLÉ
pd.merge(a, b, on="id", how="left")   # garder toutes les lignes de a`,
    note: '`concat` aligne sur des **étiquettes** (noms de colonnes ou index) ; `merge` aligne sur les **valeurs** d’une colonne clé.',
  },
  comparisons: [{
    title: 'concat ou merge ?',
    headers: ['', '`pd.concat`', '`pd.merge`'],
    rows: [
      ['Question posée', '« mettre ces tables bout à bout »', '« relier ces tables par une clé »'],
      ['Aligne sur', 'les noms de colonnes (axis=0) ou l’index (axis=1)', 'les **valeurs** de la colonne `on`'],
      ['Nombre de tables', 'une liste, autant qu’on veut', 'deux à la fois'],
      ['Colonne absente d’une table', 'remplie de **NaN**', '—'],
      ['Index du résultat', 'conservé tel quel → **doublons** (0, 1, 2, 0, 1, 2) sauf `ignore_index=True`', 'renuméroté 0, 1, 2…'],
      ['Clé en double', '—', 'chaque correspondance crée une ligne : le résultat peut **grossir**'],
      ['Colonne de même nom hors clé', 'fusionnée dans la même colonne', 'dédoublée en `_x` et `_y` (`suffixes=`)'],
    ],
    conclusion: 'Mêmes colonnes, nouvelles lignes → `concat`. Nouvelles colonnes venues d’une autre table → `merge`.',
  }, {
    title: 'Les quatre jointures (a.id = 1, 2, 3 ; b.id = 2, 3, 4)',
    headers: ['`how=`', 'Lignes gardées', 'id obtenus', 'NaN dans'],
    rows: [
      ['`"inner"` (défaut)', 'clés présentes **des deux côtés**', '2, 3', 'nulle part'],
      ['`"left"`', 'toutes celles de **a**', '1, 2, 3', 'colonnes de b (id 1)'],
      ['`"right"`', 'toutes celles de **b**', '2, 3, 4', 'colonnes de a (id 4)'],
      ['`"outer"`', 'l’**union**', '1, 2, 3, 4', 'des deux côtés'],
    ],
    conclusion: 'Ajouter `indicator=True` crée une colonne `_merge` (`left_only`, `both`, `right_only`) : le moyen le plus rapide de voir ce qui n’a pas trouvé de correspondance.',
  }],
  deepDives: [{
    title: 'Vérifier une jointure avant de lui faire confiance',
    body: `Une jointure ne prévient jamais quand elle perd ou multiplie des lignes. Trois contrôles suffisent :

- comparer \`len()\` avant et après : une jointure \`left\` qui **grossit** signale une clé en double à droite ;
- \`indicator=True\`, puis \`value_counts()\` sur \`_merge\` : combien de lignes n’ont pas trouvé de partenaire ;
- \`validate="one_to_one"\` ou \`"many_to_one"\` : pandas lève une erreur si la clé n’est pas unique là où elle devrait l’être.

Une colonne entière qui reçoit un NaN passe en \`float64\` : un identifiant \`4\` devient \`4.0\`.`,
    code: `m = pd.merge(ventes, magasins, on="id", how="left", indicator=True)
m["_merge"].value_counts()          # left_only = ventes sans magasin connu
pd.merge(ventes, magasins, on="id", validate="many_to_one")   # erreur si un magasin apparaît deux fois`,
  }],
  related: ['pandas-agregation', 'pandas-transformer'],
  source: 'DataXp — Nettoyage et Analyse de Données avec Python, chapitre 2 (sources/pandas/dataxp-combiner-donnees.pdf)',
});
