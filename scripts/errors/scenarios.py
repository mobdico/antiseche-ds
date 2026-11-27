"""Cas d'erreur fréquents en data : chaque code est EXÉCUTÉ, le message réel est enregistré.
Le texte explicatif (cause, correction) est dans src/content/errors.ts, sous la même clé."""

SETUP = '''
import numpy as np
import pandas as pd
df = pd.DataFrame({"nom": ["Ana", "Bob", "Chloé"], "ville": ["Paris", "Lyon", None],
                   "age": [25, 32, 41], "prix": ["12,5", "8", "10"]})
'''

CASES = {
    # ------------------------------------------------ Python
    "name-error": 'print(total)',
    "not-callable": 'sum = 0\nsum([1, 2, 3])',
    "concat-str-int": '"Âge : " + 25',
    "unsupported-operand": '10 + "5"',
    "list-index": 'notes = [12, 15, 9]\nnotes[3]',
    "dict-key": 'd = {"Paris": 2}\nd["Lyon"]',
    "invalid-literal": 'int("12,5")',
    "nonetype-attr": 'notes = [3, 1, 2]\nnotes = notes.sort()\nnotes.append(4)',
    "indentation": 'exec("if True:\\nprint(1)")',
    "syntax-paren": 'exec("print((1, 2)")',
    "unbound-local": 'compteur = 0\ndef ajouter():\n    compteur = compteur + 1\najouter()',
    "zero-division": '10 / 0',
    "module-not-found": 'import seabornn',
    "file-not-found": 'pd.read_csv("ventes_2024.csv")',
    # ------------------------------------------------ pandas
    "key-column": 'df["Ville"]',
    "key-loc-label": 'df.sort_values("age", ascending=False).loc[3]',
    "truth-ambiguous": 'df[df["age"] > 30 and df["ville"] == "Paris"]',
    "chained-assignment": 'import warnings\nwarnings.simplefilter("error")\ndf[df["age"] > 30]["age"] = 0',
    "series-no-columns": 'df["ville"].value_counts().columns',
    "frame-no-name": 'df.isnull().sum().to_frame().name',
    "frame-no-str": 'df.str.upper()',
    "str-accessor": 'df["age"].str.upper()',
    "convert-float": 'df["prix"].astype(float)',
    "nan-to-int": 'pd.Series([1.0, np.nan]).astype(int)',
    "length-mismatch": 'df["note"] = [12, 15]',
    "merge-dtypes": 'a = pd.DataFrame({"id": [1, 2]})\nb = pd.DataFrame({"id": ["1", "2"]})\npd.merge(a, b, on="id")',
    "compare-str-float": 'sorted(["Paris", np.nan, "Lyon"])',
    "groupby-key-index": 'res = df.groupby("ville")["age"].mean()\nres["ville"]',
    "to-datetime-format": 'pd.to_datetime("31/12/2024", format="%Y-%m-%d")',
    "mask-with-nan": 'df[df["ville"].str.contains("P")]',
    # ------------------------------------------------ NumPy
    "broadcast": 'np.ones((4, 3)) + np.ones(4)',
    "reshape-size": 'np.arange(12).reshape(5, 2)',
    "too-many-indices": 'np.arange(5)[0, 1]',
}
