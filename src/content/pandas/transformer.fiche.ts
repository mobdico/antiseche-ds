import { defineFiche, type HeapObj, type SimAlert, type SimResult, type SimStep } from '../../engine/types';
import { fmtFrame, fmtSeries, frameObj, seriesObj, type Frame, type Series } from '../_lib/pandas-sim';

const NOTES: Frame = {
  columns: ['eleve', 'maths', 'physique'], index: [0, 1, 2],
  rows: [['Ana', 12, 15], ['Bob', 8, 13], ['Chloé', 17, 9]], dtypes: ['object', 'int64', 'int64'],
};
const NOTES_CODE = `notes = pd.DataFrame({
    "eleve":    ["Ana", "Bob", "Chloé"],
    "maths":    [12, 8, 17],
    "physique": [15, 13, 9],
})`;

const FUNCS: Record<string, string> = {
  sur100: 'def sur_100(note):\n    return note * 5',
  bonus: 'def bonus(note, x):\n    return min(note + x, 20)',
  ecart: 'def ecart(serie):\n    return serie.max() - serie.min()',
};

function sim(mode: string, axis: string, version: string): SimResult {
  const df: Frame = { ...NOTES, rows: NOTES.rows.map((r) => [...r]) };
  const s = (name: string | null, index: (string | number)[], values: (number | null)[]): Series => ({ name, index, values, dtype: 'int64' });
  const step1: SimStep = { label: 'notes', code: 'notes = pd.DataFrame({...})', vars: [{ name: 'notes', ref: 'notes' }], heap: [frameObj('notes', df)] };
  let fn = '';
  let line = '';
  let result: HeapObj | null = null;
  let output: string[] = [];
  let selected: string[] = [];
  let rowColors: (number | null)[] | undefined;
  const alerts: SimAlert[] = [];
  let note = '';
  let verdict = '';

  switch (mode) {
    case 'applykw': {
      fn = FUNCS.bonus; line = 'res = notes["maths"].apply(bonus, x=2)';
      const x = s('maths', [0, 1, 2], [14, 10, 19]);
      result = seriesObj('res', x); output = fmtSeries(x); selected = ['*:1'];
      note = 'Chaque note est passée à `bonus(note, x=2)` : 12 → 14, 8 → 10, 17 → 19 (plafonné à 20).';
      verdict = '`apply()` transmet les **arguments supplémentaires** (`x=2`) à la fonction.';
      break;
    }
    case 'mapkw': {
      fn = FUNCS.bonus; line = 'res = notes["maths"].map(bonus, x=2)'; selected = ['*:1'];
      if (version === 'p2') {
        output = ['Traceback (most recent call last):', '  ...', "TypeError: Series.map() got an unexpected keyword argument 'x'"];
        alerts.push({ level: 'error', atStep: 1, title: 'TypeError (pandas 2.x)', message: 'En pandas 1.x/2.x, `Series.map()` **n’accepte pas** d’arguments supplémentaires : c’est la différence clé avec `apply()`.' });
        note = 'L’appel échoue : `res` n’est jamais créé.';
        verdict = 'pandas 2.x : pour passer un argument, utilise `apply(fonction, x=valeur)`.';
      } else {
        const x = s('maths', [0, 1, 2], [14, 10, 19]);
        result = seriesObj('res', x); output = fmtSeries(x);
        alerts.push({ level: 'info', atStep: 1, title: 'Nouveauté pandas ≥ 3.0', message: '`Series.map()` accepte désormais les arguments supplémentaires (`**kwargs`), comme `apply()`. Ta fiche décrit le comportement de pandas 2.x.' });
        note = 'Même résultat qu’avec `apply(bonus, x=2)`.';
        verdict = 'pandas ≥ 3.0 : `map()` et `apply()` acceptent tous deux des arguments supplémentaires.';
      }
      break;
    }
    case 'dfmap': {
      fn = FUNCS.sur100; line = 'res = notes[["maths", "physique"]].map(sur_100)';
      const x: Frame = { columns: ['maths', 'physique'], index: [0, 1, 2], rows: [[60, 75], [40, 65], [85, 45]], dtypes: ['int64', 'int64'] };
      result = frameObj('res', x); output = fmtFrame(x); selected = ['*:1', '*:2'];
      note = '`DataFrame.map()` appelle `sur_100` **une fois par cellule** (6 appels), sur toutes les colonnes choisies.';
      verdict = '`DataFrame.map()` : élément par élément, sur **plusieurs colonnes** à la fois.';
      alerts.push({ level: 'info', atStep: 1, title: 'Ancien nom : applymap()', message: '`DataFrame.map()` s’appelait `applymap()` avant pandas 2.1 : obsolète depuis 2.1 (`FutureWarning`), **supprimé en pandas 3.0**.' });
      break;
    }
    case 'dfapply': {
      fn = FUNCS.ecart;
      line = `res = notes[["maths", "physique"]].apply(ecart${axis === '1' ? ', axis=1' : ''})`;
      if (axis === '1') {
        const x = s(null, [0, 1, 2], [3, 5, 8]);
        result = seriesObj('res', x); output = fmtSeries(x); rowColors = [0, 2, 3]; selected = ['*:1', '*:2'];
        note = '`axis=1` : `ecart` reçoit **une ligne entière** (les notes d’un élève) → un écart par élève.';
        verdict = '`axis=1` → la fonction est appliquée **ligne par ligne**.';
      } else {
        const x = s(null, ['maths', 'physique'], [9, 6]);
        result = seriesObj('res', x); output = fmtSeries(x); selected = ['*:1', '*:2'];
        note = '`axis=0` (défaut) : `ecart` reçoit **une colonne entière** à la fois (2 appels) → un écart par matière : 17 − 8 = 9, 15 − 9 = 6.';
        verdict = '`axis=0` (défaut) → la fonction est appliquée **colonne par colonne**.';
      }
      break;
    }
    case 'melt': {
      line = 'res = pd.melt(notes, id_vars=["eleve"], value_vars=["maths", "physique"])';
      const x: Frame = {
        columns: ['eleve', 'variable', 'value'], index: [0, 1, 2, 3, 4, 5],
        rows: [['Ana', 'maths', 12], ['Bob', 'maths', 8], ['Chloé', 'maths', 17], ['Ana', 'physique', 15], ['Bob', 'physique', 13], ['Chloé', 'physique', 9]],
        dtypes: ['object', 'object', 'int64'],
      };
      result = frameObj('res', x, { rowColors: [0, 0, 0, 2, 2, 2] }); output = fmtFrame(x); selected = ['*:1', '*:2'];
      note = 'Format **large** (une colonne par matière) → format **long / tidy** : une ligne par (élève, matière). `id_vars` est répété, les `value_vars` passent dans `variable` / `value`.';
      verdict = '`pd.melt()` : 3 lignes × 2 matières → **6 lignes**, plus faciles à grouper ou à tracer.';
      break;
    }
    default: {
      fn = FUNCS.sur100; line = 'res = notes["maths"].map(sur_100)';
      const x = s('maths', [0, 1, 2], [60, 40, 85]);
      result = seriesObj('res', x); output = fmtSeries(x); selected = ['*:1'];
      note = '`sur_100` est appelée **une fois par élément** de la colonne : 12 → 60, 8 → 40, 17 → 85.';
      verdict = '`Series.map(fonction)` : transformation **élément par élément**, sans boucle.';
    }
  }

  const steps: SimStep[] = [step1, {
    label: 'Transformer', code: line,
    vars: result ? [{ name: 'notes', ref: 'notes' }, { name: 'res', ref: 'res' }] : [{ name: 'notes', ref: 'notes' }],
    heap: [frameObj('notes', df, { selected, rowColors }), ...(result ? [{ ...result, badges: ['nouvel objet'] }] : [])],
    note,
  }];
  return {
    code: `${NOTES_CODE}\n\n${fn ? fn + '\n\n' : ''}${line}\nprint(res)`,
    steps, output, alerts,
    verdict: `${verdict} \`notes\` n’est pas modifié.`,
  };
}

