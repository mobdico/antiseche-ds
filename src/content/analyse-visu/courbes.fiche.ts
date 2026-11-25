import { defineFiche } from '../../engine/types';
import { vizSims } from '../_lib/viz';

export default defineFiche({
  id: 'visu-courbes',
  title: 'Graphiques en courbes et séries temporelles',
  theme: 'analyse-visu',
  tags: ['graphiques', 'temps'],
  keywords: ['matplotlib', 'plot', 'séries temporelles', 'légende', 'import matplotlib.pyplot as plt', 'plt.plot', 'plt.show', 'plt.title', 'plt.xlabel', 'plt.ylabel', 'plt.legend', 'label', 'ticklabel_format', 'notation scientifique', '1e9', 'linéaire', 'exponentielle', 'logarithmique'],
  summary: 'Tracer l’évolution d’une valeur dans le temps avec `plt.plot()`, et habiller le graphique (titre, axes, légende).',
  concept: `
- Un graphique se construit sur deux **axes perpendiculaires** : l’axe des **x** (horizontal) et l’axe des **y** (vertical), qui se croisent à l’origine.
- Une coordonnée se note **(x, y)** : la première valeur indique la distance par rapport à l’axe des y, la seconde par rapport à l’axe des x.
- Une **série temporelle** est une suite de valeurs ordonnées dans le temps. Par convention, le **temps est sur l’axe des x**.
- Un **graphique en courbes** relie des points par des lignes pour visualiser une évolution.
- Croissance **linéaire** : rythme constant ; **exponentielle** : s’accélère ; **logarithmique** : ralentit.
`,
  syntax: `import matplotlib.pyplot as plt
plt.plot(x, y)                         # tracer
plt.show()                             # afficher
plt.title("Mon titre")
plt.xlabel("..."), plt.ylabel("...")
plt.plot(x, y, label="..."); plt.legend()   # légende
plt.ticklabel_format(axis="y", style="plain")  # sans notation scientifique`,
  simulators: vizSims(['courbes', 'croissances', 'notation']),
  pitfalls: ['`plt.legend()` sans `label=` dans `plt.plot()` → légende vide (avertissement).', 'Le facteur `1e9` en haut de l’axe passe souvent inaperçu : préférer `style="plain"`.', 'Des dates serrées se chevauchent : `plt.xticks(rotation=45)`.'],
  takeaways: ['Temps → axe des x.', 'Titre + labels + légende.', 'Forme de la courbe = type de croissance.'],
  related: ['visu-nuages', 'story-changement'],
  source: 'DataXp — Introduction à la visualisation de données, chapitre 1 (sources/analyse-visu/dataxp-graphiques-en-courbes-et-series-temporelles.pdf)',
});
