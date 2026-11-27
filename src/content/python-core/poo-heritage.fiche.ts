import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-poo-heritage',
  title: 'Héritage et polymorphisme',
  theme: 'python-core',
  tags: ['poo', 'erreurs'],
  keywords: ['héritage', 'hériter', 'classe parente', 'classe enfant', 'sous-classe', 'super', 'super().__init__', 'redéfinir', 'override', 'surcharger',
    'polymorphisme', 'MRO', '__mro__', 'isinstance', 'issubclass', 'est un', 'duck typing', 'ouvert fermé', 'has no attribute'],
  summary: 'L’enfant récupère tout ce qu’a le parent, puis ajoute ou redéfinit ce qui le distingue (**« est un »**). Le **polymorphisme** : le même appel, un comportement propre à chaque classe.',
  concept: `
- **Héritage** (« est un ») : \`class PaletteFrigo(Palette)\` — une palette frigo **est une** palette. Elle récupère toutes les méthodes du parent.
- \`super().__init__(...)\` laisse le **parent remplir sa part**, avec le **même \`self\`**. Ensuite l’enfant ajoute ses propres données.
- **Toutes les données finissent dans le tiroir de l’objet** ; les **méthodes restent dans leurs classes**.
- Une méthode redéfinie **masque** celle du parent, elle ne l’efface pas : \`super().etiquette()\` la retrouve.
- **Polymorphisme** : \`c.etiquette()\` donne « Standard », « FRAGILE » ou « SURGELÉ » selon l’objet — chaque classe sait faire son travail elle-même.
`,
  syntax: `class PaletteFrigo(Palette):
    def __init__(self, emplacement, colis, temperature):
        super().__init__(emplacement, colis)   # le parent remplit, avec le même self
        self.temperature = temperature

    def etiquette(self):                       # masque celle du parent
        return "FROID"

f = PaletteFrigo("F-01-02", ["Y1"], 4)
f.deplacer("F-03-01")     # méthode héritée
isinstance(f, Palette)    # True : une PaletteFrigo EST une Palette
PaletteFrigo.__mro__      # (PaletteFrigo, Palette, object)`,
  mentalModel: {
    title: 'La règle',
    code: `f.methode()          # cherchée dans PaletteFrigo, puis Palette, puis object (MRO)
super().methode()    # « la version du parent », avec le même self
super().__init__(…)  # oublié → l’objet est à moitié construit
for c in colis:      # polymorphisme : aucun if sur le type
    c.etiquette()`,
  },
  simulators: traceSims(['poo-heritage', 'poo-polymorphisme']),
  comparisons: [{
    title: 'Hériter, redéfinir, étendre',
    headers: ['Dans l’enfant', 'Effet', 'Exemple sur `f.etiquette()`'],
    rows: [
      ['ne rien écrire', 'la méthode du parent est **héritée**', '`"Standard"`'],
      ['redéfinir la méthode', 'la version de l’enfant **masque** celle du parent', '`"FROID"`'],
      ['redéfinir + `super()`', 'l’enfant **étend** le parent', '`"Standard + FROID"`'],
      ['`__init__` sans `super().__init__`', 'les données du parent ne sont **jamais créées**', '`AttributeError: … has no attribute \'emplacement\'` — plus tard, à la première lecture'],
    ],
    conclusion: 'Un enfant qui a son propre `__init__` doit presque toujours commencer par `super().__init__(...)`.',
  }, {
    title: 'Polymorphisme ou cascade de if ?',
    headers: ['', 'Cascade de `if`', 'Polymorphisme'],
    rows: [
      ['Le code', '`if type(c) == ColisFragile: … elif …`', '`c.etiquette()`'],
      ['Ajouter un type de colis', 'modifier **chaque** cascade du programme', 'ajouter **une classe**, sans toucher à la boucle'],
      ['Où est la logique', 'éparpillée chez ceux qui utilisent les colis', 'dans chaque classe, à un seul endroit'],
      ['Principe', '—', 'ouvert à l’extension, fermé à la modification'],
    ],
    conclusion: 'L’héritage n’est pas obligatoire (duck typing) ; il fournit un **comportement par défaut**. Sans lui, une classe qui oublie `etiquette` donne `AttributeError`.',
  }, {
    title: 'Héritage (« est un ») ou composition (« a un ») ?',
    headers: ['Question', 'Réponse', 'Outil'],
    rows: [
      ['Une palette frigo **est une** palette ?', 'oui', 'héritage : `class PaletteFrigo(Palette)`'],
      ['Une palette **est un** colis ?', 'non : elle **a des** colis', 'composition : `self.colis = [...]` (fiche suivante)'],
      ['Un DataFrame **a des** Series ?', 'oui', 'composition'],
    ],
    conclusion: 'En cas de doute, préférer la composition : elle couple moins les classes.',
  }],
  deepDives: [{
    title: 'Le MRO : l’ordre dans lequel Python cherche une méthode',
    body: `\`f.etiquette()\` ne copie rien : Python **remonte** la chaîne des classes jusqu’à trouver la méthode. Cet ordre s’appelle le **MRO** (*Method Resolution Order*) et se lit dans \`Classe.__mro__\`.

Le premier trouvé gagne : c’est pourquoi une méthode redéfinie dans l’enfant **masque** celle du parent sans l’effacer. \`super()\` repart simplement **de la classe suivante** dans le MRO.

\`isinstance(f, Palette)\` vaut \`True\` (une PaletteFrigo est une Palette) alors que \`type(f) == Palette\` vaut \`False\` : pour tester une famille, toujours \`isinstance\`.`,
    code: `PaletteFrigo.__mro__        # (PaletteFrigo, Palette, object)
isinstance(f, Palette)      # True
type(f) == Palette          # False
f.__dict__                  # {'emplacement': …, 'colis': …, 'temperature': 4}  ← toutes les données ici`,
  }],
  pitfalls: [
    'Oublier `super().__init__(...)` : aucune erreur à la création, mais `AttributeError` à la première lecture d’un attribut du parent.',
    'Redéfinir une méthode avec une autre signature : le code qui appelait la version du parent casse.',
    'Tester `type(x) == Parent` au lieu de `isinstance(x, Parent)` : les enfants sont exclus.',
    'Hériter pour réutiliser du code alors que la relation n’est pas « est un » : préférer la composition.',
  ],
  takeaways: [
    '`class Enfant(Parent)` ; `super().__init__(…)` en premier.',
    'Redéfinir = masquer ; `super().m()` = la version du parent.',
    'Polymorphisme : un même appel, sans `if` sur le type.',
    '`isinstance` plutôt que `type(...) ==`.',
  ],
  related: ['python-poo-classes', 'python-poo-composition', 'python-poo-encapsulation'],
  source: 'Récap POO en Python (notes personnelles, 27 nov. 2026) — exemples exécutés avec Python 3.13',
});
