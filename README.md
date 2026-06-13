# 🍽️ BonApp

PWA de planification de menus hebdomadaires — vanilla JS, Vite, stockage local.

## Démarrage rapide

```bash
npm install
npm run dev
```

## Déploiement sur GitHub Pages

### 1. Cloner / pousser sur GitHub

Crée un dépôt nommé `bonapp` (ou le nom de ton choix) et pousse ce code dessus.

### 2. Adapter le nom du dépôt

Dans `vite.config.js`, change la valeur de `REPO_NAME` pour qu'elle corresponde
au nom exact de ton dépôt GitHub :

```js
const REPO_NAME = 'bonapp'   // ← ton nom de dépôt ici
```

### 3. Activer GitHub Pages

Dans les **Settings** du dépôt → **Pages** → Source : **GitHub Actions**.

### 4. Pousser sur `main`

Le workflow `.github/workflows/deploy.yml` déclenche automatiquement le build
et le déploiement à chaque push sur `main`.

L'app sera disponible à `https://<ton-username>.github.io/<REPO_NAME>/`.

## Fonctionnalités

- **Planification** : calendrier lun–dim avec créneaux midi/soir, navigation entre semaines
- **Autocomplétion** : les recettes déjà utilisées sont suggérées à la saisie
- **PDF** : bouton "Partager en PDF" → dialogue d'impression du navigateur → enregistrer / partager
- **Historique** : liste des menus passés avec suppression par lot

## Stack

| Outil | Rôle |
|---|---|
| [Vite](https://vitejs.dev) | Bundler et serveur de dev |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | Manifest + Service Worker |
| localStorage | Persistance des données |
| `window.print()` | Génération PDF côté navigateur |
