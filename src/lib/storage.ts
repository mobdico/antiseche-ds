import { useCallback, useEffect, useState } from 'react';

/** Préférences locales au navigateur (favoris, récents). Tolère un stockage indisponible. */
function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible : on garde l'état en mémoire */ }
}

export function useStoredList(key: string, max = 50) {
  const [items, setItems] = useState<string[]>(() => read<string[]>(key, []));
  useEffect(() => write(key, items), [key, items]);
  const toggle = useCallback((id: string) => setItems((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [id, ...xs].slice(0, max))), [max]);
  const push = useCallback((id: string) => setItems((xs) => [id, ...xs.filter((x) => x !== id)].slice(0, max)), [max]);
  return { items, toggle, push };
}
