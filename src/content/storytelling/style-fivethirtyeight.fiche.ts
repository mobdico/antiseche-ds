import { defineFiche } from '../../engine/types';
import { vizSims } from '../_lib/viz';

export default defineFiche({
  id: 'story-style',
  title: 'Habiller un graphique : le style FiveThirtyEight',
  theme: 'storytelling',
  tags: ['lisibilite', 'graphiques'],
  keywords: ['style', 'fivethirtyeight', 'couleurs', 'grille', 'barh', 'style.use', 'fivethirtyeight', 'default', 'ggplot', 'seaborn-v0_8', 'ax.grid(False)', 'barh left', 'color', 'map', 'couleur conditionnelle'],
  summary: 'Changer l’apparence globale avec `style.use()`, colorer les barres selon une condition, et épurer la grille.',
  concept: `
- Le **style** Matplotlib change l’apparence globale (couleurs, grille, police) sans modifier les données. \`style.use("nom")\` doit être appelé **avant** \`plt.plot()\` ou \`ax.barh()\`.
- Le paramètre **\`left\`** de \`Axes.barh()\` décale l’origine des barres, ce qui permet de séparer visuellement deux graphiques superposés (principe de proximité).
- Le paramètre **\`color\`** de \`Axes.barh()\` accepte un **tableau de couleurs** (liste ou Series), une couleur par barre, dans l’ordre des données.
- Maximiser le **ratio d’encre-donnée** : retirer tout élément visuel qui n’apporte pas d’information (grille, graduations, encre redondante).
`,
  syntax: `from matplotlib import style
style.use("fivethirtyeight")          # changer de style
style.use("default")                  # revenir au défaut
ax.barh(index, valeurs, left=2)       # décaler les barres
ax.grid(False)                        # supprimer la grille
serie.map({True: "#33A1C9", False: "#ffae42"})   # couleurs conditionnelles`,
  simulators: vizSims(['style']),
  pitfalls: ['`style.use()` après le tracé n’a aucun effet sur le graphique déjà créé.', 'Le style reste actif pour **tous** les graphiques suivants : revenir à `"default"`.', 'Les noms de styles seaborn sont préfixés : `"seaborn-v0_8"` depuis matplotlib 3.6.'],
  takeaways: ['style.use avant de tracer.', 'color= accepte une couleur par barre.', 'Moins de grille, plus de message.'],
  related: ['story-audience'],
  source: 'DataXp — Storytelling et design de l’information, chapitre 4 (sources/storytelling/dataxp-styles-matplotlib-fivethirtyeight.pdf)',
});
