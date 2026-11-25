import { useLayoutEffect, useRef, useState } from 'react';
import type { HeapObj, Prim, Slot, SimStep } from '../engine/types';
import { fakeAddr, pyRepr } from '../engine/sim-helpers';

const PALETTE = 8; // nombre de couleurs définies en CSS (--obj-0 … --obj-7)

interface Props {
  step: SimStep;
  colorOf: (id: string) => number;
}

/** Profondeur de chaque objet depuis les variables (BFS) → colonne d'affichage. */
function layoutColumns(step: SimStep): HeapObj[][] {
  const byId = new Map(step.heap.map((o) => [o.id, o]));
  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const vr of step.vars) if (!depth.has(vr.ref)) { depth.set(vr.ref, 1); queue.push(vr.ref); }
  while (queue.length) {
    const id = queue.shift()!;
    const o = byId.get(id);
    if (!o) continue;
    const refs = [...(o.items ?? []), ...(o.fields ?? []).map((f) => f.slot)]
      .filter((s): s is { ref: string } => 'ref' in s).map((s) => s.ref);
    for (const r of refs) if (!depth.has(r)) { depth.set(r, depth.get(id)! + 1); queue.push(r); }
  }
  const cols: HeapObj[][] = [];
  for (const o of step.heap) {
    const d = depth.get(o.id) ?? 1; // objet non référencé (temporaire) → 1re colonne
    (cols[d - 1] ??= []).push(o);
  }
  return cols.filter(Boolean);
}

function refCounts(step: SimStep): Map<string, number> {
  const m = new Map<string, number>();
  const add = (id: string) => m.set(id, (m.get(id) ?? 0) + 1);
  step.vars.forEach((v) => add(v.ref));
  step.heap.forEach((o) => [...(o.items ?? []), ...(o.fields ?? []).map((f) => f.slot)].forEach((s) => 'ref' in s && add(s.ref)));
  return m;
}

function Val({ x }: { x: Prim }) {
  const cls = x === null ? 'val-none' : typeof x === 'string' ? 'val-str' : typeof x === 'number' && Number.isNaN(x) ? 'val-none' : 'val-num';
  return <span className={cls}>{typeof x === 'number' && Number.isNaN(x) ? 'NaN' : pyRepr(x)}</span>;
}

function SlotView({ s, colorOf }: { s: Slot; colorOf: Props['colorOf'] }) {
  if ('ref' in s) return <span className="ref-dot" data-src={s.ref} style={{ ['--c' as string]: `var(--obj-${colorOf(s.ref) % PALETTE})` }} />;
  return <Val x={s.v} />;
}

