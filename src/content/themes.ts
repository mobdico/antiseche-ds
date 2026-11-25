import type { Theme } from '../engine/types';

/** Les grandes thématiques. Ajouter un thème = ajouter une entrée ici + un dossier. */
export const themes: Theme[] = [
  { id: 'python-core', label: 'Python Core', icon: 'Py', hue: 212, order: 1, description: 'Types natifs, références, mutabilité, slicing, opérateurs.' },
  { id: 'numpy', label: 'NumPy', icon: 'Np', hue: 190, order: 2, description: 'ndarray, vues, broadcasting, axes.' },
  { id: 'pandas', label: 'Pandas', icon: 'Pd', hue: 255, order: 3, description: 'DataFrame, indexation, copies et vues, groupby.' },
  { id: 'nettoyage', label: 'Nettoyage de données', icon: 'Nt', hue: 155, order: 4, description: 'Valeurs manquantes, doublons, types, outliers.' },
  { id: 'analyse-visu', label: 'Analyse & Visualisation', icon: 'Vz', hue: 28, order: 5, description: 'Courbes, nuages de points, histogrammes, Seaborn.' },
  { id: 'storytelling', label: 'Storytelling & Design', icon: 'St', hue: 335, order: 6, description: 'Concevoir pour son audience, Gestalt, style des graphiques.' },
];
