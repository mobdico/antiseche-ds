import { useEffect, useMemo, useState } from 'react';
import { drawSeries, quizCards, type QuizCard, type QuizHistory } from '../content/_lib/quiz';
import { Code } from '../lib/highlight';
import { Markdown, inline } from '../lib/markdown';

const KEY = 'quiz-history-v1';
const SERIES = 10;
type Scope = 'all' | 'pandas' | 'numpy' | 'missed';

function loadHistory(): QuizHistory {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as QuizHistory; } catch { return {}; }
}
function saveHistory(h: QuizHistory) {
  try { localStorage.setItem(KEY, JSON.stringify(h)); } catch { /* stockage indisponible : l’historique reste en mémoire */ }
}

export function Quiz() {
  const cards = useMemo(() => quizCards(), []);
  const [history, setHistory] = useState<QuizHistory>(loadHistory);
  const [scope, setScope] = useState<Scope>('all');
  const [series, setSeries] = useState<QuizCard[]>([]);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]); // réponses à la carte en cours
  const [results, setResults] = useState<boolean[]>([]); // carte réussie ou non, pour la série

  useEffect(() => saveHistory(history), [history]);

  const missed = cards.filter((c) => history[c.id]?.last === 'ko');
  const seen = cards.filter((c) => history[c.id]).length;
  const pool = scope === 'missed' ? missed : scope === 'all' ? cards : cards.filter((c) => c.lib === scope);

  const start = (s: Scope = scope) => {
    const p = s === 'missed' ? missed : s === 'all' ? cards : cards.filter((c) => c.lib === s);
    setSeries(drawSeries(p, history, SERIES));
    setPos(0); setAnswers([]); setResults([]);
  };

  const card = series[pos];
  const finished = series.length > 0 && pos >= series.length;
  const done = card && answers.length === card.questions.length;
  const cardOk = done && card.questions.every((q, i) => q.answer === answers[i]);

  const answer = (k: number) => {
    if (!card || done) return;
    const next = [...answers, k];
    setAnswers(next);
    if (next.length === card.questions.length) {
      const ok = card.questions.every((q, i) => q.answer === next[i]);
      setResults((r) => [...r, ok]);
      setHistory((h) => {
        const prev = h[card.id] ?? { ok: 0, ko: 0, last: 'ok' as const, t: 0 };
        return { ...h, [card.id]: { ok: prev.ok + (ok ? 1 : 0), ko: prev.ko + (ok ? 0 : 1), last: ok ? 'ok' : 'ko', t: Date.now() } };
      });
    }
  };
  const nextCard = () => { setPos((p) => p + 1); setAnswers([]); };

  // clavier : 1–4 pour répondre, Entrée pour passer à la suite
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (!card || (e.target as HTMLElement)?.closest('input, textarea')) return;
      const q = card.questions[answers.length];
      const n = Number(e.key);
      if (q && n >= 1 && n <= q.options.length) { e.preventDefault(); answer(n - 1); }
      else if (done && e.key === 'Enter') { e.preventDefault(); nextCard(); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  // ------------------------------------------------------------ accueil du mode
  if (!series.length) {
    const scopes: [Scope, string, number][] = [
      ['all', 'Tout', cards.length], ['pandas', 'pandas', cards.filter((c) => c.lib === 'pandas').length],
      ['numpy', 'NumPy', cards.filter((c) => c.lib === 'numpy').length], ['missed', 'À revoir', missed.length],
    ];
    return (
      <div className="quiz">
        <p className="crumb"><a href="#/">Accueil</a> / Devine</p>
        <h1>Devine le résultat</h1>
        <p className="hero-sub">Une expression, le jeu de données : à toi de prévoir ce qu’elle renvoie — <b>Series ou DataFrame</b>, l’<b>index</b>, le <b>.name</b>, la <b>shape</b>, ou l’erreur. Chaque réponse vient d’une <b>exécution réelle</b> de pandas 3.1 ou NumPy.</p>
        <div className="quiz-stats">
          <span><b>{seen}</b> / {cards.length} cartes vues</span>
          <span><b>{cards.filter((c) => history[c.id]?.last === 'ok').length}</b> réussies</span>
          <span className={missed.length ? 'ko' : ''}><b>{missed.length}</b> à revoir</span>
        </div>
        <div className="seg quiz-scope" role="radiogroup" aria-label="Sujet">
          {scopes.map(([s, l, n]) => (
            <button key={s} role="radio" aria-checked={scope === s} className={scope === s ? 'on' : ''} disabled={n === 0} onClick={() => setScope(s)}>
              {l} <span className="count">{n}</span>
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled={!pool.length} onClick={() => start()}>
          {scope === 'missed' ? `Revoir mes erreurs` : `Commencer une série de ${Math.min(SERIES, pool.length)}`}
        </button>
        <p className="muted quiz-hint">Les cartes ratées reviennent en priorité dans les séries suivantes. Raccourcis : <kbd>1</kbd>–<kbd>4</kbd> pour répondre, <kbd>Entrée</kbd> pour continuer.</p>
      </div>
    );
  }

  // ------------------------------------------------------------ bilan de la série
  if (finished) {
    const score = results.filter(Boolean).length;
    const wrong = series.filter((_, i) => !results[i]);
    return (
      <div className="quiz">
        <p className="crumb"><a href="#/">Accueil</a> / <a href="#/devine" onClick={(e) => { e.preventDefault(); setSeries([]); }}>Devine</a> / Bilan</p>
        <h1>{score} / {series.length}</h1>
        <p className="hero-sub">{score === series.length ? 'Sans faute.' : score >= series.length * 0.7 ? 'Bien joué — les erreurs reviendront dans les prochaines séries.' : 'Les cartes ratées reviendront en priorité : c’est en se trompant qu’on retient.'}</p>
        {wrong.length > 0 && (
          <section className="panel">
            <h2 className="label">À revoir</h2>
            <ul className="quiz-wrong">{wrong.map((c) => (
              <li key={c.id}><code>{c.expr}</code> <a href={`#/fiche/${c.ficheId}`}>rejouer →</a></li>
            ))}</ul>
          </section>
        )}
        <div className="quiz-actions">
          <button className="btn-primary" onClick={() => start()}>Nouvelle série</button>
          {missed.length > 0 && <button className="btn" onClick={() => { setScope('missed'); start('missed'); }}>Revoir mes {missed.length} erreurs</button>}
          <button className="btn" onClick={() => setSeries([])}>Terminer</button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ une carte
  return (
    <div className="quiz">
      <div className="quiz-top">
        <button className="link" onClick={() => setSeries([])}>← Quitter</button>
        <span className="muted">Carte {pos + 1} / {series.length}</span>
        <span className="progress"><span style={{ width: `${((pos + (done ? 1 : 0)) / series.length) * 100}%` }} /></span>
      </div>
      <div className="panel quiz-card">
        <p className="eyebrow">{card.lib === 'numpy' ? 'NumPy' : 'pandas'} · {card.familyTitle.replace(/^Labo( NumPy)? — /, '').split(' : ')[0]}</p>
        <details className="quiz-data"><summary>Les données{card.lib === 'numpy' ? ' (a, b, v)' : ' (df)'}</summary><Code code={card.dataset} /></details>
        <Code code={`res = ${card.expr}`} className="quiz-expr" />

        {card.questions.slice(0, answers.length + 1).map((q, qi) => {
          const given = answers[qi];
          return (
            <div key={qi} className="quiz-q">
              <p className="quiz-prompt">{inline(q.prompt)}</p>
              <div className="quiz-options">
                {q.options.map((o, k) => {
                  const state = given === undefined ? '' : k === q.answer ? 'right' : k === given ? 'wrong' : 'off';
                  return (
                    <button key={k} className={`quiz-opt ${state}`} disabled={given !== undefined} onClick={() => answer(k)}>
                      <kbd>{k + 1}</kbd><span>{inline(o)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {done && (
          <div className={`quiz-reveal ${cardOk ? 'ok' : 'ko'}`}>
            <p className="quiz-verdict">{cardOk ? '✓ Exact' : '✗ Pas tout à fait'}</p>
            <pre className="console">{card.printed}</pre>
            <Markdown text={card.explain} />
            {card.versionNote && <p className="muted">{inline(card.versionNote)}</p>}
            <div className="quiz-actions">
              <button className="btn-primary" onClick={nextCard} autoFocus>{pos + 1 < series.length ? 'Carte suivante' : 'Voir le bilan'} <kbd>Entrée</kbd></button>
              <a href={`#/fiche/${card.ficheId}`} className="btn">Rejouer dans le labo →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
