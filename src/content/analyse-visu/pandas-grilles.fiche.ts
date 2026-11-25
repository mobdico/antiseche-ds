import { defineFiche } from '../../engine/types';
import { vizSims } from '../_lib/viz';

export default defineFiche({
  id: 'visu-pandas-grilles',
  title: 'Visualisation avec pandas et grilles de graphiques',
  theme: 'analyse-visu',
  tags: ['graphiques', 'lisibilite'],
  keywords: ['pandas plot', 'subplot', 'small multiples', 'figsize', 'serie.plot.hist', 'plot.bar', 'plot.barh', 'plot.line', 'df.plot.scatter', 'plt.subplot', 'nrows', 'ncols', 'index', 'plt.figure', 'figsize', 'small multiple', 'xlim', 'ylim'],
  summary: 'Tracer directement depuis une Series ou un DataFrame, et comparer des groupes avec une **grille de graphiques**.',
  concept: `
- Les **méthodes de tracé de pandas** (\`Series.plot.hist()\`, \`.bar()\`, \`.barh()\`, \`.line()\`) génèrent des graphiques Matplotlib directement, sans \`plt.hist()\` ni \`plt.bar()\`.
- Une **grille de graphiques** (*small multiples*) : des graphiques similaires partageant les **mêmes échelles**, pour faciliter la comparaison.
- **\`plt.subplot(nrows, ncols, index)\`** crée un graphique à la position \`index\` dans une grille ; les index se comptent de gauche à droite puis de haut en bas (en commençant à **1**).
- **\`plt.figure(figsize=(largeur, hauteur))\`** contrôle la taille de la figure entière, utile pour aérer une grille.
`,
  syntax: `serie.plot.hist()                # histogramme
serie.plot.barh()                # barres horizontales
df.plot.scatter(x=, y=)          # nuage de points
plt.subplot(nrows, ncols, index) # case d'une grille
plt.figure(figsize=(largeur, hauteur))`,
  simulators: vizSims(['pandas-plot', 'subplot']),
  pitfalls: ['`plt.subplot` compte à partir de **1**, pas de 0.', 'Sans échelles communes (`xlim`, `ylim`), une grille compare mal : des écarts semblent grands ou petits à tort.', 'Appeler `plt.figure(figsize=...)` **avant** les `subplot`.'],
  takeaways: ['`serie.plot.<type>()`.', 'subplot(lignes, colonnes, index à partir de 1).', 'Mêmes échelles pour comparer.'],
  related: ['visu-barres-histogrammes', 'visu-seaborn'],
  source: 'DataXp — Introduction à la visualisation de données, chapitre 4 (sources/analyse-visu/dataxp-visualisation-pandas-grilles-graphiques.pdf)',
});
