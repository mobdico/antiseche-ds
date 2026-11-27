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
  simulators: traceSims(['dico', 'in-dico', 'cles']),
  pitfalls: [
    'Clé absente → `KeyError` ; `d.get(clé, défaut)` évite l’erreur.',
    '`{1: "un", True: "vrai"}` ne contient qu’**une** clé : `{1: "vrai"}`.',
    'Une liste comme clé → `TypeError: unhashable type: \'list\'` (un tuple fonctionne).',
    'Pas d’accès par position : `d[0]` cherche la **clé** 0.',
  ],
  takeaways: ['Accès par clé, pas par position.', 'Clés uniques et hashables.', 'Ajouter ou modifier : `d[clé] = valeur`.'],
  mentalModel: {
    title: 'La règle',
    code: `d["Paris"]             # lire : KeyError si la clé manque
d.get("Paris", 0)      # lire avec une valeur par défaut
d["Lyon"] = 3          # ajouter OU remplacer
"Lyon" in d            # tester une CLÉ (pas une valeur)
for cle, valeur in d.items(): ...`,
  },
  comparisons: [{
    title: 'Lire une clé : [ ], get ou in ?',
    headers: ['Écriture', 'Clé présente', 'Clé absente'],
    rows: [
      ['`d[cle]`', 'la valeur', '`KeyError`'],
      ['`d.get(cle)`', 'la valeur', '`None`'],
      ['`d.get(cle, 0)`', 'la valeur', '`0`'],
      ['`cle in d`', '`True`', '`False` (cherche dans les **clés** ; `in d.values()` pour les valeurs)'],
      ['`d.setdefault(cle, [])`', 'la valeur', 'crée la clé avec `[]` et la renvoie'],
    ],
    conclusion: 'Compter ou regrouper sans tester : `d[k] = d.get(k, 0) + 1`.',
  }, {
    title: 'Parcourir un dictionnaire',
    headers: ['Boucle', 'Donne'],
    rows: [
      ['`for k in d`', 'les **clés**'],
      ['`for v in d.values()`', 'les valeurs'],
      ['`for k, v in d.items()`', 'les paires (clé, valeur)'],
      ['`sorted(d)`', 'les clés triées (une liste)'],
      ['`sorted(d.items(), key=lambda kv: kv[1], reverse=True)`', 'les paires triées par valeur décroissante'],
    ],
    conclusion: 'Une clé doit être **non modifiable** : `str`, nombre ou tuple. Une liste comme clé → `TypeError: unhashable type: \'list\'`.',
  }],
  related: ['nettoyage-pandas'],
  source: 'DataXp — Opérateurs et structures de données en Python, chapitre 4 (sources/python-core/dataxp-les-dictionnaires-python.pdf)',
});
