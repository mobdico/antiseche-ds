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
  mentalModel: {
    title: 'La règle',
    code: `datetime.strptime("31/12/2024", "%d/%m/%Y")   # str  → date   (p = parse : lire)
d.strftime("%d/%m/%Y")                      # date → str    (f = format : écrire)
fin - debut                                 # timedelta  → .days
pd.to_datetime(df["date"], format="%d/%m/%Y")   # toute une colonne
df["date"].dt.year, .dt.month, .dt.day_name()   # .dt : seulement sur une colonne de dates`,
    note: 'Tant qu’une date est un **texte**, on ne peut ni la trier correctement, ni calculer avec : `"10/01/2024" < "9/01/2024"` vaut `True`.',
  },
  comparisons: [{
    title: 'strptime ou strftime ?',
    headers: ['', '`strptime`', '`strftime`'],
    rows: [
      ['Sens', 'texte → **datetime**', 'datetime → **texte**'],
      ['Mnémotechnique', '**p** comme *parse* (analyser)', '**f** comme *format* (mettre en forme)'],
      ['Appel', '`datetime.strptime(texte, format)`', '`d.strftime(format)` : une méthode de la date'],
      ['Le format', 'doit décrire le texte **exactement**', 'choisit l’affichage voulu'],
      ['En pandas', '`pd.to_datetime(col, format=…)`', '`col.dt.strftime(…)`'],
    ],
    conclusion: 'Calculer et trier sur des dates ; ne convertir en texte (`strftime`) qu’au moment d’afficher.',
  }, {
    title: 'Python ou pandas pour les dates ?',
    headers: ['Besoin', 'Python (`datetime`)', 'pandas'],
    rows: [
      ['Lire une date', '`datetime.strptime(s, fmt)`', '`pd.to_datetime(col, format=fmt)`'],
      ['Valeurs invalides', '`ValueError`', '`errors="coerce"` → `NaT` (le NaN des dates)'],
      ['« 03/02/2024 » sans format', '—', 'lu **mois/jour** : 2 mars ! `dayfirst=True` ou `format="%d/%m/%Y"`'],
      ['Extraire l’année, le mois…', '`d.year`, `d.month`', '`col.dt.year`, `col.dt.month`, `col.dt.day_name()`'],
      ['Écart entre deux dates', '`(d2 - d1).days`', '`(col - ref).dt.days`'],
      ['Ajouter 30 jours', '`d + timedelta(days=30)`', '`col + pd.Timedelta(days=30)`'],
      ['Ajouter 1 mois', '**impossible** (`timedelta` n’a pas de `months`)', '`col + pd.DateOffset(months=1)` (31 janv. → 29 févr.)'],
      ['Regrouper par mois', '—', '`col.dt.to_period("M")` ou `resample("MS")`'],
    ],
    conclusion: '`.dt` ne marche que sur une colonne **déjà convertie** : sinon `Can only use .dt accessor with datetimelike values`.',
  }],
  related: ['python-types'],
  source: 'DataXp — Manipuler et analyser des données en Python, chapitre 4 (sources/python-core/dataxp-dates-et-heures-en-python.pdf)',
});
