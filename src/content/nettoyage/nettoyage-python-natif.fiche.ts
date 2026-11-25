import { defineFiche, type HeapObj, type SimAlert, type SimResult, type SimStep } from '../../engine/types';
import { list, r, scalar } from '../../engine/sim-helpers';

// ------------------------------------------------------------------ 1. fonction de nettoyage de dates
const VERSIONS: Record<string, string> = {
  v1: `def nettoyer_date(date):
    return int(date)`,
  v2: `def nettoyer_date(date):
    if "-" in date:
        debut, fin = date.split("-")
        return round((int(debut) + int(fin)) / 2)
    return int(date)`,
  v3: `def nettoyer_date(date):
    if date != "":
        if "-" in date:
            debut, fin = date.split("-")
            return round((int(debut) + int(fin)) / 2)
        return int(date)
    return None`,
  v4: `def nettoyer_date(date):
    date = date.replace("(", "").replace(")", "")
    if date != "":
        if "-" in date:
            debut, fin = date.split("-")
            return round((int(debut) + int(fin)) / 2)
        return int(date)
    return None`,
};

function simDate(value: string, version: string): SimResult {
  const lvl = Number(version.slice(1)) || 1;
  const steps: SimStep[] = [{ label: 'Entrée', code: `date = "${value}"`, vars: [{ name: 'date', ref: 'd' }], heap: [scalar('d', value)] }];
  let d = value;
  if (lvl >= 4 && /[()]/.test(d)) {
    d = d.replace(/[()]/g, '');
    steps.push({ label: 'replace', code: 'date = date.replace("(", "").replace(")", "")', vars: [{ name: 'date', ref: 'd2' }], heap: [scalar('d2', d), scalar('d', value, { ghost: true })],
      note: '`replace()` remplace **toutes** les occurrences, et renvoie une **nouvelle** chaîne (les str sont immuables).' });
  }
  const fail = (bad: string, why: string): SimResult => ({
    code: `${VERSIONS[version] ?? VERSIONS.v1}\n\nprint(nettoyer_date("${value}"))`,
    steps: [...steps, { label: 'int()', code: `int("${bad}")`, vars: steps[steps.length - 1].vars, heap: steps[steps.length - 1].heap, note: why }],
    output: ['Traceback (most recent call last):', '  ...', `ValueError: invalid literal for int() with base 10: '${bad}'`],
    alerts: [{ level: 'error', atStep: steps.length, title: 'ValueError', message: why }],
    verdict: 'Une fonction de nettoyage doit prévoir **chaque forme** de valeur présente dans les données.',
  });
  if (d === '' && lvl < 3) return fail('', '`int("")` : une chaîne **vide** n’est pas un nombre. Il faut la tester avant (`if date != ""`).');
  let result: number | null;
  const alerts: SimAlert[] = [];
  if (d === '') {
    result = null;
    steps.push({ label: 'Valeur vide', code: 'return None', vars: [{ name: 'res', ref: 'res' }], heap: [scalar('res', null)], note: 'La valeur manquante est conservée comme **None** au lieu de faire planter la fonction.' });
  } else if (d.includes('-')) {
    if (lvl < 2) return fail(d, '`int()` ne sait pas lire une **plage** « début-fin ». Il faut d’abord la détecter avec `"-" in date`.');
    const [a, b] = d.split('-');
    steps.push({ label: 'split', code: 'debut, fin = date.split("-")', vars: [{ name: 'date', ref: 'dd' }, { name: 'parts', ref: 'parts' }], heap: [scalar('dd', d), list('parts', [a, b])],
      note: '`split("-")` découpe la chaîne en une **liste** ; on la dépaquette en deux variables.' });
    const mean = (Number(a) + Number(b)) / 2;
    result = Math.abs(mean % 1) === 0.5 ? (Math.floor(mean) % 2 === 0 ? Math.floor(mean) : Math.ceil(mean)) : Math.round(mean);
    if (Math.abs(mean % 1) === 0.5) alerts.push({ level: 'info', atStep: steps.length, title: `round(${mean}) = ${result}`, message: 'Python arrondit les « ,5 » vers l’entier **pair** le plus proche (arrondi bancaire) : `round(1930.5)` → 1930, `round(1931.5)` → 1932.' });
    steps.push({ label: 'Moyenne', code: `round((${a} + ${b}) / 2)`, vars: [{ name: 'res', ref: 'res' }], heap: [scalar('res', result)] });
  } else {
    if (!/^\d+$/.test(d)) return fail(d, `\`int("${d}")\` : les parenthèses ne sont pas des chiffres. Il faut les retirer avec \`replace()\` avant la conversion.`);
    result = Number(d);
    steps.push({ label: 'int()', code: `int("${d}")`, vars: [{ name: 'res', ref: 'res' }], heap: [scalar('res', result)], note: 'La chaîne devient un **entier** : on peut maintenant calculer avec.' });
  }
  return {
    code: `${VERSIONS[version] ?? VERSIONS.v1}\n\nprint(nettoyer_date("${value}"))`,
    steps, output: [result === null ? 'None' : String(result)], alerts,
    verdict: `« ${value} » → \`${result === null ? 'None' : result}\`.`,
  };
}

