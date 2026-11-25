import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-scopes',
  title: 'Retourner plusieurs valeurs et les scopes',
  theme: 'python-core',
  tags: ['fonctions', 'references', 'erreurs'],
  keywords: ['fonctions', 'tuple', 'dépaquetage', 'scope', 'local', 'global', 'tuple', 'return a, b', 'dépaquetage', 'unpacking', 'too many values to unpack', "'tuple' object does not support item assignment", 'scope', 'portée', 'local', 'global', 'UnboundLocalError', 'NameError'],
  summary: 'Renvoyer plusieurs valeurs (un **tuple**), les dépaqueter, et comprendre la **portée** locale ou globale des variables.',
  concept: `
- Une fonction peut retourner **plusieurs valeurs** séparées par des virgules dans le \`return\`, ce qui crée automatiquement un **tuple**.
- Un **tuple** ressemble à une liste, mais il est **immuable** : on ne peut pas modifier ses éléments après création.
- Le **scope** (portée) d’une variable est la partie du programme où elle est accessible. Les variables définies **dans une fonction** sont en scope **local**, isolées du programme principal.
- Dans une fonction, Python cherche une variable d’abord dans le scope **local**, puis dans le scope **global** s’il ne la trouve pas.
`,
  syntax: `return a, b, c             # retourner plusieurs valeurs
mon_tuple = (1, "a", 10.5)  # créer un tuple
mon_tuple[0] = 99          # TypeError : tuple immuable
a, b = mon_tuple           # assignation multiple
def f(): x = 1             # x local à f`,
  simulators: traceSims(['retour-multiple', 'scopes']),
  pitfalls: [
    'Dépaqueter avec un mauvais nombre de noms → `ValueError: too many values to unpack`.',
    '`x = x + 1` dans une fonction sans `global x` → `UnboundLocalError` : `x` est considérée locale dans **toute** la fonction.',
    'Une variable créée dans une fonction n’existe plus après l’appel → `NameError` à l’extérieur.',
    'Dans le schéma mémoire, les variables locales apparaissent sous la forme `f › x` pendant l’appel, puis disparaissent.',
  ],
  takeaways: ['`return a, b` → tuple ; `x, y = f()`.', 'Affecter dans une fonction = local.', 'Lire : local puis global.'],
  related: ['python-fonctions', 'python-fonctions-natives'],
  source: 'DataXp — Les fonctions Python, chapitre 4 (sources/python-core/dataxp-retourner-plusieurs-valeurs-et-scopes.pdf)',
});
