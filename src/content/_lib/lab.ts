/**
 * Fiches « Labo » : chaque combinaison de paramètres a été exécutée par la VRAIE bibliothèque
 * (scripts/lab/generate.py) ; ce module ne fait qu'afficher les résultats enregistrés.
 * Plusieurs labos sont gérés : pandas (2 versions comparées) et NumPy.
 */
import type { Fiche, HeapObj, ParamDef, Prim, SimAlert, SimResult, SimStep } from '../../engine/types';
import { defineFiche } from '../../engine/types';
import labPandas from '../_data/labo-pandas.json';
import labNumpy from '../_data/labo-numpy.json';
import { frameObj, seriesObj, type Dtype, type Frame } from './pandas-sim';
import { arr1, arr2 } from './numpy-sim';
import { list } from '../../engine/sim-helpers';

const OMIT = '__omit__';

interface LabParam { id: string; label: string; default: string; options: { code: string; help: string }[] }
interface LabMethod { id: string; label: string; expr: string; doc: string; params: LabParam[] }
interface LabFamily { id: string; title: string; summary: string; methods: LabMethod[] }
type Res =
  | { kind: 'DataFrame'; columns: string[]; index: (string | number)[]; rows: Prim[][]; dtypes: string[]; indexName: string | null }
  | { kind: 'Series'; name: string | null; index: (string | number | null)[]; values: Prim[]; dtype: string; indexName: string | null }
  | { kind: 'ndarray'; values: Prim[] | Prim[][]; shape?: number[]; dtype: string; type?: string; view?: boolean }
  | { kind: 'tuple'; pyType: string; items: Res[] }
  | { kind: 'scalar'; type: string; value: Prim };
interface Run { result?: Res; printed?: string; error?: { type: string; message: string }; warnings?: string[] }
type Entry = { p3: Run; p2?: Run } | Run;
interface LabData {
  lib?: string; theme?: string; pandas?: string; numpy?: string; versions?: { p3: string; p2: string };
  dataset: { code: string; frame?: Res | null; vars?: { name: string; value: Res }[] };
  families: LabFamily[]; results: Record<string, Entry>;
}

const LABS = [labPandas, labNumpy] as unknown as LabData[];

const pid = (m: LabMethod, p: LabParam) => `${m.id}__${p.id}`;
const label = (code: string) => (code === OMIT ? 'non passé' : `\`${code}\``);
const runs = (e: Entry | undefined): { p3?: Run; p2?: Run } => (!e ? {} : 'p3' in e ? e : { p3: e as Run });
const shapeStr = (s: number[]) => (s.length === 1 ? `(${s[0]},)` : `(${s.join(', ')})`);

function toFrame(r: Extract<Res, { kind: 'DataFrame' }>): Frame {
  return { columns: r.columns, index: r.index, rows: r.rows, dtypes: r.dtypes as Dtype[], indexName: r.indexName ?? undefined };
}

