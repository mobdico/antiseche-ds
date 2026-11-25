import { defineFiche, type HeapObj, type SimAlert, type SimResult, type SimStep } from '../../engine/types';
import { list } from '../../engine/sim-helpers';
import { fmtFrame, fmtSeries, frameObj, seriesObj, type Frame, type Series } from '../_lib/pandas-sim';

// ------------------------------------------------------------------ 1. encodage
const TEXT = 'Café;12';
const BYTES: Record<string, number[]> = {
  'utf-8': [0x43, 0x61, 0x66, 0xc3, 0xa9, 0x3b, 0x31, 0x32],
  latin1: [0x43, 0x61, 0x66, 0xe9, 0x3b, 0x31, 0x32],
};
const hex = (b: number) => b.toString(16).padStart(2, '0');

function simEncodage(fileEnc: string, readEnc: string): SimResult {
  const bytes = BYTES[fileEnc] ?? BYTES['utf-8'];
  const accent = bytes.flatMap((b, i) => (b > 0x7f ? [i] : []));
  const bytesObj = list('bytes', bytes.map(hex), { pyType: 'bytes (fichier)', rawItems: true, changed: accent, note: `« ${TEXT} » encodé en ${fileEnc} : ${bytes.length} octets` });
  const line = `df = pd.read_csv("produits.csv", sep=";"${readEnc === 'utf-8' ? '' : ', encoding="latin1"'})`;
  const step1: SimStep = { label: 'Octets du fichier', code: `# produits.csv a été enregistré en ${fileEnc}`, vars: [{ name: 'fichier', ref: 'bytes' }], heap: [bytesObj],
    note: fileEnc === 'utf-8' ? 'En UTF-8, « é » occupe **2 octets** (c3 a9).' : 'En latin1, « é » occupe **1 octet** (e9).' };
  const code = `${line}\nprint(df)`;
  if (fileEnc === readEnc) {
    const f: Frame = { columns: ['produit', 'prix'], index: [0], rows: [['Café', 12]], dtypes: ['object', 'int64'] };
    return {
      code, steps: [step1, { label: 'Décoder', code: line, vars: [{ name: 'fichier', ref: 'bytes' }, { name: 'df', ref: 'df' }], heap: [bytesObj, frameObj('df', f)] }],
      output: fmtFrame(f),
      alerts: [{ level: 'success', atStep: 1, title: 'Bon encodage', message: 'Les octets sont décodés avec le même format que celui de l’écriture : « Café » est lu correctement.' }],
      verdict: 'Lire avec **l’encodage du fichier** : utf-8 par défaut, sinon `encoding="latin1"` ou `"windows-1252"`.',
    };
  }
  if (fileEnc === 'utf-8') {
    const f: Frame = { columns: ['produit', 'prix'], index: [0], rows: [['CafÃ©', 12]], dtypes: ['object', 'int64'] };
    return {
      code, steps: [step1, { label: 'Décoder', code: line, vars: [{ name: 'fichier', ref: 'bytes' }, { name: 'df', ref: 'df' }], heap: [bytesObj, frameObj('df', f, { changed: ['0:0'] })],
        note: 'latin1 lit **chaque octet comme un caractère** : c3 → « Ã », a9 → « © ».' }],
      output: fmtFrame(f),
      alerts: [{ level: 'warning', atStep: 1, title: 'Mojibake : « CafÃ© »', message: 'Aucune erreur, mais du texte corrompu. Des « Ã© », « Ã¨ » dans tes données = un fichier UTF-8 lu en latin1.' }],
      verdict: 'Un mauvais encodage peut corrompre le texte **en silence** : vérifie toujours `df.head()`.',
    };
  }
  return {
    code, steps: [step1, { label: 'Décoder', code: line, vars: [{ name: 'fichier', ref: 'bytes' }], heap: [bytesObj], note: 'L’octet e9 n’est pas une séquence UTF-8 valide : la lecture s’arrête.' }],
    output: ['Traceback (most recent call last):', '  ...', "UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 16: invalid continuation byte"],
    alerts: [{ level: 'error', atStep: 1, title: 'UnicodeDecodeError', message: 'Le fichier n’est pas en UTF-8 (l’encodage par défaut). Réessaie avec `encoding="latin1"` ou `encoding="windows-1252"`. La position et la fin du message varient selon la version de pandas.' }],
    verdict: '`UnicodeDecodeError` à la lecture → préciser le bon `encoding=`.',
  };
}

// ------------------------------------------------------------------ 2. noms de colonnes
const RAW_COLS = ['  Nom Produit', 'Prix Unitaire ', 'Stock'];

