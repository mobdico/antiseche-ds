import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'python-poo-encapsulation',
  title: 'Encapsulation : @property et setter',
  theme: 'python-core',
  tags: ['poo', 'erreurs'],
  keywords: ['encapsulation', 'property', '@property', 'setter', '@x.setter', 'getter', '_qte', 'attribut protégé', 'underscore', 'validation',
    'contrôle', 'ValueError', 'raise', 'lecture seule', "can't set attribute", 'has no setter'],
  summary: '`@property` et `@nom.setter` forment un **guichet** : chaque lecture ou écriture passe par un contrôle, invisible pour l’utilisateur. La vraie valeur est rangée dans `_nom`.',
  concept: `
- Une **property** ressemble à un attribut (\`s.qte\`, \`s.qte = 5\`) mais exécute une méthode : le **getter** à la lecture, le **setter** à l’écriture.
- Le guichet est **rangé dans la classe** ; la vraie valeur est dans le tiroir de l’objet, sous un autre nom : \`_qte\`.
- Le \`_\` initial est une **convention** : « usage interne, ne pas toucher ». Python n’interdit rien.
- Dans \`__init__\`, écrire \`self.qte = qte\` (sans \`_\`) fait passer la valeur de départ **par le setter** : l’objet est contrôlé dès sa création.
- Sans setter, la property est en **lecture seule** : \`s.qte = 5\` lève une \`AttributeError\`.
`,
  syntax: `class Stock:
    def __init__(self, qte):
        self.qte = qte              # passe par le setter

    @property
    def qte(self):                  # getter : s.qte
        return self._qte

    @qte.setter
    def qte(self, v):               # setter : s.qte = v
        if v < 0:
            raise ValueError("négatif")
        self._qte = v

Stock(-10)   # ValueError, dès la création`,
  mentalModel: {
    title: 'La règle',
    code: `s.qte          # → getter     (méthode de la classe)
s.qte = 5      # → setter     (contrôle, puis self._qte = 5)
s._qte         # la vraie valeur, dans le tiroir de l’objet
self._qte = …  # hors du getter/setter : CONTOURNE le contrôle`,
    note: 'Astuce de relecture : dès qu’une classe a une property, cherche les `self._` en dehors du getter et du setter.',
  },
  simulators: traceSims(['poo-property']),
  comparisons: [{
    title: 'Attribut simple ou property ?',
    headers: ['', 'Attribut simple `self.qte`', 'Property `qte` + `self._qte`'],
    rows: [
      ['Écriture `s.qte = -3`', 'acceptée sans rien dire', 'passe par le setter → `ValueError`'],
      ['Lecture `s.qte`', 'lit le tiroir', 'appelle le getter (peut calculer la valeur)'],
      ['Où est la donnée', '`s.__dict__["qte"]`', '`s.__dict__["_qte"]`'],
      ['Pour l’utilisateur', '`s.qte`', '`s.qte` : **même syntaxe**'],
      ['Quand l’utiliser', 'aucune règle à faire respecter', 'une valeur à valider, ou à calculer à la volée'],
    ],
    conclusion: 'On peut commencer par un attribut simple et le transformer en property plus tard **sans changer le code qui l’utilise**.',
  }, {
    title: 'Ce qui passe par le contrôle, et ce qui le contourne',
    headers: ['Écriture', 'Contrôlée ?', 'Résultat avec -3'],
    rows: [
      ['`s.qte = -3`', 'oui (setter)', '`ValueError: quantité négative`'],
      ['`self.qte = qte` dans `__init__`', 'oui', '`Stock(-10)` → `ValueError` dès la création'],
      ['`self._qte = qte` dans `__init__`', '**non**', '`Stock(-10)` crée un stock négatif'],
      ['`s._qte = -3` ou `self._qte = 0` dans une autre méthode', '**non**', 'écrit directement dans le tiroir'],
      ['`Stock.qte = 7`', '**non**', 'remplace la property elle-même, pour tous les objets'],
    ],
  }],
  deepDives: [{
    title: 'Pourquoi la property gagne sur le tiroir de l’objet',
    body: `Une property est rangée dans la **classe**, et pourtant elle passe **avant** le tiroir de l’objet : c’est la première étape de la recherche (fiche Classes, instances et self).

C’est pour cela que la valeur doit être stockée sous un **autre nom** (\`_qte\`) : si le setter écrivait \`self.qte = v\`, il se rappellerait lui-même à l’infini (\`RecursionError\`).

Et si l’on remplace la property au niveau de la classe (\`Stock.qte = 7\`), il n’y a plus de guichet : le tiroir de l’objet reprend la main.`,
    code: `s = Stock(3)
s.__dict__        # {'_qte': 3}   ← pas de 'qte' : c’est la property qui répond
s.__dict__["qte"] = 99
s.qte             # 3   ← la property gagne sur le tiroir
Stock.qte = 7     # plus de property…
s.qte             # 99  ← le tiroir de l’objet gagne sur l’attribut de classe`,
  }],
  pitfalls: [
    'Tout `self._qte = …` hors du getter et du setter contourne le contrôle — **y compris dans `__init__`**.',
    'Dans le setter, écrire `self.qte = v` au lieu de `self._qte = v` → le setter se rappelle lui-même : `RecursionError`.',
    'Property sans setter : `s.qte = 5` → `AttributeError` (lecture seule) — utile pour une valeur calculée.',
    'Le `_` n’est qu’une convention : rien n’empêche `s._qte = -3`. C’est un signal « ne pas toucher », pas un verrou.',
  ],
  takeaways: [
    '`@property` = getter ; `@nom.setter` = setter : même syntaxe qu’un attribut.',
    'La vraie valeur dans `self._nom`.',
    'Dans `__init__`, écrire `self.nom = …` pour passer par le contrôle.',
  ],
  related: ['python-poo-classes', 'python-poo-heritage'],
  source: 'Récap POO en Python (notes personnelles, 27 nov. 2026) — exemples exécutés avec Python 3.13',
});
