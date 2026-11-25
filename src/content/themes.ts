import type { Theme } from '../engine/types';

/** Les grandes thématiques. Ajouter un thème = ajouter une entrée ici + un dossier. */
export const themes: Theme[] = [
  { id: 'python-core', label: 'Python Core', icon: '🐍', order: 1, description: 'Types natifs, références, mutabilité, slicing, opérateurs.' },
  { id: 'numpy', label: 'NumPy', icon: '🔢', order: 2, description: 'ndarray, vues, broadcasting, axes.' },
  { id: 'pandas', label: 'Pandas', icon: '🐼', order: 3, description: 'DataFrame, indexation, copies et vues, groupby.' },
  { id: 'nettoyage', label: 'Nettoyage de données', icon: '🧹', order: 4, description: 'Valeurs manquantes, doublons, types, outliers.' },
  { id: 'analyse-visu', label: 'Analyse & Visualisation', icon: '📊', order: 5, description: 'Analyse exploratoire, agrégations, graphiques.' },
];
