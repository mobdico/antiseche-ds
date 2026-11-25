import { defineFiche } from '../../engine/types';
import { vizSims } from '../_lib/viz';

export default defineFiche({
  id: 'story-gestalt',
  title: 'Guider le regard : Gestalt et attributs préattentifs',
  theme: 'storytelling',
  tags: ['lisibilite'],
  keywords: ['gestalt', 'proximité', 'similarité', 'enclosure', 'connexion', 'préattentif', 'proximité', 'similarité', 'enclosure', 'connexion', 'attribut préattentif', 'couleur', 'taille', 'forme', 'mise en avant'],
  summary: 'Les principes qui font que l’œil **regroupe** des éléments, et les attributs qui attirent le regard **avant la lecture**.',
  concept: `
- **Proximité** : les objets visuellement proches sont perçus comme un même groupe.
- **Similarité** : les objets qui se ressemblent (couleur, forme, taille) sont perçus comme un même groupe.
- **Enclosure** : les objets entourés par une même forme (cadre, ellipse) sont perçus comme un même groupe.
- **Connexion** : les objets reliés par une ligne ou une flèche sont perçus comme un même groupe. Ce principe est généralement **plus fort** que la proximité et la similarité.
- **Attributs préattentifs** : couleur, taille, forme… que le cerveau remarque **avant l’attention consciente**. Utiles pour guider le regard, mais à utiliser **avec parcimonie**.
`,
  syntax: `# proximité   : rapprocher ce qui va ensemble, espacer le reste
# similarité  : même couleur / forme / taille = même groupe
# enclosure   : ax.add_patch(plt.Rectangle(...))
# connexion   : ax.plot([x1, x2], [y1, y2])
# préattentif : une seule couleur vive, le reste en gris`,
  simulators: vizSims(['gestalt', 'preattentif']),
  pitfalls: ['Colorer toutes les barres différemment : plus rien ne ressort.', 'Trop d’attributs préattentifs se neutralisent.'],
  takeaways: ['Connexion > proximité, similarité.', 'Une seule mise en avant par graphique.', 'Gris par défaut, couleur pour le message.'],
  related: ['story-audience', 'story-style'],
  source: 'DataXp — Storytelling et design de l’information, chapitre 3 (sources/storytelling/dataxp-principes-gestalt-attributs-preattentifs.pdf)',
});
