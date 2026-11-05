---
name: MyBrowser
description: Table à dessin d'ingénierie ISO et navigateur Chromium multi-vues à cartouches continus de 1px.
colors:
  rotring-vermilion: "#ff5a26"
  rotring-vermilion-hover: "#ff7142"
  accent-contrast-ink: "#0d1014"
  technical-emerald: "#2ea043"
  amber-warning: "#d29922"
  crimson-danger: "#f85149"
  slate-drafting-bg: "#121519"
  atelier-panel: "#1a1f26"
  elevated-cartouche: "#212730"
  iso-hairline: "#2a313c"
  iso-line-strong: "#384252"
  chalk-ink: "#e6edf3"
  technical-slate-secondary: "#9ba9bb"
  muted-blueprint-ink: "#8c9db0"
typography:
  display:
    fontFamily: "'Archivo', system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Archivo', system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.4
  title:
    fontFamily: "'Archivo', system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "'Archivo', system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  label:
    fontFamily: "'Azeret Mono', ui-monospace, SFMono-Regular, monospace"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.25
    fontFeature: "'tnum'"
rounded:
  none: "0px"
spacing:
  px: "1px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  header-bar: "44px"
  pane-cartouche: "36px"
  rail-spine: "48px"
  rail-expanded: "240px"
  sidebar-right: "288px"
components:
  button-primary:
    backgroundColor: "{colors.rotring-vermilion}"
    textColor: "{colors.accent-contrast-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "{colors.rotring-vermilion-hover}"
  button-elevated:
    backgroundColor: "{colors.elevated-cartouche}"
    textColor: "{colors.chalk-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "4px 10px"
  button-ghost:
    backgroundColor: "{colors.slate-drafting-bg}"
    textColor: "{colors.chalk-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
  input-omnibox:
    backgroundColor: "{colors.slate-drafting-bg}"
    textColor: "{colors.chalk-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0px 8px"
    height: "28px"
  card-cartouche:
    backgroundColor: "{colors.atelier-panel}"
    textColor: "{colors.chalk-ink}"
    rounded: "{rounded.none}"
    padding: "14px"
---

# Design System: MyBrowser

## Overview

**Creative North Star: "Cartouche d'Atelier ISO"**

MyBrowser est conçu comme une table à dessin d'ingénierie ISO et un banc de pilotage Chromium où chaque vue web, chaque partition de session isolée et chaque port local (`127.0.0.1:port`) est encadré par un cartouche technique continu de `1px`. L'interface s'efface au profit des scènes WebGL2/WebGPU et des applications en développement grâce à une densité d'instrument de précision, sans jamais imposer d'applications tierces préconfigurées en dur.

Le système rejette explicitement le flou glassmorphique décoratif (`backdrop-filter`), les ombres portées diffuses, les rayons d'arrondi mous et les barres d'outils bureautiques grises génériques. Toute la hiérarchie repose sur des aplats mats neutres, une grille de filets continus orthogonaux et une signalétique Rotring où la couleur possède une signification opératoire stricte.

**Key Characteristics:**
- Cartouches techniques continus de `1px` (`#2a313c`) à géométrie strictement orthogonale (`0px` de rayon).
- Palette ardoise graphite neutre (`#121519` et `#1a1f26`) calibrée pour préserver la colorimétrie des rendus 3D WebGL2/WebGPU.
- Signalétique d'instrument : Vermillon Rotring (`#ff5a26`) réservé au focus actif et Émeraude Technique (`#2ea043`) dédiée aux ports `127.0.0.1` en ligne et au bouclier réseau.
- Colonne verticale repliable en tranche technique (« Spine » de `48px`) et double cadre Split-View (`CADRE A` / `CADRE B`) aligné au pixel près sur une ligne de base de `36px`.
- Télémétrie tabulaire (`Azeret Mono`, `tabular-nums`) pour les ports TCP, latences, compteurs Adblock et coordonnées 3D.

## Colors

La palette combine des surfaces ardoise mates à dérive chromatique minimale avec des encres techniques franches inspirées des stylos tubulaires Rotring et des planches d'architecte ISO.

### Primary
- **Vermillon Rotring** (`#ff5a26`): Couleur d'autorité focale utilisée exclusivement pour la partition d'espace active, le badge et le filet inférieur du cadre ayant le focus (`CADRE A // FOCUS` ou `CADRE B // FOCUS`), le bouton d'action primaire du panneau actif, le curseur de texte (`caret-color`) et le contour de focus clavier (`:focus-visible`).
- **Vermillon Rotring Survol** (`#ff7142`): État de survol immédiat des déclencheurs primaires en Vermillon Rotring.
- **Encre Contraste sur Vermillon** (`#0d1014`): Texte et icônes à fort contraste posés directement sur un fond `#ff5a26` (badges `[A]`, `[B]`, `CADRE A // FOCUS`, espace actif et sélection de texte `::selection`).

