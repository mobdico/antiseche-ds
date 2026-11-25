import type { TypeRef } from '../engine/types';

/**
 * Référentiel des types Python / NumPy / pandas utilisé par l'inspecteur de résultat.
 * La clé = le `pyType` d'un objet du schéma mémoire. Enrichir librement : le moteur lit ce fichier tel quel.
 */
export const typeRefs: Record<string, TypeRef> = {
  DataFrame: {
    fullName: 'pandas.DataFrame',
    summary: 'Tableau 2D étiqueté : lignes (index) × colonnes. Chaque colonne est une Series.',
    methods: [
      { sig: '.head(n) / .tail(n)', desc: 'premières / dernières lignes' },
      { sig: '.info()', desc: 'types, valeurs non nulles, mémoire' },
      { sig: '.describe()', desc: 'statistiques descriptives' },
      { sig: '.loc[l, c] / .iloc[i, j]', desc: 'sélection par étiquette / par position' },
      { sig: '.isnull().sum()', desc: 'valeurs manquantes par colonne' },
      { sig: '.dropna() / .fillna(v)', desc: 'supprimer / remplacer les NaN' },
      { sig: '.sort_values(col)', desc: 'trier les lignes' },
      { sig: '.groupby(col)', desc: 'grouper pour agréger' },
      { sig: '.merge(df2, on=…)', desc: 'joindre sur une clé' },
      { sig: '.drop(cols, axis=1)', desc: 'supprimer des colonnes' },
      { sig: '.apply(f, axis=…) / .map(f)', desc: 'appliquer une fonction' },
      { sig: '.copy()', desc: 'copie indépendante' },
    ],
  },
  Series: {
    fullName: 'pandas.Series',
    summary: 'Colonne 1D étiquetée : des valeurs + un index + un nom.',
    methods: [
      { sig: '.value_counts()', desc: 'nombre d’occurrences de chaque valeur' },
      { sig: '.mean() / .sum() / .max()', desc: 'statistiques (NaN ignorés)' },
      { sig: '.describe()', desc: 'résumé statistique' },
      { sig: '.isnull() / .notnull()', desc: 'masque des valeurs manquantes' },
      { sig: '.astype(type)', desc: 'convertir le type' },
      { sig: '.map(f ou dict) / .apply(f)', desc: 'transformer élément par élément' },
      { sig: '.str.…', desc: 'méthodes de texte (contains, replace, extract…)' },
      { sig: '.sort_values()', desc: 'trier' },
      { sig: '.unique() / .nunique()', desc: 'valeurs distinctes / leur nombre' },
      { sig: '.tolist()', desc: 'convertir en liste Python' },
      { sig: '.to_frame()', desc: 'convertir en DataFrame à une colonne' },
    ],
  },
  Index: {
    fullName: 'pandas.Index',
    summary: 'Étiquettes des lignes (df.index) ou des colonnes (df.columns). Immuable.',
    methods: [
      { sig: '.tolist()', desc: 'convertir en liste' },
      { sig: '.str.…', desc: 'méthodes de texte sur les noms' },
      { sig: '.rename(…) / df.columns = …', desc: 'renommer' },
      { sig: "'x' in df.columns", desc: 'tester la présence d’une colonne' },
    ],
  },
  ndarray: {
    fullName: 'numpy.ndarray',
    summary: 'Tableau NumPy à n dimensions, d’un seul type (dtype). Opérations vectorisées.',
    methods: [
      { sig: '.sum(axis=…) / .mean(axis=…)', desc: 'agréger (axis=0 : par colonne, axis=1 : par ligne)' },
      { sig: '.max() / .min() / .argmax()', desc: 'extrêmes et leur position' },
      { sig: '.reshape(l, c)', desc: 'changer la forme' },
      { sig: '.T', desc: 'transposée' },
      { sig: '.astype(type)', desc: 'convertir le dtype' },
      { sig: '.copy()', desc: 'copie indépendante (≠ vue)' },
      { sig: '.tolist()', desc: 'convertir en liste Python' },
      { sig: 'tableau[masque]', desc: 'indexation booléenne' },
    ],
  },
  DataFrameGroupBy: {
    fullName: 'pandas.api.typing.DataFrameGroupBy',
    summary: 'Objet paresseux : sait quelles lignes vont dans quel groupe, n’a encore rien calculé.',
    methods: [
      { sig: '.mean() / .sum() / .count()', desc: 'agréger chaque groupe' },
      { sig: '.agg(["mean", "max"])', desc: 'plusieurs agrégations' },
      { sig: '.size()', desc: 'nombre de lignes par groupe' },
      { sig: '.get_group(clé)', desc: 'lignes d’un groupe' },
      { sig: '["col"]', desc: 'restreindre à une colonne' },
    ],
  },
  list: {
    fullName: 'list',
    summary: 'Séquence ordonnée et **mutable** de références vers des objets.',
    methods: [
      { sig: '.append(x)', desc: 'ajouter un élément à la fin' },
      { sig: '.extend(liste)', desc: 'ajouter plusieurs éléments' },
      { sig: '.insert(i, x)', desc: 'insérer à une position' },
      { sig: '.pop() / .remove(x)', desc: 'retirer' },
      { sig: '.index(x) / .count(x)', desc: 'position / nombre d’occurrences' },
      { sig: '.sort() / sorted(l)', desc: 'trier sur place / copie triée' },
      { sig: '.copy() / l[:]', desc: 'copie superficielle' },
    ],
  },
  tuple: { fullName: 'tuple', summary: 'Séquence ordonnée **immuable**.', methods: [{ sig: '.index(x) / .count(x)', desc: 'position / occurrences' }, { sig: 'a, b = t', desc: 'dépaquetage' }] },
  dict: {
    fullName: 'dict',
    summary: 'Associations clé → valeur. Clés uniques et immuables.',
    methods: [
      { sig: '.get(k, défaut)', desc: 'lire sans KeyError' },
      { sig: '.keys() / .values() / .items()', desc: 'parcourir' },
      { sig: '.update(d2)', desc: 'fusionner' },
      { sig: '.pop(k)', desc: 'retirer une clé' },
      { sig: 'k in d', desc: 'tester une clé' },
    ],
  },
  str: {
    fullName: 'str',
    summary: 'Chaîne de caractères **immuable** : chaque méthode renvoie une nouvelle chaîne.',
    methods: [
      { sig: '.replace(old, new)', desc: 'remplacer toutes les occurrences' },
      { sig: '.split(sep)', desc: 'découper en liste' },
      { sig: '.strip()', desc: 'retirer les espaces aux bords' },
      { sig: '.lower() / .upper() / .title()', desc: 'changer la casse' },
      { sig: '.startswith(x) / "x" in s', desc: 'tester un contenu' },
      { sig: 'int(s) / float(s)', desc: 'convertir en nombre' },
    ],
  },
  int: { fullName: 'int', summary: 'Entier Python, immuable.', methods: [{ sig: '+ - * / // % **', desc: 'opérations (`/` renvoie toujours un float)' }, { sig: 'str(n) / float(n)', desc: 'convertir' }] },
  float: { fullName: 'float', summary: 'Nombre à virgule flottante. `nan` est un float.', methods: [{ sig: 'round(x, n)', desc: 'arrondir (au pair pour les ,5)' }, { sig: 'int(x)', desc: 'tronquer' }, { sig: 'math.isnan(x)', desc: 'tester nan' }] },
  bool: { fullName: 'bool', summary: 'True / False. Vaut 1 / 0 dans un calcul.', methods: [{ sig: 'and / or / not', desc: 'logique (scalaires)' }, { sig: 'sum(liste_de_bool)', desc: 'compter les True' }] },
  NoneType: { fullName: 'NoneType', summary: 'Absence de valeur (`None`).', methods: [{ sig: 'x is None', desc: 'tester (plutôt que ==)' }] },
  bytes: { fullName: 'bytes', summary: 'Suite d’octets bruts, avant décodage en texte.', methods: [{ sig: '.decode("utf-8")', desc: 'octets → texte' }, { sig: 'texte.encode("utf-8")', desc: 'texte → octets' }] },
};

