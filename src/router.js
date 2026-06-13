/**
 * @module router
 * @description Routeur léger basé sur le hash de l'URL.
 *              Les routes sont déclarées avec `route()` et le routeur
 *              résout la route courante à chaque changement de hash.
 */

/**
 * @typedef {Object} Route
 * @property {RegExp}                  pattern - Expression régulière de correspondance
 * @property {function(Object): void}  handler - Gestionnaire appelé avec les paramètres extraits
 */

/** @type {Route[]} */
const routes = []

// ─── API publique ──────────────────────────────────────────────────────────────

/**
 * Déclare une route.
 * Les paramètres dynamiques sont notés `:nom` et disponibles dans `handler`.
 *
 * @example
 * route('/menu/:id', ({ id }) => renderDetail(id))
 *
 * @param {string}                    path    - Chemin de la route (ex: '/calendar', '/menu/:id')
 * @param {function(Object): void}    handler - Fonction appelée lors de la correspondance
 */
export function route (path, handler) {
  const pattern = new RegExp(
    '^' + path.replace(/:([^/]+)/g, '(?<$1>[^/]+)') + '$'
  )
  routes.push({ pattern, handler })
}

/**
 * Navigue vers un chemin en mettant à jour le hash de l'URL.
 * @param {string} path - Chemin cible (ex: '/history')
 */
export function navigate (path) {
  window.location.hash = path
}

/**
 * Initialise le routeur sur l'élément racine fourni.
 * Écoute les changements de hash et résout la route immédiatement.
 */
export function initRouter () {
  window.addEventListener('hashchange', resolve)
  resolve()
}

// ─── Résolution interne ────────────────────────────────────────────────────────

/**
 * Résout la route correspondant au hash courant.
 * Redirige vers /calendar si aucune route ne correspond.
 * @private
 */
function resolve () {
  const hash = window.location.hash.slice(1) || '/calendar'
  for (const { pattern, handler } of routes) {
    const match = hash.match(pattern)
    if (match) {
      handler(match.groups ?? {})
      return
    }
  }
  navigate('/calendar')
}
