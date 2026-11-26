import { useEffect, useState } from 'react';
import type { Theme } from '../engine/types';
import { inline } from '../lib/markdown';

/** Vue d'ensemble d'un thème : pourquoi l'outil existe, sa logique, son usage au travail. */
export function ThemeIntroView({ theme, expanded = false }: { theme: Theme; expanded?: boolean }) {
  const [open, setOpen] = useState(expanded);
  useEffect(() => setOpen(expanded), [expanded, theme.id]);
  const it = theme.intro;
  if (!it) return null;
  return (
    <section className="theme-intro" aria-label={`Vue d’ensemble : ${theme.label}`}>
      <p className="ti-phrase">{inline(it.enUnePhrase)}</p>
      {!open && <button className="link ti-more" onClick={() => setOpen(true)}>Lire la vue d’ensemble : pourquoi, philosophie, usage au travail →</button>}
      {open && (
        <div className="ti-body">
          <div className="ti-block ti-why">
            <h2 className="label">Pourquoi ça existe</h2>
            <p>{inline(it.pourquoi)}</p>
          </div>
          <div className="ti-grid">
            <div className="ti-block">
              <h2 className="label">La philosophie</h2>
              <ul>{it.philosophie.map((x, i) => <li key={i}>{inline(x)}</li>)}</ul>
            </div>
            <div className="ti-block">
              <h2 className="label">Dans ton travail</h2>
              <ul>{it.auTravail.map((x, i) => <li key={i}>{inline(x)}</li>)}</ul>
            </div>
            <div className="ti-block">
              <h2 className="label">Les réflexes</h2>
              <ul className="ti-questions">{it.reflexes.map((x, i) => <li key={i}>{inline(x)}</li>)}</ul>
            </div>
          </div>
          {!expanded && <button className="link ti-more" onClick={() => setOpen(false)}>Replier</button>}
        </div>
      )}
    </section>
  );
}
