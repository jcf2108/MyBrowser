# MyBrowser — Poste de Pilotage Chromium & Écosystème Modulaire

Navigateur web basé sur **Chromium** (via Electron `WebContentsView` + React + TypeScript + Vite + Tailwind CSS), conçu selon le système visuel **`Cartouche d'Atelier ISO`**.

## Fonctionnalités Clés

1. **Moteur Chromium Natif & Accélération 3D (WebGL2 / WebGPU)**
   - Chaque onglet externe ou local tourne dans une surface `WebContentsView` Chromium native avec accélération matérielle GPU complète (`--enable-unsafe-webgpu`, `--ignore-gpu-blocklist`, `--enable-gpu-rasterization`).
   - Banc d'essai 3D interactif intégré (`my://3d-lab`).

2. **Espaces de Travail Isolés (Workspaces)**
   - Cloisonnement complet des sessions Chromium (`session.fromPartition('persist:workspace-...')`) par espace de travail (cookies, cache, stockage local et authentification isolés).

3. **Barre Verticale Repliable (« Spine ») & Écran Scindé (`Split-View A | B`)**
   - Colonne verticale repliable en une tranche technique de `48px` (`SPINE`) conservant les indicateurs d'espaces, d'onglets et d'état des ports locaux.
   - Affichage simultané de deux vues web côte à côte (`CADRE A` et `CADRE B`) avec permutation instantanée (`A⇄B`) et panneau latéral compagnon (`Sidebar`).

4. **Favoris d'Applications Externes & Ports Locaux Configurables (`my://apps`)**
   - Épinglez librement n'importe quelle application web externe via une **URL directe** (`https://...`) ou un service local en développement via un **Hôte + Port TCP configurable** (`127.0.0.1:3000`, `:5188`, `:8080`, etc.).
   - **Sonde TCP en direct** indiquant si le port local est actif (`ACTIF` avec latence en `ms`) ou fermé (`FERMÉ`).
   - **Profil vierge pour le partage** : aucun outil privé n'est imposé en dur aux utilisateurs avec qui le navigateur est partagé.

5. **Bouclier Réseau Natif (`my://privacy`) & Agent Local (`my://agent`)**
   - Filtrage natif des traqueurs et domaines publicitaires au niveau réseau des sessions Chromium, nettoyage des paramètres `utm_*` / `fbclid` / `gclid` et en-têtes `DNT: 1` / `Sec-GPC: 1`.
   - Agent d'extraction DOM/GPU, bibliothèque de scripts utilisateur (`Userscripts`) et **Pont API HTTP local** attaché strictement à `127.0.0.1:4577`.

---

## Installation sur Windows (`.exe`)

### Via GitHub Actions (Automatique)
À chaque push sur la branche `main`, le workflow GitHub Actions **[Build Windows Installer & Portable (.exe)](.github/workflows/build-windows.yml)** compile automatiquement les exécutables Windows x64 :
1. Rendez-vous dans l'onglet **Actions** du dépôt GitHub `MyBrowser`.
2. Ouvrez le dernier build réussi et téléchargez l'artefact **`MyBrowser-Windows-x64`** qui contient :
   - **`MyBrowser Setup 0.1.0.exe`** (Installateur Windows avec raccourci Bureau et Menu Démarrer).
   - **`MyBrowser 0.1.0.exe`** (Version portable sans installation).

*(Pour publier automatiquement une Release GitHub publique avec les `.exe`, poussez un tag `git tag v0.1.0 && git push origin v0.1.0`).*

### Compilation locale
```bash
# Installer les dépendances
npm install

# Lancer en mode développement (Serveur Vite sur 127.0.0.1:5188 + Electron)
npm run dev

# Générer l'installateur Windows (.exe) dans le dossier release/
npm run dist:win
```

---

## Licence

Ce projet est distribué sous licence **[PolyForm Noncommercial License 1.0.0](./LICENSE)**.
L'utilisation personnelle, éducative, de recherche et non commerciale est autorisée conformément aux termes du fichier [`LICENSE`](./LICENSE).
