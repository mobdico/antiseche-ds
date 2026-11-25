import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-fonctions',
  title: 'Créer et appeler une fonction',
  theme: 'python-core',
  tags: ['fonctions', 'def', 'return', 'paramètre', 'argument'],
  keywords: ['def', 'return', 'None', 'paramètre', 'argument', 'len', 'sum', 'min', 'max', 'fonction intégrée', "'return' outside function"],
  summary: 'Définir une fonction avec `def`, lui passer des **arguments**, récupérer son résultat avec `return`.',
  concept: `
- Une **fonction** prend une entrée, la traite, et retourne un résultat. Les fonctions intégrées comme \`len()\`, \`sum()\`, \`min()\` et \`max()\` sont prêtes à l’emploi.
- On crée une fonction avec **\`def\`**, suivi du nom, des parenthèses contenant les **paramètres**, et de deux-points. Le corps est **indenté de 4 espaces**.
- **\`return\`** définit ce que la fonction renvoie. On peut retourner une variable ou directement une expression.
- Un **paramètre** est la variable définie dans la déclaration (\`def f(parametre)\`). Un **argument** est la valeur concrète passée lors de l’appel (\`f(42)\`).
`,
  syntax: `def nom_fonction(parametre):     # créer une fonction
    ...
    return resultat               # retourner un résultat
resultat = ma_fonction(argument)  # appeler
len(), sum(), min(), max()        # fonctions intégrées`,
  simulators: traceSims(['def-appel', 'natives']),
  pitfalls: [
    '`print()` dans une fonction **affiche** mais ne renvoie rien : le résultat récupéré vaut `None`.',
    'Les variables créées dans la fonction (ici `x`, `resultat`) **disparaissent** après le `return` (voir le schéma mémoire).',
    '`return` en dehors d’une fonction → `SyntaxError`.',
  ],
  takeaways: ['def → paramètres ; appel → arguments.', '`return` renvoie, `print` affiche.', 'Sans return : `None`.'],
  related: ['python-arguments', 'python-scopes'],
  source: 'DataXp — Les fonctions Python, chapitre 1 (sources/python-core/dataxp-les-fonctions-en-python.pdf)',
});
