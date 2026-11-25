import { defineFiche } from '../../engine/types';
import { vizSims } from '../_lib/viz';

export default defineFiche({
  id: 'visu-nuages',
  title: 'Nuages de points et corrélations',
  theme: 'analyse-visu',
  tags: ['scatter', 'corrélation', 'pearson', 'matplotlib'],
  keywords: ['plt.scatter', 'corr', 'df.corr()', 'Pearson', 'r', 'corrélation positive', 'corrélation négative', 'causalité', 'xticks rotation'],
  summary: 'Visualiser la relation entre deux variables avec `plt.scatter()` et la mesurer avec le **coefficient de Pearson**.',
  concept: `
- **La corrélation** : une relation statistique entre deux colonnes, **positive** (elles augmentent ensemble) ou **négative** (l’une augmente quand l’autre diminue).
- **Le coefficient de Pearson (r)** : une valeur entre **−1 et 1** qui mesure la force d’une corrélation, indépendamment de son signe.
- **La corrélation n’implique pas la causalité** : deux colonnes peuvent varier ensemble sans lien de cause à effet direct.
- Les colonnes **catégorielles encodées avec des nombres** (comme \`weathersit\`) s’interprètent avec prudence : le signe de leur corrélation dépend d’un encodage arbitraire.
`,
  syntax: `plt.scatter(x, y)              # nuage de points
plt.xticks(rotation=45)        # pivoter les graduations
colonne1.corr(colonne2)        # corrélation entre deux colonnes
df.corr()                      # toutes les colonnes`,
  simulators: vizSims(['scatter', 'pearson']),
  pitfalls: ['r ≈ 0 ne veut pas dire « aucune relation » : seulement **aucune relation linéaire** (voir la parabole).', 'Corrélation ≠ causalité.', '`df.corr()` sur des colonnes de texte → erreur en pandas 2+ : `df.corr(numeric_only=True)`.'],
  takeaways: ['|r| proche de 1 = relation forte.', 'Signe = sens de la relation.', 'Toujours regarder le nuage, pas seulement r.'],
  related: ['visu-courbes', 'visu-seaborn'],
  source: 'DataXp — Introduction à la visualisation de données, chapitre 2 (sources/analyse-visu/dataxp-nuages-de-points-et-correlations.pdf)',
});
