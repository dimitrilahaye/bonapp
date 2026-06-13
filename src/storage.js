/**
 * @module storage
 * @description Couche de persistance localStorage pour BonApp.
 *              Toutes les lectures/écritures passent par ce module.
 */

/** @type {string} Clé de stockage principale */
const KEY = 'bonapp_menus'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * @typedef {'midi'|'soir'} MealTime
 * Moment du repas dans la journée.
 */

/**
 * @typedef {Object} Meal
 * @property {string} recipe - Nom de la recette
 */

/**
 * @typedef {Object} DayMenu
 * @property {string}    date  - Date ISO YYYY-MM-DD
 * @property {Meal|null} midi  - Repas du midi (null si non renseigné)
 * @property {Meal|null} soir  - Repas du soir (null si non renseigné)
 */

/**
 * @typedef {Object} WeekMenu
 * @property {string}    id        - Identifiant unique (UUID)
 * @property {string}    startDate - Lundi de la semaine (ISO)
 * @property {string}    endDate   - Dimanche de la semaine (ISO)
 * @property {DayMenu[]} days      - 7 jours du lundi au dimanche
 * @property {number}    savedAt   - Timestamp de la dernière sauvegarde
 */

// ─── Lectures ─────────────────────────────────────────────────────────────────

/**
 * Retourne tous les menus sauvegardés, du plus récent au plus ancien.
 * @returns {WeekMenu[]}
 */
export function getAllMenus () {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return all.sort((a, b) => b.startDate.localeCompare(a.startDate))
  } catch {
    return []
  }
}

/**
 * Retourne un menu par son identifiant.
 * @param {string} id
 * @returns {WeekMenu|null}
 */
export function getMenuById (id) {
  return getAllMenus().find(m => m.id === id) ?? null
}

/**
 * Retourne le menu d'une semaine donnée (par date de début).
 * @param {string} startDate - Lundi de la semaine au format ISO
 * @returns {WeekMenu|null}
 */
export function getMenuByStartDate (startDate) {
  return getAllMenus().find(m => m.startDate === startDate) ?? null
}

/**
 * Retourne tous les noms de recettes déjà utilisés, dédupliqués et triés.
 * Utilisé pour l'autocomplétion.
 * @returns {string[]}
 */
export function getAllRecipeNames () {
  const names = new Set()
  for (const menu of getAllMenus()) {
    for (const day of menu.days) {
      if (day.midi?.recipe) names.add(day.midi.recipe)
      if (day.soir?.recipe) names.add(day.soir.recipe)
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'fr'))
}

/**
 * Compte le nombre de repas renseignés dans un menu.
 * @param {WeekMenu} menu
 * @returns {number}
 */
export function countMeals (menu) {
  return menu.days.reduce((n, d) => n + (d.midi ? 1 : 0) + (d.soir ? 1 : 0), 0)
}

// ─── Écritures ────────────────────────────────────────────────────────────────

/**
 * Sauvegarde ou met à jour un menu.
 * Si un menu avec le même id existe déjà, il est remplacé.
 * @param {WeekMenu} menu
 */
export function saveMenu (menu) {
  const all = getAllMenus()
  const idx = all.findIndex(m => m.id === menu.id)
  if (idx >= 0) {
    all[idx] = menu
  } else {
    all.unshift(menu)
  }
  localStorage.setItem(KEY, JSON.stringify(all))
}

/**
 * Supprime un ou plusieurs menus par leur identifiant.
 * @param {string[]} ids - Liste des identifiants à supprimer
 */
export function deleteMenus (ids) {
  const filtered = getAllMenus().filter(m => !ids.includes(m.id))
  localStorage.setItem(KEY, JSON.stringify(filtered))
}
