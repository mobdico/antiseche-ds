"""Labo des méthodes NumPy : méthodes, paramètres et valeurs à essayer (exécutés par le vrai NumPy)."""
OMIT = "__omit__"
THEME = "numpy"
LIB = "numpy"

DATASET_CODE = '''a = np.array([[12, 15,  9],
              [ 8, 11, 14],
              [17, 13, 10],
              [10, 16, 12]])          # 4 élèves × 3 matières
b = a.astype(float)
b[1, 1] = np.nan                    # deux valeurs manquantes
b[3, 0] = np.nan
v = np.array([4, 1, 3, 1, 5, 9, 2, 6])'''


def P(id, options, default, label=None):
    return {"id": id, "label": label or id, "options": [{"code": c, "help": h} for c, h in options], "default": default}


AXIS = P("axis", [("None", "tout le tableau → un seul nombre"), ("0", "par colonne (on descend les lignes)"), ("1", "par ligne")], "None")
KEEP = P("keepdims", [("False", "la dimension agrégée disparaît"), ("True", "garder la dimension (taille 1) : pratique pour le broadcasting")], "False")


def agg(id, doc, target="a", extra=None, fn=None):
    fn = fn or id
    return {"id": id, "label": f"np.{fn}({target})", "expr": f"np.{fn}({target}, {{args}})", "doc": doc, "params": [AXIS, KEEP] + (extra or [])}


