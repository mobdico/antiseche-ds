/**
 * Mode « Devine » : des questions générées à partir des résultats RÉELS des labos
 * (scripts/lab/generate.py). Aucune réponse n'est écrite à la main : elles viennent
 * de ce que pandas / NumPy ont vraiment renvoyé.
 */
import type { Prim } from '../../engine/types';
import { LABS, OMIT, callOf, runs, shapeStr, type LabData, type LabFamily, type LabMethod, type Res, type Run } from './lab';

export interface QuizQuestion {
  prompt: string;
  options: string[];
  answer: number; // index de la bonne option
}

export interface QuizCard {
  id: string;
  lib: 'pandas' | 'numpy';
  familyId: string;
  familyTitle: string;
  /** fiche où l'on peut rejouer l'opération */
  ficheId: string;
  dataset: string;
  expr: string;
  questions: QuizQuestion[];
  /** sortie réelle de print(res), ou le message d'erreur */
  printed: string;
  /** explication affichée après la réponse (markdown léger) */
  explain: string;
  /** différence de comportement avec l'autre version de pandas */
  versionNote?: string;
  /** famille rédigée exprès pour comparer des notions : tirée plus souvent */
  curated: boolean;
}

const FICHE_OF: Record<string, string> = { formes: 'pandas-formes', 'map-apply': 'pandas-transformer' };
const CURATED = new Set(['formes', 'map-apply', 'np-forme', 'np-agreger']);

