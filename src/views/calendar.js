import { getAllMenus, saveMenu, getAllRecipeNames } from '../storage.js'
import { toISO, fmtShort, fmtWeekLabel } from '../utils.js'
import { openRecipeModal } from '../components/modal.js'
import { setActiveNav } from '../components/navbar.js'

/** Index du menu affiché (0 = le plus récent). */
let currentMenuIdx = 0

/**
 * Affiche la vue Semaine : dernier menu enregistré avec navigation entre menus.
 * @param {HTMLElement} container
 */
export function renderCalendar (container) {
  setActiveNav('/calendar')
  container.innerHTML = ''

  const menus = getAllMenus()

  // ── En-tête ───────────────────────────────────────────────────────────────

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

  // ── Grille des jours (éditable, auto-sauvegarde) ──────────────────────────

  const grid = document.createElement('div')
  grid.className = 'calendar'
  const todayISO = toISO(new Date())

  menu.days.forEach((day, dayIdx) => {
    const dayEl = document.createElement('div')
    dayEl.className = 'calendar__day'

    const dateEl = document.createElement('div')
    dateEl.className = `calendar__date${day.date === todayISO ? ' calendar__date--today' : ''}`
    dateEl.textContent = fmtShort(day.date)

    const slotsEl = document.createElement('div')
    slotsEl.className = 'calendar__slots'

    ;/** @type {Array<{key: 'midi'|'soir', icon: string, label: string}>} */([
      { key: 'midi', icon: '☀️', label: 'Midi' },
      { key: 'soir', icon: '🌙', label: 'Soir' }
    ]).forEach(({ key, icon, label }) => {
      const meal = day[key]
      const slot = document.createElement('div')
      slot.className = `calendar__slot${meal ? ' calendar__slot--filled' : ''}`
      slot.setAttribute('role', 'button')
      slot.setAttribute('tabindex', '0')

      slot.innerHTML = `
        <span class="calendar__slot-icon">${icon}</span>
        <span class="calendar__slot-label">${label}</span>
        <span class="calendar__slot-recipe">${meal?.recipe ?? '+ Ajouter'}</span>
      `

      function openSlotModal () {
        openRecipeModal({
          title: `${fmtShort(day.date)} — ${label}`,
          initialValue: meal?.recipe ?? '',
          suggestions: getAllRecipeNames(),
          showDelete: !!meal,
          onDelete: () => {
            menu.days[dayIdx][key] = null
            saveMenu(menu)
            renderCalendar(container)
          },
          onConfirm: value => {
            menu.days[dayIdx][key] = { recipe: value }
            saveMenu(menu)
            renderCalendar(container)
          }
        })
      }

      slot.addEventListener('click', openSlotModal)
      slot.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSlotModal() }
      })

      slotsEl.appendChild(slot)
    })

    dayEl.appendChild(dateEl)
    dayEl.appendChild(slotsEl)
    grid.appendChild(dayEl)
  })

  container.appendChild(grid)
}
