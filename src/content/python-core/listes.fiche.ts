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
  related: ['python-boucles-for', 'python-variables', 'nettoyage-python-natif'],
  source: 'DataXp — Introduction à la programmation Python, chapitre 4 (sources/python-core/dataxp-les-listes-python.pdf)',
});
