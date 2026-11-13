---
version: 1
slug: "src-renderer-app-tsx"
primary_target: "src/renderer/App.tsx"
related_targets: ["src/renderer/index.html"]
---

# Surface Brief — MyBrowser Shell (`src/renderer/App.tsx`)

## Scope and Mode
- **Surface** : Interface principale du navigateur Electron (`src/renderer/App.tsx`, `src/renderer/index.html`) et vue Nouvel Onglet / Réglages rapides (`src/renderer/components/InternalSurfaces.tsx`).
- **Mode** : `operate`

## Audience, Job, and Task
- **Audience** : Utilisateur au quotidien qui veut un navigateur web sobre, moderne, minimaliste et naturel (référence Arc Browser / Zen Browser), ouvrant directement son application web favorite (`MySpot` ou toute URL personnalisable) sans surcharge textuelle.
- **Job** : Naviguer sur le web à plein écran (95 % de la surface), gérer ses onglets et ses favoris dans une barre latérale gauche ultra-épurée et escamotable, basculer entre thème Clair et Sombre en un clic, et accéder naturellement aux extensions Chrome et aux réglages.
- **Signature Interaction** : Repli fluide de la barre latérale gauche d'onglets (style Arc/Zen) pour laisser toute la fenêtre au contenu web encadré avec douceur, bascule instantanée Clair/Sombre, et configuration directe de l'URL d'ouverture par défaut d'un nouvel onglet.

## Direction contract

THESIS: MyBrowser adopte l'architecture minimaliste et apaisée d'Arc et Zen Browser où 95 % de la fenêtre appartient au contenu web dans un cadre doux aux coins arrondis, éliminant tout jargon technique, texte superflu, bordure carrée agressive et panneau latéral imposé.

OWN-WORLD: Palette double Clair / Sombre en un clic — en mode Sombre, gris anthracite velouté (`#18181b` fond d'encadrement, `#27272a` surfaces douces, `#f4f4f5` texte principal, `#a1a1aa` secondaire) ; en mode Clair, gris perle lumineux (`#f4f4f5` fond d'encadrement, `#ffffff` surfaces, `#18181b` texte principal, `#71717a` secondaire) ; un seul accent indigo/bleu doux (`#6366f1` / `#4f46e5`) discret, rayons continus (`rounded-xl` pour la fenêtre web, `rounded-lg` pour les onglets et la barre d'adresse), typographie sans-serif naturelle (`Plus Jakarta Sans` / `Inter` système), zéro bloc criard.

STORY: Dès l'ouverture, l'utilisateur se trouve face à un navigateur familier, calme et limpide : ses onglets et favoris rapides sont rangés à gauche sous forme d'icônes et de titres courts, la barre supérieure ne contient que l'essentiel (Précédent, Suivant, Actualiser, barre d'adresse centrale, Extensions, Thème Clair/Sombre, Réglages), et chaque nouvel onglet ouvre directement son URL personnalisée (comme MySpot) ou une page d'accueil minimaliste.

FIRST VIEWPORT: À gauche, une barre latérale fine (220px, escamotable en un clic) contenant uniquement les pastilles de favoris rapides en haut, le bouton `+ Nouvel onglet` et la liste épurée des onglets ouverts, avec en bas un discret pied de barre (version / mise à jour et bouton Réglages). En haut, une barre de navigation minimaliste de 44px avec les flèches de navigation, la barre d'adresse arrondie au centre et 4 icônes d'action à droite (Extensions, Split-View optionnel, Thème Clair/Sombre, Réglages). Au centre, 95 % de l'écran occupé par une seule vue web aux coins subtilement arrondis.

FORM: Canon navigateur moderne épuré (référence Arc Browser & Zen Browser), seed key `25fbfcda` (code-led).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
