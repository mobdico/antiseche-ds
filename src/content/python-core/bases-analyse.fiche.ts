import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-bases-analyse',
  title: 'f-strings et parcours de dictionnaires',
  theme: 'python-core',
  tags: ['texte', 'dictionnaires', 'agregation'],
  keywords: ['f-string', 'formatage', 'dictionnaires', 'items', 'slicing', 'int()', 'table de fréquence', 'not in', '[:-1]', 'f-string', 'f"{variable}"', ':,.2f', 'séparateur de milliers', 'items()', 'for cle, valeur in d.items()', 'too many values to unpack'],
  summary: '**Formater** des nombres avec les f-strings et parcourir un dictionnaire avec `.items()`.',
  concept: `
- Les **f-strings**, préfixées par \`f\`, insèrent des variables et des expressions dans une chaîne grâce aux accolades \`{}\`.
- Le format **\`:,.2f\`** affiche un nombre avec une virgule comme séparateur de milliers et deux chiffres après la virgule.
- **\`dict.items()\`** retourne les paires clé-valeur, une par une, pour les parcourir dans une boucle.
`,
  syntax: `f"{variable}"                   # insérer une variable
f"{nombre:,.2f}"                # 1,234,567.89
for cle, valeur in d.items():   # parcourir un dictionnaire`,
  simulators: traceSims(['fstring', 'items']),
  pitfalls: [
    '`for cle, valeur in d:` (sans `.items()`) → `ValueError: too many values to unpack`.',
    '`:,` utilise la **virgule** anglaise comme séparateur (1,234,567), pas l’espace français.',
  ],
  takeaways: ['f"{x:,.2f}" : milliers + 2 décimales.', '`.items()` pour (clé, valeur).'],
  related: ['python-types'],
  source: 'DataXp — Manipuler et analyser des données en Python, chapitre 2 (sources/python-core/dataxp-bases-analyse-donnees-python.pdf)',
});
