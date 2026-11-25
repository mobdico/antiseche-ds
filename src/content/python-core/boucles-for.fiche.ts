import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-boucles-for',
  title: 'Les boucles for : itérer, accumuler, convertir',
  theme: 'python-core',
  tags: ['controle', 'types'],
  keywords: ['boucles', 'for', 'accumulateur', 'append', 'csv', 'for', 'in', 'itération', 'indentation', 'somme', 'accumulateur', 'append', 'open', 'reader', 'csv', 'float', 'sum', 'len', 'moyenne', 'IndentationError', 'unsupported operand type'],
  summary: 'Répéter un bloc pour chaque élément d’une liste, accumuler un total, construire une liste avec `append()`.',
  concept: `
- La boucle **\`for\`** répète un bloc de code pour **chaque élément** d’une liste, indispensable pour traiter de grands jeux de données.
- Le **corps** de la boucle (le code indenté de **4 espaces**) s’exécute une fois par élément. Chaque exécution s’appelle une **itération**.
- On **accumule** des valeurs dans une variable initialisée **avant** la boucle (\`somme = 0\`), puis on utilise le résultat **après** la boucle.
- \`open()\` ouvre un fichier, \`reader()\` le lit, et \`list()\` le transforme en liste de listes.
- Les données lues depuis un CSV sont **toujours des chaînes** : il faut les convertir avec \`int()\` ou \`float()\` avant de calculer.
- \`liste.append(valeur)\` ajoute des éléments un par un à une liste existante.
`,
  syntax: `for element in liste:           # écrire une boucle
    ...
somme = 0                       # accumuler
for v in valeurs:
    somme = somme + v
from csv import reader          # lire un CSV
lignes = list(reader(open("f.csv")))
float("3.5")                    # chaîne → décimal
liste.append(valeur)            # ajouter un élément
sum(liste) / len(liste)         # moyenne`,
  simulators: traceSims(['accumuler', 'convertir-csv']),
  pitfalls: [
    'Initialiser l’accumulateur **dans** la boucle le remet à 0 à chaque tour : seul le dernier élément compte.',
    'Oublier l’indentation → `IndentationError: expected an indented block`.',
    '`sum()` sur des chaînes → `TypeError: unsupported operand type(s) for +: \'int\' and \'str\'`.',
    '`int("12.5")` échoue : utiliser `float()` pour les décimaux.',
  ],
  takeaways: ['Initialiser avant, accumuler dedans, utiliser après.', 'CSV = texte → convertir.', 'Corps indenté de 4 espaces.'],
  related: ['python-listes', 'python-conditions-if', 'nettoyage-python-natif'],
  source: 'DataXp — Opérateurs et structures de données en Python, chapitre 1 (sources/python-core/dataxp-les-boucles-for.pdf)',
});
