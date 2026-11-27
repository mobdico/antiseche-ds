import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-variables',
  title: 'Les variables : affectation et références',
  theme: 'python-core',
  tags: ['references', 'erreurs'],
  keywords: ['variables', 'affectation', 'références', 'mutabilité', 'NameError', '=', '+=', '-=', '*=', '/=', '**=', 'snake_case', 'NameError', 'name is not defined', 'nommage', 'mot réservé', 'référence', 'id', 'immuable', 'mutable'],
  summary: 'Créer et mettre à jour des variables, les nommer correctement, et comprendre qu’une variable est un **nom qui pointe vers un objet**.',
  concept: `
- Une **variable** est un emplacement en mémoire identifié par un nom, qui stocke une valeur. Plus précisément en Python : un **nom** qui **référence** un objet (voir les flèches du simulateur).
- Le signe \`=\` est l’**opérateur d’affectation** : il stocke la valeur de droite dans la variable de gauche.
- On met à jour une variable en la réaffectant à elle-même combinée avec une opération : \`total = total + 10\`.
- Les raccourcis \`+=\`, \`-=\`, \`*=\`, \`/=\`, \`**=\` mettent à jour une variable en une seule expression.
- Une **NameError** survient quand on utilise une variable pas encore définie. C’est une erreur **d’exécution**, pas de syntaxe.
`,
  syntax: `prix = 6.99            # créer une variable
resultat = 1.99 * 2    # sauvegarder un calcul
print(prix)            # afficher
total = total + 100    # mettre à jour
total += 100           # raccourci d'addition
prix *= 4              # raccourci de multiplication`,
  simulators: traceSims(['references', 'raccourcis', 'nameerror']),
  pitfalls: [
    '`b = a` ne copie pas : `a` et `b` désignent **le même objet** (même adresse).',
    'Avec un `int` (immuable), `a += 1` crée un **nouvel objet** : `b` garde l’ancienne valeur.',
    'Avec une liste (mutable), `a += [1]` modifie l’objet **partagé** : `b` change aussi ! Alors que `a = a + [1]` crée une nouvelle liste.',
    '`/=` transforme un entier en float (100 → 10.0).',
    '`Prix` et `prix` sont deux variables différentes.',
  ],
  takeaways: ['Variable = nom → objet.', 'NameError = nom jamais défini (à l’exécution).'],
  mentalModel: {
    title: 'La règle',
    code: `a == b      # même VALEUR ?
a is b      # même OBJET (même id) ?
x is None   # la seule comparaison où l’on écrit « is »
b = a       # b pointe vers le même objet que a : rien n’est copié`,
    note: 'Une variable est une **étiquette** posée sur un objet. L’affectation déplace l’étiquette ; elle ne copie jamais l’objet.',
  },
  comparisons: [{
    title: '== ou is ?',
    headers: ['Expression', 'Résultat', 'Pourquoi'],
    rows: [
      ['`[1, 2] == [1, 2]`', '`True`', 'mêmes valeurs'],
      ['`[1, 2] is [1, 2]`', '`False`', 'deux listes distinctes en mémoire'],
      ['`1 == 1.0` / `True == 1`', '`True` / `True`', 'valeurs égales, types différents'],
      ['`x is None`', '`True` si x vaut None', '`None` est unique : c’est l’usage recommandé de `is`'],
      ['`np.nan == np.nan`', '`False`', 'NaN n’est égal à rien : utiliser `pd.isna(x)`'],
      ['`int("257") is int("257")`', '`False`', 'Python ne réutilise les entiers que de −5 à 256 : ne jamais comparer des nombres avec `is`'],
    ],
    conclusion: 'Comparer des valeurs → `==`. Tester `None` → `is None`. Rien d’autre avec `is`.',
  }, {
    title: 'Modifiable ou non : ce que fait +=',
    headers: ['', 'Immuables : `int`, `float`, `str`, `tuple`', 'Modifiables : `list`, `dict`, `set`, DataFrame'],
    rows: [
      ['Peut-on changer l’objet ?', 'non : on en crée un nouveau', 'oui, sur place'],
      ['`x += 1` / `s += "c"`', 'nouvel objet, l’étiquette est déplacée (`id` change)', '—'],
      ['`liste += [2]`', '—', 'la **même** liste est agrandie (`id` identique)'],
      ['Si un autre nom pointe dessus', 'il garde l’ancienne valeur', 'il **voit** la modification'],
    ],
    conclusion: 'Le partage d’un objet ne pose problème que s’il est **modifiable** : c’est là qu’il faut `.copy()`.',
  }],
  related: ['python-types', 'python-listes'],
  source: 'DataXp — Introduction à la programmation Python, chapitre 2 (sources/python-core/dataxp-les-variables.pdf)',
});