// ------------------------------------------------------------------ hasard déterministe (même ordre à chaque affichage)
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function shuffled<T>(xs: T[], seed: string): T[] {
  const a = [...xs];
  let h = hash(seed);
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/** Question à choix : la bonne réponse + jusqu'à 3 leurres distincts, mélangés. */
function question(prompt: string, correct: string, pool: string[], seed: string, same: (s: string) => string = (s) => s): QuizQuestion | null {
  // pas deux leurres « identiques » (ex. les mêmes étiquettes dans un autre ordre)
  const seenKeys = new Set([same(correct)]);
  const wrong = shuffled([...new Set(pool)], seed + 'w').filter((x) => { const k = same(x); if (x === correct || seenKeys.has(k)) return false; seenKeys.add(k); return true; }).slice(0, 3);
  if (!wrong.length) return null;
  const options = shuffled([correct, ...wrong], seed);
  return { prompt, options, answer: options.indexOf(correct) };
}

// ------------------------------------------------------------------ descriptions des formes
const code = (x: Prim | string) => `\`${x}\``;
const dims = (r: number, c: number) => `${r} ligne${r > 1 ? 's' : ''} × ${c} colonne${c > 1 ? 's' : ''}`;
const pyName = (x: string | number | null) => (x === null ? '`None` (pas de nom)' : typeof x === 'number' ? code(x) : code(`'${x}'`));
function idxDesc(index: (string | number | null)[]): string {
  if (index.length && index.every((v, i) => v === i)) return `${code(0)} à ${code(index.length - 1)} (index par défaut)`;
  const shown = index.slice(0, 4).map((v) => code(v === null ? 'NaN' : v)).join(', ');
  return index.length > 4 ? `${shown}, …` : shown || '(vide)';
}
/** deux listes d'étiquettes qui ne diffèrent que par l'ordre comptent pour un même leurre */
const sameLabels = (s: string) => s.split(', ').sort().join(', ');
const kindLabel = (r: Run, lib: 'pandas' | 'numpy'): string => {
  if (r.error) return 'une erreur';
  const k = r.result!.kind;
  if (k === 'scalar') return 'une valeur unique (scalaire)';
  if (k === 'tuple') return 'un tuple';
  if (k === 'ndarray') return lib === 'numpy' ? 'un ndarray' : 'un tableau NumPy / pandas';
  return k === 'Series' ? 'une Series' : 'un DataFrame';
};
const resShape = (r: Res): string | null =>
  r.kind === 'ndarray' ? shapeStr(r.shape ?? [r.values.length]) : r.kind === 'scalar' ? '() — un scalaire' : r.kind === 'DataFrame' ? dims(r.rows.length, r.columns.length) : null;

/** Toutes les combinaisons de paramètres d'une méthode (produit cartésien des options). */
function combos(m: LabMethod): string[][] {
  return m.params.reduce<string[][]>((acc, p) => acc.flatMap((c) => p.options.map((o) => [...c, o.code])), [[]]);
}

function explainOf(r: Run, m: LabMethod, combo: string[]): string {
  const helps = m.params.flatMap((p, i) => {
    const o = p.options.find((x) => x.code === combo[i]);
    // un paramètre laissé à sa valeur par défaut n'apporte rien à l'explication, sauf s'il est le seul
    const shown = combo[i] === OMIT ? `\`${p.id}\` non passé` : m.expr.includes(`{${p.id}}`) ? `\`${combo[i]}\`` : `\`${p.id}=${combo[i]}\``;
    return o && o.help && (m.params.length === 1 || combo[i] !== p.default) ? [`${shown} : ${o.help}`] : [];
  });
  const head = r.error ? `**${r.error.type}** : l’appel échoue, \`res\` n’est jamais créé.` : describe(r.result!);
  return helps.length ? `${head}\n\n${helps.map((h) => `- ${h}`).join('\n')}` : head;
}
function describe(r: Res): string {
  switch (r.kind) {
    case 'Series': return `Une **Series** de ${r.values.length} valeur(s). Index : ${idxDesc(r.index)}${r.indexName ? ` (nommé \`${r.indexName}\`)` : ''}. \`.name\` : ${pyName(r.name)}.`;
    case 'DataFrame': return `Un **DataFrame** de ${r.rows.length} ligne(s) × ${r.columns.length} colonne(s). Index : ${idxDesc(r.index)}${r.indexName ? ` (nommé \`${r.indexName}\`)` : ''}.`;
    case 'ndarray': return `Un **ndarray** de shape \`${shapeStr(r.shape ?? [r.values.length])}\` et de dtype \`${r.dtype}\`.`;
    case 'scalar': return `Une **valeur unique** de type \`${r.type}\`.`;
    default: return `Un **tuple** de ${r.items.length} éléments.`;
  }
}

// ------------------------------------------------------------------ génération
function buildCards(lab: LabData, fam: LabFamily): QuizCard[] {
  const lib = lab.lib === 'numpy' ? 'numpy' : 'pandas';
  const all: { m: LabMethod; combo: string[]; run: Run; other?: Run }[] = [];
  for (const m of fam.methods) {
    for (const combo of combos(m)) {
      const e = runs(lab.results[[m.id, ...combo].join('|')]);
      if (e.p3) all.push({ m, combo, run: e.p3, other: e.p2 });
    }
  }
  // leurres réalistes : pris parmi les vraies réponses du même labo
  const names = all.flatMap(({ run }) => (run.result?.kind === 'Series' ? [pyName(run.result.name)] : []));
  const indexes = all.flatMap(({ run }) => (run.result && (run.result.kind === 'Series' || run.result.kind === 'DataFrame') ? [idxDesc(run.result.index)] : []));
  const shapes = all.flatMap(({ run }) => (run.result ? [resShape(run.result)].filter((x): x is string => !!x) : []));
  const errors = ['TypeError', 'ValueError', 'KeyError', 'AttributeError', 'IndexError', ...all.flatMap(({ run }) => (run.error ? [run.error.type] : []))];
  const kinds = lib === 'numpy'
    ? ['un ndarray', 'une valeur unique (scalaire)', 'une erreur', 'un tuple']
    : ['une Series', 'un DataFrame', 'une valeur unique (scalaire)', 'une erreur'];
  const frame = lab.dataset.frame;
  const colNames = frame && frame.kind === 'DataFrame' ? frame.columns : [];
  const dfDefaults = frame && frame.kind === 'DataFrame' ? [idxDesc(frame.index), idxDesc(frame.columns), dims(frame.rows.length, frame.columns.length)] : [];

  return all.map(({ m, combo, run, other }) => {
    const expr = callOf(m, combo);
    const id = `${fam.id}|${m.id}|${combo.join('|')}`;
    const qs: (QuizQuestion | null)[] = [question('Que renvoie cette expression ?', kindLabel(run, lib), kinds, id + 'k')];
    const r = run.result;
    if (run.error) qs.push(question('Quelle exception ?', run.error.type, errors, id + 'e'));
    else if (r?.kind === 'Series') {
      qs.push(question('Que contient l’index ?', idxDesc(r.index), [...indexes, ...dfDefaults.slice(0, 2)], id + 'i', sameLabels));
      qs.push(question('Que vaut `.name` ?', pyName(r.name), [...names, pyName(null), pyName('count'), ...colNames.map(pyName)], id + 'n'));
    } else if (r?.kind === 'DataFrame') {
      const [nr, nc] = [r.rows.length, r.columns.length];
      const near = [dims(nc, nr), dims(nr + 1, nc), dims(Math.max(nr - 1, 1), nc), dims(nr, nc + 1), dims(nr, Math.max(nc - 1, 1))];
      qs.push(question('Quelle forme ?', resShape(r)!, [...near, ...dfDefaults.slice(2)], id + 's'));
      if (!r.index.every((v, i) => v === i) || r.indexName) qs.push(question('Que contient l’index ?', idxDesc(r.index), [...indexes, ...dfDefaults.slice(0, 2)], id + 'i', sameLabels));
    } else if (r && (r.kind === 'ndarray' || r.kind === 'scalar') && lib === 'numpy') {
      const sh = resShape(r)!;
      const base = r.kind === 'ndarray' ? r.shape ?? [r.values.length] : [];
      const near = ['(4, 3)', '(3, 4)', '(12,)', '(4,)', '(3,)', '(1, 3)', '(4, 1)', '() — un scalaire', ...(base.length ? [shapeStr([...base].reverse())] : [])];
      qs.push(question('Quelle shape ?', sh, [...near, ...shapes], id + 's'));
    }

    let versionNote: string | undefined;
    if (other && lab.versions) {
      const a = kindLabel(run, lib), b = kindLabel(other, lib);
      // seules les différences de NATURE du résultat sont signalées (pas le dtype texte, différent partout)
      if (a !== b) versionNote = `En pandas ${lab.versions.p2}, le même appel renvoie **${b}**${other.error ? ` (\`${other.error.type}\`)` : ''}.`;
    }
    return {
      id, lib, familyId: fam.id, familyTitle: fam.title, ficheId: FICHE_OF[fam.id] ?? `labo-${fam.id}`,
      dataset: lab.dataset.code, expr, questions: qs.filter((q): q is QuizQuestion => !!q),
      printed: run.error ? `${run.error.type}: ${run.error.message}` : run.printed ?? '',
      explain: explainOf(run, m, combo), versionNote, curated: CURATED.has(fam.id),
    };
  });
}

let cache: QuizCard[] | null = null;
export function quizCards(): QuizCard[] {
  if (!cache) cache = LABS.flatMap((lab) => lab.families.flatMap((fam) => buildCards(lab, fam)));
  return cache;
}

// ------------------------------------------------------------------ tirage d'une série
export interface QuizRecord { ok: number; ko: number; last: 'ok' | 'ko'; t: number }
export type QuizHistory = Record<string, QuizRecord>;

/**
 * Tire `n` cartes : d'abord celles ratées la dernière fois (à revoir), puis des cartes jamais vues,
 * puis les plus anciennes. Une famille au hasard à chaque tirage, pour varier les sujets.
 */
export function drawSeries(cards: QuizCard[], history: QuizHistory, n: number, rand: () => number = Math.random): QuizCard[] {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const out: QuizCard[] = [];
  const used = new Set<string>();
  const missed = cards.filter((c) => history[c.id]?.last === 'ko');
  for (const c of [...missed].sort(() => rand() - 0.5).slice(0, Math.ceil(n / 2))) { out.push(c); used.add(c.id); }
  const byFamily = new Map<string, QuizCard[]>();
  for (const c of cards) byFamily.set(c.familyId, [...(byFamily.get(c.familyId) ?? []), c]);
  // les familles rédigées pour comparer comptent double
  const families = [...byFamily.keys()].flatMap((f) => (byFamily.get(f)![0].curated ? [f, f] : [f]));
  let guard = 0;
  while (out.length < Math.min(n, cards.length) && guard++ < 500) {
    const fam = byFamily.get(pick(families))!.filter((c) => !used.has(c.id));
    if (!fam.length) continue;
    const unseen = fam.filter((c) => !history[c.id]);
    const c = unseen.length ? pick(unseen) : [...fam].sort((a, b) => history[a.id].t - history[b.id].t)[0];
    out.push(c); used.add(c.id);
  }
  return out;
}
