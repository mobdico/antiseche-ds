import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-bases-analyse',
  title: 'Les bases de l’analyse de données en Python',
  theme: 'python-core',
  tags: ['f-string', 'formatage', 'dictionnaires', 'items', 'slicing'],
  keywords: ['int()', 'table de fréquence', 'not in', '[:-1]', 'f-string', 'f"{variable}"', ':,.2f', 'séparateur de milliers', 'items()', 'for cle, valeur in d.items()', 'too many values to unpack'],
  summary: 'Convertir, compter avec une table de fréquence, découper une chaîne, et **formater** des nombres avec les f-strings.',
  concept: `
- \`int()\` transforme une chaîne en entier pour permettre des calculs.
- Une **table de fréquence** est un dictionnaire qui compte combien de fois chaque valeur apparaît.
- Le slicing **\`chaine[:-1]\`** retire le dernier caractère, utile pour transformer un âge comme 24 en décennie 2.
- Les **f-strings**, préfixées par \`f\`, insèrent des variables et des expressions dans une chaîne grâce aux accolades \`{}\`.
- Le format **\`:,.2f\`** affiche un nombre avec une virgule comme séparateur de milliers et deux chiffres après la virgule.
- **\`dict.items()\`** retourne les paires clé-valeur, une par une, pour les parcourir dans une boucle.
`,
  syntax: `int(valeur)                     # chaîne → entier
if cle not in d:                # table de fréquence
    d[cle] = 1
else:
    d[cle] += 1
chaine[:-1]                     # retirer le dernier caractère
f"{variable}"                   # insérer une variable
f"{nombre:,.2f}"                # 1,234,567.89
for cle, valeur in d.items():   # parcourir un dictionnaire`,
  simulators: traceSims(['fstring', 'decennie', 'items', 'compter']),
  pitfalls: [
    '`str(7)[:-1]` donne `""` → `int("")` lève `ValueError` ; `age // 10` est plus robuste.',
    '`for cle, valeur in d:` (sans `.items()`) → `ValueError: too many values to unpack`.',
    '`:,` utilise la **virgule** anglaise comme séparateur (1,234,567), pas l’espace français.',
  ],
  takeaways: ['f"{x:,.2f}" : milliers + 2 décimales.', '`.items()` pour (clé, valeur).', 'Table de fréquence : if not in / else += 1.'],
  related: ['python-tables-frequences', 'python-types'],
  source: 'DataXp — Manipuler et analyser des données en Python, chapitre 2 (sources/python-core/dataxp-bases-analyse-donnees-python.pdf)',
});
