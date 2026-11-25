import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-dictionnaires',
  title: 'Les dictionnaires : paires clé → valeur',
  theme: 'python-core',
  tags: ['dictionnaires', 'erreurs'],
  keywords: ['dictionnaires', 'dict', 'clés', 'hashable', 'dict', '{}', 'clé', 'valeur', 'KeyError', 'get', 'hashable', 'unhashable type', 'hash', 'True 1', 'clé dupliquée'],
  summary: 'Stocker des **paires clé → valeur**, lire, ajouter et modifier par clé, et savoir quelles clés sont autorisées.',
  concept: `
- Un **dictionnaire** est une collection de paires **clé-valeur**, créée avec des accolades \`{}\` et la syntaxe \`clé: valeur\`.
- On accède à une valeur avec \`dictionnaire['clé']\`, comme l’indexation des listes mais avec une **clé** au lieu d’un index numérique.
- On peut créer un dictionnaire vide avec \`{}\` puis ajouter des paires une par une avec \`dictionnaire['clé'] = valeur\`.
- Les clés doivent être **hashables** : \`str\`, \`int\`, \`float\` et \`bool\` sont autorisés, pas les \`list\` ni les \`dict\`.
- Chaque clé est **unique** : si une clé est répétée, Python conserve la **première clé** et la **dernière valeur**.
- \`hash()\` convertit une clé en entier. \`hash(True)\` vaut 1 et \`hash(False)\` vaut 0, ce qui crée des **conflits** avec les clés 1 et 0.
`,
  syntax: `d = {"clé": valeur, "clé2": valeur2}   # créer
d["clé"]                               # accéder
d["nouvelle_clé"] = valeur             # ajouter
d = {}                                 # dictionnaire vide
# clés valides : int, str, float, bool (pas list ni dict)
d.get("clé", défaut)                   # lire sans KeyError (en plus)`,
  simulators: traceSims(['dico', 'cles']),
  pitfalls: [
    'Clé absente → `KeyError` ; `d.get(clé, défaut)` évite l’erreur.',
    '`{1: "un", True: "vrai"}` ne contient qu’**une** clé : `{1: "vrai"}`.',
    'Une liste comme clé → `TypeError: unhashable type: \'list\'` (un tuple fonctionne).',
    'Pas d’accès par position : `d[0]` cherche la **clé** 0.',
  ],
  takeaways: ['Accès par clé, pas par position.', 'Clés uniques et hashables.', 'Ajouter ou modifier : `d[clé] = valeur`.'],
  related: ['python-tables-frequences', 'nettoyage-pandas'],
  source: 'DataXp — Opérateurs et structures de données en Python, chapitre 4 (sources/python-core/dataxp-les-dictionnaires-python.pdf)',
});
