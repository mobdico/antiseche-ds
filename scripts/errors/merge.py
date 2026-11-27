"""Fusionne les sorties de generate.py (pandas 3 puis pandas 2) → src/content/_data/errors.json"""
import json, sys
p3, p2 = (json.load(open(f)) for f in sys.argv[1:3])
out = {"versions": {"p3": p3["pandas"], "p2": p2["pandas"]}, "numpy": p3["numpy"], "cases": {}}
for k, c in p3["cases"].items():
    e = {"code": c["code"], "p3": c["error"]}
    if p2["cases"][k]["error"] != c["error"]: e["p2"] = p2["cases"][k]["error"]
    out["cases"][k] = e
json.dump(out, open(sys.argv[3], "w"), ensure_ascii=False, indent=1)
print("ok", len(out["cases"]))
