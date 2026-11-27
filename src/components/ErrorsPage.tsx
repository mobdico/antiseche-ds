import { useEffect, useMemo, useState } from 'react';
import type { Fiche } from '../engine/types';
import { normalize } from '../engine/search';
import { errorEntries, errorVersions, type ErrorCategory, type ErrorEntry } from '../content/errors';
import { Code } from '../lib/highlight';
import { Markdown } from '../lib/markdown';

const CATS: [ErrorCategory | 'all', string][] = [['all', 'Toutes'], ['python', 'Python'], ['pandas', 'pandas'], ['numpy', 'NumPy'], ['visu', 'Graphiques']];
const line = (e: { type: string; message: string } | null | undefined) => (e ? `${e.type}: ${e.message}` : 'aucune erreur');

function ErrorCard({ e, resolve, focused }: { e: ErrorEntry; resolve: (id: string) => Fiche | undefined; focused: boolean }) {
  const main = e.p3 ?? e.p2;
  return (
    <article id={`err-${e.id}`} className={`panel err-card ${focused ? 'focused' : ''}`}>
      <header className="err-head">
        <span className="err-badge">{main?.type}</span>
        <h2>{e.title}</h2>
        <a className="err-link" href={`#/erreurs/${e.id}`} aria-label="Lien vers cette erreur">#</a>
      </header>
      <div className="err-run">
        <Code code={e.code} />
        {e.p3 && <pre className="console err-msg">{line(e.p3)}</pre>}
        {!e.p3 && e.p2 && <pre className="console err-msg">{line(e.p2)}</pre>}
        {e.p2 !== undefined && (
          <p className="err-version">
            {!e.p3 && <>En pandas {errorVersions.p3} : <b>aucune erreur</b>. </>}
            En pandas {errorVersions.p2} : <code>{line(e.p2)}</code>
          </p>
        )}
      </div>
      <div className="err-grid">
        <div><span className="label">Pourquoi</span><Markdown text={e.cause} /></div>
        <div><span className="label">Corriger</span><Code code={e.fix} /></div>
      </div>
      {e.fiches.length > 0 && (
        <p className="err-fiches">Voir : {e.fiches.map((id) => resolve(id)).filter(Boolean).map((f, i) => (
          <span key={f!.id}>{i > 0 && ' · '}<a href={`#/fiche/${f!.id}`}>{f!.title}</a></span>
        ))}</p>
      )}
    </article>
  );
}

export function ErrorsPage({ focus, resolve }: { focus?: string; resolve: (id: string) => Fiche | undefined }) {
  const [cat, setCat] = useState<ErrorCategory | 'all'>('all');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const terms = normalize(q).split(/\s+/).filter(Boolean);
    return errorEntries.filter((e) => (cat === 'all' || e.category === cat)
      && terms.every((t) => normalize([e.title, e.p3?.type, e.p3?.message, e.p2?.message, e.cause, e.code, ...(e.keywords ?? [])].join(' ')).includes(t)));
  }, [cat, q]);

  // arrivée depuis la recherche : défiler jusqu'à l'erreur
  useEffect(() => {
    if (!focus) return;
    setCat('all'); setQ('');
    const t = setTimeout(() => document.getElementById(`err-${focus}`)?.scrollIntoView({ block: 'start' }), 30);
    return () => clearTimeout(t);
  }, [focus]);

  return (
    <div className="errors-page">
      <p className="crumb"><a href="#/">Accueil</a> / Messages d’erreur</p>
      <h1>Messages d’erreur</h1>
      <p className="hero-sub">Les erreurs les plus fréquentes en analyse de données : le <b>message réel</b> (obtenu en exécutant le code avec pandas {errorVersions.p3} et {errorVersions.p2}), pourquoi il apparaît, et comment corriger. Astuce : colle un message dans la recherche en haut de page.</p>
      <div className="errors-tools">
        <div className="seg" role="radiogroup" aria-label="Catégorie">
          {CATS.map(([c, l]) => (
            <button key={c} role="radio" aria-checked={cat === c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>
              {l} <span className="count">{c === 'all' ? errorEntries.length : errorEntries.filter((e) => e.category === c).length}</span>
            </button>
          ))}
        </div>
        <input type="search" className="errors-filter" placeholder="Filtrer : KeyError, merge, NaN…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filtrer les erreurs" />
      </div>
      <nav className="errors-index" aria-label="Sommaire">
        {list.map((e) => <a key={e.id} href={`#/erreurs/${e.id}`}><span className="err-badge sm">{(e.p3 ?? e.p2)?.type}</span>{e.title}</a>)}
      </nav>
      {list.map((e) => <ErrorCard key={e.id} e={e} resolve={resolve} focused={e.id === focus} />)}
      {!list.length && <p className="muted">Aucune erreur ne correspond.</p>}
    </div>
  );
}
