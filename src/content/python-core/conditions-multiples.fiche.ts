import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-conditions-multiples',
  title: 'Les conditions multiples : and, or, elif, else',
  theme: 'python-core',
  tags: ['controle', 'erreurs'],
  keywords: ['conditions', 'and', 'or', 'elif', 'else', 'erreur logique', 'and', 'or', 'not', 'parenthèses', '>', '<', '>=', '<=', 'else', 'elif', 'erreur logique', 'priorité and or'],
  summary: 'Combiner des conditions avec `and` / `or`, contrôler la logique avec des parenthèses, enchaîner `if` / `elif` / `else`.',
  concept: `
- **\`and\`** : True uniquement si **toutes** les conditions sont True. Dès qu’une seule est False, tout est False.
- **\`or\`** : True dès qu’**au moins une** condition est True. False seulement si toutes sont False.
- **Parenthèses** : quand on combine \`and\` et \`or\`, elles contrôlent l’ordre d’évaluation. Sans elles, **\`and\` est évalué avant \`or\`**.
- Les opérateurs \`>\`, \`<\`, \`>=\`, \`<=\` comparent des valeurs numériques et renvoient un booléen.
- **\`else\`** s’exécute uniquement si le \`if\` précédent est False : il capture tous les cas restants.
- **\`elif\`** s’exécute si les conditions précédentes sont False et la sienne True. **Dès qu’un bloc est exécuté, les suivants sont ignorés.**
- **Erreur logique** : le code tourne sans erreur Python mais produit un résultat faux. Plus difficile à repérer qu’une erreur de syntaxe.
`,
  syntax: `if prix == 0 and genre == "Games":
if genre == "Games" or genre == "Social Networking":
if (a or b) and c:              # parenthèses
>   <   >=   <=   ==   !=       # comparaisons
if condition:
    ...
elif autre_condition:
    ...
else:
    ...`,
  simulators: traceSims(['and-or', 'elif']),
  pitfalls: [
    '`a and b or c` se lit `(a and b) or c` : souvent pas ce qu’on voulait.',
    'Mettre la condition la plus large en premier dans un `if/elif` : les suivantes ne sont jamais atteintes.',
    'Deux `if` successifs au lieu de `if/elif` : le second peut écraser le résultat du premier.',
  ],
  takeaways: ['and : tout vrai ; or : au moins un.', 'Toujours des parenthèses quand on mélange and / or.', 'if/elif : du plus restrictif au plus large.'],
  related: ['python-conditions-if', 'pandas-selection-avancee'],
  source: 'DataXp — Opérateurs et structures de données en Python, chapitre 3 (sources/python-core/dataxp-les-conditions-multiples.pdf)',
});