function simColonnes(strip: boolean, lower: boolean, replace: boolean): SimResult {
  let cols = [...RAW_COLS];
  const chain: string[] = [];
  if (strip) { cols = cols.map((c) => c.trim()); chain.push('.str.strip()'); }
  if (lower) { cols = cols.map((c) => c.toLowerCase()); chain.push('.str.lower()'); }
  if (replace) { cols = cols.map((c) => c.split(' ').join('_')); chain.push('.str.replace(" ", "_")'); }
  const line = chain.length ? `df.columns = df.columns${chain.join('')}` : '# aucune transformation';
  const clean = cols.every((c) => /^[a-z_]+$/.test(c) && !c.startsWith('_') && !c.endsWith('_'));
  const before = list('cols0', RAW_COLS, { pyType: 'Index' });
  const after = list('cols1', cols, { pyType: 'Index', changed: cols.flatMap((c, i) => (c !== RAW_COLS[i] ? [i] : [])) });
  const alerts: SimAlert[] = [];
  if (replace && !strip) alerts.push({ level: 'warning', atStep: 1, title: 'Espaces de bord transformés en _', message: 'Sans `strip()` d’abord, les espaces au début et à la fin deviennent `__nom_produit` et `prix_unitaire_`. L’ordre compte : **strip → lower → replace**.' });
  if (!strip && !replace) alerts.push({ level: 'info', atStep: 1, title: 'Espaces invisibles', message: '`df["Stock"]` fonctionne, mais `df["Prix Unitaire"]` lève `KeyError` à cause de l’espace final invisible.' });
  if (clean) alerts.push({ level: 'success', atStep: 1, title: 'Noms propres', message: 'Minuscules, sans espaces : `df.nom_produit` et `df["prix_unitaire"]` sont faciles à taper.' });
  return {
    code: `print(list(df.columns))\n${line}\nprint(list(df.columns))`,
    steps: [
      { label: 'Noms bruts', code: 'df.columns', vars: [{ name: 'df.columns', ref: 'cols0' }], heap: [before], note: 'Les espaces en début et en fin de nom sont invisibles à l’affichage, mais bien présents.' },
      { label: 'Nettoyer', code: line, vars: [{ name: 'df.columns', ref: 'cols1' }], heap: [after, { ...before, ghost: true }],
        note: 'Les méthodes `.str` s’appliquent à **tout l’Index** d’un coup, et le résultat est un nouvel Index affecté à `df.columns`.' },
    ],
    output: [`[${RAW_COLS.map((c) => `'${c}'`).join(', ')}]`, `[${cols.map((c) => `'${c}'`).join(', ')}]`],
    alerts,
    verdict: 'Normaliser les noms : `df.columns.str.strip().str.lower().str.replace(" ", "_")`.',
  };
}

// ------------------------------------------------------------------ 3. convertir le type
const PRIX: Series = { name: 'prix', index: [0, 1, 2, 3], values: ['12,50 €', '8 €', null, '15,00 €'], dtype: 'object' };
const CONV: Record<string, { code: string; error?: string; steps: { label: string; code: string; values: (string | number | null)[]; dtype: 'object' | 'float64' }[] }> = {
  direct: { code: 'df["prix"].astype(float)', error: "could not convert string to float: '12,50 €'", steps: [] },
  euro: { code: 'df["prix"].str.replace(" €", "").astype(float)', error: "could not convert string to float: '12,50'",
    steps: [{ label: 'Retirer €', code: '.str.replace(" €", "")', values: ['12,50', '8', null, '15,00'], dtype: 'object' }] },
  full: { code: 'df["prix"].str.replace(" €", "").str.replace(",", ".").astype(float)',
    steps: [
      { label: 'Retirer €', code: '.str.replace(" €", "")', values: ['12,50', '8', null, '15,00'], dtype: 'object' },
      { label: 'Virgule → point', code: '.str.replace(",", ".")', values: ['12.50', '8', null, '15.00'], dtype: 'object' },
      { label: 'astype(float)', code: '.astype(float)', values: [12.5, 8, null, 15], dtype: 'float64' },
    ] },
};

