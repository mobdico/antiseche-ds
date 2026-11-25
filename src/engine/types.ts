/**
 * CONTRAT entre le moteur d'affichage et le contenu.
 *
 * Une fiche = un fichier `src/content/<theme>/<nom>.fiche.ts` qui exporte par défaut
 * un objet `Fiche` (via `defineFiche`). Le moteur ne connaît rien des fiches :
 * il les découvre automatiquement et les affiche à partir de ce schéma.
 *
 * Toute évolution de ce fichier doit rester RÉTRO-COMPATIBLE (champs optionnels),
 * pour ne jamais casser les fiches existantes.
 */

// ---------------------------------------------------------------- Thèmes
export interface Theme {
  id: string;
  label: string;
  icon: string; // monogramme court (2 lettres) affiché dans une pastille
  description: string;
  order: number;
  /** teinte de la pastille du thème (0–360) */
  hue?: number;
}

// ---------------------------------------------------------------- Modèle mémoire
/** Valeur primitive Python représentée côté JS. `null` = None. */
export type Prim = number | string | boolean | null;

/** Une case mémoire : soit une valeur directe, soit une référence vers un objet du tas. */
export type Slot = { v: Prim } | { ref: string };

export interface ObjField {
  label: string;
  slot: Slot;
  hint?: string; // ex. "lignes 0–1"
}

export interface TableData {
  columns: string[];
  index: (string | number)[];
  rows: Prim[][];
  /** dtype par colonne (optionnel) : 'float64' affiche 120 comme 120.0 */
  dtypes?: string[];
}

/** Un objet vivant dans le tas (heap) Python. */
export interface HeapObj {
  id: string; // identifiant stable entre les étapes (sert aux flèches)
  pyType: string; // 'list', 'DataFrame', 'ndarray', 'int'...
  addr?: string; // adresse affichée (sinon dérivée de l'id)
  /** sequence = list/tuple ; table = DataFrame/Series/ndarray 2D ; scalar = int/str ; box = objet à champs */
  kind: 'sequence' | 'table' | 'scalar' | 'box';
  items?: Slot[];
  table?: TableData;
  value?: Prim;
  fields?: ObjField[];
  /** cases modifiées à cette étape : index (sequence) ou "ligne:colonne" (table) */
  changed?: (number | string)[];
  /** badges affichés sur l'objet : 'vue', 'copie', 'temporaire'... */
  badges?: string[];
  /** objet temporaire / plus référencé (affiché en pointillés) */
  ghost?: boolean;
  note?: string;
  /** table : cellules sélectionnées "ligne:colonne", "ligne:*" (ligne entière) ou "*:colonne" */
  selected?: string[];
  /** table : couleur de groupe par ligne (index de palette) ou null */
  rowColors?: (number | null)[];
  /** table : afficher la position entière (0, 1, 2…) à côté de l'étiquette d'index */
  showPositions?: boolean;
  /** type complet affiché par l'inspecteur (ex. 'numpy.float64') — sinon déduit de pyType */
  fullType?: string;
  /** attributs supplémentaires (ou remplacés) affichés par l'inspecteur, ex. { name: '.base', value: 'a' } */
  attrs?: { name: string; value: string }[];
  /** sequence : afficher les chaînes sans guillemets (ex. octets en hexadécimal) */
  rawItems?: boolean;
  /** table : nom de l'index (ex. après un groupby) */
  indexName?: string;
}

export interface VarRef {
  name: string;
  ref: string; // id d'un HeapObj
}

export interface SimStep {
  label: string; // titre court de l'étape
  code: string; // ligne(s) exécutée(s) à cette étape
  vars: VarRef[];
  heap: HeapObj[];
  note?: string;
  /** image produite à cette étape (graphique) : chemin relatif, ex. 'viz/abc.png' */
  image?: { src: string; alt: string };
  /** numéro de ligne (1 = première) du code complet à surligner pendant cette étape */
  line?: number;
  /** variable inspectée par défaut (sinon : « res », ou la dernière variable) */
  inspect?: string;
}

export type AlertLevel = 'error' | 'warning' | 'info' | 'success';

export interface SimAlert {
  level: AlertLevel;
  title: string; // ex. "SettingWithCopyWarning"
  message: string; // markdown léger
  /** index de l'étape où l'alerte se déclenche (affichée à partir de cette étape). Défaut : toujours. */
  atStep?: number;
}

export interface SimResult {
  /** code complet correspondant aux paramètres choisis */
  code: string;
  steps: SimStep[];
  /** sortie console (print) simulée */
  output?: string[];
  alerts?: SimAlert[];
  /** conclusion en une phrase (markdown léger) */
  verdict?: string;
}

// ---------------------------------------------------------------- Paramètres du simulateur
export interface ParamOption {
  value: string;
  label: string; // affiché sur le bouton (peut contenir du code)
  help?: string;
}

/** Affiche le paramètre seulement si un autre paramètre a l'une des valeurs indiquées. */
export type ShowIf = Record<string, string | boolean | (string | boolean)[]>;

export type ParamDef =
  | { id: string; label: string; type: 'choice'; options: ParamOption[]; default: string; help?: string; showIf?: ShowIf }
  | { id: string; label: string; type: 'toggle'; default: boolean; onLabel?: string; offLabel?: string; help?: string; showIf?: ShowIf };

export type ParamValues = Record<string, string | boolean>;

export interface Simulator {
  /** titre du simulateur (utile quand une fiche en a plusieurs) */
  title?: string;
  params: ParamDef[];
  /** Fonction PURE : mêmes paramètres → même résultat. Ne doit jamais lever d'exception. */
  simulate: (p: ParamValues) => SimResult;
}

// ---------------------------------------------------------------- Référentiel des types (inspecteur)
export interface TypeMethod {
  sig: string; // ex. '.value_counts()'
  desc: string; // une ligne
}
export interface TypeRef {
  fullName: string; // ex. 'pandas.Series'
  summary: string;
  methods: TypeMethod[];
}

// ---------------------------------------------------------------- Fiche
export interface Fiche {
  id: string; // unique, kebab-case — sert d'URL (#/fiche/<id>)
  title: string;
  theme: string; // id d'un Theme
  tags: string[];
  /** mots-clés de recherche supplémentaires : noms de fonctions, messages d'erreur... */
  keywords?: string[];
  summary: string; // une phrase
  /** Le concept, en markdown léger (paragraphes, listes "- ", `code`, **gras**) */
  concept: string;
  /** syntaxe de référence (code Python) */
  syntax: string;
  useCase?: string;
  /** les pièges classiques, une entrée par piège */
  pitfalls?: string[];
  /** à retenir : 2–5 puces maximum */
  takeaways?: string[];
  simulator?: Simulator;
  /** simulateurs supplémentaires, affichés après le premier */
  simulators?: Simulator[];
  related?: string[]; // ids d'autres fiches
  source?: string; // ex. "Fiche PDF — Pandas 1, p.3"
  /** version minimale du contrat de données — réservé aux migrations futures */
  schema?: 1;
}

/** Aide au typage pour les fichiers de contenu. */
export const defineFiche = (f: Fiche): Fiche => f;
