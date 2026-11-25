import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-arguments',
  title: 'Arguments, paramètres et débogage',
  theme: 'python-core',
  tags: ['fonctions', 'erreurs'],
  keywords: ['fonctions', 'arguments', 'positionnels', 'nommés', 'traceback', 'débogage', 'argument positionnel', 'argument nommé', 'keyword', 'traceback', 'TypeError', 'missing 1 required positional argument', 'unsupported operand type(s)', 'ZeroDivisionError', 'débogage'],
  summary: 'Rendre une fonction réutilisable avec des paramètres, appeler par position ou par nom, combiner des fonctions et **lire un traceback**.',
  concept: `
- Les **paramètres** rendent une fonction **réutilisable** : au lieu de coder en dur un dataset ou un indice, on les passe en paramètre.
- Les **arguments nommés** utilisent \`parametre=valeur\` : l’ordre n’a pas d’importance.
- Les **arguments positionnels** sont passés sans nom : \`table_freq(donnees_apps, 7)\`. L’**ordre est crucial**.
- On peut **réutiliser des fonctions** à l’intérieur d’autres fonctions pour construire des opérations complexes.
- Un **traceback** remonte la chaîne d’appels. La **dernière ligne** indique le type d’erreur ; les lignes précédentes montrent **où** elle s’est produite.
`,
  syntax: `def extraire(indice):                   # un paramètre
def table_freq(dataset, indice):        # plusieurs paramètres
table_freq(donnees_apps, 7)             # positionnels
table_freq(dataset=donnees_apps, indice=7)   # nommés
calculer_somme(col) / calculer_longueur(col) # combiner
# TypeError: unsupported operand type(s)    ← lire un traceback`,
  simulators: traceSims(['positionnels-nommes', 'traceback']),
  pitfalls: [
    'Arguments positionnels dans le mauvais ordre : l’erreur apparaît **loin** de l’appel (`\'int\' object is not iterable`).',
    'Argument oublié → `TypeError: … missing 1 required positional argument`.',
    'Un traceback se lit **de bas en haut** : commencer par la dernière ligne.',
  ],
  takeaways: ['Positionnels = par ordre ; nommés = par nom.', 'Traceback : erreur en bas, chemin au-dessus.', 'Petites fonctions combinées.'],
  related: ['python-fonctions', 'python-fonctions-natives'],
  source: 'DataXp — Les fonctions Python, chapitre 2 (sources/python-core/dataxp-arguments-parametres-debogage.pdf)',
});
