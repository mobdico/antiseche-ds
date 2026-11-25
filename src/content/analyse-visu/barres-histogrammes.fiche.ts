import { defineFiche } from '../../engine/types';
import { vizSims } from '../_lib/viz';

export default defineFiche({
  id: 'visu-barres-histogrammes',
  title: 'Diagrammes en barres, histogrammes et distributions',
  theme: 'analyse-visu',
  tags: ['bar', 'barh', 'hist', 'bins', 'distribution'],
  keywords: ['plt.bar', 'plt.barh', 'plt.xticks', 'ticks', 'labels', 'rotation', 'value_counts(bins=)', 'plt.hist', 'bins', 'distribution normale', 'asymétrique', 'table de fréquences groupée'],
  summary: 'Comparer des catégories avec des **barres**, et voir la **forme d’une distribution** avec un histogramme.',
  concept: `
- Une **table de fréquences** : le résultat de \`Series.value_counts()\`, qui indique combien de fois chaque valeur apparaît.
- Une **table de fréquences groupée** : on regroupe les valeurs numériques en **intervalles égaux** avec \`bins\` quand il y a trop de valeurs uniques.
- Un **histogramme** : une variante du diagramme en barres **sans espace** entre les barres, où chaque barre représente un **intervalle**.
- **Distribution normale** : la plupart des valeurs au milieu, de moins en moins vers les extrémités.
- **Distribution asymétrique** : les valeurs s’accumulent d’un côté, avec une **longue traîne** de l’autre.
`,
  syntax: `plt.bar(x, height)                         # barres
plt.barh(y, width)                         # barres horizontales
plt.xticks(ticks=, labels=, rotation=)     # graduations
Series.value_counts(bins=10)               # table groupée
plt.hist(colonne)                          # histogramme`,
  simulators: vizSims(['barres', 'histogramme']),
  pitfalls: ['`plt.barh(y, width)` : les arguments s’appellent `y` et `width`, pas `x` et `height`.', 'Le nombre de `bins` change l’impression visuelle : tester plusieurs valeurs.', 'Renommer les graduations avec `labels=` sans vérifier l’ordre peut mal étiqueter les barres.'],
  takeaways: ['Barres = catégories ; histogramme = intervalles.', '`bins` contrôle la finesse.', 'Normale vs asymétrique.'],
  related: ['visu-pandas-grilles', 'story-audience'],
  source: 'DataXp — Introduction à la visualisation de données, chapitre 3 (sources/analyse-visu/dataxp-diagrammes-barres-histogrammes-distributions.pdf)',
});
