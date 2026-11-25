import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ParamDef, ParamValues, Simulator as Sim, SimAlert } from '../engine/types';
import { MemoryDiagram } from './MemoryDiagram';
import { Inspector } from './Inspector';
import { Code } from '../lib/highlight';
import { inline } from '../lib/markdown';

const LEVEL: Record<SimAlert['level'], string> = { error: 'Erreur', warning: 'Attention', info: 'À savoir', success: 'OK' };

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
  const goStep = (i: number) => { setPlaying(false); setStepIdx(Math.max(0, Math.min(last, i))); };
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => { stripRef.current?.querySelector('.step.on')?.scrollIntoView({ block: 'nearest', inline: 'center' }); }, [stepIdx]);
  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goStep(stepIdx + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goStep(stepIdx - 1); }
  };
  const isDefault = sim.params.every((p) => params[p.id] === p.default);

  return (
    <section className="sim" tabIndex={-1} onKeyDown={onKey} aria-label={sim.title ?? 'Simulateur'}>
      <div className="sim-head">
        <h2>{sim.title?.replace(/^Simulateur — /, '') ?? 'Simulateur'}</h2>
        <button className="btn-ghost sm" onClick={() => setParams(defaultParams(sim))} disabled={isDefault}>Réinitialiser</button>
      </div>

      {sim.params.length > 0 && (
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
      )}

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
          {result.steps.length > 1 && (
            <div className="stepper">
              <div className="stepper-bar">
                <button className="icon-btn sm" aria-label={playing ? 'Pause' : 'Lecture pas à pas'} onClick={() => { if (stepIdx >= last) setStepIdx(0); setPlaying((x) => !x); }}>
                  {playing ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z" /></svg>}
                </button>
                <button className="icon-btn sm" aria-label="Étape précédente" onClick={() => goStep(stepIdx - 1)} disabled={stepIdx === 0}>‹</button>
                <button className="icon-btn sm" aria-label="Étape suivante" onClick={() => goStep(stepIdx + 1)} disabled={stepIdx === last}>›</button>
                <span className="stepper-count">Étape <strong>{stepIdx + 1}</strong> / {last + 1}</span>
                <span className="stepper-hint">← → au clavier</span>
              </div>
              <div className="progress"><span style={{ width: `${((stepIdx + 1) / (last + 1)) * 100}%` }} /></div>
              <div className="steps" ref={stripRef}>
                {result.steps.map((s, i) => (
                  <button key={i} className={`step ${i === stepIdx ? 'on' : ''} ${i < stepIdx ? 'past' : ''}`} onClick={() => goStep(i)}>
                    <span className="step-n">{i + 1}</span>{s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step.code && <div className="step-code"><Code code={step.code} className="inline" /></div>}
          {step.image && <figure className="sim-figure"><img src={step.image.src} alt={step.image.alt} loading="lazy" /></figure>}
          {(step.vars.length > 0 || !step.image) && <MemoryDiagram step={step} colorOf={colorOf} />}
          {step.note && <p className="step-note">{inline(step.note)}</p>}
          <Inspector step={step} />
        </div>
      </div>

      {(!!result.alerts?.length || result.verdict) && (
        <div className="alerts">
          {result.alerts?.filter((a) => (a.atStep ?? 0) <= stepIdx).map((a, i) => (
            <div key={i} className={`alert alert-${a.level}`}>
              <div className="alert-title"><span className="alert-tag">{LEVEL[a.level]}</span>{a.title}</div>
              <div>{inline(a.message)}</div>
            </div>
          ))}
          {result.verdict && stepIdx === last && <div className="verdict"><span className="label">En résumé</span><div>{inline(result.verdict)}</div></div>}
        </div>
      )}
    </section>
  );
}
