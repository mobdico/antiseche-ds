import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-conditions-if',
  title: 'Les conditions avec if',
  theme: 'python-core',
  tags: ['controle', 'selection'],
  keywords: ['conditions', 'if', 'booléens', 'filtrer', 'indentation', 'if', '==', '!=', 'True', 'False', 'bool', 'IndentationError', 'filtrer', 'append', 'comparaison', 'Maybe you meant'],
  summary: 'Exécuter un bloc seulement si une condition est vraie, et combiner `for` + `if` + `append()` pour filtrer une liste.',
  concept: `
- L’instruction **\`if\`** exécute un bloc de code uniquement quand la condition qui la suit vaut **True**.
- Les opérateurs **\`==\`** (égal) et **\`!=\`** (différent) comparent deux valeurs et renvoient un booléen.
- **True** et **False** sont des valeurs de type \`bool\`, un type de données à part entière.
- Le corps d’un \`if\` doit être **indenté de 4 espaces** : sans indentation, Python renvoie une \`IndentationError\`.
- On combine une boucle \`for\`, un \`if\` et \`liste.append()\` pour **filtrer** et collecter les éléments selon un critère.
`,
  syntax: `if condition:          # instruction conditionnelle
    ...
prix == 0.0            # égalité
prix != 0.0            # différence
True / False           # booléens
if prix == 0.0:        # filtrer dans une boucle
    notes.append(note)`,
  simulators: traceSims(['filtrer']),
  pitfalls: [
    '`if prix = 0.0:` (un seul `=`) → `SyntaxError` : `=` affecte, `==` compare.',
    '`0 == 0.0` vaut **True** : int et float se comparent par valeur.',
    'Corps non indenté → `IndentationError`.',
  ],
  takeaways: ['`==` compare, `=` affecte.', 'Le bloc indenté ne s’exécute que si la condition est True.', 'for + if + append = filtre.'],
  related: ['python-boucles-for', 'python-conditions-multiples'],
  source: 'DataXp — Opérateurs et structures de données en Python, chapitre 2 (sources/python-core/dataxp-les-conditions-if-else-elif.pdf)',
});
