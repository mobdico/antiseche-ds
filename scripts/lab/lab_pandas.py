"""
Labo des méthodes pandas : description des méthodes, de leurs paramètres et des valeurs à essayer.

Chaque valeur de paramètre est un EXTRAIT DE CODE Python (ex. "True", "['age']", "0").
La valeur spéciale OMIT signifie « paramètre non passé » (valeur par défaut de pandas).
Le générateur (generate.py) exécute toutes les combinaisons avec le vrai pandas.
"""
OMIT = "__omit__"

DATASET_CODE = '''df = pd.DataFrame({
    "nom":   ["Ana", "Bob", "Chloé", "Dan", "Bob", "Eve"],
    "ville": ["Paris", "Lyon", "Paris", None, "Lyon", "Paris"],
    "age":   [25, np.nan, 41, 29, 34, np.nan],
    "score": [12.0, 15.5, np.nan, 9.0, 15.5, 11.0],
    "actif": [True, False, True, False, True, False],
})'''


def P(id, options, default, label=None):
    """options : liste de (code, aide) ; default : le code de la valeur par défaut de pandas."""
    return {"id": id, "label": label or id, "options": [{"code": c, "help": h} for c, h in options], "default": default}


AXIS = P("axis", [("0", "par colonne : on agrège en descendant les lignes"), ("1", "par ligne : on agrège le long de chaque ligne")], "0")
SKIPNA = P("skipna", [("True", "les NaN sont ignorés"), ("False", "un seul NaN rend le résultat NaN")], "True")
NUMERIC_ONLY = P("numeric_only", [("False", "toutes les colonnes, texte compris"), ("True", "seulement les colonnes numériques (et booléennes)")], "False")


def agg(id, extra=None, doc=""):
    params = [AXIS, SKIPNA, NUMERIC_ONLY] + (extra or [])
    return {"id": id, "label": f"{id}()", "expr": f"df.{id}({{args}})", "params": params, "doc": doc}