function simConversion(mode: string): SimResult {
  const c = CONV[mode] ?? CONV.full;
  const steps: SimStep[] = [{ label: 'Colonne brute', code: 'df["prix"]', vars: [{ name: 'prix', ref: 's0' }], heap: [seriesObj('s0', PRIX)],
    note: 'Des prix stockés en **texte** (dtype object) : impossible de calculer une moyenne en l’état.' }];
  c.steps.forEach((st, k) => steps.push({
    label: st.label, code: st.code, vars: [{ name: 'prix', ref: `s${k + 1}` }],
    heap: [seriesObj(`s${k + 1}`, { ...PRIX, values: st.values, dtype: st.dtype }, { changed: [0, 1, 3].map((i) => `${i}:0`), badges: ['nouvel objet'] })],
  }));
  if (c.error) {
    steps.push({ label: 'astype(float)', code: '.astype(float)', vars: steps[steps.length - 1].vars, heap: steps[steps.length - 1].heap, note: 'La conversion échoue sur la première valeur non numérique.' });
    return {
      code: `df["prix"] = ${c.code}`, steps,
      output: ['Traceback (most recent call last):', '  ...', `ValueError: ${c.error}`],
      alerts: [{ level: 'error', atStep: steps.length - 1, title: 'ValueError', message: mode === 'direct' ? 'Le symbole « € » et la virgule décimale empêchent la conversion.' : 'Python attend un **point** décimal : « 12,50 » n’est pas un nombre valide.' }],
      verdict: 'Nettoyer le texte **avant** `astype()` : retirer les symboles, remplacer la virgule par un point.',
    };
  }
  const final: Series = { ...PRIX, values: [12.5, 8, null, 15], dtype: 'float64' };
  return {
    code: `df["prix"] = ${c.code}\nprint(df["prix"])\nprint(df["prix"].mean())`, steps,
    output: [...fmtSeries(final), '11.833333333333334'],
    alerts: [{ level: 'success', atStep: steps.length - 1, title: 'Colonne numérique', message: 'dtype **float64** : la moyenne se calcule (le NaN est ignoré).' }],
    verdict: 'Chaîne de nettoyage : `str.replace()` → `str.replace()` → `astype(float)`.',
  };
}

// ------------------------------------------------------------------ 4. map avec un dictionnaire
function simMap(lower: boolean): SimResult {
  const raw: Series = { name: 'abonne', index: [0, 1, 2, 3], values: ['oui', 'non', 'Oui', 'non'], dtype: 'object' };
  const lowered: Series = { ...raw, values: ['oui', 'non', 'oui', 'non'] };
  const res: Series = lower ? { ...raw, values: [true, false, true, false], dtype: 'bool' } : { ...raw, values: [true, false, null, false], dtype: 'object' };
  const dict: HeapObj = { id: 'dico', pyType: 'dict', kind: 'box', fields: [{ label: "'oui'", slot: { v: true } }, { label: "'non'", slot: { v: false } }] };
  const steps: SimStep[] = [{ label: 'Colonne brute', code: 'df["abonne"]', vars: [{ name: 'abonne', ref: 'raw' }, { name: 'dico', ref: 'dico' }], heap: [seriesObj('raw', raw), dict] }];
  if (lower) steps.push({ label: 'str.lower()', code: '.str.lower()', vars: [{ name: 'abonne', ref: 'low' }, { name: 'dico', ref: 'dico' }], heap: [seriesObj('low', lowered, { changed: ['2:0'] }), dict] });
  steps.push({ label: 'map(dico)', code: lower ? 'df["abonne"].str.lower().map(dico)' : 'df["abonne"].map(dico)', vars: [{ name: 'res', ref: 'res' }, { name: 'dico', ref: 'dico' }],
    heap: [seriesObj('res', res, { changed: lower ? [] : ['2:0'] }), dict], note: 'Chaque valeur est cherchée comme **clé** du dictionnaire.' });
  return {
    code: `dico = {"oui": True, "non": False}\nres = df["abonne"]${lower ? '.str.lower()' : ''}.map(dico)\nprint(res)`,
    steps, output: fmtSeries(res),
    alerts: lower ? [{ level: 'success', atStep: steps.length - 1, title: 'Toutes les valeurs trouvées', message: 'En harmonisant la casse avant, « Oui » devient « oui » et trouve sa correspondance.' }]
      : [{ level: 'warning', atStep: steps.length - 1, title: '« Oui » → NaN', message: '« Oui » (majuscule) n’est pas une clé du dictionnaire : **toute valeur absente devient NaN**, sans erreur.' }],
    verdict: '`map(dict)` : une valeur hors du dictionnaire devient **NaN**. Harmoniser la casse avant.',
  };
}

