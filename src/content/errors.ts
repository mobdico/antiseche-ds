/**
 * Page « Messages d'erreur ». Le MESSAGE affiché vient d'une exécution réelle
 * (scripts/errors/ → src/content/_data/errors.json) ; ce fichier n'apporte que l'explication.
 * Clé = même clé que dans scripts/errors/scenarios.py (vérifié par les tests).
 */
import data from './_data/errors.json';
import { normalize } from '../engine/search';

export type ErrorCategory = 'python' | 'pandas' | 'numpy';

export interface ErrorExplain {
  category: ErrorCategory;
  /** ce qu'on voulait faire, en une ligne */
  title: string;
  /** code montré à l'écran (sinon : le code exécuté) */
  shown?: string;
  /** pourquoi ça casse (markdown léger) */
  cause: string;
  /** la correction, en code commenté */
  fix: string;
  fiches: string[];
  keywords?: string[];
}

export const EXPLAIN: Record<string, ErrorExplain> = {
  // ------------------------------------------------------------------ Python
  'name-error': {
    category: 'python', title: 'Utiliser une variable qui n’existe pas (encore)',
    cause: 'Le nom n’a jamais été créé : faute de frappe (Python distingue majuscules et minuscules), variable définie dans une fonction, ou **cellule de notebook pas encore exécutée**.',
    fix: `total = 0          # créer la variable avant de l’utiliser
print(total)
# notebook : « Exécuter tout » pour relancer les cellules dans l’ordre`,
    fiches: ['python-variables', 'python-scopes'],
  },
  'not-callable': {
    category: 'python', title: 'Appeler sum() après avoir écrasé son nom',
    cause: '`sum = 0` a remplacé la fonction native par un entier. Ensuite `sum(...)` essaie d’« appeler » le nombre 0. Même piège avec `list`, `max`, `min`, `str`, `type`…',
    fix: `total = 0               # ne jamais nommer une variable comme une fonction native
del sum                 # notebook : supprimer le nom pour retrouver la fonction
sum([1, 2, 3])          # 6`,
    fiches: ['python-fonctions', 'python-fonctions-natives'], keywords: ['callable'],
  },
  'concat-str-int': {
    category: 'python', title: 'Coller un texte et un nombre avec +',
    cause: '`+` entre deux `str` les colle ; entre un `str` et un `int`, Python refuse de deviner ce que tu veux.',
    fix: `"Âge : " + str(25)       # convertir explicitement
f"Âge : {25}"            # ou une f-string : le plus lisible`,
    fiches: ['python-types'],
  },
  'unsupported-operand': {
    category: 'python', title: 'Additionner un nombre et un nombre écrit en texte',
    cause: '`"5"` est un texte, pas un nombre. Très fréquent après une lecture de fichier ou un `input()`.',
    fix: `10 + int("5")      # 15
10 + float("5")    # 15.0`,
    fiches: ['python-types'],
  },
  'list-index': {
    category: 'python', title: 'Lire une position au-delà de la fin d’une liste',
    cause: 'Les positions commencent à **0** : une liste de 3 éléments a les positions 0, 1 et 2. `notes[3]` n’existe pas.',
    fix: `notes[2]          # le dernier, par sa position
notes[-1]         # le dernier, quelle que soit la longueur
len(notes)        # 3 → positions 0 à 2`,
    fiches: ['python-listes'],
  },
  'dict-key': {
    category: 'python', title: 'Lire une clé absente d’un dictionnaire',
    cause: '`d[clé]` exige que la clé existe. Le message affiche la clé cherchée.',
    fix: `d.get("Lyon", 0)        # valeur par défaut si la clé manque
if "Lyon" in d: ...     # tester avant de lire`,
    fiches: ['python-dictionnaires'],
  },
  'invalid-literal': {
    category: 'python', title: 'Convertir en nombre un texte qui n’en est pas un',
    cause: '`int()` n’accepte que des chiffres. Ici la virgule décimale « à la française » bloque, comme le ferait une espace ou un symbole €.',
    fix: `float("12,5".replace(",", "."))     # 12.5
int(float("12.0"))                  # passer par float pour un nombre à virgule`,
    fiches: ['python-types', 'nettoyage-chaines'],
  },
  'nonetype-attr': {
    category: 'python', title: 'Réutiliser le résultat de .sort() (ou d’une méthode « en place »)',
    cause: '`liste.sort()` trie **sur place** et renvoie `None`. `notes = notes.sort()` remplace donc la liste par `None`. Même piège avec `append`, `extend`, `reverse` — et en pandas avec `inplace=True`.',
    fix: `notes.sort()               # trier sur place, sans réaffecter
notes = sorted(notes)      # ou une NOUVELLE liste triée`,
    fiches: ['python-listes', 'python-fonctions-natives'], keywords: ['None', 'inplace', 'sorted'],
  },
  indentation: {
    category: 'python', title: 'Oublier d’indenter le bloc d’un if, for ou def',
    shown: 'if True:\nprint(1)',
    cause: 'Après `:` Python attend un bloc **décalé** (4 espaces). Le message donne la ligne du `if`, `for` ou `def` concerné.',
    fix: `if True:
    print(1)       # 4 espaces`,
    fiches: ['python-conditions-if', 'python-boucles-for'],
  },
  'syntax-paren': {
    category: 'python', title: 'Une parenthèse ouverte jamais refermée',
    shown: 'print((1, 2)',
    cause: 'Python lit jusqu’à la fin sans trouver la parenthèse fermante. L’erreur est souvent signalée **sur la ligne suivante** : regarder la ligne d’avant.',
    fix: 'print((1, 2))     # compter : autant de ) que de (',
    fiches: ['python-arguments'],
  },
  'unbound-local': {
    category: 'python', title: 'Modifier une variable globale depuis une fonction',
    cause: 'Comme `compteur` est **affecté** dans la fonction, Python le considère comme **local** dans toute la fonction ; à droite du `=`, il n’a pas encore de valeur.',
    fix: `def ajouter(compteur):          # passer la valeur en argument…
    return compteur + 1
compteur = ajouter(compteur)    # …et récupérer le résultat`,
    fiches: ['python-scopes'], keywords: ['global', 'scope', 'portée'],
  },
  'zero-division': {
    category: 'python', title: 'Diviser par zéro (en Python pur)',
    cause: 'Python lève une erreur. Attention : **NumPy et pandas ne lèvent pas d’erreur**, ils renvoient `inf` ou `NaN` (NumPy affiche au plus un avertissement).',
    fix: `taux = ventes / total if total else 0
# pandas : df["a"] / df["b"]  → inf ou NaN là où b vaut 0, à nettoyer ensuite`,
    fiches: ['python-conditions-if'],
  },
  'module-not-found': {
    category: 'python', title: 'Importer une bibliothèque mal orthographiée ou non installée',
    cause: 'Soit une faute de frappe (`seabornn`), soit la bibliothèque n’est pas installée **dans l’environnement que le notebook utilise**.',
    fix: `import seaborn as sns
# si non installée, dans une cellule :  %pip install seaborn`,
    fiches: ['visu-seaborn'],
  },
  'file-not-found': {
    category: 'python', title: 'Lire un fichier introuvable',
    cause: 'Le chemin est relatif au **dossier de travail** du notebook, pas forcément là où est le fichier. Le message donne le chemin cherché.',
    fix: `import os
os.getcwd()                          # où Python cherche
pd.read_csv("data/ventes_2024.csv")  # chemin depuis ce dossier`,
    fiches: ['pandas-introduction'],
  },

  // ------------------------------------------------------------------ pandas
  'key-column': {
    category: 'pandas', title: 'Sélectionner une colonne qui n’existe pas',
    cause: 'Les noms de colonnes sont des **étiquettes exactes** : majuscule, accent, espace en trop (`"ville "`) suffisent. Le message affiche le nom cherché.',
    fix: `df.columns.tolist()                       # les vrais noms
df.columns = df.columns.str.strip().str.lower()   # normaliser une fois pour toutes
df["ville"]`,
    fiches: ['pandas-introduction', 'pandas-formes'],
  },
  'key-loc-label': {
    category: 'pandas', title: 'Utiliser .loc avec une position',
    cause: '`.loc` cherche une **étiquette** d’index. Après un tri, un filtre ou un `dropna`, les étiquettes ne sont plus 0, 1, 2… : l’étiquette 3 n’existe pas forcément.',
    fix: `trie = df.sort_values("age", ascending=False)
trie.iloc[0]                        # la première ligne, par POSITION
trie.reset_index(drop=True).loc[0]  # ou renuméroter l’index`,
    fiches: ['pandas-selection-avancee'], keywords: ['iloc', 'loc', 'KeyError: 0'],
  },
  'truth-ambiguous': {
    category: 'pandas', title: 'Combiner des conditions avec and / or',
    cause: '`and` attend **un** booléen ; `df["age"] > 30` en contient un par ligne. pandas refuse de choisir. Même message avec `if serie:`.',
    fix: `df[(df["age"] > 30) & (df["ville"] == "Paris")]   # & | ~ et des parenthèses
if masque.any(): ...                                # « au moins un True »`,
    fiches: ['pandas-statistiques-filtrage', 'pandas-selection-avancee'], keywords: ['and', '&', 'or', '|'],
  },
  'chained-assignment': {
    category: 'pandas', title: 'Modifier des lignes filtrées en enchaînant deux [ ]',
    shown: 'df[df["age"] > 30]["age"] = 0',
    cause: '`df[masque]` crée un objet intermédiaire ; `["age"] = 0` modifie **cet objet**, pas `df`. `df` reste inchangé. pandas 3 parle de *chained assignment* ; pandas 2 de *SettingWithCopyWarning*.',
    fix: `df.loc[df["age"] > 30, "age"] = 0     # une seule opération : modifie df
sous = df[df["age"] > 30].copy()      # ou un extrait indépendant, assumé`,
    fiches: ['pandas-statistiques-filtrage'], keywords: ['SettingWithCopyWarning', 'copy', 'loc'],
  },
  'series-no-columns': {
    category: 'pandas', title: 'Demander .columns à une Series',
    cause: '`value_counts()`, `isnull().sum()`, `groupby(...)["col"].mean()` renvoient une **Series** : pas de colonnes, les étiquettes sont dans l’**index**.',
    fix: `vc = df["ville"].value_counts()
vc.index                 # les villes
vc.reset_index()         # DataFrame : colonnes ville et count`,
    fiches: ['pandas-formes'],
  },
  'frame-no-name': {
    category: 'pandas', title: 'Demander .name à un DataFrame',
    cause: 'Seule une Series a un `.name`. Un DataFrame a des `.columns`.',
    fix: `res = df.isnull().sum().to_frame()
res.columns.tolist()     # [0] : la colonne s’appelle 0
df.isnull().sum().to_frame("nb_nan")   # en la nommant`,
    fiches: ['pandas-formes'],
  },
  'frame-no-str': {
    category: 'pandas', title: 'Utiliser .str sur un DataFrame entier',
    cause: '`.str` n’existe que sur une **Series** (une colonne). Sur un DataFrame, il faut traiter colonne par colonne.',
    fix: `df["nom"].str.upper()                          # une colonne
df[["nom", "ville"]].apply(lambda s: s.str.upper())   # plusieurs colonnes`,
    fiches: ['nettoyage-chaines', 'pandas-transformer'],
  },
  'str-accessor': {
    category: 'pandas', title: 'Utiliser .str sur une colonne de nombres',
    cause: '`.str` ne s’applique qu’aux colonnes de texte. Vérifier le dtype ; convertir d’abord si c’est voulu.',
    fix: `df["age"].dtype                 # int64
df["age"].astype(str).str.zfill(3)`,
    fiches: ['nettoyage-chaines'],
  },
  'convert-float': {
    category: 'pandas', title: 'Convertir en nombres une colonne de texte « 12,5 »',
    cause: 'Une seule valeur non convertible bloque toute la colonne. Ici, la virgule décimale. Le message montre la première valeur fautive.',
    fix: `df["prix"] = df["prix"].str.replace(",", ".").astype(float)
pd.to_numeric(df["prix"], errors="coerce")   # ce qui ne passe pas → NaN`,
    fiches: ['nettoyage-pandas', 'nettoyage-chaines'], keywords: ['to_numeric', 'astype'],
  },
  'nan-to-int': {
    category: 'pandas', title: 'Convertir en entiers une colonne qui contient des NaN',
    cause: '`NaN` est un `float` : un `int64` NumPy ne peut pas le représenter. C’est aussi pourquoi une colonne d’entiers avec un manquant s’affiche `1.0`.',
    fix: `s.fillna(0).astype(int)      # remplacer d’abord
s.astype("Int64")            # ou le type entier pandas, qui accepte <NA>`,
    fiches: ['nettoyage-valeurs-manquantes'],
  },
  'length-mismatch': {
    category: 'pandas', title: 'Créer une colonne avec une liste de mauvaise longueur',
    cause: 'Une **liste** doit avoir exactement une valeur par ligne. (Une **Series**, elle, s’aligne sur l’index : NaN là où il manque une étiquette.)',
    fix: `df["note"] = [12, 15, 9]        # autant de valeurs que de lignes
df["note"] = 0                  # ou une seule valeur, répétée`,
    fiches: ['pandas-introduction'],
  },
  'merge-dtypes': {
    category: 'pandas', title: 'Joindre sur une clé numérique d’un côté, texte de l’autre',
    cause: '`1` et `"1"` ne sont pas égaux. Fréquent quand un identifiant est lu comme texte dans un fichier et comme nombre dans l’autre.',
    fix: `b["id"] = b["id"].astype(int)       # aligner les types avant
pd.merge(a, b, on="id")
a.dtypes, b.dtypes                  # le réflexe à avoir avant tout merge`,
    fiches: ['pandas-combiner'],
  },
  'compare-str-float': {
    category: 'python', title: 'Trier une liste qui mélange texte et NaN',
    cause: '`np.nan` est un `float` : Python ne sait pas comparer un nombre et un texte. Arrive avec `sorted(df["ville"].unique())` quand la colonne a des manquants.',
    fix: `sorted(x for x in villes if pd.notna(x))   # écarter les NaN
df["ville"].dropna().sort_values()          # ou laisser pandas trier`,
    fiches: ['python-fonctions-natives', 'nettoyage-valeurs-manquantes'], keywords: ['sorted', 'NaN'],
  },
  'groupby-key-index': {
    category: 'pandas', title: 'Chercher la clé du groupby comme une colonne',
    cause: 'Après `groupby("ville")`, les villes sont dans l’**index** du résultat, plus dans une colonne. `res["ville"]` cherche une étiquette d’index « ville ».',
    fix: `res.index                                       # les villes
res = df.groupby("ville", as_index=False)["age"].mean()   # ville reste une colonne
res = df.groupby("ville")["age"].mean().reset_index()     # équivalent`,
    fiches: ['pandas-agregation', 'pandas-formes'], keywords: ['as_index', 'reset_index'],
  },
  'to-datetime-format': {
    category: 'pandas', title: 'Lire une date avec le mauvais format',
    cause: 'Le `format` doit décrire la chaîne **exactement**. « 31/12/2024 » est un jour/mois/année : `%d/%m/%Y`.',
    fix: `pd.to_datetime("31/12/2024", format="%d/%m/%Y")
pd.to_datetime(col, format="%d/%m/%Y", errors="coerce")   # invalides → NaT`,
    fiches: ['python-dates'], keywords: ['strptime', 'format', 'NaT'],
  },
  'mask-with-nan': {
    category: 'pandas', title: 'Filtrer avec str.contains sur une colonne qui a des manquants',
    cause: 'En pandas 2 (colonne `object`), `str.contains` renvoie `NaN` pour les valeurs manquantes : le masque n’est plus booléen. En pandas 3 (dtype `str`), il renvoie `False` et le filtre passe.',
    fix: `df[df["ville"].str.contains("P", na=False)]   # fonctionne dans les deux versions`,
    fiches: ['nettoyage-chaines'], keywords: ['contains', 'na=False'],
  },

  // ------------------------------------------------------------------ NumPy
  broadcast: {
    category: 'numpy', title: 'Opérer entre deux tableaux de formes incompatibles',
    cause: 'Les shapes sont comparées **en partant de la droite** : (4, 3) et (4,) comparent 3 et 4 → incompatible. Il fallait (3,) pour une valeur par colonne, ou (4, 1) pour une valeur par ligne.',
    fix: `np.ones((4, 3)) + np.ones(3)          # une valeur par colonne
np.ones((4, 3)) + np.ones((4, 1))     # une valeur par ligne
np.ones((4, 3)) + np.ones(4)[:, None] # ajouter l’axe manquant`,
    fiches: ['numpy-introduction'], keywords: ['broadcasting', 'shape'],
  },
  'reshape-size': {
    category: 'numpy', title: 'Changer la forme sans conserver le nombre d’éléments',
    cause: '`reshape` ne crée ni ne supprime de valeur : le produit des dimensions doit être égal à la taille (12 ≠ 5 × 2).',
    fix: `np.arange(12).reshape(3, 4)      # 3 × 4 = 12
np.arange(12).reshape(-1, 2)     # -1 : « calcule cette dimension »  → (6, 2)`,
    fiches: ['numpy-introduction'],
  },
  'too-many-indices': {
    category: 'numpy', title: 'Indexer un tableau 1D comme un tableau 2D',
    cause: '`a[0, 1]` veut dire « ligne 0, colonne 1 » : il faut deux dimensions. Vérifier `a.ndim` et `a.shape`.',
    fix: `a.shape            # (5,) : une seule dimension
a[1]               # un seul indice
a.reshape(1, -1)[0, 1]   # ou passer en 2D si c’est voulu`,
    fiches: ['numpy-introduction'],
  },
};

