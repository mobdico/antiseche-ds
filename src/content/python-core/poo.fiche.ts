import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-poo',
  title: 'La programmation orientée objet',
  theme: 'python-core',
  tags: ['POO', 'classe', 'instance', 'self', 'attribut', 'méthode'],
  keywords: ['class', 'instance', '__init__', 'self', 'attribut', 'méthode', 'constructeur', 'CamelCase', 'takes 1 positional argument but 2 were given', "'int' object is not callable", 'missing 1 required positional argument'],
  summary: 'Définir une **classe**, créer des **instances**, stocker des **attributs** avec `__init__` et agir avec des **méthodes**.',
  concept: `
- Une **classe** est un plan qui définit les propriétés et le comportement des objets créés à partir d’elle.
- Une **instance** est un objet concret créé à partir d’une classe, à l’aide du **constructeur** (\`MaClasse()\`).
- Le paramètre **\`self\`** représente l’instance elle-même : Python le transmet **automatiquement** à chaque appel de méthode.
- Un **attribut** stocke une donnée dans un objet ; une **méthode** définit une action que l’objet peut effectuer.
- **\`__init__()\`** s’exécute automatiquement à la création d’une instance et sert à initialiser ses attributs.
- Les classes s’écrivent en **CamelCase** (\`MaClasse\`), les variables et fonctions en **snake_case**.
`,
  syntax: `class MaClasse:                  # définir une classe
    pass
mon_instance = MaClasse()        # instancier
def ma_methode(self):            # définir une méthode
    return valeur
def __init__(self, valeur):      # initialiser un attribut
    self.attribut = valeur
self.attribut = nouvelle_valeur  # mettre à jour un attribut`,
  simulators: traceSims(['classe', 'self-oubli']),
  pitfalls: [
    'Oublier `self` dans la signature → `TypeError: … takes 1 positional argument but 2 were given` (Python passe l’instance en plus).',
    'Écrire `solde = …` au lieu de `self.solde = …` crée une variable **locale** : l’attribut ne change pas.',
    '`c.solde()` → `TypeError: \'int\' object is not callable` : un attribut n’est pas une méthode.',
    'Chaque instance a **ses propres** attributs (voir les deux comptes dans le schéma).',
  ],
  takeaways: ['Classe = plan ; instance = objet.', '`__init__` initialise `self.attributs`.', '`obj.methode(x)` ≡ `Classe.methode(obj, x)`.'],
  related: ['python-fonctions', 'python-dates'],
  source: 'DataXp — Manipuler et analyser des données en Python, chapitre 3 (sources/python-core/dataxp-la-programmation-orientee-objet.pdf)',
});
