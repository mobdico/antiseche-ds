import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-fonctions-natives',
  title: 'Fonctions natives, arguments par défaut, plusieurs return',
  theme: 'python-core',
  tags: ['fonctions', 'erreurs'],
  keywords: ['fonctions', 'arguments par défaut', 'return', 'del', 'natives', 'valeur par défaut', 'paramètre optionnel', 'del', 'écraser', 'sum', "'int' object is not callable", 'positional argument follows keyword argument', 'return multiple'],
  summary: 'Ne pas écraser une fonction native, rendre un paramètre optionnel avec une **valeur par défaut**, et comprendre qu’une fonction s’arrête au **premier return**.',
  concept: `
- Une **fonction native** (\`sum()\`, \`min()\`, \`max()\`…) peut être **écrasée** si tu définis une fonction ou une variable du même nom.
- Un **argument par défaut** se définit avec \`parametre=valeur\` dans la signature, et devient **optionnel** à l’appel.
- Une fonction peut contenir **plusieurs \`return\`** : elle s’arrête dès que le premier s’exécute, le reste du code n’est jamais atteint.
- \`del nom\` supprime une variable ou une fonction, ce qui rend l’accès à la fonction native du même nom.
`,
  syntax: `def sum(une_liste): ...          # ⚠ écrase la fonction native
def f(x, constante=10):          # argument par défaut
if condition: return a           # return selon une condition
del ma_fonction                  # supprimer une fonction`,
  simulators: traceSims(['ecraser-native', 'defaut', 'plusieurs-return']),
  pitfalls: [
    '`sum = 0` puis `sum(liste)` → `TypeError: \'int\' object is not callable`.',
    '`del sum` sans l’avoir redéfinie → `NameError` (on ne supprime pas la native).',
    'À l’appel, un argument positionnel **après** un nommé → `SyntaxError`.',
    'Le code placé après un `return` exécuté n’est jamais atteint.',
  ],
  takeaways: ['Ne pas nommer ses variables sum, min, max, list, dict…', '`param=défaut` → optionnel.', 'Premier return exécuté = fin de la fonction.'],
  related: ['python-arguments', 'python-scopes'],
  source: 'DataXp — Les fonctions Python, chapitre 3 (sources/python-core/dataxp-fonctions-natives-et-retours-multiples.pdf)',
});
