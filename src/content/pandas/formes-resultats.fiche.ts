import { labFiche } from '../_lib/lab';

// Résultats réels générés par scripts/lab/generate.py (famille « formes »), pandas 3.1 et 2.2
export default labFiche('formes', {
  id: 'pandas-formes',
  title: 'Que renvoie une opération ? Series, DataFrame, index, name',
  tags: ['selection', 'agregation'],
  keywords: ['Series', 'DataFrame', 'index', '.index', 'name', '.name', 'columns', '.columns', 'index.name', 'value_counts', 'isnull().sum()', 'groupby',
    'reset_index', 'as_index', 'alignement', 'étiquettes', 'AttributeError', "'Series' object has no attribute 'columns'", "'DataFrame' object has no attribute 'name'", 'forme du résultat'],
  summary: 'Avant d’enchaîner, savoir ce qu’on obtient : **Series ou DataFrame**, ce qu’il y a dans **l’index**, et s’il y a un **`.name`** ou des **`.columns`**.',
  concept: `
**Dans pandas, tout passe par les étiquettes** : l’index (le nom des lignes) et les noms de colonnes. On sélectionne par étiquette (\`.loc\`, \`df["col"]\`), les calculs entre Series s’**alignent** sur les étiquettes, et la plupart des opérations **fabriquent un nouvel index** à partir de ce qu’elles calculent. Seul \`.iloc\` raisonne en positions.

Pour prévoir le résultat d’une opération, trois questions :
- **Series ou DataFrame ?** Une Series a un \`.name\` mais **pas** de \`.columns\` ; un DataFrame a des \`.columns\` mais **pas** de \`.name\`.
- **Qu’y a-t-il dans l’index ?** Souvent ce n’est plus 0, 1, 2… : ce sont les valeurs comptées (\`value_counts\`), les noms des colonnes (\`isnull().sum()\`, \`mean()\`) ou les **clés du groupby**.
- **Comment s’appellent l’index et la Series ?** \`index.name\` garde souvent le nom de la colonne d’origine ; \`.name\` peut être vide (\`None\`).

Les cas à connaître :
- \`df["ville"].value_counts()\` → Series ; **index** = les villes, \`index.name = 'ville'\` ; \`.name = 'count'\`.
- \`df.isnull().sum()\` → **Series** (pas un DataFrame) ; **index** = les noms des colonnes ; \`.name\` vide.
- \`df.groupby("ville")["score"].mean()\` → Series ; **la clé du groupby devient l’index** ; \`.name = 'score'\`.
- \`df.groupby("ville")[["score"]].mean()\` → DataFrame indexé par ville.
- \`.reset_index()\` ou \`groupby(..., as_index=False)\` → la clé **redevient une colonne**, l’index repart de 0.
`,
  syntax: `df["col"]                             # Series      .name = 'col'
df[["col"]]                           # DataFrame   .columns = ['col']
df.loc[0]                             # Series      index = noms des colonnes
s.value_counts()                      # Series      index = valeurs, .name = 'count'
df.isnull().sum()                     # Series      index = noms des colonnes, .name = None
df.groupby("k")["x"].mean()           # Series      index = clés du groupby
df.groupby("k")[["x"]].mean()         # DataFrame   index = clés du groupby
df.groupby("k", as_index=False)["x"].mean()   # DataFrame, k reste une colonne
resultat.reset_index()                # l'index redevient une colonne`,
  useCase: 'Juste avant un `merge`, un graphique ou un export : savoir si la clé est dans l’index ou dans une colonne évite la moitié des erreurs.',
  pitfalls: [
    '`df.isnull().sum()` est une **Series** : `.columns` n’existe pas, les noms de colonnes sont dans l’**index**.',
    'Après un `groupby`, la clé est dans l’**index** : `res["ville"]` lève `KeyError`. Utiliser `res.index`, ou `reset_index()`.',
    '`merge` sur une clé passée dans l’index échoue : `reset_index()` d’abord, ou `left_index=True`.',
    'Un calcul entre deux Series d’index différents s’**aligne** : les étiquettes absentes d’un côté donnent `NaN`.',
  ],
  takeaways: [
    'Tout passe par les étiquettes (index + colonnes) ; seul `.iloc` utilise les positions.',
    'Series → `.name`, pas de `.columns` ; DataFrame → `.columns`, pas de `.name`.',
    'groupby, value_counts, isnull().sum() : le résultat est **indexé par ce qu’on a calculé**.',
    '`reset_index()` remet l’index en colonne.',
  ],
  related: ['pandas-introduction', 'pandas-agregation', 'pandas-combiner'],
  source: 'Résultats exécutés avec pandas 3.1.1 et 2.2.3',
});
