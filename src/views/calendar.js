import { getAllMenus, saveMenu } from '../storage.js'
import { fmtWeekLabel } from '../utils.js'
import { setActiveNav } from '../components/navbar.js'
import { buildDayGrid, createMoveState } from '../components/day-slots.js'
import { makeFabBar } from '../components/fab-bar.js'

let currentMenuIdx = 0
let state = createMoveState()

export function renderCalendar (container) {
  setActiveNav('/calendar')
  container.innerHTML = ''

  const menus = getAllMenus()

  const header = document.createElement('div')
  header.className = 'view-header'

  if (!menus.length) {
    const title = document.createElement('h1')
    title.className = 'view-header__title'
    title.style.textAlign = 'left'
    title.textContent = 'Semaine'
    header.appendChild(title)
    container.appendChild(header)

    const empty = document.createElement('div')
    empty.className = 'empty-state'
    empty.innerHTML = `
      <span class="empty-state__icon">🍽️</span>
      <span class="empty-state__title">Aucun menu enregistré</span>
      <span class="empty-state__body">Créez votre premier menu avec le bouton +</span>
    `
    container.appendChild(empty)
    return
  }

  if (currentMenuIdx >= menus.length) currentMenuIdx = 0
  const menu = menus[currentMenuIdx]

  // Réinitialise le move state si on change de menu
  state = createMoveState()

  const prevBtn = document.createElement('button')
  prevBtn.className = 'btn btn--icon'
  prevBtn.setAttribute('aria-label', 'Menu précédent')
  prevBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>`
  prevBtn.disabled = currentMenuIdx >= menus.length - 1
  prevBtn.addEventListener('click', () => { currentMenuIdx++; renderCalendar(container) })

  const label = document.createElement('span')
  label.className = 'view-header__title'
  label.textContent = fmtWeekLabel(menu.startDate, menu.endDate)

  const nextBtn = document.createElement('button')
  nextBtn.className = 'btn btn--icon'
  nextBtn.setAttribute('aria-label', 'Menu suivant')
  nextBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`
  nextBtn.disabled = currentMenuIdx <= 0
  nextBtn.addEventListener('click', () => { currentMenuIdx--; renderCalendar(container) })

  header.appendChild(prevBtn)
  header.appendChild(label)
  header.appendChild(nextBtn)
  container.appendChild(header)

  const gridContainer = document.createElement('div')
  container.appendChild(gridContainer)

  function rerender () {
    saveMenu(menu)
    gridContainer.innerHTML = ''
    gridContainer.appendChild(buildDayGrid({ menu, state, dragScope: gridContainer, rerender }))
  }

  gridContainer.appendChild(buildDayGrid({ menu, state, dragScope: gridContainer, rerender }))

  container.appendChild(makeFabBar(menu.id, '/calendar'))

  const spacer = document.createElement('div')
  spacer.style.height = '62px'
  container.appendChild(spacer)
}