FAMILIES = [
    {
        "id": "agregations",
        "title": "Labo — agrégations : sum, mean, any, all…",
        "summary": "Faire varier `axis`, `skipna`, `numeric_only`, `min_count`… sur un DataFrame qui mélange texte, nombres, booléens et NaN.",
        "methods": [
            agg("sum", [P("min_count", [("0", "aucun minimum : une colonne vide donne 0"), ("1", "au moins 1 valeur présente, sinon NaN"), ("5", "au moins 5 valeurs présentes, sinon NaN")], "0")],
                "Somme. Sur du texte, `sum` **concatène** les chaînes ; les booléens comptent 1 / 0."),
            agg("mean", doc="Moyenne. Impossible sur du texte → `TypeError` si `numeric_only=False`."),
            agg("median", doc="Médiane : la valeur du milieu, moins sensible aux valeurs extrêmes."),
            agg("min", doc="Minimum. Sur du texte : ordre alphabétique."),
            agg("max", doc="Maximum. Sur du texte : ordre alphabétique."),
            agg("std", [P("ddof", [("1", "écart-type d’échantillon (division par n − 1)"), ("0", "écart-type de population (division par n)")], "1")], "Écart-type."),
            {"id": "count", "label": "count()", "expr": "df.count({args})", "doc": "Nombre de valeurs **non manquantes**.", "params": [AXIS, NUMERIC_ONLY]},
            {"id": "nunique", "label": "nunique()", "expr": "df.nunique({args})", "doc": "Nombre de valeurs **distinctes**.",
             "params": [AXIS, P("dropna", [("True", "NaN n’est pas compté comme une valeur"), ("False", "NaN compte comme une valeur distincte")], "True")]},
            {"id": "any", "label": "any()", "expr": "df[[\"age\", \"score\", \"actif\"]].any({args})", "doc": "True si **au moins une** valeur est « vraie » (≠ 0, ≠ False). NaN est ignoré si `skipna=True`.",
             "params": [AXIS, P("bool_only", [("False", "toutes les colonnes"), ("True", "seulement les colonnes booléennes")], "False"), SKIPNA]},
            {"id": "all", "label": "all()", "expr": "df[[\"age\", \"score\", \"actif\"]].all({args})", "doc": "True si **toutes** les valeurs sont « vraies ».",
             "params": [AXIS, P("bool_only", [("False", "toutes les colonnes"), ("True", "seulement les colonnes booléennes")], "False"), SKIPNA]},
        ],
    },
    {
        "id": "tri",
        "title": "Labo — trier et classer : sort_values, rank, nlargest…",
        "summary": "Faire varier `by`, `ascending`, `na_position`, `method`, `keep`… et voir l’ordre changer.",
        "methods": [
            {"id": "sort_values", "label": "sort_values()", "expr": "df.sort_values({args})", "doc": "Trier les lignes selon une ou plusieurs colonnes.",
             "params": [P("by", [('"score"', "une colonne"), ('["ville", "age"]', "d’abord ville, puis age à ville égale")], '"score"'),
                        P("ascending", [("True", "croissant"), ("False", "décroissant"), ("[True, False]", "un sens par colonne de `by`")], "True"),
                        P("na_position", [('"last"', "NaN à la fin"), ('"first"', "NaN au début")], '"last"'),
                        P("ignore_index", [("False", "garder l’index d’origine"), ("True", "renuméroter 0…n-1")], "False")]},
            {"id": "rank", "label": "rank()", "expr": 'df["score"].rank({args})', "doc": "Rang de chaque valeur. Les **ex æquo** (15.5 deux fois) dépendent de `method`.",
             "params": [P("method", [('"average"', "moyenne des rangs ex æquo"), ('"min"', "plus petit rang du groupe"), ('"max"', "plus grand rang du groupe"),
                                     ('"first"', "ordre d’apparition"), ('"dense"', "comme min, sans trou après les ex æquo")], '"average"'),
                        P("ascending", [("True", "la plus petite valeur a le rang 1"), ("False", "la plus grande valeur a le rang 1")], "True"),
                        P("na_option", [('"keep"', "NaN garde un rang NaN"), ('"top"', "NaN reçoit les premiers rangs"), ('"bottom"', "NaN reçoit les derniers rangs")], '"keep"')]},
            {"id": "nlargest", "label": "nlargest()", "expr": "df.nlargest({args})", "doc": "Les n lignes ayant les plus grandes valeurs d’une colonne (plus rapide qu’un tri complet).",
             "params": [P("n", [("2", "2 lignes"), ("3", "3 lignes")], "2"), P("columns", [('"score"', "colonne de tri")], '"score"'),
                        P("keep", [('"first"', "en cas d’égalité, la première occurrence"), ('"last"', "la dernière occurrence"), ('"all"', "toutes les ex æquo, quitte à dépasser n")], '"first"')]},
            {"id": "nsmallest", "label": "nsmallest()", "expr": "df.nsmallest({args})", "doc": "Les n lignes ayant les plus petites valeurs.",
             "params": [P("n", [("2", "2 lignes"), ("3", "3 lignes")], "2"), P("columns", [('"score"', "colonne"), ('"age"', "colonne")], '"score"'),
                        P("keep", [('"first"', "première occurrence"), ('"last"', "dernière occurrence"), ('"all"', "toutes les ex æquo")], '"first"')]},
            {"id": "idxmax", "label": "idxmax()", "expr": 'df["score"].idxmax({args})', "doc": "L’**étiquette** de la plus grande valeur (pas la valeur elle-même).",
             "params": [SKIPNA]},
            {"id": "sort_index", "label": "sort_index()", "expr": 'df.sort_values("score").sort_index({args})', "doc": "Remettre les lignes dans l’ordre de l’**index** (ici après un tri par score).",
             "params": [P("ascending", [("True", "index croissant"), ("False", "index décroissant")], "True")]},
        ],
    },
    {
        "id": "manquantes",
        "title": "Labo — valeurs manquantes : dropna, fillna, ffill…",
        "summary": "Toutes les combinaisons de `how`, `thresh`, `subset`, `axis`, `limit`… sur des NaN répartis dans le tableau.",
        "methods": [
            {"id": "isna", "label": "isna()", "expr": "df.isna({args})", "doc": "Masque True là où la valeur manque (alias : `isnull()`).", "params": []},
            {"id": "dropna", "label": "dropna()", "expr": "df.dropna({args})", "doc": "Supprimer les lignes (ou colonnes) qui contiennent des valeurs manquantes.",
             "params": [AXIS,
                        P("how", [(OMIT, "non passé (par défaut : \"any\")"), ('"any"', "supprimer dès qu’il y a **un** NaN"), ('"all"', "supprimer seulement si **tout** est NaN")], OMIT),
                        P("thresh", [(OMIT, "non passé"), ("4", "garder si au moins 4 valeurs présentes"), ("5", "garder si au moins 5 valeurs présentes")], OMIT),
                        P("subset", [(OMIT, "toutes les colonnes"), ('["age"]', "regarder seulement age"), ('["age", "score"]', "regarder age et score")], OMIT)]},
            {"id": "fillna", "label": "fillna()", "expr": "df.fillna({args})", "doc": "Remplacer les valeurs manquantes.",
             "params": [P("value", [("0", "0 partout (même dans le texte)"), ('{"age": 30, "score": 0}', "une valeur par colonne (dictionnaire)"), ('"?"', "une chaîne partout")], "0"),
                        P("limit", [(OMIT, "remplacer tous les NaN"), ("1", "au plus 1 NaN remplacé par colonne")], OMIT)]},
            {"id": "ffill", "label": "ffill()", "expr": "df.ffill({args})", "doc": "Propager la **dernière valeur connue** vers le bas (*forward fill*).",
             "params": [AXIS, P("limit", [(OMIT, "sans limite"), ("1", "au plus 1 NaN consécutif rempli")], OMIT)]},
            {"id": "bfill", "label": "bfill()", "expr": "df.bfill({args})", "doc": "Propager la **valeur suivante** vers le haut (*backward fill*).",
             "params": [AXIS, P("limit", [(OMIT, "sans limite"), ("1", "au plus 1 NaN consécutif rempli")], OMIT)]},
            {"id": "interpolate", "label": "interpolate()", "expr": 'df["score"].interpolate({args})', "doc": "Estimer les NaN numériques à partir des voisins.",
             "params": [P("method", [('"linear"', "ligne droite entre les voisins"), ('"nearest"', "valeur du voisin le plus proche")], '"linear"')]},
        ],
    },
    {
        "id": "doublons",
        "title": "Labo — doublons et comptages : duplicated, value_counts, unique…",
        "summary": "Faire varier `subset`, `keep`, `normalize`, `dropna`… pour repérer et compter.",
        "methods": [
            {"id": "duplicated", "label": "duplicated()", "expr": "df.duplicated({args})", "doc": "True pour les lignes qui répètent une autre ligne.",
             "params": [P("subset", [(OMIT, "toutes les colonnes"), ('["nom"]', "comparer le nom seulement"), ('["nom", "ville"]', "comparer nom et ville")], OMIT),
                        P("keep", [('"first"', "la 1re occurrence n’est pas un doublon"), ('"last"', "la dernière occurrence n’est pas un doublon"), ("False", "toutes les occurrences sont des doublons")], '"first"')]},
            {"id": "drop_duplicates", "label": "drop_duplicates()", "expr": "df.drop_duplicates({args})", "doc": "Supprimer les doublons.",
             "params": [P("subset", [(OMIT, "toutes les colonnes"), ('["nom"]', "nom seulement"), ('["nom", "ville"]', "nom et ville")], OMIT),
                        P("keep", [('"first"', "garder la 1re occurrence"), ('"last"', "garder la dernière"), ("False", "supprimer toutes les occurrences")], '"first"'),
                        P("ignore_index", [("False", "garder l’index"), ("True", "renuméroter")], "False")]},
            {"id": "value_counts", "label": "value_counts()", "expr": 'df["ville"].value_counts({args})', "doc": "Compter chaque valeur distincte.",
             "params": [P("normalize", [("False", "nombres d’occurrences"), ("True", "proportions (somme = 1)")], "False"),
                        P("sort", [("True", "trier par fréquence"), ("False", "ordre d’apparition")], "True"),
                        P("ascending", [("False", "du plus fréquent au moins fréquent"), ("True", "du moins fréquent au plus fréquent")], "False"),
                        P("dropna", [("True", "ignorer les NaN"), ("False", "compter aussi les NaN")], "True")]},
            {"id": "unique", "label": "unique()", "expr": 'df["ville"].unique({args})', "doc": "Les valeurs distinctes, dans l’ordre d’apparition (NaN inclus).", "params": []},
            {"id": "nunique_s", "label": "nunique()", "expr": 'df["ville"].nunique({args})', "doc": "Le **nombre** de valeurs distinctes.",
             "params": [P("dropna", [("True", "sans compter NaN"), ("False", "NaN compte comme une valeur")], "True")]},
        ],
    },
    {
        "id": "valeurs",
        "title": "Labo — filtrer et transformer des valeurs : between, isin, clip, where…",
        "summary": "Bornes incluses ou non, listes de valeurs, plafonds, remplacements conditionnels.",
        "methods": [
            {"id": "between", "label": "between()", "expr": 'df["score"].between({args})', "doc": "Masque : la valeur est-elle entre deux bornes ?",
             "params": [P("left", [("11", "borne basse 11"), ("12", "borne basse 12")], "11"), P("right", [("15.5", "borne haute 15.5"), ("12", "borne haute 12")], "15.5"),
                        P("inclusive", [('"both"', "les deux bornes incluses"), ('"neither"', "aucune borne incluse"), ('"left"', "seulement la borne basse"), ('"right"', "seulement la borne haute")], '"both"')]},
            {"id": "isin", "label": "isin()", "expr": 'df["ville"].isin({args})', "doc": "Masque : la valeur fait-elle partie d’une liste ?",
             "params": [P("values", [('["Paris"]', "une seule valeur"), ('["Paris", "Nice"]', "plusieurs valeurs"), ('["Lyon", None]', "None dans la liste attrape les valeurs manquantes")], '["Paris"]')]},
            {"id": "clip", "label": "clip()", "expr": 'df["score"].clip({args})', "doc": "Plafonner les valeurs entre un minimum et un maximum.",
             "params": [P("lower", [(OMIT, "pas de plancher"), ("10", "plancher à 10")], OMIT), P("upper", [(OMIT, "pas de plafond"), ("15", "plafond à 15")], "15")]},
            {"id": "where", "label": "where()", "expr": 'df["score"].where({args})', "doc": "Garder les valeurs où la condition est vraie, **remplacer les autres**.",
             "params": [P("cond", [('df["score"] > 11', "score > 11"), ('df["actif"]', "lignes actives")], 'df["score"] > 11'),
                        P("other", [(OMIT, "remplacer par NaN"), ("0", "remplacer par 0")], OMIT)]},
            {"id": "mask", "label": "mask()", "expr": 'df["score"].mask({args})', "doc": "L’inverse de `where` : **remplacer** les valeurs où la condition est vraie.",
             "params": [P("cond", [('df["score"] > 11', "score > 11"), ('df["actif"]', "lignes actives")], 'df["score"] > 11'),
                        P("other", [(OMIT, "remplacer par NaN"), ("0", "remplacer par 0")], OMIT)]},
            {"id": "replace", "label": "replace()", "expr": 'df["ville"].replace({args})', "doc": "Remplacer des valeurs précises.",
             "params": [P("to_replace", [('"Paris"', "une valeur"), ('["Paris", "Lyon"]', "une liste de valeurs")], '"Paris"'),
                        P("value", [('"PARIS"', "par « PARIS »"), ("None", "par None (valeur manquante)")], '"PARIS"')]},
            {"id": "round", "label": "round()", "expr": 'df["score"].div(3).round({args})', "doc": "Arrondir (ici score / 3).",
             "params": [P("decimals", [("0", "à l’unité"), ("1", "1 décimale"), ("2", "2 décimales")], "0")]},
        ],
    },
    {
        "id": "decalages",
        "title": "Labo — décalages, cumuls et fenêtres : shift, cumsum, rolling…",
        "summary": "Comparer une valeur à la précédente, cumuler, lisser sur une fenêtre glissante.",
        "methods": [
            {"id": "shift", "label": "shift()", "expr": 'df["score"].shift({args})', "doc": "Décaler les valeurs de n lignes.",
             "params": [P("periods", [("1", "vers le bas (valeur précédente)"), ("-1", "vers le haut (valeur suivante)"), ("2", "de 2 lignes")], "1"),
                        P("fill_value", [(OMIT, "NaN dans les cases libérées"), ("0", "0 dans les cases libérées")], OMIT)]},
            {"id": "diff", "label": "diff()", "expr": 'df["score"].diff({args})', "doc": "Différence avec la valeur n lignes plus haut.",
             "params": [P("periods", [("1", "avec la ligne précédente"), ("2", "avec 2 lignes plus haut"), ("-1", "avec la ligne suivante")], "1")]},
            {"id": "pct_change", "label": "pct_change()", "expr": 'df["score"].pct_change({args})', "doc": "Variation relative par rapport à la valeur précédente.",
             "params": [P("periods", [("1", "par rapport à la ligne précédente"), ("2", "par rapport à 2 lignes plus haut")], "1"),
                        P("fill_method", [(OMIT, "non passé"), ("None", "ne pas combler les NaN avant le calcul")], OMIT)]},
            {"id": "cumsum", "label": "cumsum()", "expr": 'df["score"].cumsum({args})', "doc": "Somme cumulée.", "params": [SKIPNA]},
            {"id": "cummax", "label": "cummax()", "expr": 'df["score"].cummax({args})', "doc": "Maximum atteint jusqu’ici.", "params": [SKIPNA]},
            {"id": "rolling", "label": "rolling().mean()", "expr": 'df["score"].rolling({args}).mean()', "doc": "Moyenne sur une **fenêtre glissante** de n lignes.",
             "params": [P("window", [("2", "fenêtre de 2 lignes"), ("3", "fenêtre de 3 lignes")], "2"),
                        P("min_periods", [(OMIT, "fenêtre complète exigée"), ("1", "au moins 1 valeur suffit")], OMIT),
                        P("center", [("False", "fenêtre qui se termine sur la ligne"), ("True", "fenêtre centrée sur la ligne")], "False")]},
        ],
    },
]
