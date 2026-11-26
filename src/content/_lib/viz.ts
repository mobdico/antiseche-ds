/**
 * Simulateurs de graphiques : chaque combinaison a été tracée par le VRAI matplotlib / seaborn
 * (scripts/viz/generate.py). L'image affichée est celle réellement produite.
 */
import type { ParamDef, SimAlert, Simulator } from '../../engine/types';
import data from '../_data/viz.json';

interface VParam { id: string; label: string; default: string; options: { code: string; help: string }[] }
interface VScenario { id: string; title: string; code: string; doc: string; params: VParam[] }
interface VRun { code: string; img?: string; stdout: string; error?: { type: string; message: string }; warnings?: string[] }
const VIZ = data as unknown as { versions: { matplotlib: string; seaborn: string }; scenarios: VScenario[]; results: Record<string, VRun> };

const label = (code: string, help: string, dup: boolean) => (code === '' ? '*(rien)*' : dup || code.includes('\n') || code.length > 48 ? help : `\`${code.replace(/^,\s*/, '')}\``);

export function vizSim(id: string): Simulator {
  const sc = VIZ.scenarios.find((s) => s.id === id);
  if (!sc) throw new Error(`scénario de graphique inconnu : ${id}`);
  const params: ParamDef[] = sc.params.map((q) => ({
    id: q.id, label: q.label, type: 'choice', default: q.default,
    options: q.options.map((o) => ({ value: o.code, label: label(o.code, o.help, q.options.some((x) => x !== o && x.code.trim() === o.code.trim())) + (o.code === q.default ? ' ·défaut' : ''), help: o.help })),
  }));
  return {
    title: `Simulateur — ${sc.title}`,
    params,
    simulate: (p) => {
      const combo = sc.params.map((q) => String(p[q.id] ?? q.default));
      const run = VIZ.results[[sc.id, ...combo].join('|')];
      if (!run) return { code: sc.code, steps: [{ label: '—', code: '', vars: [], heap: [] }], alerts: [{ level: 'error', title: 'Combinaison absente', message: 'Relancer `scripts/viz/generate.py`.' }] };
      const alerts: SimAlert[] = [];
      if (run.error) alerts.push({ level: 'error', title: run.error.type, message: run.error.message });
      for (const w of run.warnings ?? []) alerts.push({ level: 'warning', title: w.split(':')[0], message: w.slice(w.indexOf(':') + 1).trim() });
      return {
        code: run.code,
        steps: [{ label: 'Graphique', code: '', vars: [], heap: [], image: run.img ? { src: run.img, alt: sc.title } : undefined }],
        output: run.stdout ? run.stdout.replace(/\n$/, '').split('\n') : undefined,
        alerts,
        verdict: sc.doc,
      };
    },
  };
}

export const vizSims = (ids: string[]): Simulator[] => ids.map(vizSim);
