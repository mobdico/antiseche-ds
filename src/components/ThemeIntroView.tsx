import type { Theme } from '../engine/types';
import { inline } from '../lib/markdown';

/** Vue d'ensemble d'un thème (mode Révision) : pourquoi l'outil existe, sa logique, son usage au travail. */
export function ThemeIntroView({ theme }: { theme: Theme }) {
  const it = theme.intro;
  if (!it) return null;
  return (
    <section className="theme-intro" aria-label={`Vue d’ensemble : ${theme.label}`}>
      <p className="ti-phrase">{inline(it.enUnePhrase)}</p>
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
      </div>
    </section>
  );
}
