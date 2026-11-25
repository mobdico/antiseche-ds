"""
Exécute toutes les combinaisons du labo avec le pandas installé et écrit les résultats en JSON.

Usage (une fois par version de pandas) :
    python scripts/lab/generate.py out-p3.json      # avec pandas 3.x
    python scripts/lab/generate.py out-p2.json      # avec pandas 2.x
    python scripts/lab/merge.py out-p3.json out-p2.json
"""
import itertools, json, math, sys, warnings
import numpy as np
import pandas as pd

sys.path.insert(0, __import__("os").path.dirname(__file__))
from lab_pandas import DATASET_CODE, FAMILIES, OMIT


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
        return {"kind": "ndarray", "values": [clean(x) for x in r.tolist()], "dtype": str(r.dtype)}
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
            r = eval(expr.format(args=args), ns)
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
                args = ", ".join(f"{p['id']}={v}" for p, v in zip(m["params"], combo) if v != OMIT)
                results["|".join([m["id"], *combo])] = run(m["expr"], args)
    out = {"pandas": pd.__version__, "numpy": np.__version__, "dataset": {"code": DATASET_CODE, "frame": ser(ns["df"])}, "families": FAMILIES, "results": results}
    json.dump(out, open(path, "w"), ensure_ascii=False)
    print(pd.__version__, len(results), "combinaisons")


if __name__ == "__main__":
    main(sys.argv[1])
