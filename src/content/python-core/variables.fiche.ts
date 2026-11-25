import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-variables',
  title: 'Les variables : affectation, nommage, références',
  theme: 'python-core',
  tags: ['debuter', 'references', 'erreurs'],
  keywords: ['variables', 'affectation', 'références', 'mutabilité', 'NameError', '=', '+=', '-=', '*=', '/=', '**=', 'snake_case', 'NameError', 'name is not defined', 'nommage', 'mot réservé', 'référence', 'id', 'immuable', 'mutable'],
  summary: 'Créer et mettre à jour des variables, les nommer correctement, et comprendre qu’une variable est un **nom qui pointe vers un objet**.',
  concept: `
- Une **variable** est un emplacement en mémoire identifié par un nom, qui stocke une valeur. Plus précisément en Python : un **nom** qui **référence** un objet (voir les flèches du simulateur).
- Le signe \`=\` est l’**opérateur d’affectation** : il stocke la valeur de droite dans la variable de gauche.
- Les noms ne peuvent contenir que des **lettres, des chiffres et des underscores**, et ne peuvent pas commencer par un chiffre.
- La convention **snake_case** : minuscules et underscores pour séparer les mots.
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
  simulators: traceSims(['raccourcis', 'references', 'nommage', 'nameerror']),
  pitfalls: [
    '`b = a` ne copie pas : `a` et `b` désignent **le même objet** (même adresse).',
    'Avec un `int` (immuable), `a += 1` crée un **nouvel objet** : `b` garde l’ancienne valeur.',
    'Avec une liste (mutable), `a += [1]` modifie l’objet **partagé** : `b` change aussi ! Alors que `a = a + [1]` crée une nouvelle liste.',
    '`/=` transforme un entier en float (100 → 10.0).',
    '`Prix` et `prix` sont deux variables différentes.',
  ],
  takeaways: ['Variable = nom → objet.', 'snake_case, pas de chiffre au début, pas de tiret ni d’espace.', 'NameError = nom jamais défini (à l’exécution).'],
  related: ['python-programmer', 'python-types', 'python-listes'],
  source: 'DataXp — Introduction à la programmation Python, chapitre 2 (sources/python-core/dataxp-les-variables.pdf)',
});
