import { useEffect, useState } from 'react';
import type { SimStep } from '../engine/types';
import { inspectObj } from '../engine/inspect';
import { typeRefs } from '../content/types-reference';
import { inline } from '../lib/markdown';

/** Choix par défaut : step.inspect, sinon « res », sinon la dernière variable. */
function defaultVar(step: SimStep): string | undefined {
  const names = step.vars.map((v) => v.name);
  if (step.inspect && names.includes(step.inspect)) return step.inspect;
  if (names.includes('res')) return 'res';
  return names[names.length - 1];
}

export function Inspector({ step }: { step: SimStep }) {
  const [picked, setPicked] = useState<string | undefined>(() => defaultVar(step));
  useEffect(() => setPicked(defaultVar(step)), [step]);
  const vr = step.vars.find((v) => v.name === picked) ?? step.vars[step.vars.length - 1];
  const obj = vr && step.heap.find((o) => o.id === vr.ref);
  if (!vr || !obj) return null;
  const { type, attrs } = inspectObj(obj);
  const ref = typeRefs[type] ?? typeRefs[obj.pyType];

  return (
    <div className="inspector">
      <div className="insp-head">
        <span className="panel-title">🔎 Inspecteur</span>
        <div className="insp-tabs" role="tablist">
          {step.vars.map((v) => (
            <button key={v.name} role="tab" aria-selected={v.name === vr.name} className={v.name === vr.name ? 'on' : ''} onClick={() => setPicked(v.name)}>
              <code>{v.name}</code>
            </button>
          ))}
        </div>
      </div>
      <div className="insp-body">
        <div className="insp-type">
          <code>type({vr.name})</code> → <code className="insp-t">{type}</code>
          {ref && <span className="muted"> — {inline(ref.summary)}</span>}
        </div>
        {attrs.length > 0 && (
          <dl className="insp-attrs">
            {attrs.map((a) => (
              <div key={a.name}><dt><code>{vr.name}{a.name.startsWith('.') ? a.name : ` ${a.name}`}</code></dt><dd><code>{a.value.startsWith('@ref:') ? `${step.vars.find((v) => v.ref === a.value.slice(5))?.name ?? 'objet'}  (même mémoire)` : a.value}</code></dd></div>
            ))}
          </dl>
        )}
        {ref && ref.methods.length > 0 && (
          <details className="insp-methods" open>
            <summary>Méthodes utiles sur un <code>{ref.fullName}</code> ({ref.methods.length})</summary>
            <ul>{ref.methods.map((m) => <li key={m.sig}><code>{m.sig}</code> <span className="muted">{inline(m.desc)}</span></li>)}</ul>
          </details>
        )}
      </div>
    </div>
  );
}
