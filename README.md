# 🍽️ BonApp

PWA de planification de menus — créez vos menus sur n'importe quel range de dates, renseignez vos repas du midi et du soir, partagez en PDF.

## Fonctionnalités

- **Création libre** : choisissez n'importe quelle plage de dates, de 2 jours à plusieurs semaines
- **Saisie rapide** : autocomplétion à partir des recettes déjà utilisées
- **Drag & drop** : déplacez ou échangez des repas entre créneaux
- **Historique** : tous vos menus classés du plus récent au plus ancien
- **PDF** : impression/partage via le dialogue natif du navigateur
- **Offline** : fonctionne sans connexion (PWA)
- **Données locales** : tout reste dans le navigateur, aucun compte requis

## Stack

| Outil | Rôle |
|---|---|
| [Vite](https://vitejs.dev) | Bundler et serveur de dev |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | Manifest + Service Worker |
| localStorage | Persistance des données |
| `window.print()` | Génération PDF côté navigateur |

## Développement

```bash
npm install
npm run dev
```
