---
name: MyBrowser
description: Navigateur web Chromium minimaliste inspiré d'Arc et Zen Browser, à double thème Clair/Sombre et cadre périphérique apaisé.
colors:
  indigo-accent-dark: "#6366f1"
  indigo-accent-hover-dark: "#818cf8"
  indigo-accent-soft-dark: "rgba(99, 102, 241, 0.15)"
  indigo-accent-light: "#4f46e5"
  indigo-accent-hover-light: "#4338ca"
  indigo-accent-soft-light: "rgba(79, 70, 229, 0.10)"
  emerald-success-dark: "#10b981"
  emerald-success-light: "#059669"
  coral-danger-dark: "#ef4444"
  coral-danger-light: "#dc2626"
  obsidian-shell-dark: "#141418"
  obsidian-viewport-dark: "#19191f"
  velvet-surface-dark: "#1e1e24"
  elevated-surface-dark: "#26262e"
  hover-surface-dark: "#2a2a34"
  hairline-border-dark: "rgba(255, 255, 255, 0.08)"
  alabaster-text-dark: "#f4f4f6"
  muted-slate-dark: "#9898a6"
  pearl-shell-light: "#eef0f5"
  daylight-surface-light: "#ffffff"
  alabaster-elevated-light: "#f7f8fb"
  hover-pearl-light: "#e3e6ee"
  hairline-border-light: "rgba(15, 23, 42, 0.09)"
  zinc-text-light: "#18181b"
  muted-slate-light: "#646775"
typography:
  display:
    fontFamily: "'Archivo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "'Archivo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  title:
    fontFamily: "'Archivo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.43
  body:
    fontFamily: "'Archivo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
    fontFeature: "'cv02', 'cv03', 'cv04', 'cv11'"
  label:
    fontFamily: "'Archivo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.35
    fontFeature: "'tnum'"
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  header-bar: "44px"
  sidebar-left: "224px"
components:
  button-primary:
    backgroundColor: "{colors.indigo-accent-dark}"
    textColor: "{colors.daylight-surface-light}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0px 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.indigo-accent-hover-dark}"
  button-surface:
    backgroundColor: "{colors.velvet-surface-dark}"
    textColor: "{colors.alabaster-text-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0px 12px"
    height: "36px"
  button-icon-ghost:
    backgroundColor: "{colors.obsidian-shell-dark}"
    textColor: "{colors.muted-slate-dark}"
    rounded: "{rounded.lg}"
    size: "32px"
  input-omnibox:
    backgroundColor: "{colors.velvet-surface-dark}"
    textColor: "{colors.alabaster-text-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0px 12px"
    height: "32px"
  card-surface:
    backgroundColor: "{colors.velvet-surface-dark}"
    textColor: "{colors.alabaster-text-dark}"
    rounded: "{rounded.2xl}"
    padding: "14px"
---

# Design System: MyBrowser

## Overview

**Creative North Star: "Le Cadre Apaisé Arc & Zen"**

MyBrowser adopte l'architecture minimaliste, douce et silencieuse des navigateurs contemporains **Arc Browser** et **Zen Browser**. Plus de 95 % de la fenêtre appartient à la page web ou à l'application favorite de l'utilisateur (telle que `MySpot`), logée dans un cadre périphérique aux coins subtilement arrondis (`12px` / `rounded-xl`) qui détache délicatement le contenu de la coque du navigateur.

Le système bannit toute surcharge textuelle, tout jargon technique d'ingénierie, les bordures carrées agressives et les panneaux latéraux imposés d'office. Chaque contrôle se limite à une icône limpide ou à un libellé de 1 à 3 mots. Une bascule instantanée entre le **Mode Sombre** (anthracite velouté `#141418`) et le **Mode Clair** (perle lumineux `#eef0f5`) adapte l'ensemble des surfaces via des variables CSS sémantiques (`--ui-*`) pilotées par l'attribut `data-theme` sur `<html>`.

