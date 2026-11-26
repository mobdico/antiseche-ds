import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-dates',
  title: 'Manipuler les dates et heures',
  theme: 'python-core',
  tags: ['temps', 'types'],
  keywords: ['datetime', 'dates', 'strptime', 'strftime', 'timedelta', 'datetime', 'import datetime as dt', 'strptime', 'strftime', '%d', '%m', '%Y', '%B', '%A', '%H', '%M', 'timedelta', 'durée', 'does not match format', 'unconverted data remains', 'total_seconds'],
  summary: 'Créer des dates, convertir **chaîne ↔ date** avec `strptime` / `strftime`, et calculer des **durées** avec `timedelta`.',
  concept: `
- Le module **\`datetime\`** fournit les classes \`datetime.datetime\` (date et heure), \`datetime.time\` (heure seule) et \`datetime.timedelta\` (durée).
- **\`strptime\`** (avec un **p**, comme *parse*) convertit une **chaîne en datetime**. **\`strftime\`** (avec un **f**, comme *format*) fait l’inverse.
- Codes courants : \`%d\` (jour), \`%m\` (mois), \`%Y\` (année sur 4 chiffres), \`%B\` (mois en toutes lettres), \`%A\` (jour de la semaine), \`%H\` / \`%M\` (heure / minute sur 24 h).
- Soustraire deux datetime produit un **timedelta**, qui représente une **durée** plutôt qu’un instant.
- datetime et time supportent les **comparaisons** (\`>\`, \`<\`) : \`min()\` et \`max()\` fonctionnent sur des listes de dates.
`,
  syntax: `import datetime as dt
dt.datetime(annee, mois, jour, heure, minute)   # créer une date
dt.datetime.strptime(chaine, format)            # chaîne → date
objet_dt.strftime(format)                       # date → chaîne
date_fin - date_debut                           # durée
dt.timedelta(days=0, hours=0, minutes=0)        # créer une durée`,
  simulators: traceSims(['strptime', 'strftime', 'timedelta']),
  pitfalls: [
    'Le format de `strptime` doit correspondre **exactement** : sinon `ValueError: time data … does not match format`.',
    'Format trop court → `ValueError: unconverted data remains`.',
    '`%m` = mois, `%M` = minutes : ne pas les confondre.',
    '`%A` / `%B` donnent des noms **anglais** avec la locale par défaut.',
    'Une durée négative s’affiche `-1 day, 0:00:00`.',
  ],
  takeaways: ['strptime : p = parse (texte → date).', 'strftime : f = format (date → texte).', 'date − date = timedelta.'],
  related: ['python-types'],
  source: 'DataXp — Manipuler et analyser des données en Python, chapitre 4 (sources/python-core/dataxp-dates-et-heures-en-python.pdf)',
});
