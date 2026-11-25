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

Ajouter une fiche = créer un fichier `*.fiche.ts` (voir `src/engine/types.ts`), sans toucher au moteur.
Les comportements simulés sont vérifiés avec le vrai pandas (2.2 et 3.1) ; les différences de version sont signalées.
