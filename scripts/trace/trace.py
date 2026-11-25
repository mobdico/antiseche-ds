"""
Traceur : exécute du VRAI Python ligne par ligne et enregistre l'état de la mémoire après chaque ligne,
au format du schéma mémoire du site (variables → objets du tas).

Usage : python scripts/trace/trace.py scenarios_python_core.py src/content/_data/trace-python-core.json
"""
import contextlib, importlib.util, io, itertools, json, sys, types

FILE = "<sim>"
MAX_STEPS = 60
PRIMS = (int, float, str, bool, type(None), complex)


def short(v):
    r = repr(v)
    return r if len(r) <= 60 else r[:57] + "..."


class Heap:
    def __init__(self):
        self.objs, self.order = {}, []

    def slot(self, v):
        """Valeur dans un conteneur : primitive en ligne, sinon référence."""
        if isinstance(v, PRIMS):
            return {"v": v if not isinstance(v, complex) else repr(v)} if not (isinstance(v, float) and v != v) else {"v": None}
        return {"ref": self.add(v)}

    def add(self, v, top=False):
        key = f"o{id(v):x}"
        if key in self.objs:
            return key
        o = {"id": key, "addr": hex(id(v)), "pyType": type(v).__name__}
        self.objs[key] = o
        self.order.append(key)
        if isinstance(v, PRIMS):
            o.update(kind="scalar", value=v if not isinstance(v, float) or v == v else None)
            if isinstance(v, complex):
                o["value"] = repr(v)
        elif isinstance(v, (list, tuple)):
            o.update(kind="sequence", items=[self.slot(x) for x in v])
        elif isinstance(v, (set, frozenset)):
            o.update(kind="sequence", items=[self.slot(x) for x in sorted(v, key=repr)])
        elif isinstance(v, dict):
            o.update(kind="box", fields=[{"label": short(k), "slot": self.slot(x)} for k, x in v.items()])
        elif isinstance(v, types.FunctionType):
            import inspect
            o.update(kind="box", pyType="function", fields=[], note=f"{v.__name__}{inspect.signature(v)}")
        elif isinstance(v, type):
            o.update(kind="box", pyType="class", fields=[{"label": k, "slot": self.slot(x)} for k, x in vars(v).items()
                                                        if not k.startswith("__") and not isinstance(x, (types.FunctionType, staticmethod, classmethod))],
                     note=f"class {v.__name__} · méthodes : {', '.join(k for k, x in vars(v).items() if isinstance(x, types.FunctionType) and not k.startswith('__')) or '—'}")
        elif hasattr(v, "__dict__") and not isinstance(v, types.ModuleType):
            o.update(kind="box", fields=[{"label": "." + k, "slot": self.slot(x)} for k, x in vars(v).items()], note=f"instance de {type(v).__name__}")
        else:
            o.update(kind="scalar", value=str(v))
        return key


def visible(name, v):
    return not name.startswith("__") and not isinstance(v, types.ModuleType)


def snapshot(frames):
    """frames : liste (nom_de_frame, dict) du plus ancien au plus récent."""
    heap, vars_ = Heap(), []
    for fname, ns in frames:
        for name, v in list(ns.items()):
            if not visible(name, v):
                continue
            label = name if fname == "<module>" else f"{fname} › {name}"
            vars_.append({"name": label, "ref": heap.add(v, top=True)})
    return vars_, [heap.objs[k] for k in heap.order]


def frames_of(frame):
    out = []
    f = frame
    while f is not None:
        if f.f_code.co_filename == FILE:
            out.append(("<module>" if f.f_code.co_name == "<module>" else f.f_code.co_name, f.f_globals if f.f_code.co_name == "<module>" else f.f_locals))
        f = f.f_back
    return list(reversed(out))


def mark_changes(steps):
    prev = {}
    for s in steps:
        cur = {o["id"]: o for o in s["heap"]}
        for o in s["heap"]:
            p = prev.get(o["id"])
            if p and o.get("items") is not None and p.get("items") is not None:
                ch = [i for i, x in enumerate(o["items"]) if i >= len(p["items"]) or p["items"][i] != x]
                if ch:
                    o["changed"] = ch
            if p and o.get("kind") == "box" and o.get("fields") != p.get("fields"):
                o["badges"] = o.get("badges", []) + ["modifié"]
            if p is None and prev:
                o["badges"] = o.get("badges", []) + ["nouveau"]
        prev = cur


