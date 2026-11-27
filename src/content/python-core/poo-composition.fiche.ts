import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-poo-composition',
  title: 'Composition et classes abstraites',
  theme: 'python-core',
  tags: ['poo', 'references'],
  keywords: ['composition', 'a un', 'délégation', 'agrégation', 'valeur par défaut mutable', 'colis=[]', 'None', 'abstraction', 'classe abstraite',
    'ABC', 'abc', 'abstractmethod', '@abstractmethod', '__abstractmethods__', 'contrat', 'interface', "Can't instantiate abstract class"],
  summary: '**Composition** (« a un ») : une palette a des colis, on passe des objets à un autre objet. **Abstraction** : une classe abstraite est un contrat que les enfants doivent remplir.',
  concept: `
- **Composition** : on crée les classes séparément, puis on **passe des objets à un autre objet**. Le lien se fait à l’exécution : la classe \`Palette\` ne mentionne jamais \`Colis\`.
- **Délégation** : la palette demande son poids à chaque colis (\`c.poids\`) au lieu de le calculer elle-même.
- **Classe abstraite** (\`ABC\` + \`@abstractmethod\`) : elle dit **ce que** les enfants doivent savoir faire, sans dire **comment**. Python refuse de créer un objet tant que le contrat n’est pas rempli.
- \`__abstractmethods__\` liste les cases qui restent « à compléter ». Vide → la classe est instanciable.
- La classe abstraite peut garder du **code commun** (\`__init__\`, attributs, méthodes normales), hérité normalement.
`,
  syntax: `class Palette:
    def __init__(self, emplacement, colis=None):
        self.emplacement = emplacement
        self.colis = colis if colis is not None else []   # jamais colis=[]

    def ajouter(self, colis):
        self.colis.append(colis)

    def poids_total(self):
        return sum(c.poids for c in self.colis)            # délégation

from abc import ABC, abstractmethod

class Quai(ABC):
    @abstractmethod
    def charger(self): ...

    @abstractmethod
    def decharger(self): ...`,
  mentalModel: {
    title: 'La règle',
    code: `def __init__(self, colis=None):          # défaut immuable…
    self.colis = colis if colis is not None else []   # …et une liste neuve par objet
sum(c.poids for c in self.colis)         # délégation : chaque colis donne son poids
Classe.__abstractmethods__               # ce qui reste à écrire ; vide = instanciable`,
    note: 'Une valeur par défaut est évaluée **une seule fois**, à la définition de la fonction : une liste par défaut est donc partagée par tous les appels.',
  },
  simulators: traceSims(['poo-composition', 'poo-abstraction']),
  comparisons: [{
    title: 'Le piège de la valeur par défaut (p1 reçoit un colis)',
    headers: ['`__init__`', '`len(p1.colis), len(p2.colis)`', '`p1.colis is p2.colis`'],
    rows: [
      ['`colis=None` + `colis if colis is not None else []`', '`1 0`', '`False` : une liste par palette ✔'],
      ['`colis=[]` + `self.colis = colis`', '`1 1`', '`True` : **la même liste** pour toutes les palettes'],
      ['`colis=[]` + `colis if colis is not None else []`', '`1 1`', '`True` : `[]` n’est pas `None`, le test ne sert à rien'],
      ['`colis=None` + `self.colis = colis`', '—', '`AttributeError: \'NoneType\' object has no attribute \'append\'`'],
    ],
    conclusion: 'Valeur par défaut d’une liste ou d’un dict : **toujours `None`**, puis créer l’objet dans le corps de la fonction.',
  }, {
    title: 'Ce que Python accepte de créer',
    headers: ['Situation', '`__abstractmethods__`', 'Création de l’objet'],
    rows: [
      ['`Quai()` : la classe abstraite elle-même', '`frozenset({\'charger\', \'decharger\'})`', '`TypeError: Can\'t instantiate abstract class Quai…`'],
      ['enfant qui ne définit que `charger`', '`frozenset({\'decharger\'})`', '`TypeError`, **dès l’instanciation**'],
      ['enfant qui définit les deux', '`frozenset()`', 'OK'],
      ['classe ordinaire qui oublie une méthode', '—', 'OK… puis `AttributeError` à l’appel'],
    ],
    conclusion: 'L’abstraction déplace l’erreur au **plus tôt** : à la création de l’objet, pas au moment où la méthode manque.',
  }],
  deepDives: [{
    title: 'Pourquoi colis=[] est partagé',
    body: `La ligne \`def __init__(self, emplacement, colis=[])\` est exécutée **une seule fois**, quand Python lit la classe. C’est à ce moment que la liste \`[]\` est créée et rangée avec la fonction.

Chaque appel sans argument réutilise **cette même liste**. Dans le schéma mémoire du simulateur, \`p1.colis\` et \`p2.colis\` pointent vers le même objet : ajouter un colis à p1 le fait apparaître dans p2.

Avec \`None\` (immuable), rien n’est partagé, et \`[]\` est créée **à chaque appel**, dans le corps de \`__init__\`.`,
  }, {
    title: 'Hériter d’une méthode abstraite ne suffit pas',
    body: `Une \`@abstractmethod\` est une case « à compléter » : l’enfant en hérite **encore marquée abstraite**. Tant qu’il ne la **redéfinit** pas, elle reste dans \`__abstractmethods__\`, et l’objet ne peut pas être créé.

Le corps \`...\` (ou \`pass\`) dans la classe abstraite ne sert qu’à rendre la définition valide ; il n’est jamais censé s’exécuter.`,
    code: `QuaiExpedition.__abstractmethods__   # frozenset({'decharger'})
QuaiExpedition()                     # TypeError, dès l’instanciation`,
  }],
  pitfalls: [
    '`colis=[]` (ou `{}`) comme valeur par défaut : créé **une fois**, partagé par tous les objets. Utiliser `None`.',
    'Calculer dans la palette ce qui appartient au colis : préférer la délégation (`c.poids`).',
    'Oublier de redéfinir **une seule** méthode abstraite : `TypeError: Can\'t instantiate abstract class` à la création.',
    'Instancier la classe abstraite elle-même (`Quai()`) : interdit, c’est un contrat, pas un objet.',
  ],
  takeaways: [
    'Composition = « a un » : un objet en contient d’autres.',
    'Défaut mutable → `None`, puis `[]` dans le corps.',
    '`ABC` + `@abstractmethod` = contrat ; `__abstractmethods__` = ce qui manque.',
  ],
  related: ['python-poo-heritage', 'python-poo-classes', 'python-listes'],
  source: 'Récap POO en Python (notes personnelles, 27 nov. 2026) — exemples exécutés avec Python 3.13',
});