**Key Characteristics:**
- Architecture **Arc / Zen** à cadre périphérique de `6px` (`px-1.5 pb-1.5`) entourant une vue web arrondie (`12px` / `rounded-xl`).
- Double palette native **Sombre** (`data-theme="dark"`) et **Clair** (`data-theme="light"`) commutable en un clic depuis la barre supérieure ou les réglages.
- Barre latérale gauche escamotable de `224px` (`w-56`) regroupant le sélecteur d'espaces, la grille de favoris rapides, le bouton `+ Nouvel onglet` et la liste verticale épurée des onglets.
- Sobriété textuelle stricte : zéro paragraphe explicatif, zéro jargon protocole ou télémétrie intrusive, libellés courts (1 à 3 mots) et URL d'ouverture par défaut personnalisable.
- Un unique accent **Indigo Doux** (`#6366f1` en sombre, `#4f46e5` en clair) réservé aux actions primaires, à l'espace actif et au focus clavier.

## Colors

La palette repose sur deux harmonies atmosphériques douces (Obsidienne Veloutée en mode Sombre, Perle Lumineuse en mode Clair) réconciliées sous des jetons CSS sémantiques (`--ui-shell`, `--ui-surface`, `--ui-elevated`, `--ui-hover`, `--ui-border`, `--ui-text`, `--ui-muted`, `--ui-accent`). Là où le contrat directionnel initial mentionnait des gris zinc génériques (`#18181b` / `#27272a` / `#f4f4f5`), l'implémentation finale les a affinés avec une légère teinte ardoise-indigo (`#141418` / `#1e1e24` en sombre ; `#eef0f5` / `#ffffff` en clair) qui adoucit le contraste autour du viewport web.

### Primary
- **Indigo Doux — Mode Sombre** (`#6366f1` / `--ui-accent`): Couleur d'action primaire utilisée pour l'espace de travail actif, les boutons de validation (`Enregistrer`, `Aller`, `Ajouter`, `Chrome Web Store`), les pilules d'état actif du bouclier, le cadre Split-View focalisé et le contour `:focus-visible`.
- **Indigo Lumineux Survol — Mode Sombre** (`#818cf8` / `--ui-accent-hover`): État de survol des boutons primaires en thème sombre.
- **Halo Indigo Translucide — Mode Sombre** (`rgba(99, 102, 241, 0.15)` / `--ui-accent-soft`): Fond doux des monogrammes de favoris et d'extensions en thème sombre.
- **Indigo Profond — Mode Clair** (`#4f46e5` / `--ui-accent`): Accent primaire calibré pour garantir un contraste optimal sur les surfaces blanches du thème clair.
- **Indigo Pressé Survol — Mode Clair** (`#4338ca` / `--ui-accent-hover`): État de survol des boutons primaires en thème clair.
- **Halo Indigo Translucide — Mode Clair** (`rgba(79, 70, 229, 0.10)` / `--ui-accent-soft`): Fond doux des monogrammes de favoris et d'extensions en thème clair.

### Secondary
- **Émeraude Calme — Mode Sombre** (`#10b981` / `--ui-success`) & **Mode Clair** (`#059669` / `--ui-success`): Jeton sémantique de confirmation positive disponible au niveau racine.

