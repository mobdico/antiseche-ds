"""Exécute chaque cas de scenarios.py et enregistre l'exception réelle (type + message).
Usage : python generate.py sortie.json   (une fois par version de pandas, puis merge.py)."""
import json, sys, traceback, warnings, importlib.util, os
import numpy as np, pandas as pd

spec = importlib.util.spec_from_file_location("sc", os.path.join(os.path.dirname(__file__), "scenarios.py"))
sc = importlib.util.module_from_spec(spec); spec.loader.exec_module(sc)

out = {"pandas": pd.__version__, "numpy": np.__version__, "cases": {}}
for key, code in sc.CASES.items():
    env = {}
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        exec(sc.SETUP, env)
    lines = code.split("\n")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("default")
            exec("\n".join(lines[:-1]), env)
            exec(compile(lines[-1], "<cell>", "exec"), env)
        out["cases"][key] = {"code": code, "error": None}
    except BaseException as e:  # noqa
        msg = e.msg if isinstance(e, SyntaxError) else next((l for l in str(e).split("\n") if l.strip()), "").strip()
        out["cases"][key] = {"code": code, "error": {"type": type(e).__name__, "message": msg}}
json.dump(out, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
print("ok", len(out["cases"]), pd.__version__)
