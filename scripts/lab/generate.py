"""
Exécute toutes les combinaisons du labo avec le pandas installé et écrit les résultats en JSON.

Usage :
    python scripts/lab/generate.py out-p3.json [spec.py]   # spec par défaut : lab_pandas.py
    python scripts/lab/merge.py out-p3.json out-p2.json [dest]   (pandas : 2 versions)
    python scripts/lab/generate.py src/content/_data/labo-numpy.json scripts/lab/lab_numpy.py
"""
import itertools, json, math, sys, warnings
import numpy as np
import pandas as pd

import importlib.util, os
_spec_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "lab_pandas.py")
_spec = importlib.util.spec_from_file_location("labspec", _spec_path)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)
DATASET_CODE, FAMILIES, OMIT = _mod.DATASET_CODE, _mod.FAMILIES, _mod.OMIT
THEME = getattr(_mod, "THEME", "pandas")
LIB = getattr(_mod, "LIB", "pandas")


def clean(v):
    if v is None or v is pd.NA or v is pd.NaT:
        return None
    if isinstance(v, (np.bool_, bool)):
        return bool(v)
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (float, np.floating)):
        return None if math.isnan(v) else float(v)
    if isinstance(v, tuple):
        return ", ".join(str(clean(x)) for x in v)
    return v if isinstance(v, (int, str)) else str(v)


def ser(r):
    if isinstance(r, pd.DataFrame):
        return {"kind": "DataFrame", "columns": [str(c) for c in r.columns], "index": [clean(i) for i in r.index],
                "rows": [[clean(x) for x in row] for row in r.itertuples(index=False)], "dtypes": [str(d) for d in r.dtypes],
                "indexName": r.index.name}
    if isinstance(r, pd.Series):
        return {"kind": "Series", "name": None if r.name is None else str(r.name), "index": [clean(i) for i in r.index],
                "values": [clean(x) for x in r], "dtype": str(r.dtype), "indexName": r.index.name}
    if isinstance(r, np.ndarray):
        if r.size == 0:
            vals = []
        else:
            flat = r.reshape(-1, r.shape[-1]) if r.ndim >= 2 else r
            vals = [[clean(x) for x in row] for row in flat.tolist()] if r.ndim >= 2 else [clean(x) for x in r.tolist()]
        return {"kind": "ndarray", "values": vals, "shape": list(r.shape), "dtype": str(r.dtype), "view": bool(r.base is not None)}
    if isinstance(r, (tuple, list)) and not isinstance(r, str):
        return {"kind": "tuple", "pyType": type(r).__name__, "items": [ser(x) for x in r]}
    if isinstance(r, pd.api.extensions.ExtensionArray):
        return {"kind": "ndarray", "type": f"{type(r).__module__.split('.')[0]}.arrays.{type(r).__name__}", "values": [clean(x) for x in r], "dtype": str(r.dtype)}
    t = type(r)
    return {"kind": "scalar", "type": (t.__module__.replace("builtins", "").replace("numpy", "numpy") + "." + t.__name__).lstrip("."), "value": clean(r)}


def run(expr, args):
    ns = {"pd": pd, "np": np}
    exec(DATASET_CODE, ns)
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        try:
            r = eval(expr.replace("{args}", args).replace(", )", ")"), ns)
            out = {"result": ser(r), "printed": str(r)}
        except Exception as e:
            out = {"error": {"type": type(e).__name__, "message": str(e).split("\n")[0]}}
    ws = [f"{type(x.message).__name__}: {str(x.message).splitlines()[0]}" for x in w if not issubclass(x.category, DeprecationWarning) or "pandas" in str(x.message)]
    if ws:
        out["warnings"] = sorted(set(ws))
    return out


def main(path):
    ns = {"pd": pd, "np": np}
    exec(DATASET_CODE, ns)
    results = {}
    for fam in FAMILIES:
        for m in fam["methods"]:
            grids = [[o["code"] for o in p["options"]] for p in m["params"]]
            for combo in itertools.product(*grids):
                expr = m["expr"]
                for p, v in zip(m["params"], combo):
                    if "{" + p["id"] + "}" in expr:  # paramètre placé directement dans l'expression
                        expr = expr.replace("{" + p["id"] + "}", v)
                args = ", ".join(f"{p['id']}={v}" for p, v in zip(m["params"], combo) if v != OMIT and "{" + p["id"] + "}" not in m["expr"])
                results["|".join([m["id"], *combo])] = run(expr, args)
    data_vars = [{"name": k, "value": ser(v)} for k, v in ns.items() if not k.startswith("__") and k not in ("pd", "np") and not callable(v)]
    out = {"pandas": pd.__version__, "numpy": np.__version__, "lib": LIB, "theme": THEME,
           "dataset": {"code": DATASET_CODE, "frame": ser(ns["df"]) if "df" in ns else None, "vars": data_vars}, "families": FAMILIES, "results": results}
    json.dump(out, open(path, "w"), ensure_ascii=False)
    print(LIB, (np.__version__ if LIB == "numpy" else pd.__version__), len(results), "combinaisons")


if __name__ == "__main__":
    main(sys.argv[1])
