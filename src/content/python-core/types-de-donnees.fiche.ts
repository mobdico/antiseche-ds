import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-types',
  title: 'Les types de données : int, float, str, conversions',
  theme: 'python-core',
  tags: ['types', 'texte'],
  keywords: ['types', 'int', 'float', 'str', 'conversion', 'chaînes', 'type', 'int()', 'float()', 'round()', 'str()', 'bool()', 'concaténation', '+', 'f-string', 'échapper', '\\', 'triple guillemets', 'TypeError', 'can only concatenate str', 'ValueError', 'invalid literal for int()'],
  summary: 'Distinguer `int`, `float`, `str` et `bool`, convertir de l’un à l’autre, et construire des chaînes.',
  concept: `
- Python distingue les **entiers** (\`int\`) des **décimaux** (\`float\`). Le type détermine comment la valeur est stockée et quelles opérations sont possibles.
- \`int()\`, \`float()\` et \`round()\` convertissent un nombre : \`int()\` **tronque** la partie décimale, \`round()\` **arrondit** au plus proche.
- Une **chaîne** (\`str\`) est une séquence de caractères entre guillemets simples ou doubles.
- \`+\` concatène des chaînes, mais ne peut pas mélanger directement chaînes et nombres : il faut d’abord convertir avec \`str()\`.
`,
  syntax: `int (42), float (3.14)      # entiers et flottants
type(valeur)                # vérifier un type
int(), float(), round()     # convertir un nombre
nom = "texte"               # ou 'texte'
"a" + " " + "b"             # concaténer
str(3.5)                    # convertir en chaîne`,
  simulators: traceSims(['conversions', 'concatenation']),
  pitfalls: [
    '`int(-3.7)` vaut **−3** (troncature vers 0), `round(-3.7)` vaut −4.',
    '`int("3.7")` → `ValueError` : passer par `float()` d’abord.',
    '`"Prix : " + 9.99` → `TypeError: can only concatenate str (not "float") to str`.',
    '`bool("False")` vaut **True** : toute chaîne non vide est vraie.',
    '`"5" + "5"` vaut `"55"`, pas 10.',
  ],
  takeaways: ['`type(x)` pour vérifier.', '`int()` tronque, `round()` arrondit.', 'Texte + nombre : `str()` ou f-string.'],
  mentalModel: {
    title: 'La règle',
    code: `7 / 2      # 3.5   division : toujours un float
7 // 2     # 3     division entière (arrondi vers le bas : -7 // 2 = -4)
7 % 2      # 1     reste
int(3.9)   # 3     tronque, n’arrondit pas
round(2.5) # 2     arrondi « bancaire » : vers le pair
int("3.9") # ValueError → int(float("3.9"))`,
  },
  comparisons: [{
    title: 'Convertir : ce qui passe et ce qui casse',
    headers: ['Appel', 'Résultat', 'À retenir'],
    rows: [
      ['`int("12")`', '`12`', 'chiffres seulement'],
      ['`int("3.9")` / `int("12,5")`', '`ValueError`', 'passer par `float`, remplacer la virgule'],
      ['`int(3.9)` / `int(-3.9)`', '`3` / `-3`', 'tronque vers zéro'],
      ['`float("12.5")`', '`12.5`', 'le point est le séparateur décimal'],
      ['`str(25)`', '`"25"`', 'pour coller à un texte (ou une f-string)'],
      ['`bool("0")` / `bool("False")`', '`True` / `True`', 'toute chaîne **non vide** est vraie'],
      ['`bool(0)` / `bool("")` / `bool([])`', '`False`', 'zéro et le « vide » sont faux'],
    ],
  }, {
    title: 'Les calculs qui surprennent',
    headers: ['Expression', 'Résultat', 'Pourquoi'],
    rows: [
      ['`0.1 + 0.2`', '`0.30000000000000004`', 'les décimaux sont stockés en binaire, approximativement'],
      ['`0.1 + 0.2 == 0.3`', '`False`', 'comparer avec `round(x, 2)` ou `math.isclose`'],
      ['`round(2.5)` / `round(3.5)`', '`2` / `4`', 'arrondi au pair, pour ne pas biaiser les sommes'],
      ['`round(2.675, 2)`', '`2.67`', '2.675 est stocké comme 2.67499999…'],
      ['`6 / 2`', '`3.0`', '`/` renvoie toujours un float'],
      ['`"ab" * 3`', '`"ababab"`', '`*` répète une chaîne'],
    ],
    conclusion: 'Pour de l’argent ou un affichage, arrondir **à la fin** du calcul, pas à chaque étape.',
  }],
  related: ['python-variables'],
  source: 'DataXp — Introduction à la programmation Python, chapitre 3 (sources/python-core/dataxp-les-types-de-donnees.pdf)',
});
