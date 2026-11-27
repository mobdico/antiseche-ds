import { describe, expect, it } from 'vitest';
import { drawSeries, quizCards } from '../src/content/_lib/quiz';
import { registry } from '../src/engine/registry';

const cards = quizCards();

describe('mode Devine', () => {
  it('génère des cartes pour pandas et NumPy', () => {
    expect(cards.filter((c) => c.lib === 'pandas').length).toBeGreaterThan(300);
    expect(cards.filter((c) => c.lib === 'numpy').length).toBeGreaterThan(100);
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
  });

  it('chaque question a une bonne réponse parmi des options distinctes', () => {
    for (const c of cards) {
      expect(c.questions.length, c.id).toBeGreaterThanOrEqual(1);
      for (const q of c.questions) {
        expect(q.options.length, c.id).toBeGreaterThanOrEqual(2);
        expect(new Set(q.options).size, c.id).toBe(q.options.length);
        expect(q.answer, c.id).toBeGreaterThanOrEqual(0);
        expect(q.answer, c.id).toBeLessThan(q.options.length);
      }
    }
  });

  it('la première question donne le bon type de résultat', () => {
    const vc = cards.find((c) => c.expr === 'df["ville"].value_counts()')!;
    expect(vc.questions[0].options[vc.questions[0].answer]).toBe('une Series');
    expect(vc.questions[2].options[vc.questions[2].answer]).toBe("`'count'`");
    const isn = cards.find((c) => c.expr === 'df.isnull().sum()')!;
    expect(isn.questions[0].options[isn.questions[0].answer]).toBe('une Series');
    expect(isn.questions[2].options[isn.questions[2].answer]).toBe('`None` (pas de nom)');
  });

  it('chaque carte renvoie vers une fiche existante', () => {
    for (const id of new Set(cards.map((c) => c.ficheId))) expect(registry.byId.has(id), id).toBe(true);
  });

  it('les ratées reviennent en priorité, sans doublon', () => {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const ko = cards.slice(0, 3);
    const history = Object.fromEntries(ko.map((c) => [c.id, { ok: 0, ko: 1, last: 'ko' as const, t: 1 }]));
    const s = drawSeries(cards, history, 10, rand);
    expect(s.length).toBe(10);
    expect(new Set(s.map((c) => c.id)).size).toBe(10);
    for (const c of ko) expect(s.map((x) => x.id)).toContain(c.id);
  });
});
