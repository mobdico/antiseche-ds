/**
 * Garde-fou du contenu : ces tests passent sur TOUTES les fiches, automatiquement.
 * Lancer `npm test` avant chaque push : une fiche cassée est détectée immédiatement.
 */
import { describe, expect, it } from 'vitest';
import { registry } from '../src/engine/registry';
import type { ParamDef, ParamValues, SimResult, Simulator } from '../src/engine/types';

/** Toutes les combinaisons de paramètres VISIBLES (respecte showIf). */
function combos(params: ParamDef[]): ParamValues[] {
  const visible = (p: ParamDef, c: ParamValues) => !p.showIf || Object.entries(p.showIf).every(([k, w]) => (Array.isArray(w) ? w : [w]).includes(c[k]));
  let out: ParamValues[] = [Object.fromEntries(params.map((p) => [p.id, p.default]))];
  for (const p of params) {
    const vals: (string | boolean)[] = p.type === 'choice' ? p.options.map((o) => o.value) : [false, true];
    out = out.flatMap((c) => (visible(p, c) ? vals.map((v) => ({ ...c, [p.id]: v })) : [c]));
  }
  return out;
}

function checkResult(r: SimResult) {
  expect(r.code.length).toBeGreaterThan(0);
  expect(r.steps.length).toBeGreaterThan(0);
  for (const s of r.steps) {
    const ids = new Set(s.heap.map((o) => o.id));
    expect(ids.size, `ids dupliqués dans « ${s.label} »`).toBe(s.heap.length);
    for (const v of s.vars) expect(ids.has(v.ref), `variable ${v.name} → objet absent ${v.ref}`).toBe(true);
    for (const o of s.heap) {
      for (const slot of [...(o.items ?? []), ...(o.fields ?? []).map((f) => f.slot)])
        if ('ref' in slot) expect(ids.has(slot.ref), `${o.id} → objet absent ${slot.ref}`).toBe(true);
      if (o.table) {
        expect(o.table.index.length, `${o.id} : index / lignes`).toBe(o.table.rows.length);
        for (const row of o.table.rows) expect(row.length, `${o.id} : colonnes`).toBe(o.table.columns.length);
        if (o.rowColors) expect(o.rowColors.length, `${o.id} : rowColors`).toBe(o.table.rows.length);
      }
    }
  }
  for (const a of r.alerts ?? []) {
    expect(a.atStep ?? 0).toBeLessThan(r.steps.length);
    expect(a.title, 'combinaison de labo absente').not.toBe('Combinaison absente');
  }
}

describe('registre', () => {
  it('aucun problème de contenu (ids, thèmes, liens)', () => {
    expect(registry.issues).toEqual([]);
  });
});

for (const f of registry.fiches) {
  describe(`fiche ${f.id}`, () => {
    it('champs obligatoires', () => {
      expect(f.title && f.summary && f.concept && f.syntax).toBeTruthy();
      expect(f.tags.length).toBeGreaterThan(0);
    });
    const sims = [f.simulator, ...(f.simulators ?? [])].filter(Boolean) as Simulator[];
    sims.forEach((sim, k) => {
      it(`simulateur ${k + 1} : toutes les combinaisons de paramètres`, () => {
        for (const c of combos(sim.params)) {
          const r = sim.simulate(c);
          checkResult(r);
          expect(sim.simulate(c)).toEqual(r); // fonction pure
        }
      });
    });
  });
}