// ------------------------------------------------------------------ 2. liste de listes
const ROWS = [['Titre', 'Artiste', 'Date'], ['Dog', 'Ana', '1931'], ['Sun', 'Bob', '1931-1935']];
const MOMA_CODE = `moma = [
    ["Titre", "Artiste", "Date"],
    ["Dog", "Ana", "1931"],
    ["Sun", "Bob", "1931-1935"],
]`;

function heapMoma(rows: (string | number)[][], extra: Record<number, Partial<HeapObj>> = {}): HeapObj[] {
  return [list('moma', rows.map((_, i) => r(`row${i}`)), { note: 'liste externe : une référence par ligne' }), ...rows.map((row, i) => list(`row${i}`, row, extra[i] ?? {}))];
}

function simListes(op: string): SimResult {
  const base: SimStep = { label: 'moma', code: 'moma = [[...], [...], [...]]', vars: [{ name: 'moma', ref: 'moma' }], heap: heapMoma(ROWS),
    note: 'Une **liste de listes** : la liste externe contient des **références** vers 3 listes internes (une par ligne, en-tête compris).' };
  switch (op) {
    case 'len':
      return { code: `${MOMA_CODE}\nprint(len(moma))`, steps: [base, { label: 'len', code: 'len(moma)', vars: base.vars, heap: heapMoma(ROWS, { 0: { badges: ['en-tête'] } }) }],
        output: ['3'], alerts: [{ level: 'warning', atStep: 1, title: 'L’en-tête est compté', message: '`len(moma)` = 3, mais il n’y a que **2 œuvres** : la première ligne contient les noms de colonnes.' }],
        verdict: '`len()` compte les éléments de la liste externe, donc **toutes** les lignes.' };
    case 'len1':
      return { code: `${MOMA_CODE}\nprint(len(moma[1:]))`, steps: [base, { label: 'moma[1:]', code: 'donnees = moma[1:]', vars: [{ name: 'moma', ref: 'moma' }, { name: 'donnees', ref: 'data' }],
        heap: [...heapMoma(ROWS), list('data', [r('row1'), r('row2')], { badges: ['nouvelle liste'] })],
        note: 'Le slicing crée une **nouvelle liste externe**, mais elle pointe vers les **mêmes** listes internes (copie superficielle).' }],
        output: ['2'], verdict: '`moma[1:]` saute l’en-tête : 2 lignes de données.' };
    case 'acces':
      return { code: `${MOMA_CODE}\nprint(moma[2][2])`, steps: [base, { label: 'moma[2][2]', code: 'moma[2][2]', vars: base.vars, heap: heapMoma(ROWS, { 2: { changed: [2] } }) }],
        output: ['1931-1935'], verdict: '`moma[ligne][colonne]` : le premier indice choisit la ligne, le second la valeur.' };
    default: {
      const cleaned = ROWS.map((row, i) => (i === 0 ? row : [row[0], row[1], i === 1 ? 1931 : 1933]));
      return {
        code: `${MOMA_CODE}\n\n# nettoyer_date() : la fonction du simulateur précédent (version 4)\nfor ligne in moma[1:]:\n    ligne[2] = nettoyer_date(ligne[2])\nprint(moma)`,
        steps: [base, { label: 'Boucle', code: 'for ligne in moma[1:]:\n    ligne[2] = nettoyer_date(ligne[2])', vars: [{ name: 'moma', ref: 'moma' }, { name: 'ligne', ref: 'row2' }],
          heap: heapMoma(cleaned, { 1: { changed: [2] }, 2: { changed: [2] } }),
          note: '`ligne` est un **alias** de chaque liste interne : modifier `ligne[2]` modifie directement `moma`. Les dates deviennent des entiers.' }],
        output: ["[['Titre', 'Artiste', 'Date'], ['Dog', 'Ana', 1931], ['Sun', 'Bob', 1933]]"],
        alerts: [{ level: 'info', atStep: 1, title: 'Modification sur place', message: 'Même en parcourant `moma[1:]` (une copie de la liste externe), les listes internes sont **partagées** : `moma` est bien modifié.' }],
        verdict: 'Une boucle `for` sur une liste de listes permet de nettoyer une colonne entière, ligne par ligne.',
      };
    }
  }
}

