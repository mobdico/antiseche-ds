import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-poo-classes',
  title: 'Classes, instances et self',
  theme: 'python-core',
  tags: ['poo', 'references'],
  keywords: ['POO', 'programmation orientée objet', 'class', 'classe', 'instance', 'objet', 'self', '__init__', 'constructeur', 'méthode', 'attribut',
    'attribut de classe', "attribut d'instance", '__dict__', 'classmethod', '@classmethod', 'cls', 'constructeur alternatif', 'from_dict',
    'missing 1 required positional argument'],
  summary: 'Une **classe** est le modèle, une **instance** l’objet concret ; `self` est l’objet qui appelle. Ce qui est commun va dans la classe, ce qui est propre à chaque objet va dans `self`.',
  concept: `
- Une **classe** est le modèle (la fiche article) ; une **instance** est l’objet concret créé à partir de ce modèle (une palette réelle).
- \`__init__\` remplit l’objet au moment de sa création : \`Palette("A-12-03", [...])\` crée l’objet, puis appelle \`__init__\` dessus.
- **\`self\` désigne l’objet qui appelle la méthode** : \`p.deplacer("D-01-02")\` équivaut à \`Palette.deplacer(p, "D-01-02")\`.
- Chaque objet et chaque classe a son **tiroir**, \`__dict__\` : l’objet porte ses **données**, la classe porte le **comportement** (les méthodes) et ce qui est commun à tous.
- Une \`@classmethod\` reçoit \`cls\`, la **classe** qui appelle : elle sert surtout de **constructeur alternatif** (\`depuis_ligne\`, \`from_dict\`).
`,
  syntax: `class Palette:
    poids_max = 1000                       # attribut de CLASSE : commun à tous

    def __init__(self, emplacement, colis):
        self.emplacement = emplacement     # attribut d’INSTANCE : propre à chaque objet
        self.colis = colis

    def deplacer(self, nouvel_emplacement):
        self.emplacement = nouvel_emplacement

    @classmethod
    def depuis_ligne(cls, ligne):          # constructeur alternatif
        emplacement, colis = ligne.split(";")
        return cls(emplacement, colis.split(","))

p = Palette("A-12-03", ["C1", "C2"])
p.deplacer("D-01-02")                      # = Palette.deplacer(p, "D-01-02")`,
  mentalModel: {
    title: 'La règle',
    code: `p.deplacer(x)        # Python traduit : Palette.deplacer(p, x)  → self = p
self.x = v           # écrit dans le tiroir de L’OBJET
x = v                # (dans une méthode) post-it jetable : variable locale
Palette.x = v        # écrit dans le tiroir de la CLASSE (le règlement au mur)
cls(...)             # dans une @classmethod : la classe qui appelle`,
    note: 'Toute donnée de l’objet, lue ou écrite, passe par `self.`',
  },
  simulators: traceSims(['poo-self', 'poo-attr-classe', 'poo-classmethod']),
  comparisons: [{
    title: 'Attribut de classe ou d’instance ?',
    headers: ['', 'Attribut de classe', 'Attribut d’instance'],
    rows: [
      ['Où l’écrire', 'dans le corps de la classe : `poids_max = 1000`', 'dans une méthode : `self.emplacement = …`'],
      ['Rangé dans', '`Palette.__dict__` (avec `__init__` et les méthodes)', '`p.__dict__`, le tiroir de chaque objet'],
      ['Partagé ?', 'par **tous** les objets', 'propre à **chaque** objet'],
      ['`p1.poids_max = 1500`', '—', 'crée un **post-it** sur p1, qui masque la classe pour p1 seulement'],
      ['`Palette.poids_max = 1200`', 'change le règlement : visible par tous les objets **sans post-it**', '—'],
      ['Usage typique', 'constante, valeur par défaut, compteur commun', 'les données de l’objet'],
    ],
    conclusion: 'Sur l’exemple : après `p1.poids_max = 1500` puis `Palette.poids_max = 1200`, on lit `1500 1200` — p1 garde son post-it.',
  }, {
    title: 'self ou cls ?',
    headers: ['', 'Méthode normale', '`@classmethod`'],
    rows: [
      ['Premier paramètre', '`self` : l’**objet** qui appelle', '`cls` : la **classe** qui appelle'],
      ['Appel typique', '`p.deplacer("D-01-02")`', '`Palette.depuis_ligne("A;C1,C2")`'],
      ['Sert à', 'lire et modifier les données de l’objet', 'fabriquer un objet autrement (constructeur alternatif)'],
      ['Exemples connus', '`liste.append`, `df.head`', '`dict.fromkeys`, `datetime.fromtimestamp`, `pd.DataFrame.from_dict`'],
      ['Dans un enfant', 'reçoit l’objet enfant', '`cls(...)` fabrique un **enfant** ; `Palette(...)` en dur fabriquerait un parent'],
    ],
    conclusion: 'L’héritage partage la recette, jamais l’identité : écrire `cls(...)`, pas le nom de la classe en dur.',
  }],
  deepDives: [{
    title: 'Le mécanisme de recherche : qui gagne quand on lit objet.x ?',
    body: `En **lecture**, \`objet.x\` cherche dans cet ordre, et le **premier trouvé gagne** :

1. une **property** \`x\` de la classe (voir la fiche Encapsulation) ;
2. le **tiroir de l’objet** (\`objet.__dict__\`) ;
3. la **classe**, puis ses **parents**, dans l’ordre du MRO (\`Classe.__mro__\`).

En **écriture**, il n’y a pas de recherche : \`objet.x = v\` écrit dans le tiroir de l’objet (ou appelle le setter si \`x\` est une property) ; \`Classe.x = v\` écrit dans le tiroir de la classe, **sans contrôle** — cela peut même remplacer une property.

Les méthodes spéciales appelées par \`len()\`, \`str()\`, \`+\`… sont cherchées **directement dans la classe**, jamais dans le tiroir de l’objet (voir la fiche Méthodes dunder).`,
    code: `p1.__dict__                      # {'emplacement': 'A', 'poids_max': 1500}
"poids_max" in Palette.__dict__  # True (avec __init__ et les méthodes)
PaletteFrigo.__mro__             # (PaletteFrigo, Palette, object) : l’ordre de recherche`,
  }],
  pitfalls: [
    'Sans `self.`, la valeur part sur un **post-it jetable** : `emplacement = nouvel` crée une variable locale, l’objet n’est pas modifié (aucune erreur !).',
    'Oublier `self` dans la définition (`def deplacer(nouvel):`) → `TypeError: … takes 1 positional argument but 2 were given` : Python passe toujours l’objet en premier.',
    '`Palette.deplacer("D-01-02")` sans objet → `missing 1 required positional argument` : le texte a été pris pour `self`.',
    '`p1.poids_max = …` ne modifie pas la classe : il crée un attribut propre à `p1`.',
    'Dans une `@classmethod`, `return Palette(...)` en dur : appelée depuis une classe enfant, elle renvoie quand même un parent.',
  ],
  takeaways: [
    'Classe = modèle, instance = objet ; `self` = l’objet qui appelle.',
    'Données de l’objet → `self.x` ; commun à tous → attribut de classe.',
    '`obj.__dict__` montre le tiroir de l’objet.',
    '`@classmethod` + `cls(...)` pour un constructeur alternatif.',
  ],
  related: ['python-poo-dunder', 'python-poo-encapsulation', 'python-poo-heritage', 'python-fonctions'],
  source: 'Récap POO en Python (notes personnelles, 27 nov. 2026) — exemples exécutés avec Python 3.13',
});
