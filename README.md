# KanbanFlow - Frontend Client

Une interface de gestion de projet Kanban moderne, épurée et hautement interactive, conçue avec React 19 et propulsée par Vite.

---

## ✨ Fonctionnalités clés

1. **🔒 Authentification Sécurisée & Pages d'accès** :
   - Pages de Connexion (`/login`) et d'Inscription (`/register`) avec formulaires interactifs sécurisés.
   - Validation dynamique des saisies en temps réel.
   - Gestion de session utilisateur persistante via `localStorage` (avec `AuthContext`).
   - Protection de routes : redirection automatique des utilisateurs non authentifiés vers `/login`, et protection des pages publiques pour les utilisateurs déjà connectés.

2. **📊 Tableau de Bord Interactif (`/dashboard` & `/`)** :
   - Récupération dynamique et asynchrone des tableaux de l'utilisateur depuis l'API.
   - Formulaire de création de tableau instantané intégré directement au design de la grille.
   - Squelettes de chargement (skeletons animés) pour des transitions d'affichage fluides.

3. **📋 Tableau Kanban Dynamique (`/boards/:boardId`)** :
   - Récupération automatisée des colonnes du tableau et chargement asynchrone et parallélisé de toutes leurs tâches.
   - Création instantanée de colonnes et de tâches (titre & description facultative) via des formulaires Trello-like.
   - Suppression sécurisée de colonnes (avec cascade automatique gérée côté backend pour nettoyer toutes les tâches associées).

4. **🔄 Glisser-Déposer (Drag & Drop) Premium** :
   - Déplacement fluide des tâches au sein de la même colonne ou entre différentes colonnes à l'aide de `@dnd-kit`.
   - Mouvements visuels en temps réel avec évitement de distorsion d'échelle et lag supprimé grâce à une gestion optimisée des transitions CSS.
   - Persistance automatique en arrière-plan du nouvel agencement via l'API `PATCH`.
   - Contrainte d'activation de drag de 8px pour préserver les clics et la sélection sur les formulaires ou boutons.

5. **🎨 Design System moderne (Glassmorphism)** :
   - Entièrement configuré sous **Tailwind CSS v4**.
   - Typographie premium avec la police **Plus Jakarta Sans** (Google Fonts).
   - Style sombre épuré (`bg-slate-950`) doté de halos de lumière animés en arrière-plan pour un effet de profondeur.
   - Classes utilitaires partagées réutilisables (`.glass-panel` et `.glass-input`).
   - Barre de défilement stylisée et épurée.

---

## 🛠️ Stack Technique

* **Framework** : React 19
* **Outil de Build** : Vite
* **Style** : Tailwind CSS v4 & Vanilla CSS
* **Routage** : React Router Dom v7
* **Gestion d'API** : Axios
* **Icônes** : Lucide React
* **Gestion du Drag & Drop** : `@dnd-kit/core`, `@dnd-kit/sortable` et `@dnd-kit/utilities`

---

## ⚙️ Installation et Lancement

### 1. Prérequis
Le serveur **backend** de l'application doit être démarré (généralement sur `http://localhost:4000`).
Le dépôt de code source de la partie backend est disponible sur GitHub : `git@github.com:DimitriBoss/kanban_backend.git`.

### 2. Cloner et installer les dépendances
Exécutez la commande suivante à la racine du dossier `frontend` :
```bash
npm install
```

### 3. Configurer l'API
Si nécessaire, ajustez l'adresse du serveur backend dans le fichier de configuration d'API :
[api.js](file:///d:/Fortune/kanban/frontend/src/services/api.js) (par défaut défini sur `http://localhost:4000`).

### 4. Lancer en mode Développement
Démarrez le serveur de développement local :
```bash
npm run dev
```
Ouvrez ensuite l'adresse affichée dans votre terminal (par défaut `http://localhost:5173`).

### 5. Compiler pour la Production
Pour générer les fichiers de production optimisés dans le dossier `dist/` :
```bash
npm run build
```
