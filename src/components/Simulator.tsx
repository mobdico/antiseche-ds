import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ParamDef, ParamValues, Simulator as Sim, SimAlert } from '../engine/types';
import { MemoryDiagram } from './MemoryDiagram';
import { Inspector } from './Inspector';
import { Code } from '../lib/highlight';
import { inline } from '../lib/markdown';

const ICON: Record<SimAlert['level'], string> = { error: '⛔', warning: '⚠️', info: 'ℹ️', success: '✅' };

export function defaultParams(sim: Sim): ParamValues {
  return Object.fromEntries(sim.params.map((p) => [p.id, p.default]));
}

export function isVisible(p: ParamDef, values: ParamValues): boolean {
  if (!p.showIf) return true;
  return Object.entries(p.showIf).every(([k, want]) => (Array.isArray(want) ? want : [want]).includes(values[k]));
}

export function SimulatorView({ sim }: { sim: Sim }) {
  const [params, setParams] = useState<ParamValues>(() => defaultParams(sim));
  const result = useMemo(() => sim.simulate(params), [sim, params]);
  const last = result.steps.length - 1;
  const [stepIdx, setStepIdx] = useState(last);
  const [playing, setPlaying] = useState(false);

  // à chaque changement de paramètre on montre l'état final
  useEffect(() => { setStepIdx(result.steps.length - 1); setPlaying(false); }, [result]);
  useEffect(() => {
    if (!playing) return;
    if (stepIdx >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setStepIdx((i) => i + 1), 1100);
    return () => clearTimeout(t);
  }, [playing, stepIdx, last]);

  // couleur stable d'un objet = ordre de 1re apparition sur toutes les étapes
  const colorMap = useMemo(() => {
    const m = new Map<string, number>();
    result.steps.forEach((s) => s.heap.forEach((o) => { if (!m.has(o.id)) m.set(o.id, m.size); }));
    return m;
  }, [result]);
  const colorOf = useCallback((id: string) => colorMap.get(id) ?? 0, [colorMap]);

  const step = result.steps[Math.min(stepIdx, last)];
  const set = (id: string, val: string | boolean) => setParams((p) => ({ ...p, [id]: val }));

  return (
    <section className="sim card">
      <div className="sim-head">
        <h2>🧪 {sim.title ?? 'Simulateur'}</h2>
        <button className="btn-ghost" onClick={() => setParams(defaultParams(sim))}>Réinitialiser</button>
      </div>

      <div className="params">
        {sim.params.filter((p) => isVisible(p, params)).map((p) => (
          <div key={p.id} className="param">
            <div className="param-label">{p.label}{p.help && <span className="param-help" title={p.help}>?</span>}</div>
            {p.type === 'choice' ? (
              <div className="seg" role="radiogroup" aria-label={p.label}>
                {p.options.map((o) => (
                  <button key={o.value} role="radio" aria-checked={params[p.id] === o.value}
                    className={params[p.id] === o.value ? 'on' : ''} title={o.help} onClick={() => set(p.id, o.value)}>
                    {inline(o.label)}
                  </button>
                ))}
              </div>
            ) : (
              <label className="switch">
                <input type="checkbox" checked={!!params[p.id]} onChange={(e) => set(p.id, e.target.checked)} />
                <span className="switch-track" />
                <span>{inline((params[p.id] ? p.onLabel : p.offLabel) ?? (params[p.id] ? 'Oui' : 'Non'))}</span>
              </label>
            )}
            {p.type === 'choice' && (() => {
              const h = p.options.find((o) => o.value === params[p.id])?.help;
              return h ? <div className="param-hint">{inline(h)}</div> : null;
            })()}
          </div>
        ))}
      </div>

      <div className="sim-grid">
        <div className="sim-code">
          <div className="panel-title">Code</div>
          <Code code={result.code} activeLine={step.line} />
          {!!result.output?.length && (
            <>
              <div className="panel-title">Sortie</div>
              <pre className="console">{result.output.join('\n')}</pre>
            </>
          )}
        </div>

        <div className="sim-mem">
          <div className="steps">
            <button className="btn-ghost" aria-label="lecture pas à pas"
              onClick={() => { if (stepIdx >= last) setStepIdx(0); setPlaying((x) => !x); }}>
              {playing ? '⏸' : '▶'}
            </button>
            {result.steps.map((s, i) => (
              <button key={i} className={`step ${i === stepIdx ? 'on' : ''} ${i < stepIdx ? 'past' : ''}`}
                onClick={() => { setPlaying(false); setStepIdx(i); }}>
                <span className="step-n">{i + 1}</span>{s.label}
              </button>
            ))}
          </div>
          <div className="step-code"><Code code={step.code} className="inline" /></div>
          <MemoryDiagram step={step} colorOf={colorOf} />
          {step.note && <p className="step-note">{inline(step.note)}</p>}
          <Inspector step={step} />
        </div>
      </div>

      {(!!result.alerts?.length || result.verdict) && (
        <div className="alerts">
          {result.alerts?.filter((a) => (a.atStep ?? 0) <= stepIdx).map((a, i) => (
            <div key={i} className={`alert alert-${a.level}`}>
              <div className="alert-title">{ICON[a.level]} {a.title}</div>
              <div>{inline(a.message)}</div>
            </div>
          ))}
          {result.verdict && stepIdx === last && <div className="verdict">👉 {inline(result.verdict)}</div>}
        </div>
      )}
    </section>
  );
}