function ObjView({ o, colorOf, count }: { o: HeapObj; colorOf: Props['colorOf']; count: number }) {
  const changed = new Set((o.changed ?? []).map(String));
  const color = `var(--obj-${colorOf(o.id) % PALETTE})`;
  return (
    <div className={`obj ${o.ghost ? 'ghost' : ''}`} data-obj={o.id} style={{ ['--c' as string]: color }}>
      <div className="obj-head">
        <span className="obj-type">{o.pyType}</span>
        <span className="obj-addr" title="id() de l'objet">{o.addr ?? fakeAddr(o.id)}</span>
        {count > 1 && <span className="badge badge-shared" title="nombre de références vers cet objet">{count} réf.</span>}
        {o.badges?.map((b) => <span key={b} className={`badge badge-${b.replace(/\W+/g, '-')}`}>{b}</span>)}
      </div>

      {o.kind === 'scalar' && <div className="obj-scalar"><Val x={o.value ?? null} /></div>}

      {o.kind === 'sequence' && (
        <div className="seq">
          {(o.items ?? []).map((s, i) => (
            <div key={i} className={`seq-cell ${changed.has(String(i)) ? 'changed' : ''}`}>
              <span className="seq-idx">{i}</span>
              <span className="seq-val"><SlotView s={s} colorOf={colorOf} /></span>
            </div>
          ))}
          {!(o.items ?? []).length && <span className="muted">vide</span>}
        </div>
      )}

      {o.kind === 'table' && o.table && (
        <table className="df">
          <thead>
            <tr><th />{o.table.columns.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {o.table.rows.map((row, i) => (
              <tr key={i}>
                <th>{o.table!.index[i]}</th>
                {row.map((x, j) => <td key={j} className={changed.has(`${i}:${j}`) ? 'changed' : ''}><Val x={x} /></td>)}
              </tr>
            ))}
            {!o.table.rows.length && <tr><td colSpan={o.table.columns.length + 1} className="muted">vide</td></tr>}
          </tbody>
        </table>
      )}

      {!!o.fields?.length && (
        <div className="fields">
          {o.fields.map((f) => (
            <div key={f.label} className="field">
              <span className="field-label">{f.label}</span>
              <SlotView s={f.slot} colorOf={colorOf} />
              {f.hint && <span className="field-hint">{f.hint}</span>}
            </div>
          ))}
        </div>
      )}
      {o.note && <div className="obj-note">{o.note}</div>}
    </div>
  );
}

interface Arrow { d: string; color: string; dashed: boolean }

export function MemoryDiagram({ step, colorOf }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const cols = layoutColumns(step);
  const counts = refCounts(step);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const draw = () => {
      const base = el.getBoundingClientRect();
      const out: Arrow[] = [];
      el.querySelectorAll<HTMLElement>('[data-src]').forEach((src) => {
        const id = src.dataset.src!;
        const tgt = el.querySelector<HTMLElement>(`[data-obj="${CSS.escape(id)}"]`);
        if (!tgt) return;
        const a = src.getBoundingClientRect();
        const b = tgt.getBoundingClientRect();
        const x1 = a.left + a.width / 2 - base.left, y1 = a.top + a.height / 2 - base.top;
        let x2: number, y2: number, d: string;
        if (b.left >= a.right - 2) {
          x2 = b.left - base.left - 2; y2 = Math.min(b.top - base.top + 16, b.bottom - base.top - 8);
          const dx = Math.max(30, (x2 - x1) / 2);
          d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
        } else {
          // cible en dessous / à gauche (affichage étroit) : on arrive par le haut
          x2 = b.left - base.left + Math.min(28, b.width / 2); y2 = b.top - base.top - 2;
          d = `M${x1},${y1} C${x1 + 40},${y1 + 10} ${x2},${y2 - 40} ${x2},${y2}`;
        }
        out.push({ d, color: `var(--obj-${colorOf(id) % PALETTE})`, dashed: !!tgt.classList.contains('ghost') });
      });
      setArrows(out);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    el.querySelectorAll('.mem-col').forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [step, colorOf]);

  return (
    <div className="mem" ref={box}>
      <svg className="mem-arrows" aria-hidden>
        <defs>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
          </marker>
        </defs>
        {arrows.map((a, i) => (
          <path key={i} d={a.d} stroke={a.color} strokeDasharray={a.dashed ? '5 4' : undefined} fill="none" strokeWidth={2} markerEnd="url(#arrowhead)" />
        ))}
      </svg>
      <div className="mem-col mem-vars">
        <div className="mem-col-title">Variables</div>
        {step.vars.map((vr) => (
          <div key={vr.name} className="var">
            <code>{vr.name}</code>
            <span className="ref-dot" data-src={vr.ref} style={{ ['--c' as string]: `var(--obj-${colorOf(vr.ref) % PALETTE})` }} />
          </div>
        ))}
        {!step.vars.length && <span className="muted">aucune</span>}
      </div>
      {cols.map((col, i) => (
        <div key={i} className="mem-col">
          <div className="mem-col-title">{i === 0 ? 'Objets (tas)' : ' '}</div>
          {col.map((o) => <ObjView key={o.id} o={o} colorOf={colorOf} count={counts.get(o.id) ?? 0} />)}
        </div>
      ))}
    </div>
  );
}