/** Objets du schéma mémoire pour un résultat (un tuple produit plusieurs objets). */
function toObjs(id: string, r: Res, extra: Partial<HeapObj> = {}): HeapObj[] {
  switch (r.kind) {
    case 'DataFrame': return [frameObj(id, toFrame(r), extra)];
    case 'Series': return [seriesObj(id, { name: r.name, index: r.index.map((x) => (x === null ? 'NaN' : x)), values: r.values, dtype: r.dtype as Dtype, indexName: r.indexName ?? undefined }, extra)];
    case 'ndarray': {
      const shape = r.shape ?? [r.values.length];
      const common: Partial<HeapObj> = {
        fullType: r.type, pyType: r.type ? 'ExtensionArray' : 'ndarray',
        badges: [...(extra.badges ?? []), ...(r.view ? ['vue'] : r.view === false ? ['copie'] : [])],
        attrs: [{ name: '.shape', value: shapeStr(shape) }, { name: '.ndim', value: String(shape.length) }, ...(r.view !== undefined ? [{ name: '.base', value: r.view ? 'un autre tableau (vue)' : 'None (données propres)' }] : [])],
      };
      if (shape.length === 1) return [arr1(id, r.values as Prim[], r.dtype as 'int64', { ...extra, ...common, note: `shape ${shapeStr(shape)} · ${r.dtype}` })];
      const rows = r.values as Prim[][];
      const o = arr2(id, rows.length ? rows : [[]], r.dtype as 'int64', { ...extra, ...common, note: `shape ${shapeStr(shape)} · ${r.dtype}` });
      if (shape.length > 2 && o.table) {
        // tableau à 3 dimensions et plus : chaque ligne affichée = un indice [i, j, …]
        const outer = shape.slice(0, -1);
        o.table.index = rows.map((_, k) => `[${outer.map((_, d) => Math.floor(k / outer.slice(d + 1).reduce((a, b) => a * b, 1)) % outer[d]).join(', ')}]`);
      }
      return [o];
    }
    case 'tuple': {
      const children = r.items.flatMap((it, i) => toObjs(`${id}_${i}`, it));
      const refs = r.items.map((_, i) => ({ ref: `${id}_${i}` }));
      return [list(id, refs, { pyType: r.pyType, ...extra }), ...children];
    }
    default: return [{ id, pyType: r.type.split('.').pop() ?? r.type, fullType: r.type, kind: 'scalar', value: r.value, ...extra }];
  }
}

/** Cellules qui diffèrent du résultat obtenu avec les paramètres par défaut. */
function diffCells(r: Res, ref: Res): string[] | null {
  if (r.kind !== ref.kind) return null;
  if (r.kind === 'DataFrame' && ref.kind === 'DataFrame') {
    if (r.columns.join() !== ref.columns.join() || r.index.join() !== ref.index.join()) return null;
    return r.rows.flatMap((row, i) => row.flatMap((x, j) => (x !== ref.rows[i][j] ? [`${i}:${j}`] : [])));
  }
  if (r.kind === 'Series' && ref.kind === 'Series') {
    if (r.index.join() !== ref.index.join()) return null;
    return r.values.flatMap((x, i) => (x !== ref.values[i] ? [`${i}:0`] : []));
  }
  if (r.kind === 'ndarray' && ref.kind === 'ndarray') {
    if ((r.shape ?? []).join() !== (ref.shape ?? []).join()) return null;
    if ((r.shape ?? [1]).length === 1) return (r.values as Prim[]).flatMap((x, j) => (x !== (ref.values as Prim[])[j] ? [`0:${j}`] : []));
    return (r.values as Prim[][]).flatMap((row, i) => row.flatMap((x, j) => (x !== (ref.values as Prim[][])[i][j] ? [`${i}:${j}`] : [])));
  }
  return null;
}

const shapeOf = (r: Res): string =>
  r.kind === 'DataFrame' ? `(${r.rows.length}, ${r.columns.length})` : r.kind === 'scalar' ? 'un scalaire' : r.kind === 'tuple' ? `un tuple de ${r.items.length}` : r.kind === 'ndarray' ? shapeStr(r.shape ?? [r.values.length]) : `(${r.values.length},)`;

/** Expression Python affichée pour une combinaison (mêmes règles que le générateur). */
function callOf(m: LabMethod, combo: string[]): string {
  let expr = m.expr;
  m.params.forEach((q, i) => { if (expr.includes(`{${q.id}}`)) expr = expr.replace(`{${q.id}}`, combo[i]); });
  const args = m.params.map((q, i) => (combo[i] === OMIT || m.expr.includes(`{${q.id}}`) ? '' : `${q.id}=${combo[i]}`)).filter(Boolean).join(', ');
  return expr.replace('{args}', args).replace(', )', ')');
}

