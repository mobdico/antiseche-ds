import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-fonctions',
  title: 'Créer et appeler une fonction',
  theme: 'python-core',
  tags: ['fonctions'],
  keywords: ['callable', '__call__', 'appelable', "object is not callable", 'instance callable', 'fonctions', 'def', 'return', 'paramètre', 'argument', 'def', 'return', 'None', 'paramètre', 'argument', 'len', 'sum', 'min', 'max', 'fonction intégrée', "'return' outside function"],
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
  simulators: traceSims(['def-appel', 'natives', 'callable']),
  comparisons: [
    {
      title: 'callable ou pas ?',
      headers: ['Objet', '`callable(objet)`', 'Pourquoi'],
      rows: [
        ['une fonction, une `lambda`', '`True`', 'son type (`function`) définit `__call__`'],
        ['une méthode (`str.upper`), une fonction native (`len`, `print`)', '`True`', 'idem'],
        ['une **classe** (`MonObjet`)', '`True`', 'l’appeler **crée une instance** (`type.__call__`)'],
        ['une instance dont la classe définit `__call__`', '`True`', '`o(5)` exécute `MonObjet.__call__(o, 5)`'],
        ['une instance sans `__call__`', '`False`', '`o(5)` → `TypeError: \'MonObjet\' object is not callable`'],
        ['`5`, `"texte"`, `[1, 2]`, `{}`, une Series, `None`', '`False`', 'leur type ne définit pas `__call__`'],
      ],
      conclusion: 'Une **classe est toujours callable** ; une **instance** seulement si sa classe définit `__call__`.',
    },
  ],
  deepDives: [
    {
      title: 'Le concept de callable',
      body: `Un objet est **callable** si \`objet(...)\` est valide. Python regarde le **type** de l’objet : s’il définit \`__call__\`, l’appel est possible. \`callable(obj)\` fait exactement ce test.

Il y a **deux niveaux**, et c’est ce qui surprend :

- \`MonObjet(...)\` : on appelle la **classe** ; c’est \`type.__call__\` qui s’exécute et **fabrique une instance**. Toute classe est donc callable.
- \`o(...)\` : on appelle l’**instance** ; Python exécute \`type(o).__call__(o, ...)\`, c’est-à-dire \`MonObjet.__call__\`. Ça ne marche que si la classe l’a défini.

En data, cela explique les erreurs \`'int' object is not callable\` (un nom de fonction écrasé : \`sum = 0\` puis \`sum(...)\`) et pourquoi \`map\`, \`apply\` ou \`sorted(key=…)\` attendent une fonction **sans** parenthèses.`,
      code: `class MonObjet:
    def __call__(self, x):
        return x * 2

o = MonObjet()
callable(MonObjet)   # True  ← via type.__call__ (instanciation)
callable(o)          # True  ← via MonObjet.__call__
o(5)                 # 10    ← Python exécute type(o).__call__(o, 5)`,
    },
  ],
  pitfalls: [
    '`print()` dans une fonction **affiche** mais ne renvoie rien : le résultat récupéré vaut `None`.',
    'Les variables créées dans la fonction (ici `x`, `resultat`) **disparaissent** après le `return` (voir le schéma mémoire).',
    '`return` en dehors d’une fonction → `SyntaxError`.',
  ],
  takeaways: ['def → paramètres ; appel → arguments.', '`return` renvoie, `print` affiche.', 'Sans return : `None`.'],
  related: ['python-arguments', 'python-scopes'],
  source: 'DataXp — Les fonctions Python, chapitre 1 (sources/python-core/dataxp-les-fonctions-en-python.pdf)',
});
