import type { Theme } from '../engine/types';

/**
 * Les grandes thématiques. Ajouter un thème = ajouter une entrée ici + un dossier.
 * `intro` : la vue d'ensemble (pourquoi l'outil existe, sa logique, son usage), en tête de la page du thème.
 */
export const themes: Theme[] = [
  {
    id: 'python-core', label: 'Python Core', icon: 'Py', hue: 212, order: 1,
    description: 'Types, références, listes, dictionnaires, fonctions : le Python utile en analyse de données.',
    intro: {
      enUnePhrase: 'Python est la **colle** de la data : pandas, NumPy et matplotlib font le gros du travail, Python relie le tout et gère ce qu’ils ne couvrent pas.',
      pourquoi: 'Créé par Guido van Rossum (première version en 1991) avec un objectif : un langage **lisible**, proche de l’anglais, où l’on écrit vite du code compréhensible. La data science l’a adopté dans les années 2010 pour une raison simple : son **écosystème** (NumPy, pandas, scikit-learn, Jupyter) permet de faire toute une analyse, du fichier brut au modèle, dans un seul langage.',
      philosophie: [
        '**Tout est objet**, et une variable n’est qu’un **nom** qui pointe vers un objet : c’est la clé des « copies » qui n’en sont pas.',
        'Certains objets sont **modifiables** (listes, dictionnaires), d’autres **figés** (nombres, chaînes, tuples) : cela décide si une modification se propage.',
        'La **lisibilité compte** : un code clair vaut mieux qu’un code astucieux (*The Zen of Python*, `import this`).',
        'Les **erreurs sont explicites** : un message d’erreur dit presque toujours quoi et où — il faut apprendre à le lire.',
      ],
      auTravail: [
        'Écrire des **fonctions** de nettoyage réutilisables, puis les appliquer avec `apply`.',
        'Utiliser des **dictionnaires** pour renommer, recoder (`map`) ou paramétrer.',
        'Manipuler des **dates**, formater des résultats (**f-strings**) pour un rapport.',
        'Comprendre les **erreurs** qui remontent de pandas : elles viennent souvent d’un type ou d’une référence.',
      ],
      reflexes: [
        'Est-ce que je modifie l’objet d’origine ou une copie ?',
        'Quel est le **type** de cette valeur (`type(x)`) ?',
        'Est-ce qu’une méthode pandas le fait déjà, sans boucle ?',
      ],
    },
  },
  {
    id: 'numpy', label: 'NumPy', icon: 'Np', hue: 190, order: 2,
    description: 'Le tableau numérique rapide sur lequel repose tout l’écosystème : axes, vues, vectorisation.',
    intro: {
      enUnePhrase: 'NumPy rend le calcul sur des millions de nombres **rapide** en remplaçant les boucles Python par des opérations sur des tableaux entiers.',
      pourquoi: 'Une liste Python est lente pour le calcul : chaque élément est un objet séparé, et une boucle traite les valeurs une par une. NumPy (Travis Oliphant, 2005-2006, à partir des bibliothèques Numeric et Numarray) introduit le **ndarray** : des nombres d’un seul type, rangés côte à côte en mémoire, traités par du code compilé en C. Résultat : des calculs 10 à 100 fois plus rapides. **pandas, scikit-learn et matplotlib sont construits dessus.**',
      philosophie: [
        '**Un seul type** par tableau (`dtype`) : c’est ce qui permet la vitesse.',
        '**Vectoriser** : on écrit `a * 2` sur tout le tableau, jamais une boucle `for`.',
        '**Broadcasting** : des tableaux de formes compatibles se combinent sans être copiés.',
        '**Vues plutôt que copies** : une tranche partage la mémoire de l’original, pour aller vite — à surveiller.',
      ],
      auTravail: [
        'Souvent **indirectement** : une colonne pandas est un tableau NumPy (`df["col"].to_numpy()`).',
        'Calculs numériques rapides, **masques** booléens, `np.where` pour créer une colonne conditionnelle.',
        'Préparer les données pour le **machine learning** (scikit-learn attend des tableaux NumPy).',
      ],
      reflexes: [
        'Quel est le `.shape` de mon tableau, et sur quel **axis** je calcule ?',
        'Ce résultat est-il une **vue** (modifier = modifier l’original) ?',
        'Puis-je remplacer cette boucle par une opération vectorisée ?',
      ],
    },
  },
  {
    id: 'pandas', label: 'Pandas', icon: 'Pd', hue: 255, order: 3,
    description: 'Le tableur programmable de la data : charger, sélectionner, filtrer, agréger, combiner.',
    intro: {
      enUnePhrase: 'pandas est un **tableur programmable** : des tableaux avec des noms de lignes et de colonnes, et des centaines de méthodes pour les interroger sans boucle.',
      pourquoi: 'Créé en 2008 par Wes McKinney, analyste dans un fonds d’investissement (AQR Capital), qui voulait analyser des données financières en Python aussi facilement qu’avec R ou Excel. Rendu open source en 2009, le nom vient de *panel data* (données de panel, en économétrie) et de *Python data analysis*. Il apporte ce que NumPy n’a pas : des **colonnes de types différents**, des **étiquettes**, la gestion des **valeurs manquantes** et les opérations de base de données (groupby, jointures).',
      philosophie: [
        '**Les étiquettes avant les positions** : on sélectionne par nom (`.loc`), et pandas **aligne** automatiquement sur l’index.',
        '**Une colonne = une Series** au type homogène ; un DataFrame = des Series qui partagent un index.',
        '**Vectoriser, enchaîner** : `df[cond].groupby(col)["x"].mean()` en une ligne, sans boucle.',
        '**Les méthodes renvoient un nouvel objet** : on réaffecte (`df = df.dropna()`) plutôt que de modifier en place.',
      ],
      auTravail: [
        '**Le cœur de ton quotidien** : charger (`read_csv`), explorer (`head`, `info`, `describe`), filtrer, agréger.',
        'Répondre aux questions métier : « ventes moyennes par région », « top 10 des clients »… avec `groupby`, `sort_values`, `nlargest`.',
        'Assembler plusieurs sources avec `merge` et `concat`, puis exporter vers Excel ou un graphique.',
      ],
      reflexes: [
        'Est-ce une **Series** ou un **DataFrame** ? Quel est son **index** ?',
        'Après un `merge` ou un filtre : combien de lignes reste-t-il (`len(df)`) ?',
        'Quelle **version** de pandas ? (2.x et 3.x diffèrent sur les copies et le texte)',
      ],
    },
  },
  {
    id: 'nettoyage', label: 'Nettoyage de données', icon: 'Nt', hue: 155, order: 4,
    description: 'Rendre des données brutes fiables : encodage, types, texte, valeurs manquantes, doublons.',
    intro: {
      enUnePhrase: '**Des données fausses donnent des conclusions fausses** : le nettoyage rend les données fiables *avant* d’en tirer quoi que ce soit.',
      pourquoi: 'Les données réelles ne sont jamais propres : fichiers mal encodés, nombres stockés en texte, « Paris » et « paris », cases vides, doublons, saisies aberrantes. Le principe *garbage in, garbage out* (des données poubelle en entrée donnent des résultats poubelle en sortie) résume l’enjeu. On cite souvent que le nettoyage occupe **la majeure partie du temps** d’un analyste : c’est normal, c’est là que se joue la qualité de l’analyse.',
      philosophie: [
        '**Comprendre avant de corriger** : `info()`, `isnull().sum()`, `value_counts()` d’abord, puis seulement agir.',
        '**Chaque correction est une décision** : supprimer, remplacer ou garder une valeur manquante change le résultat. Il faut pouvoir la justifier.',
        '**Ne jamais modifier la source** : on part du fichier brut et on écrit un code de nettoyage reproductible.',
        '**Vérifier après chaque étape** : nombre de lignes, types, valeurs uniques.',
      ],
      auTravail: [
        'La **première heure** sur tout nouveau jeu de données : encodage, noms de colonnes, types.',
        'Harmoniser le texte (`str.strip().str.lower()`), convertir (`astype`), recoder (`map`).',
        'Traiter les valeurs manquantes et les doublons, en documentant chaque choix.',
      ],
      reflexes: [
        'Combien de valeurs manquantes par colonne, et **pourquoi** sont-elles manquantes ?',
        'Ce que je supprime biaise-t-il l’échantillon ?',
        'Mon nettoyage peut-il être relancé à l’identique demain sur un nouveau fichier ?',
      ],
    },
  },
  {
    id: 'analyse-visu', label: 'Analyse & Visualisation', icon: 'Vz', hue: 28, order: 5,
    description: 'Voir les données pour les comprendre : courbes, nuages de points, distributions, Seaborn.',
    intro: {
      enUnePhrase: 'Un graphique fait voir en une seconde ce qu’un tableau cache : **tendances, relations, anomalies**.',
      pourquoi: 'Les mêmes statistiques peuvent décrire des données très différentes : le célèbre *quartet d’Anscombe* (1973) montre quatre jeux de données avec la même moyenne, la même variance et la même corrélation, mais des graphiques sans rapport. Il faut donc **regarder** les données. **matplotlib** (John D. Hunter, 2003, inspiré de MATLAB) est la bibliothèque de base ; **Seaborn** (Michael Waskom, vers 2012) se construit dessus pour faire des graphiques statistiques en une ligne, directement depuis un DataFrame.',
      philosophie: [
        '**À chaque question son graphique** : évolution → courbe ; relation → nuage de points ; distribution → histogramme ; comparaison → barres.',
        '**Explorer d’abord, présenter ensuite** : les graphiques d’exploration sont rapides et nombreux, ceux de présentation peu nombreux et soignés.',
        '**Comparer à échelle égale** : mêmes axes pour comparer des groupes, sinon l’œil est trompé.',
        '**Corrélation n’est pas causalité.**',
      ],
      auTravail: [
        '**Analyse exploratoire** : regarder chaque variable (histogramme) et leurs relations (nuages, `df.corr()`).',
        'Repérer valeurs aberrantes et ruptures **avant** de modéliser.',
        'Produire les graphiques d’un rapport ou d’un tableau de bord.',
      ],
      reflexes: [
        'Quelle **question** ce graphique doit-il éclairer ?',
        'Les échelles sont-elles honnêtes (axe y qui part de 0 pour des barres) ?',
        'Le titre et les axes disent-ils ce qu’on regarde, avec les unités ?',
      ],
    },
  },
  {
    id: 'storytelling', label: 'Storytelling & Design', icon: 'St', hue: 335, order: 6,
    description: 'Transformer un graphique en message : public, épuration, mise en avant, style.',
    intro: {
      enUnePhrase: 'Un graphique de présentation doit faire passer **un message** à un public précis, pas montrer toutes les données.',
      pourquoi: 'Une analyse ne sert à rien si personne ne la comprend ou ne s’en souvient. Edward Tufte (*The Visual Display of Quantitative Information*, 1983) a posé le principe du **ratio d’encre-donnée** : chaque trait doit servir l’information. Cole Nussbaumer Knaflic (*Storytelling with Data*, 2015) a popularisé l’idée de **raconter** avec les données : contexte, message, mise en avant. Des médias comme FiveThirtyEight en ont fait un style reconnaissable.',
      philosophie: [
        '**Un graphique = un message**, idéalement écrit dans le titre (« Les ventes ont doublé en 2024 »).',
        '**Épurer** : retirer bordures, grilles et légendes inutiles ; écrire les valeurs directement sur le graphique.',
        '**Guider le regard** : tout en gris, une seule chose en couleur — ce que l’on veut faire voir.',
        '**Penser au public** : un graphique familier (barres, courbes) se lit sans effort.',
      ],
      auTravail: [
        'Transformer un graphique d’exploration en graphique de **présentation** pour un comité, un client, un rapport.',
        'Construire une **suite** de graphiques qui raconte une évolution (avant → après).',
        'Appliquer un **style** cohérent à tous les graphiques d’un livrable.',
      ],
      reflexes: [
        'Qui va lire ce graphique, et que doit-il retenir en 5 secondes ?',
        'Que puis-je **enlever** sans perdre d’information ?',
        'La couleur sert-elle le message, ou décore-t-elle ?',
      ],
    },
  },
];
