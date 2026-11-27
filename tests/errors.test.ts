import { describe, expect, it } from 'vitest';
import { EXPLAIN, errorCaseIds, errorEntries, searchErrors } from '../src/content/errors';
import { registry } from '../src/engine/registry';

describe('messages d’erreur', () => {
  it('chaque explication correspond à un cas exécuté, et inversement', () => {
    expect(Object.keys(EXPLAIN).sort()).toEqual([...errorCaseIds].sort());
  });
  it('chaque cas lève vraiment une erreur dans au moins une version', () => {
    for (const e of errorEntries) expect(e.p3 ?? e.p2, e.id).toBeTruthy();
  });
  it('les fiches liées existent', () => {
    for (const e of errorEntries) for (const id of e.fiches) expect(registry.byId.has(id), `${e.id} → ${id}`).toBe(true);
  });
  it('un message collé retrouve son erreur', () => {
    expect(searchErrors("The truth value of a Series is ambiguous")[0].id).toBe('truth-ambiguous');
    expect(searchErrors("'int' object is not callable").map((e) => e.id)).toContain('not-callable');
    expect(searchErrors('SettingWithCopyWarning').map((e) => e.id)).toContain('chained-assignment');
    expect(searchErrors('groupby')).toEqual([]); // un mot qui n’est pas dans un message ne déclenche rien
  });
});