export default defineFiche({
  id: 'pandas-transformer',
  title: 'Transformer des données : map, apply et melt',
  theme: 'pandas',
  tags: ['map', 'apply', 'melt', 'tidy', 'axis', 'transformation'],
  keywords: ['Series.map', 'Series.apply', 'DataFrame.map', 'DataFrame.apply', 'applymap', 'axis=0', 'axis=1', 'pd.melt', 'id_vars', 'value_vars', 'format long', 'format large', 'kwargs', "unexpected keyword argument"],
  summary: 'Appliquer une fonction **élément par élément** (`map`, `apply`), **le long d’un axe** (`DataFrame.apply`), ou restructurer en format tidy (`melt`).',
  concept: `
- \`Series.map()\` et \`Series.apply()\` appliquent une fonction **élément par élément** à une colonne, mais seule \`apply()\` peut transmettre des **arguments supplémentaires** à la fonction. ⚠️ *Mise à jour pandas ≥ 3.0 : \`map()\` les accepte aussi.*
- \`DataFrame.map()\` applique une fonction élément par élément à **plusieurs colonnes** à la fois, alors que \`DataFrame.apply()\` applique une fonction **le long d’un axe** : une colonne (ou une ligne) entière à la fois.
- Le **format tidy**, obtenu avec \`pd.melt()\`, regroupe plusieurs colonnes dans une seule colonne \`variable\` et une seule colonne \`value\`, ce qui facilite l’agrégation et la visualisation.
`,
  useCase: 'Convertir des unités, catégoriser des valeurs, calculer un indicateur par ligne ou par colonne, préparer des données pour Seaborn.',
  syntax: `colonne.map(fonction)                  # élément par élément
colonne.apply(fonction, x=valeur)      # avec un argument
df[colonnes].map(fonction)             # plusieurs colonnes, élément par élément
df.apply(fonction)                     # le long d'un axe (colonne par colonne)
df.apply(fonction, axis=1)             # ligne par ligne
pd.melt(df, id_vars=..., value_vars=...)   # format tidy`,
  simulator: {
    title: 'Simulateur — map, apply, melt',
    params: [
      { id: 'mode', label: 'Méthode', type: 'choice', default: 'map', options: [
        { value: 'map', label: '`Series.map(f)`' },
        { value: 'applykw', label: '`Series.apply(f, x=2)`' },
        { value: 'mapkw', label: '`Series.map(f, x=2)`' },
        { value: 'dfmap', label: '`DataFrame.map(f)`' },
        { value: 'dfapply', label: '`DataFrame.apply(f)`' },
        { value: 'melt', label: '`pd.melt()`' },
      ] },
      { id: 'axis', label: 'axis', type: 'choice', default: '0', showIf: { mode: 'dfapply' }, options: [
        { value: '0', label: '`axis=0` (colonnes)' }, { value: '1', label: '`axis=1` (lignes)' },
      ] },
      { id: 'version', label: 'Version de pandas', type: 'choice', default: 'p2', showIf: { mode: 'mapkw' }, options: [
        { value: 'p2', label: 'pandas 2.x' }, { value: 'p3', label: 'pandas ≥ 3.0' },
      ] },
    ],
    simulate: (p) => sim(String(p.mode), String(p.axis), String(p.version)),
  },
  pitfalls: [
    '`df.apply(f)` travaille **colonne par colonne** par défaut (`axis=0`) ; pour une ligne entière : `axis=1`.',
    '`Series.map(f, x=2)` → `TypeError` en pandas 2.x : utiliser `apply`.',
    '`applymap()` : obsolète en pandas 2.1+, **supprimé en 3.0** → utiliser `DataFrame.map()`.',
    'Ces méthodes renvoient un **nouvel objet** : il faut le réaffecter (`df["col"] = df["col"].map(f)`).',
  ],
  takeaways: [
    'map = élément par élément ; DataFrame.apply = colonne (ou ligne) entière.',
    '`axis=0` → par colonne, `axis=1` → par ligne.',
    '`melt` : large → long (tidy).',
  ],
  related: ['pandas-combiner', 'pandas-agregation'],
  source: 'DataXp — Nettoyage et Analyse de Données avec Python, chapitre 3 (sources/pandas/dataxp-transformer-donnees-pandas.pdf)',
});
