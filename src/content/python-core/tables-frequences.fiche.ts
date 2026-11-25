import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-tables-frequences',
  title: 'Les tables de fréquences',
  theme: 'python-core',
  tags: ['dictionnaires', 'fréquences', 'comptage', 'proportion', 'pourcentage'],
  keywords: ['in', 'get', 'compteur', '+= 1', 'fréquence', 'proportion', 'pourcentage', 'min', 'max', 'intervalle', 'KeyError', 'values', 'for clé in dico'],
  summary: 'Compter les occurrences de chaque valeur avec un dictionnaire, puis calculer proportions et pourcentages.',
  concept: `
- L’opérateur **\`in\`** vérifie si une valeur existe comme **clé** dans un dictionnaire, **pas comme valeur**.
- On modifie la valeur d’une clé existante avec \`dico['clé'] = nouvelle_valeur\`, ou on l’incrémente avec \`dico['clé'] += 1\`.
- Pour **compter** les valeurs uniques : un dictionnaire vide et un \`if/else\` — si la clé existe, on incrémente ; sinon, on l’initialise à 1.
- **Fréquence** = nombre d’apparitions ; **proportion** = fréquence / total ; **pourcentage** = proportion × 100.
- \`for cle in dico\` : la variable d’itération prend les **clés**, pas les valeurs.
- Pour une colonne numérique avec beaucoup de valeurs, on regroupe en **intervalles** pour une table lisible.
- \`min()\` et \`max()\` trouvent les bornes d’une liste, ce qui aide à choisir les intervalles.
`,
  syntax: `"clé" in mon_dico                     # la clé existe ?
mon_dico["clé"] = nouvelle_valeur     # modifier
mon_dico["clé"] += 1                  # incrémenter
dico[clé] = dico.get(clé, 0) + 1      # comptage automatique
for clé in mon_dico:                  # parcourir les clés
proportion = fréquence / total
pourcentage = proportion * 100
min(liste), max(liste)`,
  simulators: traceSims(['compter', 'in-dico', 'proportions']),
  pitfalls: [
    '`freq[g] += 1` sur une clé jamais vue → `KeyError`.',
    '`3 in freq` cherche la **clé** 3, pas la valeur 3 : utiliser `freq.values()`.',
    'Diviser par le nombre de catégories au lieu du total : erreur logique, les pourcentages ne font pas 100.',
  ],
  takeaways: ['Compter : `d[k] = d.get(k, 0) + 1`.', '`in` teste les clés.', 'proportion = fréquence / total.'],
  related: ['python-dictionnaires', 'pandas-statistiques-filtrage', 'labo-doublons'],
  source: 'DataXp — Opérateurs et structures de données en Python, chapitre 5 (sources/python-core/dataxp-les-tables-de-frequences.pdf)',
});