### Secondary
- **Émeraude Technique** (`#2ea043`): Signal fonctionnel réservé aux ports locaux actifs sur `127.0.0.1`, à l'état actif du bouclier réseau Chromium (`BLK:count`), au badge secondaire `[B]` non focalisé et à la confirmation matérielle `WEBGL2 ACTIF · WEBGPU PRÊT`.

### Tertiary
- **Ambre d'Alerte Hors-Ligne** (`#d29922`): Signal d'avertissement indiquant un port TCP local fermé (`FERMÉ`) ou la mise en pause du bouclier de filtrage.
- **Rouge Critique de Révocation** (`#f85149`): Action destructive de fermeture d'onglet au survol ou de suppression d'un favori d'application / script utilisateur.

### Neutral
- **Ardoise Graphite de Fond** (`#121519`): Toile de fond principale du navigateur, des champs de saisie, des cellules de grille technique et du canevas CAO 3D.
- **Panneau d'Atelier ISO** (`#1a1f26`): Surface structurelle de la barre supérieure (`44px`), du rail vertical (`240px` / `48px`), du panneau latéral droit (`288px`) et des conteneurs de section.
- **Cartouche Surélevé** (`#212730`): Troisième échelon tonal utilisé pour l'onglet sélectionné, les boutons d'action secondaires renforcés et les commutateurs de mode actifs (`SPLIT A|B`, `APP`, `AGENT`, `SHIELD`).
- **Filet Continu ISO 1px** (`#2a313c`): Ligne de structure universelle de `1px` séparant les barres, les cadres Split-View, les cellules de spécification et les lignes de liste.
- **Filet Structurel Fort** (`#384252`): Bordure accentuée pour les déclencheurs surélevés (`button-elevated`), le curseur de barre de défilement et les repères d'angle du canevas 3D.
- **Encre Blanc Craie** (`#e6edf3`): Texte primaire haute lisibilité pour les titres, URL actives, noms d'applications et arêtes extérieures du prisme 3D.
- **Ardoise Technique Secondaire** (`#9ba9bb`): Métadonnées techniques, préfixes de protocole, étiquettes de formulaire, chemins d'URL secondaires et axe `Z+` du banc 3D.
- **Encre Fantôme de Saisie** (`#8c9db0`): Texte d'invite (`::placeholder`) dans l'Omnibox et les champs de configuration.

### Named Rules

**The Rotring Focus Rule.** Le Vermillon Rotring (`#ff5a26`) signale un unique foyer d'attention actif à la fois : lorsque le `CADRE B` prend le focus en Split-View, le `CADRE A` perd son badge et son filet vermillon au profit d'un cartouche neutre (`#2a313c`).

**The Colorimetric Neutrality Rule.** Les barres et panneaux périphériques restent strictement sur les trois gris ardoise (`#121519`, `#1a1f26`, `#212730`) sans dégradé coloré ni halo lumineux, afin de ne jamais altérer la perception des couleurs dans les scènes WebGL2/WebGPU.

**The Localhost Emerald Rule.** L'Émeraude Technique (`#2ea043`) ne sert jamais d'accent générique de marque ; elle atteste uniquement qu'un service local répond sur `127.0.0.1`, que le filtrage réseau est actif ou que le pipeline matériel GPU est opérationnel.

## Typography

**Display Font:** Archivo (with system-ui, -apple-system, sans-serif fallback)
**Body Font:** Archivo (with system-ui, -apple-system, sans-serif fallback)
**Label/Mono Font:** Azeret Mono (with ui-monospace, SFMono-Regular, monospace fallback)

**Character:** L'association d'un grotesque technique nerveux (`Archivo` avec variantes OpenType `'cv02', 'cv03', 'cv04', 'cv11'`) et d'une chasse fixe d'ingénierie (`Azeret Mono`) donne à l'interface la lisibilité immédiate d'un cartouche de plan ISO et d'un analyseur de protocole.

