import { getAllMenus, deleteMenus, countMeals } from '../storage.js'
import { fmtWeekLabel } from '../utils.js'
import { navigate } from '../router.js'
import { setActiveNav } from '../components/navbar.js'

/**
 * Affiche la liste de tous les menus enregistrés.
 * @param {HTMLElement} container
 */
export function renderHistory (container) {
  setActiveNav('/history')
  container.innerHTML = ''

  const menus = getAllMenus()

  // ── En-tête ──────────────────────────────────────────────────────────────

  const header = document.createElement('div')
  header.className = 'view-header'
  const title = document.createElement('h1')
  title.className = 'view-header__title'
  title.style.textAlign = 'left'
  title.textContent = 'Historique'
  header.appendChild(title)
  container.appendChild(header)

  // ── Bouton tout sélectionner (toujours visible s'il y a des menus) ─────────

  const toggleAllBtn = document.createElement('button')
  toggleAllBtn.className = 'btn btn--ghost history-toolbar__toggle-all'
  toggleAllBtn.textContent = 'Tout sélectionner'

  // ── État vide ─────────────────────────────────────────────────────────────

  if (!menus.length) {
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

  // ── Barre de sélection (masquée par défaut) ───────────────────────────────

  /** @type {Set<string>} */
  const selected = new Set()
  /** @type {HTMLInputElement[]} */
  const checkboxes = []

  toggleAllBtn.addEventListener('click', () => {
    const allChecked = selected.size === menus.length
    checkboxes.forEach(cb => {
      cb.checked = !allChecked
      if (!allChecked) selected.add(cb.dataset.id)
      else selected.delete(cb.dataset.id)
    })
    syncToolbar()
  })

  header.appendChild(toggleAllBtn)

  const toolbar = document.createElement('div')
  toolbar.className = 'history-toolbar'
  toolbar.hidden = true

  const selLabel = document.createElement('span')
  selLabel.className = 'history-toolbar__label'

  const delSelBtn = document.createElement('button')
  delSelBtn.className = 'btn btn--icon btn--icon-danger'
  delSelBtn.setAttribute('aria-label', 'Supprimer la sélection')
  delSelBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>`

  toolbar.appendChild(selLabel)
  toolbar.appendChild(delSelBtn)

  function syncToolbar () {
    toolbar.hidden = selected.size === 0
    selLabel.textContent =
      `${selected.size} menu${selected.size > 1 ? 's' : ''} sélectionné${selected.size > 1 ? 's' : ''}`
    toggleAllBtn.textContent =
      selected.size === menus.length ? 'Désélectionner tout' : 'Tout sélectionner'
  }

  delSelBtn.addEventListener('click', () => {
    if (!confirm(`Supprimer ${selected.size} menu(s) ?`)) return
    deleteMenus(Array.from(selected))
    renderHistory(container)
  })

  container.appendChild(toolbar)

  // ── Liste des menus ────────────────────────────────────────────────────────

  const list = document.createElement('ul')
  list.className = 'history-list'

  menus.forEach(menu => {
    const meals = countMeals(menu)
    const item = document.createElement('li')
    item.className = 'history-item'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'history-item__checkbox'
    checkbox.dataset.id = menu.id
    checkbox.setAttribute('aria-label', `Sélectionner ${fmtWeekLabel(menu.startDate, menu.endDate)}`)
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selected.add(menu.id)
      else selected.delete(menu.id)
      syncToolbar()
    })
    checkboxes.push(checkbox)

    const infoBtn = document.createElement('button')
    infoBtn.className = 'history-item__info'
    infoBtn.innerHTML = `
      <span class="history-item__title">${fmtWeekLabel(menu.startDate, menu.endDate)}</span>
      <span class="history-item__meta">${meals} repas renseigné${meals > 1 ? 's' : ''}</span>
    `
    infoBtn.addEventListener('click', () => navigate(`/menu/${menu.id}`))

    const chevron = document.createElement('span')
    chevron.className = 'history-item__chevron'
    chevron.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`

    item.appendChild(checkbox)
    item.appendChild(infoBtn)
    item.appendChild(chevron)
    list.appendChild(item)
  })

  container.appendChild(list)
}
