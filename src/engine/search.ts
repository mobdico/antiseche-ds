import type { Fiche } from './types';

/** minuscules + suppression des accents */
export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

interface Indexed {
  fiche: Fiche;
  fields: { text: string; weight: number }[];
}

export function buildIndex(fiches: Fiche[]): Indexed[] {
  return fiches.map((f) => ({
    fiche: f,
    fields: [
      { text: normalize(f.title), weight: 10 },
      { text: normalize((f.keywords ?? []).join(' | ')), weight: 8 },
      { text: normalize(f.tags.join(' | ')), weight: 6 },
      { text: normalize(f.summary), weight: 4 },
      { text: normalize(f.syntax), weight: 3 },
      { text: normalize([f.concept, f.useCase ?? '', ...(f.pitfalls ?? []), ...(f.takeaways ?? [])].join(' ')), weight: 1 },
    ],
  }));
}

/** Recherche multi-mots : chaque mot doit apparaître quelque part ; score pondéré par champ. */
export function search(index: Indexed[], query: string): Fiche[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return index.map((i) => i.fiche);
  const scored: { f: Fiche; s: number }[] = [];
  for (const it of index) {
    let total = 0;
    let ok = true;
    for (const t of terms) {
      let best = 0;
      for (const fld of it.fields) {
        const pos = fld.text.indexOf(t);
        if (pos === -1) continue;
        const wordStart = pos === 0 || /[^a-z0-9_]/.test(fld.text[pos - 1]);
        best = Math.max(best, fld.weight * (wordStart ? 2 : 1));
      }
      if (!best) { ok = false; break; }
      total += best;
    }
    if (ok) scored.push({ f: it.fiche, s: total });
  }
  return scored.sort((a, b) => b.s - a.s).map((x) => x.f);
}
