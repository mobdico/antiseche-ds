import { useEffect, useMemo, useRef, useState } from 'react';
import { registry } from './engine/registry';
import { buildIndex, search } from './engine/search';
import type { Fiche, Theme } from './engine/types';
import { FicheView } from './components/FicheView';
import { ThemeBadge } from './components/ThemeBadge';
import { Code } from './lib/highlight';
import { inline } from './lib/markdown';
import { useStoredList } from './lib/storage';

type Route = { view: 'home' } | { view: 'theme'; id: string } | { view: 'fiche'; id: string };

function parseHash(): Route {
  const [, kind, id] = window.location.hash.split('/');
  if (kind === 'fiche' && id) return { view: 'fiche', id: decodeURIComponent(id) };
  if (kind === 'theme' && id) return { view: 'theme', id: decodeURIComponent(id) };
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

const isLab = (f: Fiche) => f.tags.includes('labo');
const simCount = (f: Fiche) => (f.simulator ? 1 : 0) + (f.simulators?.length ?? 0);
const SUGGESTIONS = ['KeyError', 'axis', 'vue ou copie', 'groupby', 'dropna', 'merge', 'sorted', 'scope', 'strptime', 'hue'];

const go = (id: string) => { window.location.hash = `#/fiche/${id}`; };

function FicheCard({ f, theme, fav }: { f: Fiche; theme?: Theme; fav?: boolean }) {
  return (
    <a href={`#/fiche/${f.id}`} className={`fiche-card ${isLab(f) ? 'is-lab' : ''}`}>
      <span className="fc-top">
        <ThemeBadge theme={theme} size="sm" />
        <span className="fc-theme">{theme?.label}</span>
        {isLab(f) && <span className="pill pill-lab">Labo</span>}
        {fav && <span className="fc-fav" aria-label="favori">★</span>}
      </span>
      <strong className="fc-title">{f.title}</strong>
      <span className="fc-summary">{inline(f.summary)}</span>
      <span className="fc-meta">{simCount(f) > 0 ? `${simCount(f)} simulateur${simCount(f) > 1 ? 's' : ''}` : 'fiche'}</span>
    </a>
  );
}

export default function App() {
  const { fiches, byId, themes, allTags, issues } = registry;
  const themeOf = (id: string) => themes.find((t) => t.id === id);
  const index = useMemo(() => buildIndex(fiches), [fiches]);
  const route = useRoute();
  const { isDark, toggle } = useColorMode();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [revision, setRevision] = useState(false);
  const [openThemes, setOpenThemes] = useState<string[]>([]);
  const favorites = useStoredList('favoris');
  const recents = useStoredList('recents', 8);
  const searchRef = useRef<HTMLInputElement>(null);

  const current = route.view === 'fiche' ? byId.get(route.id) : undefined;
  const currentTheme = route.view === 'theme' ? themeOf(route.id) : current ? themeOf(current.theme) : undefined;
  useEffect(() => { if (current) recents.push(current.id); }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setMenuOpen(false); setQuery(''); }, [route]);
  useEffect(() => { if (currentTheme) setOpenThemes((xs) => (xs.includes(currentTheme.id) ? xs : [...xs, currentTheme.id])); }, [currentTheme?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const hits = useMemo(() => (query.trim() ? search(index, query) : []), [index, query]);
  useEffect(() => setActive(0), [query]);
  const byTags = (list: Fiche[]) => (tags.length ? list.filter((f) => tags.every((t) => f.tags.includes(t))) : list);

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
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, Math.min(hits.length, 8) - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && hits[active]) { go(hits[active].id); searchRef.current?.blur(); }
    else if (e.key === 'Escape') { setQuery(''); searchRef.current?.blur(); }
  };
  const ask = (q: string) => { setQuery(q); searchRef.current?.focus(); };

  const themeFiches = (id: string) => fiches.filter((f) => f.theme === id).sort((a, b) => Number(isLab(a)) - Number(isLab(b)) || a.title.localeCompare(b.title, 'fr'));
  const ordered = currentTheme ? themeFiches(currentTheme.id) : [];
  const pos = current ? ordered.findIndex((f) => f.id === current.id) : -1;
  const totalSims = fiches.reduce((n, f) => n + simCount(f), 0);

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
              {hits.slice(0, 8).map((f, i) => (
                <a key={f.id} href={`#/fiche/${f.id}`} role="option" aria-selected={i === active} className={i === active ? 'on' : ''} onMouseEnter={() => setActive(i)}>
                  <ThemeBadge theme={themeOf(f.theme)} size="sm" />
                  <span className="sp-text"><strong>{f.title}</strong><span>{inline(f.summary)}</span></span>
                  {isLab(f) && <span className="pill pill-lab">Labo</span>}
                </a>
              ))}
              {!hits.length && <div className="sp-empty">Aucune fiche pour « {query} ». Essaie un nom de fonction (<code>dropna</code>) ou un mot du message d’erreur.</div>}
              {hits.length > 0 && <div className="sp-hint"><kbd>↑</kbd><kbd>↓</kbd> naviguer · <kbd>Entrée</kbd> ouvrir · <kbd>Échap</kbd> fermer</div>}
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
            const list = byTags(themeFiches(t.id));
            const open = openThemes.includes(t.id) || tags.length > 0;
            return (
              <div key={t.id} className="nav-theme">
                <div className={`nav-theme-row ${currentTheme?.id === t.id ? 'on' : ''}`}>
                  <a href={`#/theme/${t.id}`} className="nav-theme-title"><ThemeBadge theme={t} size="sm" />{t.label}</a>
                  <button className="nav-toggle" aria-label={open ? `Replier ${t.label}` : `Déplier ${t.label}`} aria-expanded={open}
                    onClick={() => setOpenThemes((xs) => (xs.includes(t.id) ? xs.filter((x) => x !== t.id) : [...xs, t.id]))}>
                    <span className="count">{list.length}</span><span className={`chev ${open ? 'open' : ''}`}>›</span>
                  </button>
                </div>
                {open && list.map((f) => (
                  <a key={f.id} href={`#/fiche/${f.id}`} className={`nav-fiche ${current?.id === f.id ? 'on' : ''}`}>
                    {f.title}{isLab(f) && <span className="pill pill-lab sm">Labo</span>}
                  </a>
                ))}
              </div>
            );
          })}
          <details className="nav-tags" open={tags.length > 0}>
            <summary className="nav-label">Filtrer par tag {tags.length > 0 && <button className="link" onClick={(e) => { e.preventDefault(); setTags([]); }}>effacer</button>}</summary>
            <div className="tags">
              {allTags.map((t) => <button key={t} className={`tag ${tags.includes(t) ? 'on' : ''}`} onClick={() => setTags((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]))}>{t}</button>)}
            </div>
          </details>
        </nav>

        <main className="main" id="contenu">
          {import.meta.env.DEV && issues.length > 0 && (
            <div className="alert alert-error"><div className="alert-title">Problèmes dans le contenu</div>
              <ul>{issues.map((i, k) => <li key={k}><code>{i.file}</code> : {i.message}</li>)}</ul></div>
          )}

          {route.view === 'fiche' && (current ? (
            <FicheView fiche={current} theme={themeOf(current.theme)} resolve={(id) => byId.get(id)}
              isFavorite={favorites.items.includes(current.id)} onToggleFavorite={() => favorites.toggle(current.id)}
              prev={pos > 0 ? ordered[pos - 1] : undefined} next={pos >= 0 && pos < ordered.length - 1 ? ordered[pos + 1] : undefined}
              withTag={(t) => fiches.filter((f) => f.tags.includes(t))} />
          ) : <div className="empty">Fiche introuvable. <a href="#/">Retour à l’accueil</a></div>)}

          {route.view === 'home' && (
            <div className="home">
              <section className="hero">
                <p className="eyebrow">Python · NumPy · pandas · visualisation</p>
                <h1>Retrouve une notion en quelques secondes,<br />puis vois-la fonctionner.</h1>
                <p className="hero-sub">{fiches.length - fiches.filter(isLab).length} fiches, {fiches.filter(isLab).length} labos, {totalSims} simulateurs — résultats exécutés par le vrai Python.</p>
                <div className="hero-search">
                  <button className="hero-input" onClick={() => searchRef.current?.focus()}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    Rechercher… <kbd>/</kbd>
                  </button>
                  <div className="suggest">{SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}</div>
                </div>
              </section>

              {tags.length > 0 && (
                <section>
                  <div className="section-head"><h2>Fiches avec {tags.map((t) => `« ${t} »`).join(' et ')}</h2><button className="link" onClick={() => setTags([])}>effacer le filtre</button></div>
                  <div className="card-grid">{byTags(fiches).map((f) => <FicheCard key={f.id} f={f} theme={themeOf(f.theme)} fav={favorites.items.includes(f.id)} />)}</div>
                </section>
              )}

              {(recents.items.length > 0 || favorites.items.length > 0) && (
                <section className="resume">
                  {recents.items.length > 0 && (
                    <div>
                      <h2 className="h-small">Reprendre</h2>
                      <div className="mini-list">{recents.items.map((id) => byId.get(id)).filter(Boolean).slice(0, 5).map((f) => (
                        <a key={f!.id} href={`#/fiche/${f!.id}`}><ThemeBadge theme={themeOf(f!.theme)} size="sm" /><span>{f!.title}</span></a>
                      ))}</div>
                    </div>
                  )}
                  {favorites.items.length > 0 && (
                    <div>
                      <h2 className="h-small">Favoris</h2>
                      <div className="mini-list">{favorites.items.map((id) => byId.get(id)).filter(Boolean).slice(0, 5).map((f) => (
                        <a key={f!.id} href={`#/fiche/${f!.id}`}><span className="star">★</span><span>{f!.title}</span></a>
                      ))}</div>
                    </div>
                  )}
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
                <div className="card-grid">{fiches.filter(isLab).map((f) => <FicheCard key={f.id} f={f} theme={themeOf(f.theme)} fav={favorites.items.includes(f.id)} />)}</div>
              </section>
            </div>
          )}

          {route.view === 'theme' && currentTheme && (
            <div className="theme-page" style={{ ['--h' as string]: String(currentTheme.hue ?? 220) }}>
              <header className="theme-head">
                <ThemeBadge theme={currentTheme} size="lg" />
                <div>
                  <p className="eyebrow"><a href="#/">Accueil</a> / Thème</p>
                  <h1>{currentTheme.label}</h1>
                  <p className="muted">{currentTheme.description}</p>
                </div>
                <div className="seg view-switch" role="tablist" aria-label="Affichage">
                  <button role="tab" aria-selected={!revision} className={!revision ? 'on' : ''} onClick={() => setRevision(false)}>Fiches</button>
                  <button role="tab" aria-selected={revision} className={revision ? 'on' : ''} onClick={() => setRevision(true)}>Révision</button>
                </div>
              </header>
              {!revision ? (
                <div className="card-grid">{byTags(themeFiches(currentTheme.id)).map((f) => <FicheCard key={f.id} f={f} theme={currentTheme} fav={favorites.items.includes(f.id)} />)}</div>
              ) : (
                <div className="revision">
                  <p className="muted">Toute la syntaxe et l’essentiel du thème sur une seule page.</p>
                  {themeFiches(currentTheme.id).filter((f) => !isLab(f)).map((f) => (
                    <article key={f.id} className="rev-item">
                      <h2><a href={`#/fiche/${f.id}`}>{f.title}</a></h2>
                      <div className="rev-grid">
                        <Code code={f.syntax} />
                        {!!f.takeaways?.length && <ul className="rev-take">{f.takeaways.map((t, i) => <li key={i}>{inline(t)}</li>)}</ul>}
                      </div>
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
