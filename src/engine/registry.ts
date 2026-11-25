import type { Fiche, Theme } from './types';
import { themes as rawThemes } from '../content/themes';
import { tagDefs } from '../content/tags';

/**
 * Découverte automatique : tout fichier `src/content/**\/*.fiche.ts` est chargé.
 * Ajouter une fiche = créer un fichier. Aucun autre fichier à modifier.
 */
const modules = import.meta.glob<{ default: Fiche }>('../content/**/*.fiche.ts', { eager: true });

export interface RegistryIssue {
  file: string;
  message: string;
}

export function buildRegistry(mods: Record<string, { default: Fiche }>, themeList: Theme[], tagIds: string[] = []) {
  const issues: RegistryIssue[] = [];
  const byId = new Map<string, Fiche>();
  const themeIds = new Set(themeList.map((t) => t.id));

  for (const [file, mod] of Object.entries(mods)) {
    const f = mod.default;
    if (!f || typeof f !== 'object' || !f.id) {
      issues.push({ file, message: 'pas d’export par défaut valide (utiliser defineFiche)' });
      continue;
    }
    if (byId.has(f.id)) {
      issues.push({ file, message: `id dupliqué « ${f.id} »` });
      continue;
    }
    if (!themeIds.has(f.theme)) issues.push({ file, message: `thème inconnu « ${f.theme} »` });
    for (const t of f.tags) if (tagIds.length && !tagIds.includes(t)) issues.push({ file, message: `tag hors vocabulaire « ${t} » (voir src/content/tags.ts)` });
    byId.set(f.id, f);
  }
  for (const f of byId.values())
    for (const r of f.related ?? [])
      if (!byId.has(r)) issues.push({ file: f.id, message: `fiche liée introuvable « ${r} »` });

  const fiches = [...byId.values()].sort((a, b) => a.title.localeCompare(b.title, 'fr'));
  const themes = [...themeList].sort((a, b) => a.order - b.order);
  const allTags = [...new Set(fiches.flatMap((f) => f.tags))].sort((a, b) => a.localeCompare(b, 'fr'));
  return { fiches, byId, themes, allTags, issues };
}

export const registry = buildRegistry(modules, rawThemes, tagDefs.map((t) => t.id));
if (registry.issues.length) console.warn('[antisèche] problèmes de contenu :', registry.issues);