typeRefs.function = { fullName: 'function', summary: 'Une fonction est un **objet** : son nom est une variable qui pointe vers elle.', methods: [{ sig: 'f(args)', desc: 'appeler' }, { sig: 'f.__name__', desc: 'son nom' }, { sig: 'help(f)', desc: 'sa documentation' }, { sig: 'del f', desc: 'supprimer le nom' }] };
typeRefs.datetime = { fullName: 'datetime.datetime', summary: 'Un instant précis : date + heure.', methods: [
  { sig: '.strftime(format)', desc: 'datetime → chaîne' }, { sig: 'dt.datetime.strptime(s, format)', desc: 'chaîne → datetime' }, { sig: '.year / .month / .day / .hour', desc: 'composantes' },
  { sig: '.date() / .time()', desc: 'partie date / heure' }, { sig: '+ / − timedelta', desc: 'décaler' }, { sig: 'd2 − d1', desc: 'durée (timedelta)' }, { sig: '.weekday()', desc: '0 = lundi' }] };
typeRefs.timedelta = { fullName: 'datetime.timedelta', summary: 'Une **durée** (différence entre deux instants).', methods: [
  { sig: '.days / .seconds', desc: 'composantes' }, { sig: '.total_seconds()', desc: 'durée totale en secondes' }, { sig: 'dt.timedelta(days=, hours=, minutes=)', desc: 'créer une durée' }] };

/** Types NumPy scalaires (résultat d'une agrégation complète, d'un accès à une cellule…). */
for (const t of ['numpy.int64', 'numpy.float64', 'numpy.bool']) {
  typeRefs[t] = {
    fullName: t,
    summary: 'Scalaire NumPy : se comporte comme un nombre Python, mais garde son dtype.',
    methods: [{ sig: '.item()', desc: 'convertir en int / float Python' }, { sig: 'round(x, n)', desc: 'arrondir' }],
  };
}
