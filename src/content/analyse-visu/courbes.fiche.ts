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
- Une **série temporelle** est une suite de valeurs ordonnées dans le temps. Par convention, le **temps est sur l’axe des x**.
- Un **graphique en courbes** relie des points par des lignes pour visualiser une évolution.
`,
  syntax: `import matplotlib.pyplot as plt
plt.plot(x, y)                         # tracer
plt.show()                             # afficher
plt.title("Mon titre")
plt.xlabel("..."), plt.ylabel("...")
plt.plot(x, y, label="..."); plt.legend()   # légende
plt.ticklabel_format(axis="y", style="plain")  # sans notation scientifique`,
  simulators: vizSims(['courbes', 'notation']),
  pitfalls: ['`plt.legend()` sans `label=` dans `plt.plot()` → légende vide (avertissement).', 'Le facteur `1e9` en haut de l’axe passe souvent inaperçu : préférer `style="plain"`.', 'Des dates serrées se chevauchent : `plt.xticks(rotation=45)`.'],
  takeaways: ['Temps → axe des x.', 'Titre + labels + légende.', 'Grands nombres : `ticklabel_format(style="plain")`.'],
  mentalModel: {
    title: 'La règle',
    code: `# style « plt » : agit sur le graphique EN COURS
plt.plot(x, y); plt.title("…"); plt.xlabel("…")

# style « fig, ax » : on désigne le graphique visé
fig, ax = plt.subplots()
ax.plot(x, y); ax.set_title("…"); ax.set_xlabel("…")`,
    note: 'Les deux dessinent la même chose. Dès qu’il y a **plusieurs graphiques**, `fig, ax` évite de se tromper de cible.',
  },
  comparisons: [{
    title: 'plt.… ou ax.… ?',
    headers: ['Action', 'Style `plt`', 'Style `ax`'],
    rows: [
      ['Tracer', '`plt.plot(x, y)`', '`ax.plot(x, y)`'],
      ['Titre', '`plt.title("…")`', '`ax.set_title("…")`'],
      ['Noms des axes', '`plt.xlabel` / `plt.ylabel`', '`ax.set_xlabel` / `ax.set_ylabel`'],
      ['Limites', '`plt.xlim(0, 10)`', '`ax.set_xlim(0, 10)`'],
      ['Graduations', '`plt.xticks(…)`', '`ax.set_xticks(…)`'],
      ['Légende, grille', '`plt.legend()`, `plt.grid()`', '`ax.legend()`, `ax.grid()` (mêmes noms)'],
      ['Depuis pandas', '`df.plot()` dessine sur le graphique en cours', '`df.plot(ax=ax)` : sur l’axe choisi'],
    ],
    conclusion: 'Règle de passage : `plt.xxx(…)` devient `ax.set_xxx(…)` — sauf `plot`, `legend`, `grid`, `bar`, `scatter`, qui gardent leur nom.',
  }, {
    title: 'Les erreurs du mélange',
    headers: ['Écriture', 'Erreur réelle', 'Correction'],
    rows: [
      ['`ax.title("Ventes")`', '`TypeError: \'Text\' object is not callable`', '`ax.set_title("Ventes")` (`ax.title` est l’objet titre)'],
      ['`ax.xlabel("mois")`', '`AttributeError: \'Axes\' object has no attribute \'xlabel\'`', '`ax.set_xlabel("mois")`'],
      ['`plt.set_title("…")`', '`AttributeError: module … has no attribute \'set_title\'`', '`plt.title("…")`'],
      ['`fig, axes = plt.subplots(1, 2)` puis `axes.plot(…)`', '`AttributeError: \'numpy.ndarray\' object has no attribute \'plot\'`', '`axes[0].plot(…)` : `axes` est un tableau d’axes'],
    ],
  }],
  related: ['visu-nuages', 'story-changement'],
  source: 'DataXp — Introduction à la visualisation de données, chapitre 1 (sources/analyse-visu/dataxp-graphiques-en-courbes-et-series-temporelles.pdf)',
});
