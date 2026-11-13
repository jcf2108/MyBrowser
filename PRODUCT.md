# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Electron (`WebContentsView` multi-process architecture) + React + TypeScript + Vite + Tailwind CSS.

## Users

- **Créateurs, développeurs et power-users** qui jonglent au quotidien entre la navigation web classique, des applications web en production et des outils/services web locaux en cours de développement.
- **Utilisateurs finaux avec qui le navigateur est partagé**, qui souhaitent un navigateur rapide, respectueux de la vie privée et personnalisable, sans qu'aucun outil tiers spécifique ne leur soit imposé par défaut.

## Product Purpose

MyBrowser est un navigateur web basé sur Chromium (via Electron `WebContentsView`) conçu pour unifier la navigation avancée (onglets verticaux, espaces de travail isolés, écrans scindés Split-View), la protection native de la vie privée (bloqueur de publicités et de traqueurs intégré), l'automatisation locale (agent d'extraction, capture et scripts utilisateur) et la connexion souple à un écosystème personnel d'applications web ou locales.

## Positioning

Contrairement aux navigateurs généralistes figés ou aux navigateurs spécialisés verrouillés sur un service propriétaire, MyBrowser offre :
1. **Un système ouvert d'Applications Connectées (Dock d'écosystème)** : fonctionne comme des favoris intelligents permettant d'épingler n'importe quelle application externe via une simple URL ou un couple `hôte/port` configurable (pour les outils locaux en développement), accessible en un clic dans la barre latérale persistante, en onglet dédié, en Split-View, ou via un raccourci `my://<alias>`, sans rien imposer aux utilisateurs qui n'utilisent pas ces outils.
2. **Une isolation native par Espace de travail (Workspaces)** : chaque espace possède sa propre partition de session Chromium (`persist:<workspace>`) isolant cookies, stockage et authentification.
3. **Un pont local (Local API / WebSocket Bridge sur `127.0.0.1`) et un Agent d'automatisation intégré** permettant d'inspecter, extraire des données, exécuter des scripts personnalisés et faire dialoguer le navigateur avec les outils autorisés de l'utilisateur.

## Operating Context

- Utilisation quotidienne comme navigateur principal et poste de travail desktop (Linux, Windows, macOS) sur écrans larges ou portables.
- Coexistence de sessions web classiques, de scènes WebGL/WebGPU/3D exigeantes (accélération matérielle Chromium native) et d'applications locales servies sur `127.0.0.1` avec des ports dynamiques ou configurables.

## Capabilities and Constraints

- **Moteur de rendu** : Chromium natif via `WebContentsView` d'Electron (compositeur GPU natif, support WebGL2 / WebGPU complet).
- **Navigation & Layout** :
  - Barre d'onglets verticale repliable avec recherche rapide / filtre.
  - Espaces de travail (Workspaces) avec sessions Chromium isolées (`session.fromPartition`).
  - Mode **Split-View** (affichage simultané côte à côte de 2 vues web indépendantes avec redimensionnement fluide).
  - **Panneau latéral (Sidebar) persistant** pour garder une application connectée ou un outil (Agent, Notes, Inspecteur) ouvert à côté de la navigation.
- **Applications Connectées (Écosystème modulaire)** :
  - Ajout, édition et suppression libre d'applications par l'utilisateur (Nom, URL complète ou `127.0.0.1` + port configurable, alias `my://`, icône/couleur, ouverture en Sidebar / Onglet / Split-View).
  - Aucune application privée n'est imposée en dur aux utilisateurs tiers qui installent le navigateur.
- **Vie privée & Sécurité** :
  - Bloqueur de publicités, de traqueurs et de télémétrie intégré au niveau réseau des sessions Chromium (compteur de requêtes bloquées par page et global, activable/désactivable par site).
  - Règle stricte de sécurité réseau : tout serveur local ou pont API interne (Vite dev server, API HTTP/WebSocket du navigateur) écoute exclusivement sur `127.0.0.1` (jamais `0.0.0.0`).
- **Agent & Automatisation intégrée** :
  - Capture de page, extraction structurée du DOM (liens, textes, métadonnées, tableaux, JSON), et bibliothèque de scripts personnalisés injectables à la demande ou par domaine.
  - Pont API local (`127.0.0.1`) avec jeton/contrôle d'accès permettant aux outils externes de l'utilisateur d'interagir avec les onglets ouverts.

## Brand Commitments

- **Nom du projet** : `MyBrowser`
- **Langue de l'interface** : Français (ultra-concis : 1 à 3 mots par contrôle, icônes claires, zéro surcharge textuelle ni paragraphes explicatifs).
- **Direction visuelle de référence (Canon imposé par l'utilisateur)** : Minimalisme sobre, moderne et doux inspiré de **Arc Browser** et **Zen Browser** — barre latérale gauche épurée et escamotable pour les onglets et favoris rapides, barre de navigation supérieure fine avec champ d'adresse arrondi, bascule Thème Clair / Sombre en un clic, URL de nouvel onglet par défaut personnalisable (ex. application web personnelle `MySpot`), vue simple par défaut (95 % de l'écran dédié à la page web, sans Split-View ni panneaux techniques ouverts d'office).

## Evidence on Hand

- Dépôt greenfield (`/home/ubuntu/GitHub/MyBrowser`) prêt à accueillir l'architecture complète Electron Main + Preload + React Shell UI + gestionnaire de vues Chromium `WebContentsView`.
- Aucune donnée commerciale, télémétrie ou dépendance cloud obligatoire.

## Product Principles

1. **Le contenu web et la 3D d'abord** : l'interface du navigateur (le *chrome*) doit être ultra-réactive, compacte et laisser un maximum d'espace et de ressources GPU aux vues Chromium (`WebContentsView`).
2. **Écosystème à la carte, zéro verrouillage** : lier ses outils (en prod ou en local avec port configurable) doit être aussi simple qu'ajouter un favori, sans jamais alourdir ou polluer l'expérience d'un utilisateur externe.
3. **Isolation et contrôle local** : les sessions sont cloisonnées par espace de travail, le blocage des traqueurs est natif, et toutes les passerelles d'automatisation restent strictement locales (`127.0.0.1`).
4. **Multitâche sans friction** : passer d'un onglet simple à un écran scindé (Split-View) ou ouvrir une application dans le panneau latéral doit se faire instantanément sans recharger la page.
