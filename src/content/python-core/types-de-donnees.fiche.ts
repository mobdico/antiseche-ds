import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-types',
  title: 'Les types de données : int, float, str, conversions',
  theme: 'python-core',
  tags: ['types', 'int', 'float', 'str', 'conversion', 'chaînes'],
  keywords: ['type', 'int()', 'float()', 'round()', 'str()', 'bool()', 'concaténation', '+', 'f-string', 'échapper', '\\', 'triple guillemets', 'TypeError', 'can only concatenate str', 'ValueError', 'invalid literal for int()'],
  summary: 'Distinguer `int`, `float`, `str` et `bool`, convertir de l’un à l’autre, et construire des chaînes.',
  concept: `
- Python distingue les **entiers** (\`int\`) des **décimaux** (\`float\`). Le type détermine comment la valeur est stockée et quelles opérations sont possibles.
- \`int()\`, \`float()\` et \`round()\` convertissent un nombre : \`int()\` **tronque** la partie décimale, \`round()\` **arrondit** au plus proche.
- Une **chaîne** (\`str\`) est une séquence de caractères entre guillemets simples ou doubles.
- Le **backslash** \`\\\` permet d’échapper un guillemet ou une apostrophe dans une chaîne.
- \`+\` concatène des chaînes, mais ne peut pas mélanger directement chaînes et nombres : il faut d’abord convertir avec \`str()\`.
- Les **triples guillemets** (\`'''\` ou \`"""\`) créent des chaînes sur plusieurs lignes, avec tous types de guillemets sans échappement.
`,
  syntax: `int (42), float (3.14)      # entiers et flottants
type(valeur)                # vérifier un type
int(), float(), round()     # convertir un nombre
nom = "texte"               # ou 'texte'
\\'  \\"                      # échapper un guillemet
"a" + " " + "b"             # concaténer
str(3.5)                    # convertir en chaîne
'''ligne 1
ligne 2'''                  # chaîne multi-lignes`,
  simulators: traceSims(['conversions', 'concatenation', 'chaines']),
  pitfalls: [
    '`int(-3.7)` vaut **−3** (troncature vers 0), `round(-3.7)` vaut −4.',
    '`int("3.7")` → `ValueError` : passer par `float()` d’abord.',
    '`"Prix : " + 9.99` → `TypeError: can only concatenate str (not "float") to str`.',
    '`bool("False")` vaut **True** : toute chaîne non vide est vraie.',
    '`"5" + "5"` vaut `"55"`, pas 10.',
  ],
  takeaways: ['`type(x)` pour vérifier.', '`int()` tronque, `round()` arrondit.', 'Texte + nombre : `str()` ou f-string.'],
  related: ['python-variables', 'nettoyage-python-natif'],
  source: 'DataXp — Introduction à la programmation Python, chapitre 3 (sources/python-core/dataxp-les-types-de-donnees.pdf)',
});
