import { useEffect, useMemo, useRef, useState } from 'react';
import { registry } from './engine/registry';
import { buildIndex, search } from './engine/search';
import type { Fiche, Theme } from './engine/types';
import { FicheView } from './components/FicheView';
import { ThemeBadge } from './components/ThemeBadge';
import { ThemeIntroView } from './components/ThemeIntroView';
import { Quiz } from './components/Quiz';
import { ErrorsPage } from './components/ErrorsPage';
import { searchErrors } from './content/errors';
import { Code } from './lib/highlight';
import { inline } from './lib/markdown';
import { useStoredList } from './lib/storage';
import { modules, parcours, placeInParcours } from './content/parcours';

type Route = { view: 'home' } | { view: 'theme'; id: string } | { view: 'fiche'; id: string } | { view: 'parcours' } | { view: 'devine' } | { view: 'erreurs'; id?: string };

function parseHash(): Route {
  const [, kind, id] = window.location.hash.split('/');
  if (kind === 'fiche' && id) return { view: 'fiche', id: decodeURIComponent(id) };
  if (kind === 'theme' && id) return { view: 'theme', id: decodeURIComponent(id) };
  if (kind === 'parcours') return { view: 'parcours' };
  if (kind === 'devine') return { view: 'devine' };
  if (kind === 'erreurs') return { view: 'erreurs', id: id ? decodeURIComponent(id) : undefined };
  return { view: 'home' };
}

