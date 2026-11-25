import { defineFiche } from '../../engine/types';
import { vizSims } from '../_lib/viz';

export default defineFiche({
  id: 'visu-seaborn',
  title: 'Seaborn et les graphiques relationnels',
  theme: 'analyse-visu',
  tags: ['graphiques', 'lisibilite'],
  keywords: ['seaborn', 'scatterplot', 'relplot', 'hue', 'facettes', 'import seaborn as sns', 'sns.set_theme', 'sns.scatterplot', 'hue', 'palette', 'size', 'sizes', 'style', 'sns.relplot', 'col', 'facettes', 'move_legend'],
  summary: 'Encoder plusieurs variables sur un même graphique (couleur, taille, forme) et séparer en **facettes**.',
  concept: `
- **Seaborn** est une librairie construite **au-dessus de matplotlib** : des graphiques plus riches avec moins de code.
- Un **graphique relationnel** montre les relations entre plusieurs variables en combinant **position, couleur, taille, forme et séparation spatiale**.
- **\`hue\`** ajoute une variable représentée par la **couleur** des points.
- **\`size\`** ajoute une variable représentée par la **taille**, avec \`sizes\` pour contrôler l’étendue.
- **\`style\`** ajoute une variable représentée par la **forme** des marqueurs.
- Pour séparer en sous-graphiques, on peut créer une grille avec \`plt.subplots()\` et passer chaque axe avec \`ax=\` ; **\`sns.relplot(..., col=...)\`** le fait en une ligne.
`,
  syntax: `import seaborn as sns
sns.set_theme()                                     # thème Seaborn
sns.scatterplot(data=df, x="col_x", y="col_y")      # nuage de points
hue="colonne", palette="RdYlGn"                     # couleur
size="colonne", sizes=(min, max)                    # taille
style="colonne"                                     # forme
sns.relplot(..., col="colonne")                     # facettes`,
  simulators: vizSims(['seaborn', 'relplot']),
  pitfalls: ['Trop d’encodages à la fois (hue + size + style) rendent le graphique illisible : choisir.', 'La légende peut masquer les points : `sns.move_legend(ax, "upper left", bbox_to_anchor=(1, 1))`.', '`relplot` crée sa propre figure : ne pas l’appeler après `plt.figure()`.'],
  takeaways: ['data=, x=, y= + hue / size / style.', 'relplot(col=) pour comparer des groupes.', 'Seaborn = matplotlib simplifié.'],
  related: ['visu-nuages', 'visu-pandas-grilles'],
  source: 'DataXp — Introduction à la visualisation de données, chapitre 5 (sources/analyse-visu/dataxp-seaborn-graphiques-relationnels.pdf)',
});
