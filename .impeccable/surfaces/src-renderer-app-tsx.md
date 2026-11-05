---
version: 1
slug: "src-renderer-app-tsx"
primary_target: "src/renderer/App.tsx"
related_targets: ["src/renderer/index.html"]
---

# Surface Brief — MyBrowser Shell (`src/renderer/App.tsx`)

## Scope and Mode
- **Surface** : Interface principale du navigateur Electron (`src/renderer/App.tsx`, `src/renderer/index.html`) et pages internes (`my://start`, `my://apps`, `my://agent`, `my://privacy`).
- **Mode** : `operate`

## Audience, Job, and Task
- **Audience** : Créateur/développeur web & 3D et utilisateurs finaux partageant le navigateur.
- **Job** : Naviguer, inspecter côte à côte (Split-View) des applications en production et des serveurs locaux (`127.0.0.1:port`), épingler des applications externes comme des favoris intelligents, bloquer les traqueurs et piloter l'agent d'automatisation local.
- **Signature Interaction** : Bascule fluide entre vue simple et écran scindé (Split-View) avec alignement des cartouches d'en-tête au pixel près, repli de la barre verticale en une tranche (« spine ») technique de 44px, et ouverture instantanée des applications connectées dans le panneau latéral persistant.

## Direction contract

THESIS: MyBrowser est une table à dessin d'ingénierie ISO où chaque vue Chromium, espace isolé et port local est encadré par un cartouche technique continu de 1px, refusant le flou glassmorphique décoratif et les barres grises bureautiques génériques.

OWN-WORLD: Fond ardoise graphite mat (`#121519`) et panneaux d'atelier (`#1a1f26`) calibrés pour ne jamais fausser la colorimétrie des scènes WebGL/3D ; filets continus de 1px (`#2a313c`), encre blanc craie (`#e6edf3`), vermillon Rotring (`#ff5a26`) strictement réservé aux contrôles actifs et à la vue ayant le focus, émeraude technique (`#2ea043`) pour les ports locaux actifs et le bouclier réseau.

STORY: L'opérateur lit d'un coup d'œil quelle partition d'espace est active, combien de traqueurs sont bloqués, quel port local ou URL répond dans le dock d'applications, et bascule en un clic une application externe en Split-View ou en Sidebar.

FIRST VIEWPORT: À gauche, la colonne verticale repliable en tranche (« spine ») regroupant le sélecteur d'Espaces isolés, les Onglets verticaux et le Dock d'Applications Connectées (ajout libre URL / `127.0.0.1:port`). En haut, le cartouche ISO de navigation (contrôles, omnibox `https://` ou `my://`, télémétrie tabulaire du bouclier Adblock, bascule Split-View et statut du pont API `127.0.0.1`). Au centre, l'aire de travail simple ou Split-View à double cartouche aligné. À droite, le panneau latéral persistant (Compagnon d'application, Agent d'extraction/scripts ou Gestionnaire d'applications connectées).

FORM: Planche d'architecte & Cartouche Technique ISO / Rotring, candidat #3 de la liste ancrée, seed key `03a8dd9e` (code-led).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