### Hierarchy
- **Display** (`700`, `18px` / `1.125rem`, `line-height: 1.375`, `letter-spacing: -0.025em`): Titre principal en tête des surfaces internes (`my://start`, `my://apps`, `my://agent`, `my://privacy`, `my://3d-lab`).
- **Headline** (`700`, `14px` / `0.875rem`, `line-height: 1.4`): En-têtes de sections fonctionnelles (Registre des favoris, Passerelle API locale, Bibliothèque Userscripts, Tiroir d'édition).
- **Title** (`600`, `12px` / `0.75rem`, `line-height: 1.35`): Intitulés d'onglets, noms d'applications connectées et libellés de boutons d'action.
- **Body** (`400`, `12px` / `0.75rem`, `line-height: 1.5`, OpenType `'cv02', 'cv03', 'cv04', 'cv11'`): Descriptions opératoires et textes explicatifs limités à `68ch–70ch` pour préserver le confort de lecture.
- **Label** (`600`, `10px–11px`, `line-height: 1.25`, `tabular-nums` en `Azeret Mono`): Codes ISO (`ISO-01`), préfixes d'Omnibox (`SYS // MY://`, `PORT // LOCAL`, `TLS // HTTPS`), ports TCP (`:3000`, `:4577`), compteurs (`BLK:14`) et étiquettes de champs en capitales.

### Named Rules

**The Tabular Telemetry Rule.** Tout compteur, numéro de port, temps de latence (`2ms`), horodatage ou angle en radians doit être composé en `Azeret Mono` avec `font-variant-numeric: tabular-nums` (`.tabular-nums`) pour interdire tout décalage horizontal lors des rafraîchissements.

**The Bracketed Code Rule.** Les identifiants courts d'applications, de cadres et de scripts sont encadrés de crochets droits en `Azeret Mono` gras (`[A]`, `[B]`, `[3DS]`, `[USR-01]`) afin de structurer le balayage visuel sans recourir à des favicons disparates.

## Layout

L'application occupe un cadre plein écran verrouillé (`100vw × 100vh`, `overflow: hidden`) structuré en quatre zones solidaires séparées par des filets de `1px` :

1. **Barre de Cartouche ISO Supérieure (`44px` / `h-11`)** : regroupe à gauche la bascule du rail (`SPINE` / `ISO-RAIL`), l'historique et le timbre de partition active ; au centre l'Omnibox (`max-w-3xl`, hauteur `28px`) ; à droite les commandes `SPLIT A|B`, `A⇄B`, `BLK`, `AGENT // :4577` et `Sidebar`. Sa bordure inférieure intègre une graduation de règle technique tous les `24px` (`.iso-ruler-bg`).
2. **Rail Vertical d'Atelier (`240px` / `w-60` déplié, `48px` / `w-12` replié en Spine)** : divisé verticalement en trois compartiments (`ESPACES`, liste filtrable des `ONGLETS`, et dock `FAVORIS & PORTS`) conclus par un timbre de pied (`CHROMIUM` + `127.0.0.1:4577`). Le passage de `240px` à `48px` s'effectue via une transition exponentielle (`220ms cubic-bezier(0.16, 1, 0.3, 1)`). Sous le point de rupture `860px`, le rail bascule automatiquement en mode Spine compact de `48px`.
3. **Aire Centrale Multi-Vues (Simple ou Split-View `A | B`)** : affiche soit un cadre unique (`100%`), soit deux cadres côte à côte (`splitRatio`, `50% / 50%` par défaut) séparés par un filet vertical de `1px`. Chaque cadre débute par un cartouche d'en-tête de `36px` (`h-9`) strictement aligné sur la même ligne de base horizontale.
4. **Panneau Latéral Droit Persistant (`288px` / `w-72`)** : commutable entre trois outils (`APP`, `AGENT`, `SHIELD`) avec en-tête de `36px` aligné sur les cadres centraux. Masqué automatiquement sous `860px`.

À l'intérieur des pages internes (`my://start`, `my://apps`, `my://agent`, `my://privacy`, `my://3d-lab`), le rythme spatial utilise un retrait de conteneur de `14px` (`p-3.5`), un espacement vertical de `14px` (`space-y-3.5`) et des grilles de spécification à joint de `1px` (`bg-iso-line gap-px`). Les formulaires en ligne sont limités à `2` colonnes maximum (`grid-cols-1 sm:grid-cols-2`) pour garantir zéro troncature horizontale lorsque la vue est scindée en Split-View (`340px–456px` par cadre).

## Elevation & Depth

MyBrowser adopte une stratification strictement plane et architecturale (« Flat-by-Design »). La profondeur ne provient jamais d'ombres portées ou de flous d'arrière-plan, mais de l'emboîtement précis de trois plans mats séparés par des filets continus de `1px` :
- **Plan 0 — Fond de table (`#121519`)** : aire de travail, intérieur des champs, cellules de données et canevas 3D.
- **Plan 1 — Panneau d'atelier (`#1a1f26`)** : barres structurelles, rail latéral et conteneurs de cartouche.
- **Plan 2 — Contrôle surélevé (`#212730`)** : onglet actif, bouton secondaire d'action et commutateur engagé, cernés par un filet `#384252` ou `#ff5a26`.

### Named Rules

**The Structural Hairline Rule.** Toute séparation de zone, de cellule tabulaire ou de composant s'effectue par un filet franc de `1px solid #2a313c` (ou `gap-px` sur fond `#2a313c`). Les ombres décoratives et le glassmorphisme sont proscrits.

**The Dimmed Context Rule.** Lorsqu'un tiroir de configuration ou une création d'espace est actif, le rail et l'aire centrale abaissent leur opacité (`opacity-60` / `opacity-65`) et la passerelle Electron signale `overlayActive: true` aux `WebContentsView` natives.

## Shapes

Le langage formel obéit à l'orthogonalité d'un plan CAO ISO :
- **Rayon d'arrondi nul (`0px`)** : tous les boutons, champs, badges, onglets, barres de défilement et panneaux ont des angles droits à `90°`.
- **Contours de focus rentrants (`-1px`)** : l'état `:focus-visible` trace un cadre interne `outline: 1px solid #ff5a26` avec `outline-offset: -1px`, évitant tout débordement hors du filet de `1px`.
- **Graduation et repères CAO** : la barre supérieure porte une règle graduée de `4px` de haut au pas de `24px` (`rgba(56, 66, 82, 0.38)`), et le canevas 3D intègre une grille de `24px` ainsi que des équerres de calage de `12px` dans les angles (`#384252`).
- **Barres de défilement techniques (`6px`)** : piste `#121519` bordée d'un filet gauche de `1px` (`#2a313c`) et curseur rectangulaire `#384252` passant à `#ff5a26` au survol.

## Components

Chaque composant se comporte comme une pièce d'instrumentation : compacte, encadrée au pixel près et dépourvue d'ornement superflu.

### Buttons
- **Shape:** Angles droits stricts (`0px` radius), hauteur compacte de `28px` (`h-7`) dans les barres d'outils ou retrait interne `6px 12px` (`px-3 py-1.5`) dans les panneaux.
- **Primary:** Fond Vermillon Rotring (`#ff5a26`), texte Encre Contraste (`#0d1014`), police `Archivo` `12px` SemiBold (`600`), réservé à l'action majeure du cadre ayant le focus.
- **Hover / Focus:** Survol primaire en `#ff7142` ; survol des boutons techniques par bascule de la bordure de `#2a313c` vers `#ff5a26` ; focus clavier par filet interne de `1px` `#ff5a26`.
- **Secondary / Ghost / Tertiary:**
  - **Elevated Technical (`button-elevated`)** : fond `#212730`, bordure `1px solid #384252`, texte `#e6edf3` (`600`), utilisé pour `+ Onglet`, `+ App`, `Créer`, `Extraire`.
  - **Ghost Cartouche (`button-ghost`)** : fond `#121519` ou `#1a1f26`, bordure `1px solid #2a313c`, texte `#9ba9bb` passant à `#e6edf3` et bordure `#ff5a26` au survol.

### Chips
- **Style:** Rectangles orthogonaux sans arrondi (`0px`), typographie `Azeret Mono` `10px–11px` Bold (`700`), retrait `2px 6px`.
- **State:**
  - **Focus de cadre (`CADRE A // FOCUS`, `[A]`)** : fond plein `#ff5a26`, texte `#0d1014`.
  - **Cadre secondaire actif (`[B]`)** : fond plein `#2ea043`, texte `#0d1014` (ou `#ff5a26` lorsque le Cadre B détient le focus).
  - **Cadre en veille (`CADRE B // COMPARAISON`)** : fond `#1a1f26`, bordure `1px solid #2a313c`, texte `#9ba9bb`.

### Cards / Containers
- **Corner Style:** Orthogonal (`0px` radius).
- **Background:** Panneau d'atelier `#1a1f26` avec sous-cellules `#121519`.
- **Shadow Strategy:** Aucune ombre portée ; séparation par filets structurels de `1px`.
- **Border:** Filet continu `1px solid #2a313c` avec en-têtes internes soulignés par `border-b border-iso-line`.
- **Internal Padding:** `14px` (`p-3.5`) pour les blocs principaux, `10px` (`p-2.5`) pour les lignes d'applications et panneaux latéraux.

### Inputs / Fields
- **Style:** Fond `#121519`, bordure `1px solid #2a313c`, rayon `0px`, texte `#e6edf3`, invite `#8c9db0`. L'Omnibox centrale (`h-7` / `28px`) associe un préfixe de protocole à gauche (`SYS // MY://`, `PORT // LOCAL`, `TLS // HTTPS`), un champ `Azeret Mono` `12px` au centre et un déclencheur `+ App` à droite.
- **Focus:** La bordure du conteneur ou du champ passe immédiatement à `#ff5a26` (`focus-within:border-iso-accent` ou `:focus-visible`), avec curseur `#ff5a26`.
- **Inline Port Field:** Champ numérique compact (`w-20`, `px-1.5 py-0.5`, `Azeret Mono` `11px` `tabular-nums`) permettant de modifier le port TCP d'une application locale directement depuis la liste des favoris.

### Navigation
- **Top ISO Cartouche Bar (`44px`):** Barre horizontale fixe sur `#1a1f26` avec graduation `.iso-ruler-bg`, combinant bascule `SPINE` / `ISO-RAIL`, navigation historique groupée, badge de partition active, Omnibox et commutateurs de vues (`SPLIT A|B`, `A⇄B`, `BLK`, `AGENT // :4577`, `Sidebar`).
- **Vertical Drafting Rail & Technical Spine (`240px` ↔ `48px`):** En mode déplié (`240px`), affiche la grille à 3 colonnes des partitions `ISO-01..03`, les onglets verticaux filtrables avec actions rapides (`Split`, `Pin`, `Fermer`) et le dock des favoris/ports. En mode replié (`48px`), condense chaque espace, onglet (`T1 A`, `T2 B`) et application (`3DS` + pastille d'état `6px`) en une colonne de timbres carrés de `36px` de large (`w-9`).
- **Shared-Baseline Split-View Headers (`36px`):** Barres jumelles en tête du `CADRE A` et du `CADRE B`, garantissant un alignement horizontal parfait en mode écran scindé.

### Interactive 3D CAD Viewport (`IsoCadCanvas`)
- **Rôle & Comportement:** Composant signature attestant l'accélération matérielle WebGL2/WebGPU de Chromium (`my://start` en mode compact `192px` / `h-48` et `my://3d-lab` en mode plein cadre `320px` / `h-80`).
- **Structure Visuelle:** Fond `#121519` quadrillé au pas de `24px` (`rgba(42, 49, 60, 0.55)`), équerres de calage `#384252`, axes `X+ [127.0.0.1]` (`#ff5a26`), `Y+ [WEBGPU]` (`#2ea043`) et `Z+ [ISO-01]` (`#9ba9bb`), prisme extérieur `#e6edf3` et noyau double moteur `#ff5a26` reliés par des vecteurs de tension en pointillés, accompagnés d'un pied de contrôle `Azeret Mono` pour l'azimut et l'inclinaison en radians (`tabular-nums`).

## Do's and Don'ts

### Do:
- **Do** encadrer chaque zone, barre, cellule de télémétrie et carte par un filet continu de `1px solid #2a313c` avec un rayon d'arrondi de `0px`.
- **Do** réserver le Vermillon Rotring (`#ff5a26`) au seul cadre détenant le focus actif (`CADRE A` ou `CADRE B`), à l'espace de travail sélectionné et au déclencheur primaire du panneau focalisé.
- **Do** appliquer `Azeret Mono` avec `tabular-nums` sur tous les numéros de ports TCP (`:3000`, `:4577`), compteurs de blocage (`BLK:14`), latences et valeurs angulaires.
- **Do** maintenir l'alignement horizontal strict des cartouches d'en-tête de `36px` (`h-9`) entre le `CADRE A`, le `CADRE B` et le panneau latéral droit.
- **Do** limiter les formulaires internes à un maximum de `2` colonnes (`sm:grid-cols-2`) afin que chaque champ reste intégralement lisible en mode Split-View (`340px–456px` de large).

### Don't:
- **Don't** introduire de flou glassmorphique (`backdrop-filter`), de dégradés atmosphériques ou de teintes colorées dans les panneaux `#121519` / `#1a1f26` qui fausseraient la colorimétrie des vues 3D.
- **Don't** appliquer d'arrondis (`border-radius > 0`) sur les boutons, onglets, badges ou champs de saisie.
- **Don't** utiliser l'Émeraude Technique (`#2ea043`) comme couleur décorative en dehors des états réseau actifs (`127.0.0.1` en ligne, bouclier Adblock actif, pipeline WebGL2/WebGPU prêt).
- **Don't** imposer d'applications tierces verrouillées en dur : la liste des applications connectées doit toujours pouvoir être modifiée ou vidée en un clic (`Profil vierge`).