function datasetStep(lab: LabData): SimStep {
  const vars = lab.dataset.vars ?? (lab.dataset.frame ? [{ name: 'df', value: lab.dataset.frame }] : []);
  const heap = vars.flatMap((v) => {
    const objs = toObjs(v.name, v.value);
    // valeurs manquantes surlignées dans les données de départ
    for (const o of objs) {
      o.badges = []; // données de départ : ni vue ni copie à signaler
      o.attrs = o.attrs?.filter((x) => x.name !== '.base');
      if (o.table) o.changed = o.table.rows.flatMap((row, i) => row.flatMap((x, j) => (x === null ? [`${i}:${j}`] : [])));
    }
    return objs;
  });
  return {
    label: 'Données', code: lab.dataset.code.split('\n')[0] + (lab.dataset.code.includes('\n') ? ' …' : ''),
    vars: vars.map((v) => ({ name: v.name, ref: v.name })), heap,
    note: lab.lib === 'numpy' ? 'Les mêmes tableaux pour toutes les méthodes : `a` (4 × 3, entiers), `b` (avec **NaN**, en jaune), `v` (1D, avec des doublons).'
      : 'Le même DataFrame pour toutes les méthodes : texte, nombres, booléens, **NaN** (en jaune), un doublon (Bob / Lyon) et des ex æquo (15.5).',
  };
}

