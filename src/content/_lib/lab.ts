/**
 * Fiches « Labo » : chaque combinaison de paramètres a été exécutée par le VRAI pandas
 * (scripts/lab/generate.py) ; ce module ne fait qu'afficher les résultats enregistrés.
 */
import type { Fiche, HeapObj, ParamDef, Prim, SimAlert, SimResult } from '../../engine/types';
import { defineFiche } from '../../engine/types';
import data from '../_data/labo-pandas.json';
import { frameObj, seriesObj, type Dtype, type Frame } from './pandas-sim';
import { arr1 } from './numpy-sim';

const OMIT = '__omit__';

interface LabParam { id: string; label: string; default: string; options: { code: string; help: string }[] }
interface LabMethod { id: string; label: string; expr: string; doc: string; params: LabParam[] }
interface LabFamily { id: string; title: string; summary: string; methods: LabMethod[] }
type Res =
  | { kind: 'DataFrame'; columns: string[]; index: (string | number)[]; rows: Prim[][]; dtypes: string[]; indexName: string | null }
  | { kind: 'Series'; name: string | null; index: (string | number | null)[]; values: Prim[]; dtype: string; indexName: string | null }
  | { kind: 'ndarray'; values: Prim[]; dtype: string; type?: string }
  | { kind: 'scalar'; type: string; value: Prim };
interface Run { result?: Res; printed?: string; error?: { type: string; message: string }; warnings?: string[] }
interface Entry { p3: Run; p2?: Run }

const LAB = data as unknown as { versions: { p3: string; p2: string }; dataset: { code: string; frame: Res }; families: LabFamily[]; results: Record<string, Entry> };

const pid = (m: LabMethod, p: LabParam) => `${m.id}__${p.id}`;
const label = (code: string) => (code === OMIT ? 'non passé' : `\`${code}\``);

function toFrame(r: Extract<Res, { kind: 'DataFrame' }>): Frame {
  return { columns: r.columns, index: r.index, rows: r.rows, dtypes: r.dtypes as Dtype[], indexName: r.indexName ?? undefined };
}

