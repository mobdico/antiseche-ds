import { Fragment, type ReactNode } from 'react';

/** Markdown léger : `code`, **gras**, *italique*. Pas de HTML brut → pas d'injection. */
export function inline(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('`') && p.endsWith('`') && p.length > 1) return <code key={i}>{p.slice(1, -1)}</code>;
    if (p.startsWith('**') && p.endsWith('**') && p.length > 3) return <strong key={i}>{inline(p.slice(2, -2))}</strong>;
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

/** Blocs : paragraphes séparés par une ligne vide, listes "- ", blocs ``` de code. */
export function Markdown({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (b.startsWith('```')) {
          return <pre key={i} className="md-code">{lines.slice(1, lines[lines.length - 1].startsWith('```') ? -1 : undefined).join('\n')}</pre>;
        }
        if (lines.every((l) => /^\s*- /.test(l)))
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*- /, ''))}</li>)}</ul>;
        return <p key={i}>{inline(lines.join(' '))}</p>;
      })}
    </>
  );
}
