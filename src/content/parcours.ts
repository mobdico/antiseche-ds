/**
 * Parcours : les fiches de cours dans l'ordre du cursus (modules et chapitres des PDF DataXp).
 * Les labos n'en font pas partie (ce sont des outils d'exploration, proposés via « Voir aussi »).
 * L'ordre des chapitres vient de la numérotation des PDF et de leurs sections « La suite ».
 */
export interface Module {
  id: string;
  title: string;
  course: string; // le parcours DataXp
  fiches: string[];
}

export const modules: Module[] = [
  { id: 'intro-prog', course: 'Python pour la Data Science', title: 'Introduction à la programmation Python',
    fiches: ['python-variables', 'python-types', 'python-listes'] },
  { id: 'operateurs', course: 'Python pour la Data Science', title: 'Opérateurs et structures de données',
    fiches: ['python-boucles-for', 'python-conditions-if', 'python-conditions-multiples', 'python-dictionnaires'] },
  { id: 'fonctions', course: 'Python pour la Data Science', title: 'Les fonctions Python',
    fiches: ['python-fonctions', 'python-arguments', 'python-fonctions-natives', 'python-scopes'] },
  { id: 'manipuler', course: 'Python pour la Data Science', title: 'Manipuler et analyser des données en Python',
    fiches: ['python-bases-analyse', 'python-dates'] },
  { id: 'numpy-pandas', course: 'Analyse et visualisation de données', title: 'Introduction à NumPy et pandas',
    fiches: ['numpy-introduction', 'numpy-indexation-booleenne', 'pandas-introduction', 'pandas-formes', 'pandas-statistiques-filtrage', 'pandas-selection-avancee', 'nettoyage-pandas'] },
  { id: 'visualisation', course: 'Analyse et visualisation de données', title: 'Introduction à la visualisation de données',
    fiches: ['visu-courbes', 'visu-nuages', 'visu-barres-histogrammes', 'visu-pandas-grilles', 'visu-seaborn'] },
  { id: 'storytelling', course: 'Analyse et visualisation de données', title: 'Storytelling et design de l’information',
    fiches: ['story-audience', 'story-changement', 'story-style'] },
  { id: 'nettoyage', course: 'Nettoyage de données', title: 'Nettoyage et analyse de données avec Python',
    fiches: ['pandas-agregation', 'pandas-combiner', 'pandas-transformer', 'nettoyage-chaines', 'nettoyage-valeurs-manquantes'] },
];

/** Toutes les fiches du parcours, dans l'ordre. */
export const parcours: string[] = modules.flatMap((m) => m.fiches);

export function placeInParcours(id: string) {
  const i = parcours.indexOf(id);
  if (i < 0) return null;
  const module = modules.find((m) => m.fiches.includes(id))!;
  return { index: i, total: parcours.length, module, prev: parcours[i - 1], next: parcours[i + 1] };
}
