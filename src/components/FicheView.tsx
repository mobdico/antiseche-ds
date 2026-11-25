import type { Fiche, Theme } from '../engine/types';
import { Markdown, inline } from '../lib/markdown';
import { Code } from '../lib/highlight';
import { SimulatorView } from './Simulator';

interface Props {
  fiche: Fiche;
  theme?: Theme;
  resolve: (id: string) => Fiche | undefined;
  onTag: (tag: string) => void;
}

export function FicheView({ fiche, theme, resolve, onTag }: Props) {
  return (
    <article className="fiche">
      <header className="fiche-head">
        <a className="crumb" href={`#/theme/${fiche.theme}`}>{theme?.icon} {theme?.label ?? fiche.theme}</a>
        <h1>{fiche.title}</h1>
        <p className="summary">{inline(fiche.summary)}</p>
        <div className="tags">{fiche.tags.map((t) => <button key={t} className="tag" onClick={() => onTag(t)}>#{t}</button>)}</div>
      </header>

      <div className="fiche-top">
        <section className="card">
          <h2>💡 Concept</h2>
          <Markdown text={fiche.concept} />
          {fiche.useCase && <><h3>Cas d’usage</h3><Markdown text={fiche.useCase} /></>}
        </section>
        <section className="card">
          <h2>⌨️ Syntaxe</h2>
          <Code code={fiche.syntax} />
        </section>
      </div>

      {fiche.simulator && <SimulatorView key={fiche.id} sim={fiche.simulator} />}

      <div className="fiche-top">
        {!!fiche.pitfalls?.length && (
          <section className="card pitfalls">
            <h2>🪤 Pièges classiques</h2>
            <ul>{fiche.pitfalls.map((p, i) => <li key={i}>{inline(p)}</li>)}</ul>
          </section>
        )}
        {!!fiche.takeaways?.length && (
          <section className="card takeaways">
            <h2>📌 À retenir</h2>
            <ul>{fiche.takeaways.map((p, i) => <li key={i}>{inline(p)}</li>)}</ul>
          </section>
        )}
      </div>

      {(!!fiche.related?.length || fiche.source) && (
        <footer className="fiche-foot">
          {!!fiche.related?.length && (
            <div>Voir aussi : {fiche.related.map((id) => {
              const f = resolve(id);
              return f ? <a key={id} href={`#/fiche/${id}`} className="related">{f.title}</a> : null;
            })}</div>
          )}
          {fiche.source && <div className="muted">Source : {fiche.source}</div>}
        </footer>
      )}
    </article>
  );
}
