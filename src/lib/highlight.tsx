import type { ReactNode } from 'react';

const KW = new Set('False None True and as assert break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));
const BUILTIN = new Set('print len id list dict set tuple range copy deepcopy type isinstance sum min max sorted enumerate zip'.split(' '));

/** Coloration syntaxique Python minimaliste (suffisante pour des extraits courts). */
export function highlightPython(code: string): ReactNode[] {
  const re = /(#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_\d#"']+)/g;
  const out: ReactNode[] = [];
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(code))) {
    const [t, com, str, num, id] = m;
    if (com) out.push(<span key={k++} className="tk-com">{t}</span>);
    else if (str) out.push(<span key={k++} className="tk-str">{t}</span>);
    else if (num) out.push(<span key={k++} className="tk-num">{t}</span>);
    else if (id && KW.has(id)) out.push(<span key={k++} className="tk-kw">{t}</span>);
    else if (id && BUILTIN.has(id)) out.push(<span key={k++} className="tk-fn">{t}</span>);
    else out.push(t);
  }
  return out;
}

export function Code({ code, className = '', activeLine }: { code: string; className?: string; activeLine?: number }) {
  if (!activeLine) return <pre className={`code ${className}`}><code>{highlightPython(code)}</code></pre>;
  return (
    <pre className={`code ${className}`}><code>
      {code.split('\n').map((l, i) => (
        <span key={i} className={`code-line ${i + 1 === activeLine ? 'active' : ''}`}>{highlightPython(l)}{'\n'}</span>
      ))}
    </code></pre>
  );
}
