/**
 * Vocabulaire contrôlé des tags : des NOTIONS TRANSVERSALES qui relient des fiches de thèmes différents.
 * Règles : un tag doit relier au moins 2 fiches ; les noms de fonctions vont dans `keywords` (recherche), pas ici.
 * Un test vérifie que chaque fiche n'utilise que ces tags.
 */
export interface TagDef {
  id: string;
  label: string;
  description: string;
}

export const tagDefs: TagDef[] = [
  { id: 'references', label: 'Références et copies', description: 'Quand deux noms désignent le même objet, quand une opération crée une copie ou une vue.' },
  { id: 'manquantes', label: 'Valeurs manquantes', description: 'NaN, None : les détecter, les ignorer, les supprimer ou les remplacer.' },
  { id: 'axis', label: 'Le paramètre axis', description: 'axis=0 ou axis=1 : par colonne ou par ligne, dans NumPy comme dans pandas.' },
  { id: 'selection', label: 'Sélectionner et filtrer', description: 'Index, tranches, .loc / .iloc, masques booléens.' },
  { id: 'agregation', label: 'Agréger et résumer', description: 'Sommes, moyennes, comptages, groupes : réduire des données à quelques chiffres.' },
  { id: 'tri', label: 'Trier et classer', description: 'Ordonner, classer, trouver les plus grands ou les plus petits.' },
  { id: 'texte', label: 'Texte et chaînes', description: 'Manipuler, nettoyer et formater des chaînes de caractères.' },
  { id: 'types', label: 'Types et conversions', description: 'int, float, str, dtype : convertir sans erreur.' },
  { id: 'erreurs', label: 'Erreurs et débogage', description: 'Lire un message d’erreur et comprendre d’où il vient.' },
  { id: 'fonctions', label: 'Fonctions', description: 'Définir, appeler, paramétrer et appliquer des fonctions.' },
  { id: 'controle', label: 'Boucles et conditions', description: 'for, if, elif, else : répéter et décider.' },
  { id: 'dictionnaires', label: 'Dictionnaires', description: 'Associer des clés à des valeurs : compter, remplacer, regrouper.' },
  { id: 'restructurer', label: 'Combiner et restructurer', description: 'Joindre, empiler, remodeler, passer du format large au format long.' },
  { id: 'temps', label: 'Dates et temps', description: 'Dates, durées, séries temporelles, évolutions dans le temps.' },
  { id: 'distributions', label: 'Distributions et corrélations', description: 'Forme des données, dispersion, quantiles, relation entre deux variables.' },
  { id: 'graphiques', label: 'Graphiques matplotlib', description: 'Tracer, habiller et organiser des graphiques.' },
  { id: 'lisibilite', label: 'Lisibilité des graphiques', description: 'Rendre un graphique clair : épurer, mettre en avant, comparer honnêtement.' },
  { id: 'poo', label: 'Programmation objet', description: 'Classes, objets, self, héritage : comment Python range données et comportements.' },
  { id: 'versions', label: 'pandas 2 ou 3', description: 'Comportements qui diffèrent entre pandas 2.x et pandas ≥ 3.0.' },
];

export const tagById = new Map(tagDefs.map((t) => [t.id, t]));