function simulate(lab: LabData, fam: LabFamily, p: Record<string, string | boolean>): SimResult {
  const m = fam.methods.find((x) => x.id === p.method) ?? fam.methods[0];
  const combo = m.params.map((q) => String(p[pid(m, q)] ?? q.default));
  const entry = runs(lab.results[[m.id, ...combo].join('|')]);
  const ref = runs(lab.results[[m.id, ...m.params.map((q) => q.default)].join('|')]);
  const call = callOf(m, combo);
  const twoVersions = !!lab.versions;
  const version = twoVersions && p.version === 'p2' ? 'p2' : 'p3';
  const vname = lab.versions ? `pandas ${lab.versions[version]}` : `NumPy ${lab.numpy}`;
  const imports = lab.lib === 'numpy' ? 'import numpy as np' : 'import numpy as np\nimport pandas as pd';
  const code = `${imports}\n\n${lab.dataset.code}\n\nres = ${call}\nprint(res)`;
  const step0 = datasetStep(lab);
  const dataHeap = step0.heap.map((o) => ({ ...o, changed: [] }));
  if (!entry.p3) return { code, steps: [step0], alerts: [{ level: 'error', title: 'Combinaison absente', message: 'Relancer `scripts/lab/generate.py`.' }], verdict: m.doc };
  const run = (version === 'p2' && entry.p2) || entry.p3;
  const other = twoVersions ? (version === 'p2' ? entry.p3 : entry.p2) : undefined;
  const alerts: SimAlert[] = [];
  let output: string[];
  let heap: HeapObj[] = dataHeap;
  let vars = step0.vars;
  let note: string;

  if (run.error) {
    output = ['Traceback (most recent call last):', '  ...', `${run.error.type}: ${run.error.message}`];
    alerts.push({ level: 'error', atStep: 1, title: run.error.type, message: run.error.message.replace(/`/g, "'") });
    note = 'L’appel lève une exception : `res` n’est jamais créé.';
  } else {
    const r = run.result!;
    const refRes = ((version === 'p2' && ref.p2) || ref.p3)?.result;
    const isDefault = m.params.every((q, i) => combo[i] === q.default);
    let changed: string[] = [];
    if (!m.params.length) note = 'Cette méthode n’a pas de paramètre à faire varier ici.';
    else if (!isDefault && refRes) {
      const d = diffCells(r, refRes);
      if (d === null) note = `Par rapport aux paramètres par défaut, la **forme change** : ${shapeOf(refRes)} → ${shapeOf(r)}.`;
      else if (d.length === 0) note = 'Résultat **identique** à celui des paramètres par défaut : ici, ce réglage ne change rien (sur ces données).';
      else { changed = d; note = `En jaune : les **${d.length} valeur(s) qui changent** par rapport aux paramètres par défaut.`; }
    } else if (!isDefault) note = 'Avec les paramètres par défaut, cet appel lève une erreur : comparaison impossible.';
    else note = 'Paramètres **par défaut**. Change un réglage pour voir ce qui bouge (surligné en jaune).';
    heap = [...dataHeap, ...toObjs('res', r, { changed, badges: ['résultat'] })];
    vars = [...step0.vars, { name: 'res', ref: 'res' }];
    output = (run.printed ?? '').split('\n');
  }
  for (const w of run.warnings ?? []) alerts.push({ level: 'warning', atStep: 1, title: w.split(':')[0], message: w.slice(w.indexOf(':') + 1).trim().replace(/`/g, "'") });
  if (other && lab.versions) {
    const otherName = `pandas ${lab.versions[version === 'p2' ? 'p3' : 'p2']}`;
    const what = other.error ? `lève \`${other.error.type}\`` : run.error ? 'fonctionne' : other.printed !== run.printed ? 'affiche un résultat différent' : 'se comporte autrement (types ou avertissements)';
    alerts.push({ level: 'info', atStep: 1, title: 'Différence de version', message: `Le même appel ${what} en **${otherName}**. Bascule la version pour comparer.` });
  }
  return {
    code,
    steps: [step0, { label: m.label, code: `res = ${call}`, vars, heap, note: note!, inspect: 'res' }],
    output, alerts,
    verdict: `${m.doc} *(résultat exécuté avec ${vname})*`,
  };
}

/** Construit une fiche Labo à partir d'une famille de méthodes (cherchée dans tous les labos). */
export function labFiche(familyId: string, extra: Partial<Fiche> = {}): Fiche {
  const lab = LABS.find((l) => l.families.some((f) => f.id === familyId));
  const fam = lab?.families.find((f) => f.id === familyId);
  if (!lab || !fam) throw new Error(`famille de labo inconnue : ${familyId}`);
  const versionLabel = lab.versions ? `${lab.versions.p3} et ${lab.versions.p2}` : lab.numpy;
  const libName = lab.lib === 'numpy' ? 'NumPy' : 'pandas';
  const params: ParamDef[] = [
    { id: 'method', label: 'Méthode', type: 'choice', default: fam.methods[0].id, options: fam.methods.map((m) => ({ value: m.id, label: `\`${m.label}\``, help: m.doc })) },
    ...fam.methods.flatMap((m) => m.params.map((q): ParamDef => ({
      id: pid(m, q), label: q.label, type: 'choice', default: q.default, showIf: { method: m.id },
      options: q.options.map((o) => ({ value: o.code, label: label(o.code) + (o.code === q.default ? ' ·défaut' : ''), help: o.help })),
    }))),
    ...(lab.versions ? [{ id: 'version', label: 'Version de pandas', type: 'choice' as const, default: 'p3', options: [{ value: 'p3', label: `pandas ${lab.versions.p3}` }, { value: 'p2', label: `pandas ${lab.versions.p2}` }] }] : []),
  ];
  const sig = (m: LabMethod) => m.expr.replace('{args}', m.params.filter((q) => !m.expr.includes(`{${q.id}}`)).map((q) => (q.default === OMIT ? `${q.id}=…` : `${q.id}=${q.default}`)).join(', ')).replace(/\{(\w+)\}/g, '$1').replace(', )', ')');
  return defineFiche({
    id: `labo-${fam.id}`,
    title: fam.title,
    theme: lab.theme ?? 'pandas',
    tags: ['labo', ...fam.methods.map((m) => m.label.replace(/^np\./, '').replace(/\(.*$/, ''))],
    keywords: [...fam.methods.flatMap((m) => [m.label, m.label.replace(/\(.*$/, ''), ...m.params.map((q) => q.id)]), 'paramètres', 'laboratoire'],
    summary: fam.summary,
    concept: `Chaque combinaison de paramètres ci-dessous a été **exécutée par le vrai ${libName}** (${versionLabel}) : résultats, affichages, erreurs et avertissements sont réels.\n\n${fam.methods.map((m) => `- **\`${m.label}\`** : ${m.doc}`).join('\n')}`,
    syntax: fam.methods.map(sig).join('\n'),
    useCase: 'Choisis une méthode, puis change **un seul paramètre à la fois** : les valeurs qui bougent par rapport au réglage par défaut sont surlignées.',
    simulator: { title: 'Laboratoire — joue avec les paramètres', params, simulate: (p) => simulate(lab, fam, p) },
    source: `Labo généré avec ${libName} ${versionLabel} (scripts/lab/)`,
    ...extra,
  });
}