interface Raw { type: string; message: string }
const D = data as { versions: { p3: string; p2: string }; numpy: string; cases: Record<string, { code: string; p3: Raw | null; p2?: Raw | null }> };

export interface ErrorEntry extends ErrorExplain {
  id: string;
  code: string;
  /** erreur réelle en pandas 3 (null : aucune erreur dans cette version) */
  p3: Raw | null;
  /** présent seulement si pandas 2 se comporte autrement */
  p2?: Raw | null;
}

export const errorVersions = D.versions;
export const errorEntries: ErrorEntry[] = Object.entries(EXPLAIN).map(([id, x]) => ({
  id, ...x, code: x.shown ?? D.cases[id]?.code ?? '', p3: D.cases[id]?.p3 ?? null, ...(D.cases[id] && 'p2' in D.cases[id] ? { p2: D.cases[id].p2 } : {}),
}));
export const errorCaseIds = Object.keys(D.cases);

/** Recherche dans les erreurs : tous les mots doivent apparaître (type, message, titre, mots-clés). */
const haystack = new Map(errorEntries.map((e) => [e.id, normalize([e.p3?.type, e.p3?.message, e.p2?.type, e.p2?.message, e.title, ...(e.keywords ?? [])].filter(Boolean).join(' '))]));
export function searchErrors(query: string): ErrorEntry[] {
  const terms = normalize(query).split(/\s+/).filter((t) => t.length > 1);
  if (!terms.length) return [];
  // l'erreur doit être reconnue par son type ou son message : un mot du titre seul ne suffit pas
  return errorEntries.filter((e) => {
    const h = haystack.get(e.id)!;
    const msg = normalize([e.p3?.type, e.p3?.message, e.p2?.type, e.p2?.message, ...(e.keywords ?? [])].join(' '));
    return terms.every((t) => h.includes(t)) && terms.some((t) => msg.includes(t));
  });
}
