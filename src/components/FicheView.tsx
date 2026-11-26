import { useEffect, useState } from 'react';
import type { Fiche, Theme } from '../engine/types';
import { Markdown, inline } from '../lib/markdown';
import { Code } from '../lib/highlight';
import { SimulatorView } from './Simulator';
import type { Module } from '../content/parcours';

interface Props {
  fiche: Fiche;
  theme?: Theme;
  resolve: (id: string) => Fiche | undefined;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  prev?: Fiche;
  next?: Fiche;
  /** position dans le parcours de révision (fiches de cours uniquement) */
  place?: { index: number; total: number; module: Module };
  isRevised?: boolean;
  onToggleRevised?: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }
    catch { /* presse-papiers refusé : l'utilisateur peut sélectionner le texte */ }
  };
  return <button className="btn-ghost sm" onClick={copy}>{done ? 'Copié' : 'Copier'}</button>;
}

/** Majuscule initiale, sauf si le titre commence par du code (sns.relplot, df.loc…). */
const cap = (x: string) => (/^[a-zà-ÿ]+(\s|$)/i.test(x) ? x.charAt(0).toUpperCase() + x.slice(1) : x);

export function FicheView({ fiche, theme, resolve, isFavorite, onToggleFavorite, prev, next, place, isRevised, onToggleRevised }: Props) {
  const sims = [fiche.simulator, ...(fiche.simulators ?? [])].filter(Boolean) as NonNullable<Fiche['simulator']>[];
  const [tab, setTab] = useState(0);
  useEffect(() => setTab(0), [fiche.id]);

  return (
    <article className="fiche" style={{ ['--h' as string]: String(theme?.hue ?? 220) }}>
      <header className="fiche-head">
        <p className="crumb">
          <a href="#/">Accueil</a> / <a href={`#/theme/${fiche.theme}`}>{theme?.label ?? fiche.theme}</a>
          {place && <> <span className="crumb-sep">·</span> <a href="#/parcours" className="crumb-step">Parcours : étape {place.index + 1}/{place.total}</a></>}
        </p>
        <div className="fh-row">
          <div className="fh-text">
            <h1>{fiche.title}</h1>
            <p className="summary">{inline(fiche.summary)}</p>
          </div>
          <div className="fh-actions">
            {place && onToggleRevised && (
              <button className={`rev-btn ${isRevised ? 'on' : ''}`} onClick={onToggleRevised} aria-pressed={isRevised}>
                {isRevised ? '✓ Révisée' : 'Marquer révisée'}
              </button>
            )}
            <button className={`fav-btn ${isFavorite ? 'on' : ''}`} onClick={onToggleFavorite} aria-pressed={isFavorite} title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
              {isFavorite ? '★' : '☆'} Favori
            </button>
          </div>
        </div>
      </header>

      <section id="essentiel" className={`essentiel ${fiche.takeaways?.length ? '' : 'single'}`}>
        <div className="panel syntax-panel">
          <div className="panel-head"><h2 className="label">Syntaxe</h2><CopyButton text={fiche.syntax} /></div>
          <Code code={fiche.syntax} />
        </div>
        {!!fiche.takeaways?.length && (
          <div className="panel take-panel">
            <div className="panel-head"><h2 className="label">À retenir</h2></div>
            <ul className="take-list">{fiche.takeaways.map((p, i) => <li key={i}>{inline(p)}</li>)}</ul>
          </div>
        )}
      </section>

      {sims.length > 0 && (
        <section id="simulateurs" className="sims">
          {sims.length > 1 && (
            <div className="sim-tabs" role="tablist" aria-label="Simulateurs">
              {sims.map((s, i) => (
                <button key={i} role="tab" aria-selected={i === tab} className={i === tab ? 'on' : ''} onClick={() => setTab(i)}>
                  <span className="st-n">{i + 1}</span>{cap((s.title ?? `Simulateur ${i + 1}`).replace(/^Simulateur — /, '').replace(/^Laboratoire — /, ''))}
                </button>
              ))}
            </div>
          )}
          <SimulatorView key={`${fiche.id}-${tab}`} sim={sims[tab]} />
        </section>
      )}

      <section id="comprendre" className={`comprendre ${fiche.pitfalls?.length ? '' : 'single'}`}>
        <div className="panel">
          <h2 className="label">Comprendre</h2>
          <div className="prose"><Markdown text={fiche.concept} /></div>
          {fiche.useCase && <><h3 className="label sub">Cas d’usage</h3><div className="prose"><Markdown text={fiche.useCase} /></div></>}
        </div>
        {!!fiche.pitfalls?.length && (
          <div id="pieges" className="panel pitfalls">
            <h2 className="label">Pièges classiques</h2>
            <ul className="pit-list">{fiche.pitfalls.map((p, i) => <li key={i}>{inline(p)}</li>)}</ul>
          </div>
        )}
      </section>

      <footer className="fiche-foot">
        {!!fiche.related?.length && (
          <div className="related">
            <span className="label">Voir aussi</span>
            {fiche.related.map((id) => { const f = resolve(id); return f ? <a key={id} href={`#/fiche/${id}`} className="chip">{f.title}</a> : null; })}
          </div>
        )}
        <div className="prev-next">
          {prev ? <a href={`#/fiche/${prev.id}`} className="pn prev"><span>← {place ? 'Étape précédente' : 'Précédente'}</span><strong>{prev.title}</strong></a> : <span />}
          {next ? <a href={`#/fiche/${next.id}`} className="pn next" onClick={() => { if (place && !isRevised && onToggleRevised) onToggleRevised(); }}>
            <span>{place ? (isRevised ? 'Étape suivante →' : 'Marquer révisée et continuer →') : 'Suivante →'}</span><strong>{next.title}</strong></a> : <span />}
        </div>
        {fiche.source && <p className="source">Source : {fiche.source.replace(/\s*\((sources|scripts)\/[^)]*\)\s*$/, '')}</p>}
      </footer>
    </article>
  );
}
