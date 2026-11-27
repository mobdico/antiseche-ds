import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-poo-dunder',
  title: 'Méthodes dunder et fonctions universelles',
  theme: 'python-core',
  tags: ['poo', 'fonctions'],
  keywords: ['dunder', 'méthode spéciale', 'magic method', '__len__', '__str__', '__repr__', '__iter__', '__lt__', '__add__', '__eq__', '__call__',
    'len', 'str', 'sorted', 'sum', 'duck typing', 'RecursionError', "object of type 'int' has no len()", "has no len()", 'is not iterable',
    "'<' not supported between instances", 'maximum recursion depth exceeded'],
  summary: '`len(x)` appelle `x.__len__()` : la fonction universelle est la **prise**, la méthode dunder est la **fiche standard** que l’objet fournit.',
  concept: `
- Une méthode **dunder** (*double underscore*) a un nom réservé : \`__len__\`, \`__str__\`, \`__lt__\`… On ne l’appelle presque jamais soi-même : c’est une **fonction universelle** qui l’appelle.
- \`len(x)\` appelle \`x.__len__()\`, \`str(x)\` appelle \`x.__str__()\`, \`a < b\` appelle \`a.__lt__(b)\`, \`a + b\` appelle \`a.__add__(b)\`.
- Deux sortes de fonctions universelles :
  - **le paravent** (\`len\`, \`str\`) : délègue à l’objet **et contrôle le résultat** (\`len\` exige un entier positif) ;
  - **la machine** (\`sorted\`, \`sum\`, \`max\`) : fait le travail elle-même et n’emprunte à l’objet que ses **pièces de base** (\`__iter__\`, \`__lt__\`, \`__add__\`).
- **Duck typing** : Python vérifie que la méthode existe, pas le type de l’objet. Un objet qui a \`__len__\` « est » mesurable.
`,
  syntax: `class Rayon:
    def __init__(self, produits):
        self.produits = produits

    def __len__(self):                 # len(rayon)
        return len(self.produits)      # délègue à la liste

    def __repr__(self):                # affichage dans la console, les listes, le débogueur
        return f"Rayon({self.produits})"

    def __str__(self):                 # print(rayon), str(rayon), f"{rayon}"
        return f"Rayon de {len(self)} produits"

len(Rayon(["vis", "clous"]))   # 2`,
  mentalModel: {
    title: 'La règle',
    code: `len(x)     →  type(x).__len__(x)     # cherché dans la CLASSE
str(x)     →  type(x).__str__(x)     # à défaut : __repr__
a < b      →  type(a).__lt__(a, b)   # c’est ce qu’utilise sorted()
a + b      →  type(a).__add__(a, b)  # c’est ce qu’utilise sum()
f(x)       →  type(f).__call__(f, x) # « callable » (fiche Fonctions)`,
    note: 'Une dunder posée sur l’objet lui-même (`r.__len__ = …`) est **ignorée** par `len()`.',
  },
  simulators: traceSims(['poo-dunder', 'poo-dunder-instance']),
  comparisons: [{
    title: 'Ce que chaque fonction universelle emprunte à l’objet',
    headers: ['Appel', 'Méthode utilisée', 'Sans elle'],
    rows: [
      ['`len(x)`', '`__len__` (doit renvoyer un entier ≥ 0)', '`TypeError: object of type \'Rayon\' has no len()`'],
      ['`str(x)`, `print(x)`, `f"{x}"`', '`__str__`, sinon `__repr__`', 'affiche `<__main__.Rayon object at 0x…>`'],
      ['affichage dans une liste, la console', '`__repr__`', 'idem'],
      ['`for e in x`, `list(x)`, `sorted(x)`', '`__iter__`', '`TypeError: \'Rayon\' object is not iterable`'],
      ['`sorted([a, b])`, `max`, `<`', '`__lt__`', '`TypeError: \'<\' not supported between instances of …`'],
      ['`sum([a, b])`, `+`', '`__add__` (et `__radd__` pour le 0 de départ)', '`TypeError: unsupported operand type(s) for +: \'int\' and …`'],
      ['`a == b`', '`__eq__`', 'compare l’**identité** (comme `is`)'],
    ],
    conclusion: '`object` fournit `__str__`, `__repr__` et `__eq__` (qui compare l’identité), mais **pas** `__len__` ni `__iter__` ; son `__lt__` répond toujours « non supporté ».',
  }, {
    title: '__str__ ou __repr__ ?',
    headers: ['', '`__str__`', '`__repr__`'],
    rows: [
      ['Pour qui', 'l’utilisateur final', 'le développeur (débogage)'],
      ['Appelée par', '`print`, `str()`, `f"{x}"`', 'la console, l’affichage dans une liste ou un dict, `repr()`'],
      ['Si absente', 'Python utilise `__repr__`', 'affichage par défaut `<… object at 0x…>`'],
      ['Bonne pratique', 'un texte lisible', 'si possible, le code qui recrée l’objet : `Rayon([\'vis\'])`'],
    ],
    conclusion: 'Ne définir qu’une seule des deux ? Choisir `__repr__` : elle sert partout.',
  }],
  deepDives: [{
    title: 'Pourquoi return len(self) plante (RecursionError)',
    body: `Dans \`__len__\`, écrire \`len(self)\` revient à rappeler… \`__len__\`, qui rappelle \`len(self)\`, et ainsi de suite. Python s’arrête après environ 1 000 appels imbriqués : \`RecursionError: maximum recursion depth exceeded\`.

La méthode doit **déléguer à une donnée** de l’objet (\`len(self.produits)\`), pas à l’objet lui-même. Même piège avec \`__str__\` qui ferait \`str(self)\`.

Le simulateur ci-dessus montre la pile d’appels qui grandit, puis le traceback raccourci.`,
  }, {
    title: 'Les dunder sont cherchées dans la classe, pas dans l’objet',
    body: `Pour une lecture ordinaire \`r.x\`, Python regarde d’abord le tiroir de l’objet. Mais pour les méthodes spéciales, les fonctions universelles vont **directement à la classe** : \`len(r)\` exécute \`type(r).__len__(r)\`.

Un post-it \`r.__len__ = lambda: 99\` est donc visible par \`r.__len__()\` (lecture ordinaire), mais **ignoré** par \`len(r)\`.`,
    code: `r.__len__ = lambda: 99
r.__len__()     # 99   ← lecture ordinaire : trouve le post-it
len(r)          # TypeError: object of type 'Rayon' has no len()`,
  }],
  pitfalls: [
    '`return len(self)` dans `__len__` → récursion infinie (`RecursionError`). Déléguer à une donnée : `len(self.produits)`.',
    '`__len__` qui renvoie autre chose qu’un entier → `len()` refuse le résultat (`TypeError`) : le paravent contrôle.',
    'Trier une liste d’objets sans `__lt__` → `\'<\' not supported between instances`. Ou trier avec `key=lambda o: o.attribut`.',
    'Appeler la dunder à la main (`x.__len__()`) au lieu de `len(x)` : ça marche, mais on perd le contrôle du résultat.',
  ],
  takeaways: [
    '`len(x)` → `x.__len__()` ; `print(x)` → `__str__` (sinon `__repr__`).',
    'Duck typing : la méthode existe → ça marche, quel que soit le type.',
    'Une dunder délègue à une donnée, jamais à `self` lui-même.',
  ],
  related: ['python-poo-classes', 'python-fonctions', 'python-fonctions-natives'],
  source: 'Récap POO en Python (notes personnelles, 27 nov. 2026) — exemples exécutés avec Python 3.13',
});