def run(code):
    lines = code.split("\n")
    out = io.StringIO()
    steps = []
    g = {"__name__": "__main__", "__builtins__": __builtins__}

    def record(lineno, frame, label=None):
        if len(steps) >= MAX_STEPS:
            return
        vars_, heap = snapshot(frames_of(frame))
        steps.append({"label": label or f"ligne {lineno}", "code": lines[lineno - 1].strip(), "line": lineno, "vars": vars_, "heap": heap, "stdout": out.getvalue()})

    pending = {}  # frame -> numéro de la ligne en cours d'exécution dans cette frame

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != FILE:
            return None
        is_class_body = not (frame.f_code.co_flags & 0x1) and frame.f_code.co_name != "<module>"  # corps de classe : pas CO_OPTIMIZED
        if event == "call" and frame.f_code.co_name != "<module>":
            caller = frame.f_back
            if caller in pending:
                record(pending[caller], frame, f"définition de la classe {frame.f_code.co_name}" if is_class_body else f"appel de {frame.f_code.co_name}()")
        elif event == "line":
            if frame in pending:
                record(pending[frame], frame)
            pending[frame] = frame.f_lineno
        elif event == "return":
            if frame in pending:
                is_fn = frame.f_code.co_name != "<module>"
                label = None if not is_fn else (f"fin de la classe {frame.f_code.co_name}" if is_class_body else f"return de {frame.f_code.co_name}() → {short(arg)}")
                record(pending.pop(frame), frame, label)
        return tracer

    error = None
    try:
        compiled = compile(code, FILE, "exec")
    except SyntaxError as e:
        return {"steps": [], "error": {"type": type(e).__name__, "message": e.msg, "line": e.lineno}, "stdout": ""}
    with contextlib.redirect_stdout(out):
        sys.settrace(tracer)
        try:
            exec(compiled, g)
        except Exception as e:
            tb = e.__traceback__
            line = None
            while tb:
                if tb.tb_frame.f_code.co_filename == FILE:
                    line = tb.tb_lineno
                tb = tb.tb_next
            tb_lines = ["Traceback (most recent call last):"]
            t = e.__traceback__
            while t:
                if t.tb_frame.f_code.co_filename == FILE:
                    tb_lines.append(f'  File "<sim>", line {t.tb_lineno}, in {t.tb_frame.f_code.co_name}')
                    tb_lines.append("    " + lines[t.tb_lineno - 1].strip())
                t = t.tb_next
            tb_lines.append(f"{type(e).__name__}: {e}")
            error = {"type": type(e).__name__, "message": str(e), "line": line, "traceback": tb_lines}
        finally:
            sys.settrace(None)
    if error and steps and steps[-1]["line"] == error["line"]:
        steps[-1]["failed"] = True
    if error and error["line"] and (not steps or steps[-1]["line"] != error["line"]):
        # état au moment de l'erreur (la ligne fautive n'a pas abouti)
        vars_, heap = snapshot([("<module>", g)])
        steps.append({"label": f"ligne {error['line']}", "code": lines[error["line"] - 1].strip(), "line": error["line"], "vars": vars_, "heap": heap, "stdout": out.getvalue(), "failed": True})
    mark_changes(steps)
    res = {"steps": steps, "stdout": out.getvalue()}
    if error:
        res["error"] = error
    if len(steps) >= MAX_STEPS:
        res["truncated"] = True
    return res


def main(spec_path, dest):
    spec = importlib.util.spec_from_file_location("spec", spec_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    results = {}
    for sc in mod.SCENARIOS:
        grids = [[o["code"] for o in p["options"]] for p in sc["params"]]
        for combo in itertools.product(*grids):
            code = sc["code"]
            for p, v in zip(sc["params"], combo):
                code = code.replace(f"«{p['id']}»", v)
            code = code.replace("(, ", "(")  # option vide suivie d'un argument : f(, x=1) → f(x=1)
            results["|".join([sc["id"], *combo])] = {"code": code, **run(code)}
    json.dump({"python": sys.version.split()[0], "scenarios": mod.SCENARIOS, "results": results}, open(dest, "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"{dest} : {len(mod.SCENARIOS)} scénarios, {len(results)} exécutions (Python {sys.version.split()[0]})")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