export default defineFiche({
  id: 'nettoyage-python-natif',
  title: 'Nettoyage et préparation des données en Python',
  theme: 'nettoyage',
  tags: ['python natif', 'liste de listes', 'chaînes', 'fonctions', 'ValueError'],
  keywords: ['len', 'open', 'csv', 'with open', 'replace', 'title', 'split', 'in', 'int', 'round', 'arrondi bancaire', 'invalid literal for int() with base 10', 'ValueError', 'MoMA', 'chaîne vide', 'None'],
  summary: 'Nettoyer un dataset **sans pandas** : liste de listes, méthodes de chaînes (`replace`, `title`, `split`) et fonctions robustes aux valeurs inattendues.',
  concept: `
- Une **liste de listes** représente un tableau de données : chaque ligne du dataset est une liste, et toutes les lignes sont regroupées dans une liste externe.
- \`len()\` compte le nombre d’éléments d’une liste, ce qui permet de connaître le nombre de lignes d’un dataset.
- \`str.replace(old, new)\` remplace **toutes** les occurrences de \`old\` par \`new\` dans une chaîne, pas seulement la première.
- \`str.title()\` met en majuscule la première lettre de chaque mot d’une chaîne, ce qui uniformise la casse.
- Une fonction peut échouer si elle reçoit une valeur inattendue, comme une **chaîne vide** passée à \`int()\`, ce qui provoque une \`ValueError\`.
- L’opérateur **\`in\`** permet de vérifier si une sous-chaîne est présente dans une chaîne, par exemple pour détecter une plage d’années grâce au caractère \`-\`.
- \`str.split(sep)\` découpe une chaîne en une **liste** de sous-chaînes à partir d’un séparateur.
`,
  useCase: 'Préparer un CSV (ici les œuvres du MoMA) avec le Python de base : uniformiser les noms, convertir des dates écrites de plusieurs façons.',
  syntax: `len(moma)                         # nombre de lignes
with open("fichier.csv") as f: ...  # lire un fichier
chaine.replace(old, new)          # remplacer une sous-chaîne
chaine.title()                    # casse Titre
if valeur != "": ...              # se protéger des valeurs vides
int(chaine)                       # convertir en entier
"-" in chaine                     # présence d'une sous-chaîne
chaine.split("-")                 # diviser une chaîne
round((int(a) + int(b)) / 2)      # moyenne d'une plage d'années`,
  simulator: {
    title: 'Simulateur — une fonction de nettoyage robuste',
    params: [
      { id: 'value', label: 'Valeur reçue', type: 'choice', default: '1931-1935', options: [
        { value: '1931', label: '`"1931"`' }, { value: '1931-1935', label: '`"1931-1935"`' }, { value: '1930-1931', label: '`"1930-1931"`' },
        { value: '', label: '`""` (vide)' }, { value: '(1940)', label: '`"(1940)"`' },
      ] },
      { id: 'version', label: 'Version de la fonction', type: 'choice', default: 'v1', options: [
        { value: 'v1', label: '1 · `int(date)`' }, { value: 'v2', label: '2 · + plages `-`' }, { value: 'v3', label: '3 · + valeur vide' }, { value: 'v4', label: '4 · + parenthèses' },
      ] },
    ],
    simulate: (p) => simDate(String(p.value), String(p.version)),
  },
  simulators: [{
    title: 'Simulateur — une liste de listes en mémoire',
    params: [{ id: 'op', label: 'Opération', type: 'choice', default: 'len', options: [
      { value: 'len', label: '`len(moma)`' }, { value: 'len1', label: '`len(moma[1:])`' }, { value: 'acces', label: '`moma[2][2]`' }, { value: 'boucle', label: 'boucle de nettoyage' },
    ] }],
    simulate: (p) => simListes(String(p.op)),
  }],
  pitfalls: [
    '`len(dataset)` compte aussi la ligne d’en-tête : utiliser `dataset[1:]`.',
    '`int("")` et `int("1931-1935")` lèvent `ValueError: invalid literal for int() with base 10`.',
    '`round()` arrondit les ,5 vers le **pair** : `round(1930.5)` vaut 1930.',
    '`chaine.replace()` ne modifie pas la chaîne : elle en renvoie une **nouvelle**, à réaffecter.',
  ],
  takeaways: [
    'Dataset = liste de listes ; en-tête = `data[0]`, données = `data[1:]`.',
    'Tester les cas particuliers (`""`, `-`, parenthèses) **avant** `int()`.',
    '`split()` → liste ; `in` → test de présence.',
  ],
  related: ['nettoyage-pandas', 'nettoyage-chaines'],
  source: 'DataXp — Manipuler et analyser des données en Python, chapitre 1 (sources/nettoyage/dataxp-nettoyage-et-preparation-des-donnees-en-python.pdf)',
});