function toObj(id: string, r: Res, extra: Partial<HeapObj> = {}): HeapObj {
  switch (r.kind) {
    case 'DataFrame': return frameObj(id, toFrame(r), extra);
    case 'Series': return seriesObj(id, { name: r.name, index: r.index.map((x) => (x === null ? 'NaN' : x)), values: r.values, dtype: r.dtype as Dtype, indexName: r.indexName ?? undefined }, extra);
    case 'ndarray': return arr1(id, r.values, r.dtype as 'int64', { fullType: r.type, pyType: r.type ? 'ExtensionArray' : 'ndarray', ...extra });
    default: return { id, pyType: r.type.split('.').pop() ?? r.type, fullType: r.type, kind: 'scalar', value: r.value, ...extra };
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
  return null;
}

const shapeOf = (r: Res) => (r.kind === 'DataFrame' ? `(${r.rows.length}, ${r.columns.length})` : r.kind === 'scalar' ? 'un scalaire' : `(${r.values.length},)`);

function simulate(fam: LabFamily, p: Record<string, string | boolean>): SimResult {
  const m = fam.methods.find((x) => x.id === p.method) ?? fam.methods[0];
  const combo = m.params.map((q) => String(p[pid(m, q)] ?? q.default));
  const entry = LAB.results[[m.id, ...combo].join('|')];
  const ref = LAB.results[[m.id, ...m.params.map((q) => q.default)].join('|')];
  const args = m.params.map((q, i) => (combo[i] === OMIT ? '' : `${q.id}=${combo[i]}`)).filter(Boolean).join(', ');
  const call = m.expr.replace('{args}', args);
  const version = p.version === 'p2' ? 'p2' : 'p3';
  const vname = `pandas ${LAB.versions[version]}`;
  const code = `import numpy as np\nimport pandas as pd\n\n${LAB.dataset.code}\n\nres = ${call}\nprint(res)`;
  const dfFrame = toFrame(LAB.dataset.frame as Extract<Res, { kind: 'DataFrame' }>);
  const missing = dfFrame.rows.flatMap((row, i) => row.flatMap((x, j) => (x === null ? [`${i}:${j}`] : [])));
  const step0 = { label: 'df', code: 'df = pd.DataFrame({...})', vars: [{ name: 'df', ref: 'df' }], heap: [frameObj('df', dfFrame, { changed: missing })],
    note: 'Le même DataFrame pour toutes les méthodes : texte, nombres, booléens, **NaN** (en jaune), un doublon (Bob / Lyon) et des ex æquo (15.5).' };
  if (!entry) {
    return { code, steps: [step0], alerts: [{ level: 'error', title: 'Combinaison absente', message: 'Relancer `scripts/lab/generate.py`.' }], verdict: m.doc };
  }
  const run = (version === 'p2' && entry.p2) || entry.p3;
  const other = version === 'p2' ? entry.p3 : entry.p2;
  const alerts: SimAlert[] = [];
  let output: string[];
  let heap: HeapObj[] = [frameObj('df', dfFrame)];
  let vars = [{ name: 'df', ref: 'df' }];
  let note: string;

  if (run.error) {
    output = ['Traceback (most recent call last):', '  ...', `${run.error.type}: ${run.error.message}`];
    alerts.push({ level: 'error', atStep: 1, title: run.error.type, message: run.error.message.replace(/`/g, "'") });
    note = 'L’appel lève une exception : `res` n’est jamais créé.';
  } else {
    const r = run.result!;
    const refRes = ((version === 'p2' && ref?.p2) || ref?.p3)?.result;
    const isDefault = m.params.every((q, i) => combo[i] === q.default);
    let changed: string[] = [];
    if (!isDefault && refRes) {
      const d = diffCells(r, refRes);
      if (d === null) { note = `Par rapport aux paramètres par défaut, la **forme change** : ${shapeOf(refRes)} → ${shapeOf(r)}.`; }
      else if (d.length === 0) { note = 'Résultat **identique** à celui des paramètres par défaut : ici, ce réglage ne change rien (sur ces données).'; }
      else { changed = d; note = `En jaune : les **${d.length} valeur(s) qui changent** par rapport aux paramètres par défaut.`; }
    } else if (!isDefault) {
      note = 'Avec les paramètres par défaut, cet appel lève une erreur : comparaison impossible.';
    } else {
      note = 'Paramètres **par défaut** de pandas. Change un réglage pour voir ce qui bouge (surligné en jaune).';
    }
    heap = [frameObj('df', dfFrame), toObj('res', r, { changed, badges: ['résultat'] })];
    vars = [{ name: 'df', ref: 'df' }, { name: 'res', ref: 'res' }];
    output = (run.printed ?? '').split('\n');
  }
  for (const w of run.warnings ?? []) alerts.push({ level: 'warning', atStep: 1, title: w.split(':')[0], message: w.slice(w.indexOf(':') + 1).trim().replace(/`/g, "'") });
  if (other) {
    const otherName = `pandas ${LAB.versions[version === 'p2' ? 'p3' : 'p2']}`;
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

/** Construit une fiche Labo à partir d'une famille de méthodes du JSON. */
export function labFiche(familyId: string, extra: Partial<Fiche> = {}): Fiche {
  const fam = LAB.families.find((f) => f.id === familyId);
  if (!fam) throw new Error(`famille de labo inconnue : ${familyId}`);
  const params: ParamDef[] = [
    { id: 'method', label: 'Méthode', type: 'choice', default: fam.methods[0].id, options: fam.methods.map((m) => ({ value: m.id, label: `\`${m.label}\``, help: m.doc })) },
    ...fam.methods.flatMap((m) => m.params.map((q): ParamDef => ({
      id: pid(m, q), label: q.label, type: 'choice', default: q.default, showIf: { method: m.id },
      options: q.options.map((o) => ({ value: o.code, label: label(o.code) + (o.code === q.default ? ' ·défaut' : ''), help: o.help })),
    }))),
    { id: 'version', label: 'Version de pandas', type: 'choice', default: 'p3', options: [{ value: 'p3', label: `pandas ${LAB.versions.p3}` }, { value: 'p2', label: `pandas ${LAB.versions.p2}` }] },
  ];
  const sig = (m: LabMethod) => m.expr.replace('{args}', m.params.map((q) => (q.default === OMIT ? `${q.id}=…` : `${q.id}=${q.default}`)).join(', '));
  return defineFiche({
    id: `labo-${fam.id}`,
    title: fam.title,
    theme: 'pandas',
    tags: ['labo', ...fam.methods.map((m) => m.label.replace(/\(.*$/, ''))],
    keywords: [...fam.methods.flatMap((m) => [m.label, m.label.replace(/\(.*$/, ''), ...m.params.map((q) => q.id)]), 'paramètres', 'laboratoire'],
    summary: fam.summary,
    concept: `Chaque combinaison de paramètres ci-dessous a été **exécutée par le vrai pandas** (${LAB.versions.p3} et ${LAB.versions.p2}) : résultats, affichages, erreurs et avertissements sont réels.\n\n${fam.methods.map((m) => `- **\`${m.label}\`** : ${m.doc}`).join('\n')}`,
    syntax: fam.methods.map(sig).join('\n'),
    useCase: 'Choisis une méthode, puis change **un seul paramètre à la fois** : les valeurs qui bougent par rapport au réglage par défaut sont surlignées.',
    simulator: { title: 'Laboratoire — joue avec les paramètres', params, simulate: (p) => simulate(fam, p) },
    source: `Labo généré avec pandas ${LAB.versions.p3} et ${LAB.versions.p2} (scripts/lab/)`,
    ...extra,
  });
}
