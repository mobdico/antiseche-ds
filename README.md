# Antisèche Python · Data

Cheat sheet interactive personnelle : Python, NumPy, Pandas, nettoyage, visualisation.
Chaque fiche contient le concept, la syntaxe, un ou plusieurs **simulateurs** (paramètres modifiables,
schéma mémoire variables → objets, sortie console, alertes), les pièges et l'essentiel à retenir.

## Lancer en local
```bash
npm install
npm run dev          # http://localhost:5173
npm test             # vérifie toutes les fiches et toutes les combinaisons de paramètres
npm run build:single # un seul fichier autonome : dist-single/index.html
```

## Organisation
```
sources/<thème>/*.pdf          # fiches PDF d'origine (DataXp)
src/content/themes.ts          # liste des thèmes
src/content/<thème>/*.fiche.ts # UNE fiche = UN fichier, détecté automatiquement
src/content/_lib/              # aides aux simulations (mini-modèle pandas)
src/engine/                    # contrat de données (types.ts), registre, recherche
src/components/                # interface : fiche, simulateur, schéma mémoire
tests/                         # garde-fous sur tout le contenu
```

## Labo des méthodes (résultats réels de pandas)
Les fiches « Labo » affichent des résultats **exécutés par le vrai pandas**, pour chaque combinaison de paramètres.
- Décrire méthodes / paramètres / valeurs : `scripts/lab/lab_pandas.py`
- Régénérer (un environnement par version de pandas) :
```bash
python scripts/lab/generate.py out-p3.json   # avec pandas 3.x installé
python scripts/lab/generate.py out-p2.json   # avec pandas 2.x installé
python scripts/lab/merge.py out-p3.json out-p2.json   # → src/content/_data/labo-pandas.json
```
- Nouvelle famille : l'ajouter dans `FAMILIES`, puis créer `src/content/pandas/labo-<id>.fiche.ts` (3 lignes).

## Simulateurs tracés (Python exécuté ligne par ligne)
Les fiches Python Core utilisent un traceur qui exécute le **vrai Python** ligne par ligne et enregistre la mémoire
(variables, objets, adresses `id()`, sorties, erreurs) après chaque ligne.
- Scénarios (code avec emplacements `«param»` + options) : `scripts/trace/scenarios_python_core.py`
- Régénérer : `python scripts/trace/trace.py scripts/trace/scenarios_python_core.py src/content/_data/trace-python-core.json`
- Utiliser dans une fiche : `simulators: traceSims(["id-du-scenario"])`

Ajouter une fiche = créer un fichier `*.fiche.ts` (voir `src/engine/types.ts`), sans toucher au moteur.
Site en ligne (privé) : https://claude.ai/artifact/Bk3DTRvFDkamoVydk1RtLn — mise à jour : `npm run build:artifact` puis republier `dist-artifact/antiseche.html`.

Les comportements simulés sont vérifiés avec le vrai pandas (2.2 et 3.1) ; les différences de version sont signalées.
