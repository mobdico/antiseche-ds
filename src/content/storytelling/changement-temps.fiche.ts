import { defineFiche } from '../../engine/types';
import { vizSims } from '../_lib/viz';

export default defineFiche({
  id: 'story-changement',
  title: 'Raconter un changement dans le temps',
  theme: 'storytelling',
  tags: ['subplots', 'axes', 'axhline', 'annotations', 'zip'],
  keywords: ['plt.subplots(nrows=4, ncols=1)', 'axes[2]', 'for ax in axes', 'ax.text', 'axhline', 'xmin', 'xmax', 'linewidth', 'barre de progression', 'zip', 'histoire de données'],
  summary: 'Construire une **histoire** avec une grille de graphiques, cibler un graphique précis et annoter le changement.',
  concept: `
- Une **histoire de données** est une suite d’événements liés dans le temps qui montrent un **changement**, à la différence d’un graphique qui présente des faits statiques.
- **\`plt.subplots()\`** retourne une Figure et un **tableau d’Axes**, accessibles par indexation comme \`axes[0]\`.
- Une **boucle \`for\`** sur \`axes\` applique le même traitement à tous les graphiques ; **\`axes[2]\`** en cible un seul.
- **\`Axes.text()\`** ajoute du texte libre : titre, sous-titre, annotations.
- **\`Axes.axhline()\`** trace une ligne horizontale ; avec \`linewidth\`, elle simule une **barre de progression**.
- **\`zip()\`** parcourt plusieurs séquences en parallèle et s’arrête dès que la plus courte est épuisée.
`,
  syntax: `fig, axes = plt.subplots(nrows=4, ncols=1, figsize=(6, 8))
for ax in axes:                        # tous les graphiques
    ax.plot(x, y)
axes[2].plot(x, y)                     # un graphique précis
axes[0].text(x, y, "texte")            # annoter
ax.axhline(y=valeur, xmin=0.5, xmax=0.8, linewidth=6)  # barre`,
  simulators: vizSims(['subplots-story']),
  pitfalls: ['`xmin` / `xmax` de `axhline` sont des **fractions de largeur** (0 à 1), pas des valeurs de l’axe x.', '`zip(axes, colonnes)` coupe silencieusement si les longueurs diffèrent.'],
  takeaways: ['Tout en gris, l’essentiel en couleur.', 'Boucle pour le commun, index pour l’exception.', 'Annoter le changement.'],
  related: ['story-gestalt', 'visu-courbes', 'labo-python'],
  source: 'DataXp — Storytelling et design de l’information, chapitre 2 (sources/storytelling/dataxp-raconter-un-changement-dans-le-temps.pdf)',
});
