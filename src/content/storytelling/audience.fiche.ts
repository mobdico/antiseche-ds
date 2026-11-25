import { defineFiche } from '../../engine/types';
import { vizSims } from '../_lib/viz';

export default defineFiche({
  id: 'story-audience',
  title: 'Concevoir pour son audience : ratio d’encre-donnée',
  theme: 'storytelling',
  tags: ['lisibilite', 'graphiques'],
  keywords: ['data-ink', 'interface OO', 'spines', 'annotations', 'fig, ax = plt.subplots()', 'Figure', 'Axes', 'ax.barh', 'figsize', 'spines', 'set_visible', 'tick_params', 'ax.text', 'ratio encre-donnée', 'data-ink ratio', 'familiarité'],
  summary: 'Choisir un graphique familier, utiliser l’interface objet de matplotlib et **effacer tout ce qui n’est pas de la donnée**.',
  concept: `
- **Principe de familiarité** : privilégier un type de graphique que l’audience connaît déjà, lisible sans effort de décodage.
- L’**interface orientée objet** de Matplotlib repose sur deux objets : la **Figure** (la toile) et l’**Axes** (le graphique).
- Le **ratio d’encre-donnée** mesure la part de l’encre utilisée pour représenter les données plutôt que la structure ou les décorations.
- On le maximise en effaçant l’**encre non-donnée** (bordures, graduations) et l’**encre-donnée redondante** (étiquettes en trop, barres trop épaisses).
- **\`Axes.text()\`** positionne librement un texte, avec \`x\`, \`y\`, \`s\`, \`size\` et \`weight\`.
`,
  syntax: `fig, ax = plt.subplots()                  # interface objet
ax.barh(x, y)                             # barres horizontales
fig, ax = plt.subplots(figsize=(l, h))    # taille
ax.spines["left"].set_visible(False)      # retirer une bordure
ax.tick_params(bottom=False)              # retirer des graduations
ax.text(x, y, s)                          # ajouter du texte`,
  simulators: vizSims(['data-ink']),
  pitfalls: ['Retirer l’axe des x **et** ne pas écrire les valeurs : le lecteur ne peut plus rien lire.', 'Des barres trop épaisses sont de l’encre redondante.'],
  takeaways: ['Figure = toile, Axes = graphique.', 'Effacer bordures et graduations inutiles.', 'Écrire les valeurs plutôt qu’un axe.'],
  related: ['story-gestalt', 'story-style'],
  source: 'DataXp — Storytelling et design de l’information, chapitre 1 (sources/storytelling/dataxp-concevoir-pour-son-audience.pdf)',
});
