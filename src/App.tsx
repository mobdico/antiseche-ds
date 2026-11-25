import { useEffect, useMemo, useRef, useState } from 'react';
import { registry } from './engine/registry';
import { buildIndex, search } from './engine/search';
import { FicheView } from './components/FicheView';
import { inline } from './lib/markdown';

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

function useTheme() {
  const [mode, setMode] = useState<'light' | 'dark' | null>(() => {
    try { return (localStorage.getItem('color-mode') as 'light' | 'dark' | null) ?? null; } catch { return null; }
  });
  useEffect(() => {
    if (mode) document.documentElement.dataset.theme = mode; else delete document.documentElement.dataset.theme;
    try { mode ? localStorage.setItem('color-mode', mode) : localStorage.removeItem('color-mode'); } catch { /* stockage indisponible */ }
  }, [mode]);
  const isDark = mode ? mode === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return { isDark, toggle: () => setMode(isDark ? 'light' : 'dark') };
}

export default function App() {
  const { fiches, byId, themes, allTags, issues } = registry;
  const index = useMemo(() => buildIndex(fiches), [fiches]);
  const route = useRoute();
  const { isDark, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    let r = search(index, query);
    if (tags.length) r = r.filter((f) => tags.every((t) => f.tags.includes(t)));
    if (route.view === 'theme') r = r.filter((f) => f.theme === route.id);
    return r;
  }, [index, query, tags, route]);
  const filtering = !!query.trim() || tags.length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.tagName === 'INPUT';
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault(); searchRef.current?.focus(); searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setMenuOpen(false), [route]);

  const toggleTag = (t: string) => setTags((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));
  const openFirst = () => { if (results[0]) window.location.hash = `#/fiche/${results[0].id}`; };

  const current = route.view === 'fiche' ? byId.get(route.id) : undefined;
  const currentTheme = route.view === 'theme' ? themes.find((t) => t.id === route.id) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <button className="menu-btn btn-ghost" onClick={() => setMenuOpen((x) => !x)} aria-label="menu">☰</button>
        <a href="#/" className="brand"><span className="brand-mark">∑</span> Antisèche <span className="brand-sub">Python · Data</span></a>
        <div className="search">
          <input ref={searchRef} type="search" placeholder="Rechercher : copy, axis, SettingWithCopyWarning…  ( / )"
            value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') openFirst(); if (e.key === 'Escape') setQuery(''); }} />
          {filtering && query && (
            <div className="search-pop">
              {results.slice(0, 8).map((f) => (
                <a key={f.id} href={`#/fiche/${f.id}`} onClick={() => setQuery('')}>
                  <strong>{f.title}</strong><span className="muted">{themes.find((t) => t.id === f.theme)?.label}</span>
                </a>
              ))}
              {!results.length && <div className="muted pad">Aucune fiche ne correspond.</div>}
            </div>
          )}
        </div>
        <button className="btn-ghost" onClick={toggle} aria-label="thème clair/sombre">{isDark ? '☀️' : '🌙'}</button>
      </header>

      <div className="layout">
        <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
          {themes.map((t) => {
            const list = fiches.filter((f) => f.theme === t.id && (!tags.length || tags.every((x) => f.tags.includes(x))));
            return (
              <div key={t.id} className="nav-theme">
                <a href={`#/theme/${t.id}`} className={`nav-theme-title ${route.view === 'theme' && route.id === t.id ? 'on' : ''}`}>
                  <span>{t.icon} {t.label}</span><span className="count">{list.length}</span>
                </a>
                {list.map((f) => (
                  <a key={f.id} href={`#/fiche/${f.id}`} className={`nav-fiche ${current?.id === f.id ? 'on' : ''}`}>{f.title}</a>
                ))}
              </div>
            );
          })}
          <div className="nav-tags">
            <div className="nav-label">Tags {tags.length > 0 && <button className="link" onClick={() => setTags([])}>effacer</button>}</div>
            <div className="tags">
              {allTags.map((t) => <button key={t} className={`tag ${tags.includes(t) ? 'on' : ''}`} onClick={() => toggleTag(t)}>#{t}</button>)}
            </div>
          </div>
        </nav>

        <main className="main">
          {import.meta.env.DEV && issues.length > 0 && (
            <div className="alert alert-error">
              <div className="alert-title">⛔ Problèmes dans le contenu</div>
              <ul>{issues.map((i, k) => <li key={k}><code>{i.file}</code> : {i.message}</li>)}</ul>
            </div>
          )}

          {route.view === 'fiche' && (current
            ? <FicheView fiche={current} theme={themes.find((t) => t.id === current.theme)} resolve={(id) => byId.get(id)}
                onTag={(t) => { setTags([t]); window.location.hash = '#/'; }} />
            : <div className="empty">Fiche introuvable. <a href="#/">Retour à l’accueil</a></div>)}

          {route.view !== 'fiche' && (
            <>
              <section className="hero">
                <h1>{currentTheme ? `${currentTheme.icon} ${currentTheme.label}` : 'Retrouver une notion, instantanément.'}</h1>
                <p className="muted">{currentTheme?.description ?? `${fiches.length} fiches interactives · tapez / pour chercher, Entrée pour ouvrir la première.`}</p>
              </section>

              {route.view === 'home' && !filtering && (
                <div className="theme-grid">
                  {themes.map((t) => {
                    const n = fiches.filter((f) => f.theme === t.id).length;
                    return (
                      <a key={t.id} href={`#/theme/${t.id}`} className={`theme-card card ${n ? '' : 'dim'}`}>
                        <span className="theme-icon">{t.icon}</span>
                        <strong>{t.label}</strong>
                        <span className="muted">{t.description}</span>
                        <span className="count">{n ? `${n} fiche${n > 1 ? 's' : ''}` : 'à venir'}</span>
                      </a>
                    );
                  })}
                </div>
              )}

              <h2 className="section-title">{filtering ? `${results.length} résultat(s)` : 'Toutes les fiches'}</h2>
              <div className="fiche-grid">
                {results.map((f) => (
                  <a key={f.id} href={`#/fiche/${f.id}`} className="fiche-card card">
                    <span className="muted small">{themes.find((t) => t.id === f.theme)?.icon} {themes.find((t) => t.id === f.theme)?.label}{f.simulator ? ' · 🧪 simulateur' : ''}</span>
                    <strong>{f.title}</strong>
                    <span>{inline(f.summary)}</span>
                    <span className="tags">{f.tags.map((t) => <span key={t} className="tag static">#{t}</span>)}</span>
                  </a>
                ))}
                {!results.length && <div className="empty">Aucune fiche pour l’instant ici.</div>}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
