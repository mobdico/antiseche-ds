/**
 * Simulateurs « tracés » : chaque combinaison a été exécutée ligne par ligne par le VRAI Python
 * (scripts/trace/trace.py). Les étapes, adresses mémoire, sorties et erreurs sont réelles.
 */
import type { HeapObj, ParamDef, SimAlert, SimResult, SimStep, Simulator } from '../../engine/types';
import data from '../_data/trace-python-core.json';

interface TParam { id: string; label: string; default: string; options: { code: string; help: string }[] }
interface TScenario { id: string; title: string; code: string; doc: string; params: TParam[] }
interface TStep { label: string; code: string; line: number; vars: { name: string; ref: string }[]; heap: HeapObj[]; stdout: string; failed?: boolean }
interface TRun { code: string; steps: TStep[]; stdout: string; error?: { type: string; message: string; line: number | null; traceback?: string[] }; truncated?: boolean }

const TRACE = data as unknown as { python: string; scenarios: TScenario[]; results: Record<string, TRun> };

/** Libellé du bouton : le code s'il tient sur une ligne, sinon la description. */
const show = (code: string, help: string) => (code === '' ? '*(rien)*' : code.trim().includes('\n') ? help : `\`${code.trim().replace(/^,\s*/, '')}\``);

function simulate(sc: TScenario, p: Record<string, string | boolean>): SimResult {
  const combo = sc.params.map((q) => String(p[q.id] ?? q.default));
  const run = TRACE.results[[sc.id, ...combo].join('|')];
  if (!run) return { code: sc.code, steps: [{ label: '—', code: '', vars: [], heap: [] }], alerts: [{ level: 'error', title: 'Combinaison absente', message: 'Relancer `scripts/trace/trace.py`.' }] };
  const lines = run.code.split('\n');
  const steps: SimStep[] = run.steps.map((s) => ({
    label: s.label, code: s.code, vars: s.vars, heap: s.heap, line: s.line,
    note: s.stdout ? `Sortie à cette étape : \`${s.stdout.trimEnd().split('\n').slice(-2).join(' ⏎ ')}\`` : undefined,
  }));
  const alerts: SimAlert[] = [];
  if (!steps.length) {
    // erreur de syntaxe : rien ne s'exécute
    steps.push({ label: 'Lecture du code', code: run.error?.line ? lines[run.error.line - 1] : run.code, vars: [], heap: [],
      note: 'Python lit **tout le fichier avant de l’exécuter** : une erreur de syntaxe empêche même la 1re ligne de tourner.' });
  }
  if (run.error) {
    const last = steps.length - 1;
    alerts.push({ level: 'error', atStep: last, title: run.error.type, message: `${run.error.message}${run.error.line ? ` *(ligne ${run.error.line} : \`${lines[run.error.line - 1]?.trim()}\`)*` : ''}` });
    if (run.error.type === 'SyntaxError' || run.error.type === 'IndentationError')
      alerts.push({ level: 'info', atStep: last, title: 'Erreur de syntaxe', message: 'Détectée **avant** l’exécution : aucune ligne n’a tourné, aucune variable n’existe.' });
    else alerts.push({ level: 'info', atStep: last, title: 'Erreur d’exécution', message: 'Les lignes précédentes **ont été exécutées** ; le programme s’arrête à la ligne fautive.' });
  }
  if (run.truncated) alerts.push({ level: 'info', title: 'Trace tronquée', message: 'Seules les 60 premières étapes sont affichées.' });
  const output = run.error ? [...run.stdout.split('\n').filter((l, i, a) => l || i < a.length - 1), ...(run.error.traceback ?? ['Traceback (most recent call last):', '  ...', `${run.error.type}: ${run.error.message}`])] : run.stdout.replace(/\n$/, '').split('\n');
  return { code: run.code, steps, output, alerts, verdict: `${sc.doc} *(exécuté avec Python ${TRACE.python})*` };
}

/** Simulateur tracé à partir d'un scénario de scripts/trace/scenarios_python_core.py. */
export function traceSim(id: string): Simulator {
  const sc = TRACE.scenarios.find((s) => s.id === id);
  if (!sc) throw new Error(`scénario tracé inconnu : ${id}`);
  const params: ParamDef[] = sc.params.map((q) => ({
    id: q.id, label: q.label, type: 'choice', default: q.default,
    options: q.options.map((o) => {
      const dup = q.options.some((x) => x !== o && x.code.trim() === o.code.trim());
      return { value: o.code, label: (dup ? o.help : show(o.code, o.help)) + (o.code === q.default ? ' ·défaut' : ''), help: o.help };
    }),
  }));
  return { title: `Simulateur — ${sc.title}`, params, simulate: (p) => simulate(sc, p) };
}

export const traceSims = (ids: string[]): Simulator[] => ids.map(traceSim);