function useRoute(): Route {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const on = () => { setRoute(parseHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

function useColorMode() {
  const [mode, setMode] = useState<'light' | 'dark' | null>(() => {
    try { return (localStorage.getItem('color-mode') as 'light' | 'dark' | null) ?? null; } catch { return null; }
  });
  useEffect(() => {
    if (mode) document.documentElement.dataset.theme = mode; else delete document.documentElement.dataset.theme;
    try { if (mode) localStorage.setItem('color-mode', mode); else localStorage.removeItem('color-mode'); } catch { /* stockage indisponible */ }
  }, [mode]);
  const isDark = mode ? mode === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return { isDark, toggle: () => setMode(isDark ? 'light' : 'dark') };
}

const isLab = (f: Fiche) => f.id.startsWith('labo-');
/** Nom court d'un labo pour la navigation : « Labo NumPy — trier, chercher : sort… » → « Trier, chercher ». */
const labShort = (f: Fiche) => { const t = f.title.replace(/^Labo( NumPy)? — /, '').split(' : ')[0]; return t.charAt(0).toUpperCase() + t.slice(1); };
const simCount = (f: Fiche) => (f.simulator ? 1 : 0) + (f.simulators?.length ?? 0);
const SUGGESTIONS = ['KeyError', 'axis', 'vue ou copie', 'groupby', 'dropna', 'merge', 'sorted', 'scope', 'strptime', 'hue'];


function FicheCard({ f, theme, fav, showTheme = true }: { f: Fiche; theme?: Theme; fav?: boolean; showTheme?: boolean }) {
  return (
    <a href={`#/fiche/${f.id}`} className={`fiche-card ${isLab(f) ? 'is-lab' : ''}`}>
      {(showTheme || fav) && (
        <span className="fc-top">
          {showTheme && <><ThemeBadge theme={theme} size="sm" /><span className="fc-theme">{theme?.label}</span></>}
          {fav && <span className="fc-fav" aria-label="favori">★</span>}
        </span>
      )}
      <strong className="fc-title">{f.title}</strong>
      <span className="fc-summary">{inline(f.summary)}</span>
      <span className="fc-meta">{simCount(f) > 0 ? `${simCount(f)} simulateur${simCount(f) > 1 ? 's' : ''}` : 'fiche'}</span>
    </a>
  );
}

export default function App() {
  const { fiches, byId, themes, issues } = registry;
  const themeOf = (id: string) => themes.find((t) => t.id === id);
  const index = useMemo(() => buildIndex(fiches), [fiches]);
  const route = useRoute();
  const { isDark, toggle } = useColorMode();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [revision, setRevision] = useState(false);
  const [openThemes, setOpenThemes] = useState<string[]>([]);
  const favorites = useStoredList('favoris');
  const recents = useStoredList('recents', 8);
  const revised = useStoredList('revisees', 200);
  const [confirmReset, setConfirmReset] = useState(false);
  const nbRevised = parcours.filter((id) => revised.items.includes(id)).length;
  const nextToRevise = parcours.find((id) => !revised.items.includes(id));
  const searchRef = useRef<HTMLInputElement>(null);

  const current = route.view === 'fiche' ? byId.get(route.id) : undefined;
  const currentTheme = route.view === 'theme' ? themeOf(route.id) : current ? themeOf(current.theme) : undefined;
  useEffect(() => { if (current) recents.push(current.id); }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setMenuOpen(false); setQuery(''); }, [route]);
  // seul le thème en cours est déplié (les autres restent dépliables à la main)
  useEffect(() => { setOpenThemes(currentTheme ? [currentTheme.id] : []); }, [currentTheme?.id]);

  const hits = useMemo(() => (query.trim() ? search(index, query) : []), [index, query]);
  // résultats de la recherche : d'abord les messages d'erreur reconnus, puis les fiches
  const items = useMemo(() => [
    ...searchErrors(query).slice(0, 3).map((e) => ({ key: `err-${e.id}`, href: `#/erreurs/${e.id}`, badge: <span className="err-badge">{e.p3?.type ?? e.p2?.type}</span>, title: e.title, sub: <code>{(e.p3 ?? e.p2)?.message}</code> })),
    ...hits.slice(0, 8).map((f) => ({ key: f.id, href: `#/fiche/${f.id}`, badge: <ThemeBadge theme={themeOf(f.theme)} size="sm" />, title: f.title, sub: inline(f.summary) })),
  ].slice(0, 9), [hits, query]);
  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName);
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault(); searchRef.current?.focus(); searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && items[active]) { window.location.hash = items[active].href; searchRef.current?.blur(); }
    else if (e.key === 'Escape') { setQuery(''); searchRef.current?.blur(); }
  };
  const ask = (q: string) => { setQuery(q); searchRef.current?.focus(); };

  const rank = (f: Fiche) => (isLab(f) ? 1000 : parcours.indexOf(f.id));
  const themeFiches = (id: string) => fiches.filter((f) => f.theme === id).sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title, 'fr'));
  const ordered = currentTheme ? themeFiches(currentTheme.id) : [];
  const pos = current ? ordered.findIndex((f) => f.id === current.id) : -1;
  const place = current ? placeInParcours(current.id) : null;

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn menu-btn" onClick={() => setMenuOpen((x) => !x)} aria-label="Ouvrir le menu" aria-expanded={menuOpen}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <a href="#/" className="brand" aria-label="Accueil">
          <span className="brand-mark">∑</span>
          <span className="brand-name">Antisèche<span className="brand-sub"> · Python &amp; Data</span></span>
        </a>
        <div className="search" role="combobox" aria-expanded={!!query} aria-haspopup="listbox">
          <svg className="search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input ref={searchRef} id="recherche" type="search" placeholder={window.innerWidth < 520 ? "Rechercher…" : "Une notion, une fonction, un message d’erreur…"} value={query}
            onChange={(e) => setQuery(e.target.value)} onKeyDown={onSearchKey} aria-label="Rechercher une fiche" />
          <kbd className="search-kbd">/</kbd>
          {query && (
            <div className="search-pop" role="listbox">
              {items.map((it, i) => (
                <a key={it.key} href={it.href} role="option" aria-selected={i === active} className={i === active ? 'on' : ''} onMouseEnter={() => setActive(i)}>
                  {it.badge}
                  <span className="sp-text"><strong>{it.title}</strong><span>{it.sub}</span></span>
                </a>
              ))}
              {!items.length && <div className="sp-empty">Aucune fiche pour « {query} ». Essaie un nom de fonction (<code>dropna</code>) ou un mot du message d’erreur.</div>}
              {items.length > 0 && <div className="sp-hint"><kbd>↑</kbd><kbd>↓</kbd> naviguer · <kbd>Entrée</kbd> ouvrir · <kbd>Échap</kbd> fermer</div>}
            </div>
          )}
        </div>
        <button className="icon-btn" onClick={toggle} aria-label={isDark ? 'Passer en thème clair' : 'Passer en thème sombre'} title="Thème clair / sombre">
          {isDark
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>}
        </button>
      </header>

      <div className="layout">
        {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
        <nav className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Thèmes et fiches">
          <a href="#/" className={`nav-home ${route.view === 'home' ? 'on' : ''}`}>Accueil</a>
          <a href="#/parcours" className={`nav-home nav-parcours ${route.view === 'parcours' ? 'on' : ''}`}>
            <span>Parcours</span><span className="count">{nbRevised}/{parcours.length}</span>
          </a>
          <a href="#/devine" className={`nav-home ${route.view === 'devine' ? 'on' : ''}`}>Devine le résultat</a>
          <a href="#/erreurs" className={`nav-home ${route.view === 'erreurs' ? 'on' : ''}`}>Messages d’erreur</a>
          {favorites.items.length > 0 && (
            <div className="nav-group">
              <div className="nav-label">Favoris</div>
              {favorites.items.map((id) => byId.get(id)).filter(Boolean).map((f) => (
                <a key={f!.id} href={`#/fiche/${f!.id}`} className={`nav-fiche ${current?.id === f!.id ? 'on' : ''}`}>★ {f!.title}</a>
              ))}
            </div>
          )}
          <div className="nav-label">Thèmes</div>
          {themes.map((t) => {
            const list = themeFiches(t.id);
            const open = openThemes.includes(t.id);
            return (
              <div key={t.id} className="nav-theme">
                <div className={`nav-theme-row ${currentTheme?.id === t.id ? 'on' : ''}`}>
                  <a href={`#/theme/${t.id}`} className="nav-theme-title"><ThemeBadge theme={t} size="sm" />{t.label}</a>
                  <button className="nav-toggle" aria-label={open ? `Replier ${t.label}` : `Déplier ${t.label}`} aria-expanded={open}
                    onClick={() => setOpenThemes((xs) => (xs.includes(t.id) ? xs.filter((x) => x !== t.id) : [...xs, t.id]))}>
                    <span className="count">{list.length}</span><span className={`chev ${open ? 'open' : ''}`}>›</span>
                  </button>
                </div>
                {open && list.filter((f) => !isLab(f)).map((f) => (
                  <a key={f.id} href={`#/fiche/${f.id}`} className={`nav-fiche ${current?.id === f.id ? 'on' : ''}`}>{f.title}</a>
                ))}
                {open && list.some(isLab) && <div className="nav-sub">Labos</div>}
                {open && list.filter(isLab).map((f) => (
                  <a key={f.id} href={`#/fiche/${f.id}`} className={`nav-fiche lab ${current?.id === f.id ? 'on' : ''}`} title={f.title}>{labShort(f)}</a>
                ))}
              </div>
            );
          })}
        </nav>

        <main className="main" id="contenu">
          {import.meta.env.DEV && issues.length > 0 && (
            <div className="alert alert-error"><div className="alert-title">Problèmes dans le contenu</div>
              <ul>{issues.map((i, k) => <li key={k}><code>{i.file}</code> : {i.message}</li>)}</ul></div>
          )}

          {route.view === 'fiche' && (current ? (
            <FicheView fiche={current} theme={themeOf(current.theme)} resolve={(id) => byId.get(id)}
              isFavorite={favorites.items.includes(current.id)} onToggleFavorite={() => favorites.toggle(current.id)}
              prev={place ? (place.prev ? byId.get(place.prev) : undefined) : pos > 0 ? ordered[pos - 1] : undefined}
              next={place ? (place.next ? byId.get(place.next) : undefined) : pos >= 0 && pos < ordered.length - 1 ? ordered[pos + 1] : undefined}
              place={place ?? undefined} isRevised={revised.items.includes(current.id)} onToggleRevised={() => revised.toggle(current.id)}
              />
          ) : <div className="empty">Fiche introuvable. <a href="#/">Retour à l’accueil</a></div>)}

          {route.view === 'home' && (
            <div className="home">
              <section className="hero">
                <h1>Retrouve une notion en quelques secondes,<br />puis vois-la fonctionner.</h1>
                <p className="hero-sub">Tape <kbd>/</kbd> pour chercher une fonction, une notion ou un message d’erreur. Par exemple :</p>
                <div className="suggest">{SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}</div>
              </section>


              <a href={nextToRevise ? `#/fiche/${nextToRevise}` : '#/parcours'} className="parcours-card">
                <div className="pc-text">
                  <span className="eyebrow">Parcours de révision</span>
                  <strong>{nbRevised === 0 ? 'Réviser tout le programme, dans l’ordre du cours' : nextToRevise ? 'Reprendre le parcours' : 'Parcours terminé — bravo !'}</strong>
                  <span className="muted">{nextToRevise ? <>Prochaine fiche : <b>{byId.get(nextToRevise)?.title}</b></> : 'Toutes les fiches sont marquées comme révisées.'}</span>
                </div>
                <div className="pc-progress">
                  <span className="pc-num">{nbRevised}<small>/{parcours.length}</small></span>
                  <span className="progress"><span style={{ width: `${(nbRevised / parcours.length) * 100}%` }} /></span>
                  <span className="pc-cta">{nextToRevise ? (nbRevised ? 'Continuer →' : 'Commencer →') : 'Voir le parcours →'}</span>
                </div>
              </a>

              <a href="#/devine" className="panel home-quiz">
                <span><span className="eyebrow">S’entraîner</span><strong>Devine le résultat</strong><span className="muted">Series ou DataFrame ? Quel index, quel <code>.name</code>, quelle shape ? Réponses tirées d’exécutions réelles.</span></span>
                <span className="btn-primary">Jouer une série →</span>
              </a>

              {recents.items.length > 0 && (
                <section>
                  <h2 className="h-small">Consultées récemment</h2>
                  <div className="recent-row">{recents.items.map((id) => byId.get(id)).filter((f) => f && f.id !== nextToRevise).slice(0, 4).map((f) => (
                    <a key={f!.id} href={`#/fiche/${f!.id}`} className="chip"><ThemeBadge theme={themeOf(f!.theme)} size="sm" />{f!.title}</a>
                  ))}</div>
                </section>
              )}

              <section>
                <div className="section-head"><h2>Thèmes</h2></div>
                <div className="theme-grid">
                  {themes.map((t) => {
                    const all = themeFiches(t.id);
                    const labs = all.filter(isLab).length;
                    return (
                      <a key={t.id} href={`#/theme/${t.id}`} className="theme-card" style={{ ['--h' as string]: String(t.hue ?? 220) }}>
                        <ThemeBadge theme={t} size="lg" />
                        <strong>{t.label}</strong>
                        <span className="tc-desc">{t.description}</span>
                        <span className="tc-count">{all.length - labs} fiches{labs ? ` · ${labs} labo${labs > 1 ? 's' : ''}` : ''}</span>
                      </a>
                    );
                  })}
                </div>
              </section>

              <section>
                <div className="section-head"><h2>Labos</h2><p className="muted">Change un paramètre, vois exactement ce qui change.</p></div>
                <div className="lab-list">{fiches.filter(isLab).map((f) => (
                  <a key={f.id} href={`#/fiche/${f.id}`} className="lab-row"><ThemeBadge theme={themeOf(f.theme)} size="sm" /><span>{labShort(f)}</span><span className="lab-lib">{themeOf(f.theme)?.label}</span></a>
                ))}</div>
              </section>
            </div>
          )}

          {route.view === 'devine' && <Quiz />}
          {route.view === 'erreurs' && <ErrorsPage focus={route.id} resolve={(id) => byId.get(id)} />}

          {route.view === 'parcours' && (
            <div className="parcours-page">
              <p className="crumb"><a href="#/">Accueil</a> / Parcours</p>
              <h1>Parcours de révision</h1>
              <p className="hero-sub">Les {parcours.length} fiches dans l’ordre de ton cursus. Marque chaque fiche « Révisée » pour suivre ta progression.</p>
              <div className="pp-progress"><span className="progress"><span style={{ width: `${(nbRevised / parcours.length) * 100}%` }} /></span><span>{nbRevised} / {parcours.length} révisées</span>
                {nbRevised > 0 && (confirmReset
                  ? <span className="pp-confirm">Tout décocher ? <button className="link" onClick={() => { parcours.forEach((id) => { if (revised.items.includes(id)) revised.toggle(id); }); setConfirmReset(false); }}>oui</button> · <button className="link" onClick={() => setConfirmReset(false)}>non</button></span>
                  : <button className="link" onClick={() => setConfirmReset(true)}>tout réinitialiser</button>)}</div>
              {(() => { let n = 0; let course = ''; return modules.map((m) => {
                const showCourse = m.course !== course; course = m.course;
                const done = m.fiches.filter((id) => revised.items.includes(id)).length;
                return (
                  <section key={m.id} className="pp-module">
                    {showCourse && <p className="pp-course">{m.course}</p>}
                    <h2 className="pp-title"><span>{m.title}</span><span className="count">{done}/{m.fiches.length}</span></h2>
                    <ol className="pp-list">
                      {m.fiches.map((id) => { n += 1; const f = byId.get(id); const ok = revised.items.includes(id); return f ? (
                        <li key={id} className={ok ? 'done' : ''}>
                          <button className={`pp-check ${ok ? 'on' : ''}`} aria-pressed={ok} aria-label={ok ? 'Marquer comme non révisée' : 'Marquer comme révisée'} onClick={() => revised.toggle(id)}>{ok ? '✓' : ''}</button>
                          <span className="pp-n">{n}</span>
                          <a href={`#/fiche/${id}`}>{f.title}</a>
                          <ThemeBadge theme={themeOf(f.theme)} size="sm" />
                        </li>) : null; })}
                    </ol>
                  </section>
                ); }); })()}
            </div>
          )}

          {route.view === 'theme' && currentTheme && (
            <div className="theme-page" style={{ ['--h' as string]: String(currentTheme.hue ?? 220) }}>
              <header className="theme-head">
                <ThemeBadge theme={currentTheme} size="lg" />
                <div>
                  <p className="crumb"><a href="#/">Accueil</a> / Thème</p>
                  <h1>{currentTheme.label}</h1>
                  <p className="muted">{currentTheme.description}</p>
                </div>
                <div className="seg view-switch" role="tablist" aria-label="Affichage">
                  <button role="tab" aria-selected={!revision} className={!revision ? 'on' : ''} onClick={() => setRevision(false)}>Fiches</button>
                  <button role="tab" aria-selected={revision} className={revision ? 'on' : ''} onClick={() => setRevision(true)}>Révision</button>
                </div>
              </header>
              {!revision ? (
                <>
                  <div className="card-grid">{themeFiches(currentTheme.id).filter((f) => !isLab(f)).map((f) => <FicheCard key={f.id} f={f} theme={currentTheme} showTheme={false} fav={favorites.items.includes(f.id)} />)}</div>
                  {themeFiches(currentTheme.id).some(isLab) && (
                    <section className="theme-labs">
                      <h2 className="h-small">Labos — change un paramètre, vois ce qui change</h2>
                      <div className="lab-list">{themeFiches(currentTheme.id).filter(isLab).map((f) => (
                        <a key={f.id} href={`#/fiche/${f.id}`} className="lab-row"><span>{labShort(f)}</span></a>
                      ))}</div>
                    </section>
                  )}
                </>
              ) : (
                <div className="revision">
                  <ThemeIntroView theme={currentTheme} />
                  <h2 className="rev-heading">Toutes les fiches, l’essentiel</h2>
                  {themeFiches(currentTheme.id).filter((f) => !isLab(f)).map((f) => (
                    <article key={f.id} className="rev-item">
                      <h2><a href={`#/fiche/${f.id}`}>{f.title}</a></h2>
                      <div className="rev-grid">
                        <Code code={f.syntax} />
                        {!!f.takeaways?.length && <ul className="rev-take">{f.takeaways.map((t, i) => <li key={i}>{inline(t)}</li>)}</ul>}
                      </div>
                      {f.mentalModel && (
                        <div className="rev-rule">
                          <span className="label">La règle</span>
                          <Code code={f.mentalModel.code} />
                          {f.mentalModel.note && <p>{inline(f.mentalModel.note)}</p>}
                        </div>
                      )}
                      {!!f.comparisons?.some((c) => c.conclusion) && (
                        <div className="rev-cmp">
                          <span className="label">À ne pas confondre</span>
                          <ul>{f.comparisons!.filter((c) => c.conclusion).map((c, i) => <li key={i}><b>{inline(c.title)}</b> — {inline(c.conclusion!)}</li>)}</ul>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
