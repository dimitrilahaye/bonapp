import { deleteMenus } from '../storage.js'
import { navigate } from '../router.js'

const PDF_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="12" y1="18" x2="12" y2="12"/>
  <line x1="9" y1="15" x2="15" y2="15"/>
</svg>`

const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="3 6 5 6 21 6"/>
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
  <path d="M10 11v6M14 11v6"/>
  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
</svg>`

/**
 * Crée la barre d'actions FAB (PDF + suppression) fixée au-dessus de la navbar.
 * @param {string} id - Identifiant du menu
 * @param {string} [redirectAfterDelete='/history']
 * @returns {HTMLElement}
 */
export function makeFabBar (id, redirectAfterDelete = '/history') {
  const bar = document.createElement('div')
  bar.className = 'detail-fab-bar detail-fab-bar--bottom'

  const pdfBtn = document.createElement('button')
  pdfBtn.className = 'btn--fab btn--fab-pdf'
  pdfBtn.setAttribute('aria-label', 'Partager en PDF')
  pdfBtn.innerHTML = PDF_ICON
  pdfBtn.addEventListener('click', () => window.print())

  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'btn--fab btn--fab-delete'
  deleteBtn.setAttribute('aria-label', 'Supprimer ce menu')
  deleteBtn.innerHTML = TRASH_ICON
  deleteBtn.addEventListener('click', () => {
    if (!confirm('Supprimer ce menu définitivement ?')) return
    deleteMenus([id])
    navigate(redirectAfterDelete)
  })

  bar.appendChild(pdfBtn)
  bar.appendChild(deleteBtn)
  return bar
}