### Tertiary
- **Corail de Révocation — Mode Sombre** (`#ef4444` / `--ui-danger`) & **Mode Clair** (`#dc2626` / `--ui-danger`): Signal de suppression au survol des actions destructives (corbeille d'extension ou de favori).

### Neutral
- **Coque Périphérique — Sombre** (`#141418`) / **Clair** (`#eef0f5` — `--ui-shell`): Arrière-plan global de la fenêtre encadrant la barre supérieure, la barre latérale gauche et le contour extérieur du viewport web.
- **Toile du Viewport Web — Sombre** (`#19191f`) / **Clair** (`#ffffff` — `--ui-viewport`): Fond du conteneur central accueillant la page web ou les surfaces internes (`my://start`, `my://apps`, `my://extensions`, `my://privacy`).
- **Surface de Carte & Contrôle — Sombre** (`#1e1e24`) / **Clair** (`#ffffff` — `--ui-surface`): Surface de la barre d'adresse Omnibox, de l'onglet actif, des tuiles de favoris, des cartes de réglages et des fenêtres modales.
- **Surface Surélevée de Champ — Sombre** (`#26262e`) / **Clair** (`#f7f8fb` — `--ui-elevated`): Intérieur des champs de saisie dans les modales, sélecteurs segmentés et boutons secondaires.
- **Surface de Survol — Sombre** (`#2a2a34`) / **Clair** (`#e3e6ee` — `--ui-hover`): État de survol doux des icônes de barre d'outils, des onglets inactifs et des lignes de liste.
- **Filet Translucide — Sombre** (`rgba(255, 255, 255, 0.08)`) / **Clair** (`rgba(15, 23, 42, 0.09)` — `--ui-border`): Bordure subtile de `1px` délimitant le cadre web, l'Omnibox, les cartes et les séparateurs de liste sans jamais durcir le dessin.
- **Encre Principale — Sombre** (`#f4f4f6`) / **Clair** (`#18181b` — `--ui-text`): Texte primaire des titres, onglets actifs et saisies.
- **Encre Secondaire Apaisée — Sombre** (`#9898a6`) / **Clair** (`#646775` — `--ui-muted`): Icônes au repos, onglets inactifs, sous-titres d'URL et textes d'invite (`::placeholder` avec opacité `0.85`).

### Named Rules

**The Dual-Theme Parity Rule.** Chaque composant utilise exclusivement les variables sémantiques `ui-*` (`var(--ui-shell)`, `var(--ui-surface)`, `var(--ui-border)`, `var(--ui-text)`, `var(--ui-muted)`, `var(--ui-accent)`). Aucune couleur neutre en dur ne doit briser la bascule instantanée entre `data-theme="dark"` et `data-theme="light"`.

**The Single Quiet Accent Rule.** L'Indigo (`#6366f1` / `#4f46e5`) est le seul accent chromatique de l'interface. Il est réservé aux boutons d'action primaires, au commutateur d'espace actif, à l'indicateur d'outil ouvert et à la bordure du cadre actif en mode Split-View.

**The Translucent Border Rule.** Les séparations de surfaces utilisent uniquement `--ui-border` (`8 %` de blanc en mode Sombre, `9 %` d'ardoise en mode Clair) afin que le cadre s'efface visuellement devant le contenu web.

## Typography

**Display Font:** Archivo (with system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif fallback)
**Body Font:** Archivo (with system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif fallback)
**Label/Mono Font:** Archivo (with tabular numerals `font-variant-numeric: tabular-nums`; `Azeret Mono` disponible en réserve)

**Character:** Une typographie sans-serif unique, fluide et humaniste (`Archivo` lissée par `-webkit-font-smoothing: antialiased` avec variantes OpenType `'cv02', 'cv03', 'cv04', 'cv11'`), privilégiant des graisses moyennes (`500`) et semi-grasses (`600`) sans jamais recourir aux majuscules techniques ni aux blocs de texte denses.

### Hierarchy
- **Display** (`600`, `20px` / `1.25rem`, `line-height: 1.4`, `letter-spacing: -0.025em`): Titre court en tête des pages internes (`Extensions`, `Favoris`, `Confidentialité`).
- **Headline** (`600`, `16px` / `1rem`, `line-height: 1.5`): En-tête des fenêtres modales (`Réglages`, `Nouveau favori`, `Modifier le favori`) et titre de carte d'ouverture externe.
- **Title** (`500`, `14px` / `0.875rem`, `line-height: 1.43`): Intitulés des lignes de paramètres, noms d'extensions ou de favoris, et champ de recherche principal sur `my://start`.
- **Body** (`500` / `400`, `12px` / `0.75rem`, `line-height: 1.5`, OpenType `'cv02', 'cv03', 'cv04', 'cv11'`): Titres d'onglets dans la barre latérale, barre d'adresse Omnibox, libellés de boutons et champs de saisie secondaires.
- **Label** (`500`, `11px`, `line-height: 1.35`, `tabular-nums`): Sélecteur d'espaces (`Perso`, `Pro`, `Lab`), pastille de version/mise à jour au pied de la barre latérale et monogrammes d'applications.

### Named Rules

**The Zero-Bloat Copy Rule.** Les écrans n'affichent jamais de paragraphes d'explication ni de sous-titres descriptifs redondants. Les boutons et contrôles se limitent à 1 à 3 mots (`Nouvel onglet`, `Aller`, `Définir`, `Favori`, `Clair`, `Sombre`).

**The Natural Case Rule.** Toute la signalétique et la navigation s'écrivent en casse naturelle de phrase (« Nouvel onglet », « Confidentialité », « Adresse Web (URL) ») ; les intitulés tout en capitales et les préfixes techniques codés sont proscrits.

## Layout

L'interface s'organise autour d'un cadre plein écran sans défilement global (`100vw × 100vh`, `overflow: hidden`) conçu pour maximiser la surface utile de la page web :

1. **Barre de Navigation Supérieure (`44px` / `h-11`, `px-2.5`)** :
   - **Gauche** : 5 boutons d'icône carrés aux coins adoucis (`32px × 32px` / `w-8 h-8 rounded-lg`) pour afficher/masquer la barre latérale (`PanelLeft`), reculer (`ArrowLeft`), avancer (`ArrowRight`), actualiser (`RotateCw`) et revenir à l'URL d'accueil (`Home`).
   - **Centre** : Barre d'adresse Omnibox centrée (`max-w-xl`, hauteur `32px` / `h-8`, `rounded-xl`) précédée d'une seule icône d'état (`Lock` ou `Globe`).
   - **Droite** : Pastille de mise à jour (si disponible), badges d'extensions installées, et 5 boutons d'action (`32px × 32px`) : Extensions (`Puzzle`), Écran scindé (`Columns`), Bouclier (`Shield`), bascule Clair/Sombre (`Sun`/`Moon`) et Réglages (`SlidersHorizontal`).
2. **Corps Principal Encadré (`px-1.5 pb-1.5 gap-1.5`)** : ménage une marge périphérique de `6px` en bas et sur les côtés afin que le viewport web flotte dans la coque `--ui-shell`.
3. **Barre Latérale Gauche Escamotable (`224px` / `w-56`)** : lorsqu'elle est dépliée (`!state.spineCollapsed`), elle présente verticalement avec un rythme de `12px` (`space-y-3`) :
   - Le commutateur segmenté des espaces de travail (`grid-cols-3 gap-1 p-1 rounded-xl`).
   - La grille compacte des favoris épinglés (`grid-cols-4 gap-1.5`, tuiles de `36px` / `h-9 rounded-xl`).
   - Le bouton pleine largeur `+ Nouvel onglet` (`h-9 px-3 rounded-xl`).
   - La liste verticale défilante des onglets (`space-y-1`, lignes de `36px` / `h-9 px-2.5 rounded-xl`).
   - Le pied de barre discret (`pt-2 border-t`) affichant la version courante (`v1.x · À jour`) et les raccourcis `Favoris` et `Réglages`.
   Lorsqu'elle est repliée, la barre latérale disparaît complètement (`0px`), offrant 100 % de la largeur au cadre web.
4. **Viewport Web Central (`flex-1`)** : vue unique par défaut (`100 %` de l'espace central) encadrée dans un conteneur `rounded-xl overflow-hidden bg-ui-viewport border border-ui-border shadow-sm`. En mode Split-View optionnel, deux cadres `rounded-xl` côte à côte partagent l'espace avec un écart de `6px` (`gap-1.5`) et une fine barre de titre de `28px` (`h-7`).
5. **Pages Internes Centrées** :
   - `my://start` : colonne unique centrée verticalement et horizontalement (`max-w-xl`, `space-y-8`, `px-6 py-12`) regroupant la barre de recherche (`h-12 rounded-2xl`), la rangée de favoris rapides et la carte de configuration de l'URL d'ouverture par défaut.
   - `my://extensions`, `my://apps`, `my://privacy` : colonne centrée (`max-w-2xl mx-auto space-y-6`, `px-6 py-10`).

## Elevation & Depth

La profondeur repose sur l'encadrement tonal entre la coque périphérique (`--ui-shell`), la toile du viewport (`--ui-viewport`) et les cartes de contrôle (`--ui-surface`), complété par des ombres portées ultra-légères :

### Shadow Vocabulary
- **Subtle Surface Lift** (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)` / `shadow-sm`): Appliqué au cadre du viewport web, à la barre d'adresse Omnibox, à l'onglet actif, aux tuiles de favoris et aux cartes de `my://start`.
- **Modal Dialog Float** (`box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)` / `shadow-xl`): Réservé aux fenêtres modales centrées (`Réglages` et `Nouveau favori`) sur fond assombri `rgba(0, 0, 0, 0.5)` (`bg-black/50`).

### Named Rules

**The Framed Viewport Rule.** Le contenu web ne touche jamais les bords extérieurs de la fenêtre : il est toujours logé dans un conteneur `rounded-xl` (`12px`) séparé des bords par `6px` de coque `--ui-shell` et ceint d'un filet `--ui-border` avec `shadow-sm`.

**The Overlay Sync Rule.** Dès qu'une fenêtre modale (`Réglages` ou `Favori`) est ouverte, `overlayActive` passe à `true` auprès du processus principal Electron afin que les `WebContentsView` natives cèdent proprement le premier plan aux dialogues React.

## Shapes

Le système utilise une géométrie douce à rayons concentriques :
- **Conteneurs majeurs & Modales (`16px` / `rounded-2xl`)** : grande barre de recherche de `my://start` (`h-12`), carte de l'URL par défaut et boîtes de dialogue modales (`max-w-md`).
- **Cadre Web, Omnibox, Onglets & Cartes (`12px` / `rounded-xl`)** : rayon signature appliqué au cadre du viewport web, à la barre d'adresse centrale (`h-8`), aux onglets verticaux (`h-9`), aux tuiles de favoris (`h-9` / `h-10`), aux listes groupées et aux champs de formulaire.
- **Boutons d'icône & Segments (`8px` / `rounded-lg`)** : boutons d'outils de la barre supérieure (`32px × 32px`), segments d'espaces de travail (`h-7`) et boutons d'action secondaires.
- **Micro-badges & Fermeture (`6px` / `rounded-md`)** : bouton de fermeture d'onglet au survol (`20px × 20px` / `w-5 h-5`) et vignette monogramme (`w-5 h-5`).
- **Pilules d'état & Défilement (`9999px` / `rounded-full`)** : commutateurs `Actif` / `Inactif` de la page Confidentialité, compteur de traqueurs bloqués et curseurs de barres de défilement (`6px` de large).

## Components

Chaque composant privilégie la douceur tactile, la concision visuelle et la réactivité (`transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1)` via `.ui-transition`).

### Buttons
- **Shape:** Coins adoucis de `12px` (`rounded-xl`) pour les actions de formulaire et de barre latérale (`h-9` / `36px`), ou `8px` (`rounded-lg`) pour les boutons compacts (`h-7` / `28px`, `h-8` / `32px`).
- **Primary:** Fond `--ui-accent` (`#6366f1` sombre / `#4f46e5` clair), texte blanc `#ffffff`, police `Archivo` `12px` Medium (`500`), utilisé pour `Enregistrer`, `Définir`, `Aller`, `Ajouter` et `Chrome Web Store`.
- **Hover / Focus:** Survol primaire vers `--ui-accent-hover` (`#818cf8` sombre / `#4338ca` clair) ; contour clavier `:focus-visible` de `2px solid var(--ui-accent)` avec `outline-offset: 1px`.
- **Secondary / Ghost / Icon:**
  - **Surface Action (`button-surface`)** : fond `--ui-surface`, bordure `1px solid var(--ui-border)`, ombre `shadow-sm`, texte `--ui-text`, survol `--ui-hover` (ex. `+ Nouvel onglet`, `Dossier local`, `Installer`).
  - **Toolbar Icon Ghost (`button-icon-ghost`)** : carré `32px × 32px` (`w-8 h-8 rounded-lg`), icône `16px` en `--ui-muted` passant à `--ui-text` sur fond `--ui-hover` au survol, ou `bg-ui-surface text-ui-accent shadow-sm` lorsque la vue correspondante est active.

### Chips
- **Style:** Pilules `rounded-full` (`h-7 px-3`) ou badges compacts `rounded-lg` (`h-7 px-2`) en `12px` Medium (`500`).
- **State:**
  - **Privacy Toggle Pill** : fond `--ui-accent` et texte `#ffffff` à l'état `Actif` ; fond `--ui-elevated`, bordure `--ui-border` et texte `--ui-muted` à l'état `Inactif`.
  - **Extension Badge** : fond `--ui-surface`, bordure `--ui-border`, pastille ronde `6px` (`w-1.5 h-1.5 rounded-full bg-ui-accent`) suivie du code court de l'extension.

### Cards / Containers
- **Corner Style:** `16px` (`rounded-2xl`) pour les cartes d'accueil et modales ; `12px` (`rounded-xl`) pour les listes groupées (`divide-y divide-ui-border`).
- **Background:** `--ui-surface` (`#1e1e24` sombre / `#ffffff` clair).
- **Shadow Strategy:** `shadow-sm` sur les cartes de surface ; `shadow-xl` sur les modales.
- **Border:** `1px solid var(--ui-border)`.
- **Internal Padding:** `14px` (`p-3.5`) pour la carte d'URL par défaut, `16px × 12px` (`px-4 py-3`) pour les lignes de liste, `20px` (`p-5`) pour les modales.

### Inputs / Fields
- **Style:**
  - **Top Omnibox (`input-omnibox`)** : hauteur `32px` (`h-8`), `rounded-xl`, fond `--ui-surface`, bordure `1px solid var(--ui-border)`, icône `14px` (`Lock` ou `Globe`) à gauche, texte `12px` `--ui-text` avec sélection automatique au focus.
  - **Start Search Bar** : hauteur `48px` (`h-12`), `rounded-2xl`, fond `--ui-surface`, icône `Search` à gauche et bouton `Aller` (`h-8 rounded-xl bg-ui-accent`) intégré à droite.
  - **Modal & Card Inputs** : hauteur `36px` (`h-9`) ou `40px` (`h-10`), `rounded-xl`, fond `--ui-elevated`, bordure `--ui-border`.
- **Focus:** La bordure passe à `--ui-accent` (`focus:border-ui-accent` ou `focus-within:border-ui-accent`) avec curseur `--ui-accent`.

### Navigation
- **Collapsible Arc/Zen Sidebar (`224px`):** Regroupe le sélecteur segmenté à 3 espaces (`h-7 rounded-lg`, espace actif en `bg-ui-accent text-white`), 3 tuiles de favoris + 1 bouton `+` en grille `grid-cols-4`, le déclencheur `+ Nouvel onglet`, et la liste verticale des onglets (`h-9 px-2.5 rounded-xl`, onglet actif sur `bg-ui-surface border border-ui-border shadow-sm`, bouton de fermeture `X` révélé uniquement au survol `opacity-0 group-hover:opacity-100`).
- **Top Minimalist Bar (`44px`):** Regroupe les contrôles de navigation à gauche, l'Omnibox au centre et les 5 icônes d'outils à droite (dont la bascule directe Clair/Sombre et l'ouverture de la modale `Réglages`).

### Custom Default New Tab Card (`my://start` & Modal `Réglages`)
- **Rôle & Comportement:** Composant signature permettant de définir en un clic l'URL ouverte automatiquement à chaque nouvel onglet (ex. `https://myspot.app` ou un serveur local `http://127.0.0.1:3000`).
- **Structure Visuelle:** Carte `rounded-2xl bg-ui-surface border border-ui-border p-3.5 shadow-sm` réunissant un en-tête concis avec icône `Globe` en `--ui-accent` (et bouton `Par défaut` si une URL personnalisée est active), un champ `h-9 rounded-xl bg-ui-elevated`, un bouton primaire `Définir` (affichant `Enregistré` avec coche pendant `1800ms`) et un bouton rapide `Ouvrir`.

## Do's and Don'ts

### Do:
- **Do** utiliser systématiquement les jetons sémantiques `ui-*` (`bg-ui-shell`, `bg-ui-surface`, `bg-ui-elevated`, `border-ui-border`, `text-ui-text`, `text-ui-muted`, `bg-ui-accent`) pour préserver l'intégrité des thèmes Clair et Sombre.
- **Do** maintenir le cadre périphérique de `6px` (`px-1.5 pb-1.5 gap-1.5`) et le rayon `rounded-xl` (`12px`) autour du viewport web afin de conserver la signature visuelle Arc / Zen.
- **Do** rédiger tous les libellés d'interface en français ultra-concis (1 à 3 mots maximum par bouton ou contrôle) sans paragraphe explicatif.
- **Do** laisser le navigateur s'ouvrir en vue simple par défaut (95 % de la surface dédiée au web), le mode Split-View et les modales n'apparaissant qu'à la demande explicite de l'utilisateur.

### Don't:
- **Don't** réintroduire d'angles droits (`0px`), de bordures opaques criardes, de règles graduées ou de jargon technique d'atelier dans l'interface.
- **Don't** surcharger les écrans internes ou les modales avec des sous-titres descriptifs, des blocs d'aide ou des compteurs de télémétrie permanente dans la barre supérieure.
- **Don't** utiliser les anciens alias `iso-*` ou le composant orphelin `IsoCadCanvas.tsx` sur de nouvelles surfaces.
- **Don't** imposer d'application tierce verrouillée : l'URL de nouvel onglet et les favoris restent toujours librement personnalisables ou réinitialisables par l'utilisateur.
