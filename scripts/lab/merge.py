"""Fusionne les résultats pandas 3 (référence) et pandas 2 (différences seulement) dans le JSON du site."""
import json, sys

p3, p2 = (json.load(open(f)) for f in sys.argv[1:3])
results = {}
for k, r3 in p3["results"].items():
    entry = {"p3": r3}
    r2 = p2["results"].get(k)
    if r2 is not None and r2 != r3:
        entry["p2"] = r2
    results[k] = entry
out = {"versions": {"p3": p3["pandas"], "p2": p2["pandas"]}, "lib": p3.get("lib", "pandas"), "theme": p3.get("theme", "pandas"), "dataset": p3["dataset"], "families": p3["families"], "results": results}
dest = sys.argv[3] if len(sys.argv) > 3 else "src/content/_data/labo-pandas.json"
json.dump(out, open(dest, "w"), ensure_ascii=False, separators=(",", ":"))
diff = sum(1 for e in results.values() if "p2" in e)
print(f"{dest} : {len(results)} combinaisons, {diff} différentes en pandas {p2['pandas']}")
