import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-listes',
  title: 'Les listes : indexation, slicing, listes de listes',
  theme: 'python-core',
  tags: ['selection', 'references'],
  keywords: ['listes', 'indexation', 'slicing', 'liste de listes', 'list', '[]', 'len', 'index', 'indexation négative', '[-1]', 'slicing', '[m:n]', '[::-1]', 'IndexError', 'list index out of range', 'double indexation'],
  summary: 'Créer une liste, lire un élément par son **index** (positif ou négatif), extraire une tranche, manipuler une liste de listes.',
  concept: `
- Une **liste** est une collection **ordonnée** d’éléments, définie entre crochets \`[]\` et séparée par des virgules.
- L’indexation **commence à 0** : le premier élément est à l’index 0, le deuxième à l’index 1, etc.
- L’**indexation négative** accède aux éléments depuis la fin : \`-1\` pour le dernier, \`-2\` pour l’avant-dernier.
- Le **slicing** \`liste[m:n]\` extrait les éléments de l’index m (**inclus**) à l’index n (**exclu**).
- Une **liste de listes** regroupe plusieurs lignes de données dans une seule variable, comme un tableau.
`,
  syntax: `ma_liste = [1, 2, 3]     # créer une liste
len(ma_liste)            # longueur
ma_liste[0]              # 1er élément
ma_liste[-1]             # dernier élément
ma_liste[1:3]            # slicing (3 exclu)
donnees = [ligne_1, ligne_2]   # liste de listes
donnees[0][-1]           # double indexation`,
  simulators: traceSims(['indexation', 'liste-de-listes']),
  pitfalls: [
    '`liste[len(liste)]` → `IndexError` : le dernier index est `len(liste) - 1`.',
    'En slicing, une borne trop grande ne provoque **pas** d’erreur (`lettres[1:100]`).',
    '`liste[1:3]` contient 2 éléments, pas 3.',
    'Un slicing crée une **nouvelle** liste ; un index simple renvoie l’élément lui-même.',
  ],
  takeaways: ['Index de 0 à `len − 1` ; −1 = dernier.', '`[m:n]` : m inclus, n exclu.', '`donnees[ligne][colonne]`.'],
  mentalModel: {
    title: 'La règle',
    code: `notes.sort()            # trie LA liste, renvoie None
triees = sorted(notes)  # NOUVELLE liste triée, notes intacte
b = a                   # même liste, deux noms
b = a.copy()            # nouvelle liste (copie superficielle)
a.append([3, 4])        # ajoute UN élément : [1, 2, [3, 4]]
a.extend([3, 4])        # ajoute CHAQUE élément : [1, 2, 3, 4]`,
    note: 'Une méthode qui modifie la liste sur place (`sort`, `append`, `extend`, `reverse`) renvoie `None` : ne jamais réaffecter son résultat.',
  },
  comparisons: [{
    title: 'sort ou sorted ?',
    headers: ['', '`liste.sort()`', '`sorted(x)`'],
    rows: [
      ['Modifie l’original', '**oui**', 'non'],
      ['Renvoie', '`None`', 'une **nouvelle liste**'],
      ['Accepte', 'les listes seulement (`tuple.sort` → `AttributeError`)', 'tout itérable : tuple, chaîne, dict (ses clés), Series…'],
      ['Options', '`key=`, `reverse=True`', '`key=`, `reverse=True`'],
      ['Piège', '`notes = notes.sort()` → `notes` vaut `None`', 'oublier de récupérer le résultat'],
    ],
    conclusion: 'Garder l’original → `sorted`. Le remplacer → `.sort()` seul, sans `=`. Les majuscules passent avant les minuscules : `sorted(noms, key=str.lower)`.',
  }, {
    title: 'list, tuple, set : lequel choisir ?',
    headers: ['', '`list` `[1, 2]`', '`tuple` `(1, 2)`', '`set` `{1, 2}`'],
    rows: [
      ['Modifiable', 'oui', '**non** (`TypeError`)', 'oui (ajout / retrait)'],
      ['Ordre et doublons', 'gardés', 'gardés', '**aucun ordre, pas de doublon**'],
      ['Accès par position `x[0]`', 'oui', 'oui', '**non** (`not subscriptable`)'],
      ['Clé de dictionnaire', 'non (`unhashable`)', 'oui', 'non'],
      ['Usage typique', 'une collection qui évolue', 'un enregistrement fixe : `(lat, lon)`', 'dédoublonner, tester l’appartenance'],
    ],
    conclusion: 'Attention : `(1)` est un entier ; un tuple d’un seul élément s’écrit `(1,)`.',
  }, {
    title: 'Copier une liste',
    headers: ['Écriture', 'Ce qui est créé', 'Modifier `b` modifie `a` ?'],
    rows: [
      ['`b = a`', 'rien : un **deuxième nom** pour la même liste', '**oui**, toujours'],
      ['`b = a.copy()` / `a[:]` / `list(a)`', 'une nouvelle liste, mêmes éléments', 'non… sauf les **listes imbriquées** (partagées)'],
      ['`b = copy.deepcopy(a)`', 'une copie complète, à tous les niveaux', 'non'],
    ],
    conclusion: 'Pour une liste de nombres ou de textes, `a.copy()` suffit. Pour une liste de listes, `copy.deepcopy`.',
  }],
  deepDives: [{
    title: 'Pourquoi a.copy() ne suffit pas pour une liste de listes',
    body: `Une liste ne contient pas ses éléments : elle contient des **références** vers eux. \`a.copy()\` crée une nouvelle liste… qui contient **les mêmes références**.

Ajouter un élément à \`b\` ne touche pas \`a\`. Mais \`b[1]\` et \`a[1]\` désignent **la même** sous-liste : la modifier se voit des deux côtés. \`copy.deepcopy\` recopie aussi les sous-listes.`,
    code: `a = [1, [2, 3]]
b = a.copy()
b.append(5)        # a = [1, [2, 3]]        ← a intact
b[1].append(4)     # a = [1, [2, 3, 4]]     ← sous-liste partagée !

import copy
c = copy.deepcopy(a)   # c[1] est une nouvelle sous-liste`,
  }],
  related: ['python-boucles-for', 'python-variables'],
  source: 'DataXp — Introduction à la programmation Python, chapitre 4 (sources/python-core/dataxp-les-listes-python.pdf)',
});
