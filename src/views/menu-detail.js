import { getMenuById, saveMenu } from '../storage.js'
import { fmtWeekLabel } from '../utils.js'
import { navigate } from '../router.js'
import { setActiveNav } from '../components/navbar.js'
import { buildDayGrid, createMoveState } from '../components/day-slots.js'
import { makeFabBar } from '../components/fab-bar.js'

/**
 * Affiche le détail d'un menu.
 * @param {HTMLElement} container
 * @param {string} id
 */
export function renderMenuDetail (container, id) {
  setActiveNav('/history')

  const menu = getMenuById(id)
  if (!menu) { navigate('/history'); return }

  container.innerHTML = ''

  // ── En-tête d'impression ──────────────────────────────────────────────────

  const printHeader = document.createElement('div')
  printHeader.className = 'print-header'
  printHeader.innerHTML = `
    <span class="print-header__logo">🍽️</span>
    <span class="print-header__title">BonApp</span>
    <span class="print-header__week">${fmtWeekLabel(menu.startDate, menu.endDate)}</span>
  `
  container.appendChild(printHeader)

  // ── En-tête écran ─────────────────────────────────────────────────────────

  const header = document.createElement('div')
  header.className = 'view-header'

  const backBtn = document.createElement('button')
  backBtn.className = 'btn btn--icon'
  backBtn.setAttribute('aria-label', "Retour à l'historique")
  backBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>`
  backBtn.addEventListener('click', () => navigate('/history'))

  const titleEl = document.createElement('span')
  titleEl.className = 'view-header__title'
  titleEl.style.fontSize = '13px'
  titleEl.textContent = fmtWeekLabel(menu.startDate, menu.endDate)

  header.appendChild(backBtn)
  header.appendChild(titleEl)
  container.appendChild(header)

  // ── Grille des jours ──────────────────────────────────────────────────────

  const state = createMoveState()
  const gridContainer = document.createElement('div')

  function rerender () {
    saveMenu(menu)
    gridContainer.innerHTML = ''
    gridContainer.appendChild(buildDayGrid({ menu, state, dragScope: gridContainer, rerender }))
  }

  gridContainer.appendChild(buildDayGrid({ menu, state, dragScope: gridContainer, rerender }))
  container.appendChild(gridContainer)

  // ── Barre d'actions fixe (bas, collée à la navbar) ────────────────────────

  container.appendChild(makeFabBar(id))

  const spacer = document.createElement('div')
  spacer.style.height = '62px'
  container.appendChild(spacer)
}
