import { defineFiche } from '../../engine/types';
import { traceSims } from '../_lib/trace';

export default defineFiche({
  id: 'labo-python',
  title: 'Labo — fonctions et méthodes natives de Python',
  theme: 'python-core',
  tags: ['tri', 'texte', 'dictionnaires'],
  keywords: ['labo', 'sorted', 'split', 'join', 'round', 'range', 'zip', 'méthodes', 'sorted', 'key', 'reverse', 'sort', 'split', 'maxsplit', 'join', 'replace', 'count', 'strip', 'lstrip', 'rstrip', 'round', 'ndigits', 'range', 'step', 'enumerate', 'start', 'zip', 'strict',
    'pop', 'insert', 'append', 'extend', 'remove', 'index', 'get', 'setdefault', 'update', 'min', 'max', 'default', 'paramètres', 'laboratoire'],
  summary: 'Faire varier les paramètres des fonctions et méthodes natives les plus utiles : `key`, `reverse`, `sep`, `maxsplit`, `ndigits`, `step`, `start`, `strict`, `default`…',
  concept: `Chaque combinaison a été **exécutée par le vrai Python** : résultats, erreurs et messages sont réels.

- **\`sorted(seq, key=, reverse=)\`** et **\`list.sort()\`** : copie triée ou tri sur place.
- **\`str.split(sep, maxsplit)\`**, **\`sep.join(liste)\`**, **\`replace(old, new, count)\`**, **\`strip(chars)\`**.
- **\`round(x, ndigits)\`** : arrondi au pair, nombres négatifs de décimales.
- **\`range(start, stop, step)\`**, **\`enumerate(seq, start=)\`**, **\`zip(a, b, strict=)\`**.
- Méthodes de **liste** (\`pop\`, \`insert\`, \`append\`, \`extend\`, \`remove\`, \`index\`, \`count\`) et de **dictionnaire** (\`get\`, \`pop\`, \`setdefault\`, \`update\`).
- **\`min\` / \`max\`** avec \`key=\` et \`default=\`.
`,
  syntax: `sorted(seq, key=None, reverse=False)
liste.sort(key=None, reverse=False)      # renvoie None
chaine.split(sep=None, maxsplit=-1)
sep.join(liste_de_chaines)
chaine.replace(old, new, count=-1)
chaine.strip(chars=None)
round(nombre, ndigits=None)
range(start, stop, step)
enumerate(seq, start=0)
zip(a, b, strict=False)
liste.pop(index=-1)
dico.get(cle, defaut=None)
min(seq, key=None, default=...)`,
  useCase: 'Change **un paramètre à la fois** et regarde la sortie : c’est le moyen le plus rapide de mémoriser leur effet.',
  simulators: traceSims(['lab-sorted', 'lab-sort', 'lab-split', 'lab-join', 'lab-replace-strip', 'lab-round', 'lab-range', 'lab-enumerate-zip', 'lab-list-methods', 'lab-dict-methods', 'lab-min-max']),
  pitfalls: [
    '`l = l.sort()` met `None` dans `l` : `.sort()` trie sur place et ne renvoie rien.',
    '`sorted(["bob", "Ana"])` : les majuscules passent **avant** les minuscules ; `key=str.lower` corrige.',
    '`", ".join([1, 2])` → `TypeError` : convertir en `str` d’abord.',
    '`round(2.675, 2)` vaut 2.67 (représentation binaire des flottants).',
    '`zip()` coupe **silencieusement** à la séquence la plus courte ; `strict=True` lève une erreur.',
  ],
  takeaways: ['Méthodes qui modifient → renvoient None.', '`key=` change le critère, pas les valeurs.', 'Valeurs par défaut (`get`, `pop`, `default=`) pour éviter les erreurs.'],
  related: ['python-listes', 'python-dictionnaires', 'python-types'],
  source: 'Labo généré avec Python 3.13 (scripts/trace/)',
});
