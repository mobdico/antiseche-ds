"""
Trace toutes les combinaisons des scénarios avec le vrai matplotlib / seaborn.
Usage : python scripts/viz/generate.py  (depuis la racine du projet)
Écrit les images dans public/viz/ et l'index dans src/content/_data/viz.json.
"""
import contextlib, hashlib, importlib.util, io, itertools, json, os, sys, warnings
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

here = os.path.dirname(__file__)
spec = importlib.util.spec_from_file_location("sc", os.path.join(here, "scenarios_viz.py"))
sc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sc)

OUT_IMG = "public/viz"
os.makedirs(OUT_IMG, exist_ok=True)
for f in os.listdir(OUT_IMG):
    if f.endswith(".png"):
        os.remove(os.path.join(OUT_IMG, f))

results = {}
for s in sc.SCENARIOS:
    grids = [[o["code"] for o in p["options"]] for p in s["params"]]
    for combo in itertools.product(*grids):
        code = s["code"]
        for p, v in zip(s["params"], combo):
            code = code.replace(f"«{p['id']}»", v)
        code = "\n".join(l for l in code.split("\n") if l.strip() != "")  # options vides → pas de ligne vide
        key = "|".join([s["id"], *combo])
        plt.close("all")
        matplotlib.style.use("default")
        sns.reset_orig()
        ns = {}
        out = io.StringIO()
        entry = {"code": f"{sc.DATA_NOTE}\n{code}"}
        with warnings.catch_warnings(record=True) as w, contextlib.redirect_stdout(out):
            warnings.simplefilter("always")
            try:
                exec(sc.SETUP, ns)
                exec(code.replace("plt.show()", ""), ns)
            except Exception as e:
                entry["error"] = {"type": type(e).__name__, "message": str(e).split("\n")[0]}
        figs = [plt.figure(n) for n in plt.get_fignums()]
        if figs:
            name = hashlib.sha1(key.encode()).hexdigest()[:12] + ".png"
            figs[-1].savefig(os.path.join(OUT_IMG, name), dpi=100, bbox_inches="tight")
            entry["img"] = f"viz/{name}"
        entry["stdout"] = out.getvalue()
        ws = sorted({f"{type(x.message).__name__}: {str(x.message).splitlines()[0]}" for x in w})
        if ws:
            entry["warnings"] = ws
        results[key] = entry
        plt.close("all")

meta = {"matplotlib": matplotlib.__version__, "seaborn": sns.__version__}
json.dump({"versions": meta, "scenarios": sc.SCENARIOS, "results": results}, open("src/content/_data/viz.json", "w"), ensure_ascii=False, separators=(",", ":"))
size = sum(os.path.getsize(os.path.join(OUT_IMG, f)) for f in os.listdir(OUT_IMG))
print(f"{len(results)} graphiques, {len(os.listdir(OUT_IMG))} images, {size // 1024} Ko — matplotlib {meta['matplotlib']}, seaborn {meta['seaborn']}")