export default defineFiche({
  id: 'nettoyage-pandas',
  title: 'Nettoyage de données avec pandas',
  theme: 'nettoyage',
  tags: ['texte', 'types', 'manquantes', 'dictionnaires'],
  keywords: ['encodage', 'colonnes', 'astype', 'map', 'str', 'dropna', 'types', 'read_csv', 'encoding', 'latin1', 'utf-8', 'windows-1252', 'UnicodeDecodeError', 'mojibake', 'Ã©', 'df.columns', 'str.strip', 'str.lower', 'str.replace',
    'astype', 'could not convert string to float', 'ValueError', 'map', 'dictionnaire', 'dropna', 'KeyError'],
  summary: 'Lire un fichier brut au bon **encodage**, normaliser les **noms de colonnes**, **convertir** du texte en nombres et **remplacer** des valeurs.',
  concept: `
- **L’encodage** : un fichier CSV doit être décodé avec le bon format (\`utf-8\`, \`latin1\`, \`windows-1252\`) pour que pandas lise correctement les caractères spéciaux.
- **Le nettoyage des noms de colonnes** : normaliser en minuscules, sans espaces ni caractères spéciaux avec \`str.strip()\`, \`str.replace()\` et \`str.lower()\`, rend les colonnes plus faciles à manipuler.
- **Les méthodes string vectorisées** : l’accesseur \`Series.str\` applique une méthode Python (\`replace()\`, \`split()\`) à toute une colonne en une seule ligne, sans boucle.
- **Le typage** : \`Series.astype()\` convertit une colonne d’un type à un autre, par exemple de \`object\` (texte) vers \`float\` ou \`int\`.
- **\`Series.map()\`** remplace chaque valeur d’une colonne par sa correspondance dans un dictionnaire. Toute valeur absente du dictionnaire devient **NaN**.
- **Les valeurs manquantes** : \`DataFrame.dropna()\` supprime les lignes (\`axis=0\`) ou les colonnes (\`axis=1\`) contenant au moins une valeur manquante.
`,
  useCase: 'Le premier quart d’heure sur un fichier brut : il ne s’ouvre pas, les colonnes ont des noms impossibles, les nombres sont du texte.',
  syntax: `pd.read_csv(fichier, encoding="latin1")   # lire avec un encodage précis
df.columns = nouvelles_colonnes          # renommer les colonnes
df["col"].str.replace("a", "b")          # méthode string sur toute une colonne
df["col"].astype(float)                  # convertir le type
df["col"].map(dictionnaire)              # remplacer avec un dictionnaire
df.dropna(axis=0)                        # supprimer les valeurs manquantes`,
  simulator: {
    title: 'Simulateur — encodage du fichier',
    params: [
      { id: 'file', label: 'Fichier enregistré en', type: 'choice', default: 'latin1', options: [{ value: 'utf-8', label: 'UTF-8' }, { value: 'latin1', label: 'latin1' }] },
      { id: 'read', label: 'Lu avec', type: 'choice', default: 'utf-8', options: [{ value: 'utf-8', label: 'défaut (utf-8)' }, { value: 'latin1', label: '`encoding="latin1"`' }] },
    ],
    simulate: (p) => simEncodage(String(p.file), String(p.read)),
  },
  simulators: [
    {
      title: 'Simulateur — nettoyer les noms de colonnes',
      params: [
        { id: 'strip', label: 'strip()', type: 'toggle', default: false, onLabel: '`.str.strip()`', offLabel: 'non' },
        { id: 'lower', label: 'lower()', type: 'toggle', default: true, onLabel: '`.str.lower()`', offLabel: 'non' },
        { id: 'replace', label: 'replace()', type: 'toggle', default: true, onLabel: '`.str.replace(" ", "_")`', offLabel: 'non' },
      ],
      simulate: (p) => simColonnes(!!p.strip, !!p.lower, !!p.replace),
    },
    {
      title: 'Simulateur — convertir du texte en nombres',
      params: [{ id: 'mode', label: 'Instruction', type: 'choice', default: 'direct', options: [
        { value: 'direct', label: '`astype(float)` direct' },
        { value: 'euro', label: 'retirer « € » puis `astype`' },
        { value: 'full', label: 'retirer « € », `,` → `.`, puis `astype`' },
      ] }],
      simulate: (p) => simConversion(String(p.mode)),
    },
    {
      title: 'Simulateur — remplacer avec map(dictionnaire)',
      params: [{ id: 'lower', label: 'Harmoniser la casse avant', type: 'toggle', default: false, onLabel: '`.str.lower().map(dico)`', offLabel: '`.map(dico)`' }],
      simulate: (p) => simMap(!!p.lower),
    },
  ],
  pitfalls: [
    '`UnicodeDecodeError` → le fichier n’est pas en UTF-8 : essayer `encoding="latin1"` ou `"windows-1252"`.',
    '« CafÃ© » dans les données = fichier UTF-8 lu en latin1 (pas d’erreur, mais du texte corrompu).',
    'Un espace invisible en fin de nom de colonne provoque un `KeyError`.',
    '`astype(float)` échoue tant qu’il reste un symbole (€, %, espace) ou une virgule décimale.',
    '`map(dict)` transforme en NaN toute valeur absente du dictionnaire, y compris une simple différence de casse.',
  ],
  takeaways: [
    'Bon encodage à la lecture, puis vérifier `df.head()`.',
    'Colonnes : strip → lower → replace.',
    'Texte → nombre : nettoyer avec `.str`, puis `astype()`.',
  ],
  related: ['nettoyage-valeurs-manquantes', 'nettoyage-chaines', 'pandas-transformer'],
  source: 'DataXp — Introduction à NumPy et Pandas, chapitre 6 (sources/nettoyage/dataxp-nettoyage-donnees-pandas.pdf)',
});
