import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-programmer',
  title: 'Programmer en Python : print, opérateurs, commentaires',
  theme: 'python-core',
  tags: ['bases', 'print', 'opérateurs', 'priorités', 'SyntaxError'],
  keywords: ['print', '*', '/', '**', '//', '%', 'exponentiation', 'puissance', 'commentaire', '#', 'SyntaxError', 'ordre des opérations', 'priorité'],
  summary: 'Afficher avec `print()`, calculer avec les opérateurs, respecter l’**ordre des opérations** et commenter son code.',
  concept: `
- La fonction \`print()\` affiche dans la console le résultat de ce qu’on place entre ses parenthèses.
- Chaque instruction Python doit être écrite sur **sa propre ligne**, sinon Python déclenche une erreur de syntaxe (\`SyntaxError\`).
- Tout ce qui suit le symbole \`#\` sur une ligne est un **commentaire** : Python l’ignore lors de l’exécution.
- Python respecte l’**ordre des opérations** : les parenthèses et l’exponentiation d’abord, puis la multiplication et la division, enfin l’addition et la soustraction.
- L’exponentiation s’écrit avec deux astérisques \`**\` (par exemple \`5 ** 3\` pour 5 au cube).
`,
  syntax: `print(valeur)     # afficher une valeur
*   /             # multiplier, diviser
5 ** 3            # exponentiation (5 au cube)
# commentaire     # ignoré par Python
//   %            # division entière, reste (en plus)`,
  simulators: traceSims(['ordre-operations', 'une-instruction']),
  pitfalls: [
    '`/` renvoie **toujours** un float : `10 / 5` vaut `2.0`.',
    '`-2 ** 2` vaut **−4** : `**` passe avant le signe moins.',
    '`2 ** 3 ** 2` vaut 512 : `**` se calcule de droite à gauche.',
    'Deux instructions sur la même ligne → `SyntaxError`.',
  ],
  takeaways: ['Priorités : `()` → `**` → `* / // %` → `+ -`.', '`#` commente jusqu’à la fin de la ligne.', 'Une instruction par ligne.'],
  related: ['python-variables', 'python-types'],
  source: 'DataXp — Introduction à la programmation Python, chapitre 1 (sources/python-core/dataxp-programmer-en-python.pdf)',
});