FAMILIES = [
    {"id": "np-forme", "title": "Labo NumPy — changer de forme : reshape, transpose, concatenate",
     "summary": "Remodeler, transposer et coller des tableaux : `shape`, `order`, `axis`.",
     "methods": [
         {"id": "reshape", "label": "np.reshape()", "expr": "np.reshape(a, {args})", "doc": "Nouvelle forme, **même nombre d’éléments** (12 ici). `-1` = « calcule pour moi ».",
          "params": [P("shape", [("(3, 4)", "3 × 4"), ("(2, 6)", "2 × 6"), ("(-1, 2)", "2 colonnes, lignes calculées"), ("(12,)", "1D"), ("(5, 3)", "15 cases pour 12 éléments")], "(3, 4)"),
                     P("order", [('"C"', "remplir ligne par ligne"), ('"F"', "remplir colonne par colonne")], '"C"')]},
         {"id": "transpose", "label": "transpose()", "expr": "a.transpose({args})", "doc": "Échanger les axes (lignes ↔ colonnes), comme `a.T`.", "params": []},
         {"id": "concatenate", "label": "np.concatenate()", "expr": "np.concatenate((a, a[:2]), {args})", "doc": "Coller des tableaux le long d’un axe existant (ici `a` et ses 2 premières lignes).",
          "params": [P("axis", [("0", "empiler les lignes"), ("1", "côte à côte (formes incompatibles ici)"), ("None", "tout aplatir puis coller")], "0")]},
     ]},
    {"id": "np-agreger", "title": "Labo NumPy — agréger : sum, mean, std, argmax, percentile…",
     "summary": "`axis`, `keepdims`, `ddof`, `q` et les versions `nan…` qui ignorent les valeurs manquantes.",
     "methods": [
         agg("sum", "Somme."), agg("mean", "Moyenne (toujours un float)."), agg("max", "Maximum."),
         agg("std", "Écart-type.", extra=[P("ddof", [("0", "population (n) — défaut NumPy"), ("1", "échantillon (n − 1) — défaut pandas")], "0")]),
         {"id": "argmax", "label": "np.argmax()", "expr": "np.argmax(a, {args})", "doc": "La **position** du maximum (pas sa valeur).", "params": [AXIS, KEEP]},
         {"id": "cumsum", "label": "np.cumsum()", "expr": "np.cumsum(a, {args})", "doc": "Somme cumulée ; sans axis, le tableau est aplati.", "params": [AXIS]},
         {"id": "percentile", "label": "np.percentile()", "expr": "np.percentile(a, {args})", "doc": "La valeur sous laquelle se trouvent q % des données.",
          "params": [P("q", [("50", "médiane"), ("25", "1er quartile"), ("[25, 75]", "plusieurs quantiles")], "50"), AXIS]},
         agg("sum_nan", "Somme d’un tableau **avec NaN** : un seul NaN contamine le résultat.", target="b", fn="sum"),
         agg("nansum", "Comme sum, mais en **ignorant** les NaN.", target="b"),
         agg("nanmean", "Comme mean, mais en ignorant les NaN.", target="b"),
     ]},
    {"id": "np-trier", "title": "Labo NumPy — trier, chercher, filtrer : sort, argsort, unique, where…",
     "summary": "`axis`, `return_counts`, `return_index`, conditions et valeurs de remplacement.",
     "methods": [
         {"id": "sort", "label": "np.sort()", "expr": "np.sort(a, {args})", "doc": "Copie triée.", "params": [P("axis", [("-1", "chaque ligne (dernier axe, défaut)"), ("0", "chaque colonne"), ("None", "tout aplatir puis trier")], "-1")]},
         {"id": "argsort", "label": "np.argsort()", "expr": "np.argsort(v, {args})", "doc": "Les **positions** qui trieraient le tableau `v`.", "params": [P("kind", [(OMIT, "quicksort par défaut"), ('"stable"', "stable : les ex æquo gardent leur ordre")], OMIT)]},
         {"id": "unique", "label": "np.unique()", "expr": "np.unique(v, {args})", "doc": "Valeurs distinctes **triées** ; options pour les comptes et positions.",
          "params": [P("return_counts", [("False", "valeurs seulement"), ("True", "+ nombre d’occurrences")], "False"), P("return_index", [("False", "—"), ("True", "+ position de la 1re occurrence")], "False")]},
         {"id": "where3", "label": "np.where(cond, x, y)", "expr": "np.where({condition}, {x}, {y})", "doc": "Choisir élément par élément : x si la condition est vraie, sinon y.",
          "params": [P("condition", [("a > 12", "note > 12"), ("a % 2 == 0", "note paire")], "a > 12"), P("x", [("a", "garder la note"), ('"ok"', "un texte")], "a"), P("y", [("0", "sinon 0"), ("-a", "sinon l’opposé"), ('"ko"', "un texte")], "0")]},
         {"id": "where1", "label": "np.where(cond)", "expr": "np.where({condition})", "doc": "Avec un seul argument : les **indices** où la condition est vraie (un tableau par dimension).",
          "params": [P("condition", [("a > 14", "notes > 14"), ("v == 1", "valeurs égales à 1 dans v")], "a > 14")]},
         {"id": "isin", "label": "np.isin()", "expr": "np.isin(a, {args})", "doc": "Masque : chaque valeur est-elle dans la liste ?", "params": [P("test_elements", [("[10, 12]", "10 ou 12"), ("[99]", "absente")], "[10, 12]"), P("invert", [("False", "dans la liste"), ("True", "hors de la liste")], "False")]},
         {"id": "clip", "label": "np.clip()", "expr": "np.clip(a, {args})", "doc": "Ramener les valeurs dans [min, max].", "params": [P("a_min", [("10", "plancher 10"), ("None", "pas de plancher")], "10"), P("a_max", [("15", "plafond 15"), ("None", "pas de plafond")], "15")]},
         {"id": "any", "label": "np.any()", "expr": "np.any(a > 15, {args})", "doc": "Au moins un True (ici : une note > 15) ?", "params": [AXIS, KEEP]},
         {"id": "all", "label": "np.all()", "expr": "np.all(a >= 9, {args})", "doc": "Tous True (ici : toutes les notes ≥ 9) ?", "params": [AXIS, KEEP]},
     ]},
    {"id": "np-broadcast", "title": "Labo NumPy — broadcasting : quelles formes se combinent ?",
     "summary": "Combiner `a` (4, 3) avec des tableaux de formes différentes et voir quand NumPy « étire » les dimensions.",
     "methods": [
         {"id": "bcast", "label": "a <op> b", "expr": "np.{op}(a, {b})", "doc": "Deux dimensions sont compatibles si elles sont **égales** ou si l’une vaut **1** (comparées en partant de la droite).",
          "params": [P("op", [("add", "addition"), ("multiply", "multiplication"), ("greater", "comparaison a > b")], "add"),
                     P("b", [("10", "un scalaire"), ("np.array([1, 0, -1])", "forme (3,) : une valeur par colonne"), ("np.array([[100], [200], [300], [400]])", "forme (4, 1) : une valeur par ligne"),
                             ("np.array([[1, 0, -1]])", "forme (1, 3)"), ("np.array([1, 2, 3, 4])", "forme (4,) : incompatible avec (4, 3)"), ("np.ones((2, 3))", "forme (2, 3) : incompatible")], "10")]},
     ]},
]
